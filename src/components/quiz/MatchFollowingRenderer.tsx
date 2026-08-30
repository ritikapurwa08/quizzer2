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
  const metaObj = (question.meta as Record<string, unknown>) || {};
  let rawLeft = (metaObj.left ?? metaObj.columnA ?? []) as unknown[];
  let rawRight = (metaObj.right ?? metaObj.columnB ?? []) as unknown[];

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
  const columnA: MatchItem[] = rawLeft.map((item: unknown, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.:-]?\s*(.*)/);
      const matchedId =
        match && match[1] ? match[1].toUpperCase() : String.fromCharCode(65 + idx);
      return { id: matchedId, text: item };
    }
    const itemObj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: String(itemObj.id || String.fromCharCode(65 + idx)),
      text: String(itemObj.text || item),
    };
  });

  // Normalize columnB items
  const columnB: MatchItem[] = rawRight.map((item: unknown, idx: number) => {
    if (typeof item === "string") {
      const match = item.match(/^([A-Za-z0-9]+)[\.:-]?\s*(.*)/);
      return {
        id: match ? match[1] : String(idx + 1),
        text: item,
      };
    }
    const itemObj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: String(itemObj.id || String(idx + 1)),
      text: String(itemObj.text || item),
    };
  });

  const selectedValue = typeof selected === "string" ? selected : "";

  return (
    <div className="space-y-4">
      {/* Side-by-side List I and List II with row-by-row vertical alignment */}
      {(columnA.length > 0 || columnB.length > 0) && (
        <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
          {/* Header Row */}
          <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi divide-x divide-border/60">
            <div className="px-3 sm:px-4 py-2 flex items-center">
              <span>सूची – I</span>
            </div>
            <div className="px-3 sm:px-4 py-2 flex items-center">
              <span>सूची – II</span>
            </div>
          </div>

          {/* Data Rows — Row-by-row vertical alignment so A=1, B=2, C=3, D=4 share the same horizontal row and height */}
          <div className="divide-y divide-border/60">
            {Array.from({ length: Math.max(columnA.length, columnB.length) }).map((_, idx) => {
              const itemA = columnA[idx];
              const itemB = columnB[idx];
              const isHindiA = itemA ? containsDevanagari(itemA.text) : false;
              const isHindiB = itemB ? containsDevanagari(itemB.text) : false;

              const displayIdA = itemA
                ? itemA.id.replace(/[^A-Za-z0-9]/, "") || String.fromCharCode(65 + idx)
                : "";
              const displayTextA = itemA ? itemA.text.replace(/^[A-Za-z0-9][.):]\s*/, "") : "";

              const displayIdB = itemB
                ? itemB.id.replace(/[^A-Za-z0-9]/, "") || String(idx + 1)
                : "";
              const displayTextB = itemB ? itemB.text.replace(/^[A-Za-z0-9][.):]\s*/, "") : "";

              return (
                <div
                  key={itemA?.id || itemB?.id || idx}
                  className="grid grid-cols-2 divide-x divide-border/60 hover:bg-muted/20 transition-colors"
                >
                  {/* Left Column Item (List I) */}
                  <div className="p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2.5">
                    {itemA ? (
                      <>
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                          {displayIdA}
                        </span>
                        <span
                          className={cn(
                            "leading-snug sm:leading-relaxed break-words text-xs sm:text-sm font-medium text-foreground flex-1 pt-0.5",
                            isHindiA && "font-hindi"
                          )}
                        >
                          {displayTextA}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>

                  {/* Right Column Item (List II) */}
                  <div className="p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2.5">
                    {itemB ? (
                      <>
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                          {displayIdB}
                        </span>
                        <span
                          className={cn(
                            "leading-snug sm:leading-relaxed break-words text-xs sm:text-sm font-medium text-foreground flex-1 pt-0.5",
                            isHindiB && "font-hindi"
                          )}
                        >
                          {displayTextB}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </div>
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
