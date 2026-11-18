# Quizzer2 (RPSC Senior Teacher 2nd Grade GK & English Test Prep)

A high-performance, mobile-first exam preparation platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Convex**.

## Getting Started

> [!IMPORTANT]
> This project uses **`bun`** exclusively as its runtime and package manager. Always use `bun` instead of `npm`, `yarn`, or `pnpm`.

### Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build for Production

```bash
bun run build
```

### Run Scripts & Tests

```bash
bun <script-path>
# e.g., bun scripts/sync_topics_and_sets_dev.ts
```

## Architectural Guidelines

Please consult [`AGENTS.md`](./AGENTS.md) for the authoritative rules on:
- **Package Manager**: Mandatory usage of `bun`.
- **Component Guidelines**: Shadcn UI components, theme centrification, and max 300 lines per file.
- **Syllabus Contract**: 47 Master Topics across 4 Canonical Subjects for Rajasthan GK.
- **Quota Defense**: Convex Free Tier and Vercel Hobby Free Tier hard limits and database I/O protection.
