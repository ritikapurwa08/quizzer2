"use client";

import { cn } from "@/lib/utils";

export type ReviewFilter = "all" | "correct" | "incorrect";

interface QuestionReviewFilterProps {
  value: ReviewFilter;
  onChange: (filter: ReviewFilter) => void;
  counts: {
    all: number;
    correct: number;
    incorrect: number;
  };
  className?: string;
}

const FILTERS: { value: ReviewFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "correct", label: "Correct" },
  { value: "incorrect", label: "Incorrect" },
];

/**
 * Filter tabs for the Question Review section.
 * Segmented pill control: All, Correct, Incorrect.
 * Does NOT mutate question arrays — filtering logic lives in the parent.
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
        "inline-flex items-center p-1 bg-muted/60 border border-border/80 rounded-xl gap-1 shadow-2xs",
        className
      )}
    >
      {/* Option: All */}
      <button
        type="button"
        onClick={() => onChange("all")}
        aria-pressed={value === "all"}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
          value === "all"
            ? "bg-background text-foreground shadow-2xs border border-border/60"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <span>All</span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums",
            value === "all"
              ? "bg-muted text-foreground"
              : "bg-muted/80 text-muted-foreground"
          )}
        >
          {counts.all}
        </span>
      </button>

      {/* Option: Correct */}
      <button
        type="button"
        onClick={() => onChange("correct")}
        aria-pressed={value === "correct"}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
          value === "correct"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs"
            : "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-muted"
        )}
      >
        <span>Correct</span>
        <span className="px-1.5 py-0.5 rounded-md text-[11px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">
          {counts.correct}
        </span>
      </button>

      {/* Option: Incorrect */}
      <button
        type="button"
        onClick={() => onChange("incorrect")}
        aria-pressed={value === "incorrect"}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
          value === "incorrect"
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-2xs"
            : "text-muted-foreground hover:text-rose-600 dark:hover:text-rose-300 hover:bg-muted"
        )}
      >
        <span>Incorrect</span>
        <span className="px-1.5 py-0.5 rounded-md text-[11px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold tabular-nums">
          {counts.incorrect}
        </span>
      </button>
    </div>
  );
}
