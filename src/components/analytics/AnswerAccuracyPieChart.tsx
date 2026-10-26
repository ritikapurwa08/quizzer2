"use client";

import { useMemo } from "react";
import { Pie, PieChart, LabelList } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChartIcon, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface AnswerAccuracyData {
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  answeredCount: number;
  accuracy: number;
}

interface Props {
  data?: AnswerAccuracyData;
}

const chartConfig = {
  correct: {
    label: "Correct",
    color: "var(--color-chart-2)", // Emerald
  },
  incorrect: {
    label: "Incorrect",
    color: "var(--color-destructive)", // Red
  },
  unanswered: {
    label: "Skipped / Unanswered",
    color: "var(--color-muted-foreground)", // Gray
  },
} satisfies ChartConfig;

export function AnswerAccuracyPieChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      {
        status: "correct",
        name: "Correct Answers",
        count: data.correct,
        fill: "var(--color-chart-2)",
      },
      {
        status: "incorrect",
        name: "Incorrect Answers",
        count: data.incorrect,
        fill: "var(--color-destructive)",
      },
      {
        status: "unanswered",
        name: "Skipped",
        count: data.unanswered,
        fill: "var(--color-muted-foreground)",
      },
    ].filter((item) => item.count > 0);
  }, [data]);

  const total = data?.totalQuestions || 0;
  const correctPct = total > 0 ? Math.round(((data?.correct || 0) / total) * 100) : 0;

  return (
    <Card className="flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="items-center pb-0 pt-5">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Answer Distribution
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Breakdown of correct, incorrect, and skipped questions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2">
        {chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
            No question data available yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[220px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">{item.payload.name}:</span>
                        <strong className="text-foreground tabular-nums">{value}</strong>
                        <span className="text-muted-foreground">
                          ({total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                stroke="var(--color-card)"
                strokeWidth={2}
              >
                <LabelList
                  dataKey="count"
                  className="fill-card-foreground font-bold text-xs"
                  stroke="none"
                  position="inside"
                  formatter={(val: any) => (Number(val) > 0 ? `${val}` : "")}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-xs pt-3 pb-5 border-t border-border/50">
        <div className="grid grid-cols-3 gap-2 w-full text-center">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
              Correct
            </span>
            <strong className="text-sm font-bold text-foreground tabular-nums">
              {data?.correct || 0}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
            <span className="text-[10px] font-semibold text-destructive block">
              Incorrect
            </span>
            <strong className="text-sm font-bold text-foreground tabular-nums">
              {data?.incorrect || 0}
            </strong>
          </div>
          <div className="p-2 rounded-xl bg-muted/70 border border-border/60">
            <span className="text-[10px] font-semibold text-muted-foreground block">
              Skipped
            </span>
            <strong className="text-sm font-bold text-foreground tabular-nums">
              {data?.unanswered || 0}
            </strong>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
