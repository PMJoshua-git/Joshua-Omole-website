import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleHealthRequest } from '../server/clarity-map/health.js';
import {
  getFallbackGeminiModel,
  getPrimaryGeminiModel,
  isTransientGeminiError,
  normalizeGeminiOutputForV2,
} from '../server/clarity-map/ai/geminiAnalyzer.js';
import { validateClarityMapAnalysis } from '../features/clarity-map/schemas/analysis-result.schema.js';
import { computeVolumeContext } from '../features/clarity-map/services/volumeContext.js';
import {
  analyzeWorkflow,
  HighDemandError,
  RateLimitError,
} from '../features/clarity-map/services/clarityMapApi.js';
import {
  handleSaveContactRequest,
  handleSubscribeRequest,
} from '../server/leads/handlers.js';
import { createApiApp } from '../server/apiApp.js';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as any,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
    send(data: any) {
      res.body = data;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

const dummySubmission = {
  industry: 'Professional Services',
  industry_id: 'professional_services',
  process_code: 'CLIENT_ONBOARDING',
  process_name: 'Client Onboarding',
  questionnaire_version: 2,
  answers: [
    {
      question_id: 'q1',
      question_text: 'How do clients sign up?',
      answer: 'Email and spreadsheet',
    },
  ],
};

test('Task A3: /api/clarity-map/health enforces DIAGNOSTICS_TOKEN and omits secret values', async () => {
  const prevDiag = process.env.DIAGNOSTICS_TOKEN;
  const prevGemini = process.env.GEMINI_API_KEY;
  try {
    delete process.env.DIAGNOSTICS_TOKEN;
    const resNoEnv = createMockRes();
    await handleHealthRequest({ method: 'GET', headers: { 'x-diagnostics-token': 'abc' } }, resNoEnv);
    assert.equal(resNoEnv.statusCode, 404);

    process.env.DIAGNOSTICS_TOKEN = 'super-secret-diag-token';
    process.env.GEMINI_API_KEY = 'AIzaFakeSecretValueDoNotLeak';

    const resMissingHeader = createMockRes();
    await handleHealthRequest({ method: 'GET', headers: {} }, resMissingHeader);
    assert.equal(resMissingHeader.statusCode, 404);

    const resWrongHeader = createMockRes();
    await handleHealthRequest(
      { method: 'GET', headers: { 'x-diagnostics-token': 'wrong-token' } },
      resWrongHeader
    );
    assert.equal(resWrongHeader.statusCode, 404);

    const resOk = createMockRes();
    await handleHealthRequest(
      { method: 'GET', headers: { 'x-diagnostics-token': 'super-secret-diag-token' } },
      resOk,
      {
        pingGemini: async () => ({
          ok: true,
          status: 200,
          code: null,
          errorClass: null,
          ms: 42,
        }),
      }
    );
    assert.equal(resOk.statusCode, 200);
    assert.equal(resOk.body.nodeVersion, process.version);
    assert.equal(resOk.body.env.GEMINI_API_KEY, true);
    assert.equal(typeof resOk.body.env.RESEND_API_KEY, 'boolean');
    assert.equal(resOk.body.gemini.ok, true);
    const serialized = JSON.stringify(resOk.body);
    assert.ok(!serialized.includes('AIzaFakeSecretValueDoNotLeak'));
    assert.ok(!serialized.includes('super-secret-diag-token'));
  } finally {
    if (prevDiag === undefined) delete process.env.DIAGNOSTICS_TOKEN;
    else process.env.DIAGNOSTICS_TOKEN = prevDiag;
    if (prevGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = prevGemini;
  }
});

test('Task A4: model env resolution reads GEMINI_MODEL and optional GEMINI_FALLBACK_MODEL', () => {
  const prevModel = process.env.GEMINI_MODEL;
  const prevFallback = process.env.GEMINI_FALLBACK_MODEL;
  try {
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_FALLBACK_MODEL;
    assert.equal(getPrimaryGeminiModel(), 'gemini-4-hydrogen');
    assert.equal(getFallbackGeminiModel(), null);

    process.env.GEMINI_MODEL = 'gemini-4-neon';
    process.env.GEMINI_FALLBACK_MODEL = 'gemini-4-hydrogen';
    assert.equal(getPrimaryGeminiModel(), 'gemini-4-neon');
    assert.equal(getFallbackGeminiModel(), 'gemini-4-hydrogen');

    assert.equal(
      isTransientGeminiError(
        new Error('GEMINI_CALL_TIMEOUT: generateContent(gemini-4-hydrogen) exceeded 35000ms')
      ),
      false
    );
    assert.equal(isTransientGeminiError({ status: 503, message: 'UNAVAILABLE' }), true);
  } finally {
    if (prevModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = prevModel;
    if (prevFallback === undefined) delete process.env.GEMINI_FALLBACK_MODEL;
    else process.env.GEMINI_FALLBACK_MODEL = prevFallback;
  }
});

test('Task A5: analyzeWorkflow maps non-JSON 504 and 5xx cleanly while preserving 429 and 503 high_demand', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () =>
      new Response('<html>Gateway Timeout</html>', {
        status: 504,
        headers: { 'Content-Type': 'text/html' },
      })) as any;
    await assert.rejects(
      () => analyzeWorkflow(dummySubmission as any),
      /The analysis took longer than expected\. Please try again\./
    );

    globalThis.fetch = (async () =>
      new Response('<html>Function Invocation Failed</html>', {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })) as any;
    await assert.rejects(
      () => analyzeWorkflow(dummySubmission as any),
      /Something went wrong on our side\. Please try again in a moment\./
    );

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'rate_limited', limit: 2, remaining: 0 }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })) as any;
    await assert.rejects(() => analyzeWorkflow(dummySubmission as any), RateLimitError);

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: 'high_demand' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })) as any;
    await assert.rejects(() => analyzeWorkflow(dummySubmission as any), HighDemandError);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Task C: save-contact enforces Airtable table/field allowlists and fails cleanly in production', async () => {
  const prevEnv = process.env.VERCEL_ENV;
  const prevKey = process.env.AIRTABLE_API_KEY;
  const prevBase = process.env.AIRTABLE_BASE_ID;
  try {
    // Disallow unknown table
    const badTableRes = createMockRes();
    await handleSaveContactRequest(
      { method: 'POST', body: { tableName: 'SecretTable', fields: { Email: 'a@b.com' } } },
      badTableRes
    );
    assert.equal(badTableRes.statusCode, 400);

    // Disallow unknown field
    const badFieldRes = createMockRes();
    await handleSaveContactRequest(
      { method: 'POST', body: { tableName: 'Leads', fields: { EvilColumn: 'x' } } },
      badFieldRes
    );
    assert.equal(badFieldRes.statusCode, 400);

    // Non-production preview mock allowed when keys missing
    delete process.env.VERCEL_ENV;
    delete process.env.AIRTABLE_API_KEY;
    delete process.env.AIRTABLE_BASE_ID;
    const previewRes = createMockRes();
    await handleSaveContactRequest(
      { method: 'POST', body: { name: 'Ada', email: 'ada@example.com' } },
      previewRes
    );
    assert.equal(previewRes.statusCode, 200);
    assert.equal(previewRes.body.mock, true);

    // Production returns 503 when Airtable env missing
    process.env.VERCEL_ENV = 'production';
    const prodMissingRes = createMockRes();
    await handleSaveContactRequest(
      { method: 'POST', body: { name: 'Ada', email: 'ada@example.com' } },
      prodMissingRes
    );
    assert.equal(prodMissingRes.statusCode, 503);
    assert.equal(prodMissingRes.body.success, false);
  } finally {
    if (prevEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevEnv;
    if (prevKey === undefined) delete process.env.AIRTABLE_API_KEY;
    else process.env.AIRTABLE_API_KEY = prevKey;
    if (prevBase === undefined) delete process.env.AIRTABLE_BASE_ID;
    else process.env.AIRTABLE_BASE_ID = prevBase;
  }
});

test('Task C: subscribe returns 503/502 in production and mock only when VERCEL_ENV !== production', async () => {
  const prevEnv = process.env.VERCEL_ENV;
  const prevKey = process.env.LOOPS_API_KEY;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.VERCEL_ENV;
    delete process.env.LOOPS_API_KEY;
    const previewRes = createMockRes();
    await handleSubscribeRequest({ method: 'POST', body: { email: 'ada@example.com' } }, previewRes);
    assert.equal(previewRes.statusCode, 200);
    assert.equal(previewRes.body.mock, true);

    process.env.VERCEL_ENV = 'production';
    const prodMissingRes = createMockRes();
    await handleSubscribeRequest({ method: 'POST', body: { email: 'ada@example.com' } }, prodMissingRes);
    assert.equal(prodMissingRes.statusCode, 503);
    assert.equal(prodMissingRes.body.success, false);

    process.env.LOOPS_API_KEY = 'test-loops-key';
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ message: 'Invalid key' }), { status: 401 })) as any;
    const prodRejectRes = createMockRes();
    await handleSubscribeRequest({ method: 'POST', body: { email: 'ada@example.com' } }, prodRejectRes);
    assert.equal(prodRejectRes.statusCode, 502);
    assert.equal(prodRejectRes.body.success, false);
  } finally {
    globalThis.fetch = originalFetch;
    if (prevEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevEnv;
    if (prevKey === undefined) delete process.env.LOOPS_API_KEY;
    else process.env.LOOPS_API_KEY = prevKey;
  }
});

test('Task B: ported Express app serves /api/resources and returns 503 in production when Airtable handles are null', async () => {
  const prevEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = 'production';
  const app = createApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const resResources = await fetch(`${baseUrl}/api/resources`);
    assert.equal(resResources.status, 200);
    const resourcesBody = await resResources.json();
    assert.ok(Array.isArray(resourcesBody));

    const resTraining = await fetch(`${baseUrl}/api/training-sessions`);
    assert.equal(resTraining.status, 503);

    const resBook = await fetch(`${baseUrl}/api/book-consultation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Ada',
        email: 'ada@example.com',
        company: 'Acme Ops',
        companySize: '10-50',
        businessGoal: 'Automate manual onboarding handoffs cleanly',
      }),
    });
    assert.equal(resBook.status, 503);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (prevEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = prevEnv;
  }
});

test('Task A6: normalizeGeminiOutputForV2 repairs null automation objects on automated_state nodes', () => {
  const rawOutput = {
    schema_version: 2,
    meta: {
      industry: 'E-commerce',
      process_code: 'EC-01',
      process_name: 'Order Fulfillment',
      questionnaire_version: '2',
      analysis_version: '2.0.0',
    },
    confidence: 'high',
    summary: {
      headline: 'Standardise order intake before automating tracking updates',
      paragraph: 'Orders enter through multiple channels before fulfillment starts.',
    },
    current_state: {
      nodes: [
        {
          id: 'c1',
          label: 'Order arrives',
          type: 'task',
          actor: 'Ops Coordinator',
          tool: 'Shopify',
          time_min: 5,
          time_max: 10,
          next: ['c2'],
          edges: [{ to: 'c2', label: '' }],
          pain_flags: ['no_owner'],
          inferred: false,
          evidence: ['Manual order check'],
        },
        {
          id: 'c2',
          label: 'Order shipped',
          type: 'end',
          actor: 'Warehouse Lead',
          tool: 'Carrier Portal',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          pain_flags: [],
          inferred: false,
          evidence: [],
        },
      ],
      visibility_gaps: ['No live order queue view'],
    },
    bridge_diagnosis: {
      B: { score: 2, finding: 'Hand-offs are informal.', evidence: [] },
      R: { score: 2, finding: 'Rules live in chat.', evidence: [] },
      I: { score: 2, finding: 'Intake arrives from two inboxes.', evidence: [] },
      D: { score: 2, finding: 'No single tracker.', evidence: [] },
      G: { score: 2, finding: 'No owner sign-off.', evidence: [] },
      E: { score: 2, finding: 'No weekly review.', evidence: [] },
    },
    redesigned_state: {
      nodes: [
        {
          id: 'r1',
          label: 'Log order in single queue',
          type: 'task',
          actor: 'Ops Coordinator',
          tool: 'Shared Tracker',
          time_min: 3,
          time_max: 5,
          next: ['r2'],
          edges: [{ to: 'r2', label: '' }],
          change_type: 'standardised',
          bridge_letter: 'D',
          replaces: ['c1'],
          rationale: 'Keeps every incoming order visible.',
        },
        {
          id: 'r2',
          label: 'Order complete',
          type: 'end',
          actor: 'Warehouse Lead',
          tool: 'Shared Tracker',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          change_type: 'unchanged',
          bridge_letter: 'B',
          replaces: ['c2'],
          rationale: 'Marks clear fulfillment completion.',
        },
      ],
      removed: [],
      rules_introduced: ['Every paid order enters the single tracker before picking'],
    },
    automated_state: {
      status: 'limited',
      reason: 'Automate confirmation status while warehouse packing stays human.',
      revisit_when: 'When daily orders exceed 50.',
      nodes: [
        {
          id: 'a1',
          label: 'Pack order manually',
          type: 'task',
          actor: 'Warehouse Lead',
          tool: 'Shared Tracker',
          time_min: 5,
          time_max: 10,
          next: ['a2'],
          edges: [{ to: 'a2', label: '' }],
          automation: null,
          from: ['r1'],
        },
        {
          id: 'a2',
          label: 'Order complete',
          type: 'end',
          actor: 'Warehouse Lead',
          tool: 'Shared Tracker',
          time_min: null,
          time_max: null,
          next: [],
          edges: [],
          automation: null,
          from: ['r2'],
        },
      ],
      not_automated: [],
    },
    time_estimate: {
      runs_per_week: { min: 15, max: 25 },
      hours_per_week: {
        current: { min: 4, max: 6 },
        redesigned: { min: 2, max: 3 },
        automated: { min: 1.5, max: 2.5 },
      },
      redesign_share_percent: { min: 60, max: 70 },
      assumptions: ['Assumes consistent volume across weekdays.'],
      caveat: 'Based on estimated times per run.',
    },
    bottlenecks: [
      { title: 'Split order intake', why_it_matters: 'Causes missed picks.', step_ids: ['c1'], bridge_letter: 'I' },
      { title: 'Missing owner rule', why_it_matters: 'Creates idle delays.', step_ids: ['c1'], bridge_letter: 'G' },
      { title: 'No status view', why_it_matters: 'Requires manual checks.', step_ids: ['c1'], bridge_letter: 'D' },
    ],
    quick_wins: [
      { action: 'Create one order status board', step_ids: ['c1'], needs_new_software: false, time_to_do: 'half a day' },
    ],
    automation_opportunities: [
      {
        name: 'Order confirmation status email',
        effort: 'low',
        impact: 'medium',
        step_ids: ['r1'],
        verdict: 'worth_it_now',
        why_this_volume: 'Suited to moderate weekly order volume.',
        revisit_when: null,
      },
    ],
    implementation_order: [
      { week: 1, focus: 'Baseline current order timing', actions: ['Measure handling times'], includes_baseline: true },
      { week: 2, focus: 'Standardise intake queue', actions: ['Consolidate into one board'], includes_baseline: false },
      { week: 3, focus: 'Assign dispatch owners', actions: ['Set daily cutoff checks'], includes_baseline: false },
      { week: 4, focus: 'Turn on status alert', actions: ['Enable customer notification'], includes_baseline: false },
    ],
    readiness: { score_percent: 62, band: 'Developing' },
    crm_tags: {
      industry: 'E-commerce',
      process_code: 'EC-01',
      readiness_band: 'Developing',
      top_bottleneck_bridge_letter: 'I',
      volume_band: 'medium',
    },
    cta: 'Book a systems audit to review your order workflow.',
  };

  const volumeContext = computeVolumeContext([]);
  const normalized = normalizeGeminiOutputForV2(rawOutput, dummySubmission as any, volumeContext);
  const check = validateClarityMapAnalysis(normalized, { volumeContext, strictV2: true });
  assert.equal(check.valid, true, `Expected valid analysis, got: ${check.errors.join('; ')}`);
});
