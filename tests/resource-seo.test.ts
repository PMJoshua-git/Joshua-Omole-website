import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as HelmetAsync from 'react-helmet-async';
import { JSDOM } from 'jsdom';

const HelmetProvider =
  (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider;

import {
  auditResourceRegistrySeo,
  getPublicResources,
  resources as liveRegistryResources,
  type ResourceEntry,
} from '../server/resources/registry.js';
import {
  renderSeoHtmlDocument,
  resolvePageMeta,
} from '../server/seo/pageMeta.js';
import { buildSitemapXml } from '../server/seo/sitemap.js';
import apiApp from '../server/apiApp.js';
import ssrMetaHandler from '../api/ssr-meta.js';
import sitemapHandler from '../api/sitemap.js';
import { getShortFormatType } from '../utils/resourceSeo.js';

// Polyfill IntersectionObserver for Framer Motion components in JSDOM
function setupDom(url = 'https://joshuaomole.com/resources') {
  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>', {
    url,
    pretendToBeVisual: true,
  });

  const globals: Record<string, any> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    Element: dom.window.Element,
    SVGElement: dom.window.SVGElement,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    IS_REACT_ACT_ENVIRONMENT: true,
  };

  const prev: Record<string, any> = {};
  for (const [k, v] of Object.entries(globals)) {
    prev[k] = (globalThis as any)[k];
    Object.defineProperty(globalThis, k, {
      value: v,
      configurable: true,
      writable: true,
    });
  }

  return {
    dom,
    cleanup() {
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) {
          delete (globalThis as any)[k];
        } else {
          Object.defineProperty(globalThis, k, {
            value: v,
            configurable: true,
            writable: true,
          });
        }
      }
      dom.window.close();
    },
  };
}

function makeFixtureEntries(): ResourceEntry[] {
  return [
    {
      slug: 'ops-intake-playbook',
      title: 'Client Intake Playbook',
      h1: 'Client Intake Playbook for Service Teams',
      seoTitle: 'Client Intake Playbook | Free Guide',
      seoDescription:
        'A concise operational intake playbook for service teams to eliminate manual handoffs and shorten onboarding.',
      summary: 'Eliminate manual intake handoffs and standardize client onboarding in 7 days.',
      description: [
        'Growing service teams lose hours every week chasing missing client details across emails, forms, and chat threads before delivery can even begin.',
        'This practical playbook gives operations leads a repeatable intake flow covering qualification, kickoff prep, task creation, and ownership handoffs without adding bloated software.',
      ],
      category: 'Operations',
      format: 'PDF (18 pages)',
      formatType: 'Guide',
      readingTime: '12 min read',
      audience: 'Operations managers and founders at 5–30 person B2B service firms.',
      howToUse: 'Review the four intake stages with your delivery lead, then adopt the scorecard.',
      includes: [
        'Client readiness intake checklist',
        '7-day onboarding rollout schedule',
        'Exception escalation matrix',
      ],
      related: ['handoff-checklist'],
      faq: [
        {
          question: 'Do we need new software before using this?',
          answer: 'No. Every workflow step works inside standard email, forms, and project boards.',
        },
      ],
      publishedAt: '2026-10-01',
      updatedAt: '2026-11-10',
      coverImageAlt: 'Client Intake Playbook cover preview',
      featured: true,
      status: 'published',
      order: 1,
      fileName: 'secret-client-intake-2026.pdf',
      loopsGroup: 'SECRET_LOOPS_INTAKE_GROUP',
      emailSubject: 'SECRET_EMAIL_SUBJECT_INTAKE',
    },
    {
      slug: 'handoff-checklist',
      title: 'Sales to Delivery Handoff Checklist',
      summary: 'A practical 14-point checklist to stop context loss between sales and fulfillment.',
      description: [
        'Most delivery delays start in the gap between closed-won agreements and the kickoff call when key constraints stay trapped in call notes.',
        'Use this concise checklist before every client handoff so account leads and delivery owners start with identical scope, timeline, and risk visibility.',
      ],
      category: 'Operations',
      format: 'PDF (8 pages)',
      readingTime: '6 min read',
      audience: 'Founders, account executives, and project leads handing off new client engagements.',
      includes: ['14-point pre-kickoff verification list', 'Owner sign-off signposts'],
      publishedAt: '2026-09-15',
      status: 'published',
      order: 2,
      fileName: 'secret-handoff-checklist.pdf',
      loopsGroup: 'SECRET_LOOPS_HANDOFF',
    },
    {
      slug: 'upcoming-q4-template',
      title: 'Quarterly Capacity Forecast',
      summary: 'A capacity planning workbook currently being finalized for upcoming release.',
      description: ['Coming soon capacity forecast description paragraph.'],
      category: 'Planning',
      format: 'Spreadsheet',
      status: 'coming-soon',
      order: 3,
      fileName: 'secret-upcoming-forecast.xlsx',
      loopsGroup: 'SECRET_LOOPS_UPCOMING',
    },
    {
      slug: 'internal-draft-spec',
      title: 'Unfinished Internal Draft',
      summary: 'Draft entry that must never appear publicly.',
      description: ['Draft only content.'],
      category: 'Internal',
      format: 'PDF',
      status: 'draft',
      order: 4,
      fileName: 'secret-internal-draft.pdf',
      loopsGroup: 'SECRET_LOOPS_DRAFT',
    },
  ];
}

test('1. Production registry remains clean and empty while helper defaults work cleanly', () => {
  assert.equal(liveRegistryResources.length, 0, 'server/resources/registry.ts must stay empty');
  assert.equal(getShortFormatType('PDF (18 pages)'), 'PDF');
  assert.equal(getShortFormatType('PDF (18 pages)', 'Playbook'), 'Playbook');
  assert.equal(getShortFormatType('Operations Checklist'), 'Checklist');
});

test('2. SSR HTML for /resources with empty registry returns 200, crawlable HTML, and clean empty state', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const rendered = renderSeoHtmlDocument(indexHtml, '/resources', []);

  assert.equal(rendered.statusCode, 200);
  assert.equal(rendered.isNotFound, false);
  assert.match(rendered.html, /<link rel="canonical" href="https:\/\/joshuaomole\.com\/resources" \/>/);
  assert.match(rendered.html, /<meta name="robots" content="index, follow" \/>/);
  assert.match(rendered.html, /<h1>Practical Resources for Smarter Business Operations<\/h1>/);
  assert.match(rendered.html, /New resources coming soon/);
  assert.match(rendered.html, /href="\/audit"/);
  assert.match(rendered.html, /"@type":"CollectionPage"/);
  assert.match(rendered.html, /<script id="__PRELOADED_RESOURCES__" type="application\/json">\[\]<\/script>/);
});

test('3. SSR HTML for /resources & /resources/<slug> with fixture injects complete body, JSON-LD, and strips private fields', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const fixture = makeFixtureEntries();

  // Hub page (also test query-param normalization ?category=Operations)
  const hub = renderSeoHtmlDocument(indexHtml, '/resources?category=Operations', fixture);
  assert.equal(hub.statusCode, 200);
  assert.match(hub.html, /<link rel="canonical" href="https:\/\/joshuaomole\.com\/resources" \/>/);
  assert.match(hub.html, /href="\/resources\/ops-intake-playbook"/);
  assert.match(hub.html, /href="\/resources\/handoff-checklist"/);
  assert.match(hub.html, /Quarterly Capacity Forecast/);
  assert.doesNotMatch(hub.html, /href="\/resources\/upcoming-q4-template"/, 'Coming-soon item must not have detail href');
  assert.doesNotMatch(hub.html, /Unfinished Internal Draft/, 'Draft must never appear in HTML');

  // Detail page
  const detail = renderSeoHtmlDocument(indexHtml, '/resources/ops-intake-playbook', fixture);
  assert.equal(detail.statusCode, 200);
  assert.match(detail.html, /<title>Client Intake Playbook \| Free Guide<\/title>/);
  assert.match(detail.html, /<link rel="canonical" href="https:\/\/joshuaomole\.com\/resources\/ops-intake-playbook" \/>/);
  assert.match(detail.html, /<meta property="og:type" content="article"/);
  assert.match(detail.html, /https:\/\/joshuaomole\.com\/images\/resources-og-default\.png/);
  assert.match(detail.html, /<h1>Client Intake Playbook for Service Teams<\/h1>/);
  assert.match(detail.html, /<h2>Who it's for<\/h2>/);
  assert.match(detail.html, /<h2>What's inside<\/h2>/);
  assert.match(detail.html, /<h2>How to use it<\/h2>/);
  assert.match(detail.html, /<h2>Frequently asked questions<\/h2>/);
  assert.match(detail.html, /<h2>Related resources<\/h2>/);
  assert.match(detail.html, /href="\/resources\/handoff-checklist"/);
  assert.match(detail.html, /href="\/audit"/);

  // Verify JSON-LD structure and lack of FAQPage / private fields
  const jsonLdMatch = detail.html.match(/<script id="ssr-jsonld" type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(jsonLdMatch, 'SSR JSON-LD script must exist');
  const parsedLd = JSON.parse(jsonLdMatch[1]);
  const types = parsedLd['@graph'].map((n: any) => n['@type']);
  assert.ok(types.includes('Person'));
  assert.ok(types.includes('WebSite'));
  assert.ok(types.includes('BreadcrumbList'));
  assert.ok(types.includes('WebPage'));
  assert.ok(!types.includes('FAQPage'), 'FAQPage must NOT be emitted in JSON-LD');
  const webPage = parsedLd['@graph'].find((n: any) => n['@type'] === 'WebPage');
  assert.equal(webPage.mainEntity['@type'], 'DigitalDocument');
  assert.equal(webPage.mainEntity.isAccessibleForFree, true);
  assert.equal(webPage.mainEntity.datePublished, '2026-10-01');
  assert.equal(webPage.mainEntity.dateModified, '2026-11-10');

  // Verify default SEO title fallback uses clean formatType (no page count)
  const handoffMeta = resolvePageMeta('/resources/handoff-checklist', fixture);
  assert.equal(handoffMeta.title, 'Sales to Delivery Handoff Checklist | Free PDF from Joshua Omole');

  // Server-only field leak audit across both hub & detail HTML
  const combined = `${hub.html}\n${detail.html}`;
  for (const forbidden of [
    'secret-client-intake-2026.pdf',
    'SECRET_LOOPS_INTAKE_GROUP',
    'SECRET_EMAIL_SUBJECT_INTAKE',
    'secret-handoff-checklist.pdf',
    'SECRET_LOOPS_HANDOFF',
    'fileName',
    'loopsGroup',
    'emailSubject',
    'resources-private',
  ]) {
    assert.ok(!combined.includes(forbidden), `Forbidden internal token leaked into HTML: ${forbidden}`);
  }
});

test('4. Unknown, draft, coming-soon, and nested /resources/* paths return HTTP 404 + noindex without canonical', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const fixture = makeFixtureEntries();

  for (const badPath of [
    '/resources/does-not-exist',
    '/resources/upcoming-q4-template',
    '/resources/internal-draft-spec',
    '/resources/nested/invalid-path',
  ]) {
    const rendered = renderSeoHtmlDocument(indexHtml, badPath, fixture);
    assert.equal(rendered.statusCode, 404, `Expected 404 for ${badPath}`);
    assert.equal(rendered.isNotFound, true);
    assert.match(rendered.html, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.doesNotMatch(rendered.html, /<link rel="canonical"/, `404 page must omit canonical for ${badPath}`);
    assert.doesNotMatch(rendered.html, /id="ssr-jsonld"/, `404 page must omit JSON-LD for ${badPath}`);
    assert.match(rendered.html, /Resource not found/);
    assert.match(rendered.html, /href="\/resources"/);
  }
});

test('5. Sitemap XML and robots.txt include canonical URLs only and exclude drafts, coming-soon, and redirects', async () => {
  const fixture = makeFixtureEntries();
  const xml = buildSitemapXml(fixture);

  assert.match(xml, /<loc>https:\/\/joshuaomole\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/joshuaomole\.com\/resources<\/loc>/);
  assert.match(xml, /<loc>https:\/\/joshuaomole\.com\/resources\/ops-intake-playbook<\/loc>/);
  assert.match(xml, /<lastmod>2026-11-10<\/lastmod>/);
  assert.match(xml, /<loc>https:\/\/joshuaomole\.com\/resources\/handoff-checklist<\/loc>/);
  assert.doesNotMatch(xml, /upcoming-q4-template/, 'Coming-soon must not be in sitemap');
  assert.doesNotMatch(xml, /internal-draft-spec/, 'Draft must not be in sitemap');
  assert.doesNotMatch(xml, /\/contact<\/loc>/);
  assert.doesNotMatch(xml, /\/knowledge-hub<\/loc>/);
  assert.doesNotMatch(xml, /\/knowledge<\/loc>/);

  // Verify live api/sitemap handler response
  const mockRes: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(k: string, v: string) {
      mockRes.headers[k.toLowerCase()] = v;
    },
    status(c: number) {
      mockRes.statusCode = c;
      return mockRes;
    },
    send(b: string) {
      mockRes.body = b;
      return mockRes;
    },
  };
  await sitemapHandler({ method: 'GET', url: '/sitemap.xml' }, mockRes);
  assert.equal(mockRes.statusCode, 200);
  assert.equal(mockRes.headers['content-type'], 'application/xml; charset=utf-8');
  assert.equal(
    mockRes.headers['cache-control'],
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );

  // Verify public/sitemap.xml exists and matches buildSitemapXml()
  const publicSitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  assert.ok(fs.existsSync(publicSitemapPath), 'public/sitemap.xml must exist');
  const publicSitemapXml = fs.readFileSync(publicSitemapPath, 'utf8');
  assert.equal(publicSitemapXml, buildSitemapXml(liveRegistryResources));

  // Verify index.html includes <link rel="sitemap">
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.match(indexHtml, /<link\s+rel="sitemap"\s+type="application\/xml"[^>]*href="\/sitemap\.xml"/);

  // Verify public/robots.txt and resources-og-default.png asset exist cleanly
  const robotsTxt = fs.readFileSync(path.join(process.cwd(), 'public', 'robots.txt'), 'utf8');
  assert.match(robotsTxt, /Sitemap: https:\/\/joshuaomole\.com\/sitemap\.xml/);
  assert.match(robotsTxt, /Disallow: \/api\//);
  assert.doesNotMatch(robotsTxt, /Disallow: \/assets/);

  const ogPng = fs.readFileSync(path.join(process.cwd(), 'public', 'images', 'resources-og-default.png'));
  // PNG header + IHDR chunk width/height check (bytes 16..23)
  assert.equal(ogPng.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(ogPng.readUInt32BE(16), 1200);
  assert.equal(ogPng.readUInt32BE(20), 630);
});

test('6. vercel.json configures trailingSlash, legacy path redirects without host-loop redirects, sitemap rewrite, and ssr-meta template bundling', () => {
  const vercelRaw = fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8');
  const vercelCfg = JSON.parse(vercelRaw);

  assert.equal(vercelCfg.trailingSlash, false);
  assert.ok(
    !vercelCfg.redirects.some((r: any) => Array.isArray(r.has) && r.has.some((h: any) => h.type === 'host')),
    'Must not hardcode host-level www/apex redirects in vercel.json (Vercel Domains manages primary host to prevent 308 loops)'
  );
  assert.ok(
    vercelCfg.redirects.some(
      (r: any) => r.permanent === true && r.source === '/contact' && r.destination === '/audit'
    ),
    'Should permanently redirect /contact -> /audit'
  );
  assert.ok(
    vercelCfg.rewrites.some(
      (r: any) => r.source === '/sitemap.xml' && r.destination === '/api/sitemap'
    ),
    'Should rewrite /sitemap.xml -> /api/sitemap'
  );
  assert.match(vercelCfg.functions['api/ssr-meta.ts'].includeFiles, /dist\/index\.html/);
  assert.match(vercelCfg.functions['api/ssr-meta.ts'].includeFiles, /utils\/\*\*/);
});

test('7. ssr-meta serverless handler returns 200 with Cache-Control for /resources and 404 for unknown slug', async () => {
  const mockRes200: any = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(k: string, v: string) {
      mockRes200.headers[k.toLowerCase()] = v;
    },
    status(c: number) {
      mockRes200.statusCode = c;
      return mockRes200;
    },
    send(b: string) {
      mockRes200.body = b;
      return mockRes200;
    },
  };
  await ssrMetaHandler({ method: 'GET', url: '/resources', query: { path: '/resources' }, headers: {} }, mockRes200);
  assert.equal(mockRes200.statusCode, 200);
  assert.equal(
    mockRes200.headers['cache-control'],
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );
  assert.match(mockRes200.body, /Practical Resources for Smarter Business Operations/);

  const mockRes404: any = {
    statusCode: 0,
    headers: {} as Record<string, string>,
    body: '',
    setHeader(k: string, v: string) {
      mockRes404.headers[k.toLowerCase()] = v;
    },
    status(c: number) {
      mockRes404.statusCode = c;
      return mockRes404;
    },
    send(b: string) {
      mockRes404.body = b;
      return mockRes404;
    },
  };
  await ssrMetaHandler(
    { method: 'GET', url: '/resources/nonexistent', query: { path: '/resources/nonexistent' }, headers: {} },
    mockRes404
  );
  assert.equal(mockRes404.statusCode, 404);
  assert.match(mockRes404.body, /<meta name="robots" content="noindex, nofollow" \/>/);
});

test('8. React UI components render Navigation <a href="/resources">, KnowledgeHub preload, and ResourceDetail 404/published states cleanly', async () => {
  const fixture = makeFixtureEntries();
  const publicResources = getPublicResources(fixture);

  const env = setupDom('https://joshuaomole.com/resources');
  const origFetch = globalThis.fetch;

  try {
    // Inject SSR preloaded payload just like ssr-meta does
    const preloadScript = document.createElement('script');
    preloadScript.id = '__PRELOADED_RESOURCES__';
    preloadScript.type = 'application/json';
    preloadScript.textContent = JSON.stringify(publicResources);
    document.body.appendChild(preloadScript);

    globalThis.fetch = (async () =>
      ({
        ok: true,
        json: async () => publicResources,
      }) as Response) as typeof fetch;

    const { default: KnowledgeHub } = await import('../pages/KnowledgeHub.js');
    const { default: ResourceDetail } = await import('../pages/ResourceDetail.js');

    const rootEl = document.getElementById('root')!;
    const root = createRoot(rootEl);

    await act(async () => {
      root.render(
        React.createElement(
          HelmetProvider,
          {},
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/resources'] },
            React.createElement(
              Routes,
              {},
              React.createElement(Route, {
                path: '/resources',
                element: React.createElement(KnowledgeHub),
              }),
              React.createElement(Route, {
                path: '/resources/:slug',
                element: React.createElement(ResourceDetail),
              })
            )
          )
        )
      );
    });

    // Top nav contains real <a href="/resources">
    const navLinks = Array.from(document.querySelectorAll('header nav a')).map((a) =>
      a.getAttribute('href')
    );
    assert.ok(navLinks.includes('/resources'), 'Top navigation must expose <a href="/resources">');

    // KnowledgeHub renders preloaded resources immediately without loading state
    assert.ok(document.body.textContent?.includes('Client Intake Playbook'));

    await act(async () => {
      root.unmount();
    });

    // Test ResourceDetail on published slug
    const root2 = createRoot(rootEl);
    await act(async () => {
      root2.render(
        React.createElement(
          HelmetProvider,
          {},
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/resources/ops-intake-playbook'] },
            React.createElement(
              Routes,
              {},
              React.createElement(Route, {
                path: '/resources/:slug',
                element: React.createElement(ResourceDetail),
              })
            )
          )
        )
      );
    });

    assert.equal(document.querySelector('h1')?.textContent, 'Client Intake Playbook for Service Teams');
    assert.ok(document.querySelector('nav[aria-label="Breadcrumb"]'), 'Detail page must show breadcrumb nav');
    assert.ok(document.body.textContent?.includes("Who it's for"));
    assert.ok(document.body.textContent?.includes("What's inside"));
    assert.ok(document.body.textContent?.includes('How to use it'));
    assert.ok(document.body.textContent?.includes('Frequently asked questions'));
    assert.ok(document.body.textContent?.includes('Related resources'));

    await act(async () => {
      root2.unmount();
    });

    // Test ResourceDetail on unknown slug shows Not Found instead of redirecting away
    const root3 = createRoot(rootEl);
    await act(async () => {
      root3.render(
        React.createElement(
          HelmetProvider,
          {},
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/resources/missing-slug'] },
            React.createElement(
              Routes,
              {},
              React.createElement(Route, {
                path: '/resources/:slug',
                element: React.createElement(ResourceDetail),
              })
            )
          )
        )
      );
    });
    assert.equal(document.querySelector('h1')?.textContent, 'Resource not found');

    await act(async () => {
      root3.unmount();
    });
  } finally {
    globalThis.fetch = origFetch;
    env.cleanup();
  }
});

test('9. /api/resources and /api/resource-request endpoints remain functional without exposing internal fields', async () => {
  const srv = http.createServer(apiApp);
  await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));

  try {
    const addr = srv.address() as any;
    const base = `http://127.0.0.1:${addr.port}`;

    const listRes = await fetch(`${base}/api/resources`);
    assert.equal(listRes.status, 200);
    const listData = await listRes.json();
    assert.deepEqual(listData, []);

    const missingSlugRes = await fetch(`${base}/api/resource-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'non-existent-slug',
        firstName: 'Ada',
        email: 'ada@example.com',
      }),
    });
    assert.equal(missingSlugRes.status, 404);
  } finally {
    await new Promise<void>((resolve) => srv.close(() => resolve()));
  }

  // Also test SEO audit warnings trigger properly on weak entries without throwing
  const weakAudit = auditResourceRegistrySeo([
    {
      ...makeFixtureEntries()[0],
      seoTitle: 'X'.repeat(65),
      audience: '',
      description: ['Short paragraph only.'],
      related: ['ops-intake-playbook', 'unknown-slug'],
    },
  ]);
  assert.ok(weakAudit.warnings.length >= 4);
});
