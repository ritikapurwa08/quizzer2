"use client";

import { OptionButton } from "./OptionButton";
import { QuestionRendererProps } from "@/types";

export function McqRenderer({ question, selected, onSelect, mode }: QuestionRendererProps) {
  const isReview = mode === "review";
  const rawCorrect = String(question.correctAnswer || "").trim();

  return (
    <div className="space-y-2">
      {(question.options || []).map((opt: any, i: number) => {
        const optId = typeof opt === "string" ? `opt${i + 1}` : opt?.id || `opt${i + 1}`;
        const optText = typeof opt === "string" ? opt : opt?.text || "";

        let correctness: "correct" | "incorrect" | "neutral" | undefined;
        if (isReview) {
          const isThisCorrect =
            rawCorrect === optId ||
            rawCorrect === optText ||
            (rawCorrect.toUpperCase() === "A" && i === 0) ||
            (rawCorrect.toUpperCase() === "B" && i === 1) ||
            (rawCorrect.toUpperCase() === "C" && i === 2) ||
            (rawCorrect.toUpperCase() === "D" && i === 3) ||
            (rawCorrect === "1" && i === 0) ||
            (rawCorrect === "2" && i === 1) ||
            (rawCorrect === "3" && i === 2) ||
            (rawCorrect === "4" && i === 3);

          if (isThisCorrect) correctness = "correct";
          else if (selected === optId || selected === optText) correctness = "incorrect";
        }
        return (
          <OptionButton
            key={optId}
            id={optId}
            text={optText}
            selected={selected === optId || selected === optText}
            onClick={() => !isReview && onSelect(optId)}
            disabled={isReview}
            correctness={correctness}
          />
        );
      })}
    </div>
  );
}
