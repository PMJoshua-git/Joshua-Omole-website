import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { appendUtmParams } from '../../utils/attribution';
import { trackClarityMapEvent } from '../../features/clarity-map/services/clarityMapApi';

export interface RateLimitCardProps {
  variant: 'rate_limited' | 'high_demand';
  resetAt?: string | null;
}

export function formatUnlockLocalTime(resetAt?: string | null): string | null {
  if (!resetAt) return null;
  const date = new Date(resetAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const RateLimitCard: React.FC<RateLimitCardProps> = ({ variant, resetAt }) => {
  const localTimeText = formatUnlockLocalTime(resetAt);
  const auditHref = appendUtmParams('/audit', {
    utm_source: 'clarity_map',
    utm_medium: 'rate_limit',
    utm_campaign: variant === 'high_demand' ? 'clarity_map_high_demand' : 'clarity_map_limit',
  });

  const isHighDemand = variant === 'high_demand';

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12">
      <div className="bg-sage-surface border border-sage-border rounded-3xl p-8 sm:p-10 shadow-soft space-y-6">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#405A46]">
          <Clock className="w-4 h-4" />
          <span>The Clarity Map</span>
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-sage-text leading-snug">
            {isHighDemand
              ? 'The Clarity Map is very busy right now.'
              : "You've used your 2 free maps for today."}
          </h1>

          <p className="text-base text-sage-sec leading-relaxed">
            {isHighDemand
              ? "Please try again a little later. If it's urgent, book an audit and we'll look at your process together."
              : `To keep this tool free and fast for everyone, each visitor can generate 2 maps per day. Your next one unlocks at ${
                  localTimeText ?? 'later today'
                }.`}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            to={auditHref}
            onClick={() =>
              trackClarityMapEvent('audit_cta_clicked', {
                source: variant,
              })
            }
            className="inline-flex items-center justify-center gap-2 bg-sage-primary hover:bg-sage-primary-hover text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-soft transition-colors min-h-[44px]"
          >
            <span>Book a 30-minute Systems Clarity Audit</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center text-sm font-medium text-sage-sec hover:text-sage-text px-3 py-2.5 transition-colors min-h-[44px]"
          >
            Back to the site
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RateLimitCard;
