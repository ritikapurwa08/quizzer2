# QUIZZER2 - AGENT MEMORY & ARCHITECTURE RULES

## 1. Core Operating Rules for AI Agent
- **NEVER** scan the entire codebase. Read `docs/AGENT_MEMORY.md` and `docs/CHANGELOG.md` first.
- **ALWAYS** log every file created or modified at the top of `docs/CHANGELOG.md` with the date and a 1-line summary.
- **Zero-Cost Scaling Rule (Vercel + Convex Free Tier)**:
  - Minimize Convex bandwidth & function calls.
  - Cache static question pools/metadata in `localStorage` / `IndexedDB` or client memory.
  - Batch user mutations (save test progress on submit/exit rather than per-option click).
  - Never expose unattempted `correctAnswer` in public bulk queries where scraping is possible; enforce `select-none` on question text.

## 2. Design System & Typography Rules
- **Font**: Strictly use **Google Sans** (`font-sans`) across the entire UI.
- **Language Rule**: 100% of UI labels, buttons, navigation, and analytics MUST be in **English**. Hindi is strictly reserved ONLY for Hindi-medium Subject names, Topic names (e.g., Rajasthan GK topics), and Question/Option content.
- **Controlled 5-Color Theme (Shadcn UI)**:
  - Never use random hardcoded Tailwind colors (`bg-purple-500`, `text-indigo-400`, etc.).
  - Strictly use semantic tokens: `background`/`card`, `foreground`/`muted-foreground`, `primary`, `success` (emerald), `warning` (amber), `destructive` (rose).
- **Mobile Bottom Navigation**: Strictly maximum **5 items** (`Home`, `Subjects`, `Practice`, `Tests`, `Profile`). Admin links must NEVER be placed in the mobile bottom bar.

