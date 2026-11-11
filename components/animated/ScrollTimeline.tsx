import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion';

export interface TimelineItem {
  phase: string;
  desc: string;
}

interface ScrollTimelineProps {
  items: TimelineItem[];
  className?: string;
}

interface TimelineRowProps {
  item: TimelineItem;
  index: number;
  total: number;
  reducedMotion: boolean;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ item, index, reducedMotion }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rowRef, { once: true, margin: "-12% 0px -12% 0px" });

  return (
    <div ref={rowRef} className="relative pl-8 sm:pl-10">
      {/* Milestone Node */}
      <motion.div
        className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border bg-sage-surface flex items-center justify-center transition-colors duration-300 z-10"
        initial={false}
        animate={
          reducedMotion || isInView
            ? {
                borderColor: '#55745C',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 0 3px rgba(85, 116, 92, 0.18)',
                scale: 1,
              }
            : {
                borderColor: '#DCE6DD',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 0 0px rgba(85, 116, 92, 0)',
                scale: 0.9,
              }
        }
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          initial={false}
          animate={
            reducedMotion || isInView
              ? { backgroundColor: '#55745C', scale: 1 }
              : { backgroundColor: '#A4B3A8', scale: 0.8 }
          }
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Content Reveal: subtle fade-in + 12px upward slide */}
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={reducedMotion || isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{
          duration: 0.5,
          delay: reducedMotion ? 0 : 0.08,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <h3 className="font-heading text-lg font-semibold text-sage-text mb-2">
          {item.phase}
        </h3>
        <p className="font-body text-sm sm:text-base text-sage-muted leading-relaxed">
          {item.desc}
        </p>
      </motion.div>
    </div>
  );
};

export const ScrollTimeline: React.FC<ScrollTimelineProps> = ({ items, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const reducedMotion = Boolean(prefersReduced);

  // Scroll scrubbed progress line directly bound to scroll progress through the section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 80%', 'end 60%'],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div ref={containerRef} className={`relative ml-4 md:ml-6 space-y-12 ${className}`}>
      {/* 1. Muted Background Rail */}
      <div
        className="absolute left-[-1px] top-2 bottom-3 w-[2px] bg-sage-border rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Scroll-Scrubbed Active Accent Line Layered Over Rail */}
      <motion.div
        className="absolute left-[-1px] top-2 w-[2px] bg-sage-primary rounded-full origin-top pointer-events-none"
        style={{ height: reducedMotion ? '100%' : lineHeight }}
        aria-hidden="true"
      />

      {/* 3. Items */}
      {items.map((step, idx) => (
        <TimelineRow
          key={idx}
          item={step}
          index={idx}
          total={items.length}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
};

export default ScrollTimeline;
