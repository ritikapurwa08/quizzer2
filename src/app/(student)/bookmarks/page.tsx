"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  const bookmarks = useQuery(api.bookmarks.listByUser);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Bookmarks</h1>

      {bookmarks && bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Tap the bookmark icon on any question during a quiz to save it here."
        />
      )}

      <div className="space-y-3">
        {bookmarks?.map(({ bookmark, question }) => (
          question && (
            <Card key={bookmark._id}>
              <p className="text-xs text-muted-foreground mb-1">
                {QUESTION_TYPE_LABELS[question.type]} · {question.difficulty}
              </p>
              <p className="whitespace-pre-line text-sm">{question.questionText}</p>
            </Card>
          )
        ))}
      </div>
    </div>
  );
}
