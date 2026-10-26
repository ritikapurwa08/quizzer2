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
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  const formatted = Math.round(percentage);

  const strokeColor =
    status === "weak"
      ? "stroke-rose-500"
      : status === "moderate"
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  return (
    <div className="relative flex items-center justify-center h-12 w-12 shrink-0 select-none">
      <svg className="h-12 w-12" viewBox="0 0 44 44">
        <circle
          cx="22"
          cy="22"
          r={radius}
          strokeWidth="3.5"
          className="stroke-muted/30 fill-none"
        />
        <circle
          cx="22"
          cy="22"
          r={radius}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          className={cn("fill-none transition-all duration-500 ease-out", strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[11px] font-bold text-foreground leading-none tabular-nums tracking-tight">
          {formatted}%
        </span>
      </div>
    </div>
  );
}

export function WeakSubjectsCard({ breakdown, subjects }: WeakSubjectsCardProps) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Target className="h-4 w-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
              Subject Mastery & Accuracy
            </h2>
            {weakCount > 0 && (
              <Badge variant="destructive" className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-semibold">
                {weakCount} {weakCount === 1 ? "Needs Focus" : "Need Focus"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accuracy and performance breakdown across the 4 core Rajasthan GK subjects
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

      {items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No subject data available"
          description="Take practice test sets to see your accuracy and weak area diagnosis here."
          className="py-6"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {items.map((item, idx) => {
            const displayName = item.nameHindi || item.name;

            return (
              <div
                key={item.subjectId}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col justify-between gap-3.5 bg-card/60 hover:bg-card relative overflow-hidden group shadow-xs",
                  item.status === "weak"
                    ? "border-rose-500/30 hover:border-rose-500/60"
                    : item.status === "moderate"
                    ? "border-amber-500/30 hover:border-amber-500/60"
                    : item.status === "strong"
                    ? "border-emerald-500/30 hover:border-emerald-500/60"
                    : "border-border/70 hover:border-border"
                )}
              >
                {/* Top: Index + Subject Title + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground shrink-0 tabular-nums">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-semibold text-xs sm:text-sm text-foreground font-hindi leading-snug truncate">
                      {displayName}
                    </h3>
                  </div>

                  {item.isAttempted && (
                    <div className="shrink-0">
                      {item.status === "weak" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> Needs Practice
                        </span>
                      )}
                      {item.status === "moderate" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Clock className="h-3 w-3" /> On Track
                        </span>
                      )}
                      {item.status === "strong" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Mastered
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: Progress stats & Accuracy Ring */}
                {item.isAttempted ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div>
                        <div className="text-base font-bold text-foreground tabular-nums tracking-tight">
                          {item.correctQuestions}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            of {item.totalQuestionsAttempted} correct
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Accuracy: <strong className="text-foreground">{Math.round(item.accuracy)}%</strong>
                        </p>
                      </div>
                      <AccuracyRing percentage={item.accuracy} status={item.status} />
                    </div>

                    {/* Subtle Horizontal Mastery Line */}
                    <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          item.status === "weak"
                            ? "bg-rose-500"
                            : item.status === "moderate"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, item.accuracy))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground italic">
                    <BookOpen className="h-4 w-4 text-muted-foreground/60" />
                    <span>No tests attempted yet</span>
                  </div>
                )}

                {/* Bottom Action Button */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full h-8.5 rounded-xl text-xs font-semibold gap-1.5 transition-all cursor-pointer mt-1 border",
                    item.status === "weak"
                      ? "border-rose-500/30 hover:bg-rose-500/10 text-rose-300 hover:text-rose-200"
                      : item.status === "moderate"
                      ? "border-amber-500/30 hover:bg-amber-500/10 text-amber-300 hover:text-amber-200"
                      : "border-border/80 hover:bg-muted text-foreground"
                  )}
                >
                  <Link href={`/subjects/${item.subjectId}`}>
                    <span>
                      {item.status === "weak"
                        ? "Practice Weak Topics"
                        : item.isAttempted
                        ? "Practice More"
                        : "Start Test"}
                    </span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
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
