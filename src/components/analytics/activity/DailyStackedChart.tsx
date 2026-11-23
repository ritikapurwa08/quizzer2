"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

export interface DailyPoint {
  day: string;
  count: number;
  tests: number;
  correct?: number;
  incorrect?: number;
  unanswered?: number;
}

interface DailyStackedChartProps {
  data: DailyPoint[];
  rangeDays: number;
}

const chartConfig = {
  correct: {
    label: "Mastered Today",
    color: "#10b981",
  },
  incorrect: {
    label: "Need Review",
    color: "#f43f5e",
  },
} satisfies ChartConfig;

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

function DailyStackedTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-md border border-border bg-popover/95 backdrop-blur-md p-3 text-xs shadow-xl min-w-[210px] space-y-2 select-none">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <span className="font-bold text-foreground text-xs">{data.displayDate}</span>
        <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
          {data.tests} {data.tests === 1 ? "test" : "tests"}
        </span>
      </div>
      <div className="space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-emerald-500 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Mastered Today:
          </span>
          <strong className="text-foreground font-semibold">
            +{data.correct} Qs
          </strong>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-rose-500 font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Need Review:
          </span>
          <strong className="text-foreground font-semibold">
            {data.incorrect} Qs
          </strong>
        </div>
      </div>
      <div className="pt-1.5 border-t border-border/50 text-[10.5px] flex items-center justify-between text-muted-foreground">
        <span>Practiced Volume:</span>
        <strong className="text-foreground font-medium">
          {data.practiced} Qs
        </strong>
      </div>
    </div>
  );
}

export function DailyStackedChart({ data, rangeDays }: DailyStackedChartProps) {
  const chartPoints = useMemo(() => {
    const list: Array<{
      day: string;
      displayDate: string;
      tests: number;
      correct: number;
      incorrect: number;
      practiced: number;
    }> = [];

    for (const d of data) {
      const correct = d.correct ?? 0;
      const incorrect = d.incorrect ?? 0;
      const unanswered = d.unanswered ?? 0;
      const practiced = correct + incorrect > 0 ? correct + incorrect : d.count;

      if (practiced === 0 && (d.tests ?? 0) === 0) continue;

      list.push({
        day: d.day,
        displayDate: formatDisplayDate(d.day),
        tests: d.tests ?? 0,
        correct,
        incorrect,
        practiced: Math.max(practiced, correct + incorrect),
      });
    }

    return rangeDays >= 365 ? list : list.slice(-Math.min(list.length, Math.max(30, rangeDays)));
  }, [data, rangeDays]);

  if (chartPoints.length === 0) {
    return (
      <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 space-y-2">
        <div className="p-3 rounded-full bg-muted/60 text-muted-foreground">
          <TrendingUp className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">No Practice Attempts in this Period</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Complete practice tests to track your daily mastered questions and volume trajectory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
        <BarChart data={chartPoints} margin={{ left: -16, right: 12, top: 16, bottom: 6 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="displayDate"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            className="text-[11px] font-medium"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-[11px] font-medium"
            allowDecimals={false}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            content={<DailyStackedTooltip />}
          />
          <ReferenceLine
            y={20}
            stroke="hsl(var(--muted-foreground)/0.4)"
            strokeDasharray="4 4"
            label={{ value: "Daily Target (20 Qs)", position: "top", fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          {/* Bottom Solid Bar: Mastered / Correct Today */}
          <Bar
            dataKey="correct"
            stackId="day"
            name="Mastered Today"
            fill="#10b981"
            radius={[0, 0, 4, 4]}
            maxBarSize={28}
          />
          {/* Top Muted Bar: Practiced / Incorrect Today */}
          <Bar
            dataKey="incorrect"
            stackId="day"
            name="Need Review"
            fill="#f43f5e"
            className="fill-rose-500/70"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ChartContainer>

      {/* Two-tone Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-1 pb-1 text-xs font-semibold select-none">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
          <span className="text-foreground">Solid Bottom: Mastered Today (Correct)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-xs bg-rose-500/70" />
          <span className="text-muted-foreground">Muted Top: Practiced (Missed / Review)</span>
        </div>
      </div>
    </div>
  );
}
