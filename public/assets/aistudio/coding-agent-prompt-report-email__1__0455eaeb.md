# Coding Agent Prompt: Clarity Map Report Delivery Email (via Resend)

Paste everything below the line into your coding agent.

---

## 0. CONTEXT AND GROUND RULES

The Clarity Map site already collects an email address and a **first name** from visitors who choose "Get the full report", and Resend is already integrated on the site. Today the PDF report is sent automatically. Your job is to make that send use the **new email below** (subject, greeting, body) as an HTML + plain-text email with the PDF attached.

**Hard rules**
1. **Use the existing Resend infrastructure.** Find how the site already sends email through Resend (the client, the wrapper or helper, the sender address, the reply-to address) and reuse it. The Resend API key and the reply-to address already exist as environment variables. **Do not add new environment variables** unless it is truly unavoidable; if it is, stop and say exactly which and why.
2. **Inspect before editing.** In your first message, briefly report: where the report-sending code lives, how the Resend client and sender/reply-to are configured today (variable names and where they are read, not their values), how the PDF is produced and attached today, and where the first-name field arrives in the request.
3. Do not change: the PDF content or layout, the report generation, the generator rate limiting, the pop-up flow, or the visitor-facing steps. This task changes the email only, plus the small safeguards in section 5.
4. If the existing flow already adds the visitor to a CRM or mailing list (Loops, Airtable), keep that behaviour and make sure the first name is passed along in the same payload. Do not create new CRM logic.
5. **When you finish, report which email address the message is sent from** (the exact From address, including the display name), and which address is used as reply-to, and the names of the environment variables they came from. This is a required part of your final summary. Do not print API keys or secrets.

---

## 1. THE EMAIL

**Subject (exact):** `Your Clarity Map is ready`

**Preview text (preheader), exact:** `Your full report, plus the first quick win to try this week.`

This is the short line inbox apps show next to the subject. It is fixed text with no merge fields. Put it in the HTML version only (see section 2 for how); the plain-text version has no preview text.

**Merge fields**
- `{{first_name}}`: the first name the visitor typed.
- `{{process_name}}`: the process name from the stored result (for example "Property maintenance request"), taken from the result's `meta.process_name`.

**Greeting rules**
- If a first name exists: `Hi {{first_name}},`
- If it is empty after trimming: `Hi there,`

**Body copy (use this wording exactly; keep paragraph breaks and bullets)**

```
Hi {{first_name}},

Thanks for running your {{process_name}} process through the Clarity Map. Your full report is attached as a PDF.

Here's what you'll find inside:

• Your process as it runs today
• The same process improved, with no new software needed
• Where automation helps, and where it isn't worth it yet
• Your top three bottlenecks, quick wins you can start this week, and a simple 4-week plan

If you only have five minutes, read the first page for your summary and bottlenecks, then jump to the quick wins near the end. Most of the early gains come from small fixes like a standard template, a clear owner for each step, and one place to log things. You don't need new tools for any of that.

One thing to keep in mind: the map is built from your answers, so think of it as a strong first picture, not the full story. If something doesn't look right, that usually points to a spot worth a closer look.

If you'd like to go through it together, I offer a free 30-minute Systems Clarity Audit. We'll check the map against how your business really runs and pick the first three things to fix. No pitch. No obligation. Just an honest look at your operations.

[Button: Book your free audit]  ->  https://joshuaomole.com/audit

And if you'd rather try the first quick win on your own, go for it. I'd love to hear how it goes, so just reply to this email.

Warm regards,
Joshua Omole
joshuaomole.com
```

**Link:** the audit link goes to `https://joshuaomole.com/audit`. Use the site's existing UTM approach for the link where one exists and add `utm_source=email`, `utm_medium=report`, `utm_campaign=clarity_map_report`. In the plain-text version, show the full URL as text.

---

## 2. HTML AND PLAIN-TEXT VERSIONS

Send **both** an HTML version and a plain-text version in the same message (Resend supports `html` and `text`).

**HTML design**
- Single column, maximum width 600px, centred, mobile-friendly, with all CSS inline (no external stylesheets, no web fonts; use a system font stack: `-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- Background `#EEF4EF`; content card `#FBFAF7` with a 1px border `#C5D4C7` and 12px radius; text `#202A24`; body size 16px, line-height 1.6; muted text `#4A6350`.
- The call-to-action is a bulletproof button (a styled link in a table cell): background `#55745C`, white text, bold, 14px vertical and 24px horizontal padding, 8px radius, at least 44px tall. Add a plain text link beneath or beside it so the link works if images or styles are blocked.
- No images, no logo image, no tracking pixels. The email must look correct with images disabled.
- Bulleted list rendered as a real `<ul>` with sensible spacing.
- Signature as plain text under the body: name on one line, site on the next.
- Add an accessible `lang="en"` attribute and a meaningful `<title>` that matches the subject.
- **Preview text:** the very first element inside `<body>` is a hidden block holding the preview text from section 1, so inbox apps show it beside the subject. Use inline styles: `display:none; max-height:0; overflow:hidden; mso-hide:all; font-size:1px; line-height:1px; opacity:0; color:#EEF4EF;`. Directly after the preview text, inside the same hidden block, add padding of repeated invisible characters (for example 100 repetitions of `&#847;&zwnj;&nbsp;`) so the email app does not pull the start of the body into the preview line. Escape the text like any other inserted text. Nothing else comes before the greeting.

**Plain-text version**
- Same wording, same order. Bullets use "- ". The button becomes the line `Book your free audit: <URL>`. Wrap lines sensibly. No HTML.

**Safety**
- Escape `first_name` and `process_name` before inserting them into the HTML. In the subject and the From/Reply-To headers, never insert visitor-supplied text (the subject is fixed).
- Trim the first name, collapse repeated whitespace, remove control characters and line breaks, and cap it at 60 characters. If nothing is left, use the "Hi there," greeting.

---

## 3. SENDING BEHAVIOUR

1. Order of operations: confirm the result exists, generate the PDF from the stored result (the same way as today), build both email versions, then send through Resend with the PDF attached.
2. **Attachment:** attach the PDF with a clean filename such as `Clarity-Map-{process-slug}.pdf` (lowercase, hyphens, no spaces or special characters, based on the process name). Use the content type `application/pdf`.
3. **Never send the email without the attachment.** If PDF generation fails, do not send; log the error and return the existing failure response to the front end.
4. **From and reply-to:** use the same sender and reply-to configuration the site already uses for its other Resend emails. The reply-to must be the existing environment-variable address, so replies reach a monitored inbox.
5. **Failure handling:** if Resend returns an error, retry once after a short delay (for example 2 seconds). If it still fails, log it with the result id (not the full email address; mask it, for example `j***@gmail.com`) and return a clear failure to the front end so the visitor sees a helpful message. Keep the existing visitor-facing messages; if none exist for failure, show: "We couldn't send your report just now. Please try again in a few minutes."
6. **Success:** keep the existing visitor-facing success behaviour. If a message is shown, it should read: "Your report is on its way to {email}. If you don't see it in a few minutes, check your spam folder."
7. **No double sends:** if the same result id and email address are submitted twice within a few minutes (double click, retry), send once. Use a short-lived idempotency key in the existing store or an in-memory cache, and pass it as Resend's idempotency header or key if the SDK supports it.
8. Log one line per send attempt: result id, masked email, success or failure, and the Resend message id. Never log the full email address, the PDF content, or any secret.

---

## 4. TESTS

1. The subject is exactly `Your Clarity Map is ready`.
2. With a first name "Amaka", the greeting is "Hi Amaka,"; with an empty or whitespace-only name it is "Hi there,".
3. Names with HTML or line-break characters (for example `<b>Ola</b>\nBcc: x@y.com`) are cleaned, escaped, and cannot alter headers or markup.
4. The message contains both `html` and `text`, and the PDF attachment is present with the expected filename and content type.
5. The HTML starts with the hidden preview-text block containing exactly `Your full report, plus the first quick win to try this week.` followed by the invisible padding, and has no images; the plain-text version has no preview text; the button link and the plain-text link both point to the audit URL with the UTM parameters.
6. PDF generation failure: no email is sent, the error is logged, and the failure response is returned.
7. Resend failure: one retry, then a clean failure; Resend success returns the message id and logs one masked line.
8. Double submit within the dedupe window sends once.
9. The sender and reply-to come from the existing configuration, and no new environment variables were added.
10. The email renders correctly at 375px and 600px widths and with images disabled (render the HTML to images and attach them to your final summary for a visual check).

---

## 5. SAFEGUARDS AGAINST MISUSE

Anyone can type any email address into the form, so it must not become a way to send unwanted email to other people.
- Allow at most **3 report sends per result id**, and at most **3 report sends per recipient email address per 24 hours** (use a hash of the lowercase email as the key, in the same shared store used elsewhere). On exceeding either limit, return a friendly message ("This report has already been sent to that address. Please check your inbox and spam folder.") without sending.
- Validate the email address with the existing validation library and normalise it (trim, lowercase) before use.
- These limits are separate from the generator's per-IP limit. Sending the report for an existing result does not use up a generation.

---

## 6. ORDER OF WORK

1. Report your inspection findings (section 0, rule 2). Continue without waiting.
2. Build the template module: HTML and plain-text builders, merge-field cleaning, greeting fallback. Unit-test it.
3. Wire it into the existing send path with the attachment, retry, idempotency and logging.
4. Add the safeguards (section 5).
5. Write and run the tests (section 4); attach the rendered previews.
6. Final summary: what changed and which files; any judgment calls; and, as required, **the exact sender (From) email address and display name used, the reply-to address, and the environment variable names they were read from** (no secrets).

If any instruction here conflicts with what you find in the code, stop and describe the conflict in one short message instead of guessing.
