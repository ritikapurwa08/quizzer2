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
    <Card className="p-3.5 sm:p-5 space-y-4 shadow-sm">
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

      {/* Explanation Divider & Section */}
      {question.explanation && (
        <div className="pt-3 border-t border-border/60 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <span className="font-bold text-foreground block mb-1">
            Explanation & Context:
          </span>
          <p className={cn(isHindiExplanation && "font-hindi")}>
            {question.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
