"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  Percent,
  Bookmark,
  Flame,
  Sun,
  Moon,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAccuracy } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";
import { SubjectCard } from "@/components/dashboard/SubjectCard";
import { ContinuePracticeCard } from "@/components/dashboard/ContinuePracticeCard";
import { SyllabusOverviewCard } from "@/components/dashboard/SyllabusOverviewCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { EmptyState } from "@/components/shared/EmptyState";

const CANONICAL_SUBJECT_ORDER: Record<string, number> = {
  "rajasthan-general-knowledge-geography": 1,
  "rajasthan-history": 2,
  "rajasthan-art-culture": 3,
  "rajasthan-polity-administration": 4,
  "english": 5,
};

export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 4 });
  const subjects = useQuery(api.subjects.list);
  const setCounts = useQuery(api.subjects.setCountsAllSubjects) ?? {};
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName = me?.name ? me.name.split(" ")[0] : "Student";

  // Strict 5 canonical subject ordering
  const sortedSubjects = useMemo(() => {
    if (!subjects) return [];
    return [...subjects].sort((a, b) => {
      const orderA = CANONICAL_SUBJECT_ORDER[a.slug || ""] ?? 99;
      const orderB = CANONICAL_SUBJECT_ORDER[b.slug || ""] ?? 99;
      return orderA - orderB;
    });
  }, [subjects]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* ── Top Row & Quick Metrics Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="typo-h1 text-foreground">
              Welcome back, {displayName}
            </h1>
            <span
              className="text-xl sm:text-2xl inline-block animate-wave select-none ml-0.5"
              role="img"
              aria-label="Waving hand"
            >
              👋
            </span>
          </div>
          <p className="typo-small text-muted-foreground mt-0.5">
            Your personalized RPSC 2nd Grade GK exam revision &amp; practice command center.
          </p>
        </div>

        {/* Right side: Streak Badge + Light/Dark Theme Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 typo-small font-bold">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>
              {stats ? `${stats.currentStreak ?? 0}-Day Streak` : <Skeleton className="h-4 w-16 inline-block" />}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-md bg-card text-muted-foreground hover:text-foreground border border-border cursor-pointer transition-colors"
            title={mounted ? (theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode") : "Toggle theme"}
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <span className="h-4 w-4 inline-block" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-blue-500" />
            )}
          </Button>
        </div>
      </div>

      {/* ── 1. Top Stats Grid (Questions Solved, Accuracy %, Saved Items, Active Streak) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Questions Solved</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? stats.questionsSolved.toLocaleString("en-IN") : <Skeleton className="h-8 w-20" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Across verified sets</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Accuracy %</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? formatAccuracy(stats.overallAccuracy) : <Skeleton className="h-8 w-20" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Overall success rate</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Saved Items</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? stats.bookmarkCount : <Skeleton className="h-8 w-16" />}
            </span>
            <span className="text-[11px] text-muted-foreground">Bookmarks &amp; wrong Qs</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Active Streak</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              {stats ? (
                stats.currentStreak ?? 0
              ) : (
                <Skeleton className="h-8 w-12" />
              )}{" "}
              <span className="typo-h3 font-medium text-muted-foreground">Days</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {stats && (stats.bestStreak ?? 0) > 0
                ? `Best: ${stats.bestStreak} days consistency`
                : "Daily practice consistency"}
            </span>
          </div>
        </Card>
      </div>

      {/* ── 2. All Subjects Section (Continuous Drop-Cap Word Typography) ── */}
      <section aria-label="All Subjects" className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-foreground">All Subjects</h2>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {subjects === undefined ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-md border border-border bg-card p-4 sm:p-4.5 min-h-[105px] flex flex-col justify-between shadow-xs">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-8 w-20 rounded" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
                <Skeleton className="h-3 w-24 rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {sortedSubjects.map((s) => (
              <SubjectCard
                key={s._id}
                id={s._id}
                name={s.name}
                slug={s.slug}
                setCount={setCounts[s._id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 3. Continue Practice Section (Ultra-Minimalist Cards) ── */}
      <section aria-label="Continue Practice">
        <ContinuePracticeCard />
      </section>

      {/* ── 4. Recent Attempts & Syllabus Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <Card className="p-5 border border-border bg-card rounded-md shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="typo-h3 text-foreground">Recent Attempts</h3>
            <Button asChild variant="ghost" size="sm" className="typo-small text-cyan-400 hover:bg-muted/50 border-0 p-0 h-auto">
              <Link href="/history">View History</Link>
            </Button>
          </div>

          {recent === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No tests attempted yet"
              description="Start practicing questions from any Rajasthan GK topic above."
              className="py-4"
            />
          ) : (
            <ul className="space-y-2">
              {recent.slice(0, 4).map((a: any) => (
                <li key={a._id}>
                  <ResultHistoryItem
                    attemptId={a._id}
                    testSetId={a.testSetId}
                    testSetName={a.testSetName}
                    submittedAt={a.submittedAt ?? a.completedAt ?? a._creationTime ?? Date.now()}
                    score={a.score}
                    totalQuestions={a.totalQuestions}
                    answers={a.answers ?? []}
                    correctCount={a.correctCount}
                    accuracy={a.accuracy}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <SyllabusOverviewCard />
        </div>
      </div>
    </div>
  );
}
