"use client";

import { useMemo } from "react";
import { CheckCircle2, PieChart as PieChartIcon } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface AnswerBreakdownData {
  correct: number;
  incorrect: number;
  unanswered: number;
  totalQuestions: number;
  answeredCount: number;
  accuracy: number; // (correct / answeredCount) * 100
}

interface AnswerAccuracyChartProps {
  data?: AnswerBreakdownData;
}

const CATEGORY_COLORS = {
  correct: "var(--success)",
  incorrect: "var(--destructive)",
  unanswered: "var(--muted-foreground)",
};

export function AnswerAccuracyChart({ data }: AnswerAccuracyChartProps) {
  const { chartData, hasData, totalSlots, accuracy, answeredTotal } = useMemo(() => {
    if (!data || data.totalQuestions === 0) {
      return {
        chartData: [],
        hasData: false,
        totalSlots: 0,
        accuracy: 0,
        answeredTotal: 0,
      };
    }

    const { correct, incorrect, unanswered, totalQuestions, answeredCount } = data;
    const items = [
      {
        name: "Correct Answers",
        key: "correct",
        value: correct,
        color: CATEGORY_COLORS.correct,
      },
      {
        name: "Incorrect Answers",
        key: "incorrect",
        value: incorrect,
        color: CATEGORY_COLORS.incorrect,
      },
      {
        name: "Skipped",
        key: "unanswered",
        value: unanswered,
        color: CATEGORY_COLORS.unanswered,
      },
    ].filter((item) => item.value > 0);

    return {
      chartData: items,
      hasData: totalQuestions > 0,
      totalSlots: totalQuestions,
      accuracy: data.accuracy ?? (answeredCount > 0 ? (correct / answeredCount) * 100 : 0),
      answeredTotal: answeredCount,
    };
  }, [data]);

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Answer Accuracy
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Overall proportion of correct, incorrect, and skipped questions
            </CardDescription>
          </div>

          {hasData && (
            <div className="flex items-center gap-1.5 text-xs bg-muted/60 px-2.5 py-0.5 rounded-lg border border-border/60">
              <span className="text-muted-foreground">Total Questions:</span>
              <span className="font-mono font-bold text-foreground">{totalSlots}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No question data available
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Complete practice tests to see the accuracy breakdown of all your answers here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut Chart with Centered Metric */}
            <div className="relative mx-auto aspect-auto h-[210px] sm:h-[240px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const val = Number(item.value);
                      const pct = totalSlots > 0 ? ((val / totalSlots) * 100).toFixed(1) : "0";
                      return (
                        <div className="rounded-xl border border-border/80 bg-popover px-3 py-2 text-xs shadow-xl min-w-[140px]">
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <div className="flex items-center justify-between gap-3 mt-1">
                            <span className="font-mono font-bold text-foreground">{val} questions</span>
                            <span className="text-muted-foreground font-mono">({pct}%)</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centered Accuracy Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">
                  {accuracy.toFixed(1)}%
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  Accuracy
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                  (Attempted Questions)
                </span>
              </div>
            </div>

            {/* Detailed summary breakdown pills */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/70 text-center">
              {/* Correct */}
              <div className="p-2 rounded-xl bg-success/5 border border-success/20 flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-success mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <span>Correct</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {data?.correct ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {totalSlots > 0 ? (((data?.correct ?? 0) / totalSlots) * 100).toFixed(1) : 0}%
                </span>
              </div>

              {/* Incorrect */}
              <div className="p-2 rounded-xl bg-destructive/5 border border-destructive/20 flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-destructive mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <span>Wrong</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {data?.incorrect ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {totalSlots > 0 ? (((data?.incorrect ?? 0) / totalSlots) * 100).toFixed(1) : 0}%
                </span>
              </div>

              {/* Unanswered */}
              <div className="p-2 rounded-xl bg-muted/40 border border-border/60 flex flex-col items-center">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-0.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                  <span>Skipped</span>
                </div>
                <span className="text-sm sm:text-base font-bold text-foreground font-mono">
                  {data?.unanswered ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {totalSlots > 0 ? (((data?.unanswered ?? 0) / totalSlots) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>

            {/* Note clarifying formula */}
            <p className="text-[11px] text-muted-foreground/80 text-center">
              Accuracy = Correct ({data?.correct ?? 0}) ÷ Total Attempted ({answeredTotal})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
