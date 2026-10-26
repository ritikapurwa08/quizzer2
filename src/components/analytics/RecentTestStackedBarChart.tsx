"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3, TrendingUp } from "lucide-react";
import { RecentAttemptItem } from "./RecentTestPerformanceChart";

interface Props {
  data: RecentAttemptItem[];
}

const chartConfig = {
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

export function RecentTestStackedBarChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-8).map((item, idx) => {
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
  }, [data]);

  return (
    <Card className="flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Recent Test Breakdown (Stacked)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Question outcomes across your latest attempted test sets
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
            No test attempt history available yet
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="test"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
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
                    formatter={(value, name, item) => (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{name}:</span>
                        <strong className="text-foreground tabular-nums">{value} Qs</strong>
                      </div>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="correct"
                stackId="a"
                fill="var(--color-chart-2)"
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="incorrect"
                stackId="a"
                fill="var(--color-destructive)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="unanswered"
                stackId="a"
                fill="var(--color-muted-foreground)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-xs pt-2 pb-5 border-t border-border/50 text-muted-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span>Monitor question skipping to minimize negative marking penalties</span>
        </div>
      </CardFooter>
    </Card>
  );
}
