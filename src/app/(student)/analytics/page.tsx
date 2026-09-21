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

const RecentTestPerformanceChart = dynamic(
  () =>
    import("@/components/analytics/RecentTestPerformanceChart").then(
      (m) => ({ default: m.RecentTestPerformanceChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[360px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
  }
);

const AnswerAccuracyChart = dynamic(
  () =>
    import("@/components/analytics/AnswerAccuracyChart").then(
      (m) => ({ default: m.AnswerAccuracyChart })
    ),
  {
    ssr: false,
    loading: () => <div className="h-[360px] rounded-2xl bg-card border border-border/60 animate-pulse" />,
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

      {/* 2. Responsive 2 × 2 Desktop / 1 × 4 Mobile Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* CHART 1 — Daily Study Activity (Area / Line / Hourly) */}
        <DailyStudyActivityChart
          data={stats.dailyProgress || []}
          hourlyData={stats.hourlyActivity || []}
          rangeDays={rangeDays}
        />

        {/* CHART 2 — Subject Accuracy (Radar / Bar) */}
        <SubjectAccuracyChart
          data={stats.subjectAccuracy || []}
          strongest={stats.insights?.strongestSubject}
          weakest={stats.insights?.weakestSubject}
        />

        {/* CHART 3 — Recent Test Performance (Vertical Bar) */}
        <RecentTestPerformanceChart
          data={stats.recentAttempts || []}
        />

        {/* CHART 4 — Answer Accuracy Breakdown (Donut) */}
        <AnswerAccuracyChart
          data={stats.answerBreakdown}
        />
      </div>
    </div>
  );
}
