export interface RateLimitConfig {
  genLimitPerWindow: number;
  genWindowSeconds: number;
  unknownIpLimit: number;
  globalDailyGenerationCap: number;
  allowlist: string[];
  secret: string;
  redisUrl: string | null;
  redisToken: string | null;
  isProduction: boolean;
  trustProxy: boolean;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getRateLimitConfig(
  env: Record<string, string | undefined> = process.env
): RateLimitConfig {
  const isProduction =
    env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production';

  const redisUrl =
    env.UPSTASH_REDIS_REST_URL?.trim() ||
    env.KV_REST_API_URL?.trim() ||
    null;

  const redisToken =
    env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    env.KV_REST_API_TOKEN?.trim() ||
    null;

  const allowlist = (env.RATE_LIMIT_ALLOWLIST || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  // Use RATE_LIMIT_SECRET for HMAC-SHA256 hashing; fall back safely in dev/preview if unset
  const secret =
    env.RATE_LIMIT_SECRET?.trim() ||
    'dev-ephemeral-clarity-map-rate-limit-secret';

  const trustProxy =
    Boolean(env.VERCEL) ||
    Boolean(env.VERCEL_ENV) ||
    Boolean(env.VERCEL_URL) ||
    env.TRUST_PROXY === 'true' ||
    env.TRUST_PROXY === '1';

  return {
    genLimitPerWindow: parsePositiveInt(env.GEN_LIMIT_PER_WINDOW, 2),
    genWindowSeconds: parsePositiveInt(env.GEN_WINDOW_SECONDS, 86400),
    unknownIpLimit: parsePositiveInt(env.UNKNOWN_IP_LIMIT, 10),
    globalDailyGenerationCap: parseNonNegativeInt(
      env.GLOBAL_DAILY_GENERATION_CAP,
      0
    ),
    allowlist,
    secret,
    redisUrl,
    redisToken,
    isProduction,
    trustProxy,
  };
}
