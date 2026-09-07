"use client";

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
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

  return (
    <Link
      href={`/quiz/${testSetId}/results`}
      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 hover:border-primary/50 transition-all group select-none"
    >
      {/* Left: indicator + name + date */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isPassed
              ? "bg-green-500/10 text-green-500"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {isPassed ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors font-hindi">
            {testSetName || "अभ्यास सेट"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {new Date(submittedAt).toLocaleDateString("hi-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Right: accuracy badge + score */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums font-hindi",
            isPassed
              ? "bg-green-500/10 text-green-600 border border-green-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20",
          )}
        >
          {accuracy.toFixed(0)}%
        </span>
        <span className="hidden sm:inline text-[11px] font-bold px-2 py-1 rounded-lg bg-muted text-foreground tabular-nums font-hindi">
          {formatScore(score ?? 0)}/{maxScore}
        </span>
      </div>
    </Link>
  );
}
