"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { History } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { getSubjectDisplayName } from "@/lib/utils";

const PAGE_SIZE = 15;

const SORT_OPTIONS = [
  { value: "latest", label: "नवीनतम गलत" },
  { value: "most_missed", label: "सर्वाधिक बार गलत" },
  { value: "oldest", label: "सबसे पुराना" },
];

type SortBy = "latest" | "most_missed" | "oldest";

export default function WrongQuestionsPage() {
  const [page, setPage] = useState(0);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]); // cursorStack[i] = cursor to fetch page i
  const [sortBy, setSortBy] = useState<SortBy>("latest");

  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  // Convex query for current page
  const currentCursor = cursorStack[page] ?? null;
  const result = useQuery(api.wrongQuestions.listByUserPaginated, {
    paginationOpts: { numItems: PAGE_SIZE, cursor: currentCursor },
    sortBy,
  });

  const handleNext = useCallback(() => {
    if (!result || result.isDone) return;
    const nextCursor = result.continueCursor ?? null;
    setCursorStack((prev) => {
      const next = [...prev];
      next[page + 1] = nextCursor;
      return next;
    });
    setPage((p) => p + 1);
  }, [result, page]);

  const handlePrev = useCallback(() => {
    if (page === 0) return;
    setPage((p) => p - 1);
  }, [page]);

  const handleSortChange = useCallback((v: string) => {
    setSortBy(v as SortBy);
    setPage(0);
    setCursorStack([null]);
  }, []);

  const items = result?.page ?? [];
  const isLastPage = result?.isDone ?? false;

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "गलत प्रश्न अभ्यास" }]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          गलत प्रश्न अभ्यास (Revision Bank)
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          टेस्ट में आपके द्वारा गलत किए गए प्रश्न, लक्षित अभ्यास एवं सुधार के लिए स्वतः सहेजे गए हैं।
        </p>
      </div>

      {/* Filters */}
      <FilterBar
        subjects={[{ value: "all", label: "सभी विषय" }]}
        selectedSubject="all"
        onSubjectChange={() => {}}
        sortOptions={SORT_OPTIONS}
        selectedSort={sortBy}
        onSortChange={handleSortChange}
      />

      {/* Loading state */}
      {result === undefined && <LoadingState />}

      {/* Empty state */}
      {result !== undefined && items.length === 0 && page === 0 && (
        <EmptyState
          icon={History}
          title="कोई गलत प्रश्न नहीं — बहुत बढ़िया!"
          description="टेस्ट में आपके द्वारा गलत किए गए प्रश्न लक्षित सुधार के लिए यहाँ स्वतः जुड़ेंगे।"
        />
      )}

      {/* Question list */}
      <div className="space-y-4">
        {items.map(({ wrongQuestion, question }, idx) =>
          question ? (
            <QuestionReviewCard
              key={wrongQuestion._id}
              number={page * PAGE_SIZE + idx + 1}
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
          ) : null,
        )}
      </div>

      {/* Pagination */}
      {result !== undefined && (items.length > 0 || page > 0) && (
        <Pagination
          page={page}
          onPrev={handlePrev}
          onNext={handleNext}
          isLastPage={isLastPage}
          label={`पृष्ठ ${page + 1}`}
        />
      )}
    </div>
  );
}
