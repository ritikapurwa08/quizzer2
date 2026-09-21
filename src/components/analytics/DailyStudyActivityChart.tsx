"use client";

import { useId, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, Flame, CalendarCheck, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyPoint {
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

interface DailyStudyActivityChartProps {
  data: DailyPoint[];
  hourlyData?: HourlyPoint[];
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
    color: "var(--chart-1)",
  },
  tests: {
    label: "Tests Completed",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const hourlyChartConfig = {
  correct: {
    label: "Correct",
    color: "var(--success)",
  },
  incorrect: {
    label: "Incorrect",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

export function DailyStudyActivityChart({
  data,
  hourlyData = [],
  rangeDays,
}: DailyStudyActivityChartProps) {
  const gradientId = useId();
  const [viewMode, setViewMode] = useState<"daily" | "hourly">("daily");

  const { totalQuestions, totalTests, activeDays, chartData } = useMemo(() => {
    let qSum = 0;
    let tSum = 0;
    let act = 0;
    const formatted = [];

    for (const d of data) {
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
      chartData: formatted,
    };
  }, [data]);

  // Hourly insights
  const { peakHourLabel, bestHourAccuracy } = useMemo(() => {
    if (!hourlyData || hourlyData.length === 0) return { peakHourLabel: "—", bestHourAccuracy: "—" };

    let maxTotal = 0;
    let peak = "—";
    let bestAcc = 0;
    let bestAccHour = "—";

    for (const h of hourlyData) {
      if (h.total > maxTotal) {
        maxTotal = h.total;
        peak = h.hourLabel;
      }
      if (h.total >= 5) {
        const acc = Math.round((h.correct / h.total) * 100);
        if (acc > bestAcc) {
          bestAcc = acc;
          bestAccHour = `${h.hourLabel} (${acc}%)`;
        }
      }
    }

    return { peakHourLabel: peak, bestHourAccuracy: bestAccHour };
  }, [hourlyData]);

  const hasActivity = totalQuestions > 0 || totalTests > 0;
  const xAxisInterval = rangeDays <= 7 ? 0 : rangeDays <= 15 ? 1 : 4;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Study Activity
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "daily"
                ? `Questions solved and tests taken over the last ${rangeDays} days`
                : `Hourly breakdown of correct vs incorrect answers in selected period`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("daily")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer select-none",
                  viewMode === "daily"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Daily Trend"
              >
                <Calendar className="h-3 w-3" />
                <span>Daily</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("hourly")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer select-none",
                  viewMode === "hourly"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Hourly Activity Pattern"
              >
                <Clock className="h-3 w-3" />
                <span>Hourly</span>
              </button>
            </div>

            {hasActivity && viewMode === "daily" && (
              <span className="hidden sm:flex items-center gap-1 text-warning font-semibold bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20 text-xs">
                <Flame className="h-3.5 w-3.5 fill-current" />
                {activeDays} Active Days
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {!hasActivity ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No study activity in this period
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Practice test sets from subjects to visualize your daily activity and hourly patterns here.
            </p>
          </div>
        ) : viewMode === "daily" ? (
          /* DAILY AREA CHART */
          <div className="space-y-4">
            <ChartContainer
              config={dailyChartConfig}
              className="aspect-auto h-[220px] sm:h-[260px] w-full"
            >
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`fillArea-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={xAxisInterval}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={30}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(label, payload) => {
                        const iso = payload?.[0]?.payload?.day;
                        return iso ? formatDisplayDate(iso) : label;
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  fill={`url(#fillArea-${gradientId})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>

            {/* Summary statistics row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70 text-center">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Total Questions</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {totalQuestions}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Tests Completed</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {totalTests}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Daily Average</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {(totalQuestions / rangeDays).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* HOURLY BAR CHART (CORRECT VS INCORRECT) */
          <div className="space-y-4">
            <ChartContainer
              config={hourlyChartConfig}
              className="aspect-auto h-[220px] sm:h-[260px] w-full"
            >
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="hourLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={2}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  width={30}
                />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as HourlyPoint;
                    return (
                      <div className="rounded-xl border border-border/80 bg-popover p-3 text-xs shadow-xl min-w-[150px] space-y-1.5">
                        <p className="font-bold text-foreground border-b border-border/60 pb-1">
                          {item.hourLabel}
                        </p>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex items-center justify-between text-success">
                            <span>Correct:</span>
                            <span className="font-mono font-bold">{item.correct}</span>
                          </div>
                          <div className="flex items-center justify-between text-destructive">
                            <span>Incorrect:</span>
                            <span className="font-mono font-bold">{item.incorrect}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground border-t border-border/40 pt-1">
                            <span>Total Attempted:</span>
                            <span className="font-mono font-bold text-foreground">{item.total}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="correct"
                  name="correct"
                  fill="var(--success)"
                  stackId="answers"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="incorrect"
                  name="incorrect"
                  fill="var(--destructive)"
                  stackId="answers"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ChartContainer>

            {/* Hourly summary statistics row */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70 text-center">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Peak Study Hour</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {peakHourLabel}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Top Accuracy Hour</span>
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {bestHourAccuracy}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">Legend</span>
                <div className="flex items-center justify-center gap-2 text-[10px] mt-0.5 font-semibold">
                  <span className="text-success">● Correct</span>
                  <span className="text-destructive">● Incorrect</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
