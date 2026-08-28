"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bookmark } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";

export default function BookmarksPage() {
  const bookmarks = useQuery(api.bookmarks.listByUser);
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "सहेजे गए बुकमार्क" }]} />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">सहेजे गए बुकमार्क</h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          बाद में पुनरावृत्ति (Revision) के लिए आपके द्वारा सहेजे गए महत्वपूर्ण प्रश्न।
        </p>
      </div>

      {bookmarks && bookmarks.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="अभी कोई बुकमार्क नहीं है"
          description="टेस्ट हल करते समय या परिणाम स्क्रीन पर किसी भी प्रश्न के बुकमार्क आइकन पर क्लिक करके उसे यहाँ सहेजें।"
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
