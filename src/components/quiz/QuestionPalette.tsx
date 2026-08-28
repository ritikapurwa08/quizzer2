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
}

export function QuestionPalette({
  questions,
  currentIndex,
  onJump,
}: QuestionPaletteProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-5 gap-2">
      {questions.map((q, i) => {
        const isCurrent = i === currentIndex;
        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`प्रश्न ${i + 1}${q.answered ? " (हल किया गया)" : ""}${q.bookmarked ? " (बुकमार्क)" : ""}`}
            className={cn(
              // Base: 40-44px touch target, tabular-nums
              "relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border text-xs sm:text-sm font-bold tabular-nums transition-all select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary",
              // Current Active Question
              isCurrent
                ? "border-primary bg-primary/20 text-primary ring-2 ring-primary ring-offset-1 ring-offset-background z-10 shadow-xs"
                : q.answered
                ? "border-success/50 bg-success/15 text-success hover:bg-success/25"
                : "border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
            )}
          >
            {i + 1}
            {/* Bookmark dot */}
            {q.bookmarked && (
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-background"
                title="बुकमार्क किया गया"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
