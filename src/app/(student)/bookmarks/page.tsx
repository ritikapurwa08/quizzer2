"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { Bookmark } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function BookmarksPage() {
  const allBookmarks = useQuery(api.bookmarks.listByUserWithMeta);
  const subjects = useQuery(api.subjects.list) ?? [];
  const toggleBookmark = useMutation(api.bookmarks.toggle);

  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [page, setPage] = useState(0);

  // Load topics for selected subject
  const topicsForSubject = useQuery(
    api.topics.listBySubject,
    selectedSubjectId !== "all" ? { subjectId: selectedSubjectId as any } : "skip"
  ) ?? [];

  const namedTopicOptions = useMemo(() => {
    if (selectedSubjectId === "all") return [];
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Topics" }];
    for (const t of topicsForSubject) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [topicsForSubject, selectedSubjectId]);

  // Filter bookmarks by subject + topic
  const filtered = useMemo(() => {
    if (!allBookmarks) return [];
    return allBookmarks.filter((item) => {
      if (selectedSubjectId !== "all" && item.subjectId !== selectedSubjectId) return false;
      if (selectedTopicId !== "all" && item.topicId !== selectedTopicId) return false;
      return true;
    });
  }, [allBookmarks, selectedSubjectId, selectedTopicId]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const isLastPage = safePage >= totalPages - 1;

  function handleSubjectChange(v: string) {
    setSelectedSubjectId(v);
    setSelectedTopicId("all");
    setPage(0);
  }

  function handleTopicChange(v: string) {
    setSelectedTopicId(v);
    setPage(0);
  }

  const subjectOptions = [
    { value: "all", label: "All Subjects" },
    ...subjects.map((s) => ({ value: s._id, label: getSubjectDisplayName(s) })),
  ];

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Saved Bookmarks" }]}
      />

      {/* Header with Horizontal Responsive Filters */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Saved Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Important questions saved by you for quick revision.
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
          />
          {allBookmarks && (
            <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2.5 py-1.5 rounded-xl border border-border/60">
              {filtered.length} {filtered.length === 1 ? "bookmark" : "bookmarks"}
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {allBookmarks === undefined && <LoadingState />}

      {/* Empty */}
      {allBookmarks !== undefined && filtered.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title={selectedSubjectId !== "all" ? "No bookmarks in this subject" : "No bookmarks saved yet"}
          description={
            selectedSubjectId !== "all"
              ? "Choose another subject or topic from the filter above."
              : "Click the bookmark icon on any question during a test or in results to save it here for revision."
          }
        />
      )}

      {/* Question list */}
      <div className="space-y-4">
        {pageItems.map(({ bookmark, question }, idx) =>
          question ? (
            <QuestionReviewCard
              key={bookmark._id}
              number={safePage * PAGE_SIZE + idx + 1}
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

      {/* Pagination */}
      {allBookmarks !== undefined && filtered.length > PAGE_SIZE && (
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
