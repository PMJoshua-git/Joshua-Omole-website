import {
  questionnaireSubmissionSchema,
  reportRequestSchema,
  sanitizeSubmission,
} from '../../features/clarity-map/schemas/questionnaire.schema.js';
import {
  validateClarityMapAnalysis,
} from '../../features/clarity-map/schemas/analysis-result.schema.js';
import {
  analyzeWorkflowWithGemini,
  GeminiAnalysisError,
  GeminiConfigurationError,
} from './ai/geminiAnalyzer.js';
import { generateClarityMapPdf } from './reports/generatePdf.js';
import {
  sendClarityMapReportEmails,
  EmailConfigurationError,
  EmailDeliveryError,
} from './email/sendReport.js';
import {
  cleanFirstName,
  makeReportAttachmentFilename,
} from './email/reportEmailTemplate.js';
import {
  LoopsConfigurationError,
  LoopsSyncError,
  syncClarityMapContactToLoops,
} from './crm/loopsSync.js';
import {
  defaultClarityMapRateLimiter,
  type RateLimitReservation,
  type RateLimitStatusResult,
} from './rateLimit/limiter.js';
import {
  createClarityMapReportGuard,
  defaultReportGuard,
  deriveResultId,
  maskEmailForLog,
  REPORT_LIMIT_MESSAGE,
} from './rateLimit/reportGuard.js';
import type { RateLimitRequestLike } from './rateLimit/ip.js';

export interface HttpRequestLike extends RateLimitRequestLike {
  method?: string;
  body?: any;
  app?: { get?: (key: string) => unknown };
  on?: (event: string, listener: (...args: any[]) => void) => any;
}

export interface HttpResponseLike {
  status(code: number): HttpResponseLike;
  json(payload: unknown): any;
  setHeader(name: string, value: string): any;
  end?(chunk?: any): any;
  write?(chunk: any): boolean;
  flushHeaders?(): void;
  on?(event: string, listener: (...args: any[]) => void): any;
  statusCode?: number;
  headersSent?: boolean;
  writableEnded?: boolean;
  destroyed?: boolean;
}

export interface ClarityMapHandlerDeps {
  limiter?: {
    checkLimitStatus(
      req: RateLimitRequestLike,
      options?: { trustProxy?: boolean }
    ): Promise<RateLimitStatusResult>;
    reserveGenerationSlot(
      req: RateLimitRequestLike,
      options?: { trustProxy?: boolean }
    ): Promise<RateLimitReservation>;
    releaseGenerationSlot(
      token: RateLimitReservation['reservationToken']
    ): Promise<void>;
  };
  analyzer?: typeof analyzeWorkflowWithGemini;
  trustProxy?: boolean;
  keepAliveIntervalMs?: number;
}

export interface ClarityMapReportDeps {
  reportGuard?: ReturnType<typeof createClarityMapReportGuard>;
  pdfGenerator?: typeof generateClarityMapPdf;
  loopsSync?: typeof syncClarityMapContactToLoops;
  emailSender?: typeof sendClarityMapReportEmails;
  logger?: Pick<Console, 'log' | 'info' | 'warn' | 'error'>;
}

function resolveTrustProxy(req: HttpRequestLike, explicit?: boolean): boolean {
  if (typeof explicit === 'boolean') return explicit;
  if (req.app && typeof req.app.get === 'function') {
    const expressTrustProxy = req.app.get('trust proxy');
    if (expressTrustProxy) return true;
  }
  return Boolean(
    process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL_URL ||
      process.env.TRUST_PROXY === 'true'
  );
}

function parseRequestBody(body: any): any {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body ?? {};
}

function applyHeaders(
  res: HttpResponseLike,
  headers: Record<string, string>
): void {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

export function makePdfFilename(processName: string, processCode: string): string {
  const safeSlug = processName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  const safeCode = processCode.toLowerCase().replace(/[^a-z0-9-]+/g, '');
  return `clarity-map-${safeCode || 'report'}-${safeSlug || 'workflow'}.pdf`;
}

export async function handleLimitStatusRequest(
  req: HttpRequestLike,
  res: HttpResponseLike,
  deps: ClarityMapHandlerDeps = {}
) {
  const limiter = deps.limiter ?? defaultClarityMapRateLimiter;
  const trustProxy = resolveTrustProxy(req, deps.trustProxy);

  try {
    const status = await limiter.checkLimitStatus(req, { trustProxy });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      limit: status.limit,
      remaining: status.remaining,
      reset_at: status.reset_at,
      limited: status.limited,
    });
  } catch (err: any) {
    console.error('[ClarityMap /limit-status] Unexpected error:', err?.message || err);
    return res.status(200).json({
      limit: 2,
      remaining: 2,
      reset_at: null,
      limited: false,
    });
  }
}

export async function handleAnalyzeRequest(
  req: HttpRequestLike,
  res: HttpResponseLike,
  deps: ClarityMapHandlerDeps = {}
) {
  const startedAt = Date.now();
  const body = parseRequestBody(req.body);
  const parsed = questionnaireSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    console.warn('[ClarityMap /analyze] Validation failed on submission:', {
      issues: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 6),
    });
    return res.status(400).json({
      error: 'Please review your answers and ensure required steps are filled in.',
      details: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
  }

  const limiter = deps.limiter ?? defaultClarityMapRateLimiter;
  const analyzer = deps.analyzer ?? analyzeWorkflowWithGemini;
  const trustProxy = resolveTrustProxy(req, deps.trustProxy);

  let reservation: RateLimitReservation;
  try {
    reservation = await limiter.reserveGenerationSlot(req, { trustProxy });
  } catch (rateErr: any) {
    console.error('[ClarityMap /analyze] Rate limiter threw unexpectedly:', rateErr?.message || rateErr);
    return res.status(500).json({
      error: 'An unexpected error occurred while preparing your workflow analysis. Please try again.',
    });
  }

  applyHeaders(res, reservation.headers);

  if (!reservation.allowed) {
    if (reservation.reason === 'high_demand') {
      return res.status(503).json({
        error: 'high_demand',
      });
    }
    return res.status(429).json({
      error: 'rate_limited',
      limit: reservation.limit,
      remaining: 0,
      reset_at: reservation.reset_at,
      retry_after_seconds: reservation.retry_after_seconds,
    });
  }

  const { sanitized, redactedPII } = sanitizeSubmission(parsed.data);
  console.info('[ClarityMap /analyze] Starting analysis:', {
    processCode: sanitized.process_code,
    industryId: sanitized.industry_id,
    answerCount: sanitized.answers.length,
    rateLimitMs: Date.now() - startedAt,
    usedRedisFallback: reservation.reservationToken?.usedFallback ?? false,
  });

  const canStreamKeepAlive =
    typeof res.write === 'function' && typeof res.end === 'function';
  let streamStarted = false;
  let clientDisconnected = false;
  let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  const stopKeepAlive = () => {
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  };

  if (canStreamKeepAlive) {
    const markDisconnected = () => {
      clientDisconnected = true;
      stopKeepAlive();
    };
    res.on?.('close', () => {
      if (!res.writableEnded) {
        markDisconnected();
      }
    });
    req.on?.('aborted', markDisconnected);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.statusCode = 200;
    res.flushHeaders?.();
    streamStarted = true;

    const writeKeepAliveByte = () => {
      if (clientDisconnected || res.writableEnded || res.destroyed) {
        stopKeepAlive();
        return;
      }
      try {
        res.write?.(' \n');
      } catch {
        stopKeepAlive();
      }
    };

    writeKeepAliveByte();
    const intervalMs = Math.max(10, deps.keepAliveIntervalMs ?? 4000);
    keepAliveTimer = setInterval(writeKeepAliveByte, intervalMs);
    (keepAliveTimer as any)?.unref?.();
  }

  try {
    const analysis = await analyzer(sanitized, redactedPII);
    stopKeepAlive();
    console.info('[ClarityMap /analyze] Analysis succeeded:', {
      processCode: sanitized.process_code,
      totalMs: Date.now() - startedAt,
      readiness: analysis.readiness?.score_percent,
    });

    const successBody = {
      ok: true,
      analysis,
      redactedPII,
      rate_limit: {
        limit: reservation.limit,
        remaining: reservation.remaining,
        reset_at: reservation.reset_at,
      },
    };

    if (streamStarted) {
      if (!res.writableEnded && !res.destroyed) {
        res.end!(JSON.stringify(successBody));
      }
      return res;
    }

    return res.status(200).json(successBody);
  } catch (err: any) {
    stopKeepAlive();
    // Refund reserved slot on any AI, validation, or server error
    await limiter.releaseGenerationSlot(reservation.reservationToken);
    const totalMs = Date.now() - startedAt;

    let errorStatusCode = 500;
    let errorMessage =
      'An unexpected error occurred while analyzing your workflow. Please try again.';

    if (err instanceof GeminiConfigurationError) {
      errorStatusCode = 503;
      errorMessage = 'Clarity Map analysis is temporarily unavailable on the server.';
      console.error('[ClarityMap /analyze] Configuration error:', {
        processCode: sanitized.process_code,
        statusCode: 503,
        totalMs,
        message: String(err.message || '').slice(0, 200),
      });
    } else if (err instanceof GeminiAnalysisError) {
      errorStatusCode = err.statusCode;
      errorMessage = err.message;
      console.error('[ClarityMap /analyze] Gemini analysis error:', {
        processCode: sanitized.process_code,
        statusCode: err.statusCode,
        totalMs,
        message: String(err.message || '').slice(0, 200),
      });
    } else {
      console.error('[ClarityMap /analyze] Unexpected error:', {
        processCode: sanitized.process_code,
        totalMs,
        name: err?.name,
        message: String(err?.message || err || '').slice(0, 200),
      });
    }

    if (streamStarted) {
      if (!res.writableEnded && !res.destroyed) {
        res.end!(
          JSON.stringify({
            ok: false,
            statusCode: errorStatusCode,
            error: errorMessage,
          })
        );
      }
      return res;
    }

    return res.status(errorStatusCode).json({
      error: errorMessage,
    });
  }
}

export async function handleReportRequest(
  req: HttpRequestLike,
  res: HttpResponseLike,
  deps: ClarityMapReportDeps = {}
) {
  const body = parseRequestBody(req.body);
  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return res.status(400).json({
      error:
        parsed.error.issues[0]?.message ||
        'Please enter your first name and a valid email address.',
    });
  }

  const {
    firstName: rawFirstName,
    email,
    analysis: rawAnalysis,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    landingPage,
    leadSource,
    leadStatus,
    leadType,
  } = parsed.data;
  const validated = validateClarityMapAnalysis(rawAnalysis);
  if (!validated.valid || !validated.data) {
    return res.status(400).json({
      error: 'The workflow analysis payload is incomplete. Please re-run the analysis first.',
    });
  }

  const result = validated.data;
  const cleanedFirstName = cleanFirstName(rawFirstName) || rawFirstName.trim().slice(0, 60);
  const resultId = deriveResultId(
    result,
    typeof body.resultId === 'string' ? body.resultId : undefined
  );
  const fileName = makeReportAttachmentFilename(result.meta.process_name);

  const reportGuard = deps.reportGuard ?? defaultReportGuard;
  const pdfGenerator = deps.pdfGenerator ?? generateClarityMapPdf;
  const loopsSync = deps.loopsSync ?? syncClarityMapContactToLoops;
  const emailSender = deps.emailSender ?? sendClarityMapReportEmails;
  const logger = deps.logger ?? console;
  const maskedRecipient = maskEmailForLog(email);

  // Enforce per-result (max 3) and per-recipient-24h (max 3) safeguards + 5-min double-submit dedupe
  // Separate from generator IP rate limits (0 generation slots consumed).
  const reservation = await reportGuard.checkAndReserveSend({
    resultId,
    normalizedEmail: email,
  });

  if (reservation.deduped) {
    return res.status(200).json({
      ok: true,
      emailSent: true,
      deduped: true,
      messageId: reservation.dedupedMessageId ?? null,
    });
  }

  if (!reservation.allowed) {
    return res.status(429).json({
      error: reservation.message || REPORT_LIMIT_MESSAGE,
      emailSent: false,
    });
  }

  // 1. Mandatory Loops contact creation (userGroup: "Claritymap")
  let loopsOutcome;
  try {
    loopsOutcome = await loopsSync({
      email,
      firstName: cleanedFirstName,
      result,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer,
      landingPage,
      leadSource,
      leadStatus,
      leadType,
    });
  } catch (err: any) {
    await reportGuard.releaseSendReservation(reservation.token);
    if (err instanceof LoopsConfigurationError) {
      return res.status(503).json({
        error: err.message,
        loopsSynced: false,
        emailSent: false,
      });
    }
    if (err instanceof LoopsSyncError) {
      return res.status(502).json({
        error: "We couldn't register your report request right now. Please try again shortly.",
        loopsSynced: false,
        emailSent: false,
      });
    }
    logger.error(
      `[ClarityMap /report] Loops error result_id=${resultId}: ${err?.message || 'unknown'}`
    );
    return res.status(502).json({
      error: 'Unable to process your report request right now. Please try again.',
      loopsSynced: false,
      emailSent: false,
    });
  }

  // 2. Generate PDF buffer on server (consumes 0 generation slots). Never send email if PDF fails.
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await pdfGenerator(result, { firstName: cleanedFirstName });
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('Generated PDF buffer is empty.');
    }
  } catch (err: any) {
    await reportGuard.releaseSendReservation(reservation.token);
    logger.error(
      `[ClarityMap /report] PDF generation failed result_id=${resultId} recipient=${maskedRecipient} reason="${err?.message || 'unknown'}"`
    );
    return res.status(500).json({
      error: 'We could not generate your PDF report right now. Please try again.',
      emailSent: false,
    });
  }

  // 3. Deliver PDF via Resend email (retry-once + idempotency + masked 1-line log inside emailSender)
  try {
    const emailOutcome = await emailSender({
      to: email,
      firstName: cleanedFirstName,
      result,
      pdfBuffer,
      fileName,
      resultId,
      idempotencyKey: reservation.idempotencyKey,
    });

    reportGuard.recordSendSuccess(reservation.token, emailOutcome.messageId ?? null);

    return res.status(200).json({
      ok: true,
      emailSent: emailOutcome.emailSent,
      internalSent: emailOutcome.internalSent,
      loopsSynced: loopsOutcome.synced,
      loopsAction: loopsOutcome.action,
      messageId: emailOutcome.messageId ?? null,
    });
  } catch (err: any) {
    await reportGuard.releaseSendReservation(reservation.token);
    if (err instanceof EmailConfigurationError) {
      return res.status(503).json({
        error: err.message,
        loopsSynced: loopsOutcome.synced,
        emailSent: false,
      });
    }
    if (err instanceof EmailDeliveryError) {
      return res.status(502).json({
        error: err.message,
        loopsSynced: loopsOutcome.synced,
        emailSent: false,
      });
    }
    logger.error(
      `[ClarityMap /report] Unexpected email error result_id=${resultId} recipient=${maskedRecipient}: ${err?.message || 'unknown'}`
    );
    return res.status(502).json({
      error:
        "We couldn't send your report just now. Please try again in a few minutes.",
      loopsSynced: loopsOutcome.synced,
      emailSent: false,
    });
  }
}
