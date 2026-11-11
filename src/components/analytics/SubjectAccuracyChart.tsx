"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
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
import { Award, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SubjectAccuracyItem {
  id?: string;
  name: string;
  nameHindi?: string;
  accuracy: number; // 0-100
  correct?: number;
  total?: number;
  attempted?: number;
  totalAvailable?: number;
  remaining?: number;
}

interface SubjectAccuracyChartProps {
  data: SubjectAccuracyItem[];
  strongest?: { name: string; nameHindi?: string; accuracy: number } | null;
  weakest?: { name: string; nameHindi?: string; accuracy: number } | null;
}

const chartConfig = {
  accuracy: {
    label: "Accuracy %",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

export function SubjectAccuracyChart({ data }: SubjectAccuracyChartProps) {
  const subjectsList = data || [];

  const attemptedCount = subjectsList.filter(
    (s) => (s.attempted ?? s.total ?? 0) > 0
  ).length;

  const topSubject = useMemo(() => {
    const attempted = subjectsList.filter((s) => (s.attempted ?? s.total ?? 0) > 0);
    if (attempted.length === 0) return null;
    return [...attempted].sort((a, b) => b.accuracy - a.accuracy)[0];
  }, [subjectsList]);

  // Format data for shadcn "Bar Chart - Custom Label" (horizontal bars)
  const barData = useMemo(() => {
    return subjectsList.map((item) => {
      const attempted = item.attempted ?? item.total ?? 0;
      const isAttempted = attempted > 0;
      const label = item.nameHindi || item.name;

      // Color mapping matching shadcn curated palette
      const fill = !isAttempted
        ? "var(--color-muted)"
        : item.accuracy >= 75
        ? "var(--color-chart-2)" // Green
        : item.accuracy >= 50
        ? "var(--color-chart-1)" // Blue
        : "var(--color-destructive)";

      return {
        subject: label,
        shortSubject: label.replace("राजस्थान ", "").replace("का ", "").replace("की ", "").replace("के ", ""),
        accuracy: isAttempted ? item.accuracy : 0,
        accuracyDisplay: isAttempted ? `${item.accuracy}%` : "Not Attempted",
        attempted,
        correct: item.correct ?? 0,
        fill,
      };
    });
  }, [subjectsList]);

  return (
    <Card className="rounded-md border border-border bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Card Header ── */}
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span>Subject Accuracy &amp; Mastery</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Subject performance ranked by evaluation accuracy
            </CardDescription>
          </div>

          <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5 rounded-sm border-border self-start sm:self-auto">
            {attemptedCount} of {subjectsList.length} Attempted
          </Badge>
        </div>
      </CardHeader>

      {/* ── Card Content: Horizontal Bar Chart ── */}
      <CardContent className="p-4 sm:p-5 pt-1 pb-2 flex-1 flex items-center justify-center">
        {subjectsList.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No subject data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={barData}
              layout="vertical"
              margin={{ left: 8, right: 48, top: 12, bottom: 8 }}
            >
              <YAxis
                dataKey="shortSubject"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={({ x, y, payload }) => (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    className="fill-foreground font-hindi font-medium text-xs select-none"
                  >
                    {payload.value}
                  </text>
                )}
              />
              <XAxis dataKey="accuracy" type="number" domain={[0, 100]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-foreground font-hindi">{item.payload.subject}</p>
                        <p className="text-muted-foreground">
                          Accuracy: <strong className="text-foreground">{value}%</strong> ({item.payload.correct}/{item.payload.attempted} questions)
                        </p>
                      </div>
                    )}
                  />
                }
              />
              <Bar
                dataKey="accuracy"
                radius={3}
                background={{ fill: "rgba(128, 128, 128, 0.12)", radius: 3 }}
              >
                <LabelList
                  dataKey="accuracyDisplay"
                  position="right"
                  offset={8}
                  className="fill-foreground font-semibold tabular-nums text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>

      {/* ── Card Footer ── */}
      <CardFooter className="p-4 sm:p-5 pt-2 pb-3.5 border-t border-border/50 text-xs text-muted-foreground flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            {topSubject
              ? `Leading: ${topSubject.nameHindi || topSubject.name} (${topSubject.accuracy}% accuracy)`
              : "Solve practice sets to build your subject mastery scores"}
          </span>
        </div>
        <p className="text-[11px]">Covers all active examination syllabus subjects</p>
      </CardFooter>
    </Card>
  );
}
