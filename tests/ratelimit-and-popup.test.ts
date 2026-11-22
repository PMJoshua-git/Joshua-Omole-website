import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { JSDOM } from 'jsdom';

import {
  createClarityMapRateLimiter,
  InMemorySlidingWindowStore,
  type SlidingWindowStore,
} from '../server/clarity-map/rateLimit/limiter';
import {
  hashIdentity,
  normalizeIp,
  resolveClientIdentity,
} from '../server/clarity-map/rateLimit/ip';
import type { RateLimitConfig } from '../server/clarity-map/rateLimit/config';
import {
  handleAnalyzeRequest,
  handleLimitStatusRequest,
  handleReportRequest,
} from '../server/clarity-map/handlers';
import {
  ClarityMapResult,
  QuestionnaireSubmission,
} from '../features/clarity-map/types/clarityMap';
import { POPUP_COPY, POPUP_DELAY_SECONDS } from '../features/clarity-map/config/popupConfig';
import ClarityMapPopup, {
  resetClarityPopupMemoryState,
} from '../components/ClarityMapPopup';
import FloatingAssistant from '../components/FloatingAssistant';
import { captureAttributionData, getAttributionData } from '../utils/attribution';
import { injectPageMetaIntoHtml, resolvePageMeta } from '../server/seo/pageMeta';
import fs from 'node:fs';
import path from 'node:path';

function makeTestConfig(overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return {
    genLimitPerWindow: 2,
    genWindowSeconds: 86400,
    unknownIpLimit: 10,
    globalDailyGenerationCap: 0,
    allowlist: [],
    secret: 'test-hmac-secret-32-chars-minimum-ok',
    redisUrl: 'https://fake-redis.upstash.io',
    redisToken: 'fake-token',
    isProduction: true,
    trustProxy: true,
    ...overrides,
  };
}

/**
 * Simulates atomic Redis Lua ZSET behavior (single-threaded synchronous mutation
 * per operation + microtask yield to stress 5-way concurrent Promise.all callers).
 */
class AtomicMockRedisStore implements SlidingWindowStore {
  public data = new Map<string, Array<{ member: string; score: number }>>();
  public failAll = false;

  async checkStatus(key: string, nowMs: number, windowMs: number) {
    if (this.failAll) throw new Error('ECONNREFUSED redis unreachable');
    const cutoff = nowMs - windowMs;
    const entries = (this.data.get(key) || [])
      .filter((e) => e.score > cutoff)
      .sort((a, b) => a.score - b.score);
    this.data.set(key, entries);
    return {
      count: entries.length,
      oldestScoreMs: entries[0]?.score ?? null,
    };
  }

  async reserveAtomic(
    key: string,
    nowMs: number,
    windowMs: number,
    limit: number,
    member: string
  ) {
    if (this.failAll) throw new Error('ECONNREFUSED redis unreachable');
    // Atomically read-modify-write before awaiting anything
    const cutoff = nowMs - windowMs;
    const entries = (this.data.get(key) || [])
      .filter((e) => e.score > cutoff)
      .sort((a, b) => a.score - b.score);

    if (entries.length >= limit) {
      this.data.set(key, entries);
      return {
        allowed: false,
        count: entries.length,
        oldestScoreMs: entries[0]?.score ?? null,
      };
    }

    const updated = [...entries, { member, score: nowMs }].sort(
      (a, b) => a.score - b.score
    );
    this.data.set(key, updated);
    // Simulate async network roundtrip AFTER atomic Lua execution
    await Promise.resolve();
    return {
      allowed: true,
      count: updated.length,
      oldestScoreMs: updated[0]?.score ?? nowMs,
    };
  }

  async release(key: string, member: string) {
    if (this.failAll) throw new Error('ECONNREFUSED redis unreachable');
    const entries = this.data.get(key);
    if (!entries) return;
    const next = entries.filter((e) => e.member !== member);
    if (next.length > 0) this.data.set(key, next);
    else this.data.delete(key);
  }
}

function makeValidSubmission(): QuestionnaireSubmission {
  return {
    industry: 'Real Estate',
    industry_id: 'real-estate',
    process_code: 'RE-01',
    process_name: 'Lead to Showing',
    questionnaire_version: 'v1',
    answers: [
      { qid: 'q1', question: 'Trigger?', answer: 'Web form', time_range: 'Under 15 min' },
      { qid: 'q2', question: 'Owner?', answer: 'Coordinator', time_range: '15–60 min' },
      { qid: 'q3', question: 'Weekly volume?', answer: '15 leads', time_range: null },
    ],
  };
}

function makeValidAnalysisResult(): ClarityMapResult {
  return {
    schema_version: '2.0',
    meta: {
      industry: 'Real Estate',
      industry_id: 'real-estate',
      process_code: 'RE-01',
      process_name: 'Lead to Showing',
    },
    confidence: 'High',
    summary: {
      headline: 'Lead response slows down at manual triage.',
      paragraph: 'Standardizing intake ownership cuts scheduling lag without new tools.',
    },
    readiness: {
      score_percent: 58,
      band: 'Developing',
      lenses: [
        {
          lens: 'Process clarity',
          score: 3,
          max: 5,
          summary: 'Steps are mostly known but undocumented.',
        },
      ],
    },
    time_estimate: {
      hours_per_week: {
        current: { min: 6, max: 9 },
        redesigned: { min: 3, max: 5 },
        automated: { min: 1.5, max: 3 },
      },
      assumptions: 'Based on 15 weekly inquiries.',
    },
    current_state: {
      nodes: [
        {
          id: 'c_start',
          label: 'Lead Arrives',
          owner: 'System',
          action: 'Web inquiry lands in shared inbox.',
          type: 'start',
          manual: false,
          pain_flags: [],
        },
        {
          id: 'c_step1',
          label: 'Manual Triage',
          owner: 'Coordinator',
          action: 'Copies details into spreadsheet.',
          type: 'step',
          manual: true,
          pain_flags: ['bottleneck'],
        },
        {
          id: 'c_end',
          label: 'Showing Booked',
          owner: 'Agent',
          action: 'Calendar invite sent.',
          type: 'end',
          manual: false,
          pain_flags: [],
        },
      ],
      edges: [
        { from: 'c_start', to: 'c_step1' },
        { from: 'c_step1', to: 'c_end' },
      ],
    },
    redesigned_state: {
      nodes: [
        {
          id: 'r_start',
          label: 'Structured Intake',
          owner: 'System',
          action: 'Required fields captured upfront.',
          type: 'start',
          manual: false,
          pain_flags: [],
        },
        {
          id: 'r_end',
          label: 'Same-Day Booking',
          owner: 'Agent',
          action: 'Agent sends direct booking link.',
          type: 'end',
          manual: false,
          pain_flags: [],
        },
      ],
      edges: [{ from: 'r_start', to: 'r_end' }],
    },
    automated_state: {
      status: 'worth_automating',
      reason: 'High weekly volume makes routing automation worthwhile.',
      revisit_when: '',
      not_automated: [],
      nodes: [
        {
          id: 'a_start',
          label: 'Auto-Routed Lead',
          owner: 'Automation',
          action: 'CRM tags and assigns agent automatically.',
          type: 'start',
          manual: false,
          pain_flags: [],
        },
        {
          id: 'a_end',
          label: 'Booked Automatically',
          owner: 'Automation',
          action: 'Instant calendar scheduling.',
          type: 'end',
          manual: false,
          pain_flags: [],
        },
      ],
      edges: [{ from: 'a_start', to: 'a_end' }],
    },
    bottlenecks: [
      {
        title: 'Inbox Triage Delay',
        impact: 'Slows response time by hours.',
        why: 'No single intake owner.',
      },
    ],
    quick_wins: ['Use a single routing rule for new leads.'],
    automation_opportunities: [
      {
        rank: 1,
        title: 'Auto-assign leads',
        why: 'Eliminates manual copying.',
        effort: 'Low',
      },
    ],
    implementation_plan: [
      {
        week: 1,
        focus: 'Intake standard',
        actions: ['Define required lead fields.'],
      },
    ],
  } as unknown as ClarityMapResult;
}

function makeMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: any = null;
  const res = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return res;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
  };
  return res;
}

// ── FEATURE 1 TESTS (1..10) ──

test('1. Two sequential generations succeed; third returns 429 with required headers and body', async () => {
  let now = Date.UTC(2026, 10, 15, 12, 0, 0);
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => now,
  });

  const req = { headers: { 'x-forwarded-for': '203.0.113.42' }, body: makeValidSubmission() };
  const fakeAnalysis = makeValidAnalysisResult();
  const analyzer = async () => fakeAnalysis;

  const r1 = makeMockResponse();
  await handleAnalyzeRequest(req, r1, { limiter, analyzer, trustProxy: true });
  assert.equal(r1.statusCode, 200);
  assert.equal(r1.body.rate_limit.limit, 2);
  assert.equal(r1.body.rate_limit.remaining, 1);

  now += 60_000;
  const r2 = makeMockResponse();
  await handleAnalyzeRequest(req, r2, { limiter, analyzer, trustProxy: true });
  assert.equal(r2.statusCode, 200);
  assert.equal(r2.body.rate_limit.remaining, 0);

  now += 60_000;
  const r3 = makeMockResponse();
  await handleAnalyzeRequest(req, r3, { limiter, analyzer, trustProxy: true });
  assert.equal(r3.statusCode, 429);
  assert.equal(r3.body.error, 'rate_limited');
  assert.equal(r3.body.limit, 2);
  assert.equal(r3.body.remaining, 0);
  assert.ok(r3.body.reset_at);
  assert.ok(r3.body.retry_after_seconds > 0);
  assert.ok(r3.headers['Retry-After']);
  assert.equal(r3.headers['RateLimit-Limit'], '2');
  assert.equal(r3.headers['RateLimit-Remaining'], '0');
  assert.ok(r3.headers['RateLimit-Reset']);
});

test('2. Five parallel requests from one IP allow exactly two (atomicity)', async () => {
  const now = Date.UTC(2026, 10, 15, 12, 0, 0);
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => now,
  });

  const req = { headers: { 'x-forwarded-for': '198.51.100.77' }, body: makeValidSubmission() };
  const analyzer = async () => makeValidAnalysisResult();

  const responses = await Promise.all(
    Array.from({ length: 5 }, async () => {
      const r = makeMockResponse();
      await handleAnalyzeRequest(req, r, { limiter, analyzer, trustProxy: true });
      return r;
    })
  );

  const okCount = responses.filter((r) => r.statusCode === 200).length;
  const limitedCount = responses.filter((r) => r.statusCode === 429).length;
  assert.equal(okCount, 2);
  assert.equal(limitedCount, 3);
});

test('3. Generation failing after reservation releases its slot so a subsequent request succeeds', async () => {
  const now = Date.UTC(2026, 10, 15, 12, 0, 0);
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => now,
  });

  const req = { headers: { 'x-forwarded-for': '198.51.100.88' }, body: makeValidSubmission() };

  const r1 = makeMockResponse();
  await handleAnalyzeRequest(req, r1, {
    limiter,
    analyzer: async () => makeValidAnalysisResult(),
    trustProxy: true,
  });
  assert.equal(r1.statusCode, 200);

  // Second request fails inside Gemini analyzer -> slot must be released
  const rFail = makeMockResponse();
  await handleAnalyzeRequest(req, rFail, {
    limiter,
    analyzer: async () => {
      throw new Error('Upstream Gemini failure');
    },
    trustProxy: true,
  });
  assert.equal(rFail.statusCode, 500);

  // Third request now succeeds because the failed attempt refunded its slot
  const r2 = makeMockResponse();
  await handleAnalyzeRequest(req, r2, {
    limiter,
    analyzer: async () => makeValidAnalysisResult(),
    trustProxy: true,
  });
  assert.equal(r2.statusCode, 200);
  assert.equal(r2.body.rate_limit.remaining, 0);
});

test('4. Internal validation-retry inside one submit consumes only one slot', async () => {
  const now = Date.UTC(2026, 10, 15, 12, 0, 0);
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => now,
  });

  let modelAttempts = 0;
  const retryingAnalyzer = async () => {
    // Simulate internal validation retry within a single analyzeWorkflowWithGemini call
    modelAttempts += 1;
    modelAttempts += 1;
    return makeValidAnalysisResult();
  };

  const req = { headers: { 'x-forwarded-for': '203.0.113.99' }, body: makeValidSubmission() };
  const r1 = makeMockResponse();
  await handleAnalyzeRequest(req, r1, { limiter, analyzer: retryingAnalyzer, trustProxy: true });
  assert.equal(r1.statusCode, 200);
  assert.equal(modelAttempts, 2);
  assert.equal(r1.body.rate_limit.remaining, 1);
});

test('5. Sliding window: after oldest entry ages past window, one new request succeeds and reset_at matches next oldest', async () => {
  const t0 = Date.UTC(2026, 10, 15, 10, 0, 0);
  let now = t0;
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig({ genWindowSeconds: 86400 }),
    store,
    now: () => now,
  });

  const req = { headers: { 'x-forwarded-for': '203.0.113.15' }, body: makeValidSubmission() };
  const analyzer = async () => makeValidAnalysisResult();

  // Request 1 at t0
  await handleAnalyzeRequest(req, makeMockResponse(), { limiter, analyzer, trustProxy: true });

  // Request 2 at t0 + 2 hours
  const twoHoursMs = 2 * 3600 * 1000;
  now = t0 + twoHoursMs;
  await handleAnalyzeRequest(req, makeMockResponse(), { limiter, analyzer, trustProxy: true });

  // Blocked at t0 + 12 hours; reset_at equals t0 + 24 hours
  now = t0 + 12 * 3600 * 1000;
  const blocked = makeMockResponse();
  await handleAnalyzeRequest(req, blocked, { limiter, analyzer, trustProxy: true });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.reset_at, new Date(t0 + 86400 * 1000).toISOString());

  // Advance just past t0 + 24 hours -> Request 1 aged out, Request 2 remains (reset_at = t0 + 26h)
  now = t0 + 86400 * 1000 + 1000;
  const nextOk = makeMockResponse();
  await handleAnalyzeRequest(req, nextOk, { limiter, analyzer, trustProxy: true });
  assert.equal(nextOk.statusCode, 200);
  assert.equal(nextOk.body.rate_limit.remaining, 0);
  assert.equal(
    nextOk.body.rate_limit.reset_at,
    new Date(t0 + twoHoursMs + 86400 * 1000).toISOString()
  );
});

test('6. IPv6 /64 prefix grouping and IPv4-mapped IPv6 normalization match canonical IPv4', async () => {
  assert.equal(normalizeIp('::ffff:203.0.113.5'), '203.0.113.5');
  assert.equal(normalizeIp('203.0.113.5:54321'), '203.0.113.5');

  const prefixA = normalizeIp('2001:db8:85a3:0001::10');
  const prefixB = normalizeIp('2001:0db8:85a3:1:abcd:ef01:2345:6789');
  assert.equal(prefixA, prefixB);
  assert.equal(prefixA, '2001:0db8:85a3:0001::/64');

  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => Date.UTC(2026, 10, 15, 12, 0, 0),
  });

  const analyzer = async () => makeValidAnalysisResult();
  const r1 = makeMockResponse();
  await handleAnalyzeRequest(
    { headers: { 'x-forwarded-for': '2001:db8:85a3:1::10' }, body: makeValidSubmission() },
    r1,
    { limiter, analyzer, trustProxy: true }
  );
  const r2 = makeMockResponse();
  await handleAnalyzeRequest(
    { headers: { 'x-forwarded-for': '2001:db8:85a3:1::9999' }, body: makeValidSubmission() },
    r2,
    { limiter, analyzer, trustProxy: true }
  );
  const r3 = makeMockResponse();
  await handleAnalyzeRequest(
    { headers: { 'x-forwarded-for': '2001:db8:85a3:1:ffff::1' }, body: makeValidSubmission() },
    r3,
    { limiter, analyzer, trustProxy: true }
  );
  assert.equal(r1.statusCode, 200);
  assert.equal(r2.statusCode, 200);
  assert.equal(r3.statusCode, 429);
});

test('7. Allowlisted IP is never limited; store outage fails open and falls back to in-memory limiter', async () => {
  const store = new AtomicMockRedisStore();
  const loggedErrors: string[] = [];
  const logger = {
    warn: () => {},
    error: (msg: string) => loggedErrors.push(msg),
  };

  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig({ allowlist: ['198.51.100.1'] }),
    store,
    fallbackStore: new InMemorySlidingWindowStore(),
    now: () => Date.UTC(2026, 10, 15, 12, 0, 0),
    logger,
  });

  for (let i = 0; i < 4; i++) {
    const res = await limiter.reserveGenerationSlot({
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });
    assert.equal(res.allowed, true);
  }

  // Simulate Redis outage for a normal IP -> fails open using in-memory fallback
  store.failAll = true;
  const f1 = await limiter.reserveGenerationSlot({
    headers: { 'x-forwarded-for': '203.0.113.55' },
  });
  const f2 = await limiter.reserveGenerationSlot({
    headers: { 'x-forwarded-for': '203.0.113.55' },
  });
  const f3 = await limiter.reserveGenerationSlot({
    headers: { 'x-forwarded-for': '203.0.113.55' },
  });
  assert.equal(f1.allowed, true);
  assert.equal(f2.allowed, true);
  assert.equal(f3.allowed, false);
  assert.ok(loggedErrors.some((m) => m.includes('in-memory fallback')));
});

test('8. Status endpoint returns accurate remaining count and never consumes a slot', async () => {
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => Date.UTC(2026, 10, 15, 12, 0, 0),
  });

  const req = { headers: { 'x-forwarded-for': '203.0.113.66' }, body: makeValidSubmission() };

  for (let i = 0; i < 4; i++) {
    const statusRes = makeMockResponse();
    await handleLimitStatusRequest(req, statusRes, { limiter, trustProxy: true });
    assert.equal(statusRes.statusCode, 200);
    assert.equal(statusRes.body.remaining, 2);
    assert.equal(statusRes.body.limited, false);
  }

  await handleAnalyzeRequest(req, makeMockResponse(), {
    limiter,
    analyzer: async () => makeValidAnalysisResult(),
    trustProxy: true,
  });

  const afterOne = makeMockResponse();
  await handleLimitStatusRequest(req, afterOne, { limiter, trustProxy: true });
  assert.equal(afterOne.body.remaining, 1);
  assert.equal(afterOne.body.limited, false);
  assert.ok(afterOne.body.reset_at);
});

test('9. Raw IPs never appear in stored keys or logs', async () => {
  const rawIp = '203.0.113.204';
  const store = new AtomicMockRedisStore();
  const logs: string[] = [];
  const logger = {
    warn: (msg: string) => logs.push(String(msg)),
    error: (msg: string) => logs.push(String(msg)),
  };

  const config = makeTestConfig();
  const limiter = createClarityMapRateLimiter({
    config,
    store,
    now: () => Date.UTC(2026, 10, 15, 12, 0, 0),
    logger,
  });

  const identity = resolveClientIdentity(
    { headers: { 'x-forwarded-for': rawIp } },
    { secret: config.secret, trustProxy: true }
  );
  assert.equal(
    identity.redisKey,
    hashIdentity(rawIp, config.secret).redisKey
  );

  for (let i = 0; i < 3; i++) {
    await limiter.reserveGenerationSlot({ headers: { 'x-forwarded-for': rawIp } });
  }

  for (const key of store.data.keys()) {
    assert.equal(key.includes(rawIp), false);
    assert.ok(key.startsWith('gen:'));
  }
  assert.ok(logs.length > 0);
  for (const line of logs) {
    assert.equal(line.includes(rawIp), false);
  }
});

test('10. Generating the emailed PDF for an existing result consumes 0 generation slots', async () => {
  const store = new AtomicMockRedisStore();
  const limiter = createClarityMapRateLimiter({
    config: makeTestConfig(),
    store,
    now: () => Date.UTC(2026, 10, 15, 12, 0, 0),
  });

  const ipHeader = { 'x-forwarded-for': '203.0.113.120' };
  const before = makeMockResponse();
  await handleLimitStatusRequest({ headers: ipHeader }, before, { limiter, trustProxy: true });
  assert.equal(before.body.remaining, 2);

  // Trigger report endpoint (missing external Loops key cleanly returns 503 after validation, without touching rate limiter)
  const reportRes = makeMockResponse();
  await handleReportRequest(
    {
      headers: ipHeader,
      body: {
        firstName: 'Ada',
        email: 'ada@example.com',
        analysis: makeValidAnalysisResult(),
      },
    },
    reportRes
  );
  assert.notEqual(reportRes.statusCode, 429);

  const after = makeMockResponse();
  await handleLimitStatusRequest({ headers: ipHeader }, after, { limiter, trustProxy: true });
  assert.equal(after.body.remaining, 2);
});

// ── FEATURE 2 POP-UP TESTS (11..17) ──

function setupDomEnvironment(options: { reducedMotion?: boolean; width?: number; height?: number } = {}) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'https://joshuaomole.com/',
  });

  const width = options.width ?? 1280;
  const height = options.height ?? 800;
  const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  (globalThis as any).window = dom.window;
  (globalThis as any).document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
  (globalThis as any).HTMLElement = dom.window.HTMLElement;
  (globalThis as any).CustomEvent = dom.window.CustomEvent;
  (globalThis as any).Event = dom.window.Event;
  (globalThis as any).KeyboardEvent = dom.window.KeyboardEvent;
  (globalThis as any).localStorage = dom.window.localStorage;
  (globalThis as any).sessionStorage = dom.window.sessionStorage;
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  Object.defineProperty(dom.window.document, 'hidden', { value: false, configurable: true });
  Object.defineProperty(dom.window.document, 'visibilityState', {
    value: 'visible',
    configurable: true,
  });

  Object.defineProperty(dom.window, 'innerWidth', { value: width, configurable: true });
  Object.defineProperty(dom.window, 'innerHeight', { value: height, configurable: true });
  dom.window.matchMedia = (query: string) =>
    ({
      matches: query.includes('prefers-reduced-motion') ? Boolean(options.reducedMotion) : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as any;

  dom.window.requestAnimationFrame = (cb: FrameRequestCallback) =>
    globalThis.setTimeout(() => cb(Date.now()), 0) as unknown as number;
  dom.window.cancelAnimationFrame = (id: number) => globalThis.clearTimeout(id);
  (globalThis as any).requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  (globalThis as any).cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);

  return {
    dom,
    cleanup: () => {
      dom.window.close();
      delete (globalThis as any).window;
      delete (globalThis as any).document;
      if (originalNavigatorDesc) {
        Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
      }
    },
  };
}

function setDocumentHidden(doc: Document, hidden: boolean) {
  Object.defineProperty(doc, 'hidden', { value: hidden, configurable: true });
  Object.defineProperty(doc, 'visibilityState', {
    value: hidden ? 'hidden' : 'visible',
    configurable: true,
  });
  doc.dispatchEvent(new window.Event('visibilitychange'));
}

test('11-17. Promotional Pop-up behavior, visibility timer, exclusions, hold-backs, accessibility, UTMs, collisions, and reduced motion', async (t) => {
  // Subtest 11 & 12: Delay + visibilitychange pause
  {
    resetClarityPopupMemoryState();
    const env = setupDomEnvironment();
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    const container = document.getElementById('root')!;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(ClarityMapPopup)
        )
      );
    });

    // Not shown before 25s
    await act(async () => {
      t.mock.timers.tick((POPUP_DELAY_SECONDS - 1) * 1000);
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Hide tab for 60s -> timer pauses, so still not shown
    await act(async () => {
      setDocumentHidden(document, true);
      t.mock.timers.tick(60_000);
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Unhide tab and advance remaining 1s -> shown!
    await act(async () => {
      setDocumentHidden(document, false);
      t.mock.timers.tick(1000);
    });
    assert.equal(POPUP_DELAY_SECONDS, 5);
    const popup = document.querySelector('[data-testid="clarity-map-popup"]');
    assert.ok(popup, 'Popup should render after 5s visible time');
    assert.equal(popup.getAttribute('role'), 'dialog');
    assert.equal(popup.getAttribute('aria-modal'), 'true');
    assert.equal(popup.textContent?.includes(POPUP_COPY.heading), true);
    assert.equal(/AI\b/i.test(popup.textContent || ''), false);

    // Verify no localStorage, sessionStorage, or cookies written by popup
    assert.equal(window.localStorage.length, 0);
    assert.equal(window.sessionStorage.length, 0);
    assert.equal(document.cookie, '');

    await act(async () => {
      root.unmount();
    });
    t.mock.timers.reset();
    env.cleanup();
  }

  // Subtest 13 & 14: Dismissal survives navigation, reload resets, excluded routes wait until allowed route
  {
    resetClarityPopupMemoryState();
    const env = setupDomEnvironment();
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
    let navigateFn!: (to: string) => void;
    const NavHarness = () => {
      navigateFn = useNavigate();
      return null;
    };

    const container = document.getElementById('root')!;
    const root = createRoot(container);

    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/audit'] },
          React.createElement(NavHarness),
          React.createElement(ClarityMapPopup)
        )
      );
    });

    // Wait 30s on excluded /audit page -> must NOT show
    await act(async () => {
      t.mock.timers.tick(30_000);
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Navigate to allowed page -> shows immediately since delay already elapsed
    await act(async () => {
      navigateFn('/services');
    });
    assert.ok(document.querySelector('[data-testid="clarity-map-popup"]'));

    // Dismiss via Escape
    await act(async () => {
      window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Client-side navigation to another allowed page must NOT show it again
    await act(async () => {
      navigateFn('/about');
      t.mock.timers.tick(30_000);
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Simulated full page reload resets in-memory state -> shows again after delay
    await act(async () => {
      root.unmount();
    });
    resetClarityPopupMemoryState();
    const root2 = createRoot(container);
    await act(async () => {
      root2.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(ClarityMapPopup)
        )
      );
    });
    await act(async () => {
      t.mock.timers.tick(POPUP_DELAY_SECONDS * 1000);
    });
    assert.ok(document.querySelector('[data-testid="clarity-map-popup"]'));

    await act(async () => {
      root2.unmount();
    });
    t.mock.timers.reset();
    env.cleanup();
  }

  // Subtest 15 & 16: Held back while typing in input or another modal open; Close button + UTM preservation
  {
    resetClarityPopupMemoryState();
    const env = setupDomEnvironment();
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

    // Seed existing first-touch attribution in localStorage
    captureAttributionData('?utm_source=linkedin&utm_medium=organic&utm_campaign=founder_post');
    assert.equal(getAttributionData().utm_source, 'linkedin');

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const modal = document.createElement('div');
    modal.setAttribute('aria-modal', 'true');
    document.body.appendChild(modal);

    const events: string[] = [];
    window.addEventListener('clarity-popup:analytics', (e: any) => {
      events.push(e.detail.event);
    });

    const container = document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(ClarityMapPopup)
        )
      );
    });

    // After 25s, held back because input is focused + modal open
    await act(async () => {
      t.mock.timers.tick(POPUP_DELAY_SECONDS * 1000);
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Clear blockers before 20s give-up window -> next 2s retry reveals popup
    input.blur();
    modal.remove();
    await act(async () => {
      t.mock.timers.tick(2000);
    });

    const popup = document.querySelector('[data-testid="clarity-map-popup"]')!;
    assert.ok(popup);
    assert.ok(events.includes('clarity_popup_shown'));

    // Verify CTA link href + first-touch preservation
    const ctaLink = popup.querySelector('a')!;
    assert.ok(ctaLink);
    assert.equal(
      ctaLink.getAttribute('href'),
      '/clarity-map?utm_source=site&utm_medium=popup&utm_campaign=clarity_map_popup'
    );

    // Navigating with popup UTMs must NOT overwrite first-touch attribution
    captureAttributionData('?utm_source=site&utm_medium=popup&utm_campaign=clarity_map_popup');
    assert.equal(getAttributionData().utm_source, 'linkedin');
    assert.equal(getAttributionData().utm_medium, 'organic');

    // Close button (aria-label="Close") dismisses & emits clarity_popup_dismissed
    const closeBtn = popup.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
    assert.ok(closeBtn);
    await act(async () => {
      closeBtn.click();
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);
    assert.ok(events.includes('clarity_popup_dismissed'));

    await act(async () => {
      root.unmount();
    });
    t.mock.timers.reset();
    env.cleanup();
  }

  // Subtest 17: Collision avoidance with FloatingAssistant (desktop + 375px mobile) & reduced-motion
  {
    resetClarityPopupMemoryState();
    const env = setupDomEnvironment({ reducedMotion: true, width: 375, height: 667 });
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

    const container = document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(FloatingAssistant),
          React.createElement(ClarityMapPopup)
        )
      );
    });

    // Advance past 5s assistant teaser and 5s Clarity Map popup
    await act(async () => {
      t.mock.timers.tick(POPUP_DELAY_SECONDS * 1000);
    });

    const popup = document.querySelector('[data-testid="clarity-map-popup"]')!;
    const assistantBtn = document.querySelector('[data-testid="floating-assistant-toggle"]')!;
    const assistantTeaser = document.querySelector('[data-testid="floating-assistant-teaser"]')!;

    assert.ok(popup);
    assert.equal(popup.getAttribute('data-reduced-motion'), 'true');
    assert.ok(popup.className.includes('transition-none'));

    // Centered modal overlay (desktop + mobile) matching EmailCaptureModal, above floating assistant
    assert.ok(popup.className.includes('fixed inset-0'));
    assert.ok(popup.className.includes('items-center justify-center'));
    assert.ok(popup.innerHTML.includes('max-w-md'));
    assert.ok(assistantBtn.className.includes('bottom-6 right-6'));
    assert.ok(assistantTeaser.className.includes('opacity-0'));

    await act(async () => {
      root.unmount();
    });
    t.mock.timers.reset();
    env.cleanup();
  }

  // Subtest 17b: Scroll-to-end re-opens pop-up once ONLY if initial pop-up was dismissed (not if CTA clicked)
  {
    resetClarityPopupMemoryState();
    const env = setupDomEnvironment({ width: 1280, height: 800 });
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2400,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 800,
      configurable: true,
    });
    let currentScrollY = 0;
    Object.defineProperty(window, 'scrollY', {
      get: () => currentScrollY,
      configurable: true,
    });

    const container = document.getElementById('root')!;
    const root = createRoot(container);
    await act(async () => {
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(ClarityMapPopup)
        )
      );
    });

    // Scrolling to bottom BEFORE initial popup appears must not trigger scroll-end early
    currentScrollY = 1600;
    await act(async () => {
      window.dispatchEvent(new window.Event('scroll'));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Scroll back to top, then wait 5s for initial pop-up and dismiss it ("Maybe later")
    currentScrollY = 0;
    await act(async () => {
      t.mock.timers.tick(POPUP_DELAY_SECONDS * 1000);
    });
    const initialPopup = document.querySelector('[data-testid="clarity-map-popup"]');
    assert.ok(initialPopup, 'Initial 5s pop-up should appear');

    await act(async () => {
      window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Mid-page scroll must NOT open pop-up
    currentScrollY = 700;
    await act(async () => {
      window.dispatchEvent(new window.Event('scroll'));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Reaching end of page after initial cancellation MUST re-open pop-up
    currentScrollY = 1580;
    await act(async () => {
      window.dispatchEvent(new window.Event('scroll'));
    });
    assert.ok(
      document.querySelector('[data-testid="clarity-map-popup"]'),
      'Pop-up should re-open when user reaches the end of the page after cancelling initial pop-up'
    );

    // Dismiss second time -> further scrolling to bottom must NOT open again
    await act(async () => {
      window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    currentScrollY = 1600;
    await act(async () => {
      window.dispatchEvent(new window.Event('scroll'));
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    // Verify clicking primary CTA on initial pop-up prevents scroll-end re-trigger
    await act(async () => {
      root.unmount();
    });
    resetClarityPopupMemoryState();
    currentScrollY = 0;
    const root2 = createRoot(container);
    await act(async () => {
      root2.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ['/'] },
          React.createElement(ClarityMapPopup)
        )
      );
    });
    await act(async () => {
      t.mock.timers.tick(POPUP_DELAY_SECONDS * 1000);
    });
    const ctaLink = document.querySelector('[data-testid="clarity-map-popup"] a') as HTMLAnchorElement;
    assert.ok(ctaLink);
    await act(async () => {
      ctaLink.click();
    });
    assert.equal(document.querySelector('[data-testid="clarity-map-popup"]'), null);

    currentScrollY = 1600;
    await act(async () => {
      window.dispatchEvent(new window.Event('scroll'));
    });
    assert.equal(
      document.querySelector('[data-testid="clarity-map-popup"]'),
      null,
      'Scroll-end should NOT re-open if user clicked primary CTA on initial pop-up'
    );

    await act(async () => {
      root2.unmount();
    });
    t.mock.timers.reset();
    env.cleanup();
  }
});

test('18. Route-specific social share metadata (WhatsApp, LinkedIn, X) injects unique title, description, canonical URL, and PNG image', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

  const routes = [
    '/clarity-map',
    '/audit',
    '/services',
    '/about',
    '/training',
    '/newsletter',
    '/resources',
    '/connect',
    '/business-workflow-fixes',
  ];

  const seenDescriptions = new Set<string>();
  for (const route of routes) {
    const meta = resolvePageMeta(route);
    assert.ok(!seenDescriptions.has(meta.description), `Expected unique description for ${route}`);
    seenDescriptions.add(meta.description);

    const html = injectPageMetaIntoHtml(indexHtml, route);
    assert.ok(html.includes(`<title>${meta.title.replace(/&/g, '&amp;')}</title>`));
    assert.ok(html.includes(`<meta property="og:title" content="${meta.title.replace(/&/g, '&amp;')}"`));
    assert.ok(html.includes(`<meta property="og:description" content="${meta.description.replace(/&/g, '&amp;')}"`));
    assert.ok(html.includes(`<meta name="twitter:title" content="${meta.title.replace(/&/g, '&amp;')}"`));
    assert.ok(html.includes(`<meta name="twitter:description" content="${meta.description.replace(/&/g, '&amp;')}"`));
    assert.ok(html.includes(`/images/joshua-portrait.png`));
  }

  const clarityMeta = resolvePageMeta('/clarity-map');
  assert.equal(clarityMeta.title, 'Clarity Map | Interactive Business Workflow Diagnostic | Joshua Omole');
  assert.ok(clarityMeta.description.includes('BRIDGE'));
});
