"use client";

import { useMemo } from "react";
import { Award, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function SubjectAccuracyChart({ data }: SubjectAccuracyChartProps) {
  // Sort subjects by accuracy descending, then by attempted count
  const sortedSubjects = useMemo(() => {
    return [...(data || [])].sort((a, b) => {
      const aAttempted = a.attempted ?? a.total ?? 0;
      const bAttempted = b.attempted ?? b.total ?? 0;
      if (aAttempted > 0 && bAttempted === 0) return -1;
      if (bAttempted > 0 && aAttempted === 0) return 1;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return bAttempted - aAttempted;
    });
  }, [data]);

  const attemptedCount = sortedSubjects.filter(
    (s) => (s.attempted ?? s.total ?? 0) > 0
  ).length;

  return (
    <Card className="rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between overflow-hidden">
      <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Subject Accuracy & Mastery
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              5 Canonical Rajasthan subjects ranked by accuracy (highest to lowest)
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg border border-border/60 shrink-0">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>
              <strong className="text-foreground font-semibold">{attemptedCount}</strong> of 5 Attempted
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-1">
        {sortedSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No subject data available
            </p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Complete test sets in Rajasthan subjects to track your accuracy and question progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedSubjects.map((subject, index) => {
              const accuracy = subject.accuracy;
              const attempted = subject.attempted ?? subject.total ?? 0;
              const remaining = subject.remaining ?? 0;
              const totalAvailable = subject.totalAvailable ?? (attempted + remaining);
              const isAttempted = attempted > 0;

              // Color coding: green for high, amber for medium, red/muted for low
              let barColor = "bg-primary";
              let badgeColor = "text-muted-foreground bg-muted border-border/40";
              if (isAttempted) {
                if (accuracy >= 75) {
                  barColor = "bg-emerald-500 dark:bg-emerald-400";
                  badgeColor =
                    "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
                } else if (accuracy >= 50) {
                  barColor = "bg-amber-500 dark:bg-amber-400";
                  badgeColor =
                    "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/20";
                } else {
                  barColor = "bg-rose-500 dark:bg-rose-400";
                  badgeColor =
                    "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20";
                }
              }

              return (
                <div
                  key={subject.id || index}
                  className="p-2.5 sm:p-3 rounded-xl bg-muted/25 border border-border/60 hover:bg-muted/40 transition-colors"
                >
                  {/* Top: Rank, Hindi Subject Name, Accuracy Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-foreground truncate font-hindi">
                        {subject.nameHindi || subject.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAttempted ? (
                        <span className={cn("px-2 py-0.5 rounded-md text-xs font-bold font-mono border", badgeColor)}>
                          {accuracy}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-muted-foreground bg-muted/60 border border-border/40">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Progress bar */}
                  <div className="mt-2 h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor)}
                      style={{ width: `${isAttempted ? Math.max(3, accuracy) : 0}%` }}
                    />
                  </div>

                  {/* Bottom: Questions Attempted vs Remaining */}
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>
                        Attempted:{" "}
                        <strong className="font-mono text-foreground font-semibold">
                          {attempted}
                        </strong>
                      </span>
                      <span className="text-border">•</span>
                      <span>
                        Remaining:{" "}
                        <strong className="font-mono text-foreground font-semibold">
                          {remaining}
                        </strong>
                      </span>
                    </div>

                    {totalAvailable > 0 && (
                      <span className="text-muted-foreground/70 text-[10px]">
                        Pool: {totalAvailable} Qs
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
