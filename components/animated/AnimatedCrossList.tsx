import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export interface AnimatedCrossListProps {
  items: (string | React.ReactNode)[];
  className?: string;
  itemClassName?: string;
  textClassName?: string;
}

export const AnimatedCrossList: React.FC<AnimatedCrossListProps> = ({
  items,
  className = 'space-y-4',
  itemClassName = 'flex items-start gap-3',
  textClassName = 'font-body text-sm text-sage-sec leading-relaxed',
}) => {
  const containerRef = useRef<HTMLUListElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const prefersReduced = useReducedMotion();
  const reducedMotion = Boolean(prefersReduced);

  return (
    <ul ref={containerRef} className={className}>
      {items.map((item, index) => {
        const staggerDelay = reducedMotion ? 0 : index * 0.09; // ~90ms stagger

        return (
          <motion.li
            key={index}
            className={itemClassName}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={reducedMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{
              duration: 0.45,
              delay: staggerDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Red Circle Badge with Two Sequential Drawing Cross Strokes */}
            <span
              className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
              aria-hidden="true"
            >
              <svg
                className="w-2.5 h-2.5"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Diagonal Stroke 1: Top-Left to Bottom-Right */}
                <motion.path
                  d="M2.5 2.5L9.5 9.5"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  animate={
                    reducedMotion || isInView ? { pathLength: 1 } : { pathLength: 0 }
                  }
                  transition={{
                    duration: 0.24,
                    delay: staggerDelay + 0.1,
                    ease: 'easeOut',
                  }}
                />
                {/* Diagonal Stroke 2: Top-Right to Bottom-Left (Sequenced after Stroke 1) */}
                <motion.path
                  d="M9.5 2.5L2.5 9.5"
                  initial={reducedMotion ? false : { pathLength: 0 }}
                  animate={
                    reducedMotion || isInView ? { pathLength: 1 } : { pathLength: 0 }
                  }
                  transition={{
                    duration: 0.24,
                    delay: staggerDelay + 0.28,
                    ease: 'easeOut',
                  }}
                />
              </svg>
            </span>

            <div className={textClassName}>
              {item}
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
};

export default AnimatedCrossList;
