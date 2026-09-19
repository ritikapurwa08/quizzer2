"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "convex/react";

import { StatCard } from "@/components/dashboard/StatCard";
import { WeakSubjectsCard } from "@/components/dashboard/WeakSubjectsCard";
import { DailyProgressCard } from "@/components/dashboard/DailyProgressCard";
import { LeaderboardCard } from "@/components/shared/LeaderboardCard";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle2, ListChecks, Percent, Bookmark, History, ArrowRight, BookOpen } from "lucide-react";
import { formatAccuracy, getSubjectDisplayName } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

// Lazy-load Recharts radar chart to keep it out of the initial JS bundle
const PerformanceRadarChart = dynamic(
  () => import("@/components/dashboard/PerformanceRadarChart").then((m) => ({ default: m.PerformanceRadarChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[350px] w-full rounded-xl" />,
  }
);

export default function DashboardPage() {
  const stats = useQuery(api.analytics.dashboardStats, {});
  const recent = useQuery(api.attempts.recentByUser, { limit: 5 });
  const subjects = useQuery(api.subjects.list);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
            विषय चुनें और परीक्षा-उपयोगी अभ्यास प्रश्न-सेट हल करें।
          </p>
        </div>
        <Button asChild className="rounded-xl font-hindi shrink-0 shadow-xs h-9 px-4 text-xs sm:text-sm">
          <Link href="/subjects" className="inline-flex items-center gap-1.5">
            सभी विषय देखें <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* 1. Subjects Grid (Primary Study Entry) — 1-col mobile, 2-col sm, 3-col desktop */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 font-hindi">
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
            title="कोई विषय उपलब्ध नहीं है"
            description="वर्तमान में कोई विषय नहीं मिला।"
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
          <StatCard icon={ListChecks} label="दिए गए टेस्ट" value={stats.testsAttempted} />
          <StatCard icon={CheckCircle2} label="हल किए प्रश्न" value={stats.questionsSolved} />
          <StatCard icon={Percent} label="सटीकता" value={formatAccuracy(stats.overallAccuracy)} />
          <StatCard icon={Bookmark} label="बुकमार्क" value={stats.bookmarkCount} />
        </div>
      )}

      {/* 3. Performance Analytics — Weak Areas, Skill Radar & Daily Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats && <WeakSubjectsCard subjects={stats.weakSubjects} />}
        {stats && (
          <PerformanceRadarChart
            data={
              stats.subjectAccuracy && stats.subjectAccuracy.length >= 3
                ? stats.subjectAccuracy.map((ws: { name: string; accuracy: number }) => ({
                  subject: ws.name,
                  score: ws.accuracy,
                }))
                : undefined
            }
            averageScore={Math.round(stats.overallAccuracy)}
          />
        )}
        {stats && (
          <div className="md:col-span-2 lg:col-span-1">
            <DailyProgressCard data={stats.dailyProgress} subjects={subjects ?? []} />
          </div>
        )}
      </div>

      {/* 4. Leaderboard */}
      {subjects && subjects.length > 0 && <LeaderboardCard subjects={subjects} />}

      {/* Recent Test Attempts */}
      <Card className="p-4 sm:p-5 rounded-xl border border-border shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 font-hindi">
            <History className="h-4 w-4 text-foreground" />
            हाल के टेस्ट (Recent Attempts)
          </h2>
          <Link
            href="/history"
            className="text-xs font-semibold text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1 font-hindi"
          >
            सभी इतिहास <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recent && recent.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title="अभी तक कोई टेस्ट नहीं दिया गया"
            description="अपनी तैयारी जांचने के लिए ऊपर दिए गए किसी भी विषय से टेस्ट हल करना शुरू करें।"
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
