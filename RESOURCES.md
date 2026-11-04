# Resources System: Guide & Operating Manual

This guide explains how downloadable resources work on `joshuaomole.com`, how to add new resources, what information is needed, and how the automated delivery pipeline operates.

---

## 1. Architecture & End-to-End Delivery Flow

```
[ Visitor Browses /resources or /resources/:slug ]
                     │
                     ▼
  Clicks "Get your free copy" / Reads Details
                     │
                     ▼
  Submits Modal Form (First Name + Work Email)
                     │
                     ▼
  POST /api/resource-request
  (Rate limited to 10 reqs / 15 mins, Honeypot check)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  1. Sync to Loops.so     2. Send Email via Resend
  • Create / Update       • Attaches private PDF
    contact               • Subject: Custom per resource
  • Tags with userGroup   • Personalizes {{firstName}}
  • Adds attribution      • Private file from /resources-private/
    (source, referrer)    • NEVER served via public URL
         │                       │
         └───────────┬───────────┘
                     ▼
  Instant on-screen confirmation
  & PDF arrives in user's inbox within seconds
```

### Key Security & Deliverability Highlights:
1. **Zero Public Access:** The downloadable files live in `/resources-private/` at the root of the project. This folder is outside `public/` and `dist/`, completely inaccessible to direct browser requests, web scrapers, or direct URL guessing.
2. **Path Traversal Protection:** The server sanitizes every filename, resolves it strictly against `/resources-private/`, and verifies file existence before reading.
3. **Resend Inlined Delivery:** The resource is attached directly to the confirmation email, giving the reader immediate, frictionless access in their inbox without broken Google Drive links or third-party file hosters.
4. **Loops Audience Growth:** Every request automatically creates or updates the subscriber in Loops, tagging them with the resource's specific `userGroup` for targeted follow-up workflows.

---

## 2. What You Need to Configure (One-Time Setup)

To enable email delivery, verify that the following environment variables are set in your deployment environment (e.g., Cloud Run / Vercel / server `.env`):

```bash
# Required for sending email attachments
RESEND_API_KEY="re_your_api_key_here"

# The verified sender email address (e.g., Joshua Omole <joshua@joshuaomole.com>)
RESEND_FROM_EMAIL="Joshua Omole <joshua@joshuaomole.com>"

# Optional reply-to address
RESEND_REPLY_TO="joshua@joshuaomole.com"

# The base URL of your site (used for canonical URLs and og:image tags)
SITE_URL="https://joshuaomole.com"
```

> **Note on Resend:** In development mode without a `RESEND_API_KEY`, the server logs the email payload and attachment path to the terminal for debugging without failing the request. In production, a valid key is required for delivery.

---

## 3. How to Add a New Resource (Step-by-Step)

Adding a new resource takes less than 3 minutes:

### Step 1: Put the PDF file in `/resources-private/`
Drop your PDF file into the `resources-private/` folder.
* **Example:** `resources-private/my-operations-playbook.pdf`
* **Rule:** Use lowercase letters, numbers, and hyphens for the filename (no spaces or special symbols).
* **Size:** Keep files under 20MB (Resend email attachment limit is 25MB; <10MB is optimal for email clients).

### Step 2: (Optional) Add a Cover Image
If you have a custom 3D mock-up or thumbnail image:
* Drop it into `public/assets/resources/my-operations-playbook.webp` (or `.png`).
* If omitted, the site automatically renders a stylized SVG preview card with your title and format badge.

### Step 3: Register the Resource in `server/resources/registry.ts`
Open `server/resources/registry.ts` and add an entry to the `RESOURCES_REGISTRY` array:

```ts
{
  slug: "operations-playbook",                    // Unique URL slug (/resources/operations-playbook)
  title: "The Operations Scaling Playbook",       // Clear, compelling headline
  summary: "A practical framework for...",       // 1-2 sentence overview for cards & previews
  description: "Detailed description of...",      // Full narrative on the detail page
  includes: [                                     // 3-6 bullet points shown in "What's Inside"
    "Step-by-step audit rubric",
    "Delegation matrix template",
    "Quarterly review cadence checklist"
  ],
  category: "Frameworks",                         // "Frameworks" | "Checklists" | "Templates" | "Guides"
  format: "PDF (24 pages)",                       // Badge label
  readingTime: "15 min read",                     // Reading/review estimate
  fileName: "my-operations-playbook.pdf",         // Exact filename in /resources-private/
  coverImage: "/assets/resources/operations-playbook.webp", // Optional
  loopsGroup: "Operations Playbook",              // Exact group name to tag in Loops.so
  emailSubject: "Your Operations Scaling Playbook from Joshua Omole", // Delivered email subject
  featured: true,                                 // Featured on homepage & top of /resources
  order: 4                                        // Display order (ascending)
}
```

### Step 4: Deploy
Run your standard build and deploy:
```bash
npm run build
```
Upon server boot, `validateResourceRegistry()` automatically validates that every registered `fileName` physically exists in `/resources-private/` and reports any missing files immediately.

---

## 4. Brief Template to Give the Coding Agent

Whenever you have a new resource and want the AI assistant to add it for you, copy, fill out, and send this prompt:

```text
Please add a new resource to the site with the following details:

- Title: [e.g., Executive Operating Cadence Guide]
- Slug: [e.g., executive-operating-cadence]
- Category: [Frameworks | Checklists | Templates | Guides]
- Format: [e.g., PDF (18 pages)]
- Reading Time: [e.g., 12 min read]
- Summary: [1-2 sentences summarizing what this resource is and who it's for]
- What's Inside:
  1. [Key item 1]
  2. [Key item 2]
  3. [Key item 3]
  4. [Key item 4]
- Detailed Description: [A paragraph explaining why this resource matters and how to apply it]
- PDF Filename: [e.g., executive-cadence-guide.pdf] (I have placed this in /resources-private/)
- Loops User Group: [e.g., Cadence Guide]
- Email Subject Line: [e.g., Your Executive Operating Cadence Guide from Joshua Omole]
- Featured on Homepage: [Yes / No]
```

---

## 5. Critical Rules to Remember

1. **Slug Permanence:** Once published, never change a resource's `slug`. The slug forms the permanent URL (`/resources/:slug`), canonical SEO links, social share tags, and email reference links.
2. **Loops Group Name Matching:** The `loopsGroup` field must match the exact case-sensitive group name in Loops.so if you have automated nurture sequences triggered by group membership.
3. **No Direct Public URLs:** Never move gated PDFs into `/public/`. Gated assets should only ever live in `/resources-private/` to preserve lead capture integrity.
4. **Resend Email Template:** The email body copy is centralized in `server/resources/email.ts` within the `EMAIL_MESSAGE` constant. You can customize the greeting, sign-off, and calendar booking link there at any time.
