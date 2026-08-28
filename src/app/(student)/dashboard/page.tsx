"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { StatCard } from "@/components/dashboard/StatCard";
import { WeakSubjectsCard } from "@/components/dashboard/WeakSubjectsCard";
import { DailyProgressCard } from "@/components/dashboard/DailyProgressCard";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, ListChecks, Percent, Bookmark, History, ArrowRight, BookOpen } from "lucide-react";
import { formatAccuracy, formatScore, cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const stats = useQuery(api.analytics.dashboardStats);
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list) ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            पाठ्यक्रम अभ्यास
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            विषय चुनें और अभ्यास प्रश्न-सेट हल करें।
          </p>
        </div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit shadow-sm shrink-0"
        >
          View All Subjects <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stat cards — 1-col on tiny mobile, 2-col on sm, 4-col on lg desktop */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard icon={ListChecks} label="Tests Attempted" value={stats.testsAttempted} />
          <StatCard icon={CheckCircle2} label="Questions Solved" value={stats.questionsSolved} />
          <StatCard icon={Percent} label="Accuracy" value={formatAccuracy(stats.overallAccuracy)} />
          <StatCard icon={Bookmark} label="Bookmarks" value={stats.bookmarkCount} />
        </div>
      )}

      {/* Fixed Subjects — 1-col mobile, 2-col sm, 3-col desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            पाठ्यक्रम के विषय
            <span className="font-semibold text-foreground tabular-nums">({subjects.length})</span>
          </h2>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Syllabus initializing..."
            description="Run the database seed to load all fixed subjects and topics."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {subjects.map((s) => (
              <Link key={s._id} href={`/subjects/${s._id}`}>
                <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group min-h-[3.5rem] rounded-xl select-none">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                      {s.order + 1}
                    </span>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {s.nameHindi || s.name}
                    </h3>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Weak Subjects & Daily Progress — stacked on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stats && <WeakSubjectsCard subjects={stats.weakSubjects} />}
        {stats && <DailyProgressCard data={stats.dailyProgress} />}
      </div>

      {/* Recent Test Attempts */}
      <Card className="p-4 sm:p-5 rounded-xl border border-border shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Recent Test Attempts
          </h2>
        </div>
        {recent && recent.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="No tests attempted yet"
            description="Select any subject above to attempt your first practice test set."
            className="py-4"
          />
        )}
        {recent && recent.length > 0 && (
          <ul className="space-y-2">
            {recent.map((a: any) => {
              const correctCount = a.answers?.filter((ans: any) => ans.isCorrect).length ?? 0;
              const accuracy = a.totalQuestions > 0 ? (correctCount / a.totalQuestions) * 100 : 0;
              const isPassed = accuracy >= 60;

              return (
                <li
                  key={a._id}
                  className="flex items-center justify-between text-sm py-2.5 px-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        isPassed ? "bg-success" : "bg-destructive"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate text-foreground">
                        {a.testSetName || "Practice Set"}
                        {a.subjectName && (
                          <span className="font-normal text-muted-foreground ml-1.5">
                            {a.subjectName}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(a.submittedAt ?? 0).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        isPassed
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {accuracy.toFixed(0)}%
                    </span>
                    <span className="font-semibold text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground tabular-nums">
                      {formatScore(a.score ?? 0)} / {a.totalQuestions * 2}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
