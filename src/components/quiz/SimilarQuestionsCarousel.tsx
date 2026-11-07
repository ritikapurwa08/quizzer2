"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Layers, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SimilarQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
  exam?: string;
  year?: number | null;
  [key: string]: any;
}

interface SimilarQuestionsCarouselProps {
  similarQuestions?: SimilarQuestion[];
  className?: string;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function SimilarQuestionsCarousel({
  similarQuestions,
  className,
}: SimilarQuestionsCarouselProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!similarQuestions || similarQuestions.length === 0) {
    return null;
  }

  const currentQ = similarQuestions[currentIndex] || similarQuestions[0];
  const total = similarQuestions.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const getOptionLetter = (ans: string): number => {
    const a = ans?.toUpperCase().trim();
    if (a === "A" || a === "OPT1" || a === "1") return 0;
    if (a === "B" || a === "OPT2" || a === "2") return 1;
    if (a === "C" || a === "OPT3" || a === "3") return 2;
    if (a === "D" || a === "OPT4" || a === "4") return 3;
    return 0;
  };

  const correctIdx = getOptionLetter(currentQ.answer);

  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 my-3 text-foreground transition-all",
        className
      )}
    >
      {/* Header bar / toggle button */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left cursor-pointer group"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Similar Questions
            </span>
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-bold border-primary/30 text-primary bg-primary/10"
            >
              {total} {total === 1 ? "Variation" : "Variations"}
            </Badge>
          </div>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label={isOpen ? "Collapse similar questions" : "Expand similar questions"}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded carousel content */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-primary/15 space-y-3">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">
              Variation <strong className="text-foreground">{currentIndex + 1}</strong> of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={total <= 1}
                className="h-6.5 w-6.5 p-0 rounded-md border-border/80 cursor-pointer"
                aria-label="Previous variation"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={total <= 1}
                className="h-6.5 w-6.5 p-0 rounded-md border-border/80 cursor-pointer"
                aria-label="Next variation"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Current Variation Card */}
          <div className="rounded-lg border border-border/70 bg-card p-3 sm:p-3.5 shadow-2xs space-y-2.5">
            {/* Variation Question Text */}
            <p className="text-xs sm:text-sm font-hindi leading-relaxed text-foreground whitespace-pre-wrap font-medium">
              {currentQ.question}
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
              {currentQ.options?.map((opt: string, idx: number) => {
                const isCorrect = idx === correctIdx;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                      isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium"
                        : "border-border/60 bg-muted/20 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isCorrect
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {OPTION_LETTERS[idx]}
                    </span>
                    <span className="font-hindi truncate">{opt}</span>
                    {isCorrect && (
                      <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation if available */}
            {currentQ.explanation && (
              <div className="mt-2 pt-2 border-t border-border/50 text-[11px] sm:text-xs text-muted-foreground leading-relaxed font-hindi">
                <span className="font-semibold text-foreground/80">व्याख्या: </span>
                {currentQ.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

