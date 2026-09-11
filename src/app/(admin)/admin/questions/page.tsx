"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Question } from "@/types";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QuestionEditorModal } from "@/components/admin/QuestionEditorModal";
import { Pagination } from "@/components/shared/Pagination";
import { LoadingSpinner } from "@/components/shared/LoadingState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getQuestionTypeLabel } from "@/lib/constants";
import { containsDevanagari, cn } from "@/lib/utils";
import { Trash2, Pencil, Search, FilterX } from "lucide-react";

const PAGE_SIZE = 15;

export default function AdminQuestionsPage() {
  // Filter states
  const [term, setTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [examFilter, setExamFilter] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search term by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(term);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [term]);

  // Load subject & topic options
  const subjects = useQuery(api.subjects.list) ?? [];
  const topics = useQuery(
    api.topics.listBySubject,
    selectedSubjectId ? { subjectId: selectedSubjectId as Id<"subjects"> } : "skip"
  ) ?? [];

  // Query filtered questions
  const queryArgs = useMemo(() => {
    return {
      term: debouncedTerm.trim() || undefined,
      subjectId: selectedSubjectId ? (selectedSubjectId as Id<"subjects">) : undefined,
      topicId: selectedTopicId ? (selectedTopicId as Id<"topics">) : undefined,
      sourceType: selectedSource !== "all" ? selectedSource : undefined,
      exam: examFilter.trim() || undefined,
      limit: 100,
    };
  }, [debouncedTerm, selectedSubjectId, selectedTopicId, selectedSource, examFilter]);

  const hasFilterActive =
    debouncedTerm.trim().length > 0 ||
    Boolean(selectedSubjectId) ||
    Boolean(selectedTopicId) ||
    selectedSource !== "all" ||
    examFilter.trim().length > 0;

  const rawResults = useQuery(
    api.questions.search,
    hasFilterActive ? queryArgs : "skip"
  );

  const isSearching = hasFilterActive && rawResults === undefined;
  const results = rawResults ?? [];

  // Pagination
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginatedResults = useMemo(() => {
    const start = page * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, page]);

  const removeQuestion = useMutation(api.questions.remove);

  const [deleteTarget, setDeleteTarget] = useState<Id<"questions"> | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);

  function openEdit(q: (typeof results)[number]) {
    setEditTarget(q as Question);
  }

  function handleSubjectChange(val: string | null) {
    setSelectedSubjectId(val && val !== "all" ? val : "");
    setSelectedTopicId("");
    setPage(0);
  }

  function handleTopicChange(val: string | null) {
    setSelectedTopicId(val && val !== "all" ? val : "");
    setPage(0);
  }

  function handleSourceChange(val: string | null) {
    setSelectedSource(val ?? "all");
    setPage(0);
  }

  function resetAllFilters() {
    setTerm("");
    setDebouncedTerm("");
    setSelectedSubjectId("");
    setSelectedTopicId("");
    setSelectedSource("all");
    setExamFilter("");
    setPage(0);
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Question Bank</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Search, filter by topic/exam, edit questions, and manage question bank entries.
        </p>
      </div>

      {/* ── Search Bar & Filter Controls ── */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-xs">
        {/* Search input with search icon */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search questions by text, keywords, or explanation..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="pl-9 h-10 text-sm font-hindi rounded-xl border-border bg-background shadow-none"
          />
        </div>

        {/* Filter dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Subject Filter */}
          <Select value={selectedSubjectId || "all"} onValueChange={handleSubjectChange}>
            <SelectTrigger className="h-9 text-xs font-semibold bg-background border-border">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs font-semibold">
                All Subjects
              </SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s._id} value={s._id} className="text-xs font-hindi">
                  {s.nameHindi || s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Topic Filter */}
          <Select
            value={selectedTopicId || "all"}
            onValueChange={handleTopicChange}
            disabled={!selectedSubjectId || topics.length === 0}
          >
            <SelectTrigger className="h-9 text-xs font-semibold bg-background border-border disabled:opacity-50">
              <SelectValue placeholder={selectedSubjectId ? "All Topics" : "Select Subject First"} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs font-semibold">
                All Topics
              </SelectItem>
              {topics.map((t) => (
                <SelectItem key={t._id} value={t._id} className="text-xs font-hindi">
                  {t.nameHindi || t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source Filter */}
          <Select value={selectedSource} onValueChange={handleSourceChange}>
            <SelectTrigger className="h-9 text-xs font-semibold bg-background border-border">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all" className="text-xs font-semibold">
                All Sources
              </SelectItem>
              <SelectItem value="PYQ" className="text-xs font-semibold">
                📄 PYQ
              </SelectItem>
              <SelectItem value="PYQ_MODIFIED" className="text-xs font-semibold">
                ✎ PYQ Modified
              </SelectItem>
              <SelectItem value="AI_NEW" className="text-xs font-semibold">
                ✦ AI Generated
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Exam Filter (or Reset Button) */}
          {selectedSource === "PYQ" ? (
            <Input
              placeholder="Exam name..."
              value={examFilter}
              onChange={(e) => {
                setExamFilter(e.target.value);
                setPage(0);
              }}
              className="h-9 text-xs font-hindi bg-background border-border rounded-xl"
            />
          ) : hasFilterActive ? (
            <button
              type="button"
              onClick={resetAllFilters}
              className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <FilterX className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* ── Results Area ── */}
      {!hasFilterActive ? (
        <p className="text-sm text-muted-foreground py-12 text-center font-hindi">
          प्रश्न खोजने के लिए ऊपर खोजें या विषय / टॉपिक फ़िल्टर चुनें।
        </p>
      ) : isSearching ? (
        <div className="flex items-center justify-center py-14 text-sm text-muted-foreground gap-2.5 font-hindi">
          <LoadingSpinner size="sm" />
          <span>खोज रहे हैं…</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              कुल परिणाम: <strong className="text-foreground">{results.length}</strong>
            </span>
            {totalPages > 1 && (
              <span>
                पृष्ठ {page + 1} / {totalPages}
              </span>
            )}
          </div>

          <DataTable
            rows={paginatedResults}
            rowKey={(q) => q._id}
            emptyMessage="कोई प्रश्न नहीं मिला।"
            columns={[
              {
                header: "Question",
                render: (q) => {
                  const isHindi = containsDevanagari(q.questionText);
                  return (
                    <div className="space-y-1">
                      <span
                        className={cn(
                          "line-clamp-2 text-sm text-foreground leading-snug font-medium",
                          isHindi && "font-hindi"
                        )}
                      >
                        {q.questionText}
                      </span>
                      {q.meta?.exam && (
                        <span className="inline-block text-[11px] text-muted-foreground font-hindi truncate max-w-sm">
                          {q.meta.exam}
                        </span>
                      )}
                    </div>
                  );
                },
                className: "px-3 py-2.5 max-w-md",
              },
              {
                header: "Source",
                render: (q) => {
                  const st = q.meta?.sourceType;
                  return (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 whitespace-nowrap",
                        st === "AI_NEW" && "border-primary/30 text-primary bg-primary/10",
                        st === "PYQ_MODIFIED" && "border-amber-500/30 text-amber-500 bg-amber-500/10"
                      )}
                    >
                      {st === "AI_NEW" ? "AI Generated" : st === "PYQ_MODIFIED" ? "PYQ Modified" : "PYQ"}
                    </Badge>
                  );
                },
              },
              {
                header: "Type",
                render: (q) => (
                  <Badge variant="outline" className="text-[10.5px] px-2 py-0.5 rounded-full font-hindi font-medium">
                    {getQuestionTypeLabel(q.type)}
                  </Badge>
                ),
              },
              {
                header: "Difficulty",
                render: (q) => (
                  <span className="text-xs capitalize text-muted-foreground font-medium">
                    {q.difficulty}
                  </span>
                ),
              },
              {
                header: "",
                render: (q) => (
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      type="button"
                      onClick={() => openEdit(q)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit question"
                      aria-label="Edit question"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(q._id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                      title="Delete question"
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ),
              },
            ]}
          />

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              isLastPage={page >= totalPages - 1}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              label={`पृष्ठ ${page + 1} / ${totalPages}`}
            />
          )}
        </div>
      )}

      {/* Comprehensive Question Editor Modal */}
      <QuestionEditorModal
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        question={editTarget}
        onSaveSuccess={() => setEditTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete question?"
        description="This action cannot be undone."
        onConfirm={() => deleteTarget && removeQuestion({ id: deleteTarget })}
      />
    </div>
  );
}
