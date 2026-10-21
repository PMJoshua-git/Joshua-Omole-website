# SYSTEM PROMPT / INSTRUCTION FOR AI DEVELOPER AGENT
## PROJECT: Implementation of Minimal, Professional Website Animations

### 1. OBJECTIVE & EXECUTION PHILOSOPHY
You are tasked with implementing a cohesive, site-wide animation system for an existing personal website. The goal is to enhance user experience, establish visual hierarchy, and provide smooth feedback without sacrificing performance or distracting from the content.
* **Minimalism Over Complexity:** Motion must be functional, subtle, and intentional. Avoid over-animating or adding flashy, unnecessary effects.
* **Performance First:** All animations must maintain a 60 FPS target and avoid causing layout shifts (CLS).
* **Respect Existing Stack:** Do not introduce heavy libraries if native solutions work. You must inspect the existing codebase and align with its tech stack (e.g., if Tailwind CSS is used, prefer Tailwind transitions/keyframes; if React/Next.js is used, leverage Framer Motion or clean CSS; for vanilla JS, use standard CSS transitions or lightweight GSAP).

---

### 2. CORE CODE ARCHITECTURE & BEST PRACTICES
Before writing any animation code, you must strictly enforce the following performance and accessibility guidelines:

#### A. Performance Rules (Hardware Acceleration)
* Only animate properties that do not trigger layout reflow or painting.
* **Allowed properties:** `transform` (scale, translate, rotate) and `opacity`.
* **Strictly Forbidden for Transitions:** Do not animate geometry properties like `width`, `height`, `margin`, `padding`, `top`, `left`, or `flex`. Use transforms to simulate these changes if necessary.
* Use `will-change` sparingly and only on elements experiencing complex transitions to prevent memory bloat.

#### B. Accessibility (A11y)
* You must respect users who prefer reduced motion. Wrap all heavy structural transitions in a media query or configuration check:
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0s !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0s !important;
      scroll-behavior: auto !important;
    }
  }
  ```

---

### 3. COMPONENT-SPECIFIC ANIMATION BLUEPRINTS

#### A. Above-the-Fold / Hero Section Reveal
* **Effect:** Staggered entrance.
* **Behavior:** On page load, the main heading, subheading, and primary call-to-action (CTA) should smoothly fade and slide into place.
* **Specs:** `opacity: 0` to `1`, `translateY(15px)` to `0`. Duration: `600ms`. Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-smooth ease-out). Stagger delay: `100ms` per element.

#### B. Global Micro-Interactions (Buttons, Links, Cards)
* **Interactive Elements (CTAs, Navigation Links):**
  * **Effect:** Gentle lift or color shift.
  * **Specs:** `transform: translateY(-2px)` or a subtle scale `scale(1.02)`. Transition duration: `200ms` with `ease-out`. 
* **Form Inputs & Fields:**
  * **Effect:** Border or focus ring expansion using `box-shadow` instead of changing border width.
  * **Specs:** Duration: `150ms` using `ease`.

#### C. Content Reveal on Scroll (Scrollytelling Accents)
* **Effect:** Lazy fade-in as elements enter the viewport.
* **Behavior:** Apply this to portfolio items, text blocks, and project sections. Elements should not fly across the screen; they should materialize exactly where they belong.
* **Implementation:** Use a performant native JavaScript `IntersectionObserver` to trigger class switches rather than continuous `scroll` event listeners.
* **Specs:** `opacity: 0` and `translateY(20px)` to active state. Duration: `500ms`.

#### D. Page Transitions (If Multi-page or Single-Page App Framework)
* **Effect:** Seamless fade/cross-fade.
* **Behavior:** Avoid dramatic slide-outs. A clean opacity fade during route changes keeps the experience premium.
* **Specs:** Fade-out old content (`200ms`), fade-in new content (`250ms`).

---

### 4. DELIVERABLES & STEP-BY-STEP IMPLEMENTATION LOGIC
1. **Tech Stack Assessment:** First, analyze the existing package files, style setups, and framework structures to choose the lightest, most compatible tooling.
2. **Global CSS Setup:** Inject the global accessibility styles (`prefers-reduced-motion`) and core reusable utility classes.
3. **Utility/Wrapper Integration:** If using a framework like React, create an un-opinionated `<RevealOnScroll>` wrapper component. If using vanilla HTML/JS, write a centralized observer script.
4. **Refinement:** Apply micro-interactions to all native interactive tags (`<a>`, `<button>`, `<input>`).
5. **Validation:** Verify performance benchmarks using Chrome DevTools rendering tab to ensure no layout flashes or frame drops occur.