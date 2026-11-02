"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AnalyticsHeader, type RangeDays } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";

// Dynamic client-only imports for Recharts to prevent SSR hydration mismatches
const AnswerAccuracyPieChart = dynamic(
  () =>
    import("@/components/analytics/AnswerAccuracyPieChart").then(
      (m) => ({ default: m.AnswerAccuracyPieChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-90 rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const CombinedStudyActivityPanel = dynamic(
  () =>
    import("@/components/analytics/CombinedStudyActivityPanel").then(
      (m) => ({ default: m.CombinedStudyActivityPanel })
    ),
  {
    ssr: false,
    loading: () => <div className="h-90 rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const SubjectAccuracyChart = dynamic(
  () =>
    import("@/components/analytics/SubjectAccuracyChart").then(
      (m) => ({ default: m.SubjectAccuracyChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[360px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const MasteryRadialGaugeChart = dynamic(
  () =>
    import("@/components/analytics/MasteryRadialGaugeChart").then(
      (m) => ({ default: m.MasteryRadialGaugeChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-90 rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

export default function AnalyticsPage() {
  const [rangeDays, setRangeDays] = useState<RangeDays>(15);

  // Derive client's actual timezone offset in minutes so calendar days match local time
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  const stats = useQuery(api.analytics.dashboardStats, {
    rangeDays,
    timezoneOffset,
  });

  if (stats === undefined) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs & Segmented Date Range Selector */}
      <AnalyticsHeader rangeDays={rangeDays} onRangeChange={setRangeDays} />

      {/* 2. Top Row: Answer Distribution (Pie) & Study Activity / Recent Tests (Combined Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <AnswerAccuracyPieChart data={stats.answerBreakdown} />
        <CombinedStudyActivityPanel
          dailyData={stats.dailyProgress || []}
          hourlyData={stats.hourlyActivity || []}
          recentAttempts={stats.recentAttempts || []}
          rangeDays={rangeDays}
        />
      </div>

      {/* 3. Bottom Row: Subject Mastery (Horizontal Bar) & Exam Mastery Gauge (Radial) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <SubjectAccuracyChart
          data={stats.subjectAccuracy || []}
          strongest={stats.insights?.strongestSubject}
          weakest={stats.insights?.weakestSubject}
        />
        <MasteryRadialGaugeChart
          accuracy={stats.overallAccuracy}
          totalAnswered={stats.questionsSolved}
          totalCorrect={stats.answerBreakdown?.correct ?? 0}
          targetBenchmark={75}
        />
      </div>
    </div>
  );
}
