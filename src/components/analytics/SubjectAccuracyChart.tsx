"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarRadiusAxis,
  Label,
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
import { Award, TrendingUp, BarChart2, PieChart, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  culture: {
    label: "कला एवं संस्कृति",
    color: "var(--color-chart-2)",
  },
  geography: {
    label: "भूगोल",
    color: "var(--color-chart-1)",
  },
  history: {
    label: "इतिहास",
    color: "var(--color-chart-4)",
  },
  polity: {
    label: "राजव्यवस्था",
    color: "var(--color-chart-3)",
  },
} satisfies ChartConfig;

export function SubjectAccuracyChart({ data }: SubjectAccuracyChartProps) {
  const [chartType, setChartType] = useState<"bar" | "radial">("bar");

  // Filter strictly to the 4 Canonical Rajasthan GK Subjects (Eliminating English / non-GK)
  const canonicalSubjects = useMemo(() => {
    return (data || []).filter(
      (s) =>
        !s.name?.toLowerCase().includes("english") &&
        !s.nameHindi?.includes("अंग्रेजी")
    );
  }, [data]);

  const attemptedCount = canonicalSubjects.filter(
    (s) => (s.attempted ?? s.total ?? 0) > 0
  ).length;

  const topSubject = useMemo(() => {
    const attempted = canonicalSubjects.filter((s) => (s.attempted ?? s.total ?? 0) > 0);
    if (attempted.length === 0) return null;
    return [...attempted].sort((a, b) => b.accuracy - a.accuracy)[0];
  }, [canonicalSubjects]);

  // Format data for shadcn "Bar Chart - Custom Label" (horizontal bars)
  const barData = useMemo(() => {
    return canonicalSubjects.map((item, idx) => {
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
        accuracyDisplay: isAttempted ? `${item.accuracy}%` : "Not Started",
        attempted,
        correct: item.correct ?? 0,
        fill,
      };
    });
  }, [canonicalSubjects]);

  // Format data for shadcn "Radial Chart - Stacked / Shape"
  const radialData = useMemo(() => {
    const palette = [
      "var(--color-chart-2)",
      "var(--color-chart-1)",
      "var(--color-chart-4)",
      "var(--color-chart-3)",
    ];
    return canonicalSubjects.map((item, idx) => {
      const attempted = item.attempted ?? item.total ?? 0;
      const isAttempted = attempted > 0;
      const label = item.nameHindi || item.name;

      return {
        name: label,
        accuracy: isAttempted ? item.accuracy : 0,
        fill: isAttempted ? palette[idx % palette.length] : "var(--color-muted)",
      };
    });
  }, [canonicalSubjects]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      {/* ── Card Header ── */}
      <CardHeader className="p-4 sm:p-5 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Subject Accuracy &amp; Mastery
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              4 Canonical Rajasthan GK Subjects ranked by accuracy
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Mode Toggle (Bar Chart vs Radial Chart) */}
            <div className="flex items-center bg-muted/70 p-0.5 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  chartType === "bar"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Bar Chart (Custom Label)"
              >
                Bar
              </button>
              <button
                type="button"
                onClick={() => setChartType("radial")}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  chartType === "radial"
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Radial Chart (Shape)"
              >
                Radial
              </button>
            </div>

            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-lg border-border/80">
              {attemptedCount} of 4 Attempted
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* ── Card Content: Official Shadcn Chart ── */}
      <CardContent className="p-4 sm:p-5 pt-1 pb-2 flex-1 flex items-center justify-center">
        {canonicalSubjects.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No subject data available
          </div>
        ) : chartType === "bar" ? (
          /* ── Shadcn "Bar Chart - Custom Label" (Horizontal Bars with Labels) ── */
          <ChartContainer config={chartConfig} className="min-h-[240px] w-full">
            <BarChart
              accessibilityLayer
              data={barData}
              layout="vertical"
              margin={{ left: 0, right: 38, top: 12, bottom: 8 }}
            >
              <YAxis
                dataKey="subject"
                type="category"
                tickLine={false}
                axisLine={false}
                hide
              />
              <XAxis dataKey="accuracy" type="number" domain={[0, 100]} hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-foreground font-hindi">{item.payload.subject}</p>
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
                radius={8}
                background={{ fill: "var(--color-muted)/40" }}
              >
                <LabelList
                  dataKey="subject"
                  position="insideLeft"
                  offset={10}
                  className="fill-foreground font-bold font-hindi text-xs drop-shadow-xs"
                />
                <LabelList
                  dataKey="accuracyDisplay"
                  position="right"
                  offset={8}
                  className="fill-foreground font-extrabold tabular-nums text-xs"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          /* ── Shadcn "Radial Chart - Shape / Stacked" ── */
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[240px]">
            <RadialBarChart
              data={radialData}
              startAngle={180}
              endAngle={0}
              innerRadius={70}
              outerRadius={125}
            >
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="text-xs">
                        <span className="font-hindi font-bold text-foreground">{item.payload.name}: </span>
                        <strong>{value}%</strong>
                      </div>
                    )}
                  />
                }
              />
              <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) - 14}
                            className="fill-foreground text-3xl font-black tabular-nums"
                          >
                            {topSubject ? `${topSubject.accuracy}%` : "0%"}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 12}
                            className="fill-muted-foreground text-[11px] font-bold"
                          >
                            Top Subject
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </PolarRadiusAxis>
              <RadialBar
                dataKey="accuracy"
                background={{ fill: "var(--color-muted)/40" }}
                cornerRadius={8}
              />
            </RadialBarChart>
          </ChartContainer>
        )}
      </CardContent>

      {/* ── Card Footer: Shadcn Metric Note ── */}
      <CardFooter className="p-4 sm:p-5 pt-2 pb-3.5 border-t border-border/50 text-xs text-muted-foreground flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            {topSubject
              ? `Leading: ${topSubject.nameHindi || topSubject.name} (${topSubject.accuracy}% accuracy)`
              : "Solve practice sets to build your subject mastery scores"}
          </span>
        </div>
        <p className="text-[11px]">Strictly aligned with RPSC 2nd Grade Paper-1 syllabus</p>
      </CardFooter>
    </Card>
  );
}
