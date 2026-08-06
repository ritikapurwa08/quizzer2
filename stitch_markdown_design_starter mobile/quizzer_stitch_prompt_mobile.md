# Quizzer — Mobile UI generation brief (for Google Stitch)

Same app as the desktop brief — this is the **mobile (≤428px, single-column)** version of every screen. Paste this whole document into Stitch, or generate screen-by-screen using the headings below. Read section 1–2 (identity, tokens) even if you already generated the desktop set — they're identical and must stay identical for the two to look like one product.

---

## 1. Brand and product identity

Quizzer is a no-nonsense exam-revision tool used mostly on a phone, often one-handed, often between classes. Mobile is the primary surface, not an afterthought — screen space for the actual question/content should be maximized, chrome minimized. White background, one blue accent, no illustrations, no marketing copy. Every screen has exactly one job.

## 2. Design tokens (identical to desktop — keep both sets visually consistent)

**Color palette:**
- Background: `#FFFFFF`
- Primary text: `#181B24`
- Accent / primary (buttons, links, active states): `#2563EB`
- Text on accent: `#FFFFFF`
- Muted surface: `#F1F2F6`
- Muted / secondary text: `#6B7280`
- Border: `#DCDFE6`
- Destructive / wrong-answer red: `#DC2626`
- Success / correct-answer green: `#16A34A`
- Warning / bookmark amber: `#F59E0B`

**Typography:** system sans-serif UI font throughout; a second Devanagari-optimized sans font (Noto Sans Devanagari or similar) automatically applies to any question text, option text, or explanation that contains Hindi script — never to English UI chrome. On mobile, keep body/question text at 14–15px (not smaller) and never drop below 11px for any label — legibility matters more than density here.

**Shape:** 12px radius on cards, 8–10px on buttons/inputs/option rows, fully round on pill badges and circular chips. 1px hairline borders as the primary separator, minimal shadow. Every tappable element must be at least 44×44px.

## 3. Global mobile chrome

**Top bar** (sticky, compact, ~56px tall, white with bottom hairline):
- Left: graduation-cap icon + "Quizzer" wordmark (smaller than desktop).
- Right, in a tight row of icon-only 40×40px tap targets: a search icon-button (toggles a search input row open directly below the bar — collapsed by default, not a permanent second row), Dashboard icon, Wrong Questions (clock/history) icon, Bookmarks icon, and — for admins only — a small solid blue "Admin" pill.
- No visible username or logout in the bar itself on small screens; put Logout inside a lightweight overflow/profile affordance if needed, or keep a single small icon-only logout button at the end of the row.
- When the search icon is tapped, a search input with a leading search icon slides open in a thin row directly under the top bar (full width, with a small amount of side padding), pushing content down — collapsed again on outside tap or after a search is submitted.

**Bottom-safe content padding**: quiz-taking and any screen with a fixed bottom action bar needs extra bottom padding so the last content isn't hidden behind the button.

**Admin on mobile**: the desktop's persistent left sidebar becomes a **horizontal scrollable tab strip** just under the admin header ("Overview / Import / Subjects / Topics / Test Sets / Questions" as pill-shaped tabs, active one filled blue) — no off-canvas drawer needed, admin usage is expected to be occasional on mobile.

## 4. Screens

### 4.1 Login / Sign up
Full-width card with side margins (~16px), vertically centered or top-anchored with breathing room above. Centered circular blue-tinted icon badge, bold headline, one line of gray subtext. Below: a full-width two-tab segmented control (Sign In / Sign Up). Form fields stack full width with generous 44px+ height and leading icons. For sign-up, the "Account role" Student/Admin toggle becomes two equal-width stacked-safe buttons in a single row (still side by side, just full width, icon above or beside label). Full-width solid blue submit button pinned at a comfortable thumb-reach position. Error banner spans full card width above the button. Mode-switch line centered below the card.

### 4.2 Student dashboard
Single column throughout. Page header: bold title stacked above a short gray subtitle, with the "View All Subjects" button as a smaller pill below the text (not inline right) or right-aligned on its own row if space allows.

Stat cards: **2-column grid** (not 4) — Tests Attempted / Questions Solved on row one, Accuracy / Bookmarks on row two, each a compact card exactly like desktop but narrower.

Subjects: **single-column stack** of subject cards (full width), same visual content as desktop (pill "Subject N" + chevron top row, bold name, 2-line description, footer icon row) but description can compress to 1 line with a "more" affordance if it would otherwise take excessive vertical space.

Weak Subjects and Daily Progress: **stacked vertically, one per row** (not side-by-side), each full width. Same empty-state treatment as desktop when there's no data.

Recent Test Attempts: full-width card, list rows stack date/subject on one line and the score pill + status dot on the next if needed to avoid crowding — prioritize not truncating the subject name.

### 4.3 Subjects list
Breadcrumb row scrolls horizontally if it overflows. Page title + subtitle stacked. Subject cards: **single column**, full width, same content as desktop version.

### 4.4 Subject detail — topic list
Breadcrumb, title, subtitle stacked. Topic rows: **single column** full-width horizontal cards (numbered badge + name + chevron), same as desktop's topic row but stacked one per line instead of 2 columns.

### 4.5 Topic detail — practice/test sets
Breadcrumb, title, subtitle. Practice-set cards: **single column** full width. Each card keeps the desktop's horizontal internal layout (icon chip + name/meta on the left, "Start" pill on the right) — this row pattern should NOT become a vertically stacked title-then-button layout; keep title and Start button on the same row even at narrow widths, shrinking the meta text if needed.

### 4.6 Quiz-taking screen
**Single column, no sidebar.** Top: a compact status bar (test name + "X of Y answered" on the left, timer pill on the right) — may wrap to two lines on very narrow screens but stays compact (short height).

Directly below: the question card, full width, same internal layout as desktop (numbered chip + type chip + question text, then the type-specific answer UI). This is the dominant element on screen — maximize its visible height by keeping surrounding chrome minimal.

Below the question: a **fixed bottom action bar** (not inline in the scroll flow) spanning the full width, safe-area padded, containing Previous (outline, left) and Next/Submit (solid blue, right) side by side — always reachable by thumb without scrolling.

**Question palette**: since there's no sidebar, this becomes a **bottom sheet** or **expandable drawer** triggered by a small floating "Questions" pill/button (e.g. bottom-right, above the action bar, showing "5/20" as a mini progress indicator) — tapping it slides up a sheet containing the same grid-of-numbered-squares palette as desktop (answered=green tint, current=blue ring, bookmarked=small dot), with a "Submit Test" button at the bottom of the sheet. This keeps the main scroll view uncluttered.

Confirm-submit dialog: same centered modal as desktop but full-width-minus-margins (~92% viewport width), buttons stack full-width if needed (Cancel above Submit, or side by side if they fit).

### 4.7 Quiz results screen
"← Back to Dashboard" link top-left, small. Score summary card: full width, same content as desktop (score + accuracy pill) but the two action buttons ("Practice Wrong Questions" / "Browse Other Subjects") stack full-width one above the other instead of side by side if horizontal space is tight — prefer side-by-side if they fit at ~50% width each with small text.

"Detailed Question Review" header row: title above, count below (or same row if it fits) — then the stacked list of **review cards**, full width, identical internal structure to desktop (this component must look and behave the same on both breakpoints — see section 6). No "You selected / Correct answer" text block.

### 4.8 Wrong Questions / Bookmarks
Title + subtitle stacked, full-width stack of review cards, same empty states as desktop, single column.

### 4.9 Search results
Full-width result rows in a single stacked column per section, section labels above each group. Search itself is reached via the top-bar search toggle described in section 3.

### 4.10 Admin overview
Single-column stack: the one stat card full width, the "Import Questions" banner full width below it, then the 4 management-section link cards **stacked single column** (not a grid) so each is easy to tap.

### 4.11 Admin Subjects / Topics / Test Sets
Page title, then the create-new-item form: input and "Add" button **stack full width** (input on top, button below, or side by side only if there's clearly room — default to stacked for reliability). Any cascading dropdowns (subject/topic selects) stack full width above the form. Data table: allow **horizontal scroll within a bordered container** rather than compressing columns unreadably — keep row height comfortable and the trash-icon action column pinned visible.

### 4.12 Admin Questions
Full-width search input. Data table scrolls horizontally as above, question-text column shows 1–2 lines truncated. Edit dialog: full-width-minus-margins modal, textareas stack full width, Cancel/Save buttons full width stacked or side-by-side if they fit — default to stacked on very narrow screens for reliable tap targets.

### 4.13 Admin Import Wizard
**Step 1**: full-width text/code editor area, tall enough to be usable on mobile (don't cram it), toolbar dropdowns stack above the editor if needed. "Proceed to Preview" button full width at the bottom.

**Step 2**: subject/topic dropdown selects **stack full width, one above the other** (not side by side). Set-name input full width. Negative-marking checkbox row full width. Duplicate-strategy control: the three toggle buttons **stay in one row** but shrink text/padding to fit three-across on a narrow screen (do not stack these three vertically — they're a single mutually-exclusive choice and read best as one row). Stats/count pills wrap to a second line if needed. Question preview cards: full width, the options grid inside each preview card drops from 2 columns to **1 column** on mobile. "Back" and "Confirm & Import" buttons: stack full width, Confirm on top (primary action reachable first) or both visible without scrolling if possible.

**Step 3**: success panel centered, full width. Stat-card row becomes **2×2 grid** instead of 4-across. "Import Another Question Set" button full width.

## 5. Question-type answer UI (identical content to desktop, mobile layout notes only)

1. **MCQ / Table-Based / Statement-Reason / Assertion-Reason**: same vertical option-row stack, full width. Table-Based's data table scrolls horizontally within its own bordered container if it doesn't fit — never shrink text below 11px to force a fit.
2. **True/False**: two large buttons side by side, full width split 50/50 — never stack these vertically, they're a binary choice and should read as one row even on the narrowest supported width (~360px).
3. **Match the Following**: this is the highest-priority mobile requirement in the whole app — **the two reference columns ("List - I" / "List - II") must stay side by side, never stacked**, even at 360px width. Shrink font size (down to ~11px) and internal padding on the column chips as needed, but do not let column B fall below column A. The option-row list below it behaves like standard MCQ, full width, unchanged.
4. **Sequence / Ordering**: the numbered reference list is full width, single column (it's already a natural vertical list, no side-by-side needed here — only Match-the-Following has the side-by-side requirement). Option rows below, standard full-width stack.

## 6. The option row / review-card component (identical to desktop — this must not visually differ between breakpoints except width)

Option row: full-width bordered button, **fixed height regardless of state** — selecting, or being marked correct/incorrect, must never resize the row or shift anything below it. Left-to-right: small square A/B/C/D badge, option text (flexes to fill), circular radio indicator on the right. Only background tint, border color, and ring/glow change between default / selected / correct / incorrect — border width and box dimensions are constant across all states. Correct rows show a small check icon on the right edge in review mode; incorrect-selected rows show a small x icon; untouched wrong answers show no color change at all.

Review card: bordered white full-width card. Header row: numbered chip + type chip on the left (wrap to a second line if there's also a "Missed Nx" chip, rather than shrinking text illegibly), status pill (Correct/Incorrect/Unanswered, colored, with icon) and bookmark icon-button on the right — these can also wrap below the left group on very narrow screens rather than compressing. Question text below, semibold, full width. Then the type-specific option UI. Then, below a thin divider, the "Explanation & context" block in small gray text. No separate "You selected / Correct answer" box, on either breakpoint.

## 7. States
- Loading skeleton shaped like the review card (not a spinner, not plain "Loading..." text), same on both breakpoints.
- Toast notifications: on mobile, stack from the **bottom, full width minus small side margins** (not bottom-right floating like desktop), same white-card-with-colored-left-accent style, icon + short message + dismiss x, auto-dismissing.
