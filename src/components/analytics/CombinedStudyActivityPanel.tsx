"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Bar,
  BarChart,
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

function renderScaledDot(strokeColor: string) {
  return function ScaledDot(props: any) {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
    const tests = payload?.tests ?? 1;
    const r = tests >= 4 ? 6.5 : tests >= 3 ? 5.5 : tests === 2 ? 4.5 : 3.5;
    return (
      <circle
        key={`dot-${strokeColor}-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="hsl(var(--card))"
        stroke={strokeColor}
        strokeWidth={2.5}
        className="transition-all duration-200"
      />
    );
  };
}

function renderScaledActiveDot(strokeColor: string) {
  return function ScaledActiveDot(props: any) {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || isNaN(cx) || isNaN(cy)) return null;
    const tests = payload?.tests ?? 1;
    const r = (tests >= 4 ? 6.5 : tests >= 3 ? 5.5 : tests === 2 ? 4.5 : 3.5) + 2.5;
    return (
      <circle
        key={`act-dot-${strokeColor}-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="hsl(var(--card))"
        stroke={strokeColor}
        strokeWidth={3}
      />
    );
  };
}

function DailyMomentumTooltip({ active, payload, thirdMetric }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-3 text-xs shadow-xl min-w-[210px] space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <span className="font-bold text-foreground text-xs">{data.displayDate}</span>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {data.tests} {data.tests === 1 ? "test" : "tests"}
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
  hourlyData = [],
  recentAttempts = [],
  rangeDays,
}: CombinedStudyActivityPanelProps) {
  const [viewMode, setViewMode] = useState<"daily" | "hourly" | "recent">("daily");
  const [thirdMetric, setThirdMetric] = useState<"skipped" | "netScore">("skipped");

  const { chartPoints, totalQuestions, totalTests, activeDays, momentumStats } = useMemo(() => {
    let qSum = 0;
    let tSum = 0;
    let act = 0;
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
      let totalQ = correct + incorrect + unanswered;
      if (totalQ === 0 && d.count > 0) totalQ = d.count;
      if (totalQ === 0 && tests > 0) totalQ = tests * 20;

      qSum += (d.count > 0 ? d.count : totalQ);
      tSum += tests;

      if (tests > 0 || totalQ > 0) {
        act += 1;
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
    }

    // Cap to latest 30 active days so payload and client rendering remain ultra lightweight
    const points = active.slice(-30);

    let mStats = null;
    if (points.length > 0) {
      const latest = points[points.length - 1];
      const totalTestsInWindow = points.reduce((acc, p) => acc + p.tests, 0);
      const totalDays = points.length;

      let trendText = "+100%";
      if (totalDays >= 2) {
        const mid = Math.floor(totalDays / 2);
        const firstHalf = points.slice(0, mid).reduce((a, b) => a + b.tests, 0);
        const secondHalf = points.slice(mid).reduce((a, b) => a + b.tests, 0);
        if (firstHalf > 0) {
          const diff = Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
          trendText = diff >= 0 ? `+${diff}%` : `${diff}%`;
        } else {
          trendText = `+${secondHalf * 100}%`;
        }
      } else {
        trendText = `+${latest.tests * 50}%`;
      }

      mStats = {
        latestTests: latest.tests,
        latestDate: latest.displayDate,
        totalTests: totalTestsInWindow,
        daysCount: totalDays,
        trendText,
        startStr: points[0].displayDate,
        endStr: latest.displayDate,
      };
    }

    return {
      chartPoints: points,
      totalQuestions: qSum,
      totalTests: tSum,
      activeDays: act,
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
                {viewMode === "daily" ? "Daily Quiz Performance" : "Study & Consistency"}
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "daily" &&
                (momentumStats
                  ? momentumStats.startStr === momentumStats.endStr
                    ? `Accuracy progression & test volume (${momentumStats.startStr})`
                    : `Accuracy progression & test volume (${momentumStats.startStr} – ${momentumStats.endStr})`
                  : rangeDays >= 365
                  ? `${activeDays} active study days (Overall)`
                  : `${activeDays} active study days across last ${rangeDays} days`)}
              {viewMode === "hourly" && "24-Hour peak study pattern & test submission frequency"}
              {viewMode === "recent" && "Question breakdown across recent test attempts"}
            </CardDescription>
          </div>

          {/* Unified 3-Mode Segmented Control */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-secondary border border-border/80 self-start sm:self-auto gap-0.5">
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
              onClick={() => setViewMode("hourly")}
              className={cn(
                "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
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
                "h-7 px-2.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap border select-none",
                viewMode === "recent"
                  ? "bg-card text-foreground font-bold shadow-2xs border-border"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
              )}
            >
              Recent Tests
            </button>
          </div>
        </div>

        {/* ── Daily Momentum Badge (Shown when in Daily view with active data) ── */}
        {viewMode === "daily" && momentumStats && (
          <div className="pt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>
                {momentumStats.latestTests} {momentumStats.latestTests === 1 ? "test" : "tests"} on {momentumStats.latestDate} · {momentumStats.totalTests} tests in {momentumStats.daysCount} days ({momentumStats.trendText})
              </span>
            </div>
          </div>
        )}

        {/* ── Sub-bar: 3rd Series Toggle Tabs (Left) & Dot Scale Legend (Right) ── */}
        {viewMode === "daily" && chartPoints.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">3rd Series:</span>
              <div className="inline-flex items-center p-0.5 rounded-full bg-secondary border border-border">
                <button
                  type="button"
                  onClick={() => setThirdMetric("skipped")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer select-none",
                    thirdMetric === "skipped"
                      ? "bg-card text-foreground font-bold shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Skipped (%)
                </button>
                <button
                  type="button"
                  onClick={() => setThirdMetric("netScore")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer select-none",
                    thirdMetric === "netScore"
                      ? "bg-card text-foreground font-bold shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Net Score (1/3 Neg)
                </button>
              </div>
            </div>

            {/* Dot Size Indicator */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground select-none">
              <div className="flex items-center gap-1.5">
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>1 test</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>4+ tests</span>
              </div>
            </div>
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
              <p className="text-sm font-semibold text-foreground">No Quiz Attempts in this Period</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Complete tests to track your daily accuracy trajectory, momentum streaks, and score progression.
              </p>
            </div>
          ) : (
            <div className="space-y-2 w-full">
              <ChartContainer config={momentumChartConfig} className="min-h-[250px] w-full">
                <LineChart data={chartPoints} margin={{ left: -16, right: 12, top: 16, bottom: 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-[11px] font-medium"
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    className="text-[11px] font-medium"
                  />
                  <ChartTooltip
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                    content={<DailyMomentumTooltip thirdMetric={thirdMetric} />}
                  />
                  {/* Line 1: Correct (%) — Emerald Green */}
                  <Line
                    type="monotone"
                    dataKey="correctPct"
                    name="Correct %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={renderScaledDot("#10b981")}
                    activeDot={renderScaledActiveDot("#10b981")}
                  />
                  {/* Line 2: Incorrect (%) — Rose Red */}
                  <Line
                    type="monotone"
                    dataKey="incorrectPct"
                    name="Incorrect %"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={renderScaledDot("#ef4444")}
                    activeDot={renderScaledActiveDot("#ef4444")}
                  />
                  {/* Line 3: Toggleable Skipped / Net Score — Blue */}
                  {thirdMetric === "skipped" ? (
                    <Line
                      type="monotone"
                      dataKey="skippedPct"
                      name="Skipped %"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={renderScaledDot("#38bdf8")}
                      activeDot={renderScaledActiveDot("#38bdf8")}
                    />
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="netScorePct"
                      name="Net Score %"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={renderScaledDot("#3b82f6")}
                      activeDot={renderScaledActiveDot("#3b82f6")}
                    />
                  )}
                </LineChart>
              </ChartContainer>

              {/* Bottom Legend */}
              <div className="flex items-center justify-center gap-5 sm:gap-8 pt-2 pb-1 text-xs font-semibold select-none">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-foreground">Correct %</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="text-foreground">Incorrect %</span>
                </div>
                <div className="flex items-center gap-2">
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
        ) : viewMode === "hourly" ? (
          /* Hourly Bar Chart */
          <ChartContainer config={hourlyChartConfig} className="min-h-[250px] w-full">
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
                  <div className="rounded-xl border border-border/80 bg-popover/95 p-2.5 text-xs shadow-xl space-y-1">
                    <p className="font-bold text-foreground">Peak Study Hour</p>
                    <p className="text-muted-foreground">Submission activity distribution</p>
                  </div>
                }
              />
              <Bar dataKey="correct" stackId="hour" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="incorrect" stackId="hour" fill="var(--color-destructive)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
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
