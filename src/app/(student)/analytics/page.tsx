"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { AnalyticsHeader, type RangeDays } from "@/components/analytics/AnalyticsHeader";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";

// Dynamic client-only imports for Recharts to prevent SSR hydration mismatches
const DailyStudyActivityChart = dynamic(
  () =>
    import("@/components/analytics/DailyStudyActivityChart").then(
      (m) => ({ default: m.DailyStudyActivityChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[360px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
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

const AnswerAccuracyPieChart = dynamic(
  () =>
    import("@/components/analytics/AnswerAccuracyPieChart").then(
      (m) => ({ default: m.AnswerAccuracyPieChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[340px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const RecentTestStackedBarChart = dynamic(
  () =>
    import("@/components/analytics/RecentTestStackedBarChart").then(
      (m) => ({ default: m.RecentTestStackedBarChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[340px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const MasteryRadialGaugeChart = dynamic(
  () =>
    import("@/components/analytics/MasteryRadialGaugeChart").then(
      (m) => ({ default: m.MasteryRadialGaugeChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[340px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const RecentTestPerformanceChart = dynamic(
  () =>
    import("@/components/analytics/RecentTestPerformanceChart").then(
      (m) => ({ default: m.RecentTestPerformanceChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[340px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
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

      {/* 2. Top Tier: Study Activity & Subject Accuracy & Mastery (Shadcn Custom-Label Bar / Radial) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <DailyStudyActivityChart
          data={stats.dailyProgress || []}
          hourlyData={stats.hourlyActivity || []}
          rangeDays={rangeDays}
        />
        <SubjectAccuracyChart
          data={stats.subjectAccuracy || []}
          strongest={stats.insights?.strongestSubject}
          weakest={stats.insights?.weakestSubject}
        />
      </div>

      {/* 3. Middle Tier: Answer Accuracy Distribution & Recent Test Outcomes (Pie with Labels + Stacked Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <AnswerAccuracyPieChart data={stats.answerBreakdown} />
        <RecentTestStackedBarChart data={stats.recentAttempts || []} />
      </div>

      {/* 4. Bottom Tier: Syllabus Mastery Index (Radial Gauge) & Recent Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <MasteryRadialGaugeChart
          accuracy={stats.overallAccuracy}
          totalAnswered={stats.questionsSolved}
          totalCorrect={stats.answerBreakdown?.correct ?? 0}
          targetBenchmark={75}
        />
        <RecentTestPerformanceChart
          data={stats.recentAttempts || []}
        />
      </div>
    </div>
  );
}
