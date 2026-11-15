import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import type { ClarityMapResult } from '../../features/clarity-map/types/clarityMap';
import {
  requestFullReport,
  trackClarityMapEvent,
} from '../../features/clarity-map/services/clarityMapApi';

interface EmailCaptureModalProps {
  isOpen: boolean;
  mode: 'gate' | 'later';
  analysis: ClarityMapResult;
  initialFirstName?: string | null;
  initialEmail?: string | null;
  onContinueToVisual: () => void;
  onCloseLater: () => void;
  onReportSentSuccess: (opts: {
    firstName: string;
    email: string;
  }) => void;
}

const PDF_BULLETS = [
  'Both maps, plus the automated version',
  'Your top 3 bottlenecks',
  'Quick wins you can do this week',
  'Automation opportunities, ranked',
  'A 4-week implementation order',
  'Your Operational Readiness score by BRIDGE lens',
];

function isValidEmail(val: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  mode,
  analysis,
  initialFirstName,
  initialEmail,
  onContinueToVisual,
  onCloseLater,
  onReportSentSuccess,
}) => {
  const [firstName, setFirstName] = useState(initialFirstName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialFirstName) setFirstName(initialFirstName);
      if (initialEmail) setEmail(initialEmail);
    }
  }, [isOpen, initialFirstName, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFirst) {
      setError(
        mode === 'gate'
          ? 'Please enter your first name to receive the report, or click "Proceed to workflow alone".'
          : 'Please enter your first name.'
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(
        mode === 'gate'
          ? 'Please enter a valid email address to receive the report, or click "Proceed to workflow alone".'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsSending(true);
    setError(null);
    trackClarityMapEvent('report_requested', {
      process_code: analysis.meta.process_code,
      mode,
    });

    try {
      const response = await requestFullReport({
        firstName: cleanFirst,
        email: cleanEmail,
        analysis,
      });

      trackClarityMapEvent('report_sent', {
        process_code: analysis.meta.process_code,
        loops_synced: response.loopsSynced,
      });

      setSentEmail(cleanEmail);
      onReportSentSuccess({
        firstName: cleanFirst,
        email: cleanEmail,
      });
    } catch (err: any) {
      trackClarityMapEvent('report_failed', {
        process_code: analysis.meta.process_code,
      });
      setError(
        err?.message ||
          "We couldn't send your full PDF report right now. Your workflow visual is still available."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2620]/85 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clarity-map-report-title"
    >
      <div className="relative w-full max-w-md bg-white border border-sage-border rounded-2xl shadow-medium p-7 sm:p-8 space-y-5">
        {mode === 'later' && (
          <button
            type="button"
            onClick={onCloseLater}
            aria-label="Close modal"
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-sage-muted hover:text-sage-text hover:bg-sage-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {sentEmail ? (
          <div className="space-y-5">
            <div className="w-11 h-11 rounded-xl bg-sage-soft text-[#405A46] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 id="clarity-map-report-title" className="font-serif text-2xl font-bold text-sage-text">
                Your report is on its way.
              </h2>
              <p className="text-sm text-sage-sec leading-relaxed">
                We’ve sent the full PDF report for{' '}
                <strong className="text-sage-text">{analysis.meta.process_name}</strong> to{' '}
                <strong className="text-sage-text">{sentEmail}</strong>. Please check your inbox—and check spam or promotions if it doesn’t appear within two minutes.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={mode === 'gate' ? onContinueToVisual : onCloseLater}
                className="w-full bg-[#405A46] hover:bg-[#334838] text-white font-semibold px-5 py-3.5 rounded-xl transition-colors text-sm"
              >
                {mode === 'gate' ? 'Open workflow map' : 'Back to workflow map'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h2 id="clarity-map-report-title" className="font-serif text-2xl sm:text-[26px] font-bold text-sage-text">
                Your map is ready.
              </h2>
              <p className="text-sm text-sage-sec leading-relaxed">
                Want the full PDF report sent straight to your inbox? Drop your details below, or view the visual map without entering an email.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-sage-text">What’s in the PDF</div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-sage-sec">
                {PDF_BULLETS.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-sage-text font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div>
                <label htmlFor="cm-first-name" className="block text-xs font-semibold text-sage-text mb-1.5">
                  First name <span className="text-sage-muted font-normal">(required for full report)</span>
                </label>
                <input
                  id="cm-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Your first name"
                  className="w-full px-4 py-3 rounded-xl border border-sage-border bg-white text-sage-text text-sm input-interaction"
                />
              </div>

              <div>
                <label htmlFor="cm-email" className="block text-xs font-semibold text-sage-text mb-1.5">
                  Email <span className="text-sage-muted font-normal">(required for full report)</span>
                </label>
                <input
                  id="cm-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-sage-border bg-white text-sage-text text-sm input-interaction"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-3.5 py-2.5 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#405A46] hover:bg-[#334838] text-white font-semibold text-sm transition-colors disabled:opacity-60"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending report to inbox...</span>
                    </>
                  ) : (
                    <span>Get the full report</span>
                  )}
                </button>

                {mode === 'gate' && (
                  <button
                    type="button"
                    onClick={onContinueToVisual}
                    className="w-full px-5 py-3.5 rounded-xl border border-sage-border bg-white hover:bg-sage-surface-2 text-sage-text font-medium text-sm transition-colors"
                  >
                    Proceed to workflow alone
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailCaptureModal;
