"use client";

import { useMemo } from "react";
import { History, BarChart2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

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
  submittedAt: number;
}

interface RecentTestPerformanceChartProps {
  data: RecentAttemptItem[];
}

const chartConfig = {
  scorePercent: {
    label: "Score %",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function RecentTestPerformanceChart({ data }: RecentTestPerformanceChartProps) {
  const { formattedData, recentAverage } = useMemo(() => {
    if (!data || data.length === 0) {
      return { formattedData: [], recentAverage: 0 };
    }

    let totalScorePercent = 0;
    const items = data.map((item, index) => {
      totalScorePercent += item.scorePercent;
      // Concise label for X-axis: extract "Set XX" or use number
      const setMatch = item.testSetName.match(/(?:Set|सेट|Part|भाग)\s*[-–—:]*\s*(\d+)/i);
      const label = setMatch ? `Set ${setMatch[1]}` : `Test ${index + 1}`;

      const dateStr = new Date(item.submittedAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });

      return {
        ...item,
        axisLabel: label,
        dateStr,
      };
    });

    const avg = Math.round(totalScorePercent / data.length);
    return { formattedData: items, recentAverage: avg };
  }, [data]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Recent Test Performance
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Score percentage progression of your last {data?.length || 0} test attempts
            </CardDescription>
          </div>

          {formattedData.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Recent Average:</span>
              <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-md border border-border/60">
                {recentAverage}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {formattedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <BarChart2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No tests taken yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Complete practice tests to see your last 10 test performances here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[220px] sm:h-[260px] w-full"
            >
              <BarChart
                data={formattedData}
                margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="axisLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  domain={[0, 100]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  unit="%"
                  width={35}
                />
                {recentAverage > 0 && (
                  <ReferenceLine
                    y={recentAverage}
                    stroke="var(--muted-foreground)"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                  />
                )}
                <ChartTooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as RecentAttemptItem & { dateStr: string };
                    return (
                      <div className="rounded-xl border border-border/80 bg-popover p-3 text-xs shadow-xl min-w-[180px] space-y-1.5">
                        <div className="border-b border-border/60 pb-1">
                          <p className="font-semibold text-foreground truncate max-w-[200px] font-hindi">
                            {item.testSetName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {new Date(item.submittedAt).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-foreground">
                          <span className="text-muted-foreground">Score:</span>
                          <span className="font-mono font-bold text-primary">
                            {item.scorePercent}% ({item.score} / {item.maxScore} pts)
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] border-t border-border/40 text-center">
                          <span className="text-success font-semibold">
                            {item.correctCount} Correct
                          </span>
                          <span className="text-destructive font-semibold">
                            {item.incorrectCount} Incorrect
                          </span>
                          <span className="text-muted-foreground">
                            {item.unansweredCount} Skipped
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="scorePercent"
                  fill="var(--chart-3)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ChartContainer>

            {/* Subtext info */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1 border-t border-border/60">
              <span>Left to right: Oldest to newest attempt</span>
              <span>Max Points: Question count × 2</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
