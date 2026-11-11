# QUIZZER2 - PROJECT CHANGELOG

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
