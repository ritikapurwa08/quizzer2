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
  const partLabel = match ? (name.includes("भाग") ? `भाग ${match[1]}` : `Part ${match[1]}`) : "";
  let cleanTitle = name
    .replace(/(?:भाग|Part|Set)\s*\d+/i, "")
    .replace(/[-–—:]\s*$/, "")
    .trim();

  // Strip redundant leading "राजस्थान का / के / की " if long (>24 chars) so core topic name fits cleanly on 1 line
  if (cleanTitle.length > 24) {
    cleanTitle = cleanTitle.replace(/^राजस्थान (?:का|के|की)\s+/i, "");
  }

  return { cleanTitle: cleanTitle || name, partLabel };
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
  const correctCount =
    propCorrectCount !== undefined
      ? propCorrectCount
      : (answers || []).filter((a) => a.isCorrect).length;
  const accuracy =
    propAccuracy !== undefined
      ? propAccuracy
      : totalQuestions > 0
      ? (correctCount / totalQuestions) * 100
      : 0;
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
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-0 bg-secondary/50 hover:bg-muted/60 transition-all select-none shadow-xs">
        {/* Left Side: Title & Meta Info (Date · Total Qs · Correct Qs) */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Line 1: Title + Part Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h4
              className="text-xs sm:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors font-hindi leading-snug"
              title={cleanTitle}
            >
              {cleanTitle}
            </h4>
            {partLabel && (
              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-muted text-foreground border border-border font-mono">
                {partLabel}
              </span>
            )}
          </div>

          {/* Line 2: Date · Total Qs · Correct Qs */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight">
            <span>{formattedDate}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{totalQuestions} प्रश्न</span>
            <span className="text-border">·</span>
            <span className="tabular-nums font-medium text-emerald-500/90 dark:text-emerald-400">
              {correctCount} सही
            </span>
          </div>
        </div>

        {/* Right Side: Score Capsule [ 37.33 / 40 ] → (No redundant question/accuracy duplicates) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Score Capsule Badge */}
          {score !== undefined && (
            <span className="text-[11px] font-bold text-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border/60 tabular-nums shrink-0">
              {formatScore(score)} / {maxScore}
            </span>
          )}

          {/* Navigation Arrow */}
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
