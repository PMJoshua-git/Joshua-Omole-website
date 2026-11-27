# Loops.so & Resend Data Transfers Reference

This document is the single source of truth for all outgoing data transfers to **Loops.so** (CRM / contact storage & segmentation) and **Resend** (transactional email delivery & notifications) across the website.

---

## 1. High-Level Overview & Shared Configuration

| Integration | Purpose on the Site | Required Environment Variables |
| :--- | :--- | :--- |
| **Loops.so** | Central CRM and email marketing database. Every lead capture, booking, resource request, newsletter signup, and Clarity Map report request creates or updates a contact record in Loops with acquisition attribution and segmentation tags (`userGroup`). | `LOOPS_API_KEY` (Bearer token) |
| **Resend** | Transactional email delivery for file/PDF attachments (Clarity Map PDF reports and downloadable Resources) plus internal lead notifications to Joshua when a Clarity Map report is requested. | `RESEND_API_KEY` (required)<br>`RESEND_FROM_EMAIL` (default: `Joshua Omole <hello@joshuaomole.com>`)<br>`RESEND_REPLY_TO` (default: `hello@joshuaomole.com`) |

### Standard Loops Upsert Behavior
All contact-creation flows follow the same create-then-update pattern against the Loops v1 API:
1. Send `POST https://app.loops.so/api/v1/contacts/create` with `Authorization: Bearer <LOOPS_API_KEY>` and JSON payload.
2. If Loops returns HTTP `409 Conflict` (contact email already exists), automatically send `PUT https://app.loops.so/api/v1/contacts/update` with the contact payload so attribution/profile fields are updated.
3. Exceptions:
   - `POST /api/book-consultation/confirm-booking` calls `PUT https://app.loops.so/api/v1/contacts/update` directly to flip `leadStatus` to `"Booked"` and record `bookingTime`.
   - `POST /api/subscribe` includes `mailingLists` on `create`, and omits `mailingLists` on the `409` `update`.

---

## 2. First-Touch Attribution (`utils/attribution.ts`)

Every Loops form pulls visitor attribution from `getAttributionData()` (persisted in `localStorage["joshua_attribution_data"]`).

- **First-touch preservation**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `landing_page`, and external `referrer` are captured on initial arrival and **not overwritten** by internal clicks (such as the Clarity Map site popup with `utm_source=site&utm_medium=popup&utm_campaign=clarity_map_popup`) or subsequent page views.
- **`lead_source` priority order**:
  1. `utm_source` (if present)
  2. External `referrer` hostname (if different from `window.location.hostname`)
  3. First `landing_page` path
  4. `'direct'` (fallback)

---

## 3. Loops.so Data Transfers (By Feature / Page)

### Quick Cross-Reference Matrix

| Flow / Page | Frontend Trigger | Backend Route & Handler | Loops `userGroup` | Loops `source` | Loops `leadType` | Loops `leadStatus` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Workflow Fix** (`/business-workflow-fixes`) | Offer inquiry modal | `POST /api/subscribe` (`handleSubscribeRequest`) | Selected offer `name` (5 options) | `"Workflow fix page"` | `"Workflow Fix Inquiry"` | `"New"` |
| **Newsletter Page** (`/newsletter`) | Inline & bottom forms | `POST /api/subscribe` (`handleSubscribeRequest`) | `"Newsletter Subscriber"` | `"Newsletter page"` | `"Newsletter Subscriber"` | `"New"` |
| **Newsletter Modal** (site-wide) | Modal form | `POST /api/subscribe` (`handleSubscribeRequest`) | `"Newsletter Subscriber"` | `"Newsletter modal"` | `"Newsletter Subscriber"` | `"New"` |
| **Newsletter Legacy Endpoint** | Direct API callers | `POST /api/newsletter-subscribe` | `"Newsletter Subscriber"` | Body `source` or `"Newsletter"` | `"Newsletter Subscriber"` | `"New"` |
| **Audit Booking — Step 1** (`/audit`) | `CustomContactForm` submit | `POST /api/book-consultation` | `"Audit Booking"` | `"Audit page"` | `"Service Inquiry"` | `"New"` |
| **Audit Booking — Step 2** (`/audit`) | Cal.com `bookingSuccessful` | `POST /api/book-consultation/confirm-booking` | *(unchanged)* | *(unchanged)* | *(unchanged)* | `"Booked"` |
| **Resource Request** (`/resources`, `/resources/:slug`) | `GetCopyModal` submit | `POST /api/resource-request` (`addToLoops`) | `resource.loopsGroup` | `"Resources page"` | `"Resource Download"` | `"New"` |
| **Clarity Map Report** (`/clarity-map`) | `EmailCaptureModal` submit | `POST /api/clarity-map/report` (`syncClarityMapContactToLoops`) | `"Claritymap"` | `"Clarity Map"` | `"Clarity Map"` | `"New"` |
| **Live Training Booking** (`/training`) | `LiveTrainingSessions` form | `POST /api/book-training` | `"Training Booking"` | `"Training page"` | `"Training Booking"` | `"Pending"` |

---

### 3.1 Workflow Fix Page (`/business-workflow-fixes`)

- **Overview & Purpose**: Captures inquiries for fixed-scope workflow automation packages so Leads can enter the follow-up/questionnaire automation in Loops segmented by which system they selected (`userGroup`).
- **Frontend Component**: `pages/BusinessWorkflowFixes.tsx`
- **Backend Route**: `POST /api/subscribe` (`api/subscribe.js` / `server/apiApp.ts` → `server/leads/handlers.ts` → `handleSubscribeRequest`)
- **Fields Sent to Loops**:

| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Visitor email (trimmed, lowercased) | Required form input |
| `firstName` | Visitor first name (trimmed) | Required form input (`name` / `firstName`) |
| `lastName` | `""` | Default empty string in `handleSubscribeRequest` |
| `userGroup` | One of the 5 offer names:<br>• `"Lead Follow-Up System"`<br>• `"Client Onboarding System"`<br>• `"Simple Sales Funnel"`<br>• `"Lost Sale Recovery System"`<br>• `"Business Admin Autopilot"` | Replaces legacy `serviceSelected` field |
| `company` | Visitor business name (trimmed) | Required form input (`business` / `company`) |
| `country` | `""` | Default empty string in `handleSubscribeRequest` |
| `companySize` | `""` | Default empty string in `handleSubscribeRequest` |
| `source` | `"Workflow fix page"` | Hardcoded by page |
| `leadSource` | `attribution.lead_source \|\| "direct"` | First-touch attribution |
| `leadType` | `"Workflow Fix Inquiry"` | Included whenever non-empty |
| `leadStatus` | `"New"` | Hardcoded initial lead status |
| `landingPage` | `"/business-workflow-fixes"` | Page path |
| `utmSource` | `attribution.utm_source \|\| ""` | First-touch attribution |
| `utmMedium` | `attribution.utm_medium \|\| ""` | First-touch attribution |
| `utmCampaign` | `attribution.utm_campaign \|\| ""` | First-touch attribution |
| `referrer` | `attribution.referrer \|\| ""` | First-touch external referrer hostname |
| `mailingLists` | `{}` | Sent on `POST /contacts/create` only; omitted on `409` `PUT /contacts/update` |

- **Intentionally Removed Legacy Fields**: `nextStep` (removed from UI and payload) and `serviceSelected` (replaced by `userGroup`).
- **Missing API Key Behavior**: Returns `503` in production (`VERCEL_ENV === 'production'`); returns `200` mock success in preview/development.

---

### 3.2 Newsletter Page (`/newsletter`) & Site-Wide Newsletter Modal

- **Overview & Purpose**: Adds subscribers to Joshua's weekly dispatch email list with page/modal origin and first-touch attribution so subscriber acquisition channels can be tracked.
- **Frontend Components**:
  - `pages/Newsletter.tsx` (top inline form collects `firstName` + `email`; bottom `#join` CTA form collects `email` only)
  - `components/NewsletterModal.tsx` (collects `firstName` + `email`)
- **Backend Route**: `POST /api/subscribe` (`server/leads/handlers.ts` → `handleSubscribeRequest`)
- **Fields Sent to Loops**:

| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Subscriber email (trimmed, lowercased) | Required |
| `firstName` | Subscriber first name (trimmed), or `""` | `""` when submitted from the email-only bottom CTA on `/newsletter` |
| `lastName` | `""` | Default empty string |
| `userGroup` | `"Newsletter Subscriber"` | Hardcoded |
| `company` | `""` | Default empty string |
| `country` | `""` | Default empty string |
| `companySize` | `""` | Default empty string |
| `source` | `"Newsletter page"` (`Newsletter.tsx`) or `"Newsletter modal"` (`NewsletterModal.tsx`) | Identifies which signup UI converted the visitor |
| `leadSource` | `attribution.lead_source \|\| "direct"` | First-touch attribution |
| `leadType` | `"Newsletter Subscriber"` | Hardcoded |
| `leadStatus` | `"New"` | Hardcoded |
| `landingPage` | `attribution.landing_page \|\| window.location.pathname` (fallback `"/newsletter"` on page, `"/"` on modal) | First-touch landing page or current path |
| `utmSource` | `attribution.utm_source \|\| ""` | First-touch attribution |
| `utmMedium` | `attribution.utm_medium \|\| ""` | First-touch attribution |
| `utmCampaign` | `attribution.utm_campaign \|\| ""` | First-touch attribution |
| `referrer` | `attribution.referrer \|\| ""` | First-touch external referrer hostname |
| `mailingLists` | `{}` | Sent on `create` only |

> **Note on Legacy Route (`POST /api/newsletter-subscribe`)**: Defined in `services/api/newsletter-subscribe.ts`. Accepts `{ firstName, email, source, leadSource, utmSource, utmMedium, utmCampaign, referrer, landingPage, leadStatus, leadType }` and sends `email`, `firstName` (`""` fallback), `source` (`"Newsletter"` fallback), `leadSource` (`"direct"`), `userGroup: "Newsletter Subscriber"`, `leadType` (`"Newsletter Subscriber"`), `leadStatus` (`"New"`), `landingPage` (`"/newsletter"`), `utmSource`, `utmMedium`, `utmCampaign`, and `referrer` to Loops (`create` + `409 -> update`). None of the current React components call this legacy route directly (they use `/api/subscribe`).

---

### 3.3 Systems Clarity Audit Booking (`/audit`)

- **Overview & Purpose**: Two-step lead & calendar booking flow. Step 1 saves the prospect's operational profile and problem statement when they submit the intake form before the Cal.com scheduler opens. Step 2 updates their status in Loops once they complete selecting a time slot in Cal.com.
- **Frontend Component**: `components/forms/CustomContactForm.tsx`
- **Backend Routes**:
  - Step 1: `POST /api/book-consultation` (`services/api/book-consultation.ts`)
  - Step 2: `POST /api/book-consultation/confirm-booking` (`services/api/book-consultation.ts`)

#### Step 1 — Initial Form Submission (`POST /api/book-consultation`)
| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Visitor email (trimmed, lowercased) | Validated via Zod `.email()` |
| `firstName` | Visitor first name (trimmed) | Required |
| `lastName` | `""` | Default empty string |
| `country` | `""` | Default empty string |
| `companySize` | Selected tier (`"Just me"`, `"2-10"`, `"11-50"`, `"50+"`, etc.) | Required |
| `company` | Company name (trimmed) | Required |
| `source` | `"Audit page"` | Hardcoded in backend handler |
| `userGroup` | `"Audit Booking"` | Hardcoded in backend handler |
| `subscribed` | `Boolean(newsletterOptIn)` | Checkbox consent (`true` or `false`) |
| `leadType` | `"Service Inquiry"` | Client default / schema default |
| `leadStatus` | `"New"` | Initial status before calendar slot is picked |
| `landingPage` | `attribution.landing_page \|\| window.location.pathname \|\| "/audit"` | Backend fallback `"/audit"` |
| `utmSource` | `data.utmSource \|\| data.utmParameters \|\| ""` | First-touch UTM source |
| `utmMedium` | `data.utmMedium \|\| ""` | First-touch UTM medium |
| `utmCampaign` | `data.utmCampaign \|\| ""` | First-touch UTM campaign |
| `referrer` | `data.referrer \|\| ""` | First-touch external referrer |
| `leadSource` | `data.leadSource \|\| "direct"` | First-touch attribution |
| `businessGoal` | Operational challenge description (min 10 chars) | Required textarea input |

*(Note: `phone`, `position`, and `serviceType` are accepted in the request schema for compatibility, with `serviceType` defaulting to `"Systems Clarity Audit"`, but are not forwarded in `loopsPayload`.)*

#### Step 2 — Cal.com Booking Confirmation (`POST /api/book-consultation/confirm-booking`)
Triggered when Cal.com emits `bookingSuccessful` (either via `getCalApi` or `window` `postMessage`):
- Sends `PUT https://app.loops.so/api/v1/contacts/update` (if `LOOPS_API_KEY` is set and `email` is non-empty):
  - `email`: trimmed lowercase email
  - `leadStatus`: `"Booked"`
  - `bookingTime`: Cal.com event `date` (ISO string) or `new Date().toISOString()`

---

### 3.4 Free Resource Request (`/resources` & `/resources/:slug`)

- **Overview & Purpose**: Segments visitors who request a gated PDF/resource file from the Resources library so Loops can run resource-specific follow-up sequences. Runs in parallel (`Promise.allSettled`) with Resend email delivery; a Loops API failure is logged on the server without blocking the visitor from receiving their requested file via email.
- **Frontend Component**: `components/resources/GetCopyModal.tsx`
- **Backend Route**: `POST /api/resource-request` (`server/apiApp.ts` → `addToLoops`)
- **Guards**:
  - IP sliding-window rate limit: max `10` requests per `15` minutes per hashed client IP.
  - Honeypot field (`website`): silently returns `{ ok: true }` without calling Loops or Resend if non-empty.
  - Resource registry check: `resource.status` must be `'published'` in `server/resources/registry.ts` (currently `resources` array is `[]` until entries are added).
- **Fields Sent to Loops**:

| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Visitor email (trimmed, lowercased) | Validated via Zod |
| `firstName` | Visitor first name (trimmed, 1–80 chars) | Validated via Zod |
| `userGroup` | `resource.loopsGroup` | Server-only string from `ResourceEntry` in `server/resources/registry.ts` (never exposed to browser) |
| `source` | `"Resources page"` | Client sends `"Resources page"`; backend defaults to `"Resources page"` |
| `leadSource` | `attribution.lead_source \|\| "direct"` | First-touch attribution |
| `leadType` | `"Resource Download"` | Hardcoded default |
| `leadStatus` | `"New"` | Hardcoded default |
| `landingPage` | `attribution.landing_page \|\| window.location.pathname` (backend fallback `"/resources/${slug}"`) | First-touch landing page or resource slug path |
| `utmSource` | `utmSource \|\| utmParamsParsed.get("utm_source") \|\| ""` | Accepts explicit field or `utmParameters` query string fallback |
| `utmMedium` | `utmMedium \|\| utmParamsParsed.get("utm_medium") \|\| ""` | Accepts explicit field or `utmParameters` query string fallback |
| `utmCampaign` | `utmCampaign \|\| utmParamsParsed.get("utm_campaign") \|\| ""` | Accepts explicit field or `utmParameters` query string fallback |
| `referrer` | `attribution.referrer \|\| ""` | First-touch external referrer |

---

### 3.5 Clarity Map Report Capture (`/clarity-map`)

- **Overview & Purpose**: Mandatory CRM capture before generating and emailing the personalized Clarity Map PDF report. Loops sync runs **first** — if `LOOPS_API_KEY` is missing (`503`) or Loops fails (`502`), the rate-limit reservation is released and no PDF or email is sent. In addition to standard attribution fields, this flow populates 7 custom diagnostic properties directly from the user's analyzed `ClarityMapResult` (which Loops auto-creates as custom contact properties on first receipt).
- **Frontend Component**: `components/clarity-map/EmailCaptureModal.tsx` → `requestFullReport()` (`features/clarity-map/services/clarityMapApi.ts`)
- **Backend Route**: `POST /api/clarity-map/report` (`server/clarity-map/routes.ts` → `server/clarity-map/handlers.ts` → `syncClarityMapContactToLoops` in `server/clarity-map/crm/loopsSync.ts`)
- **Fields Sent to Loops**:

| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Visitor email (trimmed, lowercased) | Required |
| `firstName` | Sanitized first name (control chars stripped, collapsed whitespace, max 60 chars) | Required |
| `userGroup` | `"Claritymap"` | Hardcoded in `loopsSync.ts` |
| `source` | `"Clarity Map"` | Hardcoded in `loopsSync.ts` |
| `leadSource` | `attribution.lead_source \|\| "direct"` | First-touch attribution |
| `leadType` | `"Clarity Map"` | Client & backend default |
| `leadStatus` | `"New"` | Client & backend default |
| `landingPage` | `attribution.landing_page \|\| window.location.pathname \|\| "/clarity-map"` | Backend fallback `"/clarity-map"` |
| `utmSource` | `attribution.utm_source \|\| ""` | First-touch attribution |
| `utmMedium` | `attribution.utm_medium \|\| ""` | First-touch attribution |
| `utmCampaign` | `attribution.utm_campaign \|\| ""` | First-touch attribution |
| `referrer` | `attribution.referrer \|\| ""` | First-touch external referrer |
| `clarityMapIndustry` | `result.crm_tags.industry \|\| result.meta.industry` | Diagnostic industry string |
| `clarityMapProcessCode` | `result.crm_tags.process_code \|\| result.meta.process_code` | Workflow process identifier |
| `clarityMapProcessName` | `result.meta.process_name` | Human-readable workflow name |
| `clarityMapReadinessBand` | `result.crm_tags.readiness_band \|\| result.readiness.band` | Operational readiness tier |
| `clarityMapReadinessScore` | `result.readiness.score_percent` | Numeric readiness score |
| `clarityMapTopBottleneck` | `result.crm_tags.top_bottleneck_bridge_letter` | Top BRIDGE bottleneck letter |
| `clarityMapVolumeBand` | `result.crm_tags.volume_band` | Monthly process volume band |

---

### 3.6 Live Training Booking (`/training`)

- **Overview & Purpose**: Captures registration details when a visitor books a live training session prior to displaying the Cal.com embed. *(Note: `GET /api/training-sessions` currently returns an empty list `[]`, so `LiveTrainingSessions` renders `null` until sessions are configured.)*
- **Frontend Component**: `components/LiveTrainingSessions.tsx`
- **Backend Route**: `POST /api/book-training` (`services/api/book-training.ts`)
- **Fields Sent to Loops**:

| Loops Field | Value Sent | Notes / Source |
| :--- | :--- | :--- |
| `email` | Visitor email (trimmed, lowercased) | Required |
| `firstName` | Visitor name (`data.name.trim()`) | Required |
| `source` | `"Training page"` | Client sends `"Training page"`; schema default `"Training page"` |
| `leadSource` | `attribution.lead_source \|\| "direct"` | First-touch attribution |
| `userGroup` | `"Training Booking"` | Hardcoded in backend |
| `leadType` | `"Training Booking"` | Client & schema default |
| `leadStatus` | `"Pending"` | Client & schema default |
| `landingPage` | `attribution.landing_page \|\| window.location.pathname` (backend fallback `"/training"`) | First-touch landing page or current path |
| `utmSource` | `attribution.utm_source \|\| ""` | First-touch attribution |
| `utmMedium` | `attribution.utm_medium \|\| ""` | First-touch attribution |
| `utmCampaign` | `attribution.utm_campaign \|\| ""` | First-touch attribution |
| `referrer` | `attribution.referrer \|\| ""` | First-touch external referrer |
| `location` | Visitor location (trimmed) | Required training form field |
| `sessionTitle` | `selectedSession.title \|\| ""` | Selected training session title |
| `expectations` | Visitor expectations text or `""` | Optional training form field |

---

## 4. Resend Email Transfers

There are **two Resend modules** on the site, performing a total of **three distinct email sends**:
1. Clarity Map PDF Report → Visitor (`server/clarity-map/email/sendReport.ts`)
2. Clarity Map Lead Notification → Internal (`server/clarity-map/email/sendReport.ts`)
3. Downloadable Resource Copy → Visitor (`server/resources/email.ts`)

### Summary Table

| Email Transfer | Function & File | Trigger Route | `to` | `from` | `replyTo` | Attachment |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Clarity Map Visitor Report** | `sendClarityMapReportEmails` (`server/clarity-map/email/sendReport.ts`) | `POST /api/clarity-map/report` | Visitor email | `RESEND_FROM_EMAIL` (default `Joshua Omole <hello@joshuaomole.com>`) | `RESEND_REPLY_TO` (default `hello@joshuaomole.com`) | `Clarity-Map-{process-slug}.pdf` (`application/pdf`) |
| **Clarity Map Internal Lead Alert** | `sendClarityMapReportEmails` (`server/clarity-map/email/sendReport.ts`) | `POST /api/clarity-map/report` (after visitor send succeeds) | `Joshua@mail.joshuaomole.com` | `RESEND_FROM_EMAIL` | Visitor `email` | Same `Clarity-Map-{process-slug}.pdf` (`application/pdf`) |
| **Resource File Delivery** | `sendResourceEmail` (`server/resources/email.ts`) | `POST /api/resource-request` | Visitor email | `RESEND_FROM_EMAIL` (default `Joshua Omole <hello@joshuaomole.com>`) | `RESEND_REPLY_TO` (default `hello@joshuaomole.com`) | `{resource.fileName}` from `resources-private/` |

---

### 4.1 Clarity Map Report Delivery & Internal Lead Alert (`sendClarityMapReportEmails`)

- **Source Files**:
  - `server/clarity-map/email/sendReport.ts`
  - `server/clarity-map/email/reportEmailTemplate.ts`
  - `server/clarity-map/rateLimit/reportGuard.ts`
  - Called by `handleReportRequest` in `server/clarity-map/handlers.ts`
- **Execution Sequence**:
  1. Validates `reportGuard` quotas (does **not** consume Clarity Map analysis rate-limit slots).
  2. Runs mandatory Loops sync (`syncClarityMapContactToLoops`).
  3. Generates the PDF buffer (`generateClarityMapPdf`).
  4. Sends the **Visitor Report Email**, then sends the **Internal Lead Notification Email** as a separate Resend call (so the visitor never sees Joshua's internal address, and an internal notification error never fails or hides a successful visitor delivery).

#### Email 1: Visitor Report Delivery
- **Overview & Purpose**: Delivers the visitor's personalized Clarity Map PDF report along with reading instructions and a tracked booking CTA for a free Systems Clarity Audit.
- **Fields Sent to Resend (`resend.emails.send`)**:
  - `from`: `process.env.RESEND_FROM_EMAIL` (newlines stripped; default `'Joshua Omole <hello@joshuaomole.com>'`)
  - `to`: visitor email address
  - `replyTo`: `process.env.RESEND_REPLY_TO` (newlines stripped; default `'hello@joshuaomole.com'`)
  - `subject`: `"Your Clarity Map is ready"` (`REPORT_EMAIL_SUBJECT`)
  - `html` & `text`: Built by `buildClarityMapReportEmail({ firstName, processName })`:
    - Greeting: `"Hi {cleanFirstName},"` (max 60 chars, control characters stripped) or `"Hi there,"`
    - HTML-only hidden preheader: `"Your full report, plus the first quick win to try this week."`
    - Summary of the 4 sections inside the PDF + quick-start guidance mentioning `{cleanProcessName}`
    - CTA button/link: `https://joshuaomole.com/audit?utm_source=email&utm_medium=report&utm_campaign=clarity_map_report`
  - `attachments`:
    - `filename`: `Clarity-Map-{process-slug}.pdf` (lowercased, hyphenated, max 64-char slug)
    - `content`: generated PDF `Buffer`
    - `contentType`: `'application/pdf'`
  - Request options: `{ idempotencyKey: reservation.idempotencyKey }`
- **Safeguards, Retries & Logging**:
  - **Guard limits** (`reportGuard.ts`):
    - 5-minute double-submit dedupe (`REPORT_DEDUPE_WINDOW_SECONDS = 300`): returns cached `messageId` without re-sending.
    - Max `3` sends per `resultId` across 30 days (`REPORT_MAX_SENDS_PER_RESULT = 3`).
    - Max `3` sends per hashed recipient email across 24 hours (`REPORT_MAX_SENDS_PER_EMAIL_24H = 3`).
  - **Retry**: If the first visitor send fails, waits `2000ms` (`DEFAULT_RETRY_DELAY_MS`) and retries once with the same `idempotencyKey`.
  - **Failure handling**: Throws `EmailConfigurationError` (`503`) if `RESEND_API_KEY` is missing, or `EmailDeliveryError` (`502`) if PDF buffer is empty or both send attempts fail, releasing the `reportGuard` reservation.
  - **Logging**: Masks the recipient address (`j***@domain.com`) and strips raw email occurrences from logged error reasons.

#### Email 2: Internal Lead Notification
- **Overview & Purpose**: Alerts Joshua immediately when someone downloads a Clarity Map report, giving full diagnostic context and a copy of their PDF so he can reply directly to the lead.
- **Fields Sent to Resend (`resend.emails.send`)**:
  - `from`: `RESEND_FROM_EMAIL` (same resolved sender)
  - `to`: `'Joshua@mail.joshuaomole.com'` (`INTERNAL_LEAD_EMAIL`)
  - `replyTo`: visitor's `email` (clicking Reply addresses the visitor directly)
  - `subject`: `"[Clarity Map] {firstNameOrVisitor} — {processName} ({readiness.band})"`
  - `html`: Structured lead summary table & breakdown containing:
    - Visitor `firstName` (sanitized; fallback `'Visitor'`) and `email`
    - `meta.industry`
    - `meta.process_name` and `meta.process_code`
    - `readiness.score_percent` (%) and `readiness.band`
    - Top Bottleneck Lens (`crm_tags.top_bottleneck_bridge_letter` or `'N/A'`)
    - Volume Band (`crm_tags.volume_band` or `'N/A'`)
    - `summary.headline`
    - Bullet list of all `bottlenecks` (`title`, `bridge_letter`, `why_it_matters`)
    - *(Plain-text `text` body is omitted on this internal email.)*
  - `attachments`: Same `Clarity-Map-{process-slug}.pdf` (`application/pdf`) buffer.
- **Failure Handling**: Best-effort; errors are logged (with masked visitor email) and surfaced as `internalSent: false` without failing the visitor's `200` response.

---

### 4.2 Downloadable Resource Delivery (`sendResourceEmail`)

- **Source Files**:
  - `server/resources/email.ts`
  - `server/resources/registry.ts`
  - Called by `POST /api/resource-request` in `server/apiApp.ts`
- **Overview & Purpose**: Delivers a requested private file (e.g. playbook, framework, or guide stored in `resources-private/`) as an email attachment immediately after the visitor submits their first name and email in `GetCopyModal`.
- **Execution & Safeguards (`POST /api/resource-request`)**:
  - Enforces IP rate limit (`10` requests / `15` minutes), silent honeypot check (`website`), published status lookup in `server/resources/registry.ts`, and path-traversal check ensuring the file resides inside `resources-private/`.
  - Reads the file into a `Buffer` from disk (`500` if missing/unreadable), then runs `sendResourceEmail` and `addToLoops` in parallel via `Promise.allSettled`.
  - If Resend fails (`emailResult.status === 'rejected'`), the endpoint returns HTTP `502`. *(Note: Unlike `sendReport.ts`, `server/resources/email.ts` instantiates `new Resend(apiKey || 're_placeholder')` when `RESEND_API_KEY` is unset, meaning Resend will reject the request at send time rather than throwing a `503` upfront, and there is no automatic retry, idempotency key, or internal notification email.)*
- **Fields Sent to Resend (`resend.emails.send`)**:
  - `from`: `process.env.RESEND_FROM_EMAIL || 'Joshua Omole <hello@joshuaomole.com>'`
  - `to`: visitor email address
  - `replyTo`: `process.env.RESEND_REPLY_TO || 'hello@joshuaomole.com'`
  - `subject`: `resource.emailSubject ?? "Your copy of ${resource.title}"` (from server-only `ResourceEntry`)
  - `html`: Branded email card showing `Joshua Omole · Resources`, heading `"Your copy of {resource.title}"`, `"Hi {firstName || 'there'},"`, attachment box displaying `{resource.fileName} ({resource.format})`, and reply invitation.
  - `text`: Plain-text `EMAIL_MESSAGE` template with `{{firstName}}` and `{{resourceTitle}}` interpolated.
  - `attachments`: `[{ filename: resource.fileName, content: fileBuffer }]`
