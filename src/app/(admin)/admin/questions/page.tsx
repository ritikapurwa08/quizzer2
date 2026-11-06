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
import { cn } from "@/lib/utils";

const SUBJECT_OPTIONS = [
  { value: "all", label: "All Subjects (सभी विषय)" },
  { value: "राजस्थान सामान्य ज्ञान एवं भूगोल", label: "राजस्थान सामान्य ज्ञान एवं भूगोल (15 Topics)" },
  { value: "राजस्थान का इतिहास", label: "राजस्थान का इतिहास (10 Topics)" },
  { value: "राजस्थान कला एवं संस्कृति", label: "राजस्थान कला एवं संस्कृति (15 Topics)" },
  { value: "राजस्थान राजव्यवस्था एवं प्रशासन", label: "राजस्थान राजव्यवस्था एवं प्रशासन (15 Topics)" },
  { value: "English", label: "English (Paper-II)" },
];

export default function AdminQuestionsPage() {
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");
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

  // Reset page when subject or topic filter changes
  const handleSubjectChange = (val: string | null) => {
    setSelectedSubject(val || "all");
    setSelectedTopicId("all");
    setPage(0);
  };

  const handleTopicChange = (val: string | null) => {
    setSelectedTopicId(val || "all");
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
    } catch (err: any) {
      setError(err?.message || "Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }, [debouncedTerm, selectedSubject, selectedTopicId, page]);

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
    setPage(0);
  };

  const hasActiveFilters = debouncedTerm.trim().length > 0 || selectedSubject !== "all" || selectedTopicId !== "all";

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
      <Card className="p-4 bg-card border border-border/80 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by words, ID (rg_...), exam or explanation..."
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

          {/* Subject Filter */}
          <div className="md:col-span-4">
            <Select value={selectedSubject} onValueChange={handleSubjectChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-background border-border">
                <SelectValue placeholder="All Subjects" />
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

          {/* Master Topic Filter */}
          <div className="md:col-span-3">
            <Select value={selectedTopicId} onValueChange={handleTopicChange}>
              <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl bg-background border-border">
                <SelectValue placeholder="All Topics" />
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
                    {examInfo && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-medium">
                        {examInfo}
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
                  {q.questionText || (q as any).question || "Untitled Question"}
                </div>

                {/* 4 Options Display */}
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
                          <span className="flex-1 min-w-0 leading-snug">{opt.text}</span>
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
