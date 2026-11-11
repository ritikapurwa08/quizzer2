# QUIZZER2 - PROJECT CHANGELOG

## [2026-11-11]
- **`docs/AGENT_MEMORY.md`**: Created agent memory & architecture rules document to avoid broad repo scans.
- **`docs/CHANGELOG.md`**: Initialized changelog to track all created and modified files with dates and summaries.
- **`src/components/ui/brand-logo.tsx`**: Created theme-adaptive SVG Brand Logo component (`BrandLogo`) with precision Q shield and lightning spark icon.
- **`src/components/shared/navigation/navItems.ts`**: Standardized `BOTTOM_NAV_ITEMS` to strictly 5 items (`Home`, `Subjects`, `Tests`, `Analytics`, `Profile`).
- **`src/components/shared/navigation/MobileBottomNavBar.tsx`**: Restructured mobile bottom bar to a fixed 5-column grid (`grid-cols-5`) and removed the 6th Admin button to prevent icon compression.
- **`src/components/shared/navigation/MobileAdminBottomSheet.tsx`**: Upgraded mobile drawer into dual-mode User Profile & Admin sheet with discrete Admin Console access, theme toggling, and quick links.
- **`src/components/shared/navigation/SidebarUserProfile.tsx`**: Added discrete Shield icon shortcut linking directly to `/admin` for verified admins.
- **`src/components/shared/AppSidebar.tsx`**: Replaced text brand with `<BrandLogo />`, added mobile top header bar, `Ctrl + Shift + A` keyboard shortcut, and double-tap/long-press admin triggers.

