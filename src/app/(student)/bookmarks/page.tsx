"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const bookmarks = useQuery(api.bookmarks.listByUser);
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  return (
    <div className="space-y-5 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Bookmarks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Questions you&apos;ve saved for later review.
        </p>
      </div>

      {bookmarks && bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Tap the bookmark icon on any question during a quiz or in the review screen to save it here."
        />
      )}

      <div className="space-y-4">
        {bookmarks?.map(({ bookmark, question }, idx) =>
          question ? (
            <QuestionReviewCard
              key={bookmark._id}
              number={idx + 1}
              question={question}
              selectedAnswer={undefined}
              isBookmarked={true}
              onToggleBookmark={() => {
                toggleBookmark({ questionId: question._id });
              }}
            />
          ) : null
        )}
      </div>
    </div>
  );
}
