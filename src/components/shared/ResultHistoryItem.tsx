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
  answers: { isCorrect?: boolean }[];
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
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-0 bg-secondary/50 hover:bg-muted/60 transition-all select-none shadow-xs">
        {/* Left Side: Title & Meta Info (Maximum Horizontal Space — Left Icon Removed) */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Line 1: Title + Part Badge with Full Horizontal Room */}
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

          {/* Line 2: Date on mobile; Date · Total Qs & Correct on Desktop */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight">
            <span>{formattedDate}</span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline tabular-nums">{totalQuestions} प्रश्न</span>
            <span className="hidden sm:inline text-border">·</span>
            <span className="hidden sm:inline tabular-nums font-medium text-foreground/85">{correctCount} सही</span>
          </div>
        </div>

        {/* Right Side: The Exact Red-Circled UI [ 70% ] [ 24 / 40 ] → */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Accuracy Capsule Badge */}
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums border leading-none tracking-tight inline-flex items-center justify-center",
              isPassed
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            )}
          >
            {accuracy.toFixed(0)}%
          </span>

          {/* Score Capsule Badge */}
          {score !== undefined && (
            <span className="text-[10.5px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 tabular-nums shrink-0">
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
