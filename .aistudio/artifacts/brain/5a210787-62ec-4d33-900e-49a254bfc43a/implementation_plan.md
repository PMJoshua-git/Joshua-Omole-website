# Tactile & Interactive Site-Wide Animation System

Comprehensive integration of high-visibility, hardware-accelerated animations across the personal website based on `ai-agent-animation-prompt__1__aae494ec.md` and user preferences.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and interactive decisions were clarified and confirmed:

- **Confirmed Decision 1 (Text-Reveal Flip Buttons)**: The two-state vertical roll/flip text transition will be applied to the primary hero CTA and the navigation CTA button.
- **Confirmed Decision 2 (Additional Minimal Motion)**: Additional motion will be strictly constrained to tactile UI micro-interactions (press feedback, focus state transitions, subtle card lifts) without extraneous decorative clutter.
- **Performance & Stability Standard**: Animations operate strictly on compositor properties (`transform: translate3d / scale / rotate` and `opacity`) with `prefers-reduced-motion` compliance to preserve 60fps rendering and accessibility.

---

## 1. Overview & Core Concept

- **What It Delivers**: Transforms static and subtle components into tactile, interactive elements with immediate physical feedback, multi-directional card entrances on scroll, and a playful hero morph.
- **Target Audience**: Prospective business clients and founders seeking high-standard, responsive web craft.
- **Key Value**: Delivers tangible motion that makes user actions feel deliberate, fluid, and responsive without incurring CPU layout recalculations or layout shifts (CLS = 0).

---

## 2. User Experience & Motion Specifications

### Feature 1: The Icon Shifter
- **Target Elements**: Inline links, action icons, or navigation links containing vector icons/arrows (e.g. `arrow-right`, `external-link`).
- **Behavior**: On parent hover or focus, the vector icon shifts dynamically.
- **Spec**:
  - `transform: translateX(5px)` (or `translate(4px, -4px)` for diagonal accents).
  - Duration: `0.3s`.
  - Easing: `cubic-bezier(0.25, 1, 0.5, 1)` (Quart Out).

### Feature 2: The Ambient CTA Glow
- **Target Elements**: Main interactive Call-To-Action buttons (`Button` component and primary hero actions).
- **Behavior**: A soft, breathing ambient expansion shadow on hover that signals priority without shifting layout.
- **Spec**:
  - Base: Inherits primary RGB variant `rgba(32, 42, 36, 0.3)`.
  - Hover Shadow State: `box-shadow: 0 0 20px 6px rgba(32, 42, 36, 0.18)`.
  - Duration: `0.4s ease`.

### Feature 3: The Text-Reveal Flip Button
- **Target Elements**: Primary hero CTA and Navigation CTA button.
- **Behavior**: Dual-layered vertical text mask. On hover, the primary label slides smoothly upward out of frame while a secondary outcome label rolls in from the bottom.
- **Spec**:
  - Outer button enforces `overflow: hidden` and a fixed/stable line-height box.
  - Internal wrapper stacks two children vertically.
  - Wrapper transitions `transform: translateY(-50%)` on hover.
  - Duration: `0.4s`, Easing: `cubic-bezier(0.76, 0, 0.24, 1)`.

### Feature 4: Staggered Multi-Directional Card Assembly
- **Target Elements**: 3-column grid sections (e.g., Testimonials and Service/Resource grids).
- **Behavior**: As the section enters the viewport (re-triggering on scroll as selected in previous preferences):
  - Left card slides in from `translateX(-40px)` with `0.1s` delay.
  - Center card slides in from `translateY(40px)` with `0.2s` delay.
  - Right card slides in from `translateX(40px)` with `0.3s` delay.
  - All cards transition `opacity: 0 -> 1` and `transform -> translate(0, 0)` over `0.8s` with `cubic-bezier(0.16, 1, 0.3, 1)`.

### Feature 5: Hero Avatar Morph & Waving Hand
- **Target Elements**: Primary profile photo in the Hero section.
- **Behavior**:
  - On page load / hover, the portrait cross-fades into an avatar illustration.
  - An inner waving hand layer (`.avatar-hand`) triggers an infinitely looping keyframe animation on hover.
  - Keyframes (`wave-hand`): `0% { transform: rotate(0deg); } 100% { transform: rotate(15deg); }`
  - Parameters: Duration `1.2s`, `timing: ease-in-out`, `iteration: infinite`, `direction: alternate`, `transform-origin: bottom right`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Compositor Layers & GPU Offloading**
  - *Chosen Approach*: Exclusively animate CSS `transform` and `opacity`.
  - *Why*: Prevents browser layout thrashing and ensures 60fps on mobile devices.
- **Decision 2: Tactile Button Roll vs Standard Scale**
  - *Chosen Approach*: Implement an accessible `FlipButton` component with `aria-hidden` on the decorative secondary text roll and explicit accessible name on the button.
  - *Why*: Preserves screen reader usability while providing the requested interactive delight.
- **Decision 3: Reduced Motion Overrides**
  - *Chosen Approach*: Global media query `@media (prefers-reduced-motion: reduce)` resets all transitions and animations to `0s` and removes transforms.
  - *Why*: Strict accessibility compliance without breaking layout.

---

## 4. Technical Architecture & System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                       Global CSS / Tokens                   │
│   - --ease-quart-out: cubic-bezier(0.25, 1, 0.5, 1)        │
│   - --ease-flip: cubic-bezier(0.76, 0, 0.24, 1)             │
│   - @keyframes wave-hand { 0%: rotate(0), 100%: rotate(15) }│
│   - .cta-ambient-glow, .icon-shifter                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Component Micro-Motion    │   │   Viewport Multi-Directional  │
│ - FlipButton (Text-Reveal)    │   │   - MultiDirectionalGrid      │
│ - Button (CTA Ambient Glow)   │   │     * Left Card (X: -40px)    │
│ - HeroAvatarMorph (Wave Hand) │   │     * Center Card (Y: +40px)  │
│ - IconShifter (Arrow trans 5) │   │     * Right Card (X: +40px)   │
└───────────────────────────────┘   └───────────────────────────────┘
```
