"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Sequence Items (क्रमानुसार सूची):
          </h4>
          <ol className="space-y-1.5 list-decimal pl-5 text-xs text-foreground font-medium">
            {items.map((item) => (
              <li key={item.id} className="bg-card p-2 rounded border border-border/60">
                {item.text}
              </li>
            ))}
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
