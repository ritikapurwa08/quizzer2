"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Question } from "@/types";
import {
  QUESTION_TYPE_LABELS,
  LEGACY_TYPE_LABELS,
  QUESTION_TYPES,
  DIFFICULTIES,
  QuestionType,
  Difficulty,
} from "@/lib/constants";
import { AcceptedQuestionType } from "@/lib/validators/question";
import { cn, containsDevanagari } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  BookOpen,
  Layers,
  FileText,
} from "lucide-react";

// Student-view renderers — all accessed via the shared QUESTION_RENDERERS map
import { QuestionShell } from "@/components/quiz/QuestionShell";
import { McqRenderer } from "@/components/quiz/McqRenderer"; // fallback default
import { QUESTION_RENDERERS } from "@/components/quiz";

interface OptionItem {
  id: string;
  text: string;
}

interface QuestionEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: Question | null;
  onSaveSuccess?: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

// Maps difficulty to a color token
const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  hard: "bg-destructive/10 text-destructive border-destructive/30",
};

export function QuestionEditorModal({
  open,
  onOpenChange,
  question,
  onSaveSuccess,
}: QuestionEditorModalProps) {
  const updateQuestion = useMutation(api.questions.update);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states — AcceptedQuestionType covers both v2 canonical + legacy aliases from old DB rows
  const [type, setType] = useState<AcceptedQuestionType>("mcq");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { id: "opt1", text: "" },
    { id: "opt2", text: "" },
    { id: "opt3", text: "" },
    { id: "opt4", text: "" },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>("opt1");
  const [explanation, setExplanation] = useState("");
  const [reference, setReference] = useState("");
  const [meta, setMeta] = useState<any>({});

  useEffect(() => {
    if (!question) return;
    setType(question.type as AcceptedQuestionType);
    setDifficulty(question.difficulty as Difficulty);
    setQuestionText(question.questionText || "");
    setExplanation(question.explanation || "");
    setReference(question.reference || "");
    setMeta(question.meta ? JSON.parse(JSON.stringify(question.meta)) : {});

    setOptions(
      question.options && question.options.length > 0
        ? question.options.map((o, idx) => ({ id: o.id || `opt${idx + 1}`, text: o.text || "" }))
        : [
          { id: "opt1", text: "" },
          { id: "opt2", text: "" },
          { id: "opt3", text: "" },
          { id: "opt4", text: "" },
        ]
    );

    setCorrectAnswer(
      Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0] || "opt1"
        : question.correctAnswer || "opt1"
    );

    setErrorMsg(null);
    setActiveTab("edit");
  }, [question, open]);

  if (!question) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleOptionChange(index: number, text: string) {
    setOptions((prev) => {
      const updated = [...prev];
      if (updated[index]) updated[index] = { ...updated[index], text };
      return updated;
    });
  }

  function handleAddOption() {
    const nextIdx = options.length + 1;
    setOptions((prev) => [...prev, { id: `opt${nextIdx}`, text: "" }]);
  }

  function handleRemoveOption(index: number) {
    if (options.length <= 2) {
      showToast("A question must have at least 2 options.", "warning");
      return;
    }
    const targetOpt = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (targetOpt?.id === correctAnswer && newOptions[0]) {
      setCorrectAnswer(newOptions[0].id);
    }
  }

  function handleMetaListChange(key: "left" | "right" | "items", idx: number, val: string) {
    setMeta((prev: any) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      arr[idx] = typeof arr[idx] === "object" && arr[idx] !== null ? { ...arr[idx], text: val } : val;
      return { ...prev, [key]: arr };
    });
  }

  function handleAddMetaListItem(key: "left" | "right" | "items") {
    setMeta((prev: any) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      const label = key === "left" ? String.fromCharCode(65 + arr.length) : String(arr.length + 1);
      arr.push(key === "items" ? "" : `${label}. `);
      return { ...prev, [key]: arr };
    });
  }

  function handleRemoveMetaListItem(key: "left" | "right" | "items", idx: number) {
    setMeta((prev: any) => {
      const arr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      arr.splice(idx, 1);
      return { ...prev, [key]: arr };
    });
  }

  function validateForm(): boolean {
    if (!questionText.trim()) { setErrorMsg("Question text cannot be empty."); return false; }
    if (type !== "true_false") {
      const emptyIdx = options.findIndex((o) => !o.text.trim());
      if (emptyIdx !== -1) { setErrorMsg(`Option ${OPTION_LETTERS[emptyIdx] ?? emptyIdx + 1} cannot be empty.`); return false; }
    }
    if (!correctAnswer) { setErrorMsg("Please select a correct answer."); return false; }
    if (!options.map((o) => o.id).includes(correctAnswer)) { setErrorMsg("Selected correct answer is invalid."); return false; }
    setErrorMsg(null);
    return true;
  }

  async function handleSave() {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await updateQuestion({
        id: question!._id,
        type,
        difficulty,
        questionText: questionText.trim(),
        options: options.map((o) => ({ id: o.id, text: o.text.trim() })),
        correctAnswer,
        explanation: explanation.trim() || undefined,
        reference: reference.trim() || undefined,
        meta,
      });
      showToast("✅ Question updated successfully!", "success");
      onSaveSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save question", "warning");
      setErrorMsg(err.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  const isQuestionHindi = containsDevanagari(questionText);
  const isExplanationHindi = containsDevanagari(explanation);

  const previewQuestion: Question = {
    ...question,
    type,
    difficulty,
    questionText,
    options: options.map((o) => ({ id: o.id, text: o.text })),
    correctAnswer,
    explanation,
    reference,
    meta,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Full-screen on mobile (inset-0), large panel on desktop.
        The dialog itself is a flex column so the footer always sticks to the bottom.
      */}
      <DialogContent
        showCloseButton={false}
        className={cn(
          // Mobile: full-screen sheet
          "fixed inset-0 z-50 m-0 w-screen max-w-none h-[100dvh] rounded-none",
          // Desktop: centered panel
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:w-[min(900px,96vw)] sm:max-w-none sm:h-[min(92vh,860px)] sm:rounded-2xl",
          // Layout
          "flex flex-col gap-0 p-0 overflow-hidden border border-border bg-background shadow-2xl"
        )}
      >
        {/* ── Top Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border bg-muted/30 shrink-0">
          {/* Left: icon + title + meta chips */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pencil className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-bold text-foreground leading-tight truncate">
                Edit Question
              </DialogTitle>
              {/* Inline meta chips */}
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 uppercase tracking-wide font-semibold">
                  {QUESTION_TYPE_LABELS[type as QuestionType] ?? LEGACY_TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                </Badge>
                <span className={cn(
                  "inline-flex items-center rounded px-1.5 py-0 text-[10px] font-semibold border capitalize",
                  DIFFICULTY_STYLES[difficulty] || "bg-muted text-muted-foreground border-border"
                )}>
                  {difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Editor / Preview tab + Close */}
          <div className="flex items-center gap-2 shrink-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
              <TabsList className="h-8 p-1 bg-muted gap-0.5">
                <TabsTrigger value="edit" className="h-6 text-[11px] font-semibold px-2.5 gap-1">
                  <Pencil className="h-3 w-3" />
                  <span className="hidden xs:inline">Editor</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="h-6 text-[11px] font-semibold px-2.5 gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden xs:inline">Preview</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close dialog"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-5">

            {/* Error banner */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/8 px-3.5 py-3 text-xs text-destructive font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === "edit" ? (
              <div className="space-y-5">

                {/* ── Section 1: Metadata ── */}
                <section>
                  <SectionHeading icon={<Layers className="h-3.5 w-3.5" />} label="Metadata" />
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Type */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Question Type
                      </Label>
                      <Select
                        value={type}
                        onValueChange={(val: string | null) => val && setType(val as AcceptedQuestionType)}
                      >
                        <SelectTrigger className="h-10 text-xs font-semibold bg-card border-border">
                          <SelectValue placeholder="Type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t} className="text-xs font-semibold">
                              {QUESTION_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Difficulty */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Difficulty
                      </Label>
                      <Select
                        value={difficulty}
                        onValueChange={(val: string | null) => val && setDifficulty(val as Difficulty)}
                      >
                        <SelectTrigger className="h-10 text-xs font-semibold capitalize bg-card border-border">
                          <SelectValue placeholder="Difficulty..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {DIFFICULTIES.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs font-semibold capitalize">
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Reference */}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        Reference <span className="normal-case font-normal">(optional)</span>
                      </Label>
                      <Input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="e.g. NCERT Class 11"
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                {/* ── Section 2: Question Text ── */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <SectionHeading icon={<FileText className="h-3.5 w-3.5" />} label="Question Text" />
                    {isQuestionHindi && (
                      <span className="text-[10px] text-primary font-semibold bg-primary/8 border border-primary/20 rounded px-1.5 py-0.5">
                        Anek Devanagari
                      </span>
                    )}
                  </div>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Enter the main question text here..."
                    className={cn(
                      "w-full min-h-[100px] sm:min-h-[120px] rounded-xl border border-border bg-card px-4 py-3 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y placeholder:text-muted-foreground/50",
                      isQuestionHindi && "font-hindi"
                    )}
                  />
                </section>

                {/* ── Section 2b: Type-Specific Metadata (match / match_following) ── */}
                {(type === "match" || type === "match_following") && (
                  <>
                    <Separator />
                    <section>
                      <SectionHeading icon={<BookOpen className="h-3.5 w-3.5" />} label="Match Lists (सूची I & II)" />
                      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* List I */}
                        <MetaListEditor
                          heading="List – I (सूची I)"
                          items={(meta.left || meta.columnA || []) as any[]}
                          onAdd={() => handleAddMetaListItem("left")}
                          onRemove={(i) => handleRemoveMetaListItem("left", i)}
                          onChange={(i, v) => handleMetaListChange("left", i, v)}
                          getLabel={(i) => String.fromCharCode(65 + i)}
                        />
                        {/* List II */}
                        <MetaListEditor
                          heading="List – II (सूची II)"
                          items={(meta.right || meta.columnB || []) as any[]}
                          onAdd={() => handleAddMetaListItem("right")}
                          onRemove={(i) => handleRemoveMetaListItem("right", i)}
                          onChange={(i, v) => handleMetaListChange("right", i, v)}
                          getLabel={(i) => String(i + 1)}
                        />
                      </div>
                    </section>
                  </>
                )}

                <Separator />

                {/* ── Section 3: Options ── */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <SectionHeading icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Answer Options (विकल्प)" />
                    <Button
                      type="button" variant="outline" size="sm"
                      onClick={handleAddOption}
                      className="h-7 text-xs gap-1 shrink-0"
                    >
                      <Plus className="h-3 w-3" /> Add Option
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {options.map((opt, idx) => {
                      const letter = OPTION_LETTERS[idx] ?? `${idx + 1}`;
                      const isCorrect = correctAnswer === opt.id;
                      const isHindi = containsDevanagari(opt.text);

                      return (
                        <div
                          key={opt.id || idx}
                          className={cn(
                            "relative flex flex-col rounded-xl border bg-card transition-all",
                            isCorrect
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-muted-foreground/40"
                          )}
                        >
                          {/* Option card header */}
                          <div className={cn(
                            "flex items-center justify-between gap-2 px-3 py-2 rounded-t-xl border-b",
                            isCorrect
                              ? "bg-primary/8 border-primary/20"
                              : "bg-muted/40 border-border"
                          )}>
                            <div className="flex items-center gap-2">
                              {/* Letter badge */}
                              <span className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold border",
                                isCorrect
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border"
                              )}>
                                {letter}
                              </span>
                              {/* Option ID */}
                              <code className="text-[10px] text-muted-foreground bg-muted rounded px-1 py-0.5">
                                {opt.id}
                              </code>
                              {isHindi && (
                                <span className="text-[9px] text-primary bg-primary/8 border border-primary/20 rounded px-1 font-semibold">
                                  हिं
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Correct answer toggle */}
                              <button
                                type="button"
                                onClick={() => setCorrectAnswer(opt.id)}
                                title={isCorrect ? "Correct answer" : "Mark as correct"}
                                className={cn(
                                  "flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all border",
                                  isCorrect
                                    ? "bg-success/15 text-success border-success/40"
                                    : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:border-border"
                                )}
                              >
                                <CheckCircle2 className={cn("h-3.5 w-3.5 shrink-0", isCorrect ? "text-success" : "")} />
                                {isCorrect ? "Correct" : "Set correct"}
                              </button>
                              {/* Remove */}
                              {options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(idx)}
                                  title="Remove option"
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Option textarea */}
                          <textarea
                            value={opt.text}
                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                            placeholder={`Option ${letter} text...`}
                            rows={2}
                            className={cn(
                              "w-full rounded-b-xl border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed focus:outline-none resize-y min-h-[60px]",
                              isHindi && "font-hindi"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct answer summary bar */}
                  {correctAnswer && (() => {
                    const correctIdx = options.findIndex((o) => o.id === correctAnswer);
                    const correctOpt = options[correctIdx];
                    const correctLetter = OPTION_LETTERS[correctIdx] ?? "?";
                    const isHindi = correctOpt ? containsDevanagari(correctOpt.text) : false;
                    return correctOpt ? (
                      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/8 px-3.5 py-3">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-success mb-0.5">
                            Correct Answer — Option {correctLetter} <code className="font-mono font-normal text-[10px] opacity-70">({correctAnswer})</code>
                          </p>
                          <p className={cn("text-xs text-foreground leading-relaxed truncate", isHindi && "font-hindi")}>
                            {correctOpt.text || "(empty)"}
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </section>

                <Separator />

                {/* ── Section 4: Explanation ── */}
                <section>
                  <div className="flex items-center justify-between mb-2.5">
                    <SectionHeading icon={<HelpCircle className="h-3.5 w-3.5" />} label="Explanation (व्याख्या)" />
                    {isExplanationHindi && (
                      <span className="text-[10px] text-primary font-semibold bg-primary/8 border border-primary/20 rounded px-1.5 py-0.5">
                        Anek Devanagari
                      </span>
                    )}
                  </div>
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide a clear explanation for why this answer is correct..."
                    rows={4}
                    className={cn(
                      "w-full min-h-[90px] rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y placeholder:text-muted-foreground/50",
                      isExplanationHindi && "font-hindi"
                    )}
                  />
                </section>

              </div>
            ) : (
              /* ── Student Preview Tab ── */
              <div className="space-y-5 py-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl px-3.5 py-2.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Live preview — exactly as students see this question during a quiz.</span>
                </div>

                <QuestionShell
                  number={1}
                  type={type}
                  questionText={questionText || "Question text will appear here..."}
                  isBookmarked={false}
                  onToggleBookmark={() => { }}
                  reviewBadge="correct"
                >
                  {/* Use the shared QUESTION_RENDERERS map for all types incl. legacy */}
                  {(() => {
                    const Renderer = QUESTION_RENDERERS[type] ?? McqRenderer;
                    return <Renderer question={previewQuestion} selected={correctAnswer} onSelect={() => {}} mode="review" />;
                  })()}

                  {explanation && (
                    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 space-y-1.5">
                      <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5" />
                        Explanation (व्याख्या)
                      </h5>
                      <p className={cn(
                        "text-sm text-foreground leading-relaxed whitespace-pre-line",
                        containsDevanagari(explanation) && "font-hindi"
                      )}>
                        {explanation}
                      </p>
                    </div>
                  )}
                </QuestionShell>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Sticky Footer ───────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-border bg-muted/20">
          {/* Left: question ID hint */}
          <p className="text-[11px] text-muted-foreground hidden sm:block truncate">
            {question._id}
          </p>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-10 px-5 text-sm font-semibold flex-1 sm:flex-none sm:min-w-[88px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-6 text-sm font-semibold gap-2 flex-1 sm:flex-none sm:min-w-[130px] bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function SectionHeading({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

interface MetaListEditorProps {
  heading: string;
  items: any[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, val: string) => void;
  getLabel: (idx: number) => string;
}

function MetaListEditor({ heading, items, onAdd, onRemove, onChange, getLabel }: MetaListEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground">{heading}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd} className="h-6 text-[11px] gap-1 px-2 text-primary">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="space-y-1.5">
        {items.map((item: any, idx: number) => {
          const txt = typeof item === "string" ? item : item?.text || "";
          const isHindi = containsDevanagari(txt);
          return (
            <div key={idx} className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground text-xs font-bold">
                {getLabel(idx)}
              </span>
              <Input
                value={txt}
                onChange={(e) => onChange(idx, e.target.value)}
                className={cn("h-9 text-sm flex-1", isHindi && "font-hindi")}
              />
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground py-2 text-center">No items yet. Click Add.</p>
        )}
      </div>
    </div>
  );
}
