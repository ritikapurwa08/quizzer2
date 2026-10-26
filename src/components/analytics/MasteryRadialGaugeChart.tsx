"use client";

import { useMemo } from "react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { TrendingUp, Target, Award, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MasteryRadialGaugeChartProps {
  accuracy: number;
  totalAnswered: number;
  totalCorrect: number;
  targetBenchmark?: number;
}

const chartConfig = {
  score: {
    label: "Mastery",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function MasteryRadialGaugeChart({
  accuracy,
  totalAnswered,
  totalCorrect,
  targetBenchmark = 75,
}: MasteryRadialGaugeChartProps) {
  const safeAccuracy = Math.min(100, Math.max(0, Math.round(accuracy)));
  const endAngle = (safeAccuracy / 100) * 360;

  const chartData = useMemo(
    () => [{ name: "mastery", score: safeAccuracy, fill: "var(--color-primary)" }],
    [safeAccuracy]
  );

  const isPassing = safeAccuracy >= targetBenchmark;

  return (
    <Card className="flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="items-center pb-0 pt-5">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Syllabus Mastery Index
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              RPSC 2nd Grade accuracy vs 75% target benchmark
            </CardDescription>
          </div>
          <Badge
            variant={isPassing ? "default" : "outline"}
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          >
            {isPassing ? "Exam Ready" : "In Training"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0 pt-2">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 - endAngle}
            innerRadius={76}
            outerRadius={104}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted/30 last:fill-background"
              polarRadius={[82, 70]}
            />
            <RadialBar
              dataKey="score"
              background={{ fill: "var(--color-muted)" }}
              cornerRadius={10}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 4}
                          className="fill-foreground text-3xl sm:text-4xl font-black tabular-nums tracking-tight"
                        >
                          {safeAccuracy}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-[11px] font-bold uppercase tracking-wider"
                        >
                          Accuracy
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-xs pt-2 pb-5 border-t border-border/50">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <span>
            {totalCorrect} correct of {totalAnswered} questions attempted
          </span>
        </div>
        <div className="text-muted-foreground text-[11px]">
          Target score for qualification: 70–80% overall accuracy
        </div>
      </CardFooter>
    </Card>
  );
}
