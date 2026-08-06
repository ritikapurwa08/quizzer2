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

export function QuestionPalette({ questions, currentIndex, onJump }: QuestionPaletteProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-5 gap-2">
      {questions.map((q, i) => (
        <button
          key={q.id}
          onClick={() => onJump(i)}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-md border text-sm font-medium",
            i === currentIndex && "ring-2 ring-primary",
            q.answered ? "border-success bg-success/10" : "border-border bg-muted",
          )}
        >
          {i + 1}
          {q.bookmarked && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </button>
      ))}
    </div>
  );
}
