"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { ListChecks } from "lucide-react";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function HistoryPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [page, setPage] = useState(0);

  const subjects = useQuery(api.subjects.list) ?? [];

  // Load all history
  const result = useQuery(api.attempts.historyByUser, {
    paginationOpts: { numItems: 500, cursor: null },
  });

  // Load topics for the selected subject
  const topicsForSubject = useQuery(
    api.topics.listBySubject,
    selectedSubjectId !== "all" ? { subjectId: selectedSubjectId as any } : "skip"
  ) ?? [];

  // Build topic options
  const topicOptions = useMemo(() => {
    const opts = [{ value: "all", label: "All Topics" }];
    for (const t of topicsForSubject) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [topicsForSubject]);

  // Subject options
  const subjectOptions = useMemo(() => [
    { value: "all", label: "All Subjects" },
    ...subjects.map((s) => ({ value: s._id, label: getSubjectDisplayName(s) })),
  ], [subjects]);

  // Sort all history items newest-first strictly by submittedAt / completedAt
  const allItems = useMemo(() => {
    const raw = result?.page ?? [];
    return [...raw].sort((a: any, b: any) => {
      const timeA = a.submittedAt ?? a.completedAt ?? a._creationTime ?? 0;
      const timeB = b.submittedAt ?? b.completedAt ?? b._creationTime ?? 0;
      return timeB - timeA;
    });
  }, [result?.page]);

  const filtered = useMemo(() => {
    return allItems.filter((a: any) => {
      if (selectedSubjectId !== "all" && a.subjectId !== selectedSubjectId) return false;
      if (selectedTopicId !== "all" && a.topicId !== selectedTopicId) return false;
      return true;
    });
  }, [allItems, selectedSubjectId, selectedTopicId]);

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

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Test History" }]}
      />

      {/* Header with Horizontal Right-Aligned Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Test History
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Complete record of all test attempts, ordered newest to oldest.
          </p>
        </div>

        {/* Horizontal Filters in Header */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <FilterBar
            subjects={subjectOptions}
            selectedSubject={selectedSubjectId}
            onSubjectChange={handleSubjectChange}
            topics={topicOptions}
            selectedTopic={selectedTopicId}
            onTopicChange={handleTopicChange}
          />
          {result && (
            <div className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium bg-muted/80 text-muted-foreground border border-border whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? "attempt" : "attempts"}
            </div>
          )}
        </div>
      </div>

      <Card className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs min-h-[480px] flex flex-col justify-between">
        {/* Loading Skeletons */}
        {result === undefined && (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3.5 rounded-sm border border-border/60 bg-secondary/30 flex items-center justify-between gap-3 animate-pulse">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48 sm:w-64 rounded-xs" />
                  <Skeleton className="h-3 w-28 sm:w-36 rounded-xs" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-14 rounded-xs" />
                  <Skeleton className="h-6 w-12 rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {result !== undefined && filtered.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title={
              selectedSubjectId !== "all"
                ? "No attempts found in this subject"
                : "No tests attempted yet"
            }
            description={
              selectedSubjectId !== "all"
                ? "Choose another subject or select 'All Subjects' to see your complete history."
                : "Select a subject from the Dashboard and complete your first test attempt."
            }
            className="py-8"
          />
        )}

        {/* History list */}
        {filtered.length > 0 && (
          <ul className="space-y-2">
            {pageItems.map((attempt: any) => (
              <li key={attempt._id}>
                <ResultHistoryItem
                  attemptId={attempt._id}
                  testSetId={attempt.testSetId}
                  testSetName={attempt.testSetName}
                  submittedAt={attempt.submittedAt ?? attempt.completedAt ?? attempt._creationTime ?? Date.now()}
                  score={attempt.score}
                  totalQuestions={attempt.totalQuestions}
                  answers={attempt.answers ?? []}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {result !== undefined && filtered.length > PAGE_SIZE && (
          <div className="mt-4 pt-3 border-t border-border/60">
            <Pagination
              page={safePage}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
              isLastPage={isLastPage}
              label={`Page ${safePage + 1} of ${totalPages}`}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
