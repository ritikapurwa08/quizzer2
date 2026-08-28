"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { History } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export default function WrongQuestionsPage() {
  const wrongQuestions = useQuery(api.wrongQuestions.listByUser);
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "गलत प्रश्न अभ्यास" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          गलत प्रश्न अभ्यास (Revision Bank)
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          टेस्ट में आपके द्वारा गलत किए गए प्रश्न, लक्षित अभ्यास एवं सुधार के लिए स्वतः सहेजे गए हैं।
        </p>
      </div>

      {wrongQuestions && wrongQuestions.length === 0 && (
        <EmptyState
          icon={History}
          title="कोई गलत प्रश्न नहीं — बहुत बढ़िया!"
          description="टेस्ट में आपके द्वारा गलत किए गए प्रश्न लक्षित सुधार के लिए यहाँ स्वतः जुड़ेंगे।"
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
