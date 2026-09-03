"use client";

import { cn, containsDevanagari } from "@/lib/utils";
import { QuestionRendererProps } from "@/types";
import { OptionButton } from "./OptionButton";
import { extractMatchListsFromText } from "@/lib/validators/question";

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

  // Fallback: if meta lists are missing/empty, extract from questionText
  if ((!rawLeft || rawLeft.length === 0) && (!rawRight || rawRight.length === 0) && question.questionText) {
    const extracted = extractMatchListsFromText(question.questionText);
    if (extracted.left.length > 0) rawLeft = extracted.left;
    if (extracted.right.length > 0) rawRight = extracted.right;
  }

  // Normalize columnA items to { id, text } without duplicated prefixes
  const columnA: MatchItem[] = rawLeft.map((item: unknown, idx: number) => {
    if (typeof item === "object" && item !== null) {
      const itemObj = item as Record<string, unknown>;
      if (itemObj.id && itemObj.text) {
        return {
          id: String(itemObj.id),
          text: String(itemObj.text),
        };
      }
    }
    if (typeof item === "string") {
      // Parse "A. text" or "(A) text" etc.
      const m = item.match(/^(?:\(([A-Ea-e])\)|([A-Ea-e])\s*[.)\-:])\s*(.*)/);
      if (m) {
        const id = (m[1] || m[2] || "").trim().toUpperCase();
        const text = (m[3] || "").trim();
        if (id && text) return { id, text };
      }
      // Fallback: just use the whole string as text
      return { id: String.fromCharCode(65 + idx), text: item.trim() };
    }
    return { id: String.fromCharCode(65 + idx), text: String(item ?? "") };
  });

  // Normalize columnB items to { id, text } without duplicated prefixes
  const columnB: MatchItem[] = rawRight.map((item: unknown, idx: number) => {
    if (typeof item === "object" && item !== null) {
      const itemObj = item as Record<string, unknown>;
      if (itemObj.id && itemObj.text) {
        return {
          id: String(itemObj.id),
          text: String(itemObj.text),
        };
      }
    }
    if (typeof item === "string") {
      // Parse "(i) text" or "1. text" or "i. text"
      const m = item.match(/^(?:\(([\divxlc]+)\)|([\divxlc]+)\s*[.)\-:])\s*(.*)/i);
      if (m) {
        const id = (m[1] || m[2] || "").trim();
        const text = (m[3] || "").trim();
        if (id && text) return { id, text };
      }
      // Fallback
      return { id: String(idx + 1), text: item.trim() };
    }
    return { id: String(idx + 1), text: String(item ?? "") };
  });

  const selectedValue = typeof selected === "string" ? selected : "";
  const rowCount = Math.max(columnA.length, columnB.length);

  return (
    <div className="space-y-4">
      {/* Match Lists — Desktop: side-by-side grid | Mobile: stacked pairs */}
      {(columnA.length > 0 || columnB.length > 0) && (
        <>
          {/* ── Desktop/Tablet: Side-by-side grid ── */}
          <div className="hidden sm:block rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs">
            {/* Header Row */}
            <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi divide-x divide-border/60">
              <div className="px-3 sm:px-4 py-2 flex items-center">
                <span>सूची – I</span>
              </div>
              <div className="px-3 sm:px-4 py-2 flex items-center">
                <span>सूची – II</span>
              </div>
            </div>

            {/* Data Rows — each row shares height for vertical alignment */}
            <div className="divide-y divide-border/60">
              {Array.from({ length: rowCount }).map((_, idx) => {
                const itemA = columnA[idx];
                const itemB = columnB[idx];
                const isHindiA = itemA ? containsDevanagari(itemA.text) : false;
                const isHindiB = itemB ? containsDevanagari(itemB.text) : false;

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
                            {itemA.id}
                          </span>
                          <span
                            className={cn(
                              "leading-snug sm:leading-relaxed break-words text-xs sm:text-sm font-medium text-foreground flex-1 pt-0.5",
                              isHindiA && "font-hindi"
                            )}
                          >
                            {itemA.text}
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
                            {itemB.id}
                          </span>
                          <span
                            className={cn(
                              "leading-snug sm:leading-relaxed break-words text-xs sm:text-sm font-medium text-foreground flex-1 pt-0.5",
                              isHindiB && "font-hindi"
                            )}
                          >
                            {itemB.text}
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

          {/* ── Mobile: Stacked pairs — each A↔i pair is a single group ── */}
          <div className="sm:hidden space-y-2">
            {Array.from({ length: rowCount }).map((_, idx) => {
              const itemA = columnA[idx];
              const itemB = columnB[idx];
              const isHindiA = itemA ? containsDevanagari(itemA.text) : false;
              const isHindiB = itemB ? containsDevanagari(itemB.text) : false;

              return (
                <div
                  key={itemA?.id || itemB?.id || idx}
                  className="rounded-lg border border-border/70 bg-card/60 overflow-hidden"
                >
                  {/* List I item */}
                  {itemA && (
                    <div className="flex items-start gap-2 p-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] font-bold shrink-0 mt-0.5">
                        {itemA.id}
                      </span>
                      <span
                        className={cn(
                          "text-xs leading-snug font-medium text-foreground flex-1",
                          isHindiA && "font-hindi"
                        )}
                      >
                        {itemA.text}
                      </span>
                    </div>
                  )}
                  {/* Arrow separator */}
                  {itemA && itemB && (
                    <div className="flex items-center px-2.5 pb-0.5">
                      <span className="text-[10px] text-muted-foreground/50">↓</span>
                    </div>
                  )}
                  {/* List II item */}
                  {itemB && (
                    <div className="flex items-start gap-2 px-2.5 pb-2.5 pl-5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-[11px] font-bold shrink-0 mt-0.5">
                        {itemB.id}
                      </span>
                      <span
                        className={cn(
                          "text-xs leading-snug font-medium text-foreground flex-1",
                          isHindiB && "font-hindi"
                        )}
                      >
                        {itemB.text}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
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
