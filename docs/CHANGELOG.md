# QUIZZER2 - PROJECT CHANGELOG

## [2026-11-11 - Part 6] - Deep Workspace Cleanup & Performance Optimization
- **`src/app/design-preview/`**: Completely removed the mock lab route and `page.tsx` (105 KB mock emulator), freeing bundle overhead and cleaning route tree down to strictly 23 production routes.
- **`src/components/shared/PwaInstallPrompt.tsx`**: Cleaned up legacy `/design-preview` route bypass check.
- **Unused Dead Code Removal**:
  - Permanently deleted `src/components/dashboard/StatCard.tsx` (dead duplicate card).
  - Permanently deleted `src/components/admin/DataTable.tsx` (dead admin table).
  - Cleaned empty `src/lib/prompts/` directory.
- **`data/questions/` Quota & Memory Bloat Cleanup (-47.1 MB)**:
  - Deleted redundant duplicate question directories and intermediate scraping files:
    - `data/questions/rajasthan-gk-backup-full/` (23.52 MB duplicate)
    - `data/questions/gemini_batches/` (10.38 MB intermediate batches)
    - `data/questions/extracted_non_mcqs_master.json` (5.17 MB intermediate)
    - `data/questions/extracted_by_topic/` (5.11 MB intermediate extraction)
    - `data/questions/gemini_audited_batches/` (2.42 MB intermediate batches)
    - `data/questions/audit_heal_211_report.json`
- **Root Audit Caches Cleanup (-27.5 MB)**:
  - Deleted all 18 stale `audit_results_t1` through `audit_results_t18` CSV audit directories.
- **`scripts/` Temporary Scratch Files Cleanup**:
  - Cleaned 70+ obsolete scratch test, inspect, check, and heal scripts matching gitignore audit patterns (`scripts/test_*.*`, `scripts/inspect_*.*`, `scripts/check_*.*`, `scripts/heal_*.*`).
- **Turbopack Build Cache Cleanup (-1.9 GB)**:
  - Purged 1.9 GB stale `.next/` build cache.
- **`src/app/layout.tsx`**:
  - Added parallel non-blocking `<link rel="preconnect">` tags for Google Fonts and gstatic in document `<head>` to eliminate font rendering waterfall and eliminate input lag.
- **Production Build & Verification**:
  - Production build passed in 1.8 seconds with code 0 (`next start` ready in 191ms, homepage response in 194ms).

## [2026-11-11 - Part 5]
- **`src/components/dashboard/ContinuePracticeCard.tsx`**:
  - Implemented 2-Column Grid on Mobile (`grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5`).
  - Reduced vertical spacing and padding (`p-2.5 sm:p-3.5`, `my-0.5 min-h-[2rem] sm:min-h-[2.4rem]`, `pt-1.5 mt-0.5`).
  - Unified with Primary Sky-Blue brand theme: `Resume Attempt` uses solid `bg-primary text-white border-primary/40`, and `Start Practice Test` uses neutral `bg-secondary/60 text-foreground border-border/50`.
  - Added responsive button labels (`Resume` / `Start Test` on mobile; `Resume Attempt` / `Start Practice Test` on desktop) preventing text truncation.
- **`src/components/shared/navigation/DesktopNavSection.tsx` & `MobileBottomNavBar.tsx`**:
  - Removed permanent grey borders (`border-0` by default) around all unselected navigation items (`Home`, `Tests`, `Saved`, `Analytics`, `Profile`).
  - Standardized active/selected state across desktop and mobile to 10% primary Sky-Blue tint (`bg-primary/10 text-primary border border-primary/20 font-medium shadow-2xs`).
  - Fixed "Profile" nav item bug: normalized font size and weight to match the other 4 nav items (`font-normal text-muted-foreground` when unselected).
- **`src/app/(student)/saved-questions/page.tsx` & `src/app/design-preview/page.tsx`**:
  - Redesigned `Wrong Questions` vs `Bookmarks` segmented tab switchers with clean semantic tint states (`bg-rose-500/10 text-rose-500 border-rose-500/30` for Wrong Questions; `bg-amber-500/10 text-amber-500 border-amber-500/30` for Bookmarks) eliminating stark white fills.
- **`src/components/analytics/SubjectAccuracyChart.tsx`**:
  - Fixed Light Theme SVG rendering bug where Recharts track rendered as solid black rectangles. Replaced `var(--color-muted)` with `rgba(128, 128, 128, 0.12)`.
  - Moved Hindi subject titles to an aligned YAxis to prevent text overlapping progress bars.
- **`src/app/design-preview/page.tsx`**:
  - Synchronized mock emulator with live app changes, supporting synchronous URL search params reading for immediate headless screenshot capture across device modes (`desktop`, `tablet`, `mobile`) and themes (`light`, `dark`).

## [2026-11-11 - Part 4]
- **`src/app/globals.css`**: Strictly clamped all geometric radii down to 2px–3px max (`--radius: 3px`, `--radius-xs: 2px`, `--radius-sm: 2px`, `--radius-md: 3px`, `--radius-lg: 4px`, `--radius-xl: 4px`, `--radius-2xl: 4px`, `--radius-3xl: 4px`) so no component in the entire project can ever render with bubbly or rounded corners.
- **`src/components/ui/card.tsx`**: Changed base class from `rounded-md` to razor-sharp `rounded-sm` (2px-3px).
- **`src/app/design-preview/page.tsx`**: Upgraded into a 100% exact live app clone matching the user's real application screens pixel-for-pixel:
  - Exact live desktop sidebar (`LEARNING & PRACTICE` + `ADMIN CONSOLE (PROTECTED)` + user profile footer).
  - Exact live Dashboard (4 stat cards, 5 Continue Practice test cards with In Progress / Start buttons, 4 Canonical Subjects grid, English Paper-II grid).
  - Exact Practice Sets page for Topic 3: राजस्थान की जलवायु with 12 sets (Part 1-3 completed with `Retake`, Part 4-12 with `Start`).
  - Exact Saved Questions page matching `media_1794373844309_e7daeaa6.png` (segmented controls, filters, question stem, Option A green highlight with right check, detailed explanation, Admin RG_000535 footer).
  - Exact Syllabus Tracker matching `media_1794373900125_4b953c6e.jpg` (scope pills, section pills, search bar, 55 topics progress banner, topic checklist).
  - Exact Test History matching `media_1794373917779_d96e66aa.png` (filter row, Clean 0-score tests in red, chronological attempts with scores and accuracy percentages).
  - Active interactive quiz runner with instant option feedback, timer, question palette, and results breakdown.

## [2026-11-11 - Part 3]
- **`src/app/globals.css`**: Enforced razor-sharp "चौकोर" geometric radii (`--radius: 0.25rem` / 4px max; `--radius-xs: 2px`, `--radius-sm: 3px`, `--radius-md: 4px`, `--radius-lg: 5px`, `--radius-xl: 6px`). Configured crisp 1px borders (`rgba(255, 255, 255, 0.08)` in dark mode). Integrated Noto Sans Devanagari via Google Fonts `@import` for ultra-smooth Hindi typography.
- **`src/components/ui/card.tsx`**: Replaced hardcoded `rounded-2xl` with razor-sharp `rounded-md` (4px) and subtle 1px border.
- **`src/components/ui/button.tsx`**: Updated `buttonVariants` to `rounded-md` (4px).
- **`src/app/(student)/dashboard/page.tsx`**: Replaced all `rounded-2xl border-0` with razor-sharp `rounded-md border border-border` across stat cards, continue practice cards, 4 canonical subjects grid, and Coming Soon sections.
- **`src/components/shared/navigation/DesktopNavSection.tsx` & `MobileBottomNavBar.tsx`**: Replaced bloated active pills with crisp rectangular active state (`rounded-md`, 4px).
- **`src/components/shared/FilterBar.tsx` & `src/components/syllabus/SyllabusFilterControls.tsx`**: Replaced rounded pill filters with sharp rectangular segmented controls (`rounded-md`, 4px).
- **`src/app/design-preview/page.tsx`**: Upgraded to a complete, 100% unauthenticated live interactive application emulator with mock data across 9 views: Dashboard, Practice Sets (Topic 3: Climate - 12 sets), Active Interactive Quiz Runner with real-time feedback and question palette, Quiz Results with detailed Hindi explanations, Saved & Review Questions, Syllabus Tracker (interactive 55 topics checklist), Test History, Analytics, and Profile. Supports live device frames (Desktop, Tablet 768px, Mobile 390px) and Dark/Light mode.

## [2026-11-11 - Part 3]
- **`src/app/globals.css`**: Enforced razor-sharp "चौकोर" geometric radii (`--radius: 0.25rem` / 4px max; `--radius-xs: 2px`, `--radius-sm: 3px`, `--radius-md: 4px`, `--radius-lg: 5px`, `--radius-xl: 6px`). Configured crisp 1px borders (`rgba(255, 255, 255, 0.08)` in dark mode). Integrated Noto Sans Devanagari via Google Fonts `@import` for ultra-smooth Hindi typography.
- **`src/components/ui/card.tsx`**: Replaced hardcoded `rounded-2xl` with razor-sharp `rounded-md` (4px) and subtle 1px border.
- **`src/components/ui/button.tsx`**: Updated `buttonVariants` to `rounded-md` (4px).
- **`src/app/(student)/dashboard/page.tsx`**: Replaced all `rounded-2xl border-0` with razor-sharp `rounded-md border border-border` across stat cards, continue practice cards, 4 canonical subjects grid, and Coming Soon sections.
- **`src/components/shared/navigation/DesktopNavSection.tsx` & `MobileBottomNavBar.tsx`**: Replaced bloated active pills with crisp rectangular active state (`rounded-md`, 4px).
- **`src/components/shared/FilterBar.tsx` & `src/components/syllabus/SyllabusFilterControls.tsx`**: Replaced rounded pill filters with sharp rectangular segmented controls (`rounded-md`, 4px).
- **`src/app/design-preview/page.tsx`**: Upgraded to a complete, 100% unauthenticated live interactive application emulator with mock data across 9 views: Dashboard, Practice Sets (Topic 3: Climate - 12 sets), Active Interactive Quiz Runner with real-time feedback and question palette, Quiz Results with detailed Hindi explanations, Saved & Review Questions, Syllabus Tracker (interactive 55 topics checklist), Test History, Analytics, and Profile. Supports live device frames (Desktop, Tablet 768px, Mobile 390px) and Dark/Light mode.

## [2026-11-11 - Part 2]
- **`components.json` & `src/app/globals.css`**: Applied user's chosen Shadcn theme preset `b2LWRjVn5G`.
- **`src/app/globals.css`**: Enforced strict `border-0` philosophy (`* { border-color: transparent; }`), surface contrast tokens, and implemented the 8-tier responsive typography system (`.typo-display`, `.typo-h1`, `.typo-h2`, `.typo-h3`, `.typo-question`, `.typo-body`, `.typo-small`, `.typo-caption`).
- **`src/app/layout.tsx`**: Configured global `--font-sans` with `Plus_Jakarta_Sans` & `Noto_Sans_Devanagari` to eliminate Google Sans Turbopack font warnings.
- **`src/components/shared/AppSidebar.tsx`**: Permanently deleted the mobile top navbar so mobile screens start cleanly from the top; added 600ms long-press on Profile to unlock clean `border-0` Admin Dialog (`/admin`, `/admin/questions`, `/admin/pool`, `/admin/import`).
- **`src/components/shared/navigation/`**: Standardized identical 5 navigation items (`Home`, `Tests`, `Saved`, `Analytics`, `Profile`) across desktop sidebar and mobile bottom bar; removed all admin links from desktop sidebar for 100% student parity.
- **Dead Code Cleanup**: Permanently deleted `src/app/(admin)/admin/dedup` and `src/components/admin/dedup/`; cleaned up Dedup links from admin overview.
- **`src/app/(student)/dashboard/page.tsx`**: Redesigned dashboard to `max-w-7xl` with 4-card metric strip, Rajasthan GK section, 3-column General English grid with Coming Soon badges, 4-column India & World GK grid, and Current Affairs card.
- **`src/components/shared/FilterBar.tsx` & `src/app/(student)/saved-questions/page.tsx`**: Unified filter bar and segmented tab switcher into clean `border-0` pill bars (`bg-muted p-1 rounded-xl`) with consistent `h-9` height and `.typo-small` typography.
- **`src/app/(student)/tests/page.tsx` & `src/app/(student)/saved/page.tsx`**: Added clean redirect handlers for `/tests` and `/saved` routes.

## [2026-11-11 - Part 1]
- **`docs/AGENT_MEMORY.md`**: Created agent memory & architecture rules document to avoid broad repo scans.
- **`docs/CHANGELOG.md`**: Initialized changelog to track all created and modified files with dates and summaries.
- **`src/components/ui/brand-logo.tsx`**: Created theme-adaptive SVG Brand Logo component (`BrandLogo`) with precision Q shield and lightning spark icon.
- **`src/components/shared/navigation/navItems.ts`**: Standardized `BOTTOM_NAV_ITEMS` to strictly 5 items.
- **`src/components/shared/navigation/MobileBottomNavBar.tsx`**: Restructured mobile bottom bar to a fixed 5-column grid (`grid-cols-5`).
- **`src/components/shared/navigation/MobileAdminBottomSheet.tsx`**: Upgraded mobile drawer into dual-mode User Profile & Admin sheet.
- **`src/components/shared/navigation/SidebarUserProfile.tsx`**: Added discrete Shield icon shortcut for verified admins.
- **`src/components/shared/AppSidebar.tsx`**: Replaced text brand with `<BrandLogo />`.
