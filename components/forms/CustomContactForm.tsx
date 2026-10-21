import React, { useState, useEffect, useRef } from 'react';
import { getAttributionData } from '../../utils/attribution';
import Cal, { getCalApi } from '@calcom/embed-react';
import { X, CheckCircle2 } from 'lucide-react';

const CustomContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName:       '',
    email:           '',
    company:         '',
    companySize:     '',
    businessGoal:    '',
    newsletterOptIn: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [isCalLoading, setIsCalLoading] = useState(true);
  const [leadId, setLeadId]             = useState<string | null>(null);
  const [isSlotBooked, setIsSlotBooked] = useState(false);
  const [attribution, setAttribution]   = useState<any>(null);
  const calContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const data = getAttributionData();
      setAttribution(data);
    } catch (err) {
      console.error('Failed to get attribution data', err);
    }
  }, []);

  // Listen for Cal.com booking confirmation events
  useEffect(() => {
    let isSubscribed = true;

    // 1. Listen via Cal.com Embed API
    (async function initCalListener() {
      try {
        const cal = await getCalApi({ namespace: "30min" });
        if (cal && isSubscribed) {
          cal("on", {
            action: "bookingSuccessful",
            callback: (e: any) => {
              if (!isSubscribed) return;
              setIsSlotBooked(true);
              const bookingDate = e?.detail?.data?.date || new Date().toISOString();

              fetch('/api/book-consultation/confirm-booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  leadId: leadId || undefined,
                  email: formData.email.trim().toLowerCase(),
                  bookingTime: bookingDate
                })
              }).catch(err => console.error('Error confirming booking via Cal API:', err));
            }
          });
        }
      } catch (err) {
        console.error('Failed to init Cal API listener:', err);
      }
    })();

    // 2. Direct postMessage listener fallback
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        const isBookingEvent =
          data?.type === "cal:bookingSuccessful" ||
          data?.action === "bookingSuccessful" ||
          (typeof data === "string" && data.includes("bookingSuccessful"));

        if (isBookingEvent && isSubscribed) {
          setIsSlotBooked(true);

          fetch('/api/book-consultation/confirm-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              leadId: leadId || undefined,
              email: formData.email.trim().toLowerCase(),
              bookingTime: new Date().toISOString()
            })
          }).catch(err => console.error('Error confirming booking via postMessage:', err));
        }
      } catch (err) {
        console.error('Error processing window message:', err);
      }
    };

    window.addEventListener('message', handleWindowMessage);

    return () => {
      isSubscribed = false;
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [leadId, formData.email]);

  useEffect(() => {
    if (!showCalModal) return;
    setIsCalLoading(true);

    const container = calContainerRef.current;
    if (!container) return;

    const handleIframeLoaded = () => {
      setIsCalLoading(false);
    };

    const existingIframe = container.querySelector('iframe');
    if (existingIframe) {
      existingIframe.addEventListener('load', handleIframeLoaded, { once: true });
    }

    const observer = new MutationObserver(() => {
      const injectedIframe = container.querySelector('iframe');
      if (injectedIframe) {
        injectedIframe.addEventListener('load', handleIframeLoaded, { once: true });
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    // Safety timeout to ensure loader dismisses smoothly
    const timer = setTimeout(() => {
      setIsCalLoading(false);
    }, 4000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [showCalModal]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Please enter your first name';
    }

    if (!formData.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Please enter your company name';
    }

    if (!formData.companySize) {
      newErrors.companySize = 'Please select your team size';
    }

    if (!formData.businessGoal.trim() ||
        formData.businessGoal.trim().length < 10) {
      newErrors.businessGoal =
        'Please describe your challenge (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const payload = {
    // ── The 5 collected fields ──
    firstName:      formData.firstName.trim(),
    email:          formData.email.trim().toLowerCase(),
    company:        formData.company.trim(),
    companySize:    formData.companySize,
    businessGoal:   formData.businessGoal.trim(),

    // ── Auto-set fields (not collected from user) ──
    leadType:       'Service Inquiry',
    serviceType:    'Systems Clarity Audit',

    // ── Empty defaults for Airtable schema compatibility ──
    lastName:       '',
    phone:          '',
    position:       '',
    country:        '',

    // ── Optional consent ──
    newsletterOptIn: formData.newsletterOptIn,

    // ── Attribution (keep existing logic) ──
    leadSource:     attribution?.lead_source     ?? '',
    landingPage:    attribution?.landing_page    ?? '',
    utmParameters:  attribution?.utm_source      ?? '',
  };

  const submitForm = async (body: typeof payload) => {
    const response = await fetch('/api/book-consultation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.message || 'Failed to submit form');
    }
    const data = await response.json().catch(() => ({}));
    return data;
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* ── Success state ── */}
      {isSubmitted ? (
        <div className="bg-sage-surface border border-sage-border rounded-xl p-8 text-center shadow-soft">
          {isSlotBooked ? (
            <>
              <div className="w-14 h-14 bg-sage-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-sage-primary/20">
                <CheckCircle2 className="w-8 h-8 text-sage-primary" />
              </div>
              <span className="text-xs font-bold text-sage-primary uppercase tracking-widest block mb-2 font-mono">
                Session Confirmed
              </span>
              <h3 className="font-heading text-2xl font-semibold text-sage-text mb-2">
                Time Slot Confirmed!
              </h3>
              <p className="font-body text-sm sm:text-base text-sage-text/90 leading-relaxed mb-5 max-w-lg mx-auto">
                Your Systems Clarity Audit for <strong className="text-sage-text">{formData.company}</strong> is locked in.
              </p>
              <div className="bg-sage-surface-2 border border-sage-border rounded-xl p-5 mb-6 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage-primary mt-1.5 shrink-0" />
                  <p className="font-body text-xs sm:text-sm text-sage-muted leading-relaxed">
                    A calendar invitation with Google Meet details has been sent to <strong className="text-sage-text">{formData.email}</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage-primary mt-1.5 shrink-0" />
                  <p className="font-body text-xs sm:text-sm text-sage-muted leading-relaxed">
                    Joshua will review your operational notes before the call so you can dive straight into high-leverage findings.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCalModal(true)}
                className="inline-flex items-center justify-center font-medium px-5 py-2.5 text-xs text-sage-muted hover:text-sage-text hover:bg-sage-surface-2 border border-sage-border rounded-lg transition-all"
              >
                View or Reschedule on Calendar
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-sage-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
                     viewBox="0 0 24 24" fill="none" stroke="#55745C"
                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                     aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              </div>
              <h3 className="font-heading text-xl font-semibold text-sage-text mb-2">
                You're booked in.
              </h3>
              <p className="font-body text-sm text-sage-muted mb-6">
                Details for <strong className="text-sage-text">{formData.company}</strong> have been received. Please select your 30-minute session time on the calendar to finalize.
              </p>
              <button
                type="button"
                onClick={() => setShowCalModal(true)}
                className="inline-flex items-center justify-center font-medium px-6 py-3 text-sm rounded-lg bg-sage-primary text-white hover:bg-sage-primary-hover shadow-sm transition-all"
              >
                Open Booking Calendar &rarr;
              </button>
            </>
          )}
        </div>
      ) : (

        /* ── Form ── */
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validate()) return;
            setIsSubmitting(true);
            try {
              const resData = await submitForm(payload);
              if (resData?.leadId) {
                setLeadId(resData.leadId);
              }
              setIsSubmitted(true);
              setShowCalModal(true);
            } catch (err) {
              console.error('Failed to submit booking:', err);
              setErrors({ submit: 'Something went wrong. Please try again.' });
            } finally {
              setIsSubmitting(false);
            }
          }}
          noValidate
          className="flex flex-col gap-5 bg-sage-surface p-6 md:p-8 rounded-2xl border border-sage-border shadow-soft"
        >

          {/* Field 1: First name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName"
                   className="font-body text-sm font-medium text-sage-text text-left">
              First name <span className="text-sage-primary" aria-hidden="true">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={(e) => {
                setFormData(p => ({ ...p, firstName: e.target.value }));
                if (errors.firstName) setErrors(p => ({ ...p, firstName: '' }));
              }}
              placeholder="e.g. Chidi"
              className={`
                w-full font-body text-sm text-sage-text
                bg-sage-surface border rounded-lg px-4 py-3
                placeholder:text-sage-muted/60
                focus:outline-none focus:ring-2 focus:ring-sage-primary
                focus:border-transparent transition-all duration-150
                ${errors.firstName
                  ? 'border-red-400 bg-red-50 animate-shake'
                  : 'border-sage-border hover:border-sage-primary/40'}
              `}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p id="firstName-error" className="font-body text-xs text-red-600 text-left"
                 role="alert">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Field 2: Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email"
                   className="font-body text-sm font-medium text-sage-text text-left">
              Email address <span className="text-sage-primary" aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => {
                setFormData(p => ({ ...p, email: e.target.value }));
                if (errors.email) setErrors(p => ({ ...p, email: '' }));
              }}
              placeholder="you@yourcompany.com"
              className={`
                w-full font-body text-sm text-sage-text
                bg-sage-surface border rounded-lg px-4 py-3
                placeholder:text-sage-muted/60
                focus:outline-none focus:ring-2 focus:ring-sage-primary
                focus:border-transparent transition-all duration-150
                ${errors.email
                  ? 'border-red-400 bg-red-50 animate-shake'
                  : 'border-sage-border hover:border-sage-primary/40'}
              `}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p id="email-error" className="font-body text-xs text-red-600 text-left"
                 role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Field 3: Company name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company"
                   className="font-body text-sm font-medium text-sage-text text-left">
              Company name <span className="text-sage-primary" aria-hidden="true">*</span>
            </label>
            <input
              id="company"
              type="text"
              autoComplete="organization"
              value={formData.company}
              onChange={(e) => {
                setFormData(p => ({ ...p, company: e.target.value }));
                if (errors.company) setErrors(p => ({ ...p, company: '' }));
              }}
              placeholder="e.g. Acme Studio"
              className={`
                w-full font-body text-sm text-sage-text
                bg-sage-surface border rounded-lg px-4 py-3
                placeholder:text-sage-muted/60
                focus:outline-none focus:ring-2 focus:ring-sage-primary
                focus:border-transparent transition-all duration-150
                ${errors.company
                  ? 'border-red-400 bg-red-50 animate-shake'
                  : 'border-sage-border hover:border-sage-primary/40'}
              `}
              aria-describedby={errors.company ? 'company-error' : undefined}
              aria-invalid={!!errors.company}
            />
            {errors.company && (
              <p id="company-error" className="font-body text-xs text-red-600 text-left"
                 role="alert">
                {errors.company}
              </p>
            )}
          </div>

          {/* Field 4: Team size */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="companySize"
                   className="font-body text-sm font-medium text-sage-text text-left">
              Team size <span className="text-sage-primary" aria-hidden="true">*</span>
            </label>
            <select
              id="companySize"
              value={formData.companySize}
              onChange={(e) => {
                setFormData(p => ({ ...p, companySize: e.target.value }));
                if (errors.companySize)
                  setErrors(p => ({ ...p, companySize: '' }));
              }}
              className={`
                w-full font-body text-sm text-sage-text
                bg-sage-surface border rounded-lg px-4 py-3
                focus:outline-none focus:ring-2 focus:ring-sage-primary
                focus:border-transparent transition-colors
                appearance-none cursor-pointer
                ${errors.companySize
                  ? 'border-red-400 bg-red-50'
                  : 'border-sage-border hover:border-sage-primary/40'}
                ${!formData.companySize ? 'text-sage-muted/60' : ''}
              `}
              aria-describedby={errors.companySize ? 'companySize-error' : undefined}
              aria-invalid={!!errors.companySize}
            >
              <option value="" disabled>Select your team size</option>
              <option value="Just me">Just me</option>
              <option value="2-10">2–10 people</option>
              <option value="11-50">11–50 people</option>
              <option value="50+">50+ people</option>
            </select>
            {errors.companySize && (
              <p id="companySize-error" className="font-body text-xs text-red-600 text-left"
                 role="alert">
                {errors.companySize}
              </p>
            )}
          </div>

          {/* Field 5: Biggest challenge */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="businessGoal"
                   className="font-body text-sm font-medium text-sage-text text-left">
              What is your biggest operational challenge right now?
              <span className="text-sage-primary" aria-hidden="true"> *</span>
            </label>
            <textarea
              id="businessGoal"
              rows={4}
              value={formData.businessGoal}
              onChange={(e) => {
                setFormData(p => ({ ...p, businessGoal: e.target.value }));
                if (errors.businessGoal)
                  setErrors(p => ({ ...p, businessGoal: '' }));
              }}
              placeholder="e.g. We spend too much time on manual tasks, our team doesn't follow a clear process, we're growing but struggling to keep up..."
              className={`
                w-full font-body text-sm text-sage-text
                bg-sage-surface border rounded-lg px-4 py-3
                placeholder:text-sage-muted/60
                focus:outline-none focus:ring-2 focus:ring-sage-primary
                focus:border-transparent transition-colors resize-none
                ${errors.businessGoal
                  ? 'border-red-400 bg-red-50'
                  : 'border-sage-border hover:border-sage-primary/40'}
              `}
              aria-describedby={errors.businessGoal ? 'businessGoal-error' : undefined}
              aria-invalid={!!errors.businessGoal}
            />
            {errors.businessGoal && (
              <p id="businessGoal-error" className="font-body text-xs text-red-600 text-left"
                 role="alert">
                {errors.businessGoal}
              </p>
            )}
          </div>

          {/* Optional newsletter opt-in */}
          <label className="flex items-start gap-3 cursor-pointer group text-left">
            <input
              type="checkbox"
              checked={formData.newsletterOptIn}
              onChange={(e) =>
                setFormData(p => ({ ...p, newsletterOptIn: e.target.checked }))
              }
              className="mt-0.5 w-4 h-4 rounded border-sage-border accent-sage-primary flex-shrink-0"
            />
            <span className="font-body text-xs text-sage-muted leading-relaxed">
              Send me occasional insights on operations and business systems. No spam, unsubscribe any time.
            </span>
          </label>

          {errors.submit && (
            <p className="font-body text-xs text-red-600 text-left" role="alert">
              {errors.submit}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sage-primary text-white font-body text-sm font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover hover:-translate-y-[1px] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary focus-visible:ring-offset-2 cursor-pointer shadow-sm hover:shadow"
          >
            {isSubmitting ? 'Booking your session…' : 'Book My Free Audit →'}
          </button>

          {/* Micro-copy */}
          <p className="font-body text-xs text-sage-muted text-center">
            No pitch. No obligation. Just an honest look at your operations.
          </p>

        </form>
      )}

      {/* ── Cal.com Modal Popup Overlay ── */}
      {showCalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cal-modal-title"
        >
          <div className="relative w-full max-w-3xl bg-sage-surface border border-sage-border rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-sage-border bg-sage-surface-2">
              <div>
                <h3 id="cal-modal-title" className="font-heading text-lg font-semibold text-sage-text">
                  Choose Your Audit Date & Time
                </h3>
                <p className="font-body text-xs text-sage-muted">
                  30-minute Systems Clarity Audit with Joshua Omole
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCalModal(false)}
                className="p-2 text-sage-muted hover:text-sage-text rounded-lg hover:bg-sage-surface transition-colors"
                aria-label="Close booking modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div ref={calContainerRef} className="relative w-full h-[600px] overflow-hidden bg-white">
              {/* Branded loading spinner with status text */}
              {isCalLoading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-sage-surface-2 p-6 transition-opacity duration-300">
                  <div className="w-10 h-10 border-4 border-sage-border border-t-sage-primary rounded-full animate-spin mb-4" />
                  <h4 className="font-heading text-base font-semibold text-sage-text text-center">
                    Connecting to calendar…
                  </h4>
                  <p className="font-body text-xs text-sage-muted mt-1 text-center max-w-xs leading-relaxed">
                    Finding available 30-minute time slots with Joshua Omole
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-[11px] text-sage-primary font-mono font-medium">
                    <span className="w-2 h-2 rounded-full bg-sage-primary animate-pulse" />
                    <span>Cal.com live availability</span>
                  </div>
                </div>
              )}

              <Cal
                namespace="30min"
                calLink="joshua-omole-d9c2vi/30min"
                style={{ width: "100%", height: "100%", overflow: "scroll" }}
                config={{
                  layout: "month_view",
                  name: formData.firstName.trim(),
                  email: formData.email
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomContactForm;
