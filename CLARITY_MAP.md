# Clarity Map — Architecture & Operations Guide

Clarity Map is an interactive business workflow diagnostic and three-stage transformation tool integrated into **JoshuaOmole.com** at `/clarity-map`.

## 1. Architecture Overview

- **No Database Required**: All 12 industries, 48 processes, common operational baseline questions, and conditional follow-up rules live as versioned JSON definitions inside `/features/clarity-map/data/`. Active user sessions persist locally in browser `sessionStorage` (`clarity_map_session_v1`).
- **Operations-First 3-Stage Model**:
  1. **Current (`CURRENT`)**: Mirrors the user's actual process from their answers, marking inferred handoffs transparently as `Inferred` and surfacing `visibility_gaps`.
  2. **Redesigned (`REDESIGNED`)**: Improves the workflow **without adding paid software**, following the fixed order `remove → merge → reorder → standardise → assign → rules`, tagged by the B.R.I.D.G.E. framework.
  3. **Automated (`AUTOMATED`)**: Builds targeted automation on top of Stage 2 while keeping judgement, clinical, KYC, credit, and legal decisions human-led (max 2 `assisted_by_ai` steps, never using `"AI"` in node labels).
- **Single Source of Truth**: Both the interactive web visualization (`/components/clarity-map/WorkflowResultsView.tsx`) and the multi-page PDF report (`/server/clarity-map/reports/generatePdf.ts`) render deterministically from one validated `ClarityMapResult` JSON payload.

## 2. Key Files & Modules

- **Data & Process Library**:
  - `/features/clarity-map/data/industries.json` (12 industries; Healthcare & Financial Services flagged `regulated: true`)
  - `/features/clarity-map/data/common-questions.json` (Common questions `C1`, `C1b`, `C2`, `C3`, conditional `C3_master`, `C4`, conditional `C_approval_who`, `C5..C10`)
  - `/features/clarity-map/data/processes/*.json` (12 industry files × 4 processes = 48 processes)
  - `/features/clarity-map/services/processLibrary.ts`
- **Schemas & Validation**:
  - `/features/clarity-map/schemas/questionnaire.schema.ts` (Zod validation + PII sanitization before Gemini calls)
  - `/features/clarity-map/schemas/analysis-result.schema.ts` (Strict schema, cross-stage ID lineage checks, `"AI"` label guard, deterministic `computeReadiness` & `computeRedesignShare`)
- **Server Endpoints (`/server/clarity-map/`)**:
  - `POST /api/clarity-map/analyze` — Rate-limited endpoint calling Gemini (`gemini-4-hydrogen`, server-side only) with bounded repair pass on malformed output.
  - `POST /api/clarity-map/report` — Validates compulsory `firstName` + `email`, creates/updates the contact in Loops (`userGroup: "Claritymap"`, non-optional), generates the multi-page PDF via `pdfkit`, and delivers the PDF exclusively via Resend email to the user plus internal notification to `Joshua@mail.joshuaomole.com` (no direct on-site PDF download).
- **Frontend UI (`/components/clarity-map/` & `/pages/ClarityMap.tsx`)**:
  - Single-page landing selector for all 12 industries + inline processes, guided questionnaire with inline step duration pills, pre-visual optional email capture modal (`Get the full report` requiring first name & email vs `Proceed to workflow alone`), and interactive visual map results view.

## 3. Environment Variables

All credentials are strictly server-side:

- `GEMINI_API_KEY`: Required for `POST /api/clarity-map/analyze`. Never exposed to client code.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`: Required for `POST /api/clarity-map/report` customer + internal email delivery.
- `LOOPS_API_KEY`: Required for `POST /api/clarity-map/report` to create/update leads in Loops under `userGroup: "Claritymap"` when requesting the full report.

## 4. Verification & Testing

Run the automated test suite:

```bash
npx tsx --test tests/clarity-map.test.ts
```

Run type-check and production build:

```bash
npm run lint
npm run build
```
