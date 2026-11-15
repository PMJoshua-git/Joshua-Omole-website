import { appendUtmParams } from '../../../utils/attribution';

export const REPORT_EMAIL_SUBJECT = 'Your Clarity Map is ready';
export const REPORT_EMAIL_PREHEADER =
  'Your full report, plus the first quick win to try this week.';

export const REPORT_AUDIT_URL = appendUtmParams('https://joshuaomole.com/audit', {
  utm_source: 'email',
  utm_medium: 'report',
  utm_campaign: 'clarity_map_report',
});

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Cleans visitor-supplied first name:
 * - removes control characters & newlines (prevents header/markup injection)
 * - collapses repeated whitespace and trims
 * - caps length at 60 characters
 */
export function cleanFirstName(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return '';
  const withoutControls = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  const collapsed = withoutControls.replace(/\s+/g, ' ').trim();
  if (!collapsed) return '';
  return collapsed.slice(0, 60).trim();
}

export function cleanProcessName(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return 'workflow';
  const withoutControls = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  const collapsed = withoutControls.replace(/\s+/g, ' ').trim();
  return collapsed || 'workflow';
}

/**
 * Produces clean lowercase hyphenated attachment filename:
 * Clarity-Map-{process-slug}.pdf
 */
export function makeReportAttachmentFilename(processName: string): string {
  const cleaned = cleanProcessName(processName);
  const slug = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64);
  return `Clarity-Map-${slug || 'workflow'}.pdf`;
}

export interface ClarityMapReportEmailContent {
  subject: string;
  preheader: string;
  greeting: string;
  cleanedFirstName: string;
  cleanedProcessName: string;
  auditUrl: string;
  html: string;
  text: string;
}

const PREHEADER_PADDING = '&#847;&zwnj;&nbsp;'.repeat(100);

export function buildClarityMapReportEmail(opts: {
  firstName?: string | null;
  processName: string;
}): ClarityMapReportEmailContent {
  const cleanedFirst = cleanFirstName(opts.firstName);
  const cleanedProcess = cleanProcessName(opts.processName);
  const greeting = cleanedFirst ? `Hi ${cleanedFirst},` : 'Hi there,';

  const safeGreeting = escapeHtml(greeting);
  const safeProcess = escapeHtml(cleanedProcess);
  const safeSubject = escapeHtml(REPORT_EMAIL_SUBJECT);
  const safePreheader = escapeHtml(REPORT_EMAIL_PREHEADER);
  const safeAuditUrl = escapeHtml(REPORT_AUDIT_URL);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="margin:0; padding:0; background-color:#EEF4EF; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#202A24; font-size:16px; line-height:1.6;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; opacity:0; color:#EEF4EF;">${safePreheader}${PREHEADER_PADDING}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEF4EF; width:100%;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:#FBFAF7; border:1px solid #C5D4C7; border-radius:12px;">
          <tr>
            <td style="padding:36px 32px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#202A24; font-size:16px; line-height:1.6;">
              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#202A24;">
                ${safeGreeting}
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#202A24;">
                Thanks for running your ${safeProcess} process through the Clarity Map. Your full report is attached as a PDF.
              </p>
              <p style="margin:0 0 12px 0; font-size:16px; line-height:1.6; color:#202A24;">
                Here's what you'll find inside:
              </p>
              <ul style="margin:0 0 20px 0; padding-left:22px; font-size:16px; line-height:1.6; color:#202A24;">
                <li style="margin-bottom:8px;">Your process as it runs today</li>
                <li style="margin-bottom:8px;">The same process improved, with no new software needed</li>
                <li style="margin-bottom:8px;">Where automation helps, and where it isn't worth it yet</li>
                <li style="margin-bottom:0;">Your top three bottlenecks, quick wins you can start this week, and a simple 4-week plan</li>
              </ul>
              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#202A24;">
                If you only have five minutes, read the first page for your summary and bottlenecks, then jump to the quick wins near the end. Most of the early gains come from small fixes like a standard template, a clear owner for each step, and one place to log things. You don't need new tools for any of that.
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; line-height:1.6; color:#202A24;">
                One thing to keep in mind: the map is built from your answers, so think of it as a strong first picture, not the full story. If something doesn't look right, that usually points to a spot worth a closer look.
              </p>
              <p style="margin:0 0 22px 0; font-size:16px; line-height:1.6; color:#202A24;">
                If you'd like to go through it together, I offer a free 30-minute Systems Clarity Audit. We'll check the map against how your business really runs and pick the first three things to fix. No pitch. No obligation. Just an honest look at your operations.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px 0;">
                <tr>
                  <td align="center" bgcolor="#55745C" style="background-color:#55745C; border-radius:8px;">
                    <a href="${safeAuditUrl}" style="display:inline-block; min-height:44px; line-height:20px; padding:14px 24px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size:16px; font-weight:700; color:#FFFFFF; background-color:#55745C; text-decoration:none; border-radius:8px; box-sizing:border-box;">
                      Book your free audit
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px 0; font-size:13px; line-height:1.5; color:#4A6350; word-break:break-all;">
                Or use this link: <a href="${safeAuditUrl}" style="color:#4A6350; text-decoration:underline;">${safeAuditUrl}</a>
              </p>
              <p style="margin:0 0 22px 0; font-size:16px; line-height:1.6; color:#202A24;">
                And if you'd rather try the first quick win on your own, go for it. I'd love to hear how it goes, so just reply to this email.
              </p>
              <p style="margin:0; font-size:16px; line-height:1.6; color:#202A24;">
                Warm regards,<br>
                Joshua Omole<br>
                <a href="https://joshuaomole.com" style="color:#4A6350; text-decoration:none;">joshuaomole.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const wrapParagraph = (paragraph: string, maxWidth = 76): string => {
    const words = paragraph.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= maxWidth) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.join('\n');
  };

  const text = [
    greeting,
    '',
    wrapParagraph(
      `Thanks for running your ${cleanedProcess} process through the Clarity Map. Your full report is attached as a PDF.`
    ),
    '',
    "Here's what you'll find inside:",
    '',
    '- Your process as it runs today',
    '- The same process improved, with no new software needed',
    "- Where automation helps, and where it isn't worth it yet",
    '- Your top three bottlenecks, quick wins you can start this week, and a simple 4-week plan',
    '',
    wrapParagraph(
      "If you only have five minutes, read the first page for your summary and bottlenecks, then jump to the quick wins near the end. Most of the early gains come from small fixes like a standard template, a clear owner for each step, and one place to log things. You don't need new tools for any of that."
    ),
    '',
    wrapParagraph(
      "One thing to keep in mind: the map is built from your answers, so think of it as a strong first picture, not the full story. If something doesn't look right, that usually points to a spot worth a closer look."
    ),
    '',
    wrapParagraph(
      "If you'd like to go through it together, I offer a free 30-minute Systems Clarity Audit. We'll check the map against how your business really runs and pick the first three things to fix. No pitch. No obligation. Just an honest look at your operations."
    ),
    '',
    `Book your free audit: ${REPORT_AUDIT_URL}`,
    '',
    wrapParagraph(
      "And if you'd rather try the first quick win on your own, go for it. I'd love to hear how it goes, so just reply to this email."
    ),
    '',
    'Warm regards,',
    'Joshua Omole',
    'joshuaomole.com',
  ].join('\n');

  return {
    subject: REPORT_EMAIL_SUBJECT,
    preheader: REPORT_EMAIL_PREHEADER,
    greeting,
    cleanedFirstName: cleanedFirst,
    cleanedProcessName: cleanedProcess,
    auditUrl: REPORT_AUDIT_URL,
    html,
    text,
  };
}
