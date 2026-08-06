"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { History } from "lucide-react";

/** Auto-populated on every incorrect answer during Attempt Submit (SRD Section 9). */
export default function WrongQuestionsPage() {
  const wrongQuestions = useQuery(api.wrongQuestions.listByUser);
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4 pb-12">
      <div>
        <h1 className="text-xl font-semibold">Wrong Questions</h1>
        <p className="text-sm text-muted-foreground">
          Questions you've missed, auto-saved for focused practice.
        </p>
      </div>

      {wrongQuestions && wrongQuestions.length === 0 && (
        <EmptyState icon={History} title="No wrong questions — nice work!" />
      )}

      <div className="space-y-4">
        {wrongQuestions?.map(({ wrongQuestion, question }, idx) => (
          question && (
            <QuestionReviewCard
              key={wrongQuestion._id}
              number={idx + 1}
              question={question}
              selectedAnswer={undefined}
              isBookmarked={bookmarked.has(question._id)}
              onToggleBookmark={() => {
                setBookmarked((prev) => {
                  const next = new Set(prev);
                  next.has(question._id) ? next.delete(question._id) : next.add(question._id);
                  return next;
                });
                toggleBookmark({ questionId: question._id });
              }}
              reviewBadge="incorrect"
              missCount={wrongQuestion.missCount}
            />
          )
        ))}
      </div>
    </div>
  );
}
