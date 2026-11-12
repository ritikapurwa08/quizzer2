"use client";

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
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAccuracy, getSubjectDisplayName } from "@/lib/utils";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";
import { api } from "../../../../convex/_generated/api";
import { ContinuePracticeCard } from "@/components/dashboard/ContinuePracticeCard";
import { SyllabusOverviewCard } from "@/components/dashboard/SyllabusOverviewCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { EmptyState } from "@/components/shared/EmptyState";

export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 4 });
  const subjects = useQuery(api.subjects.list);
  const setCounts = useQuery(api.subjects.setCountsAllSubjects) ?? {};
  const siteStats = useQuery(api.testSets.siteStats);
  const { theme, setTheme } = useTheme();

  const displayName = me?.name ? me.name.split(" ")[0] : "Student";

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      {/* ── Top Row & Quick Metrics Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="typo-h1 text-foreground">
              Welcome back, {displayName}
            </h1>
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
          </div>
          <p className="typo-small text-muted-foreground mt-0.5">
            Your personalized RPSC 2nd Grade GK exam revision &amp; practice command center.
          </p>
        </div>

        {/* Right side: Streak Badge + Light/Dark Theme Toggle */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 shadow-2xs typo-small font-bold">
            <Flame className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>3-Day Streak</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-md bg-card text-muted-foreground hover:text-foreground border border-border shadow-xs cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
          </Button>
        </div>
      </div>

      {/* ── 4 Stat Cards: Desktop 4-col / Mobile 2x2 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-4 sm:p-5 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Questions Solved</span>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
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

        <Card className="p-4 sm:p-5 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Accuracy %</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
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

        <Card className="p-4 sm:p-5 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Saved Items</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
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

        <Card className="p-4 sm:p-5 rounded-2xl border-0 bg-card shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="typo-small text-muted-foreground">Active Streak</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="typo-display text-foreground block">
              3 <span className="typo-h3 font-medium text-muted-foreground">Days</span>
            </span>
            <span className="text-[11px] text-muted-foreground">Daily practice consistency</span>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1: ALL SUBJECTS (FIRST — MATCHING SUBJECTS PAGE CARD STYLE)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="All Subjects" className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">All Subjects</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {siteStats ? (
                <span>
                  <strong className="text-foreground font-semibold">{siteStats.totalSets}</strong> Practice Sets • <strong className="text-foreground font-semibold">{siteStats.totalQuestions.toLocaleString("en-IN")}</strong> Total Questions
                </span>
              ) : (
                <span>435 Practice Sets • Total Questions</span>
              )}
            </p>
          </div>
          <Link
            href="/subjects"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {subjects === undefined ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-3 sm:p-3.5 rounded-2xl border-0 bg-card shadow-xs space-y-2">
                <Skeleton className="h-6.5 w-6.5 rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
            {subjects.map((s) => {
              const setCount = setCounts[s._id] ?? 0;
              const SectionIcon = getSubjectSectionIcon(s.slug || s.name);
              return (
                <Link key={s._id} href={`/subjects/${s._id}`} className="block focus-visible:outline-hidden group h-full">
                  <Card className="p-3 sm:p-3.5 rounded-2xl border-0 bg-card hover:bg-muted/30 transition-all flex flex-col justify-between gap-2.5 h-full relative select-none shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                        <SectionIcon className="h-3.5 w-3.5" />
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-medium text-xs sm:text-[13.5px] leading-snug text-foreground group-hover:text-primary transition-colors font-hindi line-clamp-2">
                        {getSubjectDisplayName(s)}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {setCount === 0 ? "No sets yet" : `${setCount} Practice Sets`}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: CONTINUE PRACTICE (SECOND)
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Continue Practice">
        <ContinuePracticeCard />
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: RECENT ATTEMPTS & SYLLABUS OVERVIEW (THIRD)
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <Card className="p-5 border-0 bg-card shadow-xs rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="typo-h3 text-foreground">Recent Attempts</h3>
            <Button asChild variant="ghost" size="sm" className="typo-small text-primary hover:bg-muted border-0 p-0 h-auto">
              <Link href="/history">View History</Link>
            </Button>
          </div>

          {recent === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
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
