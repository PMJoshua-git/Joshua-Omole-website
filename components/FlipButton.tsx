import React from 'react';
import { Link } from 'react-router-dom';

interface FlipButtonProps {
  primaryText: string;
  secondaryText: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  secondaryIcon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'dark';
  size?: 'default' | 'large' | 'small';
  ariaLabel?: string;
}

export const FlipButton: React.FC<FlipButtonProps> = ({
  primaryText,
  secondaryText,
  to,
  onClick,
  className = '',
  icon,
  secondaryIcon,
  variant = 'primary',
  size = 'default',
  ariaLabel,
}) => {
  const sizeClasses = {
    small: 'h-10 px-4 text-xs tracking-wide',
    default: 'h-12 px-6 text-sm font-medium',
    large: 'h-14 px-8 text-base md:text-lg font-medium',
  };

  const variantClasses = {
    primary:
      'bg-sage-primary text-white border-transparent cta-ambient-glow hover:bg-sage-primary-hover',
    secondary:
      'bg-transparent text-sage-primary border border-sage-primary hover:bg-sage-surface-2',
    dark:
      'bg-[#202A24] text-white border-transparent cta-ambient-glow hover:bg-[#161e19]',
  };

  const content = (
    <div className="flip-btn-track flex flex-col items-center justify-center w-full h-[200%] pointer-events-none select-none">
      {/* Primary visible state */}
      <span className="flex items-center justify-center gap-2 h-1/2 w-full px-1">
        <span>{primaryText}</span>
        {icon && <span className="icon-shifter inline-flex items-center">{icon}</span>}
      </span>

      {/* Secondary rolled state */}
      <span
        aria-hidden="true"
        className="flex items-center justify-center gap-2 h-1/2 w-full px-1 text-emerald-200"
      >
        <span>{secondaryText}</span>
        {secondaryIcon ? (
          <span className="icon-shifter inline-flex items-center">{secondaryIcon}</span>
        ) : icon ? (
          <span className="icon-shifter inline-flex items-center">{icon}</span>
        ) : null}
      </span>
    </div>
  );

  const sharedClasses = `
    flip-btn-outer group relative rounded-lg font-body overflow-hidden
    active:scale-[0.98] transition-[box-shadow,transform,background-color] duration-300
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-primary focus-visible:ring-offset-2
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim();

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={sharedClasses}
        aria-label={ariaLabel || primaryText}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClasses}
      aria-label={ariaLabel || primaryText}
    >
      {content}
    </button>
  );
};

export default FlipButton;
