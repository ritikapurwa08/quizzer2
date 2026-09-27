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
 * Displays counts next to each label.
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
        "inline-flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/80 backdrop-blur-xs gap-0.5",
        className
      )}
    >
      {FILTERS.map((filter) => {
        const isActive = value === filter.value;
        const count = counts[filter.value];

        // Refined active styling tailored to filter tone without harsh white bulbs
        const activeStyles =
          filter.value === "correct"
            ? "bg-card text-emerald-500 dark:text-emerald-400 font-semibold shadow-2xs border border-emerald-500/30"
            : filter.value === "incorrect"
            ? "bg-card text-rose-500 dark:text-rose-400 font-semibold shadow-2xs border border-rose-500/30"
            : "bg-card text-foreground font-semibold shadow-2xs border border-border/70";

        const badgeActiveStyles =
          filter.value === "correct"
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            : filter.value === "incorrect"
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
            : "bg-primary/10 text-primary border border-primary/20";

        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer select-none",
              isActive
                ? activeStyles
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
            )}
          >
            {filter.label}
            <span
              className={cn(
                "inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums transition-colors",
                isActive
                  ? badgeActiveStyles
                  : "bg-background/60 text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
