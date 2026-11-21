import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { handleHealthRequest } from '../server/clarity-map/health.js';
import {
  getFallbackGeminiModel,
  getPrimaryGeminiModel,
} from '../server/clarity-map/ai/geminiAnalyzer.js';
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
