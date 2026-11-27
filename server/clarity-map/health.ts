import crypto from 'node:crypto';
import { pingGeminiHealth } from './ai/geminiAnalyzer.js';

function hasNonEmptyEnv(name: string): boolean {
  const val = process.env[name];
  return typeof val === 'string' && val.trim().length > 0;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string
): string | null {
  if (!headers) return null;
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  return typeof str === 'string' ? str : null;
}

function timingSafeMatches(provided: string | null, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function handleHealthRequest(
  req: {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: {
    status(code: number): any;
    json(payload: unknown): any;
    setHeader(name: string, value: string): any;
    end?(): any;
  },
  deps: {
    pingGemini?: typeof pingGeminiHealth;
  } = {}
) {
  const expectedToken = process.env.DIAGNOSTICS_TOKEN?.trim();
  const providedToken = getHeaderValue(req.headers, 'x-diagnostics-token');

  if (!expectedToken || !timingSafeMatches(providedToken, expectedToken)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const pingFn = deps.pingGemini ?? pingGeminiHealth;
  const gemini = await pingFn();

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    nodeVersion: process.version,
    env: {
      GEMINI_API_KEY: hasNonEmptyEnv('GEMINI_API_KEY'),
      GEMINI_MODEL: hasNonEmptyEnv('GEMINI_MODEL'),
      GEMINI_FALLBACK_MODEL: hasNonEmptyEnv('GEMINI_FALLBACK_MODEL'),
      UPSTASH_REDIS_REST_URL: hasNonEmptyEnv('UPSTASH_REDIS_REST_URL') || hasNonEmptyEnv('KV_REST_API_URL'),
      UPSTASH_REDIS_REST_TOKEN: hasNonEmptyEnv('UPSTASH_REDIS_REST_TOKEN') || hasNonEmptyEnv('KV_REST_API_TOKEN'),
      KV_REST_API_URL: hasNonEmptyEnv('KV_REST_API_URL'),
      KV_REST_API_TOKEN: hasNonEmptyEnv('KV_REST_API_TOKEN'),
      RATE_LIMIT_SECRET: hasNonEmptyEnv('RATE_LIMIT_SECRET'),
      RESEND_API_KEY: hasNonEmptyEnv('RESEND_API_KEY'),
      RESEND_FROM_EMAIL: hasNonEmptyEnv('RESEND_FROM_EMAIL'),
      RESEND_REPLY_TO: hasNonEmptyEnv('RESEND_REPLY_TO'),
      LOOPS_API_KEY: hasNonEmptyEnv('LOOPS_API_KEY'),
    },
    gemini,
  });
}
