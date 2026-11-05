"use client";

import { QuestionReviewCard } from "@/components/quiz";
import type { ReviewFilter } from "@/components/quiz/QuestionReviewFilter";

interface ReviewQuestionListProps {
  filteredQuestionsWithIndex: Array<{
    question: any;
    answer: any;
    badge: string;
    originalIndex: number;
    questionId: string;
  }>;
  reviewFilter: ReviewFilter;
  bookmarked: Set<string>;
  onToggleBookmark: (questionId: string) => void;
}

export function ReviewQuestionList({
  filteredQuestionsWithIndex,
  reviewFilter,
  bookmarked,
  onToggleBookmark,
}: ReviewQuestionListProps) {
  if (filteredQuestionsWithIndex.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10 font-hindi">
        {reviewFilter === "incorrect"
          ? "शाबाश! आपने इस टेस्ट में कोई गलत उत्तर नहीं दिया।"
          : reviewFilter === "correct"
          ? "इस टेस्ट में कोई सही उत्तर नहीं है।"
          : reviewFilter === "unattempted"
          ? "शाबाश! आपने सभी प्रश्नों के उत्तर दिए हैं।"
          : "कोई प्रश्न उपलब्ध नहीं है।"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {filteredQuestionsWithIndex.map(({ question: q, answer, badge, originalIndex, questionId }) => {
        const safeId = questionId || q?._id || `q_${originalIndex}`;
        return (
          <QuestionReviewCard
            key={safeId}
            number={originalIndex + 1}
            question={q}
            selectedAnswer={answer?.selected}
            isBookmarked={bookmarked.has(safeId)}
            onToggleBookmark={() => onToggleBookmark(safeId)}
            reviewBadge={badge as "correct" | "incorrect" | "unanswered"}
          />
        );
      })}
    </div>
  );
}

