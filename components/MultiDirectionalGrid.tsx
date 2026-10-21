import React, { useEffect, useRef, useState } from 'react';

interface MultiDirectionalGridProps {
  children: React.ReactNode[];
  className?: string;
  gridClassName?: string;
}

export const MultiDirectionalGrid: React.FC<MultiDirectionalGridProps> = ({
  children,
  className = '',
  gridClassName = 'grid grid-cols-1 lg:grid-cols-3 gap-8 items-start',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsInView(true);
      return;
    }

    const currentEl = containerRef.current;
    if (!currentEl) return;

    // 10% threshold as per specification
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          } else {
            // Re-trigger animation every time section leaves/enters viewport
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -5% 0px',
      }
    );

    observer.observe(currentEl);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Positions: 0 -> Left, 1 -> Center, 2 -> Right (cycles if > 3)
  const getDirectionClass = (index: number) => {
    const pos = index % 3;
    if (pos === 0) return 'assemble-card-left';
    if (pos === 1) return 'assemble-card-center';
    return 'assemble-card-right';
  };

  const getStyleForIndex = (index: number): React.CSSProperties => {
    if (prefersReducedMotion) {
      return { opacity: 1, transform: 'none' };
    }

    const pos = index % 3;
    const delays = ['0.1s', '0.2s', '0.3s'];
    const initialTransforms = [
      'translateX(-40px)',
      'translateY(40px)',
      'translateX(40px)',
    ];

    return {
      opacity: isInView ? 1 : 0,
      transform: isInView ? 'translate(0, 0)' : initialTransforms[pos],
      transitionProperty: 'transform, opacity',
      transitionDuration: '0.8s',
      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1), ease',
      transitionDelay: delays[pos],
      willChange: isInView ? 'auto' : 'transform, opacity',
    };
  };

  return (
    <div
      ref={containerRef}
      className={`multi-directional-assembly ${isInView ? 'in-view' : ''} ${className}`}
    >
      <div className={gridClassName}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className={`assemble-card ${getDirectionClass(index)} h-full`}
            style={getStyleForIndex(index)}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiDirectionalGrid;
