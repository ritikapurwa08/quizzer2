# Quizzer Component Registry

This document serves as the authoritative inventory and reference for all components in the Quizzer application. It outlines the purpose, location, consumers, dependencies, reusability status, and modification constraints for each component.

---

## Table of Contents
1. [Core UI Primitives (`components/ui`)](#1-core-ui-primitives)
2. [Shared Application Components (`components/shared`)](#2-shared-application-components)
3. [Quiz Engine Components (`components/quiz`)](#3-quiz-engine-components)
4. [Printable PDF Assessment Components (`components/quiz/pdf`)](#4-printable-pdf-assessment-components)
5. [Analytics & Visualization (`components/analytics`)](#5-analytics--visualization)
6. [Dashboard Widgets (`components/dashboard`)](#6-dashboard-widgets)
7. [Syllabus Components (`components/syllabus`)](#7-syllabus-components)
8. [Admin & Data Pool Components (`components/admin`)](#8-admin--data-pool-components)
9. [Icons (`components/icons`)](#9-icons)

---

## 1. Core UI Primitives (`src/components/ui/`)

These components are built on top of Radix UI / Base UI with Tailwind CSS v4 styling. They are reusable across all pages.

| Component | Path | Responsibility | Reusable? | Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `alert` | `src/components/ui/alert.tsx` | Alert notifications with icon and title | Yes | Quiz results, Admin pages |
| `badge` | `src/components/ui/badge.tsx` | Semantic badge pills (difficulty, status, PYQ) | Yes | QuestionShell, AppSidebar, Admin tables |
| `breadcrumb` | `src/components/ui/breadcrumb.tsx` | Accessible breadcrumb navigation wrapper | Yes | BreadcrumbNav |
| `button` | `src/components/ui/button.tsx` | Primary action button with variant & size scale | Yes | Global (all pages) |
| `card` | `src/components/ui/card.tsx` | Surface card container (Header, Content, Footer) | Yes | Dashboard, Syllabus, QuestionShell |
| `chart` | `src/components/ui/chart.tsx` | Recharts wrapper with unified tooltips & theme tokens | Yes | Analytics components |
| `checkbox` | `src/components/ui/checkbox.tsx` | Accessible checkbox for multi-select | Yes | Dedup page, Admin pool tables |
| `dialog` | `src/components/ui/dialog.tsx` | Accessible modal dialog with overlay & focus trap | Yes | ConfirmDialog, PwaInstallPrompt |
| `dropdown-menu` | `src/components/ui/dropdown-menu.tsx` | Contextual action menus and triggers | Yes | AppSidebar, QuestionPalette |
| `input` | `src/components/ui/input.tsx` | Styled text input with dark mode borders | Yes | FilterBar, Dedup search, Auth |
| `label` | `src/components/ui/label.tsx` | Accessible label for form controls | Yes | Admin forms, Auth form |
| `progress` | `src/components/ui/progress.tsx` | Linear progress bar for quizzes & syllabus | Yes | Quiz header, SyllabusTracker |
| `scroll-area` | `src/components/ui/scroll-area.tsx` | Custom styled thin scrollbars | Yes | Question palette, Dedup sidebar |
| `select` | `src/components/ui/select.tsx` | Native/custom styled select dropdown | Yes | SyllabusSelect, FilterBar |
| `separator` | `src/components/ui/separator.tsx` | Subtle divider rule | Yes | AppSidebar, Question cards |
| `skeleton` | `src/components/ui/skeleton.tsx` | Shimmer pulse placeholder for loading states | Yes | LoadingState, AnalyticsSkeleton |
| `switch` | `src/components/ui/switch.tsx` | Toggle switch for flags and filters | Yes | Dedup page, QuestionReviewFilter |
| `table` | `src/components/ui/table.tsx` | Responsive tabular layout components | Yes | Admin pool, PDF summary tables |
| `tabs` | `src/components/ui/tabs.tsx` | Tab switchers (All / Incorrect / Skipped) | Yes | QuestionReviewFilter, Analytics |
| `textarea` | `src/components/ui/textarea.tsx` | Multiline text input for question text/options | Yes | Admin QuestionImportEditor |
| `Toast` | `src/components/ui/Toast.tsx` | Lightweight toast notification provider and hook | Yes | RootLayout, Quiz bookmark actions |
| `toggle` | `src/components/ui/toggle.tsx` | Pressed/unpressed state toggle button | Yes | QuestionPaletteToggle |
| `tooltip` | `src/components/ui/tooltip.tsx` | Hover hint tooltips | Yes | AppSidebar, StatCard, Question badges |

---

## 2. Shared Application Components (`src/components/shared/`)

Application-wide structural and operational components.

| Component | Path | Responsibility | Reusable? | Consumers | Modification Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AppSidebar` | `src/components/shared/AppSidebar.tsx` | Main navigation sidebar (Desktop & Mobile drawer) | Feature | Root app shell, layouts | Do not remove canonical links (`/dashboard`, `/subjects`, `/syllabus`, `/admin`). |
| `MobileBottomNavBar` | `src/components/shared/navigation/MobileBottomNavBar.tsx` | Fixed 5-tab bottom navigation dock for mobile devices | Feature | `AppSidebar` | Displays Dashboard, Subjects, Analytics, History, Saved + Admin. |
| `MobileAdminBottomSheet` | `src/components/shared/navigation/MobileAdminBottomSheet.tsx` | Slide-up modal drawer for mobile admin management | Feature | `AppSidebar` | Protected by admin role check (`isUserAdmin`). |
| `DesktopNavSection` | `src/components/shared/navigation/DesktopNavSection.tsx` | Sidebar link categories for Student and Admin | Feature | `AppSidebar` | Renders Learning & Practice and Admin Console groups. |
| `SidebarUserProfile` | `src/components/shared/navigation/SidebarUserProfile.tsx` | User avatar, account label, theme switcher & sign out | Feature | `AppSidebar` | Reusable sidebar footer widget. |
| `navItems` | `src/components/shared/navigation/navItems.ts` | Static navigation link configurations | Utility | Navigation components | `STUDENT_NAV_ITEMS`, `ADMIN_NAV_ITEMS`, `BOTTOM_NAV_ITEMS`. |
| `AuthGuard` | `src/components/shared/AuthGuard.tsx` | Enforces authentication and role verification | Feature | Protected app routes | Must preserve public bypass for preview mode. |
| `BreadcrumbNav` | `src/components/shared/BreadcrumbNav.tsx` | Renders dynamic breadcrumb path from URL segments | Yes | Subject, Topic, and Quiz pages | Keep schema-aligned topic names. |
| `ConfirmDialog` | `src/components/shared/ConfirmDialog.tsx` | Destructive action confirmation modal | Yes | Admin, Quiz exit actions | Preserve callback execution. |
| `ConvexClientProvider` | `src/components/shared/ConvexClientProvider.tsx` | Initializes Convex client with auth token support | Core | `src/app/layout.tsx` | **DO NOT MODIFY** without reviewing Convex deployment config. |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | Empty list placeholder with graphic and action button | Yes | Bookmarks, Wrong questions, Dedup | Clean reusable pattern. |
| `FilterBar` | `src/components/shared/FilterBar.tsx` | Search input, filter pills, and sort dropdown bar | Yes | Question list, Dedup, Pool | Reusable. |
| `LoadingState` | `src/components/shared/LoadingState.tsx` | Centered loading spinner with Devanagari message | Yes | Initial page data fetch | Reusable. |
| `NetworkStatusBanner`| `src/components/shared/NetworkStatusBanner.tsx` | Offline / Reconnecting toast banner for PWA | Yes | Quiz session, offline mode | Non-blocking. |
| `Pagination` | `src/components/shared/Pagination.tsx` | Pagination controls (Prev, Next, Page Numbers) | Yes | Admin questions table, pool | Reusable. |
| `PwaInstallPrompt` | `src/components/shared/PwaInstallPrompt.tsx` | Install prompt banner for mobile and desktop PWA | Feature | Student layout | Triggers on `beforeinstallprompt`. |
| `PwaRegistrar` | `src/components/shared/PwaRegistrar.tsx` | Registers `/sw.js` and manages caching lifecycle | Core | `src/app/layout.tsx` | Must preserve service worker scope. |
| `ResultHistoryItem` | `src/components/shared/ResultHistoryItem.tsx` | Quiz attempt summary card in `/history` | Feature | `/history` page | Reusable for history listings. |
| `SyllabusSelect` | `src/components/shared/SyllabusSelect.tsx` | Dropdown selector for Subject and 55 Master Topics | Yes | Admin import, Pool filters | Must preserve 55-topic contract. |

---

## 3. Quiz Engine Components (`src/components/quiz/`)

Components responsible for rendering interactive tests, questions, options, and explanations.

| Component | Path | Responsibility | Reusable? | Consumers | Modification Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `QuestionShell` | `src/components/quiz/QuestionShell.tsx` | Wrapper containing question header, prompt, and options | Core | Quiz page, Results review, Admin preview | Must preserve Utsaah font styling for Hindi questions. |
| `QuestionShellSkeleton` | `src/components/quiz/QuestionShellSkeleton.tsx` | Skeleton loader during question transitions | Yes | Quiz page, Result view | Purely visual. |
| `OptionButton` | `src/components/quiz/OptionButton.tsx` | Option pill button with A/B/C/D key binds & review states | Core | McqRenderer, QuestionShell | High-frequency component; avoid heavy re-renders. |
| `McqRenderer` | `src/components/quiz/McqRenderer.tsx` | Standard 4-option single-choice renderer | Core | Quiz engine, Review cards | Handles option selection and key events. |
| `MatchFollowingRenderer` | `src/components/quiz/MatchFollowingRenderer.tsx` | 2-column tabular/list renderer for matching questions | Core | Quiz engine, Review cards | Handles left/right column matching and code options. |
| `StatementReasonRenderer` | `src/components/quiz/StatementReasonRenderer.tsx` | Multi-statement evaluation question renderer | Core | Quiz engine, Review cards | Parses statements (1, 2, 3...) and codes. |
| `AssertionReasonRenderer` | `src/components/quiz/AssertionReasonRenderer.tsx` | Renders अभिकथन (A) एवं कारण (R) structured blocks | Core | Quiz engine, Review cards | Preserves formatted A & R paragraph blocks. |
| `SequenceRenderer` | `src/components/quiz/SequenceRenderer.tsx` | Renders chronological sequence ordering questions | Core | Quiz engine, Review cards | Handles sequenced options. |
| `TableRenderer` | `src/components/quiz/TableRenderer.tsx` | Renders tabular comparison matrices in questions | Core | Quiz engine, Review cards | Preserves cell grid alignment. |
| `FormattedExplanation` | `src/components/quiz/FormattedExplanation.tsx` | Renders formatted Hindi explanation with concept/key facts | Yes | Review cards, PDF cards | Applies Utsaah font and leading. |
| `QuestionPalette` | `src/components/quiz/QuestionPalette.tsx` | Grid of question numbers with status badges | Core | Quiz page right panel / mobile drawer | Syncs with `useQuizSession` state. |
| `QuestionPaletteToggle` | `src/components/quiz/QuestionPaletteToggle.tsx` | Floating mobile drawer button for QuestionPalette | Core | Quiz mobile view | Mobile only. |
| `QuestionReviewCard` | `src/components/quiz/QuestionReviewCard.tsx` | Post-test detailed review card with explanation | Core | Quiz results page, Bookmarks, Wrong questions | Highly reusable across review screens. |
| `QuestionReviewFilter` | `src/components/quiz/QuestionReviewFilter.tsx` | Tab filter (All, Incorrect, Correct, Skipped, Flagged) | Core | Quiz results page | Syncs with review filter state. |
| `QuestionSourceMeta` | `src/components/quiz/QuestionSourceMeta.tsx` | Displays PYQ exam name, year, and topic badge | Yes | QuestionShell, ReviewCard | Reusable metadata badge. |
| `TestPausedOverlay` | `src/components/quiz/session/TestPausedOverlay.tsx` | Overlay displayed when test session is paused | Feature | Quiz page (`/quiz/[testSetId]`) | Shows saved progress, timer, Resume and Exit actions. |
| `MobileBottomControlDock` | `src/components/quiz/session/MobileBottomControlDock.tsx` | Fixed bottom mobile navigation dock | Feature | Quiz page (`/quiz/[testSetId]`) | Prev, Question Counter capsule, Next/Submit buttons. |
| `MobileQuestionPaletteModal` | `src/components/quiz/session/MobileQuestionPaletteModal.tsx` | Bottom sheet palette modal with quiz header on mobile | Feature | Quiz page (`/quiz/[testSetId]`) | Grid jump buttons, timer capsule, pause/resume, exit. |
| `DesktopQuizSidebar` | `src/components/quiz/session/DesktopQuizSidebar.tsx` | Sticky desktop sidebar for quiz session | Feature | Quiz page (`/quiz/[testSetId]`) | Timer countdown, progress, palette, nav buttons, submit. |
| `quizHelpers` | `src/components/quiz/session/quizHelpers.ts` | Shared quiz formatters and candidate answer resolvers | Utility | Quiz session components | `formatTime`, `getQuestionAnswer`. |
| `ScoreSummaryCard` | `src/components/quiz/results/ScoreSummaryCard.tsx` | Summary score card with 4-button action layout | Feature | Results page (`/quiz/[testSetId]/results`) | Retake, PDF export, Share, and Next Set buttons. |
| `ReviewQuestionList` | `src/components/quiz/results/ReviewQuestionList.tsx` | Filtered list of questions with answers and bookmarks | Feature | Results page (`/quiz/[testSetId]/results`) | Renders `QuestionReviewCard` items and Hindi empty states. |
| `PdfReportErrorBoundary` | `src/components/quiz/results/PdfReportErrorBoundary.tsx` | Error boundary wrapping printable assessment report | Utility | Results page (`/quiz/[testSetId]/results`) | Prevents print layout errors from crashing the UI. |
| `resultPdfUtils` | `src/components/quiz/results/resultPdfUtils.ts` | Generates standardized, clean PDF filename for print | Utility | Results page, print actions | `getSuggestedPdfFileName`. |

---

## 4. Printable PDF Assessment Components (`src/components/quiz/pdf/`)

Components specifically engineered for 2-column A4 print reproduction (matching the authentic Image 2 exam booklet aesthetic).

| Component | Path | Responsibility | Reusable? | Consumers | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PrintableAssessmentReport`| `src/components/quiz/pdf/PrintableAssessmentReport.tsx` | Root printable multi-page A4 document orchestrator | Feature | Results page print action | Exactly 284mm page height constraints. |
| `PdfHeader` | `src/components/quiz/pdf/PdfHeader.tsx` | Formal exam header with date, marks, and student info | Feature | `PrintableAssessmentReport` | Pure light mode reproduction. |
| `PdfDashboard` | `src/components/quiz/pdf/PdfDashboard.tsx` | Performance score card and accuracy breakdown | Feature | `PrintableAssessmentReport` | Matches printed sheet dimensions. |
| `PdfQuestionCard` | `src/components/quiz/pdf/PdfQuestionCard.tsx` | 2-column compact question card with marked answers | Feature | `PrintableAssessmentReport` | Must use Utsaah font for Devanagari text. |
| `PdfEndSummary` | `src/components/quiz/pdf/PdfEndSummary.tsx` | Answer key matrix and syllabus completion summary | Feature | `PrintableAssessmentReport` | Sits on final page. |

---

## 5. Analytics & Visualization (`src/components/analytics/`)

Performance charts and revision metrics for students.

| Component | Path | Responsibility | Reusable? | Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `AnalyticsHeader` | `src/components/analytics/AnalyticsHeader.tsx` | Date range selector and overall accuracy summary | Feature | `/analytics` page |
| `AnalyticsSkeleton` | `src/components/analytics/AnalyticsSkeleton.tsx` | Loading skeleton placeholder for analytics | Feature | `/analytics` page |
| `AnswerAccuracyPieChart` | `src/components/analytics/AnswerAccuracyPieChart.tsx` | Donut chart of Correct / Incorrect / Unattempted | Feature | `/analytics`, Dashboard |
| `CombinedStudyActivityPanel` | `src/components/analytics/CombinedStudyActivityPanel.tsx` | Daily revision heatmap and study session activity | Feature | `/analytics` page |
| `MasteryRadialGaugeChart` | `src/components/analytics/MasteryRadialGaugeChart.tsx` | Radial gauge showing percentage syllabus mastery | Feature | `/analytics`, Dashboard |
| `SubjectAccuracyChart` | `src/components/analytics/SubjectAccuracyChart.tsx` | Bar chart across the 4 canonical subjects | Feature | `/analytics` page |

---

## 6. Dashboard Widgets (`src/components/dashboard/`)

| Component | Path | Responsibility | Reusable? | Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `ContinuePracticeCard` | `src/components/dashboard/ContinuePracticeCard.tsx` | Resumption card for in-progress or recommended test | Feature | Student dashboard (`/dashboard`) |
| `StatCard` | `src/components/dashboard/StatCard.tsx` | Single KPI metric card with icon and trend badge | Yes | Student dashboard |
| `SyllabusOverviewCard` | `src/components/dashboard/SyllabusOverviewCard.tsx` | 4-subject progress overview with percentage bars | Feature | Student dashboard |

---

## 7. Syllabus Components (`src/components/syllabus/`)

| Component | Path | Responsibility | Reusable? | Consumers | Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `SyllabusTracker` | `src/components/syllabus/SyllabusTracker.tsx` | Interactive syllabus matrix with 55 Master Topics | Feature | `/syllabus` page, Subject drilldown | Must strictly adhere to the 55 authoritative RPSC topics contract. |
| `SyllabusProgressBanner` | `src/components/syllabus/SyllabusProgressBanner.tsx` | Summary KPI banner and preparation progress bar | Feature | `SyllabusTracker` | Scope-aware (Rajasthan GK / English / Combined). |
| `SyllabusFilterControls` | `src/components/syllabus/SyllabusFilterControls.tsx` | Scope switcher, section pills, search, status pills | Feature | `SyllabusTracker` | Synchronized with 55 canonical topic categories. |
| `TopicChecklistItem` | `src/components/syllabus/TopicChecklistItem.tsx` | Individual topic item with checkbox, Hindi title, and link | Feature | `SyllabusTracker` | Applies Utsaah font and Devanagari typography. |

---

## 8. Admin & Data Pool Components (`src/components/admin/`)

| Component | Path | Responsibility | Reusable? | Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `ConfirmDialog` | `src/components/admin/ConfirmDialog.tsx` | Admin destructive action confirmation dialog | Yes | `/admin` pages |
| `DataTable` | `src/components/admin/DataTable.tsx` | Generic tabular data view with sort and pagination | Yes | Admin question pool |
| `ImportWizard` | `src/components/admin/ImportWizard.tsx` | Multi-step question import modal | Feature | `/admin/import` |
| `QuestionImportEditor` | `src/components/admin/QuestionImportEditor.tsx` | Interactive validator and editor for parsed questions | Feature | Admin import pipeline |
| `TargetConfigSection` | `src/components/admin/import/TargetConfigSection.tsx` | Target subject, topic, batch size selector & set name | Feature | `QuestionImportEditor` |
| `GeminiPromptSection` | `src/components/admin/import/GeminiPromptSection.tsx` | Candidate count badge, preview toggle & copy button | Feature | `QuestionImportEditor` |
| `QualityGateChecklist` | `src/components/admin/import/QualityGateChecklist.tsx` | 8-point validation checklist for question sets | Feature | `QuestionImportEditor` |
| `ImportErrorAlert` | `src/components/admin/import/ImportErrorAlert.tsx` | Destructive error banner with detailed message list | Feature | `QuestionImportEditor` |
| `DedupStatsCards` | `src/components/admin/dedup/DedupStatsCards.tsx` | 4 KPI metric cards for question pool dedup and review | Feature | `/admin/dedup` |
| `DedupToolbar` | `src/components/admin/dedup/DedupToolbar.tsx` | Mode tabs, filters, search, display style, and page size | Feature | `/admin/dedup` |
| `GroupCard` | `src/components/admin/dedup/GroupCard.tsx` | Canonical question card with duplicate variants inspection | Feature | `/admin/dedup` |
| `PairReviewCard` | `src/components/admin/dedup/PairReviewCard.tsx` | Question A vs B side-by-side comparison with decision buttons | Feature | `/admin/dedup` |
| `ImportAiReviewDialog` | `src/components/admin/dedup/ImportAiReviewDialog.tsx` | Dialog for importing external AI review batches JSON | Feature | `/admin/dedup` |

---

## 9. Icons (`src/components/icons/`)

| Component | Path | Responsibility | Reusable? | Consumers |
| :--- | :--- | :--- | :--- | :--- |
| `QuizzerIcons` | `src/components/icons/QuizzerIcons.tsx` | SVG icons for Subjects, Medals, Streaks, Bookmarks | Yes | Global (all pages) |

---

## Summary Metrics
- **Total Components Documented**: 83
- **Core UI Primitives**: 23
- **Shared Components**: 14
- **Quiz Engine Components**: 15
- **PDF Print Engine Components**: 5
- **Analytics & Dashboard Components**: 9
- **Syllabus & Admin Components**: 16
- **Icons**: 1
