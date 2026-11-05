# Quizzer System Architecture Documentation

## 1. Executive Overview

**Quizzer** is an offline-resilient, distraction-free Rajasthan GK revision application designed for competitive examinations (RPSC 2nd Grade Senior Teacher, CET, RAS, REET). It is strictly and exclusively dedicated to Rajasthan GK across **4 Canonical Subjects** and **55 Master Topics** based on the authoritative master syllabus contract.

---

## 2. Technology Stack

- **Framework**: Next.js 16.3.0 (App Router, Turbopack)
- **Runtime**: React 19.2.8, TypeScript 5, Bun 1.3.14
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), Radix UI / Base UI primitives
- **Backend / Realtime Database**: Convex 1.43.0 with `@convex-dev/auth`
- **Client Offline Storage**: Dexie (IndexedDB) 4.4.7 for offline quiz sessions and caching
- **Visualization**: Recharts 3.10.1
- **Icons**: Lucide React 1.28.0 + Quizzer Custom SVG Icon suite
- **Typography System**: 
  - English / Base UI: `Google Sans` (`--font-google-sans`) via `next/font/google`
  - Hindi / Devanagari Primary: `Utsaah` (`--font-utsaah`) via `next/font/local` (weights 400, 500, 600, 700, italic)
  - Hindi Fallback: `Anek Devanagari` (`--font-anek-devanagari`) via `next/font/google`

---

## 3. Directory Structure Topology

```
quizzer2/
├── .next/                   # Build artifacts (Turbopack cache)
├── convex/                  # Convex backend functions, schemas, validators
│   ├── auth.ts              # Authentication config (@convex-dev/auth)
│   ├── questions.ts         # Question queries and mutations
│   ├── testSets.ts          # Quiz set generation and management
│   ├── userProgress.ts      # User activity, streaks, mastery tracking
│   ├── lib/                 # Backend helpers, shared validators
│   └── schema.ts            # Canonical database tables
├── docs/                    # Architecture, Component Registry, Audit logs
│   ├── ARCHITECTURE.md      # This file
│   ├── COMPONENT_REGISTRY.md# Registry of all 75+ components
│   └── PROJECT_AUDIT.md     # Ongoing refactoring audit and task log
├── public/                  # Static assets, icons, manifest, service worker
│   ├── icons/               # PWA icons (32, 192, 512px)
│   ├── utsaah/              # Local Utsaah TrueType and WOFF font files
│   └── sw.js                # Service worker for offline revision
├── src/
│   ├── app/                 # Next.js App Router (22 routes)
│   │   ├── (admin)/         # Protected admin routes (pool, dedup, import)
│   │   ├── (auth)/          # Authentication routes (login)
│   │   ├── (student)/       # Student revision routes (dashboard, quiz, etc.)
│   │   ├── api/             # Internal API routes
│   │   ├── globals.css      # Design tokens, theme variables, typography
│   │   └── layout.tsx       # Root layout with font injection and providers
│   ├── components/          # React UI and Domain Components
│   │   ├── admin/           # Administrative pool and import tools
│   │   ├── analytics/       # Student mastery and accuracy charts
│   │   ├── dashboard/       # Dashboard widgets and resume cards
│   │   ├── icons/           # Custom Rajasthan GK SVG icons
│   │   ├── quiz/            # Core quiz rendering engine and shells
│   │   │   └── pdf/         # A4 printable PDF assessment engine
│   │   ├── shared/          # App sidebar, providers, guards, banners
│   │   ├── syllabus/        # Interactive 55-topic syllabus matrix
│   │   └── ui/              # shadcn/ui base primitives
│   ├── hooks/               # Custom hooks (quiz session, offline state)
│   ├── lib/                 # Core domain logic, parsers, validators
│   └── types/               # TypeScript interfaces and domain schemas
```

---

## 4. Canonical Syllabus & Data Flow

### The 4 Canonical Subjects (55 Master Topics)
1. **राजस्थान सामान्य ज्ञान एवं भूगोल** (15 Topics: `geo_01` to `geo_15`)
2. **राजस्थान का इतिहास** (10 Topics: `hist_01` to `hist_10`)
3. **राजस्थान कला एवं संस्कृति** (15 Topics: `art_01` to `art_15`)
4. **राजस्थान राजव्यवस्था एवं प्रशासन** (15 Topics: `pol_01` to `pol_15`)

### Question Lifecycle
```
Raw Question Batches (JSON / DOCX)
            │
            ▼
[Import Wizard / Parser] ── (Validation against static-syllabus contract)
            │
            ▼
[Deduplication Engine] ── (Similarity matching, question resolution)
            │
            ▼
[Master Pool / Convex DB]
            │
            ├──► Published Test Sets (20 questions / set)
            │           │
            │           ▼
            │     [Student Quiz Engine] ──► Dexie Offline Cache
            │           │
            │           ▼
            │     [Results / Analytics] ──► PDF Printable Export
```

---

## 5. Typography Architecture

Quizzer employs a strict dual-font typography contract:

1. **English / UI Chrome**:
   - `Google Sans` (`--font-google-sans`) is applied to layout chrome, English navigation items, numbers, timers, and button labels.
   - Preserves high-density readability and a clean modern aesthetic.

2. **Hindi / Devanagari Content**:
   - `Utsaah` (`--font-utsaah`) is the primary font loaded locally from `public/utsaah/utsaah.woff` using `next/font/local`.
   - Applied to `.font-hindi`, `:lang(hi)`, and all question text, options, explanations, topic titles, and PDF print sheets.
   - Fallback chain: `var(--font-utsaah)` ➔ `Utsaah` ➔ `var(--font-anek-devanagari)` ➔ `Anek Devanagari` ➔ `var(--font-google-sans)` ➔ `Noto Sans Devanagari` ➔ `sans-serif`.

---

## 6. Safety & Refactoring Guidelines

1. **No Breaking Changes**: Existing student quiz workflows, Dexie database sync, and Convex auth guards must remain strictly intact.
2. **Zero Regressions in Syllabus**: The 55 topic IDs and 4 canonical subjects are immutable contracts.
3. **Incremental Verification**: Every refactoring chunk must pass `bun run build` with 0 TypeScript and Turbopack errors before proceeding.

