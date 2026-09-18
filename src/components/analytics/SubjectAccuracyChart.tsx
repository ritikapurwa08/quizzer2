"use client";

import { useState, useMemo } from "react";
import { Award, BarChart3, Radar as RadarIcon, Trophy, AlertTriangle } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export interface SubjectAccuracyItem {
  id?: string;
  name: string;
  nameHindi?: string;
  accuracy: number; // 0-100
  correct?: number;
  total?: number;
}

interface SubjectAccuracyChartProps {
  data: SubjectAccuracyItem[];
  strongest?: { name: string; nameHindi?: string; accuracy: number } | null;
  weakest?: { name: string; nameHindi?: string; accuracy: number } | null;
}

const chartConfig = {
  accuracy: {
    label: "सटीकता (Accuracy %)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SubjectAccuracyChart({ data, strongest, weakest }: SubjectAccuracyChartProps) {
  // Filter out subjects where the user hasn't attempted any questions
  const validData = useMemo(() => {
    return (data || [])
      .filter((s) => (s.total ?? 1) > 0)
      .map((s) => {
        const displayName = s.nameHindi?.trim() || s.name;
        // Truncate very long subject titles for radar points
        const shortName =
          displayName.length > 18 ? displayName.slice(0, 16) + "…" : displayName;
        return {
          ...s,
          displayName,
          shortName,
        };
      });
  }, [data]);

  const hasEnoughForRadar = validData.length >= 3;
  // Default to radar if >= 3 subjects, otherwise bar chart
  const [viewMode, setViewMode] = useState<"radar" | "bar">(
    hasEnoughForRadar ? "radar" : "bar"
  );

  const averageAccuracy = useMemo(() => {
    if (validData.length === 0) return 0;
    const sum = validData.reduce((acc, curr) => acc + curr.accuracy, 0);
    return Math.round(sum / validData.length);
  }, [validData]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2 font-hindi">
              <Award className="h-4 w-4 text-primary" />
              विषयवार सटीकता (Subject Accuracy)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5 font-hindi">
              विभिन्न विषयों में आपकी पकड़ एवं सफलता दर (औसत: {averageAccuracy}%)
            </CardDescription>
          </div>

          {validData.length > 0 && (
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
              {hasEnoughForRadar && (
                <button
                  type="button"
                  onClick={() => setViewMode("radar")}
                  className={cn(
                    "p-1 rounded-md transition-colors cursor-pointer",
                    viewMode === "radar"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="रेडार दृश्य (Radar)"
                  aria-label="रेडार दृश्य"
                >
                  <RadarIcon className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode("bar")}
                className={cn(
                  "p-1 rounded-md transition-colors cursor-pointer",
                  viewMode === "bar"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="बार दृश्य (Bar)"
                aria-label="बार दृश्य"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {validData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground font-hindi">
              अभी पर्याप्त विषय डेटा नहीं है
            </p>
            <p className="text-xs text-muted-foreground max-w-xs font-hindi leading-relaxed">
              विषयों के टेस्ट हल करने पर आपकी विषयवार सटीकता और मजबूत/कमजोर पक्षों का विश्लेषण यहाँ दिखेगा।
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {viewMode === "radar" && hasEnoughForRadar ? (
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-auto h-[220px] sm:h-[250px] w-full"
              >
                <RadarChart data={validData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.displayName}
                        formatter={(val) => (
                          <span className="font-mono font-bold text-foreground">{val}%</span>
                        )}
                      />
                    }
                  />
                  <PolarGrid className="stroke-border/60" />
                  <PolarAngleAxis
                    dataKey="shortName"
                    tick={({ x, y, textAnchor, payload }) => (
                      <text
                        x={x}
                        y={y}
                        textAnchor={textAnchor}
                        className="fill-muted-foreground text-[10px] sm:text-[11px] font-hindi"
                      >
                        {payload.value}
                      </text>
                    )}
                  />
                  <Radar
                    name="accuracy"
                    dataKey="accuracy"
                    fill="var(--chart-1)"
                    fillOpacity={0.35}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
            ) : (
              /* Horizontal bar chart fallback/alternative */
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[220px] sm:h-[250px] w-full"
              >
                <BarChart
                  data={validData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/50" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    unit="%"
                  />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "var(--foreground)" }}
                    width={110}
                  />
                  <ChartTooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(val) => (
                          <span className="font-mono font-bold text-foreground">{val}%</span>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="accuracy"
                    fill="var(--chart-1)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ChartContainer>
            )}

            {/* Contextual insight chips */}
            {(strongest || weakest) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/70 font-hindi">
                {strongest && (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-success/5 border border-success/20">
                    <div className="p-1 rounded-lg bg-success/15 text-success shrink-0">
                      <Trophy className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-success tracking-wide block">
                        सर्वश्रेष्ठ विषय (Strongest)
                      </span>
                      <p className="font-semibold text-foreground truncate">
                        {strongest.nameHindi || strongest.name}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-success text-xs shrink-0">
                      {strongest.accuracy}%
                    </span>
                  </div>
                )}

                {weakest && (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-warning/5 border border-warning/20">
                    <div className="p-1 rounded-lg bg-warning/15 text-warning shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-warning tracking-wide block">
                        सुधार की आवश्यकता (Needs Focus)
                      </span>
                      <p className="font-semibold text-foreground truncate">
                        {weakest.nameHindi || weakest.name}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-warning text-xs shrink-0">
                      {weakest.accuracy}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
