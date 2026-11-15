import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';
import { getRateLimitConfig, type RateLimitConfig } from './config';
import {
  hashIdentity,
  normalizeIp,
  resolveClientIdentity,
  type RateLimitRequestLike,
} from './ip';

export interface RateLimitStatusResult {
  limit: number;
  remaining: number;
  reset_at: string | null;
  limited: boolean;
  allowlisted?: boolean;
  isUnknown?: boolean;
}

export interface RateLimitReservation {
  allowed: boolean;
  reason?: 'rate_limited' | 'high_demand';
  limit: number;
  remaining: number;
  reset_at: string | null;
  retry_after_seconds: number;
  headers: Record<string, string>;
  reservationToken: {
    key: string;
    member: string;
    globalKey?: string;
    usedFallback: boolean;
  } | null;
}

export interface SlidingWindowStore {
  checkStatus(key: string, nowMs: number, windowMs: number, limit: number): Promise<{
    count: number;
    oldestScoreMs: number | null;
  }>;
  reserveAtomic(
    key: string,
    nowMs: number,
    windowMs: number,
    limit: number,
    member: string,
    ttlSeconds: number
  ): Promise<{
    allowed: boolean;
    count: number;
    oldestScoreMs: number | null;
  }>;
  release(key: string, member: string): Promise<void>;
}

/**
 * Atomic Redis Lua script:
 * 1. Prunes entries older than (nowMs - windowMs)
 * 2. Checks current cardinality vs limit
 * 3. Reserves slot with ZADD + EXPIRE only if count < limit
 */
const ATOMIC_RESERVE_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local ttlSec = tonumber(ARGV[5])
local cutoff = now - windowMs

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = tonumber(redis.call('ZCARD', key))
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestScore = 0
  if oldest and #oldest >= 2 then
    oldestScore = tonumber(oldest[2])
  end
  return {0, count, oldestScore}
end

redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, ttlSec)
local oldestAfter = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local oldestScore = now
if oldestAfter and #oldestAfter >= 2 then
  oldestScore = tonumber(oldestAfter[2])
end
return {1, count + 1, oldestScore}
`;

export class InMemorySlidingWindowStore implements SlidingWindowStore {
  private buckets = new Map<string, Array<{ member: string; score: number }>>();

  private prune(key: string, nowMs: number, windowMs: number) {
    const cutoff = nowMs - windowMs;
    const entries = this.buckets.get(key) || [];
    const filtered = entries.filter((e) => e.score > cutoff);
    if (filtered.length > 0) {
      this.buckets.set(key, filtered);
    } else {
      this.buckets.delete(key);
    }
    return filtered;
  }

  async checkStatus(
    key: string,
    nowMs: number,
    windowMs: number
  ): Promise<{ count: number; oldestScoreMs: number | null }> {
    const entries = this.prune(key, nowMs, windowMs);
    entries.sort((a, b) => a.score - b.score);
    return {
      count: entries.length,
      oldestScoreMs: entries.length > 0 ? entries[0].score : null,
    };
  }

  async reserveAtomic(
    key: string,
    nowMs: number,
    windowMs: number,
    limit: number,
    member: string
  ): Promise<{ allowed: boolean; count: number; oldestScoreMs: number | null }> {
    const entries = this.prune(key, nowMs, windowMs);
    entries.sort((a, b) => a.score - b.score);

    if (entries.length >= limit) {
      return {
        allowed: false,
        count: entries.length,
        oldestScoreMs: entries.length > 0 ? entries[0].score : null,
      };
    }

    const updated = [...entries, { member, score: nowMs }].sort(
      (a, b) => a.score - b.score
    );
    this.buckets.set(key, updated);

    return {
      allowed: true,
      count: updated.length,
      oldestScoreMs: updated[0]?.score ?? nowMs,
    };
  }

  async release(key: string, member: string): Promise<void> {
    const entries = this.buckets.get(key);
    if (!entries) return;
    const filtered = entries.filter((e) => e.member !== member);
    if (filtered.length > 0) {
      this.buckets.set(key, filtered);
    } else {
      this.buckets.delete(key);
    }
  }

  clear() {
    this.buckets.clear();
  }
}

export class UpstashSlidingWindowStore implements SlidingWindowStore {
  private client: Redis;

  constructor(url: string, token: string) {
    this.client = new Redis({ url, token });
  }

  async checkStatus(
    key: string,
    nowMs: number,
    windowMs: number
  ): Promise<{ count: number; oldestScoreMs: number | null }> {
    const cutoff = nowMs - windowMs;
    await this.client.zremrangebyscore(key, '-inf', cutoff);
    const items = await this.client.zrange<(string | number)[]>(key, 0, -1, {
      withScores: true,
    });

    if (!items || items.length < 2) {
      return { count: 0, oldestScoreMs: null };
    }

    // @upstash/redis returns [member1, score1, member2, score2, ...] with withScores: true
    const count = Math.floor(items.length / 2);
    const oldestScoreMs = Number(items[1]);
    return {
      count,
      oldestScoreMs: Number.isFinite(oldestScoreMs) ? oldestScoreMs : null,
    };
  }

  async reserveAtomic(
    key: string,
    nowMs: number,
    windowMs: number,
    limit: number,
    member: string,
    ttlSeconds: number
  ): Promise<{ allowed: boolean; count: number; oldestScoreMs: number | null }> {
    const res = (await this.client.eval(
      ATOMIC_RESERVE_LUA,
      [key],
      [nowMs, windowMs, limit, member, ttlSeconds]
    )) as [number, number, number];

    const allowed = Number(res?.[0]) === 1;
    const count = Number(res?.[1] ?? 0);
    const rawOldest = Number(res?.[2] ?? 0);
    return {
      allowed,
      count,
      oldestScoreMs: rawOldest > 0 ? rawOldest : null,
    };
  }

  async release(key: string, member: string): Promise<void> {
    await this.client.zrem(key, member);
  }
}

export interface ClarityMapLimiterDeps {
  config?: RateLimitConfig;
  store?: SlidingWindowStore | null;
  fallbackStore?: InMemorySlidingWindowStore;
  now?: () => number;
  logger?: Pick<Console, 'warn' | 'error'>;
}

const sharedFallbackStore = new InMemorySlidingWindowStore();
let cachedRedisUrl: string | null = null;
let cachedRedisToken: string | null = null;
let cachedRedisStore: UpstashSlidingWindowStore | null = null;

function getDefaultStore(config: RateLimitConfig): SlidingWindowStore | null {
  if (!config.redisUrl || !config.redisToken) {
    return null;
  }
  if (
    cachedRedisStore &&
    cachedRedisUrl === config.redisUrl &&
    cachedRedisToken === config.redisToken
  ) {
    return cachedRedisStore;
  }
  cachedRedisUrl = config.redisUrl;
  cachedRedisToken = config.redisToken;
  cachedRedisStore = new UpstashSlidingWindowStore(config.redisUrl, config.redisToken);
  return cachedRedisStore;
}

export function createClarityMapRateLimiter(deps: ClarityMapLimiterDeps = {}) {
  const nowFn = deps.now ?? (() => Date.now());
  const fallback = deps.fallbackStore ?? sharedFallbackStore;
  const logger = deps.logger ?? console;
  let warnedMissingStore = false;

  const getActiveConfig = () => deps.config ?? getRateLimitConfig();

  const isAllowlisted = (
    normalizedIp: string | null,
    isLocalhost: boolean,
    config: RateLimitConfig
  ): boolean => {
    // Bypass on localhost in non-production development
    if (isLocalhost && !config.isProduction) {
      return true;
    }
    if (!normalizedIp || config.allowlist.length === 0) {
      return false;
    }

    const clientHash = hashIdentity(normalizedIp, config.secret).hashHex;
    for (const rawEntry of config.allowlist) {
      const normalizedEntry = normalizeIp(rawEntry);
      if (normalizedEntry) {
        const entryHash = hashIdentity(normalizedEntry, config.secret).hashHex;
        if (entryHash === clientHash) {
          return true;
        }
      } else if (rawEntry === clientHash) {
        return true;
      }
    }
    return false;
  };

  const resolveStore = (config: RateLimitConfig): SlidingWindowStore | null => {
    if (deps.store !== undefined) {
      return deps.store;
    }
    return getDefaultStore(config);
  };

  const computeResetFields = (
    oldestScoreMs: number | null,
    windowMs: number,
    nowMs: number
  ): { reset_at: string | null; retry_after_seconds: number } => {
    if (!oldestScoreMs) {
      return { reset_at: null, retry_after_seconds: 0 };
    }
    const resetMs = oldestScoreMs + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
    return {
      reset_at: new Date(resetMs).toISOString(),
      retry_after_seconds: retryAfter,
    };
  };

  async function checkLimitStatus(
    req: RateLimitRequestLike,
    options?: { trustProxy?: boolean }
  ): Promise<RateLimitStatusResult> {
    const config = getActiveConfig();
    const nowMs = nowFn();
    const windowMs = config.genWindowSeconds * 1000;
    const identity = resolveClientIdentity(req, {
      secret: config.secret,
      trustProxy: options?.trustProxy ?? config.trustProxy,
    });

    const limit = identity.isUnknown
      ? config.unknownIpLimit
      : config.genLimitPerWindow;

    if (isAllowlisted(identity.normalizedIp, identity.isLocalhost, config)) {
      return {
        limit,
        remaining: limit,
        reset_at: null,
        limited: false,
        allowlisted: true,
        isUnknown: identity.isUnknown,
      };
    }

    const store = resolveStore(config);
    let stats: { count: number; oldestScoreMs: number | null };

    if (store) {
      try {
        stats = await store.checkStatus(identity.redisKey, nowMs, windowMs, limit);
      } catch (err: any) {
        logger.error(
          `[RateLimit] Shared store unreachable during status check (${err?.message || 'unknown error'}); failing open to in-memory fallback.`
        );
        stats = await fallback.checkStatus(identity.redisKey, nowMs, windowMs);
      }
    } else {
      stats = await fallback.checkStatus(identity.redisKey, nowMs, windowMs);
    }

    const remaining = Math.max(0, limit - stats.count);
    const { reset_at } = computeResetFields(stats.oldestScoreMs, windowMs, nowMs);

    return {
      limit,
      remaining,
      reset_at,
      limited: remaining === 0,
      isUnknown: identity.isUnknown,
    };
  }

  async function reserveGenerationSlot(
    req: RateLimitRequestLike,
    options?: { trustProxy?: boolean }
  ): Promise<RateLimitReservation> {
    const config = getActiveConfig();
    const nowMs = nowFn();
    const windowMs = config.genWindowSeconds * 1000;
    const ttlSeconds = config.genWindowSeconds + 120;
    const identity = resolveClientIdentity(req, {
      secret: config.secret,
      trustProxy: options?.trustProxy ?? config.trustProxy,
    });

    if (identity.isUnknown) {
      logger.warn(
        JSON.stringify({
          event: 'clarity_map_unknown_client_ip',
          time: new Date(nowMs).toISOString(),
          ip_hash_prefix: identity.hashHex.slice(0, 8),
        })
      );
    }

    const limit = identity.isUnknown
      ? config.unknownIpLimit
      : config.genLimitPerWindow;

    if (isAllowlisted(identity.normalizedIp, identity.isLocalhost, config)) {
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset_at: null,
        retry_after_seconds: 0,
        headers: {
          'RateLimit-Limit': String(limit),
          'RateLimit-Remaining': String(limit),
        },
        reservationToken: null,
      };
    }

    const member = `${nowMs}:${crypto.randomUUID()}`;
    const primaryStore = resolveStore(config);
    let usedFallback = false;
    let activeStore: SlidingWindowStore;

    if (primaryStore) {
      activeStore = primaryStore;
    } else {
      if (!warnedMissingStore) {
        warnedMissingStore = true;
        logger.warn(
          '[RateLimit] Shared Redis store env vars not set; using in-memory per-instance limiter.'
        );
      }
      activeStore = fallback;
      usedFallback = true;
    }

    let ipReserve: { allowed: boolean; count: number; oldestScoreMs: number | null };

    try {
      ipReserve = await activeStore.reserveAtomic(
        identity.redisKey,
        nowMs,
        windowMs,
        limit,
        member,
        ttlSeconds
      );
    } catch (err: any) {
      // Fail open to in-memory fallback when Redis is unreachable
      logger.error(
        `[RateLimit] Shared store error (${err?.message || 'unreachable'}); failing open to in-memory fallback limiter.`
      );
      usedFallback = true;
      activeStore = fallback;
      ipReserve = await fallback.reserveAtomic(
        identity.redisKey,
        nowMs,
        windowMs,
        limit,
        member
      );
    }

    if (!ipReserve.allowed) {
      const { reset_at, retry_after_seconds } = computeResetFields(
        ipReserve.oldestScoreMs,
        windowMs,
        nowMs
      );
      logger.warn(
        JSON.stringify({
          event: 'clarity_map_rate_limit_blocked',
          time: new Date(nowMs).toISOString(),
          ip_hash_prefix: identity.hashHex.slice(0, 8),
          limit_type: identity.isUnknown ? 'unknown_ip_window' : 'ip_window',
        })
      );

      return {
        allowed: false,
        reason: 'rate_limited',
        limit,
        remaining: 0,
        reset_at,
        retry_after_seconds,
        headers: {
          'Retry-After': String(retry_after_seconds),
          'RateLimit-Limit': String(limit),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(retry_after_seconds),
        },
        reservationToken: null,
      };
    }

    // Optional Global Daily Generation Cap
    let globalKey: string | undefined;
    if (config.globalDailyGenerationCap > 0) {
      const gKey = 'gen:global:daily';
      try {
        const globalReserve = await activeStore.reserveAtomic(
          gKey,
          nowMs,
          windowMs,
          config.globalDailyGenerationCap,
          member,
          ttlSeconds
        );
        if (!globalReserve.allowed) {
          // Refund IP slot since global cap blocked this request
          await activeStore.release(identity.redisKey, member).catch(() => {});
          const { reset_at, retry_after_seconds } = computeResetFields(
            globalReserve.oldestScoreMs,
            windowMs,
            nowMs
          );
          logger.warn(
            JSON.stringify({
              event: 'clarity_map_rate_limit_blocked',
              time: new Date(nowMs).toISOString(),
              ip_hash_prefix: identity.hashHex.slice(0, 8),
              limit_type: 'global_daily_cap',
            })
          );
          return {
            allowed: false,
            reason: 'high_demand',
            limit,
            remaining: 0,
            reset_at,
            retry_after_seconds,
            headers: {
              'Retry-After': String(retry_after_seconds),
            },
            reservationToken: null,
          };
        }
        globalKey = gKey;
      } catch (err: any) {
        logger.error(
          `[RateLimit] Global cap check failed (${err?.message || 'unreachable'}); failing open.`
        );
      }
    }

    const remaining = Math.max(0, limit - ipReserve.count);
    const { reset_at, retry_after_seconds } = computeResetFields(
      ipReserve.oldestScoreMs,
      windowMs,
      nowMs
    );

    return {
      allowed: true,
      limit,
      remaining,
      reset_at,
      retry_after_seconds,
      headers: {
        'RateLimit-Limit': String(limit),
        'RateLimit-Remaining': String(remaining),
        ...(retry_after_seconds > 0
          ? { 'RateLimit-Reset': String(retry_after_seconds) }
          : {}),
      },
      reservationToken: {
        key: identity.redisKey,
        member,
        globalKey,
        usedFallback,
      },
    };
  }

  async function releaseGenerationSlot(
    token: RateLimitReservation['reservationToken']
  ): Promise<void> {
    if (!token) return;
    const config = getActiveConfig();
    const primaryStore = resolveStore(config);
    const store = token.usedFallback || !primaryStore ? fallback : primaryStore;

    await store.release(token.key, token.member).catch((err: any) => {
      logger.error(`[RateLimit] Failed to release IP slot: ${err?.message || 'error'}`);
    });

    if (token.globalKey) {
      await store.release(token.globalKey, token.member).catch((err: any) => {
        logger.error(
          `[RateLimit] Failed to release global cap slot: ${err?.message || 'error'}`
        );
      });
    }
  }

  return {
    checkLimitStatus,
    reserveGenerationSlot,
    releaseGenerationSlot,
    fallbackStore: fallback,
  };
}

export const defaultClarityMapRateLimiter = createClarityMapRateLimiter();
