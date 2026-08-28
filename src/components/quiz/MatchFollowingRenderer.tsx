"use client";

import { cn, containsDevanagari } from "@/lib/utils";
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
  let rawLeft = metaObj.left ?? metaObj.columnA ?? [];
  let rawRight = metaObj.right ?? metaObj.columnB ?? [];

  if ((!rawLeft || rawLeft.length === 0) && (!rawRight || rawRight.length === 0) && question.questionText) {
    const text = question.questionText;
    const list2Regex = /(?:\r?\n|^)\s*(?:सूची|List|Column)\s*[-–—:]?\s*(?:II|2|B)\b/i;
    const match2 = text.match(list2Regex);
    if (match2 && match2.index !== undefined) {
      const part1 = text.slice(0, match2.index);
      const part2 = text.slice(match2.index);
      const itemRegex = /^(?:[A-D1-4][\.\):]|\([A-D1-4]\))\s*(.*)/;
      const extractedLeft: string[] = [];
      const extractedRight: string[] = [];
      part1.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (itemRegex.test(trimmed)) extractedLeft.push(trimmed);
      });
      part2.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (itemRegex.test(trimmed)) extractedRight.push(trimmed);
      });
      if (extractedLeft.length > 0) rawLeft = extractedLeft;
      if (extractedRight.length > 0) rawRight = extractedRight;
    }
  }

  // Normalize columnA items
  const columnA: MatchItem[] = rawLeft.map((item: any, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.:-]?\s*(.*)/);
      const matchedId =
        match && match[1] ? match[1].toUpperCase() : String.fromCharCode(65 + idx);
      return { id: matchedId, text: item };
    }
    return {
      id: item.id || String.fromCharCode(65 + idx),
      text: item.text || String(item),
    };
  });

  // Normalize columnB items
  const columnB: MatchItem[] = rawRight.map((item: any, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.:-]?\s*(.*)/);
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
      optText
        .match(/[A-Za-z0-9]+\s*-\s*[A-Za-z0-9]+/g)
        ?.map((p) => p.replace(/\s+/g, "")) || [];
  }

  const selectedValue = typeof selected === "string" ? selected : "";

  return (
    <div className="space-y-4">
      {/* Paired Row Layout — A/B/C/D clearly aligned with their List II match */}
      {(columnA.length > 0 || columnB.length > 0) && (
        <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
          {/* Header row */}
          <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.25rem_minmax(0,1.2fr)] sm:grid-cols-[2.25rem_minmax(0,1fr)_1.75rem_minmax(0,1.2fr)] items-center gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2 border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span className="text-center">—</span>
            <span>सूची – I</span>
            <span className="text-center" />
            <span>सूची – II</span>
          </div>

          {/* Paired data rows */}
          <div className="divide-y divide-border/60">
            {columnA.map((itemA, idx) => {
              const itemB = columnB[idx];
              const isHindiA = containsDevanagari(itemA.text);
              const isHindiB = itemB ? containsDevanagari(itemB.text) : false;

              return (
                <div
                  key={itemA.id || idx}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.25rem_minmax(0,1.2fr)] sm:grid-cols-[2.25rem_minmax(0,1fr)_1.75rem_minmax(0,1.2fr)] items-center gap-x-2 sm:gap-x-3 px-3 sm:px-4 py-2.5 hover:bg-muted/20 transition-colors"
                >
                  {/* Letter badge */}
                  <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {itemA.id.replace(/[^A-Za-z0-9]/, "")}
                  </span>

                  {/* List I text */}
                  <p
                    className={cn(
                      "text-xs sm:text-sm text-foreground font-medium leading-relaxed break-words",
                      isHindiA && "font-hindi"
                    )}
                  >
                    {itemA.text.replace(/^[A-Za-z0-9][.):]\s*/, "")}
                  </p>

                  {/* Arrow connector */}
                  <span className="text-muted-foreground/60 text-sm font-semibold text-center select-none">→</span>

                  {/* List II text */}
                  {itemB ? (
                    <p
                      className={cn(
                        "text-xs sm:text-sm text-foreground font-medium leading-relaxed break-words",
                        isHindiB && "font-hindi"
                      )}
                    >
                      {itemB.text.replace(/^[A-Za-z0-9][.):]\s*/, "")}
                    </p>
                  ) : (
                    <span className="text-xs sm:text-sm text-muted-foreground/50">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Multiple-Choice Option Buttons */}
      <div className="space-y-2.5 pt-1">
        <h4 className="text-xs font-bold text-muted-foreground font-hindi">
          सही कूट (उत्तर विकल्प) चुनें:
        </h4>
        <div className="space-y-2">
          {question.options.map((option) => {
            const isSelected = selectedValue === option.id;
            let correctness: "correct" | "incorrect" | "neutral" | undefined =
              undefined;

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
    </div>
  );
}
