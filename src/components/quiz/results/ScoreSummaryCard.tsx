"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/utils";
import {
  RotateCcw,
  FileDown,
  Share2,
  ArrowRight,
  LayoutList,
  CheckCircle2,
  XCircle,
  Minus,
  Trash2,
} from "lucide-react";

interface ScoreSummaryCardProps {
  setName?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  testSetId: string;
  nextSet?: any | null;
  activeFilter?: string;
  onPrint: () => void;
  onShare: () => void;
  onDiscardAttempt?: () => void;
  isDiscarding?: boolean;
}

export function ScoreSummaryCard({
  setName,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
  testSetId,
  nextSet,
  activeFilter,
  onPrint,
  onShare,
  onDiscardAttempt,
  isDiscarding,
}: ScoreSummaryCardProps) {
  const totalMarks = totalQuestions * 2;

  return (
    <Card className="p-5 sm:p-6 border border-border shadow-xs rounded-2xl text-center bg-card">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 font-hindi">
        {setName || "Test Result"}
      </p>

      {/* Score */}
      <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground tabular-nums mb-3">
        {formatScore(score)}
        <span className="text-lg sm:text-xl text-muted-foreground font-semibold">
          {" "}
          / {totalMarks} pts
        </span>
      </p>

      {/* Stats: correct / incorrect / unanswered */}
      <div className="flex items-center justify-center gap-4 mb-2 text-xs flex-wrap">
        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {correctCount} Correct (+{correctCount * 2})
        </span>
        <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {incorrectCount} Incorrect (-{((incorrectCount * 2) / 3).toFixed(2)})
        </span>
        {unansweredCount > 0 && (
          <span className="flex items-center gap-1 font-semibold text-muted-foreground">
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            {unansweredCount} Skipped (0)
          </span>
        )}
      </div>

      {/* Canonical Scoring Rule Note */}
      <p className="text-[11px] text-muted-foreground mb-6">
        Standard RPSC Scoring: +2 marks per correct answer · 1/3 negative marking (-0.67 per incorrect)
      </p>

      {/* ACTION BUTTONS: Retake (Left) | Discard (if 0-score) | PDF | Share Result | Next Set (Right) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* 1. Left side: Retake Test & Discard Attempt */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs"
          >
            <Link href={`/quiz/${testSetId}?retake=true`}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retake Test
            </Link>
          </Button>

          {onDiscardAttempt && score <= 0 && unansweredCount === totalQuestions && (
            <Button
              type="button"
              variant="outline"
              onClick={onDiscardAttempt}
              disabled={isDiscarding}
              className="font-semibold text-xs h-10 px-3 rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 gap-1.5 cursor-pointer shadow-2xs"
              title="Discard this abandoned 0-score attempt so it doesn't affect your analytics"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isDiscarding ? "Discarding..." : "Discard Result"}
            </Button>
          )}
        </div>

        {/* 2 & 3. Middle: PDF & Share Result */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onPrint}
            className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs text-foreground"
            title={`Export ${
              activeFilter === "incorrect"
                ? "Mistakes"
                : activeFilter === "correct"
                ? "Correct"
                : activeFilter === "unattempted"
                ? "Unattempted"
                : "All"
            } as PDF`}
          >
            <FileDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>PDF</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onShare}
            className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs text-foreground"
            title="Share test result"
          >
            <Share2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span>Share Result</span>
          </Button>
        </div>

        {/* 4. Right side: Next Set */}
        {nextSet ? (
          <Button
            asChild
            className="font-bold text-xs h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
          >
            <Link href={`/quiz/${nextSet._id || (nextSet as any).id}`}>
              Next Set
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button
            asChild
            className="font-bold text-xs h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
          >
            <Link href="/subjects">
              <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
              Next Set
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

