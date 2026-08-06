---
name: Proctor Precision
colors:
  surface: '#f8f9fd'
  surface-dim: '#d9dade'
  surface-bright: '#f8f9fd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3f7'
  surface-container: '#edeef2'
  surface-container-high: '#e7e8ec'
  surface-container-highest: '#e1e2e6'
  on-surface: '#191c1f'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3134'
  inverse-on-surface: '#eff1f5'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#5b5e69'
  on-secondary: '#ffffff'
  secondary-container: '#e0e2ef'
  on-secondary-container: '#61646f'
  tertiary: '#4e5562'
  on-tertiary: '#ffffff'
  tertiary-container: '#666d7b'
  on-tertiary-container: '#eaf0ff'
  error: '#DC2626'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e0e2ef'
  secondary-fixed-dim: '#c4c6d2'
  on-secondary-fixed: '#181b24'
  on-secondary-fixed-variant: '#444651'
  tertiary-fixed: '#dce2f3'
  tertiary-fixed-dim: '#c0c7d6'
  on-tertiary-fixed: '#151c27'
  on-tertiary-fixed-variant: '#404754'
  background: '#f8f9fd'
  on-background: '#191c1f'
  surface-variant: '#e1e2e6'
  success: '#16A34A'
  warning: '#F59E0B'
  border-hairline: '#DCDFE6'
  page-bg: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  header-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  header-xs:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 22px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  meta:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-micro:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
  timer:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1024px
  sidebar-width: 240px
  quiz-sidebar: 260px
  gutter: 16px
  margin-page: 24px
  target-icon: 40px
---

## Brand & Style

The design system is engineered for **Proctor Precision**, an academic-first revision environment that adopts a "Fintech Dashboard" aesthetic. The brand personality is clinical, focused, and professional, prioritizing information density over decorative whitespace. It is designed for students in high-stakes environments who require a tool that feels like a professional workstation rather than a casual learning app.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes a "density-positive" approach where hierarchy is established through precise typography and hairline strokes rather than heavy shadows or vibrant illustrations. The emotional response should be one of calm focus, reliability, and academic rigor.

## Colors

The palette is functional and high-contrast. Color is used sparingly as a tool for status and action rather than decoration.

- **Primary Accent (#2563EB):** Used for interactive elements, focus states, and primary call-to-actions.
- **Surface Strategy:** The system uses a pure white (`#FFFFFF`) page background to maintain a "paper-like" academic feel, with `#F1F2F6` reserved for secondary surfaces like sidebar navigation, chips, and inactive stats cards.
- **Semantic Logic:** 
  - **Success (#16A34A):** Indicates correct answers and positive progress.
  - **Error (#DC2626):** Reserved for incorrect answers and critical system alerts.
  - **Warning (#F59E0B):** Specifically utilized for "Bookmarked" or "Review Later" states.
- **Strokes:** All borders use a consistent `#DCDFE6` hairline to define structure without adding visual bulk.

## Typography

This design system utilizes a dual-font strategy:
1. **Inter:** The primary engine for UI components, navigation, and metadata. It provides a clean, neutral, and technical feel.
2. **Noto Sans:** Used for the core content (questions and answers). It is specifically selected for its superior rendering of Devanagari script (Hindi) and English text runs within the same line.

**Scaling & Hierarchy:**
- **High Density:** Body text uses `semibold` (600) weights to ensure high legibility against white backgrounds at smaller scales.
- **Hindi Text:** When rendering Devanagari content, ensure line-height is increased by 10% to prevent clipping of vowel marks.
- **Micro-labels:** Used for badges and status tags, always rendered in uppercase with slight tracking for a technical aesthetic.

## Layout & Spacing

The system follows a **Fixed Grid** philosophy optimized for desktop environments (≥1024px).

- **Centered Composition:** Content is primarily contained within a 1024px max-width container, centered on the screen to reduce eye strain during long study sessions.
- **Layout Models:**
  - **Dashboard:** A 4-column fluid grid for high-level statistics.
  - **Question View:** A two-column split. The main content area is fluid, while the "Question Palette" or "Timer" sidebar is fixed at 260px.
- **Density:** Spacing is tight (16px gutters) to allow as much information as possible to be visible above the fold. 
- **Sticky Elements:** The top navigation bar is sticky with a 1px bottom hairline, ensuring global actions are always accessible.

## Elevation & Depth

This design system rejects traditional shadows in favor of **Tonal Layers** and **Bold Borders**. 

- **Structural Separation:** Depth is created by contrasting `#FFFFFF` (primary surface) against `#F1F2F6` (secondary surface). Hairline borders (`1px #DCDFE6`) act as the primary containment method.
- **Hover States:** Interaction is signaled by subtle background shifts (e.g., a light gray overlay on 40px icon targets) rather than elevation lifts.
- **Soft Shadows:** Reserved exclusively for high-impact summary elements like the "Final Score Card" or active "Modals" to provide a clear focal point against the dimmed and blurred background.
- **Glassmorphism:** Applied only to the sticky navbar (`backdrop-filter: blur(8px)`) to provide a sense of place while scrolling.

## Shapes

The shape language balances the clinical nature of the UI with modern approachability.

- **Standard Radius (8-10px):** Applied to most functional elements including buttons, input fields, and individual option rows.
- **Card Radius (12px):** Used for large content containers, modals, and main layout sections to clearly define grouped information.
- **Pill (Full):** Used exclusively for status badges (e.g., "In Progress"), chips, and question number indicators to differentiate them from interactive button-like elements.

## Components

### Option Rows
The core atomic unit of the revision platform.
- **Height:** Fixed height (approx 56px) for consistency.
- **States:** 
  - *Default:* White fill, hairline border.
  - *Active:* Light blue tint surface, 1px blue border.
  - *Correct/Incorrect:* Full semantic tint (light green/red) with corresponding 1px border and a trailing icon (check/cross).

### Question Palette
A grid of 32x32px rounded-md squares.
- **Visual Logic:** Numbers are centered. Use `#16A34A` (Success) background for answered questions and a primary blue ring for the current active question.

### Buttons
- **Primary:** Solid `#2563EB` with white text. No shadow.
- **Secondary:** White background with `#DCDFE6` hairline border and `#181B24` text.
- **Tertiary:** Ghost style; text only, showing a light gray background on hover.

### Input Fields
Inputs must include a leading icon and a 1px border. On focus, the border transitions to Primary Blue with a subtle 2px outer glow (ring).

### Subject Cards
Contain a 16px bottom-aligned chevron icon that shifts 4px to the right on hover, providing a subtle affordance of "drill-down" navigation.