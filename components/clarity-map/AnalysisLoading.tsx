import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface AnalysisLoadingProps {
  processName: string;
  industryName: string;
  error: string | null;
  onRetry: () => void;
  onBackToReview: () => void;
}

const PROGRESS_STAGES = [
  {
    title: 'Reading your answers',
    detail: 'Checking tools, roles, handoffs, and any time estimates you shared.',
  },
  {
    title: 'Mapping your current process',
    detail: 'Reconstructing today’s workflow and flagging visibility gaps.',
  },
  {
    title: 'Applying BRIDGE redesign fixes',
    detail: 'Removing duplicate work, assigning ownership, and setting clear rules.',
  },
  {
    title: 'Checking automation suitability',
    detail: 'Keeping judgement human-led while placing safe automation where it helps.',
  },
  {
    title: 'Preparing workflow visuals',
    detail: 'Building your three-stage diagrams, bottlenecks, and 4-week rollout order.',
  },
];

const AnalysisLoading: React.FC<AnalysisLoadingProps> = ({
  processName,
  industryName,
  error,
  onRetry,
  onBackToReview,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (error) return;
    setActiveStep(0);
    const interval = window.setInterval(() => {
      setActiveStep((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev));
    }, 3200);
    return () => window.clearInterval(interval);
  }, [error]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-sage-surface border border-sage-border rounded-2xl p-8 space-y-5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
          Diagnostic Interrupted
        </div>
        <h2 className="font-serif text-2xl font-bold text-sage-text">
          We couldn’t finish mapping this workflow right now
        </h2>
        <p className="text-sm text-sage-sec leading-relaxed">{error}</p>
        <p className="text-xs text-sage-muted">
          Your answers are safely preserved—you will not need to start over.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="bg-sage-primary hover:bg-sage-primary-hover text-white font-semibold px-5 py-3 rounded-xl transition-colors"
          >
            Try analysis again
          </button>
          <button
            type="button"
            onClick={onBackToReview}
            className="bg-sage-bg hover:bg-sage-surface-2 text-sage-text border border-sage-border font-medium px-5 py-3 rounded-xl transition-colors"
          >
            Back to review answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 bg-sage-surface border border-sage-border rounded-2xl p-8 space-y-7">
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-sage-primary">
          Analyzing · {industryName}
        </div>
        <h2 className="font-serif text-2xl font-bold text-sage-text">
          Building your Clarity Map for {processName}
        </h2>
        <p className="text-sm text-sage-sec">
          This takes a few seconds while we evaluate your workflow against the BRIDGE framework.
        </p>
      </div>

      <div className="space-y-4">
        {PROGRESS_STAGES.map((stage, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          return (
            <div
              key={stage.title}
              className={`flex items-start gap-3.5 transition-opacity duration-300 ${
                idx > activeStep ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold border ${
                  isDone
                    ? 'bg-sage-primary border-sage-primary text-white'
                    : isCurrent
                    ? 'bg-sage-soft border-sage-primary text-sage-primary'
                    : 'bg-sage-surface-2 border-sage-border text-sage-muted'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-sage-primary animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <div>
                <div className="text-sm font-semibold text-sage-text">{stage.title}</div>
                <div className="text-xs text-sage-sec mt-0.5">{stage.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisLoading;
