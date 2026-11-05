"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ContinuePracticeCard } from "@/components/dashboard/ContinuePracticeCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  CheckCircle2,
  ListChecks,
  Percent,
  Bookmark,
  History,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { formatAccuracy, getSubjectDisplayName, cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { SyllabusOverviewCard } from "@/components/dashboard/SyllabusOverviewCard";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";

function getSubjectTheme(name: string) {
  if (name.includes("भूगोल") || name.includes("सामान्य ज्ञान")) {
    return {
      accent: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      gradient: "from-emerald-500/[0.04] to-card/50",
      badge: "15 Topics",
      badgeStyle: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };
  }
  if (name.includes("इतिहास")) {
    return {
      accent: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20 hover:border-amber-500/40",
      gradient: "from-amber-500/[0.04] to-card/50",
      badge: "10 Topics",
      badgeStyle: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
  }
  if (name.includes("कला") || name.includes("संस्कृति")) {
    return {
      accent: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20 hover:border-purple-500/40",
      gradient: "from-purple-500/[0.04] to-card/50",
      badge: "15 Topics",
      badgeStyle: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
  }
  if (name.includes("राजव्यवस्था") || name.includes("प्रशासन")) {
    return {
      accent: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20 hover:border-blue-500/40",
      gradient: "from-blue-500/[0.04] to-card/50",
      badge: "15 Topics",
      badgeStyle: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };
  }
  return {
    accent: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    gradient: "from-cyan-500/[0.04] to-card/50",
    badge: "Paper-II",
    badgeStyle: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };
}

export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list);

  const displayName = me?.name ? me.name.split(" ")[0] : "Student";

  return (
    <div className="space-y-6 pb-10">
      {/* ── Page Header & Personal Greeting ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Welcome back, {displayName}
            </h1>
            <Sparkles className="h-4 w-4 text-primary shrink-0 hidden sm:inline" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Continue your RPSC 2nd Grade GK exam revision and practice tests.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl shrink-0 shadow-2xs h-9 px-4 text-xs sm:text-sm font-semibold border-border/80 bg-card hover:bg-muted text-foreground">
          <Link href="/subjects" className="inline-flex items-center gap-1.5">
            Browse All Subjects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          1. SUBJECTS (ORDER 1 — TOP OF DASHBOARD, FULLY READABLE NO TRUNCATION)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Subjects" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-foreground" />
            Subjects
            {subjects !== undefined && (
              <span className="font-bold text-foreground tabular-nums">({subjects.length})</span>
            )}
          </h2>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            All Subjects <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {subjects === undefined ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card
                key={i}
                className="p-4 border border-border/80 bg-card rounded-2xl space-y-3 shadow-none"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-14 rounded-md" />
                </div>
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </Card>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects available"
            description="No subjects have been created yet."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {subjects.map((s) => {
              const SectionIcon = getSubjectSectionIcon(s.slug || s.name);
              const displayName = getSubjectDisplayName(s);
              const theme = getSubjectTheme(displayName);

              return (
                <Link key={s._id} href={`/subjects/${s._id}`} className="block focus-visible:outline-hidden group">
                  <Card
                    className={cn(
                      "p-4 border bg-gradient-to-b transition-all flex flex-col justify-between gap-3 h-full rounded-2xl select-none relative overflow-hidden shadow-2xs hover:shadow-xs",
                      theme.border,
                      theme.gradient
                    )}
                  >
                    {/* Top Row: Themed Icon + Themed Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-xl border transition-colors duration-200 shrink-0",
                          theme.bg,
                          theme.accent,
                          theme.border
                        )}
                      >
                        <SectionIcon className="h-4 w-4" />
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono tracking-tight transition-colors",
                          theme.badgeStyle
                        )}
                      >
                        {theme.badge}
                      </span>
                    </div>

                    {/* Middle: Fully Readable 2-Line Title (No Truncation) */}
                    <div className="min-h-[2.5rem] flex items-center">
                      <h3 className="font-bold text-xs sm:text-[13px] text-foreground leading-snug group-hover:text-primary transition-colors font-hindi line-clamp-2">
                        {displayName}
                      </h3>
                    </div>

                    {/* Bottom: Explore Link */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      <span>Explore</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          2. CONTINUE PRACTICE · NEXT AVAILABLE SETS (ORDER 2 — 6-COL REFINED)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Continue Practice">
        <ContinuePracticeCard />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. KEY STATISTICS / STATS (ORDER 3 — PLACED AT POSITION 3 AS REQUESTED)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Key Statistics" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-foreground" />
            Performance Overview
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">Live Analytics</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats === undefined ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="p-4 rounded-2xl border border-border/80 bg-card space-y-3 shadow-none"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-3 w-28 rounded" />
                </div>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                icon={ListChecks}
                label="Tests Taken"
                value={stats.testsAttempted}
                subtitle="Completed practice tests"
              />
              <StatCard
                icon={CheckCircle2}
                label="Questions Solved"
                value={stats.questionsSolved.toLocaleString("en-IN")}
                subtitle="Across 5 subjects"
              />
              <StatCard
                icon={Percent}
                label="Accuracy"
                value={formatAccuracy(stats.overallAccuracy)}
                subtitle="Overall score rate"
              />
              <StatCard
                icon={Bookmark}
                label="Bookmarks"
                value={stats.bookmarkCount}
                subtitle="Saved for revision"
              />
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4. RECENT TEST ATTEMPTS (ORDER 4)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Recent Attempts">
        <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4 text-foreground" />
              Recent Attempts
              {recent && <span className="font-bold text-foreground tabular-nums">({recent.length})</span>}
            </h2>
            <Link
              href="/history"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View All History <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recent === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border/60 bg-muted/15">
                  <div className="space-y-1 min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-44 rounded" />
                    <Skeleton className="h-2.5 w-24 rounded" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="h-5 w-11 rounded-md" />
                    <Skeleton className="h-5 w-14 rounded-md" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No tests attempted yet"
              description="Start practicing test sets from any subject above to evaluate your preparation."
              className="py-4"
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((a: any) => (
                <li key={a._id}>
                  <ResultHistoryItem
                    attemptId={a._id}
                    testSetId={a.testSetId}
                    testSetName={a.testSetName}
                    submittedAt={a.submittedAt ?? 0}
                    score={a.score}
                    totalQuestions={a.totalQuestions}
                    answers={a.answers ?? []}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. SYLLABUS TRACKER OVERVIEW (ORDER 5)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Syllabus Overview">
        <SyllabusOverviewCard />
      </section>
    </div>
  );
}
