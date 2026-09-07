"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { History, ListChecks } from "lucide-react";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function HistoryPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState("all");
  const [page, setPage] = useState(0);

  const subjects = useQuery(api.subjects.list) ?? [];

  // Load all history (full collect — manageable for Phase 1 volumes)
  // We use a large numItems to get all, cursor=null for first page
  const result = useQuery(api.attempts.historyByUser, {
    paginationOpts: { numItems: 500, cursor: null },
  });

  // Load topics for the selected subject
  const topicsForSubject = useQuery(
    api.topics.listBySubject,
    selectedSubjectId !== "all" ? { subjectId: selectedSubjectId as any } : "skip",
  ) ?? [];

  // Build topic options
  const topicOptions = useMemo(() => {
    const opts = [{ value: "all", label: "सभी टॉपिक" }];
    for (const t of topicsForSubject) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [topicsForSubject]);

  // Subject options
  const subjectOptions = useMemo(() => [
    { value: "all", label: "सभी विषय" },
    ...subjects.map((s) => ({ value: s._id, label: getSubjectDisplayName(s) })),
  ], [subjects]);

  // Filter history by subject + topic
  const allItems = result?.page ?? [];
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
        items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "परीक्षा इतिहास" }]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          परीक्षा इतिहास
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          आपके द्वारा दिए गए सभी टेस्ट का पूर्ण रिकॉर्ड, नवीनतम से पुराने क्रम में।
        </p>
      </div>

      <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
        {/* Header + Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <History className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-foreground font-hindi">
              सभी प्रयास (नवीनतम पहले)
            </h2>
          </div>

          {result && (
            <span className="text-xs text-muted-foreground font-hindi">
              {filtered.length} रिकॉर्ड
            </span>
          )}
        </div>

        {/* Filter bar */}
        <FilterBar
          subjects={subjectOptions}
          selectedSubject={selectedSubjectId}
          onSubjectChange={handleSubjectChange}
          topics={topicOptions}
          selectedTopic={selectedTopicId}
          onTopicChange={handleTopicChange}
          className="mb-4"
        />

        {/* Loading */}
        {result === undefined && <LoadingState />}

        {/* Empty state */}
        {result !== undefined && filtered.length === 0 && (
          <EmptyState
            icon={ListChecks}
            title={
              selectedSubjectId !== "all"
                ? "इस विषय में कोई प्रयास नहीं"
                : "अभी तक कोई टेस्ट नहीं दिया गया"
            }
            description={
              selectedSubjectId !== "all"
                ? "कोई अन्य विषय चुनें या 'सभी विषय' से पूरी सूची देखें।"
                : "विषय चुनें और अपना पहला प्रयास करें। यहाँ सारा इतिहास सुरक्षित रहेगा।"
            }
          />
        )}

        {/* List */}
        {pageItems.length > 0 && (
          <ul className="space-y-2">
            {pageItems.map((a: any) => (
              <li key={a._id}>
                <ResultHistoryItem
                  attemptId={a._id}
                  testSetId={a.testSetId}
                  testSetName={a.testSetName}
                  submittedAt={a.submittedAt ?? 0}
                  score={a.score}
                  totalQuestions={a.totalQuestions}
                  answers={a.answers ?? []}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {result !== undefined && filtered.length > PAGE_SIZE && (
          <Pagination
            page={safePage}
            onPrev={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => p + 1)}
            isLastPage={isLastPage}
            label={`पृष्ठ ${safePage + 1} / ${totalPages}`}
            className="mt-4"
          />
        )}
      </Card>
    </div>
  );
}
