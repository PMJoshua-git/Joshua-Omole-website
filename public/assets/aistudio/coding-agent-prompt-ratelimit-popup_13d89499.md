# Coding Agent Prompt: IP Rate Limiting + Clarity Map Pop-up

Paste everything below the line into your coding agent.

---

## 0. CONTEXT AND GROUND RULES

You are adding two features to an existing, working site and product:

1. **IP rate limiting** on the Clarity Map generator: **2 generated workflows per IP address per 24 hours**.
2. **A promotional pop-up** on the main site (joshuaomole.com) that links visitors to the Clarity Map after they have spent some seconds on the site. It shows once per page load; a reload lets it show again.

**Hard rules**
1. **Inspect before editing.** Do not assume the stack, the hosting, or where anything lives. In your first message, report briefly: how the app is hosted (serverless, a long-running Node server, or both), where the generate endpoint is, where any existing rate limiting or middleware lives, whether a shared store (Redis or similar) is already available, how the site's root layout, routing and analytics work, and what floating UI already exists (chat widget, cookie banner, booking embeds).
2. Reuse existing patterns (validation, error handling, logging, UTM attribution, design tokens). Do not rewrite unrelated code.
3. If an existing rate limiter or abuse protection is already in place, extend or reconcile it. Do not stack a second, conflicting one. Say what you found.
4. **Do not change** the question set, the AI prompt, the readiness score, the report layout, or the email pop-up flow. This task touches only the generate endpoint's gatekeeping, the tool's front end where it reacts to the limit, and one new site-wide component.
5. Work in the order in section 6, run tests after each step, and finish with a short summary of changes, files touched, judgment calls and anything you could not do.

---

## 1. FEATURE 1: IP RATE LIMITING

### 1.1 Rules

- **Limit:** 2 generations per IP per rolling 24 hours. Make both numbers config values: `GEN_LIMIT_PER_WINDOW = 2`, `GEN_WINDOW_SECONDS = 86400`.
- **What counts as one generation:** one successful run of the AI mapping that returns a validated result. These do NOT count:
  - the internal retry when output fails validation (one user submit = one count),
  - requests that fail with a server or AI error (refund the count),
  - viewing a stored result again,
  - requesting the emailed PDF for a result that already exists (the PDF renders from the stored result and consumes nothing),
  - the non-consuming status check in section 1.4.
- **Enforcement is server-side only,** in the generate endpoint, **before** the AI call is made (the point is to protect cost). Never rely on the front end.
- **Rolling window, not a fixed daily reset.** Use a sliding-window log: store one timestamp per generation for each IP and count those within the last `GEN_WINDOW_SECONDS`. A fixed window anchored on first use would let a user make four requests around the reset boundary.

### 1.2 Storage and atomicity

- State must be **shared across instances**. If the app runs serverless or on more than one instance, in-memory storage will NOT work. Use a shared store (Redis). If the stack already has Upstash Redis, Vercel KV or similar, use it; otherwise add Upstash Redis and tell me which environment variables to set.
- The check-and-reserve step must be **atomic** (a Lua script or a transaction), so five parallel requests from one IP can never get more than 2 through. Reserve a slot **before** the AI call; **release it** (remove that one timestamp) if the call fails or the result fails final validation.
- Use a sorted set keyed per IP (members = unique request ids, scores = timestamps). Trim entries older than the window on every call and set a key expiry slightly longer than the window.
- **Store a hash of the IP, never the raw IP:** `key = "gen:" + HMAC_SHA256(ip, RATE_LIMIT_SECRET)`. Do not write raw IPs to logs. This keeps us aligned with privacy rules (NDPR/GDPR).
- If the shared store is unreachable: **fail open** (let the request through so the tool stays usable), log an error with the reason, and apply a best-effort **in-memory per-instance fallback limiter** with the same numbers. Never block users because our store is down.

### 1.3 Getting the real client IP correctly

- Use the trusted proxy header for the actual hosting setup, and ignore client-supplied spoofable headers when there is no proxy in front. Examples: on Vercel use the first entry of `x-forwarded-for` (or the platform's own IP helper); behind Cloudflare use `cf-connecting-ip`; in Express set `trust proxy` correctly. Document which one you used and why.
- Normalise before hashing: strip ports; convert IPv4-mapped IPv6 (`::ffff:1.2.3.4`) to IPv4; **for IPv6, use the /64 prefix** as the identity so one user cannot rotate through addresses in their own block.
- If no IP can be determined, treat it as a shared "unknown" bucket with a higher limit (config `UNKNOWN_IP_LIMIT = 10`) and log it. Do not block everyone without an IP.

### 1.4 Non-consuming status endpoint

Add `GET /api/clarity-map/limit-status` (use the existing route naming style). It returns the same data as a 429 would, without reserving anything:

```json
{ "limit": 2, "remaining": 1, "reset_at": "2026-11-16T14:20:00Z", "limited": false }
```

`reset_at` is when the **oldest** counted generation leaves the window (the earliest time one slot frees up). If `remaining` is 0, `limited` is true.

The front end calls this when the tool opens (see section 2), so people do not answer 10 questions and then get blocked. It is a convenience only; the generate endpoint still enforces the limit.

### 1.5 Response when limited

The generate endpoint returns **HTTP 429** with these headers: `Retry-After` (seconds), `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and this body:

```json
{ "error": "rate_limited", "limit": 2, "remaining": 0, "reset_at": "<ISO time>", "retry_after_seconds": 0 }
```

On success, include a `rate_limit` object in the response body: `{ "limit": 2, "remaining": n, "reset_at": "<ISO time or null>" }`.

### 1.6 Extras

- **Allowlist:** env var `RATE_LIMIT_ALLOWLIST` (comma-separated IPs) that bypasses the limit, so the owner and testers are not blocked. Also bypass on localhost in development. Compare hashed values or normalised IPs; do not log them.
- **Optional global cost cap:** env var `GLOBAL_DAILY_GENERATION_CAP` (default `0` = disabled). When above 0 and reached, return 503 `{ "error": "high_demand" }` with the friendly message in section 2.2. This protects against a distributed attack that rotates IPs.
- **Logging:** when a request is blocked, log one structured line: time, a short prefix of the IP hash (first 8 characters), and which limit hit. This lets us see how many legitimate users hit the limit (shared mobile networks and offices share IPs).

---

## 2. FRONT-END BEHAVIOUR FOR THE LIMIT

### 2.1 Tool entry

When the user opens the Clarity Map tool (landing screen), call the status endpoint.
- `limited: false`: proceed as normal. After a successful generation, show a small unobtrusive line on the results page, for example "1 free map left today" (use `remaining` from the response; hide the line if it would read "0 left" with no helpful context, show "You've used both free maps today. The next unlocks at <time>." instead).
- `limited: true`: do not show the industry picker; show the limit message (2.2) instead.
- If the status call fails, ignore it and let the user proceed.

### 2.2 Limit message (use this copy)

Show it as a calm in-page card, not an error banner.

- **Heading:** "You've used your 2 free maps for today."
- **Body:** "To keep this tool free and fast for everyone, each visitor can generate 2 maps per day. Your next one unlocks at {local time, in the visitor's timezone, for example 3:40 PM}."
- **Primary button:** "Book a 30-minute Systems Clarity Audit" (link to the audit page, with existing UTM tagging).
- **Secondary link:** "Back to the site".

For the 503 `high_demand` case: heading "The Clarity Map is very busy right now." Body: "Please try again a little later. If it's urgent, book an audit and we'll look at your process together." Same primary button.

### 2.3 If the limit is hit at submit

If the generate call returns 429 after the user has already answered the questions, **keep their answers in state** (do not clear the form), show the message above, and do not show a generic error.

---

## 3. FEATURE 2: THE CLARITY MAP POP-UP

### 3.1 Behaviour (exactly as specified)

- **Trigger:** after the visitor has spent **N seconds** on the site. Default `POPUP_DELAY_SECONDS = 25`, one config value.
- **Time spent means visible time.** Pause the timer when the tab is hidden (use the `visibilitychange` event) and resume when it is visible again. Do not count background-tab time.
- **Once per page load.** Keep the "already shown" state in memory only (a module-level variable or in-memory store). **Do not use localStorage, sessionStorage or cookies.** A full page reload creates a fresh state, so the pop-up can show again after the delay. Client-side navigation between pages (no reload) must NOT show it again, and the timer keeps running across such navigation. Mount the component once in the root layout so it survives route changes.
- After the visitor dismisses it **or** clicks the call to action, never show it again until the next reload.
- **Where it does not show:** on the Clarity Map pages themselves (any route under the tool), the audit/booking pages, checkout or payment pages, and any other page set in `POPUP_EXCLUDED_PATHS` (config array of path prefixes; include the tool's route, `/audit`, `/business-workflow-fixes`). If the delay has already elapsed while the visitor is on an excluded page, wait and show it on the next allowed page after navigation.
- **Hold it back** (retry shortly after) while: the visitor is typing in an input or textarea, another modal or dialog is open, a booking embed is open, or the site's chat assistant panel is open. Retry every 2 seconds for up to 20 seconds, then give up for this page load.
- **No pop-up on server render:** this is a client-only component; avoid hydration mismatches.

### 3.2 Content (use this copy; do not mention AI)

- **Eyebrow:** "Free process mapper"
- **Heading:** "See how your process really runs."
- **Body:** "Choose your industry, answer 10 quick questions, and get a map of your current process next to a redesigned version. Takes about 4 minutes."
- **Primary button:** "Try the Clarity Map"
- **Secondary action:** a text button "Maybe later" and a close (X) icon, both dismiss.
- **Fine print:** "Free. See your map without leaving an email."

### 3.3 Link and attribution

- The primary button goes to the Clarity Map route (find the real route in the codebase; do not invent it). Open in the same tab.
- Use the site's existing UTM attribution utility. Append `utm_source=site`, `utm_medium=popup`, `utm_campaign=clarity_map_popup`, unless the existing utility already carries first-touch attribution, in which case add them as the click's own parameters without overwriting stored first-touch data. Say how you handled it.

### 3.4 Design

Match the site's tokens (sage and slate palette, Manrope headings, Inter body). Use the site's existing design tokens and CSS variables rather than hard-coded colours, if they exist. If they do not, use: primary `#55745C`, background `#EEF4EF`, surface `#FBFAF7`, text `#202A24`, accent `#3BB2F6`, border `#C5D4C7`.

- **Desktop:** a compact card anchored to the bottom corner, about 360px wide, with a soft shadow. No full-screen backdrop and no scroll lock. The page stays usable.
- **Mobile:** a bottom sheet that takes at most about a quarter of the screen height, with no backdrop. Do not use a full-screen interstitial on mobile (it hurts the user experience and search ranking).
- **Collision check:** inspect the existing floating UI (a chat assistant that opens automatically, cookie banner, WhatsApp button). The pop-up must never overlap them. Position it so they do not collide (for example the opposite corner), or hold the pop-up while the other element is visible. Say what you chose.
- Entrance: a short fade and slide (about 200ms). Respect `prefers-reduced-motion`: no animation.
- Touch targets at least 44px tall. Text contrast at least 4.5:1.

### 3.5 Accessibility

- `role="dialog"`, `aria-labelledby` pointing at the heading, `aria-modal="false"` (it is non-blocking).
- Do not steal focus from where the user is. The pop-up must still be reachable by keyboard (place it at the end of the document, with the close button and the primary button focusable in a sensible order).
- Escape closes it. The close button has `aria-label="Close"`.

### 3.6 Analytics

Use the site's existing analytics method and fire three events: `clarity_popup_shown`, `clarity_popup_clicked`, `clarity_popup_dismissed` (include the path and seconds on site). If no analytics exists, add a tiny `track()` function that logs to the console in development and is easy to wire to a real provider later, and tell me.

### 3.7 Config

Put every tunable in one file: delay seconds, excluded paths, copy strings, target route, UTM values.

---

## 4. TESTS

**Rate limiting**
1. Two sequential generations from one IP succeed; the third returns 429 with the correct headers and body.
2. Five parallel requests from one IP: exactly two succeed (atomicity).
3. A generation that fails after reservation releases its slot (a third request then succeeds).
4. Validation-retry inside one submit consumes one slot only.
5. Sliding window: after the oldest timestamp ages past the window (use a fake clock), one new request succeeds, and `reset_at` matches the oldest entry.
6. IPv6: two addresses in the same /64 count together; IPv4-mapped IPv6 equals the IPv4 form.
7. Allowlisted IP is never limited; store outage fails open and falls back to the in-memory limiter.
8. Status endpoint returns correct `remaining` and never consumes a slot.
9. Raw IPs never appear in stored keys or logs.
10. Generating the emailed PDF for an existing result does not consume a slot.

**Pop-up** (browser tests with fake timers)
11. Not shown before the delay; shown after it.
12. Timer pauses while the tab is hidden.
13. After dismissal, client-side navigation does not show it again; a reload does show it again after the delay.
14. Never shown on excluded pages; shows on the next allowed page after navigating away from one.
15. Held back while the user is typing in an input, and when another dialog is open.
16. Escape and the close button dismiss; the primary link goes to the tool route with the UTM parameters.
17. No overlap with existing floating elements at desktop and at 375px mobile width; reduced-motion removes animation.

---

## 5. ENVIRONMENT VARIABLES TO DOCUMENT

List every new variable with a one-line purpose and a safe default: `RATE_LIMIT_SECRET` (required, random string), the Redis connection variables, `RATE_LIMIT_ALLOWLIST`, `GEN_LIMIT_PER_WINDOW`, `GEN_WINDOW_SECONDS`, `UNKNOWN_IP_LIMIT`, `GLOBAL_DAILY_GENERATION_CAP`. Add them to the project's example env file.

---

## 6. ORDER OF WORK

1. Report inspection findings and a short plan (section 0, rule 1). Continue without waiting.
2. Build the limiter module: IP extraction and normalisation, hashing, atomic reserve and release, fallback, config. Unit-test it.
3. Wire it into the generate endpoint before the AI call, with reserve, release on failure, headers, 429 body and the success `rate_limit` object. Add the status endpoint.
4. Add the front-end handling: status call on entry, the limit message, answers kept on 429, the "free maps left" line.
5. Build the pop-up component, config file, and analytics events. Mount it once in the root layout.
6. Check collisions with existing floating UI on desktop and mobile.
7. Write and run all tests from section 4, fix failures.
8. Summarise: what changed, files, env variables, judgment calls (especially the proxy header choice, store choice, and pop-up placement).

If any instruction here would break existing behaviour or conflict with what you find, stop and describe the conflict in one short message instead of guessing.
