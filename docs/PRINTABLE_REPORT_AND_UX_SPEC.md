# Quizzer Printable Assessment Report & UX Architecture Specification

This authoritative document defines the engineering specification for the printable assessment PDF report (`/src/components/quiz/pdf/*`, `@media print`), the keyboard safety architecture, and the theme/UX standards for **Quizzer** (dedicated to RPSC Senior Teacher 2nd Grade GK).

---

## Part 1: Publication-Grade Printable PDF Report

### 1. Target & Environment
- **Primary Print Target**: Chromium / Chrome / Edge "Save as PDF" engine and physical A4 printers.
- **Paper Size**: A4 (`210mm` width × `297mm` height). Printable page height is constrained to `296mm` to avoid trailing blank page artifacts.
- **Page Margins**: Zero hardware CSS margin (`@page { size: A4 portrait; margin: 0; }`). All margins, headers, and footers are internal components governed by `.pdf-page { padding: 10mm; }`.

### 2. Design Tokens & Color Matrix
Monochrome Zinc design strictly aligned with Next.js/Vercel dark-first system. Status colors (success emerald, destructive rose) are reserved strictly for question correctness.

```css
/* Dark Theme (Default) */
--pdf-bg: #09090b;
--pdf-surface: #111113;
--pdf-surface-2: #18181b;
--pdf-border: #27272a;
--pdf-text: #f4f4f5;
--pdf-muted: #a1a1aa;
--pdf-accent: #ffffff;
--pdf-ok: #34d399;
--pdf-ok-bg: #052e22;
--pdf-ok-border: #064e3b;
--pdf-bad: #fb7185;
--pdf-bad-bg: #3a0f1a;
--pdf-bad-border: #881337;

/* Ink-Saver Light Theme ([data-pdf-theme="light"]) */
--pdf-bg: #ffffff;
--pdf-surface: #ffffff;
--pdf-surface-2: #f8fafc;
--pdf-border: #e2e8f0;
--pdf-text: #09090b;
--pdf-muted: #64748b;
--pdf-accent: #09090b;
--pdf-ok: #059669;
--pdf-ok-bg: #ecfdf5;
--pdf-ok-border: #a7f3d0;
--pdf-bad: #e11d48;
--pdf-bad-bg: #fff1f2;
--pdf-bad-border: #fecdd3;
```

### 3. Dynamic Measurement & Packing Algorithm
Fixed `height: 284mm` and fixed `2x2 grid` have been eliminated in favor of an offscreen measurement engine:

1. **Measurement Sandbox**:
   - An offscreen container rendered at `width: 190mm` (`210mm - 20mm padding`) measures true DOM heights after `document.fonts.ready`.
   - A ruler element establishes the exact pixel height for `296mm`.
   - Headers (`hHeader1`, `hRunningHeader`), footers (`hFooter`), and `PdfEndSummary` (`hSummary`) are measured directly.
   - Each card is measured at half-column width (`calc((190mm - 3.5mm) / 2)`) and full width (`190mm`).

2. **Row Packing Logic**:
   - **Page 1 Available Height**: `pageHeight - 20mm_padding - hHeader1 - hFooter - safetyMargin`.
   - **Pages 2+ Available Height**: `pageHeight - 20mm_padding - hRunningHeader - hFooter - safetyMargin`.
   - **Tall Cards**: If a card's single-column height exceeds 46% of available body height, it is promoted to a full-width row (`isFullWidth = true`).
   - **Card Clamping**: If a card exceeds an entire page, `isCompact` activates (explanation font reduced to 7.5pt) to prevent any hidden overflow.
   - **Standard Pairs**: Sequential questions are paired in rows of 2. Row height = `Math.max(card1, card2)`.
   - **Page Break**: If a row exceeds remaining page height, a new page starts immediately.
   - **End Summary Fit**: On the final page, if `PdfEndSummary` exceeds remaining height, the last row is pushed to a new page so the summary is never split, clipped, or isolated on a blank trailing sheet.

3. **Print Execution Trigger**:
   ```ts
   // In results/page.tsx:
   if (typeof document !== "undefined" && document.fonts) {
     await document.fonts.ready;
   }
   await new Promise<void>((resolve) => {
     requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
   });
   window.print();
   ```

---

## Part 2: Web App Bug Fixes & Architecture (P0 & P1)

### 1. Keyboard Navigation Safety (`/quiz/[testSetId]`)
- **Pause Safety**: Keyboard option selection (1-4, A-D) is strictly disabled while test is paused (`if (isPaused) return;`).
- **Modifier Protection**: Commands with `ctrlKey`, `metaKey`, or `altKey` (e.g. `Ctrl+C`, `Cmd+A`) are ignored so they do not inadvertently select options.
- **Button Focus Conflict**: Pressing `Enter` when a button is focused allows native button click rather than prematurely jumping to the next question.
- **Submission Error Handling**: Catch blocks display an interactive toast warning (`showToast`) and keep the modal open, allowing students to retry without losing their answered state.

### 2. Mobile Quiz Action Bar
- Replaced awkward inline bottom buttons with a fixed bottom bar with `safe-area-inset-bottom`.
- Minimum `40-44px` touch targets for Prev, Answered counter, and Next/Submit.
- Students no longer have to scroll to the bottom of long Devanagari questions to advance.

### 3. Move `ConfirmDialog` to Shared
- Relocated from `src/components/admin/ConfirmDialog.tsx` to `src/components/shared/ConfirmDialog.tsx`.
- Extended with optional `stats` prop showing a transparent breakdown of:
  - Total Questions
  - Answered Questions
  - Unanswered Questions
  - Flagged / Bookmarked Questions

### 4. Error Boundaries & Next.js Fallbacks
- Added `src/app/not-found.tsx`: Styled 404 with navigation back to Dashboard and Subjects.
- Added `src/app/global-error.tsx`: Root-level crash boundary with Next.js reload hook.
- Added `src/app/loading.tsx`: Clean route transition skeletons.
- Added `src/app/(admin)/error.tsx`: Administrative error boundary.

### 5. AppSidebar Enhancements
- Added `/notes` ("Study Notes") and `/search` ("Search Questions") to `STUDENT_NAV_ITEMS`.
- Added global `⌘K` / `Ctrl+K` shortcut listener to jump to question search.
- Standardized subtitle across desktop and mobile to `"RPSC 2nd Grade GK"`.
- Mobile Focus Mode: During active test sessions (`/quiz/[testSetId]`), the redundant topbar is hidden, giving focus to the quiz timer and question interface.

### 6. Canonical Scoring Note Fix
- Corrected display note in Results page from `-0.66` to `-0.67` per canonical RPSC 1/3 negative marking (`DEFAULT_MARKS_PER_QUESTION / 3 = 0.67`).

### 7. OptionButton & QuestionPalette Cleanup
- Eliminated conflicting secondary radio circle on the right side of `OptionButton`. Letter badge serves as the primary visual selection token.
- Added compact status legend to `QuestionPalette` (Current, Answered, Unanswered, Flagged).
- Replaced `window.confirm` in `SyllabusTracker` with `<ConfirmDialog>`.
- Deleted unused dead code (`Navbar.tsx`, `PrintableReportHeader.tsx`, `DailyProgressCard.tsx`, `WeakSubjectsCard.tsx`).

