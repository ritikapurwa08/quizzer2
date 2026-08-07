"use client";

import { cn } from "@/lib/utils";
import { QuestionRendererProps } from "@/types";
import { OptionButton } from "./OptionButton";

interface MatchItem {
  id: string;
  text: string;
}

export function MatchFollowingRenderer({
  question,
  selected,
  onSelect,
  mode,
}: QuestionRendererProps) {
  const isReview = mode === "review";
  const metaObj = (question.meta as any) || {};
  const rawLeft = metaObj.left ?? metaObj.columnA ?? [];
  const rawRight = metaObj.right ?? metaObj.columnB ?? [];

  // Normalize columnA items this 
  const columnA: MatchItem[] = rawLeft.map((item: any, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.\:-]?\s*(.*)/);
      const matchedId = match && match[1] ? match[1].toUpperCase() : String.fromCharCode(65 + idx);
      return {
        id: matchedId,
        text: item,
      };
    }
    return {
      id: item.id || String.fromCharCode(65 + idx),
      text: item.text || String(item),
    };
  });

  // Normalize columnB items
  const columnB: MatchItem[] = rawRight.map((item: any, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.\:-]?\s*(.*)/);
      return {
        id: match ? match[1] : String(idx + 1),
        text: item,
      };
    }
    return {
      id: item.id || String(idx + 1),
      text: item.text || String(item),
    };
  });

  // Safely extract correct pairs array
  let correctPairs: string[] = [];
  if (Array.isArray(question.correctAnswer)) {
    correctPairs = question.correctAnswer as string[];
  } else if (typeof question.correctAnswer === "string") {
    const matchedOpt = question.options?.find(
      (o) => o.id === question.correctAnswer
    );
    const optText = matchedOpt ? matchedOpt.text : question.correctAnswer;
    correctPairs =
      optText.match(/[A-Za-z0-9]+\s*-\s*[A-Za-z0-9]+/g)?.map((p) => p.replace(/\s+/g, "")) || [];
  }

  const selectedValue = typeof selected === "string" ? selected : "";

  return (
    <div className="space-y-4">
      {/* Side-by-side Column Reference Display */}
      {(columnA.length > 0 || columnB.length > 0) && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-muted/40 p-2.5 sm:p-4 rounded-xl border border-border">
          {/* Column A (List I) */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            <h4 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
              List - I (सूची - I)
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-foreground font-medium">
              {columnA.map((item) => (
                <li
                  key={item.id}
                  className="bg-card p-1.5 sm:p-2 rounded border border-border/60 break-words leading-tight"
                >
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Column B (List II) */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0">
            <h4 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">
              List - II (सूची - II)
            </h4>
            <ul className="space-y-1 sm:space-y-1.5 text-[11px] sm:text-xs text-foreground font-medium">
              {columnB.map((item) => (
                <li
                  key={item.id}
                  className="bg-card p-1.5 sm:p-2 rounded border border-border/60 break-words leading-tight"
                >
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Multiple-Choice Option Buttons */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-muted-foreground">
          Select the correct combination:
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
    </div>
  );
}
