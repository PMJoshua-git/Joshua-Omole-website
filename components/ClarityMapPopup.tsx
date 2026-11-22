import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import {
  buildClarityMapPopupHref,
  isPopupExcludedPath,
  POPUP_COPY,
  POPUP_DELAY_SECONDS,
  POPUP_RETRY_INTERVAL_MS,
  POPUP_RETRY_MAX_MS,
  trackPopupEvent,
} from '../features/clarity-map/config/popupConfig';

/**
 * Module-level in-memory session state ONLY (no localStorage, sessionStorage, or cookies).
 * Survives client-side route navigation within one page load; resets naturally on full reload.
 */
interface PopupMemoryState {
  doneForPageLoad: boolean;
  initialDismissed: boolean;
  scrollTriggeredForPageLoad: boolean;
  requireScrollLeaveBottom: boolean;
  visibleMsAccumulated: number;
  visibleStartMs: number | null;
  delayElapsed: boolean;
  holdBackStartMs: number | null;
}

const popupState: PopupMemoryState = {
  doneForPageLoad: false,
  initialDismissed: false,
  scrollTriggeredForPageLoad: false,
  requireScrollLeaveBottom: false,
  visibleMsAccumulated: 0,
  visibleStartMs: null,
  delayElapsed: false,
  holdBackStartMs: null,
};

/** Exposed strictly for automated unit tests simulating fresh page loads. */
export function resetClarityPopupMemoryState(): void {
  popupState.doneForPageLoad = false;
  popupState.initialDismissed = false;
  popupState.scrollTriggeredForPageLoad = false;
  popupState.requireScrollLeaveBottom = false;
  popupState.visibleMsAccumulated = 0;
  popupState.visibleStartMs = null;
  popupState.delayElapsed = false;
  popupState.holdBackStartMs = null;
}

export function isAtPageBottom(win: Window = window, doc: Document = document): boolean {
  const scrollTop =
    win.scrollY ??
    win.pageYOffset ??
    doc.documentElement?.scrollTop ??
    doc.body?.scrollTop ??
    0;
  const viewportHeight = win.innerHeight || doc.documentElement?.clientHeight || 0;
  const docHeight = Math.max(
    doc.documentElement?.scrollHeight || 0,
    doc.body?.scrollHeight || 0
  );

  // Page must be taller than the viewport and actually scrolled down from the top
  if (docHeight <= viewportHeight + 80 || scrollTop <= 0) {
    return false;
  }

  return scrollTop + viewportHeight >= docHeight - 80;
}

function getVisibleElapsedMs(now: number): number {
  if (popupState.visibleStartMs === null) {
    return popupState.visibleMsAccumulated;
  }
  return popupState.visibleMsAccumulated + Math.max(0, now - popupState.visibleStartMs);
}

export function isPopupHeldBack(doc: Document = document): boolean {
  const active = doc.activeElement as HTMLElement | null;
  if (active) {
    const tag = active.tagName?.toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) {
      return true;
    }
  }

  // Another modal/dialog open
  if (doc.querySelector('[aria-modal="true"]')) {
    return true;
  }

  // Booking embed open (Cal.com modal/embed)
  if (
    doc.querySelector(
      '.cal-modal, .cal-modal-box, cal-modal, iframe[src*="cal.com"], [data-cal-open="true"]'
    )
  ) {
    return true;
  }

  // Floating chat assistant panel open
  if (
    doc.querySelector(
      '#JotFormIFrame-019b3f0fa49d753791c4f0020584579e405a, [data-floating-assistant-open="true"]'
    )
  ) {
    return true;
  }

  return false;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function notifyFloatingUiVisibility(visible: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent('clarity-popup:visibility', {
        detail: { visible },
      })
    );
  } catch {
    // Ignore
  }
}

export interface ClarityMapPopupProps {
  delaySeconds?: number;
}

const ClarityMapPopup: React.FC<ClarityMapPopupProps> = ({
  delaySeconds = POPUP_DELAY_SECONDS,
}) => {
  const { pathname } = useLocation();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isEntered, setIsEntered] = useState(false);

  const delayMs = delaySeconds * 1000;
  const href = buildClarityMapPopupHref();
  const reducedMotion = mounted ? prefersReducedMotion() : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Broadcast pop-up visibility so FloatingAssistant coordinates without overlapping
  useEffect(() => {
    if (!mounted) return;
    notifyFloatingUiVisibility(isOpen);
    return () => {
      if (isOpen) {
        notifyFloatingUiVisibility(false);
      }
    };
  }, [mounted, isOpen]);

  // Smooth 200ms entrance animation (disabled when prefers-reduced-motion: reduce)
  useEffect(() => {
    if (!isOpen) {
      setIsEntered(false);
      return;
    }
    if (prefersReducedMotion()) {
      setIsEntered(true);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isOpen]);

  const dismissPopup = useCallback(
    (reason: 'dismiss' | 'click') => {
      if (popupState.doneForPageLoad && !isOpen) return;
      popupState.doneForPageLoad = true;
      setIsOpen(false);
      setIsEntered(false);
      const secondsOnSite = Math.round(getVisibleElapsedMs(Date.now()) / 1000);
      if (reason === 'click') {
        popupState.scrollTriggeredForPageLoad = true;
        trackPopupEvent('clarity_popup_clicked', {
          path: pathname,
          seconds_on_site: secondsOnSite,
        });
      } else {
        if (!popupState.initialDismissed && !popupState.scrollTriggeredForPageLoad) {
          popupState.initialDismissed = true;
          popupState.requireScrollLeaveBottom =
            typeof window !== 'undefined' && typeof document !== 'undefined'
              ? isAtPageBottom(window, document)
              : false;
        }
        trackPopupEvent('clarity_popup_dismissed', {
          path: pathname,
          seconds_on_site: secondsOnSite,
        });
      }
    },
    [isOpen, pathname]
  );

  // Escape key closes when open
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissPopup('dismiss');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, dismissPopup]);

  // Visible-time accumulator + hold-back retry loop across route changes
  useEffect(() => {
    if (!mounted || popupState.doneForPageLoad || isOpen) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;
    let retryTimerId: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (retryTimerId !== null) {
        clearTimeout(retryTimerId);
        retryTimerId = null;
      }
    };

    const tryShowOrRetry = () => {
      if (popupState.doneForPageLoad) return;

      // If visitor is currently on an excluded route, wait until they navigate to an allowed route
      if (isPopupExcludedPath(pathname)) {
        popupState.holdBackStartMs = null;
        return;
      }

      const now = Date.now();
      if (!isPopupHeldBack()) {
        popupState.holdBackStartMs = null;
        popupState.doneForPageLoad = true;
        setIsOpen(true);
        trackPopupEvent('clarity_popup_shown', {
          path: pathname,
          seconds_on_site: Math.round(getVisibleElapsedMs(now) / 1000),
        });
        return;
      }

      if (popupState.holdBackStartMs === null) {
        popupState.holdBackStartMs = now;
      }

      const heldForMs = now - popupState.holdBackStartMs;
      if (heldForMs >= POPUP_RETRY_MAX_MS) {
        // Give up for this page load after 20s of hold-backs
        popupState.doneForPageLoad = true;
        return;
      }

      retryTimerId = setTimeout(tryShowOrRetry, POPUP_RETRY_INTERVAL_MS);
    };

    const scheduleRemainingDelay = () => {
      clearTimers();
      if (popupState.doneForPageLoad) return;

      if (popupState.delayElapsed) {
        tryShowOrRetry();
        return;
      }

      const isHidden =
        typeof document.hidden === 'boolean'
          ? document.hidden
          : document.visibilityState === 'hidden';

      if (isHidden) {
        if (popupState.visibleStartMs !== null) {
          popupState.visibleMsAccumulated += Math.max(
            0,
            Date.now() - popupState.visibleStartMs
          );
          popupState.visibleStartMs = null;
        }
        return;
      }

      const now = Date.now();
      if (popupState.visibleStartMs === null) {
        popupState.visibleStartMs = now;
      }

      const elapsed = getVisibleElapsedMs(now);
      const remaining = Math.max(0, delayMs - elapsed);

      if (remaining === 0) {
        popupState.visibleMsAccumulated = elapsed;
        popupState.visibleStartMs = null;
        popupState.delayElapsed = true;
        tryShowOrRetry();
        return;
      }

      timerId = setTimeout(() => {
        const firedAt = Date.now();
        popupState.visibleMsAccumulated = getVisibleElapsedMs(firedAt);
        popupState.visibleStartMs = null;
        popupState.delayElapsed = true;
        tryShowOrRetry();
      }, remaining);
    };

    const handleVisibilityChange = () => {
      const isHidden =
        typeof document.hidden === 'boolean'
          ? document.hidden
          : document.visibilityState === 'hidden';

      if (isHidden) {
        if (popupState.visibleStartMs !== null) {
          popupState.visibleMsAccumulated += Math.max(
            0,
            Date.now() - popupState.visibleStartMs
          );
          popupState.visibleStartMs = null;
        }
        clearTimers();
      } else {
        scheduleRemainingDelay();
      }
    };

    scheduleRemainingDelay();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, pathname, delayMs, isOpen]);

  // Clear bottom-guard across client-side route transitions
  useEffect(() => {
    popupState.requireScrollLeaveBottom = false;
  }, [pathname]);

  // Re-open pop-up once when reaching the end of a page after cancelling the initial pop-up
  useEffect(() => {
    if (
      !mounted ||
      isOpen ||
      !popupState.initialDismissed ||
      popupState.scrollTriggeredForPageLoad ||
      isPopupExcludedPath(pathname)
    ) {
      return;
    }

    const handleScroll = () => {
      if (
        !popupState.initialDismissed ||
        popupState.scrollTriggeredForPageLoad ||
        isPopupExcludedPath(pathname)
      ) {
        return;
      }

      const atBottom = isAtPageBottom(window, document);
      if (popupState.requireScrollLeaveBottom) {
        if (!atBottom) {
          popupState.requireScrollLeaveBottom = false;
        }
        return;
      }

      if (atBottom && !isPopupHeldBack()) {
        popupState.scrollTriggeredForPageLoad = true;
        setIsOpen(true);
        trackPopupEvent('clarity_popup_shown', {
          path: pathname,
          seconds_on_site: Math.round(getVisibleElapsedMs(Date.now()) / 1000),
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mounted, pathname, isOpen]);

  // Client-only guard: never render on SSR or before delay elapses
  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarity-popup-heading"
      data-testid="clarity-map-popup"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          dismissPopup('dismiss');
        }
      }}
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#1E2620]/85 backdrop-blur-sm ${
        reducedMotion
          ? 'opacity-100 transition-none'
          : `transition-opacity duration-200 ease-out motion-reduce:transition-none ${
              isEntered ? 'opacity-100' : 'opacity-0'
            }`
      }`}
    >
      <div
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-sage-border rounded-2xl shadow-medium p-7 sm:p-8 space-y-5 text-sage-text ${
          reducedMotion
            ? 'opacity-100 translate-y-0 scale-100 transition-none'
            : `transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                isEntered
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-2 scale-95'
              }`
        }`}
      >
        <button
          type="button"
          onClick={() => dismissPopup('dismiss')}
          aria-label={POPUP_COPY.closeAriaLabel}
          className="absolute top-4 right-4 w-10 h-10 rounded-lg flex items-center justify-center text-sage-muted hover:text-sage-text hover:bg-sage-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405A46]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pr-8 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.11em] text-[#405A46]">
            {POPUP_COPY.eyebrow}
          </div>
          <h2
            id="clarity-popup-heading"
            className="font-serif text-2xl sm:text-[26px] font-bold text-sage-text leading-snug"
          >
            {POPUP_COPY.heading}
          </h2>
          <p className="text-sm text-sage-sec leading-relaxed">
            {POPUP_COPY.body}
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <Link
            to={href}
            onClick={() => dismissPopup('click')}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#405A46] hover:bg-[#334838] text-white font-semibold text-sm transition-colors min-h-[44px]"
          >
            <span>{POPUP_COPY.primaryCta}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => dismissPopup('dismiss')}
            className="w-full px-5 py-3.5 rounded-xl border border-sage-border bg-white hover:bg-sage-surface-2 text-sage-text font-medium text-sm transition-colors min-h-[44px]"
          >
            {POPUP_COPY.secondaryCta}
          </button>
        </div>

        <p className="text-xs text-sage-muted text-center leading-relaxed">
          {POPUP_COPY.finePrint}
        </p>
      </div>
    </div>
  );
};

export default ClarityMapPopup;
