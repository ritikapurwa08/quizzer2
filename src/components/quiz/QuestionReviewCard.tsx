"use client";

import { Card } from "@/components/ui/card";
import { QuestionShell } from "./QuestionShell";
import { QUESTION_RENDERERS } from "./index";
import { FormattedExplanation } from "./FormattedExplanation";
import { cn } from "@/lib/utils";

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

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden print:overflow-visible print:border-neutral-300 print:rounded-lg print:shadow-none print:mb-3 print:break-inside-avoid print:page-break-inside-avoid">
      {/* Main question + options */}
      <div className="p-4 sm:p-5 print:p-2.5">
        <QuestionShell
          number={number}
          type={question.type}
          questionText={question.questionText}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          reviewBadge={reviewBadge}
          missCount={missCount}
          reference={question.reference}
          meta={question.meta}
          unwrapped
        >
          {Renderer ? (
            <Renderer
              question={question}
              selected={selectedAnswer}
              onSelect={() => {}}
              mode="review"
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted text-muted-foreground text-xs">
              Preview not available for question type &ldquo;{question.type}&rdquo;.
            </div>
          )}
        </QuestionShell>
      </div>

      {/* Explanation — separated by hairline divider, muted background tint */}
      {question.explanation && (
        <div className="px-4 sm:px-5 py-3 border-t border-border/60 bg-muted/30 print:px-2.5 print:py-1.5 print:bg-neutral-50 print:border-neutral-200">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-1">
              Detailed Explanation
            </p>
            <FormattedExplanation text={question.explanation} compact />
          </div>
        </div>
      )}
    </Card>
  );
}

