# Quizzer — Desktop UI generation brief (for Google Stitch)

Paste this whole document into Stitch as your project brief, then generate one screen at a time using the screen headings below as separate prompts if Stitch handles them better individually. This is a **desktop-width (≥1024px)** specification for an existing exam-revision web app called **Quizzer** — a fixed-syllabus quiz platform (subjects → topics → question sets → quiz → results), used by students revising for exams and admins who import question banks.

---

## 1. Brand and product identity

Quizzer is a no-nonsense study tool, not a marketing site. The audience is a student cramming between classes — every screen should prioritize legibility and speed over decoration. White background throughout, one blue accent color, generous but not wasteful whitespace, rounded-but-not-bubbly corners. It should feel closer to a clean fintech dashboard than a consumer app — calm, dense-but-readable, no illustrations, no marketing copy, no hero sections. Every screen has a job: browse content, take a quiz, or review results.

## 2. Design tokens

**Color palette** (exact hex, derived from the app's actual CSS variables):
- Background / page: `#FFFFFF`
- Foreground / primary text: `#181B24` (near-black navy-gray)
- Primary / accent (buttons, links, active states): `#2563EB` (blue)
- Primary text-on-accent: `#FFFFFF`
- Muted surface (chips, subtle backgrounds): `#F1F2F6`
- Muted / secondary text: `#6B7280`
- Border (hairline dividers, card outlines): `#DCDFE6`
- Destructive / error / wrong-answer red: `#DC2626`
- Success / correct-answer green: `#16A34A`
- Warning / bookmark amber: `#F59E0B`
- Card background: same as page background, `#FFFFFF`, distinguished only by a 1–2px border and a very soft shadow — never a filled gray card.

**Typography:**
- Primary UI font: a clean system sans-serif (Inter, or SF Pro / Segoe UI stack) — no serif anywhere.
- A **second font for Hindi (Devanagari) text** is used automatically whenever question content is in Hindi — use a Devanagari-optimized sans (Noto Sans Devanagari) with good bold-weight rendering. This only applies to specific text runs (question text, options, explanations) that contain Hindi script, never to English UI chrome.
- Scale: page titles 24–28px bold, section headers 16–18px bold, body/question text 15–16px semibold, supporting/meta text 12–13px medium, micro-labels (badges, timestamps) 11px semibold uppercase-tracked or sentence case.

**Shape and elevation:**
- Corner radius: 12px on page-level cards, 8–10px on buttons/inputs/chips/option rows, fully round (999px) on pill badges and circular number/icon tokens.
- Borders: 1px `#DCDFE6` hairlines are the primary way content is separated — shadows are minimal (soft, barely-there, used only on hover or the top-level score card).
- Icons: simple line icons throughout (Lucide-style) — dashboard/list/history/bookmark/search/clock/check/x/chevron/trash/pencil/upload.

## 3. Global desktop chrome

**Top navbar** (sticky, full width, white background with a bottom hairline, blurred-on-scroll):
- Left: a graduation-cap icon + wordmark "Quizzer" (bold), links to Dashboard.
- Center-left, taking remaining width: a single search input with a leading search icon and placeholder "Search subjects, topics, sets...", max-width ~380px, always visible on desktop (not collapsible).
- Right, in a row of icon buttons (40×40px hover targets, hover = light gray rounded background): Dashboard icon, Wrong Questions (history/clock icon), Bookmarks (bookmark icon).
- Then, if the signed-in user is an admin, a small solid-blue pill button labeled "Admin".
- Then a vertical hairline divider, followed by the user's name (small gray text with a user icon) and a ghost "Logout" icon-button that turns red on hover.
- Max content width for the whole app below the navbar: centered, ~1024px, with comfortable side padding.

**Admin chrome is different** — a persistent left sidebar (240px wide, light gray-tinted background, right hairline border) containing: "Admin Console / System Management" header with a small "← Dashboard" pill link top-right of that header, then a vertical nav list (Overview, Import, Subjects, Topics, Test Sets, Questions) each as a row with an icon + label, hover = light gray background, and at the bottom of the sidebar a bordered "Back to Dashboard" button. Main content area to the right, generous padding.

## 4. Screens

### 4.1 Login / Sign up
Centered card (max-width ~420px) vertically centered on a plain white page, no sidebar, no navbar. Inside the card: a circular light-blue icon badge with a graduation cap, a bold headline ("Welcome back to Quizzer" for sign-in / "Create a Quizzer account" for sign-up), one line of gray supporting text below it. Below that, a two-tab segmented control ("Sign In" / "Sign Up") styled as a light-gray pill container with the active tab shown as a white rounded rect with a subtle shadow. Then a form: for sign-up only, a "Full name" field appears first; then Email and Password fields (each with a small leading icon inside the input — user/mail/lock); for sign-up only, add a "Confirm password" field and, below it, a two-column toggle-button pair labeled "Account role" with options **Student** and **Admin** (each a bordered rounded button with icon, the selected one filled light-blue with blue text and border). An inline red-tinted error banner can appear above the submit button when validation fails. Full-width solid blue submit button ("Sign In" / "Create account"), and a centered line of small gray text below the card linking to the other mode ("Don't have an account? Sign up").

### 4.2 Student dashboard
Page header row: bold title "Syllabus Revision Dashboard" with a gray subtitle underneath, and a solid blue "View All Subjects →" pill button aligned to the top-right of the row.

Below that, a 4-column stat-card grid, evenly spaced: **Tests Attempted**, **Questions Solved**, **Accuracy**, **Bookmarks** — each a compact card (light muted background, no border, 12px radius) with a small icon in a rounded chip on the left and a label/number stack on the right (12px gray label above, 18–20px bold number below).

Next, a "Fixed Syllabus Subjects" section: bold section header with a count badge on the right, then a 3-column grid of subject cards. Each subject card: a small blue pill top-left reading "Subject N", a chevron-right icon top-right that shifts on hover, a bold subject name, a 2-line gray description, and a footer row (separated by a hairline) with a small icon + "Fixed Syllabus Topics" label.

Below that, a 2-column row: **Weak Subjects** card (list of subject name + thin horizontal progress bar in red/blue + percentage, OR — if no attempt data exists yet — a centered empty-state message inviting the user to attempt a test) and **Daily Progress** card (a small bar-chart of the last ~14 days, bars in blue, OR the same friendly empty state if there's no data).

Finally, a full-width "Recent Test Attempts" card: header row with a clock/history icon + label, then a compact list of rows, each showing date, subject name, and a right-aligned score pill (e.g. "14 / 20") with a small colored status dot (green if passing, red if not). Empty state: centered message "No tests attempted yet" with a one-line hint.

### 4.3 Subjects list (`/subjects`)
Breadcrumb row (Dashboard › Subjects) in small gray text with chevron separators. Bold page title "All Syllabus Subjects" + gray subtitle. Below: a 2-column grid of subject cards (same visual style as dashboard subject cards, slightly larger). Empty state if no subjects exist yet.

### 4.4 Subject detail (`/subjects/[id]`) — topic list
Breadcrumb (Dashboard › Subjects › [Subject Name]). Bold subject name as page title with optional description below. Section header "Fixed Topics (N)" in small uppercase gray. Below: a 2-column grid of topic rows — each a horizontal card with a small circular numbered badge, the topic name in semibold, and a chevron-right icon on the far right. Empty state if no topics.

### 4.5 Topic detail (`/subjects/[id]/[topicId]`) — test/practice sets
Breadcrumb (Dashboard › Subjects › Subject › Topic). Bold topic title, gray subtitle "Available Question Sets for practice and self-assessment". Below: a 2-column grid of **practice-set cards**, each a single horizontal row: left side has a small blue icon chip (document icon) + the set name in semibold + a gray meta line ("20 Questions · Negative Marking (-0.25)"), right side has a small solid pill button "▶ Start" that inverts to filled-blue on hover. Empty state if no sets uploaded yet.

### 4.6 Quiz-taking screen (`/quiz/[id]`)
Two-column desktop layout: a wide left column (question) and a narrow fixed right column (~260px, sticky) for navigation.

Top of left column: a compact bar (light card, border, rounded) showing the test-set name (bold) with "X of Y answered" in small gray text underneath, and on the right a pill-shaped timer chip with a clock icon and mm:ss countdown/countup in monospace.

Below that, the **question card**: a numbered circular chip (blue), a small gray "type" chip (e.g. "Standard MCQ"), then the question text in semibold 15–16px. Below the question, the type-specific answer UI (see section 5 for all 7 types). Below the question card: a Previous / Next row (Previous = outline button, disabled on question 1; Next = solid blue button; on the last question, Next becomes a solid "Submit Test" button).

Right sidebar: a **question palette** — a grid of small square number buttons (5–6 per row), each showing the question number; answered questions have a green-tinted fill, current question has a blue ring, bookmarked questions show a tiny blue dot in the top-right corner of their square. Below the palette, a full-width solid blue "Submit Test" button.

A **confirm-submit dialog** (centered modal, white card, rounded 12px, backdrop dimmed+blurred): bold title "Submit test?", gray description "You've answered X of Y questions. Are you sure you want to finish?", Cancel (outline) and Submit (solid blue) buttons bottom-right.

### 4.7 Quiz results screen (`/quiz/[id]/results`)
Small "← Back to Dashboard" link top-left. Below it, a centered score summary card: small uppercase gray label "Test Attempt Results", a large bold score ("14 / 20") next to a blue pill showing "70.0% Accuracy", and two buttons below ("Practice Wrong Questions" outline, "Browse Other Subjects" solid blue).

Below that, "Detailed Question Review" header with a count on the right ("20 Questions Reviewed"), then a **stacked list of question review cards** (see section 6 — this is the most important card in the whole app, get the option states exactly right). No "You selected / Correct answer" text block anywhere — color coding on the options themselves is the only indicator, plus a small colored status badge (Correct / Incorrect / Unanswered) with a check/cross/help icon in the card header.

### 4.8 Wrong Questions (`/wrong-questions`) and Bookmarks (`/bookmarks`)
Simple page title + one-line gray subtitle, then a stacked list of the same **question review card** component used on the results page, in review mode with no live selection. On Wrong Questions, each card additionally shows a small red-tinted "Missed Nx" chip in its header. Bookmarks cards always show the bookmark icon filled/active. Empty states: "No wrong questions — nice work!" and "No bookmarks yet" respectively, each with a relevant icon and one-line hint.

### 4.9 Search results (`/search?q=`)
Page title "Search results for "query"". Results grouped into three optional sections (Subjects, Topics, Test Sets), each a small gray uppercase section label followed by a stack of simple bordered result rows (name + one line of context, e.g. topic shows its parent subject). Empty state: centered "No matches found" with a search icon.

### 4.10 Admin overview (`/admin`)
Inside the admin sidebar layout. Page title "Admin Console Overview" + subtitle. A single stat card ("Total Subjects" with count). A prominent full-width "Import Questions" banner card (icon + bold title + description + arrow, hover-highlights) linking to the import wizard. Below, a "Management Sections" 4-column grid of link cards (Subjects, Topics, Test Sets, Questions), each a compact icon+label+one-line-description row.

### 4.11 Admin Subjects / Topics / Test Sets (`/admin/subjects`, `/admin/topics`, `/admin/test-sets`)
Each follows the same dense admin pattern: page title, then a form row for creating a new item (a text input + solid "Add" button inline), then a **data table** below (light gray header row, hairline row dividers, hover-highlight on rows, a trash-icon button in the last column of every row). Topics and Test Sets pages additionally have one or two **dropdown selects above the table** ("Select a subject...", and for Test Sets also "Select a topic...") that must be chosen before the table and creation form appear — cascading selection. The Test Set creation form also includes a small checkbox labeled "Negative marking". Deleting any row opens a **confirm dialog** (same style as quiz-submit dialog) with a destructive red "Delete" button, warning that child records will also be deleted.

### 4.12 Admin Questions (`/admin/questions`)
Page title, a single full-width search input ("Search question text across the whole bank..."). Below: an empty hint state until the user types, then a data table (Question text truncated to 2 lines / Type / Difficulty / row actions). Row actions: a pencil "edit" icon button and a trash "delete" icon button. Edit opens a **modal dialog** titled "Edit question" containing two labeled multi-line textareas ("Question text", "Explanation") and Cancel/Save buttons bottom-right.

### 4.13 Admin Import Wizard (`/admin/import`) — 3-step flow
This is the most complex screen — a **stepper flow**, no visible step indicator chrome needed, just render each step as its own full view:

**Step 1 — Editor**: a large full-width code/text editor area (monospace font, bordered, light background) where an admin pastes raw question JSON, with small subject/topic name dropdown context near the top of the editor toolbar. Below the editor, a solid blue "Proceed to Preview (N Questions) →" button, right-aligned, disabled until valid JSON is parsed.

**Step 2 — Preview & destination**: header "Question Set Target & Preview" with a small ghost "← Back to Full-Screen Editor" button on the right. If there are validation errors, a red-tinted warning box lists them. Below, a bordered card containing: two side-by-side **dropdown selects** ("Target Syllabus Subject", "Target Fixed Topic" — the second disabled until the first is chosen), then a text input "Question Set Name", then a checkbox "Enable Negative Marking (-0.25)", then a **duplicate-handling strategy** control shown as three equal-width toggle buttons in a row ("Skip Duplicates" / "Replace Duplicates" / "Keep Both", selected one filled light-blue with a blue ring), then a stats row showing total question count plus three colored count pills (Easy=green, Medium=blue, Hard=red). Below that card: "Questions Preview (showing first 5 of N)" — a scrollable stack of question preview cards, each showing a monospace "Q1 · TYPE: MCQ" line with a difficulty pill, the question text, and a 2-column grid of option chips where the correct option is highlighted green. Bottom of the page: an outline "Back" button and a full-width-ish solid blue "Confirm & Import N Questions" button.

**Step 3 — Completion report**: centered success panel with a large green circular check icon, bold "Questions imported successfully!" headline, and one line naming the imported set. Below it, a 4-column stat-card row (Total Found / Successfully Imported / Duplicates Handled / Time Elapsed), each a simple bordered card with a small gray label and a large bold number. A full-width solid blue "Import Another Question Set" button at the bottom resets the flow.

## 5. Question-type answer UI (used inside both the quiz-taking screen and every review card)

All seven question types share one option-button visual language (see section 6) except True/False and the two reference-list types:

1. **Standard MCQ** and **Table-Based**: a vertical stack of 3–4 option rows (see section 6). Table-Based additionally shows a bordered data table (header row shaded, rows striped by hairlines) above the options.
2. **Statement & Reason** and **Assertion-Reason**: visually identical to standard MCQ — the statements/assertion text lives inside the question text itself (with preserved line breaks), options below are the standard 4-verdict list ("Both true and R explains A", etc).
3. **True/False**: exactly two large equal-width buttons side by side (not stacked), each pill-like with bold centered text, using the same selected/correct/incorrect color language as option rows but no A/B badge.
4. **Match the Following**: above the options, a muted-background bordered panel showing **two columns side by side** (never stacked, even on narrow widths) labeled "List - I" and "List - II", each a small vertical list of short bordered chips. Below that panel, a label "Select the correct combination:" followed by the standard option-row list (each option text is a combination string like "A-3, B-1, C-4").
5. **Sequence / Ordering**: above the options, a muted-background bordered panel with a numbered reference list of the items to be sequenced. Below it, "Select the correct sequence order:" followed by the standard option-row list.

## 6. The option row / review-card component (get this exactly right — it's the most important visual element in the app)

An **option row** is a full-width bordered button, fixed height regardless of state (never resizes or shifts position), containing left-to-right: a small square badge (A/B/C/D) in a rounded-square chip, the option text, and a circular radio indicator on the far right. States, using color/background/ring only — border width and box size never change between states:
- **Default / unselected**: white background, gray border, gray badge.
- **Selected (during quiz, before grading)**: light blue background tint, blue border, blue badge, blue ring glow.
- **Correct (review mode)**: light green background tint, green border, green badge, small check icon appears on the right side of the row.
- **Incorrect / wrongly selected (review mode)**: light red background tint, red border, red badge, small x icon appears on the right.
- **Unselected wrong answer (review mode)**: same as default, unchanged — no color at all.

A **review card** wrapping this (used on results/wrong-questions/bookmarks pages): a bordered white card with a header row containing a small circular question-number chip, a gray "question type" chip, and — right-aligned — a colored status pill with an icon ("Correct" green / "Incorrect" red / "Unanswered" gray) and a bookmark icon-button (amber/filled when active). Below the header, the question text in semibold, then the type-specific option UI from section 5, then — separated by a thin divider — an "Explanation & context" block in small gray text. Critically: **no separate "You selected / Correct answer" text box anywhere** — the color coding on the options is the only correctness indicator besides the header status pill.

## 7. States to include somewhere in the generated set
- Loading state: a skeleton shaped like the question-review card (gray pulsing rectangles matching the real layout), not a spinner or plain text.
- Toast notifications: small stacked cards bottom-right of the viewport, white background, colored left accent by type (green=success, blue=info, amber=warning), icon + short message + dismiss x, used for actions like "Question bookmarked".
