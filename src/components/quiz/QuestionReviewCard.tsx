"use client";

import { Card } from "@/components/ui/card";
import { QuestionShell } from "./QuestionShell";
import { QUESTION_RENDERERS } from "./index";
import { containsDevanagari, cn } from "@/lib/utils";

interface QuestionReviewCardProps {
  number: number;
  question: any;
  selectedAnswer?: string | string[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  reviewBadge?: "correct" | "incorrect" | "unanswered";
  missCount?: number;
}

export function QuestionReviewCard({
  number,
  question,
  selectedAnswer,
  isBookmarked,
  onToggleBookmark,
  reviewBadge,
  missCount,
}: QuestionReviewCardProps) {
  const Renderer = QUESTION_RENDERERS[question.type as keyof typeof QUESTION_RENDERERS];
  const isHindiExplanation = question.explanation ? containsDevanagari(question.explanation) : false;

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden">
      {/* Main question + options */}
      <div className="p-4 sm:p-5">
        <QuestionShell
          number={number}
          type={question.type}
          questionText={question.questionText}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          reviewBadge={reviewBadge}
          missCount={missCount}
          unwrapped
        >
          {Renderer ? (
            <Renderer
              question={question}
              selected={selectedAnswer}
              onSelect={() => {}}
              mode="review"
            />
          ) : null}
        </QuestionShell>
      </div>

      {/* Explanation — separated by hairline divider, muted background tint */}
      {question.explanation && (
        <div className="px-4 sm:px-5 py-3.5 border-t border-border/60 bg-muted/30">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 font-hindi">
            विस्तृत व्याख्या एवं संदर्भ
          </p>
          <p className={cn("text-xs sm:text-sm text-foreground font-semibold leading-relaxed font-hindi", isHindiExplanation && "font-hindi")}>
            {question.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
