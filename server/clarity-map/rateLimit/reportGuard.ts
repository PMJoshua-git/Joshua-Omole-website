import crypto from 'node:crypto';
import { getRateLimitConfig, type RateLimitConfig } from './config';
import { hashIdentity } from './ip';
import {
  InMemorySlidingWindowStore,
  UpstashSlidingWindowStore,
  type SlidingWindowStore,
} from './limiter';
import type { ClarityMapResult } from '../../../features/clarity-map/types/clarityMap';

export const REPORT_MAX_SENDS_PER_RESULT = 3;
export const REPORT_MAX_SENDS_PER_EMAIL_24H = 3;
export const REPORT_EMAIL_WINDOW_SECONDS = 86400; // 24 hours
export const REPORT_RESULT_WINDOW_SECONDS = 30 * 86400; // 30 days
export const REPORT_DEDUPE_WINDOW_SECONDS = 300; // 5 minutes

export const REPORT_LIMIT_MESSAGE =
  'This report has already been sent to that address. Please check your inbox and spam folder.';

export interface ReportGuardReservation {
  allowed: boolean;
  deduped: boolean;
  reason?: 'result_limit' | 'email_limit';
  message?: string;
  idempotencyKey: string;
  dedupedMessageId?: string | null;
  token: {
    resultKey: string;
    emailKey: string;
    dedupeKey: string;
    member: string;
    usedFallback: boolean;
  } | null;
}

export interface ReportGuardDeps {
  config?: RateLimitConfig;
  store?: SlidingWindowStore | null;
  fallbackStore?: InMemorySlidingWindowStore;
  now?: () => number;
  logger?: Pick<Console, 'warn' | 'error'>;
}

const sharedReportFallbackStore = new InMemorySlidingWindowStore();
let cachedUrl: string | null = null;
let cachedToken: string | null = null;
let cachedStore: UpstashSlidingWindowStore | null = null;

function getSharedReportStore(config: RateLimitConfig): SlidingWindowStore | null {
  if (!config.redisUrl || !config.redisToken) {
    return null;
  }
  if (
    cachedStore &&
    cachedUrl === config.redisUrl &&
    cachedToken === config.redisToken
  ) {
    return cachedStore;
  }
  cachedUrl = config.redisUrl;
  cachedToken = config.redisToken;
  cachedStore = new UpstashSlidingWindowStore(config.redisUrl, config.redisToken);
  return cachedStore;
}

export function deriveResultId(result: ClarityMapResult, explicitId?: string): string {
  if (explicitId && explicitId.trim() !== '') {
    return explicitId.trim().slice(0, 64);
  }
  const digest = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        meta: result.meta,
        summary: result.summary,
        readiness: result.readiness,
        current_nodes: result.current_state.nodes.map((n) => n.id),
        redesigned_nodes: result.redesigned_state.nodes.map((n) => n.id),
        bottlenecks: result.bottlenecks.map((b) => b.title),
      })
    )
    .digest('hex')
    .slice(0, 16);
  return `res_${digest}`;
}

export function maskEmailForLog(email: string): string {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  return `${local[0]}***@${domain}`;
}

export function createClarityMapReportGuard(deps: ReportGuardDeps = {}) {
  const nowFn = deps.now ?? (() => Date.now());
  const fallback = deps.fallbackStore ?? sharedReportFallbackStore;
  const logger = deps.logger ?? console;

  // Short-lived in-memory dedupe store for fast messageId caching alongside shared store
  const sentDedupeMessageIds = new Map<string, { expiresAt: number; messageId: string | null }>();

  const getActiveConfig = () => deps.config ?? getRateLimitConfig();
  const resolveStore = (config: RateLimitConfig): SlidingWindowStore | null => {
    if (deps.store !== undefined) return deps.store;
    return getSharedReportStore(config);
  };

  async function checkAndReserveSend(opts: {
    resultId: string;
    normalizedEmail: string;
  }): Promise<ReportGuardReservation> {
    const config = getActiveConfig();
    const nowMs = nowFn();
    const emailHash = hashIdentity(opts.normalizedEmail, config.secret).hashHex;

    const resultKey = `rep:res:${opts.resultId}`;
    const emailKey = `rep:email:${emailHash}`;
    const dedupeKey = `rep:dedupe:${opts.resultId}:${emailHash}`;
    const idempotencyKey = `clarity-map-report-${opts.resultId}-${emailHash.slice(0, 16)}-${Math.floor(
      nowMs / (REPORT_DEDUPE_WINDOW_SECONDS * 1000)
    )}`;

    const primaryStore = resolveStore(config);
    let activeStore: SlidingWindowStore = primaryStore ?? fallback;
    let usedFallback = !primaryStore;

    const dedupeWindowMs = REPORT_DEDUPE_WINDOW_SECONDS * 1000;
    const member = `${nowMs}:${crypto.randomUUID()}`;

    // 1. Short-lived double-submit deduplication (same resultId + email within 5 minutes)
    const cachedLocal = sentDedupeMessageIds.get(dedupeKey);
    if (cachedLocal && cachedLocal.expiresAt > nowMs) {
      return {
        allowed: true,
        deduped: true,
        idempotencyKey,
        dedupedMessageId: cachedLocal.messageId,
        token: null,
      };
    }

    try {
      const dedupeCheck = await activeStore.checkStatus(
        dedupeKey,
        nowMs,
        dedupeWindowMs,
        1
      );
      if (dedupeCheck.count >= 1) {
        return {
          allowed: true,
          deduped: true,
          idempotencyKey,
          dedupedMessageId: cachedLocal?.messageId ?? null,
          token: null,
        };
      }
    } catch (err: any) {
      logger.error(
        `[ReportGuard] Store error checking dedupe (${err?.message || 'unreachable'}); failing open to in-memory.`
      );
      activeStore = fallback;
      usedFallback = true;
    }

    // 2. Enforce max 3 report sends per resultId
    let reservedResult = false;
    try {
      const resultReserve = await activeStore.reserveAtomic(
        resultKey,
        nowMs,
        REPORT_RESULT_WINDOW_SECONDS * 1000,
        REPORT_MAX_SENDS_PER_RESULT,
        member,
        REPORT_RESULT_WINDOW_SECONDS + 120
      );
      if (!resultReserve.allowed) {
        return {
          allowed: false,
          deduped: false,
          reason: 'result_limit',
          message: REPORT_LIMIT_MESSAGE,
          idempotencyKey,
          token: null,
        };
      }
      reservedResult = true;

      // 3. Enforce max 3 report sends per hashed recipient email per 24 hours
      const emailReserve = await activeStore.reserveAtomic(
        emailKey,
        nowMs,
        REPORT_EMAIL_WINDOW_SECONDS * 1000,
        REPORT_MAX_SENDS_PER_EMAIL_24H,
        member,
        REPORT_EMAIL_WINDOW_SECONDS + 120
      );
      if (!emailReserve.allowed) {
        await activeStore.release(resultKey, member).catch(() => {});
        return {
          allowed: false,
          deduped: false,
          reason: 'email_limit',
          message: REPORT_LIMIT_MESSAGE,
          idempotencyKey,
          token: null,
        };
      }

      // 4. Mark dedupe slot immediately to block concurrent/double clicks in flight
      await activeStore.reserveAtomic(
        dedupeKey,
        nowMs,
        dedupeWindowMs,
        1,
        member,
        REPORT_DEDUPE_WINDOW_SECONDS + 30
      );
    } catch (err: any) {
      if (reservedResult) {
        await activeStore.release(resultKey, member).catch(() => {});
      }
      logger.error(
        `[ReportGuard] Store error enforcing safeguard (${err?.message || 'unreachable'}); failing open to in-memory.`
      );
      usedFallback = true;
      activeStore = fallback;

      const fbRes = await fallback.reserveAtomic(
        resultKey,
        nowMs,
        REPORT_RESULT_WINDOW_SECONDS * 1000,
        REPORT_MAX_SENDS_PER_RESULT,
        member
      );
      if (!fbRes.allowed) {
        return {
          allowed: false,
          deduped: false,
          reason: 'result_limit',
          message: REPORT_LIMIT_MESSAGE,
          idempotencyKey,
          token: null,
        };
      }

      const fbEmail = await fallback.reserveAtomic(
        emailKey,
        nowMs,
        REPORT_EMAIL_WINDOW_SECONDS * 1000,
        REPORT_MAX_SENDS_PER_EMAIL_24H,
        member
      );
      if (!fbEmail.allowed) {
        await fallback.release(resultKey, member).catch(() => {});
        return {
          allowed: false,
          deduped: false,
          reason: 'email_limit',
          message: REPORT_LIMIT_MESSAGE,
          idempotencyKey,
          token: null,
        };
      }

      await fallback.reserveAtomic(dedupeKey, nowMs, dedupeWindowMs, 1, member);
    }

    return {
      allowed: true,
      deduped: false,
      idempotencyKey,
      token: {
        resultKey,
        emailKey,
        dedupeKey,
        member,
        usedFallback,
      },
    };
  }

  function recordSendSuccess(
    token: ReportGuardReservation['token'],
    messageId: string | null
  ): void {
    if (!token) return;
    sentDedupeMessageIds.set(token.dedupeKey, {
      expiresAt: nowFn() + REPORT_DEDUPE_WINDOW_SECONDS * 1000,
      messageId,
    });
  }

  async function releaseSendReservation(
    token: ReportGuardReservation['token']
  ): Promise<void> {
    if (!token) return;
    sentDedupeMessageIds.delete(token.dedupeKey);
    const config = getActiveConfig();
    const primaryStore = resolveStore(config);
    const store = token.usedFallback || !primaryStore ? fallback : primaryStore;

    await Promise.all([
      store.release(token.resultKey, token.member).catch(() => {}),
      store.release(token.emailKey, token.member).catch(() => {}),
      store.release(token.dedupeKey, token.member).catch(() => {}),
    ]);
  }

  return {
    checkAndReserveSend,
    recordSendSuccess,
    releaseSendReservation,
  };
}

export const defaultReportGuard = createClarityMapReportGuard();
