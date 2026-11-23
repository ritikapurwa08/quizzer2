"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";
import { ActivityHeader } from "./activity/ActivityHeader";
import { DailyStackedChart, type DailyPoint } from "./activity/DailyStackedChart";
import { RecentTestsBarChart, type RecentAttemptItem } from "./activity/RecentTestsBarChart";

export { type DailyPoint, type RecentAttemptItem };

export interface HourlyPoint {
  hour: number;
  hourLabel: string;
  correct: number;
  incorrect: number;
  total: number;
  tests: number;
}

interface CombinedStudyActivityPanelProps {
  dailyData: DailyPoint[];
  hourlyData?: HourlyPoint[];
  recentAttempts?: RecentAttemptItem[];
  rangeDays: number;
}

const TOTAL_QUESTION_BANK = 11600;

export function CombinedStudyActivityPanel({
  dailyData = [],
  recentAttempts = [],
  rangeDays,
}: CombinedStudyActivityPanelProps) {
  const [viewMode, setViewMode] = useState<"daily" | "recent">("daily");

  // Monotonic Cumulative Questions Mastered computation (never decreases)
  const { cumulativeMastered, totalQuestionsPeriod, totalTestsPeriod, activeDaysCount } = useMemo(() => {
    let mastered = 0;
    let questionsSum = 0;
    let testsSum = 0;
    let activeDays = 0;

    for (const d of dailyData) {
      const correct = d.correct ?? 0;
      mastered += correct;
      questionsSum += (d.count > 0 ? d.count : (correct + (d.incorrect ?? 0)));
      testsSum += (d.tests ?? 0);
      if (d.count > 0 || (d.tests ?? 0) > 0) activeDays += 1;
    }

    return {
      cumulativeMastered: mastered,
      totalQuestionsPeriod: questionsSum,
      totalTestsPeriod: testsSum,
      activeDaysCount: activeDays,
    };
  }, [dailyData]);

  return (
    <Card className="rounded-md border border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Motivational Activity Header ── */}
      <ActivityHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        cumulativeMastered={cumulativeMastered}
        totalQuestionBank={TOTAL_QUESTION_BANK}
        activeDays={activeDaysCount}
        rangeDays={rangeDays}
      />

      {/* ── Chart Content ── */}
      <CardContent className="p-4 sm:p-5 pt-3 pb-2 flex-1 flex flex-col justify-center">
        {viewMode === "daily" ? (
          <DailyStackedChart data={dailyData} rangeDays={rangeDays} />
        ) : (
          <RecentTestsBarChart recentAttempts={recentAttempts} />
        )}
      </CardContent>

      {/* ── Footer ── */}
      <CardFooter className="p-4 sm:p-5 pt-2 pb-3.5 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span>
            {viewMode === "daily"
              ? `${totalQuestionsPeriod} questions solved across ${totalTestsPeriod} test attempts`
              : `${recentAttempts.length} recent tests recorded with score analysis`}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {viewMode === "daily"
            ? rangeDays >= 365
              ? "All Time"
              : `Last ${rangeDays} Days`
            : "Chronological"}
        </span>
      </CardFooter>
    </Card>
  );
}
