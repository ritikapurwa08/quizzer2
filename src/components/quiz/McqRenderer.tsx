"use client";

import { OptionButton } from "./OptionButton";
import { QuestionRendererProps } from "@/types";

export function McqRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const correctAnswer = question.correctAnswer as string;

  return (
    <div className="space-y-2">
      {question.options.map((opt) => {
        let correctness: "correct" | "incorrect" | "neutral" | undefined;
        if (isReview) {
          if (opt.id === correctAnswer) correctness = "correct";
          else if (opt.id === selected) correctness = "incorrect";
        }
        return (
          <OptionButton
            key={opt.id}
            id={opt.id}
            text={opt.text}
            selected={selected === opt.id}
            onClick={() => !isReview && onSelect(opt.id)}
            disabled={isReview}
            correctness={correctness}
          />
        );
      })}
    </div>
  );
}
