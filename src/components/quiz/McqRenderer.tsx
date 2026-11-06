"use client";

import React, { useMemo } from "react";
import { OptionButton } from "./OptionButton";
import { QuestionRendererProps } from "@/types";
import { MatchFollowingRenderer } from "./MatchFollowingRenderer";
import { TableRenderer } from "./TableRenderer";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";
import { healOptionText } from "@/lib/optionTextHealer";

export function McqRenderer(props: QuestionRendererProps) {
  const { question, selected, onSelect, mode } = props;

  // Bulletproof safety fallback: If this question has match lists or table rows,
  // or contains match-the-following / table markers, delegate directly to the specialized renderer.
  const meta = (question?.meta as any) || {};
  if (meta.left && Array.isArray(meta.left) && meta.left.length > 0) {
    return <MatchFollowingRenderer {...props} />;
  }
  if (meta.rows && Array.isArray(meta.rows) && meta.rows.length > 0) {
    return <TableRenderer {...props} />;
  }

  const qText = (question as any)?.questionText || (question as any)?.question || "";
  if (
    qText &&
    /(?:सुमेलित|मिलान|तालिका|सारणी|सूची\s*[-–—:]*\s*[1I]|match.*following)/i.test(qText)
  ) {
    const enriched = enrichQuestionStructure(question);
    if (enriched.type === "match_following" && enriched.meta?.left?.length) {
      return <MatchFollowingRenderer {...props} question={enriched} />;
    }
    if (enriched.type === "table" && enriched.meta?.rows?.length) {
      return <TableRenderer {...props} question={enriched} />;
    }
  }

  const isReview = mode === "review";
  const rawCorrect = String(question.correctAnswer || question.answer || "").trim();

  return (
    <div className="space-y-2">
      {(question.options || []).map((opt: any, i: number) => {
        const optId = typeof opt === "string" ? `opt${i + 1}` : opt?.id || `opt${i + 1}`;
        const optText = healOptionText(typeof opt === "string" ? opt : opt?.text || "");

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
