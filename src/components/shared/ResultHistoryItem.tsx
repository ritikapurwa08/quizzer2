"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function parseTitleAndPart(name: string) {
  const match = name.match(/(?:भाग|Part|Set)\s*(\d+)/i);
  const partLabel = match ? (name.includes("भाग") ? `भाग ${match[1]}` : `Part ${match[1]}`) : "";
  const cleanTitle = name
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  return { cleanTitle: cleanTitle || name, partLabel };
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

  const formattedDate = new Date(submittedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const { cleanTitle, partLabel } = parseTitleAndPart(testSetName || "अभ्यास सेट");

  return (
    <Link
      href={`/quiz/${testSetId}/results`}
      className="block focus-visible:outline-hidden group"
    >
      <div className="flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all select-none shadow-2xs">
        {/* Left: Indicator Icon + Title + Date */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
              isPassed
                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/25"
                : "bg-destructive/15 text-destructive border border-destructive/25"
            )}
          >
            {isPassed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors font-hindi leading-snug">
                {cleanTitle}
              </h4>
              {partLabel && (
                <span className="shrink-0 text-[10px] font-black px-1.5 py-0.2 rounded bg-muted text-foreground border border-border/60 font-mono">
                  {partLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0 opacity-70" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="tabular-nums font-medium">{correctCount} of {totalQuestions} Correct</span>
            </div>
          </div>
        </div>

        {/* Right: Accuracy Pill + Score + Compact Review Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums border",
              isPassed
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {accuracy.toFixed(0)}%
          </Badge>

          {score !== undefined && (
            <span className="hidden sm:inline-flex text-[10.5px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 tabular-nums">
              {formatScore(score)} / {maxScore}
            </span>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] font-semibold rounded-lg text-muted-foreground group-hover:text-foreground group-hover:bg-muted gap-1 hidden xs:inline-flex cursor-pointer"
          >
            <span>Review</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
