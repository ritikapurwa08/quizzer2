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
      aria-label="प्रश्न नेविगेशन पैलेट"
      className={cn(
        "grid grid-cols-5 gap-2 sm:gap-2.5 p-3 rounded-2xl border border-border bg-card shadow-xs",
        className
      )}
    >
      {questions.map((q, i) => {
        const isCurrent = i === currentIndex;
        const statusLabel = isCurrent
          ? "वर्तमान प्रश्न"
          : q.answered
          ? "उत्तर दिया गया"
          : "अनुत्तरित";
        const bookmarkLabel = q.bookmarked ? ", बुकमार्क किया गया" : "";

        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`प्रश्न ${i + 1} (${statusLabel}${bookmarkLabel})`}
            title={`प्रश्न ${i + 1}: ${statusLabel}`}
            className={cn(
              "relative flex h-10 w-full min-w-9 items-center justify-center rounded-xl border text-xs sm:text-sm font-semibold tabular-nums transition-colors select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
              // Current Active Question
              isCurrent
                ? "border-primary bg-primary text-primary-foreground shadow-xs font-bold"
                : q.answered
                ? "border-success/40 bg-success/15 text-success hover:bg-success/25"
                : "border-border/80 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
            )}
          >
            {i + 1}
            {/* Bookmark indicator */}
            {q.bookmarked && (
              <span
                className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-card shadow-xs"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

