"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp, Flame, CalendarCheck } from "lucide-react";

interface DailyPoint {
  day: string; // "YYYY-MM-DD"
  count: number;
  tests: number;
}

interface DailyStudyActivityChartProps {
  data: DailyPoint[];
  rangeDays: number;
}

const HINDI_MONTHS: Record<number, string> = {
  0: "जन",
  1: "फर",
  2: "मार्च",
  3: "अप्रै",
  4: "मई",
  5: "जून",
  6: "जुला",
  7: "अग",
  8: "सित",
  9: "अक्टू",
  10: "नव",
  11: "दिस",
};

function formatDisplayDate(isoDate: string): string {
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthName = HINDI_MONTHS[month] ?? `${month + 1}`;
      return `${day} ${monthName}`;
    }
  } catch {
    // fallback
  }
  return isoDate.slice(5);
}

const chartConfig = {
  count: {
    label: "हल किए प्रश्न (Questions)",
    color: "var(--chart-1)",
  },
  tests: {
    label: "दिए गए टेस्ट (Tests)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function DailyStudyActivityChart({ data, rangeDays }: DailyStudyActivityChartProps) {
  const gradientId = useId();

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

  const hasActivity = totalQuestions > 0 || totalTests > 0;

  // Decide X-axis interval to avoid label crowding on 30D / 90D
  const xAxisInterval = rangeDays === 7 ? 0 : rangeDays === 30 ? 4 : 12;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 font-hindi">
              <TrendingUp className="h-4 w-4 text-primary" />
              दैनिक अध्ययन गतिविधि (Daily Study Activity)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-hindi">
              पिछले {rangeDays} दिनों में हल किए गए प्रश्न एवं पूर्ण किए गए टेस्ट
            </CardDescription>
          </div>

          {hasActivity && (
            <div className="flex items-center gap-2 font-hindi text-xs">
              <span className="flex items-center gap-1 text-warning font-semibold bg-warning/10 px-2.5 py-0.5 rounded-full border border-warning/20">
                <Flame className="h-3.5 w-3.5 fill-current" />
                {activeDays} सक्रिय दिन
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {!hasActivity ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground font-hindi">
              इस अवधि में कोई अध्ययन गतिविधि नहीं
            </p>
            <p className="text-xs text-muted-foreground max-w-xs font-hindi leading-relaxed">
              विषय चुनकर प्रश्नों का अभ्यास करें। आपकी दैनिक प्रगति का ग्राफ यहाँ प्रदर्शित होगा।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ChartContainer
              config={chartConfig}
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

            {/* Summary statistics row below visualization */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70 text-center font-hindi">
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">कुल प्रश्न</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {totalQuestions}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">दिए गए टेस्ट</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {totalTests}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-[11px] text-muted-foreground block">दैनिक औसत</span>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {(totalQuestions / rangeDays).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
