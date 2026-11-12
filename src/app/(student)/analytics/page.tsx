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
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);

  // Derive client's actual timezone offset in minutes so calendar days match local time
  const timezoneOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  const stats = useQuery(api.analytics.dashboardStats, {
    rangeDays,
    timezoneOffset,
  });

  const isPreview = typeof window !== "undefined" && window.location.search.includes("preview=true");

  const previewSubjectAccuracy = useMemo(() => {
    if (!isPreview) return stats?.subjectAccuracy || [];
    if (stats?.subjectAccuracy && stats.subjectAccuracy.length > 0) return stats.subjectAccuracy;
    return [
      { name: "राजस्थान कला एवं संस्कृति", nameHindi: "राजस्थान कला एवं संस्कृति", accuracy: 83, correct: 250, attempted: 300 },
      { name: "राजस्थान सामान्य ज्ञान एवं भूगोल", nameHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", accuracy: 82, correct: 320, attempted: 390 },
      { name: "राजस्थान का इतिहास", nameHindi: "राजस्थान का इतिहास", accuracy: 81, correct: 180, attempted: 222 },
      { name: "राजस्थान राजव्यवस्था एवं प्रशासन", nameHindi: "राजस्थान राजव्यवस्था एवं प्रशासन", accuracy: 76, correct: 114, attempted: 150 },
      { name: "English (Paper-II)", nameHindi: "English (Paper-II)", accuracy: 76, correct: 152, attempted: 200 },
    ];
  }, [isPreview, stats?.subjectAccuracy]);

  const effectiveStats = useMemo(() => {
    if (stats !== undefined) return stats;
    if (isPreview) {
      return {
        testsAttempted: 135,
        questionsSolved: 2564,
        overallAccuracy: 77,
        bookmarkCount: 42,
        wrongQuestionCount: 598,
        dailyProgress: [
          { day: "2026-10-14", count: 40, tests: 2, bySubject: {} },
          { day: "2026-10-17", count: 15, tests: 1, bySubject: {} },
          { day: "2026-10-20", count: 20, tests: 1, bySubject: {} },
          { day: "2026-10-23", count: 205, tests: 10, bySubject: {} },
          { day: "2026-10-26", count: 75, tests: 4, bySubject: {} },
          { day: "2026-10-29", count: 120, tests: 6, bySubject: {} },
          { day: "2026-11-01", count: 225, tests: 12, bySubject: {} },
          { day: "2026-11-03", count: 80, tests: 4, bySubject: {} },
          { day: "2026-11-06", count: 260, tests: 14, bySubject: {} },
          { day: "2026-11-09", count: 300, tests: 15, bySubject: {} },
          { day: "2026-11-12", count: 190, tests: 9, bySubject: {} },
        ],
        hourlyActivity: [],
        subjectBreakdown: [],
        weakSubjects: [],
        subjectAccuracy: previewSubjectAccuracy,
        answerBreakdown: {
          correct: 1966,
          incorrect: 598,
          unanswered: 80,
          totalQuestions: 2644,
          answeredCount: 2564,
          accuracy: 77,
        },
        recentAttempts: [],
        insights: {
          strongestSubject: { name: "राजस्थान कला एवं संस्कृति", nameHindi: "राजस्थान कला एवं संस्कृति", accuracy: 83 },
          weakestSubject: { name: "English (Paper-II)", nameHindi: "English (Paper-II)", accuracy: 76 },
          activeDays: 18,
          totalPeriodQuestions: 2564,
          totalPeriodTests: 135,
        },
      };
    }
    return undefined;
  }, [stats, isPreview, previewSubjectAccuracy]);

  if (effectiveStats === undefined) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs & Segmented Date Range Selector */}
      <AnalyticsHeader rangeDays={rangeDays} onRangeChange={setRangeDays} />

      {/* 2. Top Row: Answer Distribution (Pie) & Study Activity / Recent Tests (Combined Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <AnswerAccuracyPieChart data={effectiveStats.answerBreakdown} />
        <CombinedStudyActivityPanel
          dailyData={effectiveStats.dailyProgress || []}
          hourlyData={effectiveStats.hourlyActivity || []}
          recentAttempts={effectiveStats.recentAttempts || []}
          rangeDays={rangeDays}
        />
      </div>

      {/* 3. Bottom Row: Subject Mastery (Horizontal Bar) & Exam Mastery Gauge (Radial) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <SubjectAccuracyChart
          data={previewSubjectAccuracy}
          strongest={effectiveStats.insights?.strongestSubject}
          weakest={effectiveStats.insights?.weakestSubject}
        />
        <MasteryRadialGaugeChart
          accuracy={effectiveStats.overallAccuracy}
          totalAnswered={effectiveStats.questionsSolved}
          totalCorrect={effectiveStats.answerBreakdown?.correct ?? 0}
          targetBenchmark={75}
        />
      </div>
    </div>
  );
}
