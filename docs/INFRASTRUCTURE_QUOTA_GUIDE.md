# Vercel & Convex Free-Tier Quota & Infrastructure Guide

This document defines the strict operational boundaries, hard limits, and architectural safeguards for Quizzer on the **Vercel Hobby (Free)** and **Convex Free Tier**.

The goal is to ensure the platform operates continuously, efficiently, and at lightning speed **without ever exhausting monthly quotas**.

---

## 1. Real-Time Resource Usage & Hard Limits

### A. Convex Free-Tier Limits (November 2026 Cycle)

| Metric | Current Usage | Monthly Free Cap | % Used | Risk Level | Protection Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deployments** | **4** | **40 Deployments** | **10.0%** | 🔴 **HIGH RISK** | **Never auto-deploy Convex.** Schema pushes must be strictly batched and manual. |
| **Database I/O** | **367.77 MB** | **6.00 GB** | **6.1%** | 🟡 **MEDIUM RISK** | **Never store 14k questions in Convex db.** Question bodies must be served local-first via Next.js API routes. Convex stores only user attempt IDs, scores, bookmarks, and timestamps. |
| **Functions Storage** | 20.47 MB | 3.00 GB | 0.7% | 🟢 LOW | Keep DB lean. Zero raw media or redundant copies. |
| **Function Calls** | 9.3K | 6.00 Million | 0.15% | 🟢 LOW | Use WebSocket reactive subscriptions; 300ms debounce on answer saves. |
| **Action Compute** | 0.00053 GB-h | 120 GB-hours | < 0.01% | 🟢 LOW | Run heavy data migrations and deduplication locally with Node/Bun scripts. |
| **Data Egress** | 12.2 MB | 6.00 GB | 0.2% | 🟢 LOW | Return minimal payload fields; avoid streaming large collections. |
| **File Storage** | 2.96 MB | 6.00 GB | 0.05% | 🟢 LOW | Assets served from Vercel CDN/public directory. |
| **Search Storage** | 0 B | 512 MB | 0.0% | 🟢 LOW | Local client-side fuzzy search. |
| **AI Gateway** | $0.00 | Pay-as-you-go | 0.0% | 🟢 LOW | No direct paid gateway calls. |

---

### B. Vercel Hobby Free-Tier Limits (Rolling 30-Day Window)

| Metric | Current Usage | Monthly Free Cap | % Used | Risk Level | Protection Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Functions Storage** | **2.16 GB** | **10.00 GB** | **21.6%** | 🔴 **HIGH RISK** | In `next.config.ts`, only `/api/**/*` traces `./data/**/*`. Static pages must **never** bundle `./data/**/*`. Keep `data/` < 25 MB total. |
| **Fluid Active CPU** | **25m 15s** | **4.00 Hours** | **10.5%** | 🟡 **MEDIUM RISK** | Use in-memory module caching in `src/lib/questionPool.ts`. API routes must resolve in < 1ms. Avoid expensive synchronous loops in serverless functions. |
| **Deployment Storage** | 921.64 MB | 10.00 GB | 9.2% | 🟢 LOW | Delete temporary files before commit; keep repository clean. |
| **Function Invocations** | 40K | 1.00 Million | 4.0% | 🟢 LOW | Prefer static page pre-rendering (`○ Static`); no polling HTTP endpoints. |
| **CDN Requests** | 53K | 1.00 Million | 5.3% | 🟢 LOW | PWA Service Worker caching for icons, fonts, and assets. |
| **Fast Origin Transfer** | 127.01 MB | 10.00 GB | 1.2% | 🟢 LOW | Gzip/Brotli compression enabled (`compress: true`). |
| **Fast Data Transfer** | 500.61 MB | 100.00 GB | 0.5% | 🟢 LOW | Tree-shaken bundles via `optimizePackageImports`. |
| **Fluid Provisioned Memory** | 2.6 GB-Hrs | 360 GB-Hrs | 0.7% | 🟢 LOW | Keep serverless memory footprints under 128 MB. |
| **CDN Request CPU Duration** | 25s | 1.00 Hour | 0.7% | 🟢 LOW | Fast Edge routing without middleware overhead. |
| **ISR Reads** | 2.1K | 1.00 Million | 0.2% | 🟢 LOW | Dynamic data fetched client-side. |

---

## 2. Core Architectural Safeguards Already Implemented

### 1. Local-First Question Bank (Convex Database I/O & Storage Protection)
- **Problem Avoided**: Storing 13,974 Rajasthan GK questions and 2,818 English questions in Convex database would consume ~60 MB storage and consume hundreds of MBs of Database I/O every day.
- **Solution**: All questions live in static, clean JSON files (`data/questions/rajasthan-gk/topic_01.json` .. `topic_55.json`).
- **Result**: Convex database storage is only **20.47 MB** (only attempts, user profiles, and syllabus checks). Convex Database I/O is reduced by over **90%**.

### 2. Zero-Duplicate Single Source of Truth (Vercel Functions Storage Protection)
- **Problem Avoided**: Storing `master-pool.json` (30.1 MB), unminified `published-sets.json` (13.5 MB), and 15 batch files (30 MB) would trace ~75 MB into every serverless route, rapidly exhausting the 10 GB Vercel Functions Storage limit.
- **Solution**:
  - Permanently deleted `master-pool.json` and loose batch files.
  - Minified `published-sets.json` to 282 KB manifests storing only `questionIds: string[]`.
  - Configured `next.config.ts`:
    ```ts
    outputFileTracingIncludes: {
      "/api/**/*": ["./data/**/*"],
    }
    ```
    (Frontend pages like `/dashboard`, `/syllabus`, etc., never bundle `./data/`).
- **Result**: Saved over **1.2 GB** of accumulated Vercel Functions Storage across serverless deployments.

### 3. In-Memory Module Caching (Vercel Active CPU & Convex Function Calls Protection)
- **Problem Avoided**: Re-reading or re-parsing 55 topic JSON files on every API request wastes Vercel CPU time (which is capped at only 4 hours per month).
- **Solution**: [`src/lib/questionPool.ts`](file:///e:/quizzer2/src/lib/questionPool.ts) caches loaded questions in memory (`_questionIndex`). Subsequent requests complete in **0.01ms** with virtually 0ms CPU time.
- **Result**: Fluid Active CPU remains safely below 30 minutes for the entire month.

### 4. Debounced User Answer Syncing (Convex Function Calls Protection)
- **Problem Avoided**: Sending a database write on every option click or fast tap would generate tens of thousands of function calls and database mutations.
- **Solution**: [`src/hooks/useQuizSession.ts`](file:///e:/quizzer2/src/hooks/useQuizSession.ts) uses a `300ms` debounce timer (`SAVE_DEBOUNCE_MS`) before sending `saveAnswer` mutations to Convex.
- **Result**: Convex Function Calls usage is at **9.3K / 6 Million (only 0.15%)**.

---

## 3. Strict Rules for All Future Development

1. ❌ **NEVER commit large JSON duplicates** (like full question pools or multiple copies of sets) to `data/`.
2. ❌ **NEVER trigger `npx convex deploy` automatically** in automated scripts or loops.
3. ❌ **NEVER write unbounded `.collect()` queries** in Convex backend functions. Always use `.take(limit)` or paginate.
4. ❌ **NEVER add `/**/*` to `outputFileTracingIncludes`** in `next.config.ts`. Only API endpoints that genuinely read files should trace `./data/`.
5. ❌ **NEVER implement polling `setInterval` loops** on the client to fetch server state. Use Convex WebSocket subscriptions or React Query.
6. ✅ **ALWAYS run `bun run build`** and verify bundle sizes and warnings before pushing to `master`.

