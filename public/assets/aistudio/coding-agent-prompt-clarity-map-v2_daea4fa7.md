# Coding Agent Prompt: Clarity Map v2 (analysis fixes + report redesign)

Paste everything below the line into your coding agent.

---

## 0. CONTEXT AND GROUND RULES

You are modifying an existing, working product called **The Clarity Map**. A visitor picks an industry and a process, answers guided questions (each step question has a time-range follow-up), submits, and gets (a) two or three process diagrams on screen and (b) an optional emailed PDF report. One AI call returns a validated JSON object. The screen diagrams and the PDF both render from that stored JSON. A BRIDGE framework (Baseline, Roles, Integrate, Data, Govern, Evolve) drives the diagnosis.

A sample generated report (Real Estate, "Property maintenance request", RE-03, 11 pages) exposed the problems listed below. Fix them without breaking what works.

**Hard rules**
1. **Inspect before editing.** Do not assume the stack. First locate and report back (briefly, in your first message): where the system prompt lives, where the output JSON schema/validator lives, where the diagram components live, how the PDF is generated (headless-browser HTML to PDF, react-pdf, or something else), and where the question registry lives.
2. **APPEND to the existing system prompt. Never replace or rewrite it.** The new rules in section 3 go in a separate constant (for example `SYSTEM_PROMPT_V2_APPENDIX`) concatenated after the existing prompt: `existingPrompt + "\n\n" + appendix`. If the new text conflicts with an old rule, the appendix wins, and it says so explicitly.
3. **Do NOT change:** the question set or the time-range follow-up capture; the readiness score calculation or how it is displayed; the BRIDGE lens definitions and scoring anchors; the email pop-up flow; CRM tagging; rate limiting; the existing time-estimate arithmetic. Leave them exactly as they are.
4. **Backward compatibility.** Records already stored (schema v1) must still render. Add `schema_version: 2` to new output. Every new field is optional for the renderer, with a sensible default, so old records do not crash it.
5. **Keep the retry-once-on-validation-failure behaviour.** Extend the validator, and append the specific validation errors to the retry message.
6. Work in small steps in the order given in section 9. Run tests after each step.

---

## 1. WHAT TO CHANGE (SUMMARY)

| # | Problem | Fix type |
|---|---------|----------|
| A | Automation is recommended without regard to how often the process runs | Code (volume context) + prompt appendix + schema + UI |
| B | Baseline timing sits in Week 4 of the roadmap | Prompt appendix + validator |
| C | Maps are linear; decision nodes have no branches | Schema + prompt appendix + validator + diagram renderer |
| D | Internal codes leak into the client-facing report (question IDs, step IDs, flag tokens) | Code-side sanitiser + prompt appendix + tests |
| E | "Inferred handoffs are marked" but nothing is marked | Renderer + validator |
| F | Report design: 11 pages, orphan pages, duplicate content, grid-style maps, buried CTA, run-on automation specs, "Not stated" noise | PDF and on-screen layout |

---

## 2. CODE-SIDE CHANGES (BEFORE THE MODEL IS CALLED)

### 2.1 Compute `volume_context` in code and send it to the model

The model must not infer volume from raw text. Compute it from the answers to the frequency question (C1) and the volume question (C1b), then add it to the model input JSON next to `industry`, `process_code`, `answers`:

```json
"volume_context": {
  "runs_per_week": { "min": 0, "max": 0 },
  "volume_band": "unknown | low | medium | high",
  "basis": "weekly | monthly | seasonal | per_project"
}
```

Rules:
- C1 = Daily / A few times a week / Weekly: C1b is a count per week.
- C1 = Monthly or Per project: C1b is a count per month. Divide min and max by about 4.3 to get per week.
- If the answers indicate a seasonal or irregular volume, or the period cannot be converted (for example "per season" with no season length), set `runs_per_week` to `null`, `basis` to `"seasonal"`, and `volume_band` to `"unknown"`.
- Bands, from `runs_per_week.max`: `low` below 10; `medium` 10 to 29; `high` 30 or more. **Put these two thresholds in one config constant** (`VOLUME_BAND_LOW_MAX = 10`, `VOLUME_BAND_HIGH_MIN = 30`) so they can be tuned without touching the prompt. The appendix refers to bands by name, never by number.
- This replaces any volume reasoning the model was doing itself. Remove nothing from the existing prompt, but the appendix tells the model to trust this object.

### 2.2 Question registry with plain-language labels

Create (or extend) a single registry that maps every question id in the live question set to a short plain label. Example entries:

```
RE03_Q1 -> "How requests arrive"
RE03_Q2 -> "How urgency is decided"
C1      -> "How often it runs"
C1b     -> "How many per week or month"
C2      -> "People involved"
C3      -> "Where information lives"
C4      -> "What goes wrong"
```

Derive labels for **every** question id the live tool uses (including the common-block ids beyond C5 that appeared in the sample report). If an id has no label, fall back to the generic phrase "your answers" and log a warning. The registry is used only by the renderer (section 5), never by the model.

### 2.3 Flag label dictionary

One dictionary used by the renderer. Raw flag tokens must never be displayed.

```
single_person_dependency -> "Depends on one person"
re_entry                 -> "Information re-typed"
waiting                  -> "Waiting time"
no_owner                 -> "No clear owner"
no_record                -> "No written record"
no_status                -> "No visible status"
rework_risk              -> "Risk of rework"
no_rule                  -> "No written rule"
no_review                -> "Never reviewed"
```

Unknown tokens: display nothing and log a warning.

---

## 3. SYSTEM PROMPT APPENDIX (APPEND AFTER THE EXISTING PROMPT, VERBATIM)

Add this as the constant `SYSTEM_PROMPT_V2_APPENDIX`. Use the text exactly as written. It contains no placeholders to fill in.

```
## 9. VERSION 2 UPDATES

These rules ADD to sections 1 to 8. Where a rule here conflicts with an earlier rule, THIS section wins. Output must now include "schema_version": 2.

### 9.1 Volume context (new input)

The input now contains "volume_context": { "runs_per_week": {min,max} or null, "volume_band": "unknown" | "low" | "medium" | "high", "basis": "weekly" | "monthly" | "seasonal" | "per_project" }. It was calculated by the system. Trust it. Do not recalculate or contradict it.

### 9.2 Volume gate on automation

This replaces the earlier test "or the step is on every run". A step may be automated only if it passes the earlier rule test AND the volume gate below.

- volume_band "high": automation as already described, up to 5 automations.
- volume_band "medium": at most 3 automations.
- volume_band "low" or "unknown": at most 2 automations, and only these types: "capture_form", "scheduled_reminder", "status_notification", "template_generation". Do not use "sync_between_systems", "payment_or_data_match", "dashboard_or_report", "rule_based_routing" or "approval_request" at low or unknown volume.
- If nothing is worth automating at this volume, set automated_state.status to "not_yet", leave automated_state.nodes empty, and explain why in automated_state.reason.
- automated_state.status values: "recommended" (high or medium volume), "limited" (low or unknown volume, one or two automations), "not_yet" (none).
- Never rate an automation's impact "high" when volume_band is "low" or "unknown". The maximum is "medium".
- When status is "not_yet", the Stage 3 hours equal the Stage 2 hours, and automated_state.revisit_when must say, in one plain sentence, when automation would start to make sense (for example "when you handle more than about 10 requests a week").
- Every item in automation_opportunities must include:
  - "verdict": "worth_it_now" or "worth_it_later",
  - "why_this_volume": one plain sentence tying it to the owner's volume (for example "At 11 to 25 requests a season, this would not pay back yet."),
  - "revisit_when": required when verdict is "worth_it_later".
- If the redesign already delivers most of the gain, say so honestly in the final sentence of summary.paragraph.

### 9.3 Baseline first in the roadmap

This changes the 4-week rule in section 7.
- Week 1 must include an action to measure how the process runs today: time each step across the next 5 to 10 real runs and record the times in the same tracker. Set implementation_order[0].includes_baseline to true.
- No later week may introduce the baseline for the first time.
- Order of weeks: Week 1 baseline, roles and intake. Week 2 rules and standards. Week 3 automation (only if automated_state.status is not "not_yet"; otherwise embed the new routine and run it). Week 4 review: compare the measured times and results with the Week 1 baseline.

### 9.4 Branching maps

Add "edges" to every node in all three stages: "edges": [ { "to": "<node id>", "label": "<short condition or empty string>" } ]. Keep "next" (ids only) as well; "edges" is authoritative.
- Every node with type "decision" must have at least two outgoing edges, each with a label of four words or fewer that states the condition (for example "Above spend limit", "Routine", "Urgent", "No").
- Branches must rejoin a later step or reach an "end" node.
- Add a node type "end". Each stage needs at least one "end" node. Use more than one only when real alternative endings exist.
- Do not invent decisions. A decision node must be supported by an answer. If no answer supports a branch, make it a "task" node instead.
- In Stage 2 and Stage 3, decisions should reflect the rules you introduced (for example "Within limit" and "Above limit" for a spend rule).

### 9.5 Reader-facing text

- Never include node ids (like c1, r2, a3), question ids (like RE03_Q1 or C4) or raw flag tokens (like no_record) inside any text meant for the reader: headline, paragraph, findings, rationale, reasons, actions, bottleneck text, rules, and all descriptions. Refer to steps by their names.
- Ids may appear only in these fields: id, edges.to, next, evidence, step_ids, replaces, from.
- Plain English. No acronyms except the BRIDGE letters.

### 9.6 Inferred steps

- Set "inferred": true on every node you add that no answer directly describes (for example an inferred handoff).
- Any node whose evidence array is empty must have inferred set to true.

### 9.7 Structured automation specification

Each automated node's "automation" object must now be structured. Every value is a short phrase of 20 words or fewer:

"automation": {
  "type": "",
  "description": "one-sentence summary",
  "function": "",
  "trigger": "",
  "input": "",
  "action": "",
  "exception_route": "",
  "owner": "",
  "human_checkpoint": ""
}

Use "none" for human_checkpoint only for pure notifications.

### 9.8 Schema additions (summary)

- schema_version: 2
- nodes[].edges (all stages)
- node type "end"
- automated_state.status, automated_state.reason, automated_state.revisit_when
- automation_opportunities[].verdict, why_this_volume, revisit_when
- automated_state.nodes[].automation: structured fields above
- implementation_order[0].includes_baseline
```

---

## 4. SCHEMA AND VALIDATOR CHANGES

Update the JSON schema (Zod or equivalent) for v2 and keep v1 parsing working.

New or changed fields:
- `schema_version: 2`
- All nodes: `edges: [{ to: string, label: string }]`; node `type` enum gains `"end"`.
- `automated_state.status: "recommended" | "limited" | "not_yet"`, `automated_state.reason: string | null`, `automated_state.revisit_when: string | null`.
- `automation_opportunities[]`: `verdict: "worth_it_now" | "worth_it_later"`, `why_this_volume: string`, `revisit_when: string | null`.
- `automated_state.nodes[].automation`: structured fields (function, trigger, input, action, exception_route, owner, human_checkpoint) plus existing `type`, `description`.
- `implementation_order[0].includes_baseline: boolean`.

Validation rules to add (on failure: retry once with the exact errors appended, then show the existing friendly fallback):
1. Every `edges[].to` and every `next` entry references an existing node id in the same stage.
2. Every node of type `decision` has two or more edges, and every edge from a decision node has a non-empty label.
3. Each stage has at least one `end` node, and every node can reach an `end` node (detect dead ends and cycles).
4. Any node with an empty `evidence` array has `inferred: true`. If the model forgot, set it in code rather than failing.
5. If `volume_band` is `low` or `unknown`: automated node count is 2 or fewer; none uses a type disallowed in section 3 (9.2); no opportunity has `impact: "high"`. Violation: fail and retry.
6. If `automated_state.status` is `not_yet`: `automated_state.nodes` is empty and `revisit_when` is non-empty.
7. `implementation_order[0].includes_baseline === true`, and no week 2 to 4 action is a first-time baseline (a simple check on week 1 containing a timing action is enough; do not build NLP for this).
8. Reader-facing strings contain no ids or tokens. Run these regexes over every reader-facing string field and fail on a match: `\b[cra]\d{1,2}\b` (step ids), `\b[A-Z]{2}\d{2}_Q\d+\b` (question ids), `\bC\d{1,2}b?\b` (common-block ids), `\b[a-z]+(_[a-z]+)+\b` (snake_case tokens).
9. Stage 2 must not have more nodes than Stage 1 plus 1 (one added control step is allowed). Keep the existing 12-node cap per stage.

The time arithmetic stays in code as it is today; do not touch it.

---

## 5. RENDERER CHANGES (SCREEN AND PDF, SHARED COMPONENTS)

Build one shared set of components used by both the on-screen results and the PDF so they cannot drift.

### 5.1 Step numbers instead of ids
- Never render node ids. Number steps 1, 2, 3 in flow order per stage.
- Where the report said "Steps: c2, c4, c5", render "Steps 2, 4, 5". Where it said "Replaces: c1", render "Replaces step 1 (Today)". Build a lookup from node id to display number per stage.

### 5.2 Evidence line
- In the PDF, drop the "Evidence: ..." lines entirely.
- On screen, show an optional small "Based on your answers about: How requests arrive, How urgency is decided" line (from the question registry, section 2.2), collapsed by default.

### 5.3 Flags as chips
- Render flags as small chips or icons using the flag label dictionary (section 2.3), placed on the node in the diagram. Include a one-line legend under the map.
- Remove the separate "Current Step Breakdown" section completely.

### 5.4 Inferred steps
- Render nodes with `inferred: true` with a dashed border and a small "Inferred" tag. Add a legend line under the map: "Dashed = we inferred this step from your answers. Please confirm it." If a stage has no inferred nodes, omit the legend.

### 5.5 Hide missing time data
- Show a time label on a node only if both `time_min` and `time_max` are present. Never print "Time not known" or "Not stated".
- On page 1, show a metric card (steps, hours) only if it has a value. Show step counts always; show hours only when available.
- If all time values are null, replace the whole time-and-estimates table with one short block: "We need one number to estimate your time savings: how long this takes from start to finish. Add it in the audit." Do not render a table of empty rows.

### 5.6 Automation stage states
- `recommended`: show the map and the table as designed in section 6.
- `limited`: show the map (1 or 2 nodes), the table, and a short note: "Only these steps are worth automating at your volume."
- `not_yet`: do not draw a map. Show a card titled "Automation: not yet" with `reason` and `revisit_when`, and keep the "Intentionally left manual" list. State clearly: "The redesign already delivers the gain."
- Each opportunity shows its verdict ("Worth it now" or "Worth it later") and `why_this_volume`.

---

## 6. DIAGRAM LAYOUT (WEB AND PDF)

Replace the current 3-column grid-of-boxes layout with a real flow diagram.

- Layered, top-to-bottom layout (a library such as dagre or ELK is fine, or SVG with a simple layered algorithm; choose what fits the existing stack). Main path runs down a central spine; branches fan out and rejoin.
- Decision nodes: diamond or visibly distinct shape; outgoing edges carry their labels.
- Consistent arrowheads. No arrows implied by position.
- Start and end markers. `wait` nodes use a distinct style. `handoff` nodes show a small handoff icon.
- Node content: step number, short label, actor, tool; optional time if present; flag chips; inferred styling.
- Stages 2 and 3 show a small BRIDGE letter badge on changed nodes, as in the current design; automated nodes show an automation-type tag.
- Max 12 nodes per diagram is already enforced; check the layout stays readable at 12 nodes with 2 decisions.
- On screen: keep the three stages as tabs or three stacked sections on mobile; side by side from tablet width up. The PDF shows one stage per page.

---

## 7. PDF STRUCTURE AND LAYOUT (TARGET: 6 PAGES OR FEWER, A4)

New page plan. Each numbered page starts on a new page, and each section stays together.

1. **Cover and summary.** Title, industry and process, readiness card (unchanged), executive summary, the three bottlenecks (all on this page, never split), short CTA strip ("Book a 30-minute Systems Clarity Audit").
2. **Stage 1: your process today.** Flow diagram, legend, "What we could not see" (visibility gaps).
3. **BRIDGE diagnosis.** The six lenses as today. No changes to content.
4. **Stage 2: improved first.** Flow diagram, then a compact list: for each change, one line "Step N: what changes, and why" combining the old rationale; then the operating rules and the removed activities, as short lists.
5. **Stage 3: automation.** Map (unless `not_yet`), the automation table (below), the "Intentionally left manual" list.
6. **Time, quick wins and roadmap.** Time block (only when data exists), quick wins, prioritised automation opportunities with verdicts, 4-week roadmap, and the full CTA with the audit link.

If a page would be under about 25% filled, pull its content onto the neighbouring page instead of leaving it nearly blank. If there is no time data, the time block disappears and page 6 shortens.

**Automation table (replaces the run-on paragraphs).** Columns: Automation | Trigger | Input, then action | If it fails | Human checkpoint. One row per automated node, using the structured fields from the schema. Wrap text inside cells; do not shrink below the minimum font size.

**Layout rules**
- Prevent splits: headings stay with their content; cards, table rows and list items never split across pages (`break-inside: avoid` and `break-after: avoid` on headings in a headless-browser PDF; `wrap={false}` and `break` props in react-pdf; use whatever the current PDF engine supports).
- Minimum body text 10 pt; no text below 8 pt anywhere.
- No raw ids, tokens or underscores anywhere in the output (the section 4 regex check also runs over the final rendered text of the PDF in the test suite).
- The short CTA sits right after the executive summary on page 1; the full CTA sits at the end. Both link to the audit page with the existing UTM tagging.
- Footer: report name, process code, and "Page X of Y" counted correctly after pagination.

---

## 8. ACCEPTANCE CRITERIA AND TESTS

Create fixtures from the sample report (Real Estate, RE-03) and from two more processes in different industries. Add automated tests:

1. **Schema:** v2 output validates; a v1 stored record still renders without errors.
2. **Volume gate:** with `volume_band: "unknown"` or `"low"`, the output has two or fewer automated nodes, none of the disallowed types, no "high" impact, and either `status: "limited"` or `"not_yet"`. With `"high"`, up to five automations are allowed.
3. **Not yet:** `status: "not_yet"` renders the "Automation: not yet" card, no map, and Stage 3 hours equal Stage 2.
4. **Roadmap:** Week 1 includes the baseline action; `includes_baseline` is true.
5. **Branches:** every decision node has two or more labelled edges; every node reaches an end; the diagram renders with labelled branches.
6. **No leaks:** the regex scan finds no step ids, question ids, common-block ids, or snake_case tokens in the rendered screen text or the PDF text.
7. **Inferred:** nodes with `inferred: true` (or empty evidence) render dashed with the "Inferred" tag and the legend appears; stages without inferred nodes show no legend.
8. **Hidden nulls:** with all times null, the PDF contains no "Not stated" and no "Time not known", and shows the "one number" block instead of an empty table.
9. **Layout:** the RE-03 fixture PDF is 6 pages or fewer; no page is less than 25% filled (render pages to images and measure the non-white area); no heading is the last element on a page; no table row splits across pages.
10. **Visual check:** export the PDF pages as images into a `/tmp` review folder so a human can eyeball them.

---

## 9. ORDER OF WORK

1. Report back with the inspection findings (section 0, rule 1) and a short plan. Do not wait for a reply; continue with step 2.
2. Add `volume_context` computation, the question registry, and the flag dictionary (section 2). Unit-test the volume bands, including the seasonal case ("11 to 25 per season" must give `unknown`).
3. Add the appendix constant and concatenate it after the existing system prompt (section 3). Do not edit the existing prompt text.
4. Extend the schema and validators (section 4); keep v1 rendering working.
5. Build the shared renderer pieces: step numbering, flag chips, inferred styling, hidden nulls, automation stage states (section 5).
6. Build the flow diagram layout (section 6) and use it for screen and PDF.
7. Rebuild the PDF layout to the page plan (section 7), including the automation table.
8. Write the tests (section 8), run them, fix failures.
9. Finish with a short summary: what changed, which files, any places where you made a judgment call, and anything you could not do.

If any rule in this prompt would break existing behaviour, stop and say so in one short message with the specific conflict instead of guessing.
