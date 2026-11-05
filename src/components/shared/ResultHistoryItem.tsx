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
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all select-none shadow-2xs">
        {/* Left: Title + Part badge on Line 1; Date + Questions + Correct on Line 2 */}
        <div className="min-w-0 flex-1 space-y-0.5">
          {/* Line 1: Title · Part Number */}
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors font-hindi leading-snug">
              {cleanTitle}
            </h4>
            {partLabel && (
              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-muted text-foreground border border-border/70 font-mono">
                {partLabel}
              </span>
            )}
          </div>

          {/* Line 2: Date · 20 प्रश्न · 0 सही */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] text-muted-foreground leading-tight">
            <span>{formattedDate}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{totalQuestions} प्रश्न</span>
            <span className="text-border">·</span>
            <span className="tabular-nums font-medium text-foreground/85">{correctCount} सही</span>
          </div>
        </div>

        {/* Right: Accuracy Pill (Green >= 60%, Red < 60%) + Marks + Clean Arrow */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            {/* Accuracy with green/red color */}
            <span
              className={cn(
                "text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums border leading-none tracking-tight",
                isPassed
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              )}
            >
              {accuracy.toFixed(0)}%
            </span>

            {/* Score in Points / Max Marks */}
            {score !== undefined && (
              <span className="text-[10px] sm:text-[10.5px] font-medium text-muted-foreground tabular-nums">
                {formatScore(score)}/{maxScore} अंक
              </span>
            )}
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-150 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
