"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface RecentAttemptItem {
  attemptId: string;
  testSetId: string;
  testSetName: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  submittedAt?: number;
}

interface RecentTestsBarChartProps {
  recentAttempts: RecentAttemptItem[];
}

const recentChartConfig = {
  correct: {
    label: "Correct",
    color: "#10b981",
  },
  incorrect: {
    label: "Incorrect",
    color: "#ef4444",
  },
  unanswered: {
    label: "Skipped",
    color: "#64748b",
  },
} satisfies ChartConfig;

export function RecentTestsBarChart({ recentAttempts }: RecentTestsBarChartProps) {
  const chartData = useMemo(() => {
    if (!recentAttempts || recentAttempts.length === 0) return [];
    return recentAttempts.slice(-8).map((item, idx) => {
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
  }, [recentAttempts]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-xs text-muted-foreground">
        No recent test attempts recorded
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <ChartContainer config={recentChartConfig} className="min-h-[250px] w-full">
        <BarChart data={chartData} margin={{ left: -16, right: 8, top: 12, bottom: 4 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="test"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-xs font-medium"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            className="text-xs"
            allowDecimals={false}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="correct" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
          <Bar dataKey="incorrect" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="unanswered" stackId="a" fill="#64748b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
