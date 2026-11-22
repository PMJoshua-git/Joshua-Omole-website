import { appendUtmParams, type UtmClickParams } from '../../../utils/attribution.js';

export const POPUP_DELAY_SECONDS = 5;
export const POPUP_RETRY_INTERVAL_MS = 2000;
export const POPUP_RETRY_MAX_MS = 20000;

export const POPUP_EXCLUDED_PATHS: readonly string[] = [
  '/clarity-map',
  '/audit',
  '/business-workflow-fixes',
  '/checkout',
  '/payment',
  '/pay',
  '/booking',
];

export const POPUP_TARGET_ROUTE = '/clarity-map';

export const POPUP_UTM_PARAMS: UtmClickParams = {
  utm_source: 'site',
  utm_medium: 'popup',
  utm_campaign: 'clarity_map_popup',
};

export const POPUP_COPY = {
  eyebrow: 'Free process mapper',
  heading: 'See how your process really runs.',
  body: 'Choose your industry, answer 10 quick questions, and get a map of your current process next to a redesigned version. Takes about 4 minutes.',
  primaryCta: 'Try the Clarity Map',
  secondaryCta: 'Maybe later',
  finePrint: 'Free. See your map without leaving an email.',
  closeAriaLabel: 'Close',
} as const;

export type ClarityPopupEventName =
  | 'clarity_popup_shown'
  | 'clarity_popup_clicked'
  | 'clarity_popup_dismissed';

export interface ClarityPopupEventPayload {
  path: string;
  seconds_on_site: number;
}

export function normalizePathname(pathname: string): string {
  const pathOnly = pathname.split('?')[0].split('#')[0].trim().toLowerCase();
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    return pathOnly.slice(0, -1);
  }
  return pathOnly || '/';
}

export function isPopupExcludedPath(
  pathname: string,
  excludedPaths: readonly string[] = POPUP_EXCLUDED_PATHS
): boolean {
  const clean = normalizePathname(pathname);
  return excludedPaths.some((prefix) => {
    const cleanPrefix = normalizePathname(prefix);
    return clean === cleanPrefix || clean.startsWith(`${cleanPrefix}/`);
  });
}

export function buildClarityMapPopupHref(
  targetRoute: string = POPUP_TARGET_ROUTE,
  utm: UtmClickParams = POPUP_UTM_PARAMS
): string {
  return appendUtmParams(targetRoute, utm);
}

/**
 * Lightweight analytics helper matching Clarity Map's existing event dispatch + gtag pattern.
 * Logs in development and dispatches a CustomEvent on window so providers can subscribe.
 */
export function trackPopupEvent(
  event: ClarityPopupEventName,
  payload: ClarityPopupEventPayload
): void {
  if (typeof window === 'undefined') return;
  try {
    const metaEnv = (import.meta as any)?.env;
    const isDev =
      Boolean(metaEnv?.DEV) ||
      (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

    if (isDev) {
      console.info(`[Analytics] ${event}`, payload);
    }

    window.dispatchEvent(
      new CustomEvent('clarity-popup:analytics', {
        detail: { event, ...payload, ts: Date.now() },
      })
    );

    const w = window as any;
    if (typeof w.gtag === 'function') {
      w.gtag('event', event, payload);
    }
  } catch {
    // Analytics must never interrupt UX
  }
}
