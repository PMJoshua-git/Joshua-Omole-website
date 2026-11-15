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
  visibleMsAccumulated: number;
  visibleStartMs: number | null;
  delayElapsed: boolean;
  holdBackStartMs: number | null;
}

const popupState: PopupMemoryState = {
  doneForPageLoad: false,
  visibleMsAccumulated: 0,
  visibleStartMs: null,
  delayElapsed: false,
  holdBackStartMs: null,
};

/** Exposed strictly for automated unit tests simulating fresh page loads. */
export function resetClarityPopupMemoryState(): void {
  popupState.doneForPageLoad = false;
  popupState.visibleMsAccumulated = 0;
  popupState.visibleStartMs = null;
  popupState.delayElapsed = false;
  popupState.holdBackStartMs = null;
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
        trackPopupEvent('clarity_popup_clicked', {
          path: pathname,
          seconds_on_site: secondsOnSite,
        });
      } else {
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

  // Client-only guard: never render on SSR or before delay elapses
  if (!mounted || !isOpen) {
    return null;
  }

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="clarity-popup-heading"
      data-testid="clarity-map-popup"
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={`fixed z-[55] bottom-3 left-3 right-3 md:right-auto md:bottom-6 md:left-6 md:w-[360px] max-md:max-h-[25vh] bg-[#FBFAF7] border border-[#C5D4C7] rounded-2xl shadow-medium p-3 md:p-5 text-[#202A24] ${
        reducedMotion
          ? 'opacity-100 translate-y-0 transition-none'
          : `transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
              isEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
            }`
      }`}
    >
      <button
        type="button"
        onClick={() => dismissPopup('dismiss')}
        aria-label={POPUP_COPY.closeAriaLabel}
        className="absolute top-1 right-1 md:top-2.5 md:right-2.5 w-11 h-11 inline-flex items-center justify-center rounded-xl text-[#49524C] hover:text-[#202A24] hover:bg-[#EEF4EF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#405A46]"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="pr-10 space-y-0.5 md:space-y-2">
        <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.11em] text-[#405A46] leading-tight">
          {POPUP_COPY.eyebrow}
        </div>
        <h2
          id="clarity-popup-heading"
          className="font-serif text-[15px] md:text-lg font-bold text-[#202A24] leading-tight md:leading-snug"
        >
          {POPUP_COPY.heading}
        </h2>
        <p className="text-[11.5px] md:text-sm text-[#49524C] leading-[1.35] md:leading-relaxed">
          {POPUP_COPY.body}
        </p>
      </div>

      <div className="mt-2 md:mt-4 flex items-center gap-2 md:gap-3">
        <Link
          to={href}
          onClick={() => dismissPopup('click')}
          className="inline-flex items-center justify-center gap-1.5 bg-[#405A46] hover:bg-[#334838] text-white font-semibold text-xs md:text-sm px-4 py-2 rounded-xl shadow-soft transition-colors min-h-[44px] flex-1 md:flex-initial"
        >
          <span>{POPUP_COPY.primaryCta}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </Link>

        <button
          type="button"
          onClick={() => dismissPopup('dismiss')}
          className="inline-flex items-center justify-center text-xs md:text-sm font-medium text-[#49524C] hover:text-[#202A24] px-3 py-2 rounded-xl transition-colors min-h-[44px]"
        >
          {POPUP_COPY.secondaryCta}
        </button>
      </div>

      <p className="mt-1 md:mt-2.5 text-[10.5px] md:text-[11px] text-[#49524C] leading-tight">
        {POPUP_COPY.finePrint}
      </p>
    </aside>
  );
};

export default ClarityMapPopup;
