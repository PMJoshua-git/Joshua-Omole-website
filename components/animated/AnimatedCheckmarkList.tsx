import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export interface AnimatedCheckmarkListProps {
  items: (string | React.ReactNode)[];
  className?: string;
  itemClassName?: string;
  variant?: 'circle-badge' | 'circle-icon';
  iconColor?: string;
  textClassName?: string;
}

export const AnimatedCheckmarkList: React.FC<AnimatedCheckmarkListProps> = ({
  items,
  className = 'space-y-4',
  itemClassName = 'flex items-start',
  variant = 'circle-icon',
  iconColor = '#55745C',
  textClassName = 'text-sage-muted font-medium',
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
            {variant === 'circle-badge' ? (
              /* Style A: Soft Circular Pill Badge with Draw-in Check */
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 mr-3"
                style={{ backgroundColor: `${iconColor}18`, color: iconColor }}
              >
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    initial={reducedMotion ? false : { pathLength: 0 }}
                    animate={
                      reducedMotion || isInView ? { pathLength: 1 } : { pathLength: 0 }
                    }
                    transition={{
                      duration: 0.38,
                      delay: staggerDelay + 0.12,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </svg>
              </span>
            ) : (
              /* Style B: CheckCircle2 Outline with Draw-in Checkmark */
              <span className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 inline-flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={iconColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {/* Outer circle perimeter */}
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="10"
                    initial={reducedMotion ? false : { pathLength: 0, opacity: 0.4 }}
                    animate={
                      reducedMotion || isInView
                        ? { pathLength: 1, opacity: 1 }
                        : { pathLength: 0, opacity: 0.4 }
                    }
                    transition={{
                      duration: 0.45,
                      delay: staggerDelay,
                      ease: 'easeOut',
                    }}
                  />
                  {/* Inner checkmark path drawing */}
                  <motion.path
                    d="m9 12 2 2 4-4"
                    initial={reducedMotion ? false : { pathLength: 0 }}
                    animate={
                      reducedMotion || isInView ? { pathLength: 1 } : { pathLength: 0 }
                    }
                    transition={{
                      duration: 0.35,
                      delay: staggerDelay + 0.15,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </svg>
              </span>
            )}

            <div className={textClassName}>
              {item}
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
};

export default AnimatedCheckmarkList;
