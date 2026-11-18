"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { QuestionShell } from "./QuestionShell";
import { QUESTION_RENDERERS } from "./index";
import { FormattedExplanation } from "./FormattedExplanation";
import { SimilarQuestionsCarousel } from "./SimilarQuestionsCarousel";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";

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
  if (!question || question.isOrphanedOrRemoved) {
    return (
      <Card className="border border-border/70 bg-muted/20 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2.5 text-muted-foreground text-sm">
          <span className="font-semibold text-xs px-2 py-0.5 rounded bg-muted">Q.{number}</span>
          <span className="font-hindi text-xs sm:text-sm">
            यह प्रश्न अपडेट हो चुका है, डुप्लीकेट होने के कारण हटा दिया गया है, या किसी अन्य सेट/टॉपिक में स्थानांतरित कर दिया गया है।
          </span>
        </div>
      </Card>
    );
  }

  const sourceId = question?.sourceQuestionId || question?.meta?.sourceQuestionId || question?._id || "";

  const q = useMemo(() => {
    if (!question) return question;
    if (
      (!question.meta?.left || question.meta.left.length === 0) &&
      (!question.meta?.rows || question.meta.rows.length === 0)
    ) {
      return enrichQuestionStructure(question);
    }
    return question;
  }, [question]);

  const Renderer = QUESTION_RENDERERS[q?.type as keyof typeof QUESTION_RENDERERS] || QUESTION_RENDERERS.mcq;

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden print:overflow-visible print:border-neutral-300 print:rounded-lg print:shadow-none print:mb-3 print:break-inside-avoid print:page-break-inside-avoid">
      {/* Main question + options */}
      <div className="p-4 sm:p-5 print:p-2.5">
        <QuestionShell
          number={number}
          type={q?.type}
          questionText={q?.questionText || q?.question}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          reviewBadge={reviewBadge}
          missCount={missCount}
          reference={q?.reference}
          meta={q?.meta}
          questionId={sourceId || q?.canonicalId || q?.id || q?._id}
          question={q}
          unwrapped
        >
          {Renderer ? (
            <Renderer
              question={q}
              selected={selectedAnswer}
              onSelect={() => {}}
              mode="review"
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted text-muted-foreground text-xs">
              Preview not available for question type &ldquo;{q?.type}&rdquo;.
            </div>
          )}
        </QuestionShell>
      </div>

      {/* Explanation — separated by hairline divider, muted background tint */}
      {q?.explanation && (
        <div className="px-4 sm:px-5 py-3 border-t border-border/60 bg-muted/30 print:px-2.5 print:py-1.5 print:bg-neutral-50 print:border-neutral-200">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-1">
              Detailed Explanation
            </p>
            <FormattedExplanation text={q.explanation} compact />
          </div>
        </div>
      )}

      {/* Similar Questions / Variations Carousel (Hidden on print) */}
      {q?.similarQuestions && q.similarQuestions.length > 0 && (
        <div className="px-4 sm:px-5 py-2 border-t border-border/60 bg-primary/2 print:hidden">
          <SimilarQuestionsCarousel similarQuestions={q.similarQuestions} />
        </div>
      )}
    </Card>
  );
}
