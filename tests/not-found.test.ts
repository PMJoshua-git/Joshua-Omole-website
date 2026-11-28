import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import * as HelmetAsync from 'react-helmet-async';
import { JSDOM } from 'jsdom';

const HelmetProvider =
  (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider;

import {
  LAST_ERROR_MESSAGE_STORAGE_KEY,
  ROTATING_ERROR_MESSAGES,
  selectRandomErrorMessage,
} from '../data/errorMessages.js';
import { renderSeoHtmlDocument, resolvePageMeta } from '../server/seo/pageMeta.js';
import { buildSitemapXml } from '../server/seo/sitemap.js';
import ssrMetaHandler from '../api/ssr-meta.js';

function setupDom(url = 'https://joshuaomole.com/missing-workflow') {
  const dom = new JSDOM(
    '<!DOCTYPE html><html><head><link rel="canonical" href="https://joshuaomole.com/" /><script id="ssr-jsonld" type="application/ld+json">{}</script></head><body><div id="root"></div></body></html>',
    {
      url,
      pretendToBeVisual: true,
    }
  );

  const globals: Record<string, any> = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    sessionStorage: dom.window.sessionStorage,
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

test('1. Centralized 404 message collection contains all 12 expected branded messages verbatim', () => {
  assert.equal(ROTATING_ERROR_MESSAGES.length, 12);
  const expectedHeadlines = [
    'Workflow Not Found.',
    'Oops. This process failed validation.',
    '404 — Missing Route.',
    'Looks like this page escaped production.',
    'Process Interrupted.',
    'System Redirect Recommended.',
    'Execution Paused.',
    'Broken Link Detected.',
    'This endpoint returned a 404.',
    'Route Optimisation Required.',
    'Looks like this workflow hit a dead end.',
    'Every broken process has a better path.',
  ];

  assert.deepEqual(
    ROTATING_ERROR_MESSAGES.map((m) => m.headline),
    expectedHeadlines
  );

  for (const msg of ROTATING_ERROR_MESSAGES) {
    assert.ok(msg.id.length > 0);
    assert.ok(msg.headline.length > 0);
    assert.ok(msg.description.length > 0);
    assert.ok(msg.context && msg.context.length > 0);
  }
});

test('2. selectRandomErrorMessage selects a complete object, prevents immediate repeats via sessionStorage, and degrades cleanly without storage', () => {
  const store = new Map<string, string>();
  const mockStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, val);
    },
  };

  const first = selectRandomErrorMessage({
    storage: mockStorage,
    random: () => 0,
  });
  assert.equal(first.id, ROTATING_ERROR_MESSAGES[0].id);
  assert.equal(store.get(LAST_ERROR_MESSAGE_STORAGE_KEY), first.id);

  // Even if random() returns 0 again, previous ID is filtered out so no immediate repeat occurs.
  const second = selectRandomErrorMessage({
    storage: mockStorage,
    random: () => 0,
  });
  assert.notEqual(second.id, first.id);
  assert.equal(second.id, ROTATING_ERROR_MESSAGES[1].id);
  assert.equal(second.description, ROTATING_ERROR_MESSAGES[1].description);
  assert.equal(second.context, ROTATING_ERROR_MESSAGES[1].context);

  // Degrades cleanly when storage is null or throws SecurityError
  const noStorage = selectRandomErrorMessage({ storage: null, random: () => 0.5 });
  assert.ok(ROTATING_ERROR_MESSAGES.some((m) => m.id === noStorage.id));

  const throwingStorage = {
    getItem: () => {
      throw new Error('SecurityError: storage disabled');
    },
    setItem: () => {
      throw new Error('SecurityError: storage disabled');
    },
  };
  const safeResult = selectRandomErrorMessage({ storage: throwingStorage, random: () => 0.25 });
  assert.ok(ROTATING_ERROR_MESSAGES.some((m) => m.id === safeResult.id));
});

test('3. NotFound renders matched message, 404 identifier, Return Home (/), View my service (/services), preserves URL, and applies noindex metadata', async () => {
  const env = setupDom('https://joshuaomole.com/some-nonexistent-workflow');

  try {
    const { default: NotFound } = await import('../pages/NotFound.js');

    let currentPathname = '';
    const PathProbe = () => {
      currentPathname = useLocation().pathname;
      return null;
    };

    const rootEl = document.getElementById('root')!;
    const root = createRoot(rootEl);

    await act(async () => {
      root.render(
        React.createElement(
          HelmetProvider,
          {},
          React.createElement(
            MemoryRouter,
            { initialEntries: ['/some-nonexistent-workflow'] },
            React.createElement(PathProbe),
            React.createElement(
              Routes,
              {},
              React.createElement(Route, { path: '/', element: React.createElement('div', null, 'Home') }),
              React.createElement(Route, {
                path: '/services',
                element: React.createElement('div', null, 'Services'),
              }),
              React.createElement(Route, { path: '*', element: React.createElement(NotFound) })
            )
          )
        )
      );
    });

    // URL preserved (no redirect to /)
    assert.equal(currentPathname, '/some-nonexistent-workflow');

    // 404 identifier + complete matched message object rendered
    const pageText = document.body.textContent || '';
    assert.ok(pageText.includes('404'));

    const h1Text = document.querySelector('h1')?.textContent || '';
    const matched = ROTATING_ERROR_MESSAGES.find((m) => m.headline === h1Text);
    assert.ok(matched, `Expected h1 "${h1Text}" to belong to ROTATING_ERROR_MESSAGES`);
    assert.ok(pageText.includes(matched.description));
    if (matched.context) {
      assert.ok(pageText.includes(matched.context));
    }

    // Navigation buttons point to real routes
    const homeLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('Return Home')
    );
    const servicesLink = Array.from(document.querySelectorAll('a')).find((a) =>
      a.textContent?.includes('View my service')
    );
    assert.ok(homeLink, 'Primary Return Home link should exist');
    assert.equal(homeLink.getAttribute('href'), '/');
    assert.ok(servicesLink, 'Secondary View my service link should exist');
    assert.equal(servicesLink.getAttribute('href'), '/services');

    // SEO metadata: title updated, noindex applied, canonical & ssr-jsonld removed
    assert.equal(document.title, '404 — Page Not Found | Joshua Omole');
    const robotsMeta = document.querySelector('meta[name="robots"]');
    assert.equal(robotsMeta?.getAttribute('content'), 'noindex, nofollow');
    assert.equal(document.getElementById('ssr-jsonld'), null);
    assert.equal(document.querySelector('link[rel="canonical"]'), null);

    // Selected ID recorded in sessionStorage
    assert.equal(window.sessionStorage.getItem(LAST_ERROR_MESSAGE_STORAGE_KEY), matched.id);

    await act(async () => {
      root.unmount();
    });
  } finally {
    env.cleanup();
  }
});

test('4. Server SSR meta and api/ssr-meta return genuine HTTP 404 + noindex + no canonical for unknown routes while valid routes stay 200', async () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');

  for (const unknownPath of ['/does-not-exist', '/services/missing-subpage', '/random-404-check']) {
    const meta = resolvePageMeta(unknownPath);
    assert.equal(meta.statusCode, 404, `Expected statusCode 404 for ${unknownPath}`);
    assert.equal(meta.isNotFound, true);
    assert.equal(meta.robots, 'noindex, nofollow');
    assert.equal(meta.canonicalUrl, null);

    const rendered = renderSeoHtmlDocument(indexHtml, unknownPath);
    assert.equal(rendered.statusCode, 404);
    assert.match(rendered.html, /<meta name="robots" content="noindex, nofollow" \/>/);
    assert.doesNotMatch(rendered.html, /<link rel="canonical"/);
    assert.doesNotMatch(rendered.html, /id="ssr-jsonld"/);
    assert.match(rendered.html, /href="\/"/);
    assert.match(rendered.html, /href="\/services"/);

    const mockRes: any = {
      statusCode: 0,
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
    await ssrMetaHandler(
      { method: 'GET', url: unknownPath, query: { path: unknownPath }, headers: {} },
      mockRes
    );
    assert.equal(mockRes.statusCode, 404);
    assert.match(mockRes.body, /<meta name="robots" content="noindex, nofollow" \/>/);
  }

  for (const validPath of [
    '/',
    '/about',
    '/services',
    '/training',
    '/audit',
    '/connect',
    '/newsletter',
    '/resources',
    '/business-workflow-fixes',
    '/clarity-map',
  ]) {
    const meta = resolvePageMeta(validPath);
    assert.equal(meta.statusCode, 200, `Expected 200 for ${validPath}`);
    assert.equal(meta.isNotFound, false);
    assert.equal(meta.robots, 'index, follow');
    assert.ok(meta.canonicalUrl);
  }

  const sitemapXml = buildSitemapXml();
  assert.doesNotMatch(sitemapXml, /404/);
  assert.doesNotMatch(sitemapXml, /not-found/i);
});
