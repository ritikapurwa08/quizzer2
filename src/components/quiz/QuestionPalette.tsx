"use client";

import { cn } from "@/lib/utils";

interface PaletteQuestion {
  id: string;
  answered: boolean;
  bookmarked: boolean;
}

interface QuestionPaletteProps {
  questions: PaletteQuestion[];
  currentIndex: number;
  onJump: (index: number) => void;
  className?: string;
}

export function QuestionPalette({
  questions,
  currentIndex,
  onJump,
  className,
}: QuestionPaletteProps) {
  return (
    <div
      role="navigation"
      aria-label="Question Navigation Palette"
      className={cn(
        "grid grid-cols-5 gap-2 sm:gap-2.5 p-3 rounded-2xl border border-border bg-card shadow-xs",
        className
      )}
    >
      {questions.map((q, i) => {
        const isCurrent = i === currentIndex;
        const statusLabel = isCurrent
          ? "Current question"
          : q.answered
          ? "Answered"
          : "Unanswered";
        const bookmarkLabel = q.bookmarked ? ", bookmarked" : "";

        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`Question ${i + 1} (${statusLabel}${bookmarkLabel})`}
            title={`Question ${i + 1}: ${statusLabel}`}
            className={cn(
              "relative flex h-10 w-full min-w-9 items-center justify-center rounded-xl border text-xs sm:text-sm font-semibold tabular-nums transition-colors select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              // Current Active Question
              isCurrent
                ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                : q.answered
                ? "border-foreground/30 bg-muted text-foreground hover:border-foreground/50 font-medium"
                : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
            )}
          >
            {i + 1}
            {/* Bookmark indicator */}
            {q.bookmarked && (
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-foreground ring-2 ring-card shadow-xs"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

