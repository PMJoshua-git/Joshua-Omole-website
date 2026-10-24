import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface ScrollProgressBarProps {
  className?: string;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({ className = '' }) => {
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const currentScroll = window.scrollY;
        const currentProgress = Math.min(Math.max(currentScroll / scrollHeight, 0), 1);
        setProgress(currentProgress);
      } else {
        setProgress(0);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    // Calculate immediately on mount or route change
    updateScrollProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollProgress, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, [location.pathname]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] h-[2.5px] pointer-events-none bg-transparent ${className}`}
      role="progressbar"
      aria-label="Page reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-sage-primary origin-left will-change-transform shadow-[0_0_6px_rgba(45,90,67,0.35)] transition-transform duration-75 ease-out"
        style={{
          transform: `scaleX(${progress})`,
          opacity: progress > 0.005 ? 1 : 0,
          transitionProperty: 'transform, opacity',
          transitionDuration: '75ms, 150ms',
        }}
      />
    </div>
  );
};

export default ScrollProgressBar;
