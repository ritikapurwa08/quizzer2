<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Package Manager & Command Execution Contract: ALWAYS USE `bun`

> [!IMPORTANT]
> **MANDATORY TOOLING**: Always use **`bun`** instead of `npm`, `yarn`, or `npx` for ALL terminal commands, scripts, builds, and package installations.
> Before executing ANY command, inspect and verify against these project rules.
> - Dev Server: `bun run dev` (NOT `npm run dev`)
> - Production Build: `bun run build` (NOT `npm run build`)
> - Script Execution: `bun <script.ts>` or `bun run <script>` (NOT `node` or `ts-node`)
> - Adding Packages: `bun add <package>` (NOT `npm install`)
> - Running CLI Binaries: `bunx --bun <command>` (NOT `npx`)

---

# UI, Component Architecture & Theme Centrification Standards

1. **Always Use Shadcn UI Components**:
   - Strictly build upon Shadcn components located in `@/components/ui/*` (`Button`, `Card`, `Badge`, `Select`, `Dialog`, etc.).
   - Do not write raw unstyled HTML elements when an established Shadcn component exists.

2. **Component Length Rule (Max 300 Lines)**:
   - **No component file should exceed 300 lines**.
   - Break down complex or lengthy views into modular, single-responsibility subcomponents placed in dedicated subdirectories (e.g. `src/components/admin/import/`).
   - Keep business logic in custom hooks or utility functions.

3. **Theme Centrification (Semantic CSS Variables)**:
   - Exclusively use Tailwind semantic theme tokens: `bg-card`, `bg-background`, `bg-popover`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`, `bg-primary`, `bg-success`, `text-destructive`.
   - NEVER hardcode arbitrary hex colors or rogue styles that break light/dark mode parity.

4. **Mobile Responsiveness & Zero Overflow**:
   - Ensure all flex headers, cards, and grid sections use `min-w-0`, `w-full`, and `overflow-x-hidden`.
   - Use responsive flex directions (`flex-col sm:flex-row`) for header action bars and badges so viewports never overflow on mobile (360px–400px).

---

# Rajasthan GK Authoritative Master Syllabus Contract (47 Master Topics across 4 Canonical Subjects)

The application and question bank are strictly and exclusively dedicated to Rajasthan GK across the following 4 Canonical Subjects and 47 Master Topics aligned with the RPSC Senior Teacher (2nd Grade) curriculum.

### A. राजस्थान सामान्य ज्ञान एवं भूगोल (15 Topics)
1. राजस्थान का सामान्य ज्ञान
2. राजस्थान का भौतिक स्वरूप एवं भूगोल
3. राजस्थान की जलवायु
4. राजस्थान की जनसंख्या एवं जनगणना
5. राजस्थान की मृदा
6. राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें
7. राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन
8. राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान
9. राजस्थान की कृषि
10. राजस्थान का पशुपालन एवं डेयरी विकास
11. राजस्थान के खनिज संसाधन
12. राजस्थान के ऊर्जा संसाधन
13. राजस्थान के प्रमुख उद्योग
14. राजस्थान का परिवहन
15. राजस्थान का पर्यटन एवं पर्यटन परिपथ

### B. राजस्थान का इतिहास (8 Topics)
16. राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल
17. राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)
18. राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ
19. राजस्थान के किसान एवं जनजातीय आंदोलन
20. राजस्थान के प्रजामंडल आंदोलन
21. राजस्थान का एकीकरण
22. राजस्थान में राजनीतिक जन-जागरण, संगठन एवं समाचार पत्र/पत्रकारिता
23. राजस्थान के प्रमुख व्यक्तित्व (पुरुष एवं महिला)

### C. राजस्थान कला एवं संस्कृति (15 Topics)
24. राजस्थान के मेले
25. राजस्थान के त्योहार
26. राजस्थान की रीति-रिवाज एवं परंपराएँ
27. राजस्थान की वेशभूषा एवं आभूषण
28. राजस्थान की स्थापत्य कला एवं वास्तुकला
29. राजस्थान की चित्रकला शैलियाँ
30. राजस्थान के हस्तशिल्प एवं हस्तकलाएँ
31. राजस्थान के लोक देवता एवं लोक देवियाँ
32. राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ
33. राजस्थान का लोक संगीत एवं लोकगीत
34. राजस्थान के लोक नृत्य एवं नाट्य
35. राजस्थानी भाषा एवं बोलियाँ
36. राजस्थानी साहित्य
37. राजस्थानी शब्दावली
38. राजस्थानी मुहावरे एवं लोकोक्तियाँ

### D. राजस्थान राजव्यवस्था एवं प्रशासन (9 Topics)
39. राजस्थान के राज्यपाल
40. राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद
41. राजस्थान राज्य विधानमंडल (विधानसभा)
42. राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका
43. राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन
44. राजस्थान पंचायती राज व्यवस्था एवं प्रशासन
45. राजस्थान नगरीय स्वशासन एवं नगरपालिका
46. राजस्थान के प्रमुख आयोग एवं संवैधानिक/सांविधिक संस्थाएँ
47. राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र

---

# Authoritative Infrastructure & Free-Tier Quota Protection Contract (Vercel & Convex)

The application operates on the **Vercel Hobby (Free)** and **Convex Free Tier**. All features, API routes, database queries, and architectural refactoring MUST STRICTLY COMPLY with the following quota protection rules. Under NO circumstances should any change burn through these quotas.

### A. Convex Free-Tier Limits & Hard Constraints
1. **Database I/O (Monthly Cap: 6 GB · Target: < 2 GB)**:
   - **Rule**: NEVER store heavy question bodies (texts, 4 options, full explanations) in the Convex database. Question data must remain **local-first** in static JSON files (`data/questions/rajasthan-gk/topic_XX.json`) and served via Next.js API routes.
   - **Rule**: Convex database stores ONLY lightweight user state: user profile, test attempts (testSetId, answers, score, submittedAt), bookmarks, and syllabus checklists.
   - **Rule**: Avoid unbounded queries. Never call `.collect()` on large tables without index filtering or pagination. Always use indexed queries with `.take(limit)`.
2. **Deployments (Monthly Cap: 40 deployments · Target: < 20)**:
   - **Rule**: Do NOT execute `npx convex deploy` automatically in build scripts or commit hooks. Backend schema pushes must be deliberate, manual, and strictly batched.
3. **Database Storage (Monthly Cap: 3 GB · Target: < 100 MB)**:
   - **Rule**: Keep Convex storage slim (currently ~20.5 MB). No raw assets, images, or redundant copies.
4. **Function Calls (Monthly Cap: 6 Million · Target: < 1 Million)**:
   - **Rule**: Rely on Convex WebSocket reactivity instead of HTTP polling.
   - **Rule**: Debounce all frequent writes (e.g., student answer selection debounced via `SAVE_DEBOUNCE_MS = 300ms`).

### B. Vercel Hobby / Free-Tier Limits & Hard Constraints
1. **Functions Storage (Monthly Cap: 10 GB · Target: < 4 GB)**:
   - **Rule**: Serverless lambda bundle size must be kept minimal. In `next.config.ts`, `outputFileTracingIncludes` must trace `./data/**/*` ONLY for `/api/**/*`, NEVER for frontend static pages (`/**/*`).
   - **Rule**: Keep the `data/` folder lean (< 25 MB total). Never retain duplicate copies (`master-pool.json` deleted, `published-sets.json` minified to 282 KB manifests). Never leave unneeded batch JSON files in the workspace.
2. **Fluid Active CPU (Monthly Cap: 4 Hours · Target: < 1.5 Hours)**:
   - **Rule**: Serverless API routes must execute in milliseconds (< 50ms). Use in-memory module caching in `src/lib/questionPool.ts` so file parsing runs only once per lambda lifecycle.
   - **Rule**: Avoid heavy synchronous CPU loops, unbounded regex processing, or expensive AST parsing inside API requests.
3. **Deployment Storage (Monthly Cap: 10 GB · Target: < 3 GB)**:
   - **Rule**: Clean build artifacts (`.next/`) before builds. Do not commit media blobs or redundant cache files to the Git repository.
4. **Fast Origin Transfer (Monthly Cap: 10 GB · Target: < 2 GB)**:
   - **Rule**: Keep HTTP payloads lightweight. API routes return only required fields. Static assets have 1-year immutable caching (`max-age=31536000`).
5. **Function Invocations (Monthly Cap: 1 Million · Target: < 250K)**:
   - **Rule**: Maximize static page pre-rendering (`○ Static`). Only dynamic data fetching uses API routes or Convex client queries.
