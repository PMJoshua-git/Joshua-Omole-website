import { Resend } from 'resend';
import { ResourceEntry } from './registry.js';

// Initialize Resend client (will use RESEND_API_KEY from environment)
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] Warning: RESEND_API_KEY is not set in environment variables.');
  }
  return new Resend(apiKey || 're_placeholder');
};

// TODO: replace with Joshua's established resource email message.
export const EMAIL_MESSAGE = `Hi {{firstName}},

Thank you for requesting {{resourceTitle}}.

Your copy is attached to this email so you can put it to work immediately.

If you have any questions about applying these frameworks to your operations, feel free to reply directly to this email.

Best regards,
Joshua Omole
Business Operations & Systems Strategist
hello@joshuaomole.com | https://joshuaomole.com`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderHtml(firstName: string, resource: ResourceEntry): string {
  const safeName = escapeHtml(firstName || 'there');
  const safeTitle = escapeHtml(resource.title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your copy of ${safeTitle}</title>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #EEF4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202A24;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #DCE6DD; border-radius: 12px; padding: 36px 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <tr>
            <td>
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #55745C; margin-bottom: 12px;">
                Joshua Omole · Resources
              </div>
              <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 700; color: #202A24; line-height: 1.3;">
                Your copy of ${safeTitle}
              </h1>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #202A24;">
                Hi ${safeName},
              </p>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; color: #202A24;">
                Thank you for requesting <strong>${safeTitle}</strong>. Your copy has been attached to this email.
              </p>
              <div style="background-color: #EEF4EF; border-left: 3px solid #55745C; padding: 14px 16px; border-radius: 4px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #202A24;">
                  <strong>Attachment:</strong> ${escapeHtml(resource.fileName)} (${escapeHtml(resource.format)})
                </p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; color: #202A24;">
                If you have any questions about applying these frameworks or identifying bottlenecks in your current operations, feel free to reply directly to this email.
              </p>
              <div style="border-top: 1px solid #DCE6DD; padding-top: 20px; margin-top: 24px;">
                <p style="font-size: 15px; font-weight: 600; margin: 0 0 4px 0; color: #202A24;">
                  Joshua Omole
                </p>
                <p style="font-size: 13px; margin: 0; color: #667069; line-height: 1.4;">
                  Business Operations &amp; Systems Strategist<br>
                  <a href="https://joshuaomole.com" style="color: #55745C; text-decoration: none;">joshuaomole.com</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(firstName: string, resource: ResourceEntry): string {
  const name = firstName || 'there';
  return EMAIL_MESSAGE
    .replace(/\{\{firstName\}\}/g, name)
    .replace(/\{\{resourceTitle\}\}/g, resource.title);
}

export async function sendResourceEmail(opts: {
  to: string;
  firstName: string;
  resource: ResourceEntry;
  file: Buffer;
}) {
  const resend = getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Joshua Omole <hello@joshuaomole.com>';
  const replyTo = process.env.RESEND_REPLY_TO || 'hello@joshuaomole.com';

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: opts.to,
    replyTo: replyTo,
    subject: opts.resource.emailSubject ?? `Your copy of ${opts.resource.title}`,
    html: renderHtml(opts.firstName, opts.resource),
    text: renderText(opts.firstName, opts.resource),
    attachments: [
      {
        filename: opts.resource.fileName,
        content: opts.file,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
