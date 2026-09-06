"use client";

import { cn } from "@/lib/utils";
import { QuestionRendererProps } from "@/types";

export function TrueFalseRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const correctAnswer = question.correctAnswer as string;

  return (
    <div className="grid grid-cols-2 gap-3">
      {question.options.map((opt) => {
        const isCorrect = isReview && opt.id === correctAnswer;
        const isWrongPick = isReview && opt.id === selected && opt.id !== correctAnswer;
        const isSelected = selected === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={isReview}
            onClick={(e) => {
              e.preventDefault();
              if (!isReview) onSelect(opt.id);
            }}
            className={cn(
              "rounded-lg border py-4 text-center text-sm font-semibold min-h-12 transition-all duration-150 cursor-pointer select-none font-hindi",
              isSelected && !isReview && "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-sm text-primary font-bold",
              !isSelected && !isReview && "border-border bg-card hover:bg-muted/60 active:scale-[0.995]",
              isCorrect && "border-success bg-success/15 ring-2 ring-success/30 font-bold text-success",
              isWrongPick && "border-destructive bg-destructive/15 ring-2 ring-destructive/30 font-bold text-destructive",
              isReview && "cursor-default opacity-90"
            )}
          >
            {opt.text}
          </button>
        );
      })}
    </div>
  );
}
