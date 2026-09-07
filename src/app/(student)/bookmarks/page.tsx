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

  // Build topic options for selected subject (derived from bookmark data)
  const topicOptions = useMemo(() => {
    if (selectedSubjectId === "all" || !allBookmarks) return [];
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [{ value: "all", label: "सभी टॉपिक" }];
    for (const item of allBookmarks) {
      if (item.subjectId === selectedSubjectId && item.topicId && !seen.has(item.topicId)) {
        seen.add(item.topicId);
        // We'll just use the topicId as the label for now (resolved below)
        opts.push({ value: item.topicId, label: item.topicId });
      }
    }
    return opts;
  }, [allBookmarks, selectedSubjectId]);

  // Get topic names from questions' testSets via subjects query
  const topicsForSubject = useQuery(
    api.topics.listBySubject,
    selectedSubjectId !== "all" ? { subjectId: selectedSubjectId as any } : "skip",
  ) ?? [];

  const namedTopicOptions = useMemo(() => {
    if (selectedSubjectId === "all") return [];
    const opts: { value: string; label: string }[] = [{ value: "all", label: "सभी टॉपिक" }];
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
    { value: "all", label: "सभी विषय" },
    ...subjects.map((s) => ({ value: s._id, label: getSubjectDisplayName(s) })),
  ];

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "सहेजे गए बुकमार्क" }]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          सहेजे गए बुकमार्क
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          बाद में पुनरावृत्ति (Revision) के लिए आपके द्वारा सहेजे गए महत्वपूर्ण प्रश्न।
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FilterBar
          subjects={subjectOptions}
          selectedSubject={selectedSubjectId}
          onSubjectChange={handleSubjectChange}
          topics={namedTopicOptions}
          selectedTopic={selectedTopicId}
          onTopicChange={handleTopicChange}
        />
        {allBookmarks && (
          <span className="text-xs text-muted-foreground font-hindi">
            {filtered.length} बुकमार्क
          </span>
        )}
      </div>

      {/* Loading */}
      {allBookmarks === undefined && <LoadingState />}

      {/* Empty */}
      {allBookmarks !== undefined && filtered.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title={selectedSubjectId !== "all" ? "इस विषय में कोई बुकमार्क नहीं" : "अभी कोई बुकमार्क नहीं है"}
          description={
            selectedSubjectId !== "all"
              ? "कोई अन्य विषय या टॉपिक चुनें।"
              : "टेस्ट हल करते समय या परिणाम स्क्रीन पर किसी भी प्रश्न के बुकमार्क आइकन पर क्लिक करके उसे यहाँ सहेजें।"
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
          ) : null,
        )}
      </div>

      {/* Pagination */}
      {allBookmarks !== undefined && filtered.length > PAGE_SIZE && (
        <Pagination
          page={safePage}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
          isLastPage={isLastPage}
          label={`पृष्ठ ${safePage + 1} / ${totalPages}`}
        />
      )}
    </div>
  );
}
