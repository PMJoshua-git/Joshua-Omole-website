import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'node:crypto';
import { z } from 'zod';

import {
  RESOURCES_DIR,
  getResourceBySlug,
  getPublicResources,
} from './resources/registry.js';
import { sendResourceEmail } from './resources/email.js';
import { getRateLimitConfig } from './clarity-map/rateLimit/config.js';
import { resolveClientIdentity } from './clarity-map/rateLimit/ip.js';
import {
  InMemorySlidingWindowStore,
  UpstashSlidingWindowStore,
  type SlidingWindowStore,
} from './clarity-map/rateLimit/limiter.js';
import {
  handleSaveContactRequest,
  handleSubscribeRequest,
} from './leads/handlers.js';
import { buildSitemapXml } from './seo/sitemap.js';

import bookConsultationRouter from '../services/api/book-consultation.js';
import newsletterSubscribeRouter from '../services/api/newsletter-subscribe.js';
import trainingSessionsRouter from '../services/api/training-sessions.js';
import bookTrainingRouter from '../services/api/book-training.js';
import clarityMapRouter from './clarity-map/routes.js';

const RESOURCE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RESOURCE_LIMIT_MAX = 10;
const RESOURCE_LIMIT_TTL_SEC = 16 * 60;

const resourceFallbackStore = new InMemorySlidingWindowStore();
let cachedResourceStoreUrl: string | null = null;
let cachedResourceStoreToken: string | null = null;
let cachedResourceStore: UpstashSlidingWindowStore | null = null;

function getResourceRateLimitStore(): { store: SlidingWindowStore; usedFallback: boolean } {
  const cfg = getRateLimitConfig();
  if (!cfg.redisUrl || !cfg.redisToken) {
    return { store: resourceFallbackStore, usedFallback: true };
  }
  if (
    cachedResourceStore &&
    cachedResourceStoreUrl === cfg.redisUrl &&
    cachedResourceStoreToken === cfg.redisToken
  ) {
    return { store: cachedResourceStore, usedFallback: false };
  }
  cachedResourceStoreUrl = cfg.redisUrl;
  cachedResourceStoreToken = cfg.redisToken;
  cachedResourceStore = new UpstashSlidingWindowStore(cfg.redisUrl, cfg.redisToken);
  return { store: cachedResourceStore, usedFallback: false };
}

async function resourceRateLimitMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const cfg = getRateLimitConfig();
    const identity = resolveClientIdentity(req, {
      secret: cfg.secret,
      trustProxy: true,
    });
    const key = `resreq:${identity.hashHex}`;
    const nowMs = Date.now();
    const member = `${nowMs}:${crypto.randomUUID()}`;
    const { store } = getResourceRateLimitStore();

    let reserveResult;
    try {
      reserveResult = await store.reserveAtomic(
        key,
        nowMs,
        RESOURCE_LIMIT_WINDOW_MS,
        RESOURCE_LIMIT_MAX,
        member,
        RESOURCE_LIMIT_TTL_SEC
      );
    } catch {
      reserveResult = await resourceFallbackStore.reserveAtomic(
        key,
        nowMs,
        RESOURCE_LIMIT_WINDOW_MS,
        RESOURCE_LIMIT_MAX,
        member
      );
    }

    if (!reserveResult.allowed) {
      const oldest = reserveResult.oldestScoreMs ?? nowMs;
      const retryAfter = Math.max(
        1,
        Math.ceil((oldest + RESOURCE_LIMIT_WINDOW_MS - nowMs) / 1000)
      );
      res.setHeader('Retry-After', String(retryAfter));
      return res
        .status(429)
        .json({ error: 'Too many requests. Please try again in a few minutes.' });
    }
    return next();
  } catch {
    return next();
  }
}

const resourceRequestSchema = z.object({
  slug: z.string().min(1).max(100),
  firstName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  website: z.string().optional().default(''), // honeypot
  leadSource: z.string().optional().default(''),
  landingPage: z.string().optional().default(''),
  utmParameters: z.string().optional().default(''),
});

async function addToLoops(opts: {
  email: string;
  firstName: string;
  userGroup: string;
  source?: string;
}) {
  if (!process.env.LOOPS_API_KEY) {
    console.warn('[Loops] LOOPS_API_KEY is not set in environment');
    return;
  }
  const payload = {
    email: opts.email,
    firstName: opts.firstName || '',
    userGroup: opts.userGroup,
    source: opts.source || 'joshuaomole.com',
  };

  const createRes = await fetch('https://app.loops.so/api/v1/contacts/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (createRes.status === 409) {
    const updateRes = await fetch('https://app.loops.so/api/v1/contacts/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Loops update failed (${updateRes.status}): ${errText}`);
    }
    return;
  }

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Loops create failed (${createRes.status}): ${errText}`);
  }
}

export function createApiApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const jsonParser = express.json({ limit: '1mb' });
  app.use((req, res, next) => {
    if (req.body !== undefined) {
      return next();
    }
    return jsonParser(req, res, next);
  });

  app.use('/api/book-consultation', bookConsultationRouter);
  app.use('/api/newsletter-subscribe', newsletterSubscribeRouter);
  app.use('/api/training-sessions', trainingSessionsRouter);
  app.use('/api/book-training', bookTrainingRouter);
  app.use('/api/clarity-map', clarityMapRouter);

  app.get('/sitemap.xml', (_req, res) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(buildSitemapXml());
  });

  app.get('/api/resources', (_req, res) => {
    res.set('Cache-Control', 'public, max-age=300');
    res.json(getPublicResources());
  });

  app.post('/api/resource-request', resourceRateLimitMiddleware, async (req, res) => {
    const parseResult = resourceRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: 'Please check your details and try again.' });
    }

    const { slug, firstName, email, website, leadSource } = parseResult.data;

    if (website && website.trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    const resource = getResourceBySlug(slug);
    if (!resource || resource.status !== 'published') {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const filePath = path.resolve(RESOURCES_DIR, resource.fileName);
    if (!filePath.startsWith(RESOURCES_DIR)) {
      console.error(`[Security Alert] Traversal attempt rejected: ${resource.fileName}`);
      return res.status(400).json({ error: 'Invalid file path request' });
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.promises.readFile(filePath);
    } catch (err) {
      console.error(`Failed to read file for resource "${slug}" at "${filePath}":`, err);
      return res.status(500).json({
        error: "We couldn't prepare your download. Please try again shortly.",
      });
    }

    const [emailResult, loopsResult] = await Promise.allSettled([
      sendResourceEmail({
        to: email,
        firstName,
        resource,
        file: fileBuffer,
      }),
      addToLoops({
        email,
        firstName,
        userGroup: resource.loopsGroup,
        source: leadSource || 'Resources page',
      }),
    ]);

    if (emailResult.status === 'rejected') {
      console.error(`Resend email delivery failed (${slug}):`, emailResult.reason);
      return res
        .status(502)
        .json({ error: "We couldn't send your copy. Please try again in a moment." });
    }

    if (loopsResult.status === 'rejected') {
      console.error(`Loops tagging failed (${slug}):`, loopsResult.reason);
    }

    return res.status(200).json({ ok: true });
  });

  app.post('/api/subscribe', (req, res) => handleSubscribeRequest(req, res));
  app.post('/api/save-contact', (req, res) => handleSaveContactRequest(req, res));

  return app;
}

const apiApp = createApiApp();
export default apiApp;
