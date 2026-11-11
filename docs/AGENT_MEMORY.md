# QUIZZER2 - AGENT MEMORY & ARCHITECTURE RULES

## 1. Core Operating Rules for AI Agent
- **NEVER** scan the entire codebase. Read `docs/AGENT_MEMORY.md` and `docs/CHANGELOG.md` first.
- **ALWAYS** log every file created or modified at the top of `docs/CHANGELOG.md` with the date and a 1-line summary.
- **Zero-Cost Scaling Rule (Vercel + Convex Free Tier)**:
  - Minimize Convex bandwidth & function calls. Heavy question bodies remain local-first in `data/questions/rajasthan-gk/topic_XX.json`.
  - Cache static question pools/metadata in client memory / API routes.
  - Batch user mutations (save test progress on submit/exit rather than per-option click).
  - Never expose unattempted `correctAnswer` in public bulk queries where scraping is possible; enforce `select-none` on question text.

## 2. Design System & "चौकोर" Geometric Rules
- **Crisp Rectangular Geometry ("चौकोर" - 2px to 4px Max)**:
  - `--radius: 0.25rem;` (4px). Base card radius is strictly `rounded-md` (4px).
  - Internal badges, icons, and small pills are `rounded-sm` (3px) or `rounded-xs` (2px).
  - **NEVER** use `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or `rounded-full` on cards, tabs, or containers.
  - Every card and interactive element has a defined 1px border: `border border-border` (`rgba(255, 255, 255, 0.08)` in dark mode).
- **Typography**:
  - English numerals, UI labels, navigation: **Inter** (`font-sans`).
  - Devanagari questions, options, and explanations: **Noto Sans Devanagari** (`@import` via Google Fonts for cross-platform zero-error rendering).
  - Subpixel antialiasing enforced: `-webkit-font-smoothing: antialiased`.
- **Language Rule**:
  - 100% of UI labels, buttons, navigation, and analytics MUST be in **English**.
  - Hindi is strictly reserved ONLY for Rajasthan GK question/option content, explanations, and Subject/Topic names.
- **Controlled 5-Color Theme (Shadcn UI / Obsidian Zinc Minimal)**:
  - Strictly use semantic tokens: `background`/`card`, `foreground`/`muted-foreground`, `primary`, `success` (emerald), `warning` (amber), `destructive` (rose).
- **Navigation (Desktop & Mobile)**:
  - Strictly maximum **5 items** for students: `Home`, `Tests`, `Saved`, `Analytics`, `Profile`.
  - Admin access is protected via keyboard shortcut `Ctrl + Shift + A` and long-press / double-tap on Profile avatar.

## 3. Public Interactive Testing Lab (`/design-preview`)
- Accessible without login at `http://localhost:3000/design-preview`.
- Supports live viewports: **Desktop (Full)**, **Tablet (768px)**, and **Mobile (390px)**.
- Fully interactive with mock data across all 9 pages:
  - `dashboard` (Stats strip, continue practice, 4 canonical subjects grid, English & India GK grids)
  - `practice-sets` (Topic 3: Rajasthan Climate - 12 verified sets)
  - `quiz` (Active 20-question test runner with live timer, practice/exam mode, question palette)
  - `quiz-results` (Detailed score, accuracy %, correct/incorrect breakdown, authentic explanations)
  - `saved` (Segmented tabs: Wrong Questions vs Bookmarks, subject/topic filter, flag, unbookmark)
  - `syllabus` (Interactive 55 master topics checklist with real-time percentage calculator)
  - `history` (Test history chronological attempts)
  - `analytics` (Subject mastery bars, readiness status)
  - `profile` (Candidate preferences, theme switcher, admin access)
