import { Resend, type CreateEmailOptions, type CreateEmailRequestOptions, type CreateEmailResponse } from 'resend';
import type { ClarityMapResult } from '../../../features/clarity-map/types/clarityMap.js';
import {
  buildClarityMapReportEmail,
  cleanFirstName,
  cleanProcessName,
} from './reportEmailTemplate.js';
import { maskEmailForLog } from '../rateLimit/reportGuard.js';

const INTERNAL_LEAD_EMAIL = 'Joshua@mail.joshuaomole.com';

export const DEFAULT_RESEND_FROM_EMAIL = 'Joshua Omole <hello@joshuaomole.com>';
export const DEFAULT_RESEND_REPLY_TO = 'hello@joshuaomole.com';
export const DEFAULT_RETRY_DELAY_MS = 2000;

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailConfigurationError';
  }
}

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export interface ResendClientLike {
  emails: {
    send(
      payload: CreateEmailOptions,
      options?: CreateEmailRequestOptions
    ): Promise<CreateEmailResponse>;
  };
}

export interface EmailLogger {
  info?: (line: string) => void;
  log?: (line: string) => void;
  error?: (line: string) => void;
}

export function getResendEmailSettings(): {
  fromEmail: string;
  replyTo: string;
} {
  const rawFrom = process.env.RESEND_FROM_EMAIL || DEFAULT_RESEND_FROM_EMAIL;
  const rawReplyTo = process.env.RESEND_REPLY_TO || DEFAULT_RESEND_REPLY_TO;
  return {
    fromEmail: rawFrom.replace(/[\r\n]+/g, ' ').trim() || DEFAULT_RESEND_FROM_EMAIL,
    replyTo: rawReplyTo.replace(/[\r\n]+/g, ' ').trim() || DEFAULT_RESEND_REPLY_TO,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getResendClient(): ResendClientLike {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new EmailConfigurationError(
      'Email delivery is not configured yet (RESEND_API_KEY is missing).'
    );
  }
  return new Resend(apiKey);
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeErrorReason(rawMessage: string, sensitiveEmail: string): string {
  const stripped = rawMessage.replace(/[\r\n]+/g, ' ').trim();
  if (!sensitiveEmail) return stripped;
  const escaped = sensitiveEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return stripped.replace(new RegExp(escaped, 'gi'), maskEmailForLog(sensitiveEmail));
}

function buildInternalNotificationHtml(opts: {
  firstName: string;
  email: string;
  result: ClarityMapResult;
}): string {
  const { firstName, email, result } = opts;
  const bottlenecksList = (result.bottlenecks || [])
    .map(
      (b) =>
        `<li><strong>${escapeHtml(b.title || '')}</strong> [BRIDGE ${escapeHtml(
          b.bridge_letter || ''
        )}]: ${escapeHtml(b.why_it_matters || '')}</li>`
    )
    .join('');

  const topLetter = result.crm_tags?.top_bottleneck_bridge_letter || 'N/A';
  const volumeBand = result.crm_tags?.volume_band || 'N/A';

  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202A24; padding: 20px;">
  <h2 style="margin-top: 0; color: #55745C;">New Clarity Map Report Requested</h2>
  <table cellpadding="6" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 16px;">
    <tr><td><strong>First Name:</strong></td><td>${escapeHtml(firstName)}</td></tr>
    <tr><td><strong>Email:</strong></td><td>${escapeHtml(email)}</td></tr>
    <tr><td><strong>Industry:</strong></td><td>${escapeHtml(result.meta.industry)}</td></tr>
    <tr><td><strong>Process:</strong></td><td>${escapeHtml(result.meta.process_name)} (${escapeHtml(result.meta.process_code)})</td></tr>
    <tr><td><strong>Operational Readiness:</strong></td><td>${result.readiness?.score_percent ?? 0}% (${escapeHtml(result.readiness?.band || '')})</td></tr>
    <tr><td><strong>Top Bottleneck Lens:</strong></td><td>${escapeHtml(topLetter)}</td></tr>
    <tr><td><strong>Volume Band:</strong></td><td>${escapeHtml(volumeBand)}</td></tr>
  </table>
  <p><strong>Headline:</strong> ${escapeHtml(result.summary?.headline || '')}</p>
  <p><strong>Top Bottlenecks:</strong></p>
  <ul>${bottlenecksList}</ul>
  <p style="font-size: 13px; color: #5F6861;">The user's generated Clarity Map PDF report is attached.</p>
</body>
</html>`;
}

export interface SendClarityMapReportOptions {
  to: string;
  firstName: string;
  result: ClarityMapResult;
  pdfBuffer: Buffer;
  fileName: string;
  resultId?: string;
  idempotencyKey?: string;
  resendClient?: ResendClientLike;
  retryDelayMs?: number;
  logger?: EmailLogger;
}

export async function sendClarityMapReportEmails(
  opts: SendClarityMapReportOptions
): Promise<{ emailSent: boolean; internalSent: boolean; messageId: string | null }> {
  if (!opts.pdfBuffer || !Buffer.isBuffer(opts.pdfBuffer) || opts.pdfBuffer.length === 0) {
    throw new EmailDeliveryError(
      "We couldn't send your report just now. Please try again in a few minutes."
    );
  }

  const resend = opts.resendClient ?? getResendClient();
  const { fromEmail, replyTo } = getResendEmailSettings();
  const retryDelayMs = opts.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  const logger: EmailLogger = opts.logger ?? console;
  const logSuccess = logger.info ?? logger.log ?? console.log;
  const logError = logger.error ?? console.error;

  const resultId = opts.resultId || opts.result.meta.process_code || 'unknown';
  const maskedRecipient = maskEmailForLog(opts.to);

  const emailContent = buildClarityMapReportEmail({
    firstName: opts.firstName,
    processName: opts.result.meta.process_name,
  });

  const payload: CreateEmailOptions = {
    from: fromEmail,
    to: opts.to,
    replyTo,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    attachments: [
      {
        filename: opts.fileName,
        content: opts.pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  const requestOptions: CreateEmailRequestOptions | undefined = opts.idempotencyKey
    ? { idempotencyKey: opts.idempotencyKey }
    : undefined;

  async function attemptSend(): Promise<{
    ok: boolean;
    messageId: string | null;
    errorMessage?: string;
  }> {
    try {
      const response = await resend.emails.send(payload, requestOptions);
      if (response.error) {
        return {
          ok: false,
          messageId: null,
          errorMessage: response.error.message || 'Unknown Resend error',
        };
      }
      return {
        ok: true,
        messageId: response.data?.id ?? null,
      };
    } catch (err: any) {
      return {
        ok: false,
        messageId: null,
        errorMessage: err?.message || 'Resend transport failure',
      };
    }
  }

  // 1. Customer delivery (retry once on failure after short delay)
  let outcome = await attemptSend();
  if (!outcome.ok) {
    await sleep(retryDelayMs);
    outcome = await attemptSend();
  }

  if (!outcome.ok) {
    const safeReason = sanitizeErrorReason(
      outcome.errorMessage || 'Send failed',
      opts.to
    );
    logError(
      `[ClarityMap Email] result_id=${resultId} recipient=${maskedRecipient} status=failure message_id=none reason="${safeReason}"`
    );
    throw new EmailDeliveryError(
      "We couldn't send your report just now. Please try again in a few minutes."
    );
  }

  logSuccess(
    `[ClarityMap Email] result_id=${resultId} recipient=${maskedRecipient} status=success message_id=${outcome.messageId ?? 'unknown'}`
  );

  // 2. Separate internal lead copy to Joshua@mail.joshuaomole.com
  // Sent independently so customer never sees internal email address and internal failures never hide customer delivery.
  const safeInternalFirst = cleanFirstName(opts.firstName) || 'Visitor';
  const safeInternalProcess = cleanProcessName(opts.result.meta.process_name);

  let internalSent = false;
  try {
    const internalSend = await resend.emails.send({
      from: fromEmail,
      to: INTERNAL_LEAD_EMAIL,
      replyTo: opts.to,
      subject: `[Clarity Map] ${safeInternalFirst} — ${safeInternalProcess} (${opts.result.readiness.band})`,
      html: buildInternalNotificationHtml({
        firstName: safeInternalFirst,
        email: opts.to,
        result: opts.result,
      }),
      attachments: [
        {
          filename: opts.fileName,
          content: opts.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    if (internalSend.error) {
      logError(
        `[ClarityMap Email] Internal notification failed result_id=${resultId} reason="${sanitizeErrorReason(
          internalSend.error.message || 'error',
          opts.to
        )}"`
      );
    } else {
      internalSent = true;
    }
  } catch (err: any) {
    logError(
      `[ClarityMap Email] Internal notification failed result_id=${resultId} reason="${sanitizeErrorReason(
        err?.message || 'error',
        opts.to
      )}"`
    );
  }

  return {
    emailSent: true,
    internalSent,
    messageId: outcome.messageId,
  };
}
