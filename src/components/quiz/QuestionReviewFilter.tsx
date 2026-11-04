"use client";

import { cn } from "@/lib/utils";

export type ReviewFilter = "all" | "correct" | "incorrect" | "unattempted";

interface QuestionReviewFilterProps {
  value: ReviewFilter;
  onChange: (filter: ReviewFilter) => void;
  counts: {
    all: number;
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  className?: string;
}

/**
 * Authoritative 4-option Filter tabs for the Question Review section:
 * All | Correct | Incorrect | Unattempted
 */
export function QuestionReviewFilter({
  value,
  onChange,
  counts,
  className,
}: QuestionReviewFilterProps) {
  return (
    <div
      role="group"
      aria-label="Question Filter"
      className={cn(
        "inline-flex items-center p-1 bg-muted/60 border border-border/80 rounded-xl gap-1 shadow-2xs overflow-x-auto max-w-full",
        className
      )}
    >
      {/* 1. All */}
      <button
        type="button"
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap",
          value === "all"
            ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span>All</span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-md text-[10.5px] sm:text-[11px] font-bold tabular-nums",
            value === "all"
              ? "bg-muted text-foreground"
              : "bg-muted/80 text-muted-foreground"
          )}
        >
          {counts.all}
        </span>
      </button>

      {/* 2. Correct */}
      <button
        type="button"
        onClick={() => onChange("correct")}
        aria-pressed={value === "correct"}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap",
          value === "correct"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs font-bold"
            : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-muted"
        )}
      >
        <span>Correct</span>
        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] sm:text-[11px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
          {counts.correct}
        </span>
      </button>

      {/* 3. Incorrect */}
      <button
        type="button"
        onClick={() => onChange("incorrect")}
        aria-pressed={value === "incorrect"}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap",
          value === "incorrect"
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-2xs font-bold"
            : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300 hover:bg-muted"
        )}
      >
        <span>Incorrect</span>
        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] sm:text-[11px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold tabular-nums">
          {counts.incorrect}
        </span>
      </button>

      {/* 4. Unattempted */}
      <button
        type="button"
        onClick={() => onChange("unattempted")}
        aria-pressed={value === "unattempted"}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none whitespace-nowrap",
          value === "unattempted"
            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs font-bold"
            : "text-muted-foreground hover:text-amber-600 dark:hover:text-amber-300 hover:bg-muted"
        )}
      >
        <span>Unattempted</span>
        <span className="px-1.5 py-0.5 rounded-md text-[10.5px] sm:text-[11px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold tabular-nums">
          {counts.unattempted}
        </span>
      </button>
    </div>
  );
}
