"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Pencil,
  Eye,
  CheckCircle2,
  BookOpen,
  Layers,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionEditorModal } from "@/components/admin/QuestionEditorModal";
import { LoadingSpinner } from "@/components/shared/LoadingState";
import { Question } from "@/types";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { cn, containsDevanagari } from "@/lib/utils";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";
import { stripLeadingMarker } from "@/lib/validators/question";
import { healOptionText } from "@/lib/optionTextHealer";

const SUBJECT_OPTIONS = [
  { value: "all", label: "All Subjects (सभी विषय)" },
  { value: "राजस्थान सामान्य ज्ञान एवं भूगोल", label: "राजस्थान सामान्य ज्ञान एवं भूगोल (15 Topics)" },
  { value: "राजस्थान का इतिहास", label: "राजस्थान का इतिहास (10 Topics)" },
  { value: "राजस्थान कला एवं संस्कृति", label: "राजस्थान कला एवं संस्कृति (15 Topics)" },
  { value: "राजस्थान राजव्यवस्था एवं प्रशासन", label: "राजस्थान राजव्यवस्था एवं प्रशासन (15 Topics)" },
  { value: "English", label: "English (Paper-II)" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "all", label: "All Question Types (सभी प्रकार)" },
  { value: "match_following", label: "🔗 Match the Following (सुमेलित करें)" },
  { value: "table", label: "📊 Table Question (तालिका)" },
  { value: "sequence", label: "🔢 Sequence (कालक्रम / क्रम)" },
  { value: "mcq", label: "📝 Standard MCQ (बहुविकल्पीय)" },
];

interface PracticeSetOption {
  id: string;
  name: string;
  questionCount: number;
  order: number;
}

/**
 * Renders structured question bodies (Match Following tables, Markdown/HTML tables, Sequence items)
 * directly in the admin question card so admins immediately see what the question is asking to match.
 */
function QuestionStructuredBody({ question }: { question: any }) {
  const enriched = enrichQuestionStructure(question);
  const type = enriched?.type || "mcq";
  const meta = enriched?.meta || {};

  const isMatch =
    type === "match_following" ||
    Boolean(meta.left && meta.left.length > 0) ||
    Boolean(meta.columnA && meta.columnA.length > 0);

  const isTable =
    type === "table" ||
    Boolean(meta.headers && meta.headers.length >= 2);

  const isSequence =
    type === "sequence" ||
    Boolean(meta.items && meta.items.length >= 2);

  if (isMatch) {
    const rawLeft = meta.left || meta.columnA || [];
    const rawRight = meta.right || meta.columnB || [];
    const isHindi = containsDevanagari(question.questionText || "");
    const leftHeader = meta.leftTitle || (isHindi ? "सूची – I" : "List – I");
    const rightHeader = meta.rightTitle || (isHindi ? "सूची – II" : "List – II");

    const columnA = rawLeft.map((item: any, i: number) => {
      const defaultId = String.fromCharCode(65 + i);
      if (typeof item === "object" && item !== null) {
        return {
          id: String(item.id || defaultId).toUpperCase(),
          text: healOptionText(stripLeadingMarker(item.text ?? item.value ?? "")),
        };
      }
      return { id: defaultId, text: healOptionText(stripLeadingMarker(String(item ?? ""))) };
    });

    const columnB = rawRight.map((item: any, i: number) => {
      const defaultId = String(i + 1);
      if (typeof item === "object" && item !== null) {
        return {
          id: String(item.id || defaultId),
          text: healOptionText(stripLeadingMarker(item.text ?? item.value ?? "")),
        };
      }
      return { id: defaultId, text: healOptionText(stripLeadingMarker(String(item ?? ""))) };
    });

    const rowCount = Math.max(columnA.length, columnB.length);
    if (rowCount === 0) return null;

    return (
      <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-2xs my-2.5">
        <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi divide-x divide-border/60">
          <div className="px-3 sm:px-4 py-2 flex items-center">
            <span>{leftHeader}</span>
          </div>
          <div className="px-3 sm:px-4 py-2 flex items-center">
            <span>{rightHeader}</span>
          </div>
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: rowCount }).map((_, rIdx) => {
            const itemA = columnA[rIdx];
            const itemB = columnB[rIdx];
            return (
              <div key={rIdx} className="grid grid-cols-2 divide-x divide-border/60 hover:bg-muted/20 transition-colors">
                <div className="p-2 sm:p-2.5 flex items-start gap-2">
                  {itemA ? (
                    <>
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                        {itemA.id}
                      </span>
                      <span className="leading-snug text-xs sm:text-sm font-normal text-foreground font-hindi flex-1 pt-0.5">
                        {itemA.text}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>
                <div className="p-2 sm:p-2.5 flex items-start gap-2">
                  {itemB ? (
                    <>
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-md bg-secondary text-secondary-foreground text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                        {itemB.id}
                      </span>
                      <span className="leading-snug text-xs sm:text-sm font-normal text-foreground font-hindi flex-1 pt-0.5">
                        {itemB.text}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isTable) {
    const headers: string[] = meta.headers || [];
    const rows: any[] = meta.rows || [];
    if (headers.length === 0 || rows.length === 0) return null;

    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-card/60 shadow-2xs my-2.5">
        <table className="w-full text-xs sm:text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                {Array.isArray(row) ? (
                  row.map((cell: any, j: number) => (
                    <td key={j} className="px-3.5 py-2 text-foreground font-normal font-hindi">
                      {healOptionText(String(cell ?? ""))}
                    </td>
                  ))
                ) : (
                  <td colSpan={headers.length} className="px-3.5 py-2 text-foreground font-normal font-hindi">
                    {healOptionText(String(row ?? ""))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (isSequence) {
    const rawItems: any[] = meta.items || [];
    if (rawItems.length === 0) return null;

    return (
      <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3 my-2.5">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
          Sequence Items (क्रमबद्ध घटक):
        </div>
        <div className="space-y-1.5">
          {rawItems.map((item: any, sIdx: number) => (
            <div key={sIdx} className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-card px-3 py-1.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                {item.id || String(sIdx + 1).padStart(2, "0")}
              </span>
              <span className="text-xs sm:text-sm text-foreground font-normal leading-snug font-hindi">
                {healOptionText(typeof item === "string" ? item : item.text || String(item))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function AdminQuestionsPage() {
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
  const [selectedSetId, setSelectedSetId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [availableSets, setAvailableSets] = useState<PracticeSetOption[]>([]);
  const [page, setPage] = useState(0);

  // Data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor modal state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset downstream filters when subject filter changes
  const handleSubjectChange = (val: string | null) => {
    setSelectedSubject(val || "all");
    setSelectedTopicId("all");
    setSelectedSetId("all");
    setAvailableSets([]);
    setPage(0);
  };

  // Reset set filter when topic filter changes
  const handleTopicChange = (val: string | null) => {
    setSelectedTopicId(val || "all");
    setSelectedSetId("all");
    setPage(0);
  };

  const handleSetChange = (val: string | null) => {
    setSelectedSetId(val || "all");
    setPage(0);
  };

  const handleTypeChange = (val: string | null) => {
    setSelectedType(val || "all");
    setPage(0);
  };

  // Filter topics for the topic dropdown based on selected subject
  const availableTopics = useMemo(() => {
    if (selectedSubject === "all") return MASTER_TOPICS_LIST;
    return MASTER_TOPICS_LIST.filter(
      (t) =>
        t.subjectHindi.toLowerCase().includes(selectedSubject.toLowerCase()) ||
        t.subjectName.toLowerCase().includes(selectedSubject.toLowerCase())
    );
  }, [selectedSubject]);

  // Fetch questions from API
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedTerm.trim()) params.set("term", debouncedTerm.trim());
      if (selectedSubject !== "all") params.set("subject", selectedSubject);
      if (selectedTopicId !== "all") params.set("masterTopicId", selectedTopicId);
      if (selectedSetId !== "all") params.set("setId", selectedSetId);
      if (selectedType !== "all") params.set("type", selectedType);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load questions");
      }
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.availableSets) {
        setAvailableSets(data.availableSets);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }, [debouncedTerm, selectedSubject, selectedTopicId, selectedSetId, selectedType, page]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleEditClick = (q: Question) => {
    setEditingQuestion(q);
    setEditorOpen(true);
  };

  const handleSaveSuccess = (updatedQuestion?: any) => {
    if (updatedQuestion && updatedQuestion.id) {
      setQuestions((prev) =>
        prev.map((q) => ((q as any).id === updatedQuestion.id || q._id === updatedQuestion.id ? updatedQuestion : q))
      );
    } else {
      fetchQuestions();
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedTopicId("all");
    setSelectedSetId("all");
    setSelectedType("all");
    setAvailableSets([]);
    setPage(0);
  };

  const hasActiveFilters =
    debouncedTerm.trim().length > 0 ||
    selectedSubject !== "all" ||
    selectedTopicId !== "all" ||
    selectedSetId !== "all" ||
    selectedType !== "all";

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Question Editor &amp; Bank
                <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border">
                  Local Pool
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Format question text, verify &amp; change options and answers, and live-preview questions exactly as students see them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-card border-border">
            Total Qs: {total.toLocaleString()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchQuestions()}
            disabled={loading}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Filters Card ── */}
      <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs space-y-3.5">
        {/* Row 1: Search Box + Question Type Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-7 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, ID (e.g. rg_015367), exam or explanation..."
              className="pl-9 pr-8 h-10 text-xs sm:text-sm rounded-xl bg-background border-border"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Question Type Filter */}
          <div className="md:col-span-5">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-background border-border font-medium">
                <SelectValue placeholder="All Question Types">
                  {QUESTION_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label || "All Question Types"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-72">
                {QUESTION_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm cursor-pointer">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: 3-Tier Cascading Filter (Subject -> Topic -> Practice Set) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-border/50">
          {/* Tier 1: Subject Filter */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>1. विषय (Subject)</span>
            </label>
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-background border-border">
                <SelectValue placeholder="All Subjects">
                  {SUBJECT_OPTIONS.find((sub) => sub.value === selectedSubject)?.label || "All Subjects"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-72">
                {SUBJECT_OPTIONS.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value} className="text-xs sm:text-sm cursor-pointer">
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier 2: Master Topic Filter */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>2. टॉपिक (Topic)</span>
              {availableTopics.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-normal">({availableTopics.length})</span>
              )}
            </label>
            <Select value={selectedTopicId} onValueChange={handleTopicChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-background border-border">
                <SelectValue placeholder="All Topics">
                  {selectedTopicId === "all"
                    ? `All Topics (${availableTopics.length})`
                    : availableTopics.find((t) => String(t.id) === selectedTopicId)
                    ? `#${selectedTopicId} ${availableTopics.find((t) => String(t.id) === selectedTopicId)?.nameHindi}`
                    : "All Topics"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-72">
                <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer font-medium">
                  All Topics ({availableTopics.length})
                </SelectItem>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic.id} value={String(topic.id)} className="text-xs sm:text-sm cursor-pointer">
                    #{topic.id} {topic.nameHindi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tier 3: Practice Set Filter */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>3. अभ्यास सेट (Practice Set)</span>
              {availableSets.length > 0 && (
                <span className="text-[10px] text-primary font-semibold">({availableSets.length} Sets)</span>
              )}
            </label>
            <Select
              value={selectedSetId}
              onValueChange={handleSetChange}
              disabled={selectedTopicId === "all"}
            >
              <SelectTrigger
                className={cn(
                  "h-10 text-xs sm:text-sm rounded-xl bg-background border-border",
                  selectedTopicId === "all" && "opacity-60 cursor-not-allowed"
                )}
              >
                <SelectValue placeholder={selectedTopicId === "all" ? "पहले टॉपिक चुनें (Select Topic first)" : "All Sets"}>
                  {selectedTopicId === "all"
                    ? "पहले टॉपिक चुनें (Select Topic first)"
                    : selectedSetId === "all"
                    ? `All Sets (${availableSets.length})`
                    : availableSets.find((s) => s.id === selectedSetId)?.name || "All Sets"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-72">
                <SelectItem value="all" className="text-xs sm:text-sm cursor-pointer font-medium">
                  All Sets ({availableSets.length})
                </SelectItem>
                {availableSets.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs sm:text-sm cursor-pointer">
                    {s.name} ({s.questionCount} Qs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips and Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-foreground">{questions.length}</strong> of{" "}
              <strong className="text-foreground">{total.toLocaleString()}</strong> questions
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {totalPages > 1 && (
            <div className="text-[11px] font-medium">
              Page {page + 1} of {totalPages}
            </div>
          )}
        </div>
      </Card>

      {/* ── Questions List ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="text-xs text-muted-foreground mt-3">Loading questions from local pool...</p>
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-destructive/5 border-destructive/20 rounded-2xl">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-semibold text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchQuestions()} className="mt-4 text-xs">
            Try Again
          </Button>
        </Card>
      ) : questions.length === 0 ? (
        <Card className="p-12 text-center bg-card border-border rounded-2xl space-y-3">
          <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-foreground">No Questions Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No questions matched your search criteria. Try modifying your search term or clearing the filters.
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs mt-2">
              Clear All Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3.5">
          {questions.map((q, idx) => {
            const qId = (q as any).id || (q as any).canonicalId || q._id;
            const topicNum = (q as any).masterTopicId || (q as any).topicId;
            const topicInfo = topicNum ? MASTER_TOPICS_LIST.find((t) => t.id === Number(topicNum)) : null;
            const correctOptId = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
            const examInfo = (q as any).exam || q.meta?.exam;

            return (
              <Card
                key={qId || idx}
                className="p-4 sm:p-5 bg-card border border-border/80 hover:border-foreground/30 transition-all rounded-2xl shadow-2xs space-y-3"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {topicInfo && (
                      <Badge variant="outline" className="text-[11px] font-semibold bg-muted/60 border-border">
                        #{topicInfo.id} {topicInfo.nameHindi}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      ID: {qId}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold text-muted-foreground">
                      {q.type || "mcq"}
                    </Badge>
                    {examInfo ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium">
                        {examInfo}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-medium text-muted-foreground/80">
                        Practice Question
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleEditClick(q)}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-xl self-start sm:self-auto shrink-0 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 transition-colors cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit &amp; Preview</span>
                  </Button>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-medium text-foreground leading-relaxed pt-1">
                  {healOptionText(q.questionText || (q as any).question || "Untitled Question")}
                </div>

                {/* Structured Question Body (Match Following 2-column table, Markdown Table, Sequence Items) */}
                <QuestionStructuredBody question={q} />

                {/* Options Display */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = opt.id === correctOptId;
                      const optLetters = ["A", "B", "C", "D", "E", "F"];
                      const letter = optLetters[optIdx] || String(optIdx + 1);

                      return (
                        <div
                          key={opt.id || optIdx}
                          className={cn(
                            "flex items-start gap-2.5 p-2.5 rounded-xl border text-xs sm:text-sm transition-colors",
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200 font-medium"
                              : "bg-muted/30 border-border/60 text-muted-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {letter}
                          </span>
                          <span className="flex-1 min-w-0 leading-snug">{healOptionText(opt.text)}</span>
                          {isCorrect && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation Snippet */}
                {q.explanation && (
                  <div className="text-xs text-muted-foreground bg-muted/30 border border-border/40 rounded-xl p-3 leading-relaxed">
                    <span className="font-semibold text-foreground/80 mr-1.5">Explanation:</span>
                    {q.explanation}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Pagination Footer ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="h-9 px-4 text-xs font-semibold rounded-xl gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-xs text-muted-foreground">
            Page <strong className="text-foreground">{page + 1}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="h-9 px-4 text-xs font-semibold rounded-xl gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Question Editor & Preview Modal ── */}
      <QuestionEditorModal
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        question={editingQuestion}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}
