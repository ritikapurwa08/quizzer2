"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { StatCard } from "@/components/dashboard/StatCard";
import { WeakSubjectsCard } from "@/components/dashboard/WeakSubjectsCard";
import { DailyProgressCard } from "@/components/dashboard/DailyProgressCard";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, ListChecks, Percent, Bookmark, History, ArrowRight, BookOpen, Layers } from "lucide-react";
import { formatAccuracy, cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const stats = useQuery(api.analytics.dashboardStats);
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Syllabus Revision Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Select a subject to practice predefined topics and test sets.
          </p>
        </div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
        >
          View All Subjects <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <StatCard icon={ListChecks} label="Tests Attempted" value={stats.testsAttempted} />
          <StatCard icon={CheckCircle2} label="Questions Solved" value={stats.questionsSolved} />
          <StatCard icon={Percent} label="Accuracy" value={formatAccuracy(stats.overallAccuracy)} />
          <StatCard icon={Bookmark} label="Bookmarks" value={stats.bookmarkCount} />
        </div>
      )}

      {/* Fixed Subjects Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <BookOpen className="h-4 sm:h-5 w-4 sm:w-5 text-primary" /> Fixed Syllabus Subjects
          </h2>
          <span className="text-xs text-muted-foreground font-medium">{subjects.length} Subjects</span>
        </div>

        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Syllabus initializing..."
            description="Run the database seed to load all fixed subjects and topics."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {subjects.map((s) => (
              <Link key={s._id} href={`/subjects/${s._id}`}>
                <Card className="h-full p-3.5 hover:border-primary hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Subject {s.order + 1}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <h3 className="font-bold text-base group-hover:text-primary transition-colors leading-snug">
                      {s.name}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-muted-foreground mt-3 pt-2 border-t border-border">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    <span>Fixed Syllabus Topics</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3.5">
        {stats && <WeakSubjectsCard subjects={stats.weakSubjects} />}
        {stats && <DailyProgressCard data={stats.dailyProgress} />}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-sm flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Recent Test Attempts
          </p>
        </div>
        {recent && recent.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="No tests attempted yet"
            description="Select any subject above to attempt your first practice test set."
          />
        )}
        {recent && recent.length > 0 && (
          <ul className="space-y-2">
            {recent.map((a: any) => {
              const accuracy = a.totalQuestions > 0 ? ((a.answers?.filter((ans: any) => ans.isCorrect).length ?? 0) / a.totalQuestions) * 100 : 0;
              const isPassed = accuracy >= 60;

              return (
                <li key={a._id} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg border border-border bg-card/60 hover:bg-card transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", isPassed ? "bg-success" : "bg-destructive")} />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate text-foreground">
                        {a.testSetName || "Practice Set"}
                        <span className="font-normal text-muted-foreground ml-1">({a.subjectName || "General"})</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{new Date(a.submittedAt ?? 0).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {accuracy.toFixed(0)}%
                    </span>
                    <span className="font-semibold text-xs px-2.5 py-1 rounded-md bg-muted">
                      {a.score} / {a.totalQuestions}
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
