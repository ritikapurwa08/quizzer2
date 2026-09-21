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
      className={cn("flex items-center gap-1", className)}
    >
      {FILTERS.map((filter) => {
        const isActive = value === filter.value;
        const count = counts[filter.value];
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer select-none",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {filter.label}
            <span
              className={cn(
                "inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 text-[10px] font-bold tabular-nums",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
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
