"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { History, CheckCircle2 } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { getTopicDisplayName } from "@/lib/utils";

const PAGE_SIZE = 15;

const SORT_OPTIONS = [
  { value: "latest", label: "Recently Missed" },
  { value: "most_missed", label: "Most Missed" },
  { value: "oldest", label: "Oldest Missed" },
];

type SortBy = "latest" | "most_missed" | "oldest";

export default function WrongQuestionsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [page, setPage] = useState(0);

  const data = useQuery(api.wrongQuestions.listByUserWithMeta);
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const userBookmarks = useQuery(api.bookmarks.listByUser) ?? [];
  const bookmarkedIds = useMemo(() => new Set(userBookmarks.map((b) => b.bookmark.questionId)), [userBookmarks]);

  // Load topics for the selected subject
  const topicsForSubject = useQuery(
    api.topics.listBySubject,
    selectedSubjectId !== "all" ? { subjectId: selectedSubjectId as any } : "skip"
  ) ?? [];

  const subjectOptions = useMemo(() => [
    { value: "all", label: "All Subjects" },
    ...(data?.subjectsWithCounts || []).map((s) => ({
      value: s.subjectId,
      label: `${s.nameHindi || s.name} (${s.count})`,
    })),
  ], [data]);

  const namedTopicOptions = useMemo(() => {
    if (selectedSubjectId === "all") return [];
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Topics" }];
    for (const t of topicsForSubject) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [topicsForSubject, selectedSubjectId]);

  function handleSubjectChange(v: string) {
    setSelectedSubjectId(v);
    setSelectedTopicId("all");
    setPage(0);
  }

  function handleTopicChange(v: string) {
    setSelectedTopicId(v);
    setPage(0);
  }

  function handleSortChange(v: string) {
    setSortBy(v as SortBy);
    setPage(0);
  }

  // Filter & sort questions
  const filteredAndSorted = useMemo(() => {
    if (!data?.items) return [];

    const filtered = data.items.filter((item) => {
      if (selectedSubjectId !== "all" && item.subjectId !== selectedSubjectId) return false;
      if (selectedTopicId !== "all" && item.topicId !== selectedTopicId) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "most_missed") {
        if (b.wrongQuestion.missCount !== a.wrongQuestion.missCount) {
          return b.wrongQuestion.missCount - a.wrongQuestion.missCount;
        }
        return b.wrongQuestion.lastMissedAt - a.wrongQuestion.lastMissedAt;
      }
      if (sortBy === "oldest") {
        return a.wrongQuestion.lastMissedAt - b.wrongQuestion.lastMissedAt;
      }
      // "latest" default
      return b.wrongQuestion.lastMissedAt - a.wrongQuestion.lastMissedAt;
    });

    return sorted;
  }, [data, selectedSubjectId, selectedTopicId, sortBy]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filteredAndSorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const isLastPage = safePage >= totalPages - 1;

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Wrong Questions" }]}
      />

      {/* Header with Horizontal Responsive Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Wrong Questions Practice
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Questions answered incorrectly in tests are automatically saved here for targeted revision.
          </p>
        </div>

        {/* Horizontal Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <FilterBar
            subjects={subjectOptions}
            selectedSubject={selectedSubjectId}
            onSubjectChange={handleSubjectChange}
            topics={namedTopicOptions}
            selectedTopic={selectedTopicId}
            onTopicChange={handleTopicChange}
            sortOptions={SORT_OPTIONS}
            selectedSort={sortBy}
            onSortChange={handleSortChange}
          />
          {data && (
            <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60">
              {filteredAndSorted.length} {filteredAndSorted.length === 1 ? "question" : "questions"}
            </span>
          )}
        </div>
      </div>

      {/* Loading state */}
      {data === undefined && <LoadingState />}

      {/* Empty state */}
      {data !== undefined && filteredAndSorted.length === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title={selectedSubjectId !== "all" ? "No wrong questions in this subject!" : "No wrong questions — Great job!"}
          description={
            selectedSubjectId !== "all"
              ? "No missed questions found for this subject or topic."
              : "Incorrect questions from practice test sets will automatically appear here for targeted practice."
          }
        />
      )}

      {/* Question list */}
      <div className="space-y-4">
        {pageItems.map(({ wrongQuestion, question }, idx) =>
          question ? (
            <QuestionReviewCard
              key={wrongQuestion._id}
              number={safePage * PAGE_SIZE + idx + 1}
              question={question}
              selectedAnswer={undefined}
              isBookmarked={bookmarkedIds.has(question._id)}
              onToggleBookmark={() => {
                toggleBookmark({ questionId: question._id });
              }}
              missCount={wrongQuestion.missCount}
            />
          ) : null
        )}
      </div>

      {/* Pagination */}
      {data !== undefined && filteredAndSorted.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          isLastPage={isLastPage}
          label={`Page ${safePage + 1} of ${totalPages}`}
        />
      )}
    </div>
  );
}
