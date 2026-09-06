"use client";

import { cn, containsDevanagari } from "@/lib/utils";
import { QuestionRendererProps } from "@/types";
import { OptionButton } from "./OptionButton";

interface SeqItem {
  id: string;
  text: string;
}

export function SequenceRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const meta = (question.meta as any) || {};
  const rawItems = meta.items ?? [];

  // Normalize items array
  const items: SeqItem[] = rawItems.map((item: any, idx: number) => {
    if (typeof item === "string") {
      return { id: `item-${idx + 1}`, text: item };
    }
    return { id: item.id || `item-${idx + 1}`, text: item.text || String(item) };
  });

  const selectedValue = typeof selected === "string" ? selected : "";

  return (
    <div className="space-y-4">
      {/* Items Reference Display */}
      {items.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3.5">
          <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
            Sequence Items (क्रमानुसार सूची):
          </h4>
          <ol className="space-y-2">
            {items.map((item, idx) => {
              const isHindi = containsDevanagari(item.text);
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-border/70 bg-card px-3.5 py-2.5"
                >
                  {/* Sequence number badge */}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold mt-0.5">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {/* Item text */}
                  <span
                    className={cn(
                      "flex-1 text-sm text-foreground font-normal leading-relaxed break-words overflow-wrap-anywhere",
                      isHindi && "font-hindi"
                    )}
                  >
                    {item.text}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Multiple-Choice Option Buttons */}
      {question.options && question.options.length > 0 && (
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Select the correct sequence order:
          </h4>
          {question.options.map((option) => {
            const isSelected = selectedValue === option.id;
            let correctness: "correct" | "incorrect" | "neutral" | undefined = undefined;

            if (isReview) {
              if (option.id === question.correctAnswer) {
                correctness = "correct";
              } else if (isSelected && option.id !== question.correctAnswer) {
                correctness = "incorrect";
              } else {
                correctness = "neutral";
              }
            }

            return (
              <OptionButton
                key={option.id}
                id={option.id}
                text={option.text}
                selected={isSelected}
                disabled={isReview}
                correctness={correctness}
                onClick={() => onSelect(option.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
