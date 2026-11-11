"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionReviewCard } from "@/components/quiz";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { AlertCircle, Bookmark, CheckCircle2 } from "lucide-react";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";
import { resolveQuestions } from "@/lib/questionsClient";
import { Question } from "@/types";

const WRONG_PAGE_SIZE = 15;
const BOOKMARK_PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "latest", label: "Recently Missed" },
  { value: "most_missed", label: "Most Missed" },
  { value: "oldest", label: "Oldest Missed" },
];

type SortBy = "latest" | "most_missed" | "oldest";
type ActiveTab = "wrong" | "bookmarks";

function SavedQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "bookmarks" ? "bookmarks" : "wrong";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

  // Sync tab with URL query parameter
  const setTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/saved-questions?${params.toString()}`);
  };

  useEffect(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab === "bookmarks" && activeTab !== "bookmarks") {
      setActiveTab("bookmarks");
    } else if (paramTab === "wrong" && activeTab !== "wrong") {
      setActiveTab("wrong");
    }
  }, [searchParams, activeTab]);

  // ── Shared Queries ──
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const userBookmarkIds = useQuery(api.bookmarks.listQuestionIdsByUser) ?? [];
  const bookmarkedIds = useMemo(() => new Set(userBookmarkIds), [userBookmarkIds]);
  const allSubjects = useQuery(api.subjects.list) ?? [];

  // ── Wrong Questions State & Data ──
  const [wrongSubjectId, setWrongSubjectId] = useState("all");
  const [wrongTopicId, setWrongTopicId] = useState("all");
  const [wrongSortBy, setWrongSortBy] = useState<SortBy>("latest");
  const [wrongPage, setWrongPage] = useState(0);

  const wrongData = useQuery(api.wrongQuestions.listByUserWithMeta);
  const wrongTopics = useQuery(
    api.topics.listBySubject,
    wrongSubjectId !== "all" ? { subjectId: wrongSubjectId as any } : "skip"
  ) ?? [];

  const wrongSubjectOptions = useMemo(() => [
    { value: "all", label: "All Subjects" },
    ...(wrongData?.subjectsWithCounts || []).map((s) => ({
      value: s.subjectId,
      label: `${s.nameHindi || s.name} (${s.count})`,
    })),
  ], [wrongData]);

  const wrongTopicOptions = useMemo(() => {
    if (wrongSubjectId === "all") return [];
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Topics" }];
    for (const t of wrongTopics) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [wrongTopics, wrongSubjectId]);

  const filteredWrongQuestions = useMemo(() => {
    if (!wrongData?.items) return [];

    const filtered = wrongData.items.filter((item) => {
      if (wrongSubjectId !== "all" && item.subjectId !== wrongSubjectId) return false;
      if (wrongTopicId !== "all" && item.topicId !== wrongTopicId) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (wrongSortBy === "most_missed") {
        if (b.wrongQuestion.missCount !== a.wrongQuestion.missCount) {
          return b.wrongQuestion.missCount - a.wrongQuestion.missCount;
        }
        return b.wrongQuestion.lastMissedAt - a.wrongQuestion.lastMissedAt;
      }
      if (wrongSortBy === "oldest") {
        return a.wrongQuestion.lastMissedAt - b.wrongQuestion.lastMissedAt;
      }
      return b.wrongQuestion.lastMissedAt - a.wrongQuestion.lastMissedAt;
    });

    // Deduplicate by questionId
    const seen = new Set<string>();
    const deduped: typeof sorted = [];
    for (const item of sorted) {
      const qId = String(item.questionId || "").trim();
      if (!qId || seen.has(qId)) continue;
      seen.add(qId);
      deduped.push(item);
    }
    return deduped;
  }, [wrongData, wrongSubjectId, wrongTopicId, wrongSortBy]);

  const totalWrongPages = Math.max(1, Math.ceil(filteredWrongQuestions.length / WRONG_PAGE_SIZE));
  const safeWrongPage = Math.min(wrongPage, totalWrongPages - 1);
  const pageWrongItems = filteredWrongQuestions.slice(
    safeWrongPage * WRONG_PAGE_SIZE,
    safeWrongPage * WRONG_PAGE_SIZE + WRONG_PAGE_SIZE
  );
  const isWrongLastPage = safeWrongPage >= totalWrongPages - 1;

  // ── Bookmarks State & Data ──
  const [bmSubjectId, setBmSubjectId] = useState("all");
  const [bmTopicId, setBmTopicId] = useState("all");
  const [bmPage, setBmPage] = useState(0);

  const bmData = useQuery(api.bookmarks.listByUserWithMeta);
  const bmTopics = useQuery(
    api.topics.listBySubject,
    bmSubjectId !== "all" ? { subjectId: bmSubjectId as any } : "skip"
  ) ?? [];

  const bmSubjectOptions = useMemo(() => [
    { value: "all", label: "All Subjects" },
    ...allSubjects.map((s) => ({ value: s._id, label: getSubjectDisplayName(s) })),
  ], [allSubjects]);

  const bmTopicOptions = useMemo(() => {
    if (bmSubjectId === "all") return [];
    const opts: { value: string; label: string }[] = [{ value: "all", label: "All Topics" }];
    for (const t of bmTopics) {
      opts.push({ value: t._id, label: getTopicDisplayName(t) });
    }
    return opts;
  }, [bmTopics, bmSubjectId]);

  const filteredBookmarks = useMemo(() => {
    if (!bmData) return [];
    const filtered = bmData.filter((item) => {
      if (bmSubjectId !== "all" && item.subjectId !== bmSubjectId) return false;
      if (bmTopicId !== "all" && item.topicId !== bmTopicId) return false;
      return true;
    });

    // Deduplicate by questionId
    const seen = new Set<string>();
    const deduped: typeof filtered = [];
    for (const item of filtered) {
      const qId = String(item.questionId || "").trim();
      if (!qId || seen.has(qId)) continue;
      seen.add(qId);
      deduped.push(item);
    }
    return deduped;
  }, [bmData, bmSubjectId, bmTopicId]);

  const totalBmPages = Math.max(1, Math.ceil(filteredBookmarks.length / BOOKMARK_PAGE_SIZE));
  const safeBmPage = Math.min(bmPage, totalBmPages - 1);
  const pageBmItems = filteredBookmarks.slice(
    safeBmPage * BOOKMARK_PAGE_SIZE,
    safeBmPage * BOOKMARK_PAGE_SIZE + BOOKMARK_PAGE_SIZE
  );
  const isBmLastPage = safeBmPage >= totalBmPages - 1;

  const totalWrongCount = wrongData?.items?.length ?? 0;
  const totalBmCount = bmData?.length ?? 0;

  // ── Local-First Question Resolution (Optimized with stable batch key & zero duplicate renders) ──
  const [resolvedQuestions, setResolvedQuestions] = useState<Record<string, Question>>({});
  const requestedIdsRef = useRef<Set<string>>(new Set());

  const batchKey = useMemo(() => {
    const ids: string[] = [];
    if (activeTab === "wrong") {
      for (const item of pageWrongItems) {
        if (item.questionId) ids.push(item.questionId);
      }
    } else {
      for (const item of pageBmItems) {
        if (item.questionId) ids.push(item.questionId);
      }
    }
    return ids.join(",");
  }, [activeTab, pageWrongItems, pageBmItems]);

  useEffect(() => {
    if (!batchKey) return;
    const ids = batchKey.split(",").filter(Boolean);
    const toFetch = ids.filter((id) => !requestedIdsRef.current.has(id));
    if (toFetch.length === 0) return;

    // Immediately mark as requested to prevent duplicate fetches or infinite loops
    for (const id of toFetch) {
      requestedIdsRef.current.add(id);
    }

    resolveQuestions(toFetch).then((res) => {
      if (res && Object.keys(res).length > 0) {
        setResolvedQuestions((prev) => ({ ...prev, ...res }));
      }
    }).catch((err) => {
      console.error("Failed to resolve batch questions:", err);
    });
  }, [batchKey]);

  return (
    <div className="space-y-6 pb-12">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Saved Questions" },
        ]}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Saved &amp; Review Questions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Review questions you missed during practice tests or bookmarked for revision.
          </p>
        </div>

        {/* ── Segmented Tab Switcher (Crisp "चौकोर" Linear / Raycast Style) ── */}
        <div className="inline-flex items-center p-0.5 rounded-md bg-secondary/80 border border-border self-start sm:self-auto gap-0.5">
          <button
            type="button"
            onClick={() => setTab("wrong")}
            className={cn(
              "inline-flex items-center gap-2 h-8 px-3 rounded-sm text-xs font-medium transition-all cursor-pointer border",
              activeTab === "wrong"
                ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
            )}
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>Wrong Questions</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.2 rounded-xs tabular-nums border",
                activeTab === "wrong"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : "bg-muted text-muted-foreground border-transparent"
              )}
            >
              {totalWrongCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTab("bookmarks")}
            className={cn(
              "inline-flex items-center gap-2 h-8 px-3 rounded-sm text-xs font-medium transition-all cursor-pointer border",
              activeTab === "bookmarks"
                ? "bg-card text-foreground border-border shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
            )}
          >
            <Bookmark className="h-3.5 w-3.5 text-amber-500" />
            <span>Bookmarks</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.2 rounded-xs tabular-nums border",
                activeTab === "bookmarks"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-muted text-muted-foreground border-transparent"
              )}
            >
              {totalBmCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: WRONG QUESTIONS ── */}
      {activeTab === "wrong" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar
              subjects={wrongSubjectOptions}
              selectedSubject={wrongSubjectId}
              onSubjectChange={(v) => {
                setWrongSubjectId(v);
                setWrongTopicId("all");
                setWrongPage(0);
              }}
              topics={wrongTopicOptions}
              selectedTopic={wrongTopicId}
              onTopicChange={(v) => {
                setWrongTopicId(v);
                setWrongPage(0);
              }}
              sortOptions={SORT_OPTIONS}
              selectedSort={wrongSortBy}
              onSortChange={(v) => {
                setWrongSortBy(v as SortBy);
                setWrongPage(0);
              }}
            />

            {filteredWrongQuestions.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium tabular-nums ml-auto">
                Showing {safeWrongPage * WRONG_PAGE_SIZE + 1}–
                {Math.min((safeWrongPage + 1) * WRONG_PAGE_SIZE, filteredWrongQuestions.length)} of{" "}
                {filteredWrongQuestions.length}
              </span>
            )}
          </div>

          {wrongData === undefined ? (
            <LoadingState message="Loading wrong questions..." />
          ) : filteredWrongQuestions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={
                wrongSubjectId !== "all" || wrongTopicId !== "all"
                  ? "No wrong questions match the selected filters"
                  : "No wrong questions recorded yet!"
              }
              description={
                wrongSubjectId !== "all" || wrongTopicId !== "all"
                  ? "Try changing your subject or topic filter."
                  : "Great work! Any questions you miss during tests will appear here for targeted revision."
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {(() => {
                  const seenCanonical = new Set<string>();
                  return pageWrongItems.map(({ wrongQuestion, questionId }, idx) => {
                    const question = resolvedQuestions[questionId];
                    if (!question) {
                      return (
                        <div key={wrongQuestion._id} className="p-4 rounded-xl border border-border/50 bg-card/50 text-xs text-muted-foreground animate-pulse">
                          Loading question...
                        </div>
                      );
                    }
                    const canonicalKey = question.canonicalId || question._id || question.id || question.questionText;
                    if (canonicalKey && seenCanonical.has(canonicalKey)) return null;
                    if (canonicalKey) seenCanonical.add(canonicalKey);

                    return (
                      <QuestionReviewCard
                        key={wrongQuestion._id}
                        number={safeWrongPage * WRONG_PAGE_SIZE + idx + 1}
                        question={question}
                        selectedAnswer={undefined}
                        isBookmarked={bookmarkedIds.has(questionId)}
                        onToggleBookmark={() => {
                          toggleBookmark({ questionId });
                        }}
                        missCount={wrongQuestion.missCount}
                      />
                    );
                  });
                })()}
              </div>

              {filteredWrongQuestions.length > WRONG_PAGE_SIZE && (
                <Pagination
                  page={safeWrongPage}
                  onPrev={() => setWrongPage((p) => Math.max(0, p - 1))}
                  onNext={() => setWrongPage((p) => p + 1)}
                  isLastPage={isWrongLastPage}
                  label={`Page ${safeWrongPage + 1} of ${totalWrongPages}`}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 2: BOOKMARKS ── */}
      {activeTab === "bookmarks" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterBar
              subjects={bmSubjectOptions}
              selectedSubject={bmSubjectId}
              onSubjectChange={(v) => {
                setBmSubjectId(v);
                setBmTopicId("all");
                setBmPage(0);
              }}
              topics={bmTopicOptions}
              selectedTopic={bmTopicId}
              onTopicChange={(v) => {
                setBmTopicId(v);
                setBmPage(0);
              }}
            />

            {filteredBookmarks.length > 0 && (
              <span className="text-xs text-muted-foreground font-medium tabular-nums ml-auto">
                Showing {safeBmPage * BOOKMARK_PAGE_SIZE + 1}–
                {Math.min((safeBmPage + 1) * BOOKMARK_PAGE_SIZE, filteredBookmarks.length)} of{" "}
                {filteredBookmarks.length}
              </span>
            )}
          </div>

          {bmData === undefined ? (
            <LoadingState message="Loading bookmarked questions..." />
          ) : filteredBookmarks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title={
                bmSubjectId !== "all" || bmTopicId !== "all"
                  ? "No bookmarks match the selected filters"
                  : "No bookmarks saved yet"
              }
              description={
                bmSubjectId !== "all" || bmTopicId !== "all"
                  ? "Try changing your subject or topic filter."
                  : "Bookmark tricky questions during quiz reviews to save them here for quick revision."
              }
            />
          ) : (
            <>
              <div className="space-y-4">
                {(() => {
                  const seenCanonical = new Set<string>();
                  return pageBmItems.map(({ bookmark, questionId }, idx) => {
                    const question = resolvedQuestions[questionId];
                    if (!question) {
                      return (
                        <div key={bookmark._id} className="p-4 rounded-xl border border-border/50 bg-card/50 text-xs text-muted-foreground animate-pulse">
                          Loading bookmark...
                        </div>
                      );
                    }
                    const canonicalKey = question.canonicalId || question._id || question.id || question.questionText;
                    if (canonicalKey && seenCanonical.has(canonicalKey)) return null;
                    if (canonicalKey) seenCanonical.add(canonicalKey);

                    return (
                      <QuestionReviewCard
                        key={bookmark._id}
                        number={safeBmPage * BOOKMARK_PAGE_SIZE + idx + 1}
                        question={question}
                        selectedAnswer={undefined}
                        isBookmarked={true}
                        onToggleBookmark={() => {
                          toggleBookmark({ questionId });
                        }}
                      />
                    );
                  });
                })()}
              </div>

              {filteredBookmarks.length > BOOKMARK_PAGE_SIZE && (
                <Pagination
                  page={safeBmPage}
                  onPrev={() => setBmPage((p) => Math.max(0, p - 1))}
                  onNext={() => setBmPage((p) => p + 1)}
                  isLastPage={isBmLastPage}
                  label={`Page ${safeBmPage + 1} of ${totalBmPages}`}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SavedQuestionsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading saved questions..." />}>
      <SavedQuestionsContent />
    </Suspense>
  );
}
