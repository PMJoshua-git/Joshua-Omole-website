import type {
  ClarityMapResult,
  ClarityMapStage,
  QuestionAnswerValue,
  QuestionnaireSubmission,
} from '../types/clarityMap.js';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_at: string | null;
}

export interface LimitStatusResponse extends RateLimitInfo {
  limited: boolean;
}

export interface AnalyzeResponse {
  ok: boolean;
  analysis: ClarityMapResult;
  redactedPII?: boolean;
  rate_limit?: RateLimitInfo;
}

export interface ReportResponse {
  ok: boolean;
  emailSent: boolean;
  internalSent: boolean;
  loopsSynced: boolean;
  loopsAction?: 'created' | 'updated';
}

export class RateLimitError extends Error {
  limit: number;
  remaining: number;
  reset_at: string | null;
  retry_after_seconds: number;

  constructor(data: {
    limit?: number;
    remaining?: number;
    reset_at?: string | null;
    retry_after_seconds?: number;
  }) {
    super("You've used your free maps for today.");
    this.name = 'RateLimitError';
    this.limit = typeof data.limit === 'number' ? data.limit : 2;
    this.remaining = typeof data.remaining === 'number' ? data.remaining : 0;
    this.reset_at = data.reset_at ?? null;
    this.retry_after_seconds =
      typeof data.retry_after_seconds === 'number' ? data.retry_after_seconds : 0;
  }
}

export class HighDemandError extends Error {
  constructor() {
    super('The Clarity Map is very busy right now.');
    this.name = 'HighDemandError';
  }
}

export class NetworkConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkConnectionError';
  }
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function createFriendlyNetworkError(action: 'analyze' | 'report'): NetworkConnectionError {
  if (isBrowserOffline()) {
    return new NetworkConnectionError(
      action === 'analyze'
        ? 'You appear to be offline. Reconnect to Wi-Fi or mobile data and tap "Try analysis again".'
        : 'You appear to be offline. Reconnect to Wi-Fi or mobile data and try sending the report again.'
    );
  }
  if (action === 'analyze') {
    return new NetworkConnectionError(
      'Your connection was interrupted before the workflow map could finish. Please keep this page open (don\'t lock your screen or switch apps) and tap "Try analysis again". If this keeps happening on mobile, try opening this page directly in Chrome or Safari or switching between Wi-Fi and mobile data.'
    );
  }
  return new NetworkConnectionError(
    "We couldn't reach the server to send your report. Please check your connection and try again."
  );
}

export async function fetchLimitStatus(): Promise<LimitStatusResponse | null> {
  try {
    const res = await fetch('/api/clarity-map/limit-status', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as any;
    if (!data || typeof data.limited !== 'boolean') return null;
    return {
      limit: typeof data.limit === 'number' ? data.limit : 2,
      remaining: typeof data.remaining === 'number' ? data.remaining : 2,
      reset_at: typeof data.reset_at === 'string' ? data.reset_at : null,
      limited: data.limited,
    };
  } catch {
    // Fail open on network/status errors so visitors are never blocked unintentionally
    return null;
  }
}

export async function analyzeWorkflow(
  submission: QuestionnaireSubmission
): Promise<AnalyzeResponse> {
  let res: Response;
  try {
    res = await fetch('/api/clarity-map/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch {
    throw createFriendlyNetworkError('analyze');
  }

  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    throw createFriendlyNetworkError('analyze');
  }

  const trimmedText = rawText.trim();
  let payload: any = {};
  let isJson = false;
  if (trimmedText) {
    try {
      const parsed = JSON.parse(trimmedText);
      if (parsed && typeof parsed === 'object') {
        payload = parsed;
        isJson = true;
      }
    } catch {
      isJson = false;
    }
  }

  const effectiveStatus =
    !res.ok
      ? res.status
      : payload?.ok === false && typeof payload?.statusCode === 'number'
      ? payload.statusCode
      : res.status;

  if (effectiveStatus === 429 || payload?.error === 'rate_limited') {
    throw new RateLimitError({
      limit: payload?.limit,
      remaining: payload?.remaining,
      reset_at: payload?.reset_at,
      retry_after_seconds: payload?.retry_after_seconds,
    });
  }

  if (effectiveStatus === 503 && payload?.error === 'high_demand') {
    throw new HighDemandError();
  }

  if (!res.ok || payload?.ok === false) {
    if (!isJson) {
      if (effectiveStatus === 504) {
        throw new Error('The analysis took longer than expected. Please try again.');
      }
      if (effectiveStatus >= 500) {
        throw new Error('Something went wrong on our side. Please try again in a moment.');
      }
    }
    throw new Error(
      payload?.error || 'Could not complete workflow analysis right now. Please try again.'
    );
  }
  return payload as AnalyzeResponse;
}

export async function requestFullReport(opts: {
  firstName: string;
  email: string;
  analysis: ClarityMapResult;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  landingPage?: string;
  leadSource?: string;
  leadStatus?: string;
  leadType?: string;
}): Promise<ReportResponse> {
  let res: Response;
  try {
    res = await fetch('/api/clarity-map/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });
  } catch {
    throw createFriendlyNetworkError('report');
  }

  const payload = (await res.json().catch(() => ({}))) as any;
  if (!res.ok) {
    throw new Error(
      payload?.error || 'Unable to send your full PDF report right now. Please try again.'
    );
  }
  return payload as ReportResponse;
}

// ── Session Persistence (sessionStorage only; zero database) ──
const SESSION_KEY = 'clarity_map_session_v1';

export type ClarityMapScreen =
  | 'intro'
  | 'industry'
  | 'process'
  | 'questionnaire'
  | 'review'
  | 'analyzing'
  | 'results';

export interface PersistedClarityMapSession {
  screen: ClarityMapScreen;
  industryId: string | null;
  processCode: string | null;
  currentQuestionIndex: number;
  answers: Record<string, QuestionAnswerValue>;
  analysis: ClarityMapResult | null;
  activeStage: ClarityMapStage;
  emailPromptHandled: boolean;
  reportSentToEmail: string | null;
  reportFirstName: string | null;
}

export function loadClarityMapSession(): Partial<PersistedClarityMapSession> | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveClarityMapSession(state: PersistedClarityMapSession): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / privacy mode errors
  }
}

export function clearClarityMapSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore errors
  }
}

// ── Lightweight Analytics (non-sensitive events only) ──
export type ClarityMapEventName =
  | 'studio_viewed'
  | 'industry_selected'
  | 'process_selected'
  | 'questionnaire_started'
  | 'questionnaire_completed'
  | 'analysis_succeeded'
  | 'analysis_failed'
  | 'stage_viewed'
  | 'report_requested'
  | 'report_sent'
  | 'report_failed'
  | 'audit_cta_clicked';

export function trackClarityMapEvent(
  event: ClarityMapEventName,
  metadata?: Record<string, string | number | boolean>
): void {
  try {
    window.dispatchEvent(
      new CustomEvent('clarity-map:analytics', {
        detail: { event, metadata: metadata || {}, ts: Date.now() },
      })
    );
    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', `clarity_map_${event}`, metadata || {});
    }
  } catch {
    // Analytics must never interrupt UX
  }
}
