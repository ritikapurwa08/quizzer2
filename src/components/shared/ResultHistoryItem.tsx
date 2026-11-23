"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, formatScore } from "@/lib/utils";

interface ResultHistoryItemProps {
  attemptId: string;
  testSetId: string;
  testSetName: string;
  submittedAt: number;
  score?: number;
  totalQuestions: number;
  answers?: { isCorrect?: boolean }[];
  correctCount?: number;
  accuracy?: number;
}

function parseTitleAndPart(name: string) {
  const match = name.match(/(?:भाग|Part|Set)\s*(\d+)/i);
  const partNum = match ? match[1] : null;
  let cleanTitle = name
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  // Strip redundant leading "राजस्थान का / के / की " if long (>24 chars) so core topic name fits cleanly on 1 line
  if (cleanTitle.length > 24) {
    cleanTitle = cleanTitle.replace(/^राजस्थान (?:का|के|की)\s+/i, "");
  }

  const finalTitle = partNum ? `${cleanTitle || name} : ${partNum}` : cleanTitle || name;
  return { finalTitle };
}

export function ResultHistoryItem({
  testSetId,
  testSetName,
  submittedAt,
  score,
  totalQuestions,
  answers = [],
  correctCount: propCorrectCount,
  accuracy: propAccuracy,
}: ResultHistoryItemProps) {
  const maxScore = totalQuestions * 2;
  const correctCount =
    propCorrectCount !== undefined
      ? propCorrectCount
      : (answers || []).filter((a) => a.isCorrect).length;
  const accuracy =
    propAccuracy !== undefined
      ? propAccuracy
      : maxScore > 0 && score !== undefined
      ? (score / maxScore) * 100
      : totalQuestions > 0
      ? (correctCount / totalQuestions) * 100
      : 0;

  // Color-Coded Score Pill (Green > 70%, Yellow 40-70%, Red < 40%)
  let scoreBadgeClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (accuracy < 40) {
    scoreBadgeClass = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
  } else if (accuracy <= 70) {
    scoreBadgeClass = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
  }

  const formattedDate = new Date(submittedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const { finalTitle } = parseTitleAndPart(testSetName || "अभ्यास सेट");

  return (
    <Link
      href={`/quiz/${testSetId}/results`}
      className="block focus-visible:outline-hidden group"
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-md border border-border bg-card hover:bg-muted/50 transition-all select-none shadow-xs">
        {/* Left Side: Title & Meta Info (Date only, clutter removed) */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4
            className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors font-hindi leading-snug"
            title={finalTitle}
          >
            {finalTitle}
          </h4>
          <p className="text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight">
            {formattedDate}
          </p>
        </div>

        {/* Right Side: Color-Coded Score Capsule & Navigation Arrow */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {score !== undefined && (
            <span
              className={cn(
                "text-[11px] font-bold px-2.5 py-1 rounded-md border tabular-nums shrink-0",
                scoreBadgeClass
              )}
            >
              {formatScore(score)} / {maxScore}
            </span>
          )}

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
