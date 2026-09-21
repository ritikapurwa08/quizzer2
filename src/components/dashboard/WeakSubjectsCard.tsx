"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { Target, ArrowRight, AlertTriangle, CheckCircle2, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubjectDiagnosticItem {
  subjectId: string;
  name: string;
  nameHindi?: string;
  order?: number;
  totalQuestionsAttempted: number;
  correctQuestions: number;
  accuracy: number;
  isAttempted: boolean;
  status: "unattempted" | "weak" | "moderate" | "strong";
}

interface WeakSubjectsCardProps {
  breakdown?: SubjectDiagnosticItem[];
  subjects?: { name: string; accuracy: number }[];
}

function AccuracyRing({ percentage, status }: { percentage: number; status: string }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  const formatted = Math.round(percentage);

  const strokeColor =
    status === "weak"
      ? "stroke-destructive"
      : status === "moderate"
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  return (
    <div className="relative flex items-center justify-center h-11 w-11 shrink-0 select-none">
      <svg className="h-11 w-11" viewBox="0 0 42 42">
        <circle
          cx="21"
          cy="21"
          r={radius}
          strokeWidth="3.5"
          className="stroke-muted/40 fill-none"
        />
        <circle
          cx="21"
          cy="21"
          r={radius}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
          className={cn("fill-none transition-all duration-500 ease-out", strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-foreground leading-none tabular-nums tracking-tighter">
          {formatted}%
        </span>
      </div>
    </div>
  );
}

export function WeakSubjectsCard({ breakdown, subjects }: WeakSubjectsCardProps) {
  // Normalize data: prefer breakdown if provided, otherwise convert subjects array
  const items: SubjectDiagnosticItem[] = breakdown && breakdown.length > 0
    ? breakdown
    : (subjects || []).map((s, idx) => ({
        subjectId: `subject-${idx}`,
        name: s.name,
        nameHindi: s.name,
        totalQuestionsAttempted: 1,
        correctQuestions: Math.round(s.accuracy / 100),
        accuracy: s.accuracy,
        isAttempted: true,
        status: s.accuracy < 60 ? "weak" : s.accuracy < 80 ? "moderate" : "strong",
      }));

  const weakCount = items.filter((i) => i.status === "weak").length;

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Weak Areas & Subject Mastery
            </h2>
            {weakCount > 0 && (
              <Badge variant="destructive" className="text-[10.5px] px-2 py-0.5 rounded-full">
                {weakCount} {weakCount === 1 ? "Subject Needs Focus" : "Subjects Need Focus"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Subject-wise accuracy diagnosis across all canonical syllabus subjects.
          </p>
        </div>

        <Link
          href="/analytics"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-center shrink-0"
        >
          <span>Detailed Analytics</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Grid: 3-column on desktop, 2 on tablet, 1 on mobile */}
      {items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No subject data available"
          description="Take practice test sets to see your accuracy and weak area diagnosis here."
          className="py-6"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, idx) => {
            const displayName = item.nameHindi || item.name;

            return (
              <div
                key={item.subjectId}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 bg-card",
                  item.status === "weak"
                    ? "border-destructive/30 hover:border-destructive/60 hover:shadow-xs"
                    : item.status === "moderate"
                    ? "border-amber-500/25 hover:border-amber-500/50 hover:shadow-xs"
                    : item.status === "strong"
                    ? "border-emerald-500/25 hover:border-emerald-500/50 hover:shadow-xs"
                    : "border-border/70 hover:border-border"
                )}
              >
                {/* Header row: Index number + Subject Hindi Title */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground shrink-0 mt-0.5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground font-hindi leading-snug line-clamp-2">
                      {displayName}
                    </h3>
                  </div>
                </div>

                {/* Body row: Progress / Accuracy & Status */}
                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/40">
                  {item.isAttempted ? (
                    <>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.status === "weak" && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20">
                              <AlertTriangle className="h-3 w-3" /> Needs Practice
                            </span>
                          )}
                          {item.status === "moderate" && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              <Clock className="h-3 w-3" /> On Track
                            </span>
                          )}
                          {item.status === "strong" && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" /> Mastered
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {item.correctQuestions} of {item.totalQuestionsAttempted} correct
                        </p>
                      </div>
                      <AccuracyRing percentage={item.accuracy} status={item.status} />
                    </>
                  ) : (
                    <div className="flex items-center justify-between w-full py-1">
                      <span className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-muted-foreground/60" />
                        Not attempted yet
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Action: Quick Link */}
                <Button
                  asChild
                  variant={item.status === "weak" ? "destructive" : "outline"}
                  size="sm"
                  className={cn(
                    "w-full h-8 rounded-lg text-xs font-semibold gap-1.5 mt-0.5",
                    item.status === "weak"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Link href={`/subjects/${item.subjectId}`}>
                    {item.status === "weak" ? (
                      <>
                        <span>Practice Weak Topics</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    ) : item.isAttempted ? (
                      <>
                        <span>Practice More</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Start Test</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
