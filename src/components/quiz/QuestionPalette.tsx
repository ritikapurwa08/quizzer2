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
      {questions.map((q, i) => (
        <button
          key={q.id}
          onClick={() => onJump(i)}
          aria-label={`Go to question ${i + 1}${q.answered ? " (answered)" : ""}${q.bookmarked ? " (bookmarked)" : ""}`}
          className={cn(
            // Base
            "relative flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition-all cursor-pointer hover:scale-105 active:scale-95",
            // Current
            i === currentIndex && "ring-2 ring-primary ring-offset-1",
            // Answered / unanswered
            q.answered
              ? "border-success/60 bg-success/10 text-success"
              : "border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          {i + 1}
          {/* Bookmark dot */}
          {q.bookmarked && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-1 ring-background" />
          )}
        </button>
      ))}
    </div>
  );
}
