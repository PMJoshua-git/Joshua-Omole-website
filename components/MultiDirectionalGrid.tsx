import React from 'react';
import { useAssembleCards } from '../hooks/useAssembleCards';

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
  const { containerRef, isInView, prefersReducedMotion } = useAssembleCards({
    threshold: 0.1,
    rootMargin: '0px 0px -5% 0px',
  });

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
