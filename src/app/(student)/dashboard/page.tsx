"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { StatCard } from "@/components/dashboard/StatCard";
import { WeakSubjectsCard } from "@/components/dashboard/WeakSubjectsCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, ListChecks, Percent, Bookmark, History, ArrowRight, BookOpen } from "lucide-react";
import { formatAccuracy, getSubjectDisplayName } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select a subject and solve exam-oriented practice test sets.
          </p>
        </div>
        <Button asChild className="rounded-xl shrink-0 shadow-xs h-9 px-4 text-xs sm:text-sm font-semibold">
          <Link href="/subjects" className="inline-flex items-center gap-1.5">
            View All Subjects <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* 1. Subjects Grid (Primary Study Entry) — 1-col mobile, 2-col sm, 3-col desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-foreground" />
            Subjects
            {subjects !== undefined && (
              <span className="font-bold text-foreground tabular-nums">({subjects.length})</span>
            )}
          </h2>
        </div>

        {subjects === undefined ? (
          /* Exactly 12 subject-card skeleton placeholders matching real dimensions */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card min-h-[3.5rem] rounded-xl animate-pulse"
              >
                <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground/50 text-xs font-bold shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="h-4 w-32 sm:w-40 rounded bg-muted" />
                </div>
                <div className="h-4 w-4 rounded-full bg-muted shrink-0 ml-2" />
              </div>
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects available"
            description="No subjects have been created yet."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {subjects.map((s, idx) => (
              <Link key={s._id} href={`/subjects/${s._id}`}>
                <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all group min-h-[3.5rem] rounded-xl select-none">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground text-xs font-bold shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors duration-200">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground transition-colors truncate font-hindi">
                      {getSubjectDisplayName(s)}
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 2. Supporting Stat Cards — Compact 2-col on mobile, 4-col on desktop */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard icon={ListChecks} label="Tests Taken" value={stats.testsAttempted} />
          <StatCard icon={CheckCircle2} label="Questions Solved" value={stats.questionsSolved} />
          <StatCard icon={Percent} label="Accuracy" value={formatAccuracy(stats.overallAccuracy)} />
          <StatCard icon={Bookmark} label="Bookmarks" value={stats.bookmarkCount} />
        </div>
      )}

      {/* 3. Expanded Full-Width Weak Areas & Subject Mastery Diagnosis */}
      {stats && (
        <WeakSubjectsCard
          breakdown={stats.subjectBreakdown}
          subjects={stats.weakSubjects}
        />
      )}

      {/* 4. Recent Test Attempts */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-foreground" />
            Recent Attempts
          </h2>
          <Link
            href="/history"
            className="text-xs font-semibold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1"
          >
            View All History <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recent && recent.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="No tests attempted yet"
            description="Start practicing test sets from any subject above to evaluate your preparation."
            className="py-4"
          />
        )}
        {recent && recent.length > 0 && (
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
    </div>
  );
}
