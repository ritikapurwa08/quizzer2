---
name: Quizzer
colors:
  surface: '#faf8ff'
  surface-dim: '#d8d9e6'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#ecedfa'
  surface-container-high: '#e6e7f4'
  surface-container-highest: '#e0e2ef'
  on-surface: '#181b24'
  on-surface-variant: '#434655'
  inverse-surface: '#2d303a'
  inverse-on-surface: '#eff0fd'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#5c5e62'
  on-secondary: '#ffffff'
  secondary-container: '#dedfe3'
  on-secondary-container: '#606366'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e1e2e6'
  secondary-fixed-dim: '#c5c6ca'
  on-secondary-fixed: '#191c1f'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#181b24'
  surface-variant: '#e0e2ef'
  text-muted: '#6B7280'
  border-hairline: '#DCDFE6'
  status-success: '#16A34A'
  status-destructive: '#DC2626'
  status-warning: '#F59E0B'
  white: '#FFFFFF'
typography:
  display-hindi:
    fontFamily: Noto Sans Devanagari
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-hindi:
    fontFamily: Noto Sans Devanagari
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 1rem
  gutter-md: 1rem
  stack-sm: 0.5rem
  stack-md: 0.75rem
  tap-target-min: 44px
  top-bar-height: 56px
---

## Brand & Style

The design system for the product is a high-utility, **Minimalist** framework designed for high-stakes exam revision on mobile devices. It prioritizes speed, clarity, and one-handed operation. The brand personality is "No-Nonsense"—it is clinical, reliable, and invisible, ensuring the user's cognitive load is entirely dedicated to the educational content.

### Visual Principles
- **Content-First Architecture:** Chrome and navigation are minimized to maximize the viewport for questions and explanations.
- **High-Affordance Interactions:** Every interactive element adheres to a strict 44x44px minimum tap target to support "between-class" usage.
- **Zero-Distraction Aesthetic:** No illustrations, marketing copy, or decorative gradients. The system uses a clean white background with a singular blue functional accent.
- **Strict Status Signaling:** Color is used exclusively for functional feedback (Success, Error, Warning) and primary actions.

## Colors

The color palette is restricted to functional roles to ensure clarity in high-pressure testing environments.

- **Primary Blue (#2563EB):** Reserved for primary actions (buttons), active navigation states, and interactive links.
- **Background & Surfaces:** A pure white (`#FFFFFF`) background is used to maintain high contrast. Muted surfaces (`#F1F2F6`) are used for secondary containers or inactive states.
- **Typography:** Primary text uses a deep navy-black (`#181B24`) for maximum legibility, while secondary information is relegated to a neutral gray (`#6B7280`).
- **Semantic Colors:**
    - **Success Green:** Indicates correct answers and completed states.
    - **Destructive Red:** Used for wrong answers and critical actions.
    - **Warning Amber:** Dedicated to bookmarks and cautionary alerts.

## Typography

This design system utilizes a dual-font strategy. A system sans-serif (Inter) is used for all UI chrome, while **Noto Sans Devanagari** is dynamically applied to question content, options, and explanations containing Hindi script.

### Rules
- **Minimums:** Never drop below 11px for labels. Body and question text must maintain a 14–15px range for mobile accessibility.
- **Hierarchy:** Use semibold weights for question text within cards to distinguish it from supplementary context.
- **Hindi Scale:** Hindi script often requires slightly more line-height than English to prevent vowel marks from clipping; maintain a minimum of 1.5x line-height for Hindi blocks.

## Layout & Spacing

The system is optimized for a **Mobile-First Single Column** layout.

### Grid & Margins
- **Safe Zones:** A standard 16px (`1rem`) side margin is applied to all main content cards.
- **Vertical Rhythm:** Elements are stacked with 12px or 16px gaps. 
- **Admin Tab Strip:** On mobile, the admin sidebar converts to a horizontally scrollable pill-shaped tab strip located directly under the header.

### Mobile-Specific Adaptations
- **Sticky Elements:** The top bar (56px) and the bottom quiz action bar are fixed to ensure primary navigation and "Next/Submit" actions are always within thumb-reach.
- **Bottom-Safe Padding:** Ensure extra padding (80px+) at the bottom of scrollable views so content is not obscured by fixed action bars.
- **Data Tables:** Tables within admin or "Match the Following" views must allow horizontal scrolling within their containers rather than shrinking text.

## Elevation & Depth

To maintain the "No-Nonsense" aesthetic, depth is conveyed through **Low-Contrast Outlines** and tonal layering rather than heavy shadows.

- **Borders:** A 1px hairline border (`#DCDFE6`) is the primary method of separating cards, list items, and sections.
- **Shadows:** Minimal, low-opacity ambient shadows (0px 2px 4px rgba(0,0,0,0.05)) are used only on floating elements like the "Questions Palette" bottom sheet.
- **Tonal Layers:** Muted surface fills (`#F1F2F6`) are used to denote secondary areas or "Selected" states in the question UI, creating depth through color rather than elevation.

## Shapes

The shape language differentiates between structural containers and interactive elements.

- **Cards:** Use a **12px** radius to provide a friendly but structured container for questions.
- **Interactive Elements:** Buttons, input fields, and option rows use a tighter **8-10px** radius.
- **Badges & Chips:** Use a **Fully Rounded (Pill)** style for status badges (e.g., "Correct", "Admin") and circular chips for question numbers.

## Components

### Buttons & Inputs
- **Tap Targets:** Minimum 44x44px.
- **Primary Button:** Solid Blue (`#2563EB`) with white text.
- **Secondary/Outline:** 1px hairline border with primary blue text.
- **Inputs:** 44px height, 8-10px radius, leading icons for clarity.

### Option Rows (The Core Component)
- **State Persistence:** Must maintain a fixed height regardless of state (selected, correct, incorrect) to prevent layout shift.
- **Structure:** [Square Badge A/B/C/D] | [Option Text] | [Circular Radio/Icon Indicator].
- **Visual Feedback:** Use background tints and border color changes for Correct (Green) and Incorrect (Red) states.

### Quiz-Specific Components
- **Question Palette:** A bottom sheet drawer containing a grid of numbered squares. It uses a floating action button (FAB) style trigger showing progress (e.g., "5/20").
- **Match the Following:** Must keep List-I and List-II columns side-by-side on mobile. Text size should scale down to 11px if necessary.
- **Review Cards:** Full-width white cards with a thin divider separating the question/answer section from the "Explanation" block.

### Feedback
- **Toast Notifications:** Stack from the bottom, spanning full width minus margins. Use a white card style with a thick colored left accent bar corresponding to the status.