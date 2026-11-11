import { Variants, Transition } from 'framer-motion';

/**
 * JoshuaOmole.com — Modern Motion Design Tokens & Variants
 * Editorial, minimal, calm, and purposeful motion system.
 */

// Duration tokens (in seconds for Framer Motion)
export const MOTION_DURATIONS = {
  MICRO: 0.15,      // 120–180ms: hover, active press, small icon nudges
  STANDARD: 0.22,   // 180–280ms: color transitions, active indicators, dropdowns
  LAYOUT: 0.3,      // 250–350ms: accordions, tabs, drawer expansions
  ENTRANCE: 0.5,    // 400–600ms: hero reveals, scroll entries
} as const;

// Easing curves
export const MOTION_EASINGS = {
  // Smooth ease-out for entrance animations (restrained, no bounce)
  easeOut: [0.16, 1, 0.3, 1] as const,
  // Balanced transition for state changes
  easeInOut: [0.25, 1, 0.5, 1] as const,
  // Snappy layout/spring
  gentleSpring: {
    type: 'spring',
    stiffness: 420,
    damping: 32,
    mass: 0.8,
  } as const,
};

// Motion Limits (px and scale)
export const MOTION_LIMITS = {
  hoverLift: -2,       // 2–3px vertical lift
  arrowShift: 4,       // 3–5px arrow translation
  pressScale: 0.98,    // 0.98 tactile press
  entranceDistance: 10,// 6–12px upward slide
  staggerDelay: 0.05,  // 40–70ms stagger
};

// Shared Transitions
export const standardTransition: Transition = {
  duration: MOTION_DURATIONS.STANDARD,
  ease: MOTION_EASINGS.easeOut,
};

export const entranceTransition: Transition = {
  duration: MOTION_DURATIONS.ENTRANCE,
  ease: MOTION_EASINGS.easeOut,
};

// Framer Motion Variants

// 1. Page Transition (Subtle fade + 6px rise, zero layout shift)
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.STANDARD,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.14,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// 2. Staggered Container
export const staggerContainer = (stagger: number = MOTION_LIMITS.staggerDelay, delayChildren: number = 0): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

// 3. Subtle Fade In Up (for hero items & scroll milestones)
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_LIMITS.entranceDistance,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.ENTRANCE,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

// 4. Modal Backdrop and Content
export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: MOTION_DURATIONS.MICRO, ease: MOTION_EASINGS.easeOut }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.12, ease: MOTION_EASINGS.easeOut }
  },
};

export const modalDialogVariants: Variants = {
  initial: { 
    opacity: 0, 
    scale: 0.98,
    y: 8,
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: MOTION_DURATIONS.STANDARD, 
      ease: MOTION_EASINGS.easeOut 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    y: 4,
    transition: { 
      duration: 0.14, 
      ease: MOTION_EASINGS.easeOut 
    }
  },
};

// 5. Drawer / Mobile Menu Variants
export const mobileMenuVariants: Variants = {
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: MOTION_DURATIONS.STANDARD,
      ease: MOTION_EASINGS.easeInOut,
      when: 'afterChildren',
    },
  },
  open: {
    opacity: 1,
    height: 'auto',
    transition: {
      duration: MOTION_DURATIONS.LAYOUT,
      ease: MOTION_EASINGS.easeOut,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const mobileMenuItemVariants: Variants = {
  closed: { opacity: 0, x: -6 },
  open: { 
    opacity: 1, 
    x: 0,
    transition: { duration: MOTION_DURATIONS.STANDARD, ease: MOTION_EASINGS.easeOut }
  },
};
