"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { History } from "lucide-react";

export default function WrongQuestionsPage() {
  const wrongQuestions = useQuery(api.wrongQuestions.listByUser);
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Wrong Questions
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Questions you&apos;ve missed, auto-saved for focused practice. Sorted by most missed.
        </p>
      </div>

      {wrongQuestions && wrongQuestions.length === 0 && (
        <EmptyState
          icon={History}
          title="No wrong questions — nice work!"
          description="Incorrect answers from your test attempts will appear here for targeted revision."
        />
      )}

      <div className="space-y-4">
        {wrongQuestions?.map(({ wrongQuestion, question }, idx) =>
          question ? (
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
          ) : null
        )}
      </div>
    </div>
  );
}
