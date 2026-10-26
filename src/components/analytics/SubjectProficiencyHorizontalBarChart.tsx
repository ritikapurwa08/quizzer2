"use client";

import { useMemo } from "react";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
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
import { BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { getSubjectDisplayName } from "@/lib/utils";

export interface SubjectBreakdownItem {
  subjectId: string;
  name: string;
  nameHindi?: string;
  totalQuestionsAttempted: number;
  correctQuestions: number;
  accuracy: number;
  status: "unattempted" | "weak" | "moderate" | "strong";
}

interface SubjectProficiencyProps {
  data: SubjectBreakdownItem[];
}

const chartConfig = {
  accuracy: {
    label: "Accuracy",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function SubjectProficiencyHorizontalBarChart({ data }: SubjectProficiencyProps) {
  const chartData = useMemo(() => {
    return (data || []).map((item) => {
      const subjectLabel = item.nameHindi || item.name;
      // Shorten label if needed
      const conciseLabel = subjectLabel
        .replace("राजस्थान का ", "")
        .replace("राजस्थान की ", "")
        .replace("राजस्थान के ", "")
        .replace("राजस्थान ", "");

      return {
        subject: conciseLabel,
        fullSubject: subjectLabel,
        accuracy: item.totalQuestionsAttempted > 0 ? item.accuracy : 0,
        accuracyFormatted:
          item.totalQuestionsAttempted > 0 ? `${item.accuracy}%` : "Not attempted",
        total: item.totalQuestionsAttempted,
        correct: item.correctQuestions,
        fill:
          item.accuracy >= 75
            ? "var(--color-chart-2)" // Green
            : item.accuracy >= 55
            ? "var(--color-chart-1)" // Blue
            : item.totalQuestionsAttempted > 0
            ? "var(--color-chart-4)" // Orange
            : "var(--color-muted)",
      };
    });
  }, [data]);

  return (
    <Card className="flex flex-col rounded-2xl border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-2 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Canonical Subject Proficiency
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Accuracy across the 4 core Rajasthan GK sections
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 4, right: 36, top: 8, bottom: 8 }}
          >
            <YAxis
              dataKey="subject"
              type="category"
              tickLine={false}
              tickMargin={10}
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
                      <p className="font-bold text-foreground">{item.payload.fullSubject}</p>
                      <p className="text-muted-foreground">
                        Accuracy: <strong className="text-foreground">{value}%</strong> ({item.payload.correct}/{item.payload.total} correct)
                      </p>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="accuracy"
              radius={8}
              background={{ fill: "var(--color-muted)/30" }}
            >
              <LabelList
                dataKey="subject"
                position="insideLeft"
                offset={10}
                className="fill-foreground font-bold font-hindi text-xs drop-shadow-xs"
              />
              <LabelList
                dataKey="accuracyFormatted"
                position="right"
                offset={8}
                className="fill-foreground font-extrabold tabular-nums text-xs"
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-xs pt-2 pb-5 border-t border-border/50 text-muted-foreground">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Balanced preparation across History, Geography, Polity & Culture</span>
        </div>
        <p className="text-[11px]">Calculated from all evaluated test submissions</p>
      </CardFooter>
    </Card>
  );
}
