"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Flame,
  CalendarCheck,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DailyPoint {
  day: string; // "YYYY-MM-DD"
  count: number;
  tests: number;
  correct?: number;
  incorrect?: number;
  unanswered?: number;
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

const momentumChartConfig = {
  correctPct: {
    label: "Correct (%)",
    color: "#10b981",
  },
  incorrectPct: {
    label: "Incorrect (%)",
    color: "#ef4444",
  },
  skippedPct: {
    label: "Skipped (%)",
    color: "#38bdf8",
  },
  netScorePct: {
    label: "Net Score (%)",
    color: "#3b82f6",
  },
  tests: {
    label: "Daily Tests",
    color: "var(--color-primary)",
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

function DailyMomentumTooltip({ active, payload, thirdMetric }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-3 text-xs shadow-xl min-w-[210px] space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <span className="font-bold text-foreground text-xs">{data.displayDate}</span>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          {data.tests} {data.tests === 1 ? "test taken" : "tests taken"}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-emerald-500 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Correct:
          </span>
          <strong className="text-foreground font-semibold">
            {data.correctPct}% ({data.correct} Qs)
          </strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-rose-500 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Incorrect:
          </span>
          <strong className="text-foreground font-semibold">
            {data.incorrectPct}% ({data.incorrect} Qs)
          </strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sky-500 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {thirdMetric === "skipped" ? "Skipped:" : "Net Score (1/3 Neg):"}
          </span>
          <strong className="text-foreground font-semibold">
            {thirdMetric === "skipped"
              ? `${data.skippedPct}% (${data.unanswered} Qs)`
              : `${data.netScorePct}%`}
          </strong>
        </div>
      </div>
      <div className="pt-1.5 border-t border-border/50 text-[10.5px] flex items-center justify-between text-muted-foreground">
        <span>Questions Solved:</span>
        <strong className="text-foreground font-medium">{data.totalQuestions} Qs</strong>
      </div>
    </div>
  );
}

export function CombinedStudyActivityPanel({
  dailyData,
  recentAttempts = [],
  rangeDays,
}: CombinedStudyActivityPanelProps) {
  const [viewMode, setViewMode] = useState<"daily" | "recent">("daily");
  const [thirdMetric, setThirdMetric] = useState<"skipped" | "netScore">("skipped");

  const { chartPoints, totalQuestions, totalTests, activeDays, maxDailyTests, momentumStats } = useMemo(() => {
    let qSum = 0;
    let tSum = 0;
    let act = 0;
    let maxTests = 1;
    const active: Array<{
      day: string;
      displayDate: string;
      tests: number;
      totalQuestions: number;
      correct: number;
      incorrect: number;
      unanswered: number;
      correctPct: number;
      incorrectPct: number;
      skippedPct: number;
      netScorePct: number;
    }> = [];

    for (const d of dailyData) {
      const tests = d.tests ?? 0;
      const correct = d.correct ?? 0;
      const incorrect = d.incorrect ?? 0;
      const unanswered = d.unanswered ?? 0;
      const answered = correct + incorrect;

      // Filter out abandoned / 0-answered test sessions so accuracy does not falsely crash to 0%!
      if (answered === 0) {
        continue;
      }

      let totalQ = correct + incorrect + unanswered;
      if (totalQ === 0 && d.count > 0) totalQ = d.count;
      if (totalQ === 0 && tests > 0) totalQ = tests * 20;

      qSum += (d.count > 0 ? d.count : totalQ);
      tSum += tests;
      act += 1;
      if (tests > maxTests) maxTests = tests;

      const correctPct = totalQ > 0 ? Number(((correct / totalQ) * 100).toFixed(1)) : 0;
      const incorrectPct = totalQ > 0 ? Number(((incorrect / totalQ) * 100).toFixed(1)) : 0;
      const skippedPct = totalQ > 0 ? Number(((unanswered / totalQ) * 100).toFixed(1)) : 0;
      // Standard RPSC 1/3 negative marking: (correct - (incorrect / 3)) / totalQ * 100
      const rawNet = ((correct - (incorrect / 3)) / totalQ) * 100;
      const netScorePct = totalQ > 0 ? Number(Math.max(0, rawNet).toFixed(1)) : 0;

      active.push({
        day: d.day,
        displayDate: formatDisplayDate(d.day),
        tests,
        totalQuestions: totalQ,
        correct,
        incorrect,
        unanswered,
        correctPct,
        incorrectPct,
        skippedPct,
        netScorePct,
      });
    }

    // Cap to latest 30 active days so payload and client rendering remain ultra lightweight
    const points = active.slice(-30);

    let mStats = null;
    if (points.length > 0) {
      const latest = points[points.length - 1];
      const totalTestsInWindow = points.reduce((acc, p) => acc + p.tests, 0);
      const totalDays = points.length;
      const avgTests = (totalTestsInWindow / totalDays).toFixed(1);

      // Check for positive growth vs earlier half of the period
      let isPositiveGrowth = false;
      let growthPct = 0;

      if (totalDays >= 4) {
        const mid = Math.floor(totalDays / 2);
        const firstHalf = points.slice(0, mid).reduce((a, b) => a + b.tests, 0);
        const secondHalf = points.slice(mid).reduce((a, b) => a + b.tests, 0);
        if (firstHalf > 0 && secondHalf > firstHalf) {
          isPositiveGrowth = true;
          growthPct = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
        }
      }

      mStats = {
        isPositiveGrowth,
        growthPct,
        latestTests: latest.tests,
        latestDate: latest.displayDate,
        totalTests: totalTestsInWindow,
        daysCount: totalDays,
        avgTests,
        startStr: points[0].displayDate,
        endStr: latest.displayDate,
      };
    }

    return {
      chartPoints: points,
      totalQuestions: qSum,
      totalTests: tSum,
      activeDays: act,
      maxDailyTests: maxTests,
      momentumStats: mStats,
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
    <Card className="rounded-2xl border-0 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Card Header ── */}
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary shrink-0" />
              <span>
                {viewMode === "daily" ? "Daily Quiz Performance" : "Recent Test Breakdown"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "daily" &&
                (momentumStats
                  ? momentumStats.startStr === momentumStats.endStr
                    ? `Accuracy progression & daily practice volume (${momentumStats.startStr})`
                    : `Accuracy progression & daily practice volume (${momentumStats.startStr} – ${momentumStats.endStr})`
                  : rangeDays >= 365
                  ? `${activeDays} active study days (Overall)`
                  : `${activeDays} active study days across last ${rangeDays} days`)}
              {viewMode === "recent" && "Question breakdown across recent test attempts"}
            </CardDescription>
          </div>

          {/* Decluttered Header Controls: [ Daily | Recent Tests ] and [ Skipped | Net Score ] */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher: Daily | Recent Tests */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary border border-border/80 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={cn(
                  "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
                  viewMode === "daily"
                    ? "bg-card text-foreground font-bold shadow-2xs border-border"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                )}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setViewMode("recent")}
                className={cn(
                  "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
                  viewMode === "recent"
                    ? "bg-card text-foreground font-bold shadow-2xs border-border"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                )}
              >
                Recent Tests
              </button>
            </div>

            {/* 3rd Series Toggle: Skipped (%) | Net Score */}
            {viewMode === "daily" && (
              <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary border border-border/80 gap-0.5">
                <button
                  type="button"
                  onClick={() => setThirdMetric("skipped")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
                    thirdMetric === "skipped"
                      ? "bg-card text-foreground font-bold shadow-2xs border-border"
                      : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                  )}
                >
                  Skipped (%)
                </button>
                <button
                  type="button"
                  onClick={() => setThirdMetric("netScore")}
                  className={cn(
                    "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
                    thirdMetric === "netScore"
                      ? "bg-card text-foreground font-bold shadow-2xs border-border"
                      : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
                  )}
                >
                  Net Score
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Moral Booster Badge (Always positive/encouraging, never negative in green) ── */}
        {viewMode === "daily" && momentumStats && (
          <div className="pt-2">
            {momentumStats.isPositiveGrowth ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>
                  +{momentumStats.growthPct}% Practice Volume · {momentumStats.totalTests} Tests Done
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>
                  🔥 {momentumStats.totalTests} Tests Completed · Avg {momentumStats.avgTests} tests/day
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      {/* ── Card Content ── */}
      <CardContent className="p-4 sm:p-5 pt-1 pb-2 flex-1 flex flex-col justify-center">
        {viewMode === "daily" ? (
          chartPoints.length === 0 ? (
            <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
                <TrendingUp className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Practice Attempts in this Period</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Complete practice tests to view your daily test volume bars and 3-line accuracy trajectory.
              </p>
            </div>
          ) : (
            <div className="space-y-2 w-full">
              <ChartContainer config={momentumChartConfig} className="min-h-[250px] w-full">
                <ComposedChart data={chartPoints} margin={{ left: -16, right: 12, top: 16, bottom: 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-[11px] font-medium"
                  />
                  <YAxis
                    yAxisId="accuracy"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    className="text-[11px] font-medium"
                  />
                  {/* Secondary Y-Axis for subtle background bars (scaled to keep bars in lower half) */}
                  <YAxis
                    yAxisId="tests"
                    orientation="right"
                    hide={true}
                    domain={[0, maxDailyTests > 0 ? maxDailyTests * 2.2 : 10]}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={<DailyMomentumTooltip thirdMetric={thirdMetric} />}
                  />

                  {/* Subtle Translucent Background Bars for Daily Practice Volume */}
                  <Bar
                    yAxisId="tests"
                    dataKey="tests"
                    name="Daily Tests"
                    fill="currentColor"
                    className="text-primary/20 dark:text-primary/25"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />

                  {/* Line 1: Correct (%) — Solid Thick Emerald */}
                  <Line
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="correctPct"
                    name="Correct %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, stroke: "#10b981", strokeWidth: 2, fill: "hsl(var(--card))" }}
                    activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2.5, fill: "hsl(var(--card))" }}
                  />

                  {/* Line 2: Incorrect (%) — Clean Coral/Red */}
                  <Line
                    yAxisId="accuracy"
                    type="monotone"
                    dataKey="incorrectPct"
                    name="Incorrect %"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, stroke: "#ef4444", strokeWidth: 2, fill: "hsl(var(--card))" }}
                    activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2.5, fill: "hsl(var(--card))" }}
                  />

                  {/* Line 3: 3rd Series (Skipped or Net Score) — Muted Slate/Sky/Blue */}
                  {thirdMetric === "skipped" ? (
                    <Line
                      yAxisId="accuracy"
                      type="monotone"
                      dataKey="skippedPct"
                      name="Skipped %"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, stroke: "#38bdf8", strokeWidth: 1.5, fill: "hsl(var(--card))" }}
                      activeDot={{ r: 5.5, stroke: "#38bdf8", strokeWidth: 2, fill: "hsl(var(--card))" }}
                    />
                  ) : (
                    <Line
                      yAxisId="accuracy"
                      type="monotone"
                      dataKey="netScorePct"
                      name="Net Score %"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, stroke: "#3b82f6", strokeWidth: 2, fill: "hsl(var(--card))" }}
                      activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2.5, fill: "hsl(var(--card))" }}
                    />
                  )}
                </ComposedChart>
              </ChartContainer>

              {/* Bottom Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 pt-2 pb-1 text-xs font-semibold select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-2 rounded-xs bg-primary/25 border border-primary/40" />
                  <span className="text-muted-foreground font-medium">Daily Tests (Bar)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-foreground">Correct %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-foreground">Incorrect %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      thirdMetric === "skipped" ? "bg-sky-400" : "bg-blue-500"
                    )}
                  />
                  <span className="text-foreground">
                    {thirdMetric === "skipped" ? "Skipped %" : "Net Score %"}
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Recent Test Stacked Bar Chart */
          recentChartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">
              No recent test attempts recorded
            </div>
          ) : (
            <ChartContainer config={recentChartConfig} className="min-h-[250px] w-full">
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
          {viewMode !== "recent"
            ? rangeDays >= 365
              ? "Overall"
              : `Last ${rangeDays} Days`
            : "Chronological"}
        </span>
      </CardFooter>
    </Card>
  );
}
