"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatScore } from "@/lib/utils";

interface ResultHistoryItemProps {
  attemptId: string;
  testSetId: string;
  testSetName: string;
  submittedAt: number;
  score?: number;
  totalQuestions: number;
  answers: { isCorrect?: boolean }[];
}

export function ResultHistoryItem({
  testSetId,
  testSetName,
  submittedAt,
  score,
  totalQuestions,
  answers,
}: ResultHistoryItemProps) {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const isPassed = accuracy >= 60;
  const maxScore = totalQuestions * 2;

  const formattedDate = new Date(submittedAt).toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      href={`/quiz/${testSetId}/results`}
      className="block focus-visible:outline-hidden group"
    >
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all select-none shadow-xs">
        {/* Left: Indicator Icon + Title + Date */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              isPassed
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                : "bg-destructive/15 text-destructive border border-destructive/25"
            )}
          >
            {isPassed ? (
              <CheckCircle2 className="h-4.5 w-4.5" />
            ) : (
              <XCircle className="h-4.5 w-4.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors font-hindi leading-snug">
              {testSetName || "अभ्यास सेट"}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
              <Calendar className="h-3 w-3 shrink-0 opacity-70" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right: Accuracy Pill + Score + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-bold px-2.5 py-0.5 rounded-full tabular-nums border",
              isPassed
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {accuracy.toFixed(0)}%
          </Badge>

          {score !== undefined && (
            <span className="hidden sm:inline-flex text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 tabular-nums">
              {formatScore(score)} / {maxScore}
            </span>
          )}

          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}
