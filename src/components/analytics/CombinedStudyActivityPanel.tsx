"use client";

import { useId, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Flame, CalendarCheck, Clock, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyPoint {
  day: string; // "YYYY-MM-DD"
  count: number;
  tests: number;
}

export interface HourlyPoint {
  hour: number;
  hourLabel: string;
  correct: number;
  incorrect: number;
  total: number;
  tests: number;
}

export interface RecentAttemptItem {
  attemptId: string;
  testSetId: string;
  testSetName: string;
  score: number;
  maxScore: number;
  scorePercent: number; // 0-100
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  submittedAt?: number;
}

interface CombinedStudyActivityPanelProps {
  dailyData: DailyPoint[];
  hourlyData?: HourlyPoint[];
  recentAttempts?: RecentAttemptItem[];
  rangeDays: number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatDisplayDate(isoDate: string): string {
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthName = MONTH_NAMES[month] ?? `${month + 1}`;
      return `${day} ${monthName}`;
    }
  } catch {
    // fallback
  }
  return isoDate.slice(5);
}

const dailyChartConfig = {
  count: {
    label: "Questions Solved",
    color: "var(--color-chart-1)",
  },
  tests: {
    label: "Tests Completed",
    color: "var(--color-chart-2)",
  },
} satisfies ChartConfig;

const hourlyChartConfig = {
  correct: {
    label: "Correct",
    color: "var(--color-chart-2)",
  },
  incorrect: {
    label: "Incorrect",
    color: "var(--color-destructive)",
  },
} satisfies ChartConfig;

const recentChartConfig = {
  correct: {
    label: "Correct",
    color: "var(--color-chart-2)",
  },
  incorrect: {
    label: "Incorrect",
    color: "var(--color-destructive)",
  },
  unanswered: {
    label: "Skipped",
    color: "var(--color-muted-foreground)",
  },
} satisfies ChartConfig;

export function CombinedStudyActivityPanel({
  dailyData,
  hourlyData = [],
  recentAttempts = [],
  rangeDays,
}: CombinedStudyActivityPanelProps) {
  const gradientId = useId();
  const [viewMode, setViewMode] = useState<"daily" | "hourly" | "recent">("daily");

  const { totalQuestions, totalTests, activeDays, formattedDaily } = useMemo(() => {
    let qSum = 0;
    let tSum = 0;
    let act = 0;
    const formatted = [];

    for (const d of dailyData) {
      qSum += d.count;
      tSum += d.tests;
      if (d.count > 0 || d.tests > 0) act += 1;
      formatted.push({
        ...d,
        displayDate: formatDisplayDate(d.day),
      });
    }

    return {
      totalQuestions: qSum,
      totalTests: tSum,
      activeDays: act,
      formattedDaily: formatted,
    };
  }, [dailyData]);

  const recentChartData = useMemo(() => {
    if (!recentAttempts || recentAttempts.length === 0) return [];
    return recentAttempts.slice(-8).map((item, idx) => {
      const match = item.testSetName.match(/(?:Set|सेट|Part|भाग)\s*[-–—:]*\s*(\d+)/i);
      const label = match ? `Set ${match[1]}` : `Test ${idx + 1}`;

      return {
        test: label,
        fullName: item.testSetName,
        correct: item.correctCount,
        incorrect: item.incorrectCount,
        unanswered: item.unansweredCount,
        total: item.totalQuestions,
        scorePercent: item.scorePercent,
      };
    });
  }, [recentAttempts]);

  return (
    <Card className="rounded-md border border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Card Header ── */}
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary shrink-0" />
              <span>Study &amp; Consistency</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "daily" && `${activeDays} active study days across last ${rangeDays} days`}
              {viewMode === "hourly" && "24-Hour peak study pattern & test submission frequency"}
              {viewMode === "recent" && "Question breakdown across recent test attempts"}
            </CardDescription>
          </div>

          {/* Unified 3-Mode Segmented Control */}
          <div className="inline-flex items-center p-0.5 rounded-md bg-secondary border border-border self-start sm:self-auto gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode("daily")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap border select-none",
                viewMode === "daily"
                  ? "bg-card text-foreground font-bold shadow-2xs border-border"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
              )}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setViewMode("hourly")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap border select-none",
                viewMode === "hourly"
                  ? "bg-card text-foreground font-bold shadow-2xs border-border"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
              )}
            >
              Hourly
            </button>
            <button
              type="button"
              onClick={() => setViewMode("recent")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap border select-none",
                viewMode === "recent"
                  ? "bg-card text-foreground font-bold shadow-2xs border-border"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
              )}
            >
              Recent Tests
            </button>
          </div>
        </div>
      </CardHeader>

      {/* ── Card Content ── */}
      <CardContent className="p-4 sm:p-5 pt-1 pb-2 flex-1 flex flex-col justify-center">
        {viewMode === "daily" ? (
          /* Daily Area Chart */
          <ChartContainer config={dailyChartConfig} className="min-h-[220px] w-full">
            <AreaChart data={formattedDaily} margin={{ left: -16, right: 8, top: 12, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[11px] font-medium"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-[11px]"
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-foreground">{item.payload.day}</p>
                        <p className="text-muted-foreground">
                          Questions: <strong className="text-foreground">{item.payload.count}</strong>
                        </p>
                        <p className="text-muted-foreground">
                          Tests: <strong className="text-foreground">{item.payload.tests}</strong>
                        </p>
                      </div>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ChartContainer>
        ) : viewMode === "hourly" ? (
          /* Hourly Bar Chart */
          <ChartContainer config={hourlyChartConfig} className="min-h-[220px] w-full">
            <BarChart data={hourlyData} margin={{ left: -16, right: 8, top: 12, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="hourLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-[10px]"
                interval={2}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-[11px]"
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name, item) => (
                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-foreground">{item.payload.hourLabel}</p>
                        <p className="text-emerald-500 font-semibold">
                          Correct: {item.payload.correct}
                        </p>
                        <p className="text-rose-500 font-semibold">
                          Incorrect: {item.payload.incorrect}
                        </p>
                        <p className="text-muted-foreground">
                          Tests Submitted: {item.payload.tests}
                        </p>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="correct" stackId="hour" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="incorrect" stackId="hour" fill="var(--color-destructive)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          /* Recent Test Stacked Bar Chart */
          recentChartData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
              No recent test attempts recorded
            </div>
          ) : (
            <ChartContainer config={recentChartConfig} className="min-h-[220px] w-full">
              <BarChart data={recentChartData} margin={{ left: -16, right: 8, top: 12, bottom: 4 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="test"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-xs font-medium"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(val, name, item) => (
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-foreground">{item.payload.fullName}</p>
                          <p className="text-emerald-500 font-medium">✓ Correct: {item.payload.correct}</p>
                          <p className="text-rose-500 font-medium">✕ Incorrect: {item.payload.incorrect}</p>
                          <p className="text-muted-foreground">○ Skipped: {item.payload.unanswered}</p>
                          <p className="text-foreground font-bold pt-0.5 border-t border-border/50">
                            Score: {item.payload.scorePercent}%
                          </p>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="correct" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="incorrect" stackId="a" fill="var(--color-destructive)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="unanswered" stackId="a" fill="var(--color-muted)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )
        )}
      </CardContent>

      {/* ── Card Footer ── */}
      <CardFooter className="p-4 sm:p-5 pt-2 pb-3.5 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CalendarCheck className="h-4 w-4 text-primary" />
          <span>
            {viewMode !== "recent"
              ? `${totalQuestions} questions solved across ${totalTests} test attempts`
              : `${recentAttempts.length} recent tests recorded with score analysis`}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {viewMode !== "recent" ? `Last ${rangeDays} Days` : "Chronological"}
        </span>
      </CardFooter>
    </Card>
  );
}

