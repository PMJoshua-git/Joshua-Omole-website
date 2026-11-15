import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';

import {
  buildClarityMapReportEmail,
  makeReportAttachmentFilename,
  REPORT_AUDIT_URL,
  REPORT_EMAIL_PREHEADER,
  REPORT_EMAIL_SUBJECT,
} from '../server/clarity-map/email/reportEmailTemplate';
import {
  DEFAULT_RESEND_FROM_EMAIL,
  DEFAULT_RESEND_REPLY_TO,
  EmailDeliveryError,
  getResendEmailSettings,
  sendClarityMapReportEmails,
  type ResendClientLike,
} from '../server/clarity-map/email/sendReport';
import {
  createClarityMapReportGuard,
  REPORT_LIMIT_MESSAGE,
} from '../server/clarity-map/rateLimit/reportGuard';
import {
  createClarityMapRateLimiter,
  InMemorySlidingWindowStore,
} from '../server/clarity-map/rateLimit/limiter';
import {
  handleLimitStatusRequest,
  handleReportRequest,
  type HttpResponseLike,
} from '../server/clarity-map/handlers';
import type { ClarityMapResult } from '../features/clarity-map/types/clarityMap';

function makeValidAnalysisResult(overrides?: Partial<ClarityMapResult['meta']>): ClarityMapResult {
  return {
    schema_version: 2,
    meta: {
      industry: 'Real Estate',
      process_code: 'RE-03',
      process_name: overrides?.process_name || 'Property maintenance request',
      questionnaire_version: '1.0',
      analysis_version: '2.0',
      ...overrides,
    },
    confidence: 'high',
    summary: {
      headline: 'Tenant requests sit in personal inboxes before vendor assignment.',
      paragraph:
        'Using one intake queue and explicit triage ownership cuts average turnaround dramatically without buying new software.',
    },
    current_state: {
      nodes: [
        {
          id: 'c1',
          label: 'Tenant reports issue in email',
          type: 'task',
          actor: 'Tenant',
          tool: 'Email',
          time_min: 5,
          time_max: 15,
          next: ['c2'],
          edges: [{ to: 'c2', label: '' }],
          pain_flags: ['no_record'],
          inferred: false,
          evidence: ['C1'],
        },
        {
          id: 'c2',
          label: 'Manager checks availability on WhatsApp',
          type: 'wait',
          actor: 'Property Manager',
          tool: 'WhatsApp',
          time_min: 15,
          time_max: 45,
          next: ['c3'],
          edges: [{ to: 'c3', label: '' }],
          pain_flags: ['waiting'],
          inferred: false,
          evidence: ['C2'],
        },
        {
          id: 'c3',
          label: 'Vendor confirms repair date',
          type: 'end',
          actor: 'Vendor',
          tool: 'Phone',
          time_min: 10,
          time_max: 20,
          next: [],
          edges: [],
          pain_flags: [],
          inferred: false,
          evidence: ['C3'],
        },
      ],
      visibility_gaps: ['Exact waiting time for vendor replies is not tracked.'],
    },
    bridge_diagnosis: {
      B: { score: 2, finding: 'Intake steps are informal.', evidence: ['C1'] },
      R: { score: 1, finding: 'Escalation ownership blurs during peak weeks.', evidence: ['C2'] },
      I: { score: 1, finding: 'Email and WhatsApp sit disconnected.', evidence: ['C2'] },
      D: { score: 1, finding: 'No single maintenance log.', evidence: ['C3'] },
      G: { score: 1, finding: 'No SLA rule for urgent tickets.', evidence: ['C2'] },
      E: { score: 0, finding: 'Turnaround times are not reviewed monthly.', evidence: ['C3'] },
    },
    redesigned_state: {
      nodes: [
        {
          id: 'r1',
          label: 'Submit standard maintenance intake form',
          type: 'task',
          actor: 'Tenant',
          tool: 'Existing Form',
          time_min: 3,
          time_max: 5,
          next: ['r2'],
          edges: [{ to: 'r2', label: '' }],
          change_type: 'standardised',
          bridge_letter: 'B',
          replaces: ['c1'],
          rationale: 'Captures unit, category, and photos upfront.',
        },
        {
          id: 'r2',
          label: 'Assign approved vendor in shared tracker',
          type: 'end',
          actor: 'Property Manager',
          tool: 'Master Sheet',
          time_min: 5,
          time_max: 10,
          next: [],
          edges: [],
          change_type: 'assigned',
          bridge_letter: 'R',
          replaces: ['c2', 'c3'],
          rationale: 'Removes inbox chasing and sets clear ownership.',
        },
      ],
      removed: [
        {
          replaces: ['c2'],
          bridge_letter: 'I',
          reason: 'Replaces fragmented WhatsApp chasing with one shared log.',
        },
      ],
      rules_introduced: ['Urgent repairs must be assigned within 4 business hours.'],
    },
    automated_state: {
      status: 'recommended',
      reason: 'High repeat dispatch volume makes routing automation worthwhile.',
      revisit_when: null,
      nodes: [
        {
          id: 'a1',
          label: 'Auto-log ticket and notify assigned vendor',
          type: 'task',
          actor: 'Workflow Automation',
          tool: 'Form + Sheet',
          time_min: 1,
          time_max: 2,
          next: ['a2'],
          edges: [{ to: 'a2', label: '' }],
          automation: {
            type: 'capture_form',
            description: 'Logs tenant submission directly to shared sheet and alerts manager.',
            function: 'Normalize tenant request and create shared log entry',
            trigger: 'Maintenance form submitted',
            input: 'Tenant unit, category, and description',
            action: 'Append row in tracker and send alert',
            exception_route: 'Fallback to coordinator email if form validation fails',
            owner: 'Operations Coordinator',
            human_checkpoint: 'Manager confirms vendor trade category for complex repairs.',
          },
          from: ['r1'],
        },
        {
          id: 'a2',
          label: 'Send 24-hour status reminder if open',
          type: 'end',
          actor: 'Property Manager',
          tool: 'Master Sheet',
          time_min: 3,
          time_max: 5,
          next: [],
          edges: [],
          automation: {
            type: 'scheduled_reminder',
            description: 'Flags overdue open work orders automatically.',
            function: 'Check open work order timestamps daily',
            trigger: 'Daily schedule at 09:00',
            input: 'Open ticket rows older than 24 hours',
            action: 'Send reminder summary to Property Manager',
            exception_route: 'Escalate urgent unresolved tickets to Operations Lead',
            owner: 'Property Manager',
            human_checkpoint: 'Manager approves final invoice before closing.',
          },
          from: ['r2'],
        },
      ],
      not_automated: [
        {
          step: 'r2',
          reason: 'Emergency scope calls require human judgment.',
        },
      ],
    },
    time_estimate: {
      runs_per_week: { min: 8, max: 12 },
      hours_per_week: {
        current: { min: 6, max: 12 },
        redesigned: { min: 2, max: 4 },
        automated: { min: 1, max: 2 },
      },
      redesign_share_percent: { min: 50, max: 66 },
      assumptions: ['Calculated from 8–12 weekly maintenance tickets.'],
      caveat: 'Indicative weekly ranges based on self-reported estimates.',
    },
    bottlenecks: [
      {
        title: 'Scattered tenant intake channels',
        why_it_matters: 'Requests get buried across email and chat.',
        step_ids: ['c1', 'c2'],
        bridge_letter: 'I',
      },
      {
        title: 'Unclear urgency ownership',
        why_it_matters: 'Staff pause to ask who handles dispatch.',
        step_ids: ['c2'],
        bridge_letter: 'R',
      },
      {
        title: 'No centralized repair status log',
        why_it_matters: 'Managers re-ask vendors for updates.',
        step_ids: ['c3'],
        bridge_letter: 'D',
      },
    ],
    quick_wins: [
      {
        action: 'Publish one standard request form link',
        step_ids: ['c1'],
        needs_new_software: false,
        time_to_do: 'under 1 hour',
      },
    ],
    automation_opportunities: [
      {
        name: 'Auto-log ticket and alert vendor',
        effort: 'low',
        impact: 'high',
        step_ids: ['r1'],
        verdict: 'worth_it_now',
        why_this_volume: 'Handling 8–12 tickets per week justifies automating initial logging and routing.',
      },
    ],
    implementation_order: [
      {
        week: 1,
        focus: 'Single intake form & baseline timing',
        actions: ['Publish request form link', 'Measure baseline turnaround time for 10 tickets'],
        includes_baseline: true,
      },
      { week: 2, focus: 'Shared dispatch log', actions: ['Track all active repairs daily'] },
      { week: 3, focus: 'SLA & vendor rules', actions: ['Set 4-hour urgent assignment rule'] },
      { week: 4, focus: 'Automated reminders', actions: ['Enable 24-hour overdue alert'] },
    ],
    readiness: {
      score_percent: 25,
      band: 'Fragile',
    },
    crm_tags: {
      industry: 'Real Estate',
      process_code: 'RE-03',
      readiness_band: 'Fragile',
      top_bottleneck_bridge_letter: 'I',
      volume_band: 'Medium (8–12/wk)',
    },
    cta: 'Book a free 30-minute Systems Clarity Audit',
  };
}

function makeMockResponse() {
  const headers: Record<string, string> = {};
  const res: HttpResponseLike & { statusCode: number; body: any; headers: Record<string, string> } = {
    statusCode: 200,
    body: null,
    headers,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    },
  };
  return res;
}

test('1. Email subject is exactly "Your Clarity Map is ready"', () => {
  const email = buildClarityMapReportEmail({
    firstName: 'Amaka',
    processName: 'Property maintenance request',
  });
  assert.equal(REPORT_EMAIL_SUBJECT, 'Your Clarity Map is ready');
  assert.equal(email.subject, 'Your Clarity Map is ready');
});

test('2. Greeting handles "Amaka" and falls back to "Hi there," when empty or whitespace', () => {
  const named = buildClarityMapReportEmail({
    firstName: 'Amaka',
    processName: 'Property maintenance request',
  });
  assert.equal(named.greeting, 'Hi Amaka,');
  assert.ok(named.html.includes('Hi Amaka,'));
  assert.ok(named.text.startsWith('Hi Amaka,\n\n'));

  for (const blank of ['', '   ', '\t\n', null, undefined]) {
    const fallback = buildClarityMapReportEmail({
      firstName: blank,
      processName: 'Property maintenance request',
    });
    assert.equal(fallback.greeting, 'Hi there,');
    assert.ok(fallback.html.includes('Hi there,'));
    assert.ok(fallback.text.startsWith('Hi there,\n\n'));
  }
});

test('3. Unsafe first names with HTML, newlines, and long input are cleaned, escaped, and cannot alter headers or markup', () => {
  const malicious = '<b>Ola</b>\nBcc: x@y.com\r\nSubject: Hacked';
  const built = buildClarityMapReportEmail({
    firstName: malicious,
    processName: '<script>alert(1)</script> Maintenance\r\nCc: bad@evil.com',
  });

  // Control characters / newlines stripped, HTML escaped
  assert.equal(built.greeting.includes('\n'), false);
  assert.equal(built.greeting.includes('\r'), false);
  assert.equal(built.subject, 'Your Clarity Map is ready');
  assert.equal(built.html.includes('<b>Ola</b>'), false);
  assert.equal(built.html.includes('<script>'), false);
  assert.ok(built.html.includes('Hi &lt;b&gt;Ola&lt;/b&gt; Bcc: x@y.com Subject: Hacked,'));
  assert.ok(built.html.includes('&lt;script&gt;alert(1)&lt;/script&gt; Maintenance Cc: bad@evil.com'));

  // Capped at 60 characters
  const longName = 'A'.repeat(120);
  const capped = buildClarityMapReportEmail({
    firstName: longName,
    processName: 'Client Onboarding',
  });
  assert.equal(capped.cleanedFirstName.length, 60);
});

test('4. Send payload includes both html and text, plus PDF attachment with clean slug filename & application/pdf', async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 're_test_key';

  const capturedPayloads: any[] = [];
  const capturedOptions: any[] = [];

  const mockResend: ResendClientLike = {
    emails: {
      async send(payload, options) {
        capturedPayloads.push(payload);
        capturedOptions.push(options);
        return { data: { id: `msg_${capturedPayloads.length}` }, error: null, headers: null };
      },
    },
  };

  try {
    const result = makeValidAnalysisResult({ process_name: 'Property maintenance request' });
    const fileName = makeReportAttachmentFilename(result.meta.process_name);
    assert.equal(fileName, 'Clarity-Map-property-maintenance-request.pdf');

    const pdfBuffer = Buffer.from('%PDF-1.4 fake-pdf-bytes');
    const logs: string[] = [];

    const outcome = await sendClarityMapReportEmails({
      to: 'amaka@example.com',
      firstName: 'Amaka',
      result,
      pdfBuffer,
      fileName,
      resultId: 'res_123456',
      idempotencyKey: 'idem_abc',
      resendClient: mockResend,
      retryDelayMs: 0,
      logger: {
        info: (msg) => logs.push(msg),
        error: (msg) => logs.push(msg),
      },
    });

    assert.equal(outcome.emailSent, true);
    assert.equal(outcome.messageId, 'msg_1');
    assert.equal(capturedPayloads.length, 2); // customer + internal copy

    const customerPayload = capturedPayloads[0];
    assert.equal(customerPayload.subject, 'Your Clarity Map is ready');
    assert.equal(customerPayload.to, 'amaka@example.com');
    assert.ok(customerPayload.html && customerPayload.html.length > 200);
    assert.ok(customerPayload.text && customerPayload.text.length > 200);
    assert.equal(customerPayload.attachments.length, 1);
    assert.equal(
      customerPayload.attachments[0].filename,
      'Clarity-Map-property-maintenance-request.pdf'
    );
    assert.equal(customerPayload.attachments[0].contentType, 'application/pdf');
    assert.equal(Buffer.compare(customerPayload.attachments[0].content, pdfBuffer), 0);
    assert.equal(capturedOptions[0]?.idempotencyKey, 'idem_abc');
  } finally {
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
  }
});

test('5. HTML structure: hidden preheader first inside <body>, zero images, plain-text excludes preheader, UTM links on CTA & text', () => {
  const built = buildClarityMapReportEmail({
    firstName: 'Amaka',
    processName: 'Property maintenance request',
  });

  const dom = new JSDOM(built.html);
  const doc = dom.window.document;

  assert.equal(doc.documentElement.getAttribute('lang'), 'en');
  assert.equal(doc.title, 'Your Clarity Map is ready');
  assert.equal(doc.querySelectorAll('img').length, 0);

  const firstBodyChild = doc.body.firstElementChild;
  assert.ok(firstBodyChild, 'body should have a first child element');
  assert.equal(firstBodyChild?.tagName.toLowerCase(), 'div');
  const styleAttr = firstBodyChild?.getAttribute('style') || '';
  assert.ok(styleAttr.includes('display:none'));
  assert.ok(styleAttr.includes('max-height:0'));
  assert.ok(styleAttr.includes('overflow:hidden'));
  assert.ok(styleAttr.includes('opacity:0'));
  assert.ok(firstBodyChild?.textContent?.startsWith(REPORT_EMAIL_PREHEADER));
  // Verify 100 repetitions of invisible padding characters (\u034f\u200c\u00a0)
  const rawPreheaderDivMatch = built.html.match(/<div style="display:none;[^"]*">([\s\S]*?)<\/div>/);
  assert.ok(rawPreheaderDivMatch);
  const paddingCount = (rawPreheaderDivMatch[1].match(/&#847;&zwnj;&nbsp;/g) || []).length;
  assert.equal(paddingCount, 100);

  // Plain-text excludes preheader and has no HTML
  assert.equal(built.text.includes(REPORT_EMAIL_PREHEADER), false);
  assert.equal(/<[a-z][\s\S]*>/i.test(built.text), false);

  // Required audit CTA URL with UTM params appears in button, fallback link, and plain text
  const expectedUrl =
    'https://joshuaomole.com/audit?utm_source=email&utm_medium=report&utm_campaign=clarity_map_report';
  assert.equal(REPORT_AUDIT_URL, expectedUrl);

  const links = Array.from(doc.querySelectorAll('a')).map((a) => a.getAttribute('href'));
  const auditLinks = links.filter((href) => href === expectedUrl);
  assert.equal(auditLinks.length, 2); // button link + fallback plain-text link underneath
  assert.ok(built.text.includes(`Book your free audit: ${expectedUrl}`));

  // Real <ul> bullets in HTML and "- " bullets in plain text
  const listItems = Array.from(doc.querySelectorAll('ul li')).map((li) => li.textContent?.trim());
  assert.equal(listItems.length, 4);
  assert.equal(listItems[0], 'Your process as it runs today');
  assert.ok(built.text.includes('- Your process as it runs today'));
  assert.ok(built.text.includes('- The same process improved, with no new software needed'));
  assert.ok(built.text.includes("- Where automation helps, and where it isn't worth it yet"));
  assert.ok(
    built.text.includes(
      '- Your top three bottlenecks, quick wins you can start this week, and a simple 4-week plan'
    )
  );
  assert.ok(built.text.includes('Warm regards,\nJoshua Omole\njoshuaomole.com'));
});

test('6. PDF generation failure prevents email sending, logs error without raw email, and returns 500', async () => {
  const guard = createClarityMapReportGuard({
    store: new InMemorySlidingWindowStore(),
    config: {
      secret: 'test-secret-0123456789abcdef',
      redisUrl: null,
      redisToken: null,
      allowlist: [],
      genLimitPerWindow: 2,
      genWindowSeconds: 86400,
      unknownIpLimit: 10,
      globalDailyGenerationCap: 0,
      isProduction: false,
      trustProxy: true,
    },
  });

  let emailCalled = false;
  const errorLogs: string[] = [];

  const res = makeMockResponse();
  await handleReportRequest(
    {
      headers: {},
      body: {
        firstName: 'Amaka',
        email: 'amaka.secret@example.com',
        analysis: makeValidAnalysisResult(),
      },
    },
    res,
    {
      reportGuard: guard,
      loopsSync: async () => ({ synced: true as const, action: 'created' as const }),
      pdfGenerator: async () => {
        throw new Error('Font metrics corrupted');
      },
      emailSender: async () => {
        emailCalled = true;
        return { emailSent: true, internalSent: true, messageId: 'should-not-send' };
      },
      logger: {
        log: () => {},
        info: () => {},
        warn: () => {},
        error: (msg: string) => errorLogs.push(String(msg)),
      },
    }
  );

  assert.equal(emailCalled, false);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.emailSent, false);
  assert.ok(errorLogs.length >= 1);
  assert.equal(errorLogs.join('\n').includes('amaka.secret@example.com'), false);
  assert.ok(errorLogs.join('\n').includes('a***@example.com'));
});

test('7. Resend retries once on failure, logs masked 1-line summary, and returns friendly failure or messageId', async () => {
  const previousApiKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 're_test_key';

  try {
    const result = makeValidAnalysisResult();
    const pdfBuffer = Buffer.from('%PDF-1.4 ok');

    // Case A: Fails twice -> 1 retry -> throws EmailDeliveryError & logs 1 masked failure line
    let failCalls = 0;
    const failLogs: string[] = [];
    const failingClient: ResendClientLike = {
      emails: {
        async send() {
          failCalls++;
          return {
            data: null,
            error: {
              name: 'application_error',
              message: 'SMTP error delivering to john.doe@gmail.com',
              statusCode: 500,
            },
            headers: null,
          };
        },
      },
    };

    await assert.rejects(
      () =>
        sendClarityMapReportEmails({
          to: 'john.doe@gmail.com',
          firstName: 'John',
          result,
          pdfBuffer,
          fileName: 'Clarity-Map-property-maintenance-request.pdf',
          resultId: 'res_fail_1',
          resendClient: failingClient,
          retryDelayMs: 0,
          logger: {
            info: (m) => failLogs.push(m),
            error: (m) => failLogs.push(m),
          },
        }),
      (err: any) =>
        err instanceof EmailDeliveryError &&
        err.message === "We couldn't send your report just now. Please try again in a few minutes."
    );
    assert.equal(failCalls, 2); // initial attempt + 1 retry
    assert.equal(failLogs.length, 1);
    assert.ok(failLogs[0].includes('result_id=res_fail_1'));
    assert.ok(failLogs[0].includes('recipient=j***@gmail.com'));
    assert.ok(failLogs[0].includes('status=failure'));
    assert.equal(failLogs[0].includes('john.doe@gmail.com'), false);

    // Case B: Fails once, succeeds on retry -> returns messageId & logs 1 masked success line
    let retryCalls = 0;
    const successLogs: string[] = [];
    const flakyClient: ResendClientLike = {
      emails: {
        async send(payload) {
          retryCalls++;
          if (retryCalls === 1) {
            throw new Error('Temporary socket timeout');
          }
          if (payload.to === 'Joshua@mail.joshuaomole.com') {
            return { data: { id: 'msg_internal_99' }, error: null, headers: null };
          }
          return { data: { id: 'msg_customer_42' }, error: null, headers: null };
        },
      },
    };

    const outcome = await sendClarityMapReportEmails({
      to: 'jane.smith@gmail.com',
      firstName: 'Jane',
      result,
      pdfBuffer,
      fileName: 'Clarity-Map-property-maintenance-request.pdf',
      resultId: 'res_retry_2',
      resendClient: flakyClient,
      retryDelayMs: 0,
      logger: {
        info: (m) => successLogs.push(m),
        error: (m) => successLogs.push(m),
      },
    });

    assert.equal(outcome.emailSent, true);
    assert.equal(outcome.messageId, 'msg_customer_42');
    assert.equal(retryCalls, 3); // 1 fail + 1 customer retry success + 1 internal lead alert
    assert.equal(successLogs.length, 1);
    assert.ok(successLogs[0].includes('result_id=res_retry_2'));
    assert.ok(successLogs[0].includes('recipient=j***@gmail.com'));
    assert.ok(successLogs[0].includes('status=success'));
    assert.ok(successLogs[0].includes('message_id=msg_customer_42'));
    assert.equal(successLogs[0].includes('jane.smith@gmail.com'), false);
  } finally {
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
  }
});

test('8. Double submit within 5-minute dedupe window sends once and returns clean response', async () => {
  const nowMs = Date.UTC(2026, 10, 15, 12, 0, 0);
  const guard = createClarityMapReportGuard({
    store: new InMemorySlidingWindowStore(),
    config: {
      secret: 'test-secret-0123456789abcdef',
      redisUrl: null,
      redisToken: null,
      allowlist: [],
      genLimitPerWindow: 2,
      genWindowSeconds: 86400,
      unknownIpLimit: 10,
      globalDailyGenerationCap: 0,
      isProduction: false,
      trustProxy: true,
    },
    now: () => nowMs,
  });

  let sendCount = 0;
  let lastIdempotencyKey: string | undefined;

  const analysis = makeValidAnalysisResult();
  const makeReq = () => ({
    headers: {},
    body: {
      firstName: 'Amaka',
      email: 'AMAKA@Example.com ',
      resultId: 'res_double_click',
      analysis,
    },
  });

  const deps = {
    reportGuard: guard,
    loopsSync: async () => ({ synced: true as const, action: 'created' as const }),
    pdfGenerator: async () => Buffer.from('%PDF-1.4 mock'),
    emailSender: async (opts: any) => {
      sendCount++;
      lastIdempotencyKey = opts.idempotencyKey;
      return { emailSent: true, internalSent: true, messageId: 'msg_once_123' };
    },
  };

  const res1 = makeMockResponse();
  await handleReportRequest(makeReq(), res1, deps);
  assert.equal(res1.statusCode, 200);
  assert.equal(res1.body.messageId, 'msg_once_123');
  assert.equal(sendCount, 1);
  assert.ok(lastIdempotencyKey);

  // Rapid duplicate submission within 5 minutes
  const res2 = makeMockResponse();
  await handleReportRequest(makeReq(), res2, deps);
  assert.equal(res2.statusCode, 200);
  assert.equal(res2.body.deduped, true);
  assert.equal(res2.body.messageId, 'msg_once_123');
  assert.equal(sendCount, 1); // Never sent twice
});

test('9. Sender and Reply-To reuse existing RESEND_FROM_EMAIL and RESEND_REPLY_TO env vars with no new env vars added', () => {
  const prevFrom = process.env.RESEND_FROM_EMAIL;
  const prevReply = process.env.RESEND_REPLY_TO;

  try {
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_REPLY_TO;
    const defaults = getResendEmailSettings();
    assert.equal(defaults.fromEmail, DEFAULT_RESEND_FROM_EMAIL);
    assert.equal(defaults.replyTo, DEFAULT_RESEND_REPLY_TO);

    process.env.RESEND_FROM_EMAIL = 'Ops Team <ops@joshuaomole.com>';
    process.env.RESEND_REPLY_TO = 'reply@joshuaomole.com';
    const configured = getResendEmailSettings();
    assert.equal(configured.fromEmail, 'Ops Team <ops@joshuaomole.com>');
    assert.equal(configured.replyTo, 'reply@joshuaomole.com');

    // Confirm .env.example still has existing Resend variables and no unexpected new email env vars
    const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
    assert.ok(envExample.includes('RESEND_API_KEY='));
    assert.ok(envExample.includes('RESEND_FROM_EMAIL='));
    assert.ok(envExample.includes('RESEND_REPLY_TO='));
  } finally {
    if (prevFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = prevFrom;
    if (prevReply === undefined) delete process.env.RESEND_REPLY_TO;
    else process.env.RESEND_REPLY_TO = prevReply;
  }
});

test('10. Misuse safeguards: max 3 per resultId, max 3 per recipient email per 24h (hashed keys), separate from IP generation limit', async () => {
  let nowMs = Date.UTC(2026, 10, 15, 12, 0, 0);
  const store = new InMemorySlidingWindowStore();
  const config = {
    secret: 'test-secret-0123456789abcdef',
    redisUrl: null,
    redisToken: null,
    allowlist: [] as string[],
    genLimitPerWindow: 2,
    genWindowSeconds: 86400,
    unknownIpLimit: 10,
    globalDailyGenerationCap: 0,
    isProduction: false,
    trustProxy: true,
  };
  const guard = createClarityMapReportGuard({
    store,
    config,
    now: () => nowMs,
  });
  const ipLimiter = createClarityMapRateLimiter({
    store,
    config,
    now: () => nowMs,
  });

  let sendCalls = 0;
  const analysis = makeValidAnalysisResult();
  const makeDeps = () => ({
    reportGuard: guard,
    loopsSync: async () => ({ synced: true as const, action: 'created' as const }),
    pdfGenerator: async () => Buffer.from('%PDF-1.4 mock'),
    emailSender: async () => {
      sendCalls++;
      return { emailSent: true, internalSent: true, messageId: `msg_${sendCalls}` };
    },
  });

  // Check IP generation limit starts at 2
  const ipHeaders = { 'x-forwarded-for': '198.51.100.77' };
  const limitBefore = makeMockResponse();
  await handleLimitStatusRequest({ headers: ipHeaders }, limitBefore, {
    limiter: ipLimiter,
    trustProxy: true,
  });
  assert.equal(limitBefore.body.remaining, 2);

  // Part A: Same resultId sent to 3 distinct emails -> 4th distinct email blocked
  for (const email of ['one@example.com', 'two@example.com', 'three@example.com']) {
    const res = makeMockResponse();
    await handleReportRequest(
      {
        headers: ipHeaders,
        body: { firstName: 'Guest', email, resultId: 'res_shared_1', analysis },
      },
      res,
      makeDeps()
    );
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sendCalls, 3);

  const fourthResultSend = makeMockResponse();
  await handleReportRequest(
    {
      headers: ipHeaders,
      body: {
        firstName: 'Guest',
        email: 'four@example.com',
        resultId: 'res_shared_1',
        analysis,
      },
    },
    fourthResultSend,
    makeDeps()
  );
  assert.equal(fourthResultSend.statusCode, 429);
  assert.equal(fourthResultSend.body.error, REPORT_LIMIT_MESSAGE);
  assert.equal(sendCalls, 3); // Resend not called

  // Part B: Same recipient email across 3 distinct resultIds -> 4th blocked within 24h
  const targetEmail = 'target.user@example.com';
  for (const resultId of ['res_u1', 'res_u2', 'res_u3']) {
    const res = makeMockResponse();
    await handleReportRequest(
      {
        headers: ipHeaders,
        body: { firstName: 'Target', email: targetEmail, resultId, analysis },
      },
      res,
      makeDeps()
    );
    assert.equal(res.statusCode, 200);
  }
  assert.equal(sendCalls, 6);

  const fourthEmailSend = makeMockResponse();
  await handleReportRequest(
    {
      headers: ipHeaders,
      body: { firstName: 'Target', email: targetEmail, resultId: 'res_u4', analysis },
    },
    fourthEmailSend,
    makeDeps()
  );
  assert.equal(fourthEmailSend.statusCode, 429);
  assert.equal(fourthEmailSend.body.error, REPORT_LIMIT_MESSAGE);
  assert.equal(sendCalls, 6);

  // Verify raw emails are never stored in store keys (hashed email keys used)
  const storedKeys = Array.from((store as any).buckets?.keys?.() ?? []) as string[];
  for (const k of storedKeys) {
    assert.equal(k.includes('target.user@example.com'), false);
    assert.equal(k.includes('one@example.com'), false);
  }

  // Advance clock by 24h + 1s -> recipient 24h limit resets cleanly
  nowMs += 86401 * 1000;
  const after24h = makeMockResponse();
  await handleReportRequest(
    {
      headers: ipHeaders,
      body: { firstName: 'Target', email: targetEmail, resultId: 'res_u5', analysis },
    },
    after24h,
    makeDeps()
  );
  assert.equal(after24h.statusCode, 200);
  assert.equal(sendCalls, 7);

  // Generator IP limit remains untouched (0 generation slots consumed)
  const limitAfter = makeMockResponse();
  await handleLimitStatusRequest({ headers: ipHeaders }, limitAfter, {
    limiter: ipLimiter,
    trustProxy: true,
  });
  assert.equal(limitAfter.body.remaining, 2);
});
