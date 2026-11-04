import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ResourcePublic } from '../../types/resources';
import { getAttributionData } from '../../utils/attribution';

interface GetCopyModalProps {
  resource: ResourcePublic | null;
  onClose: () => void;
}

export const GetCopyModal: React.FC<GetCopyModalProps> = ({ resource, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [errors, setErrors] = useState<{ firstName?: string; email?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Reset form submission state whenever resource changes
  useEffect(() => {
    if (resource) {
      setIsSuccess(false);
      setServerError(null);
      setIsSubmitting(false);
      setErrors({});
      setWebsite('');
    }
  }, [resource?.slug]);

  const handleClose = () => {
    setIsSuccess(false);
    setServerError(null);
    setIsSubmitting(false);
    setErrors({});
    onClose();
  };

  // Capture trigger element on mount to restore focus on close
  useEffect(() => {
    triggerElementRef.current = document.activeElement as HTMLElement;
    return () => {
      triggerElementRef.current?.focus?.();
    };
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!resource) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [resource]);

  // Focus first input on open
  useEffect(() => {
    if (resource && !isSuccess) {
      setTimeout(() => {
        firstNameInputRef.current?.focus();
      }, 50);
    }
  }, [resource?.slug, isSuccess]);

  // Trap focus and handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!resource) return null;

  const validate = () => {
    const newErrors: { firstName?: string; email?: string } = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const attribution = getAttributionData();
      const utmParamsString = [
        attribution.utm_source ? `utm_source=${attribution.utm_source}` : '',
        attribution.utm_medium ? `utm_medium=${attribution.utm_medium}` : '',
        attribution.utm_campaign ? `utm_campaign=${attribution.utm_campaign}` : '',
        attribution.utm_content ? `utm_content=${attribution.utm_content}` : '',
      ].filter(Boolean).join('&');

      const response = await fetch('/api/resource-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: resource.slug,
          firstName: firstName.trim(),
          email: email.trim().toLowerCase(),
          website, // Honeypot
          leadSource: attribution.lead_source || 'Resources page',
          landingPage: attribution.landing_page || window.location.pathname,
          utmParameters: utmParamsString,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "We couldn't send your copy. Please try again in a moment.");
      }

      setSubmittedEmail(email.trim());
      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="get-copy-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-sage-text/40 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog (Bottom sheet on mobile, centered card on sm+) */}
      <div
        ref={modalRef}
        className="relative z-10 w-full sm:max-w-md bg-sage-surface border border-sage-border shadow-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-sage-muted hover:text-sage-text hover:bg-sage-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Success State */
          <div className="py-2 text-left">
            <div className="w-12 h-12 rounded-full bg-sage-primary/10 text-sage-primary flex items-center justify-center mb-5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 id="get-copy-modal-title" className="font-heading text-2xl font-bold text-sage-text mb-3">
              It's on its way.
            </h2>
            <p className="font-body text-sm sm:text-base text-sage-text/80 leading-relaxed mb-6">
              Check your inbox at <strong className="text-sage-text font-semibold">{submittedEmail}</strong>. If you don't see it within a few minutes, look in your spam or promotions folder.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-sage-primary text-white font-body text-sm font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover transition-colors min-h-[44px]"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form State */
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sage-primary mb-2">
              Free {resource.format || 'Resource'}
            </div>
            <h2 id="get-copy-modal-title" className="font-heading text-2xl font-bold text-sage-text mb-2">
              Get your free copy
            </h2>
            <p className="font-body text-sm text-sage-text/75 leading-relaxed mb-6">
              Enter your details and we'll send <span className="text-sage-text font-medium">{resource.title}</span> to your inbox.
            </p>

            {serverError && (
              <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Hidden honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="modal-website">Website</label>
                <input
                  type="text"
                  id="modal-website"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="resource-first-name" className="block text-xs font-medium text-sage-text mb-1.5">
                  First name <span className="text-sage-primary">*</span>
                </label>
                <input
                  ref={firstNameInputRef}
                  id="resource-first-name"
                  type="text"
                  value={firstName}
                  autoComplete="given-name"
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }
                  }}
                  className={`w-full bg-sage-surface-2 border rounded-lg px-4 py-3 text-base text-sage-text placeholder-sage-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-primary ${
                    errors.firstName ? 'border-red-400 bg-red-50/40' : 'border-sage-border focus:border-sage-primary'
                  }`}
                  placeholder="Your first name"
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-600 mt-1 pl-1">{errors.firstName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="resource-email" className="block text-xs font-medium text-sage-text mb-1.5">
                  Email address <span className="text-sage-primary">*</span>
                </label>
                <input
                  id="resource-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`w-full bg-sage-surface-2 border rounded-lg px-4 py-3 text-base text-sage-text placeholder-sage-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-sage-primary ${
                    errors.email ? 'border-red-400 bg-red-50/40' : 'border-sage-border focus:border-sage-primary'
                  }`}
                  placeholder="name@company.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1 pl-1">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sage-primary text-white font-body text-sm font-medium py-3.5 rounded-lg hover:bg-sage-primary-hover active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Send it to me'
                  )}
                </button>
              </div>

              {/* Micro-copy */}
              <p className="text-[11px] sm:text-xs text-sage-muted text-center leading-relaxed pt-1">
                You'll also get occasional insights on operations and business systems from Joshua. Unsubscribe any time.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GetCopyModal;
