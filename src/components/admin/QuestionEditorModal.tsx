"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Question } from "@/types";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  DIFFICULTIES,
  QuestionType,
  Difficulty,
} from "@/lib/constants";
import { cn, containsDevanagari } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

// Student View Renderers for Live Preview
import { QuestionShell } from "@/components/quiz/QuestionShell";
import { McqRenderer } from "@/components/quiz/McqRenderer";
import { MatchFollowingRenderer } from "@/components/quiz/MatchFollowingRenderer";
import { SequenceRenderer } from "@/components/quiz/SequenceRenderer";
import { TableRenderer } from "@/components/quiz/TableRenderer";
import { TrueFalseRenderer } from "@/components/quiz/TrueFalseRenderer";
import { StatementReasonRenderer } from "@/components/quiz/StatementReasonRenderer";
import { AssertionReasonRenderer } from "@/components/quiz/AssertionReasonRenderer";

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

  // Form states
  const [type, setType] = useState<QuestionType>("mcq");
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

  // Sync modal state when question prop changes
  useEffect(() => {
    if (question) {
      setType(question.type as QuestionType);
      setDifficulty(question.difficulty as Difficulty);
      setQuestionText(question.questionText || "");
      setExplanation(question.explanation || "");
      setReference(question.reference || "");
      setMeta(question.meta ? JSON.parse(JSON.stringify(question.meta)) : {});

      // Normalize options — ensure at least 4 options exist for standard MCQ
      const defaultOpts: OptionItem[] = [
        { id: "opt1", text: "" },
        { id: "opt2", text: "" },
        { id: "opt3", text: "" },
        { id: "opt4", text: "" },
      ];
      if (question.options && question.options.length > 0) {
        setOptions(
          question.options.map((o, idx) => ({
            id: o.id || `opt${idx + 1}`,
            text: o.text || "",
          }))
        );
      } else {
        setOptions(defaultOpts);
      }

      // Normalize correct answer
      if (Array.isArray(question.correctAnswer)) {
        setCorrectAnswer(question.correctAnswer[0] || "opt1");
      } else {
        setCorrectAnswer(question.correctAnswer || "opt1");
      }

      setErrorMsg(null);
      setActiveTab("edit");
    }
  }, [question, open]);

  if (!question) return null;

  // Handle option text change
  function handleOptionChange(index: number, text: string) {
    setOptions((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], text };
      }
      return updated;
    });
  }

  // Handle adding option
  function handleAddOption() {
    const nextIdx = options.length + 1;
    const newId = `opt${nextIdx}`;
    setOptions((prev) => [...prev, { id: newId, text: "" }]);
  }

  // Handle removing option
  function handleRemoveOption(index: number) {
    if (options.length <= 2) {
      showToast("A question must have at least 2 options.", "warning");
      return;
    }
    const targetOpt = options[index];
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);

    // If removed option was the correct answer, reset correct answer to first remaining option
    if (targetOpt && targetOpt.id === correctAnswer && newOptions[0]) {
      setCorrectAnswer(newOptions[0].id);
    }
  }

  // Handle Meta array modifications for Match Following & Sequence
  function handleMetaListChange(key: "left" | "right" | "items", idx: number, val: string) {
    setMeta((prev: any) => {
      const currentArr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      if (typeof currentArr[idx] === "object" && currentArr[idx] !== null) {
        currentArr[idx] = { ...currentArr[idx], text: val };
      } else {
        currentArr[idx] = val;
      }
      return { ...prev, [key]: currentArr };
    });
  }

  function handleAddMetaListItem(key: "left" | "right" | "items") {
    setMeta((prev: any) => {
      const currentArr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      const newId = key === "left" ? String.fromCharCode(65 + currentArr.length) : String(currentArr.length + 1);
      currentArr.push(key === "items" ? "" : `${newId}. Item ${currentArr.length + 1}`);
      return { ...prev, [key]: currentArr };
    });
  }

  function handleRemoveMetaListItem(key: "left" | "right" | "items", idx: number) {
    setMeta((prev: any) => {
      const currentArr = Array.isArray(prev?.[key]) ? [...prev[key]] : [];
      currentArr.splice(idx, 1);
      return { ...prev, [key]: currentArr };
    });
  }

  // Validation before saving
  function validateForm(): boolean {
    if (!questionText.trim()) {
      setErrorMsg("Question text cannot be empty.");
      return false;
    }

    if (type !== "true_false") {
      const emptyOptIndex = options.findIndex((o) => !o.text.trim());
      if (emptyOptIndex !== -1) {
        setErrorMsg(`Option ${OPTION_LETTERS[emptyOptIndex] || emptyOptIndex + 1} cannot be empty.`);
        return false;
      }
    }

    if (!correctAnswer) {
      setErrorMsg("Please select a correct answer.");
      return false;
    }

    const validOptionIds = options.map((o) => o.id);
    if (!validOptionIds.includes(correctAnswer)) {
      setErrorMsg("The selected correct answer option does not exist.");
      return false;
    }

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
      console.error("Failed to update question:", err);
      showToast(err.message || "Failed to save question", "warning");
      setErrorMsg(err.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  // Devanagari typography check
  const isQuestionHindi = containsDevanagari(questionText);
  const isExplanationHindi = containsDevanagari(explanation);

  // Construct dummy question object for live preview
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-0 flex flex-col gap-0 overflow-hidden border border-border shadow-xl rounded-2xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Edit Question
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Modify text, options, correct answer, and metadata.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "edit" | "preview")}
              className="w-auto"
            >
              <TabsList className="h-9 p-1 bg-muted">
                <TabsTrigger
                  value="edit"
                  className="h-7 text-xs font-semibold px-3 gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editor
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="h-7 text-xs font-semibold px-3 gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Student Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <ScrollArea className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "edit" ? (
            <div className="space-y-6">
              {/* Top Controls Grid: Type, Difficulty, Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card p-4 rounded-xl border border-border">
                {/* Question Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Question Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(val) => setType(val as QuestionType)}
                  >
                    <SelectTrigger className="h-9 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {QUESTION_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Difficulty Level
                  </Label>
                  <Select
                    value={difficulty}
                    onValueChange={(val) => setDifficulty(val as Difficulty)}
                  >
                    <SelectTrigger className="h-9 text-xs font-medium capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTIES.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs capitalize">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reference / Source */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Reference / Source (Optional)
                  </Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. NCERT Class 11, RPSC 2021"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Question Text Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    Question Text (प्रश्न)
                    {isQuestionHindi && (
                      <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground py-0">
                        Anek Devanagari
                      </Badge>
                    )}
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    Supports line breaks & Hindi text
                  </span>
                </div>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Enter the main question text here..."
                  className={cn(
                    "w-full min-h-[110px] rounded-xl border border-border bg-background p-3.5 text-sm sm:text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y",
                    isQuestionHindi && "font-hindi"
                  )}
                />
              </div>

              {/* ── Type-Specific Editors for Match Following / Sequence / Table ── */}
              {type === "match_following" && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Match Lists Metadata (सूची I & सूची II)
                    </h4>
                    <span className="text-[11px] text-muted-foreground">
                      Side-by-side match list items
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* List I */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">List - I (सूची - I)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddMetaListItem("left")}
                          className="h-6 text-[11px] gap-1 px-2 text-primary"
                        >
                          <Plus className="h-3 w-3" /> Add Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {((meta.left || meta.columnA || []) as any[]).map((item: any, idx: number) => {
                          const itemText = typeof item === "string" ? item : item?.text || "";
                          const isHindi = containsDevanagari(itemText);
                          return (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-center">
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <Input
                                value={itemText}
                                onChange={(e) => handleMetaListChange("left", idx, e.target.value)}
                                className={cn("h-8 text-xs flex-1", isHindi && "font-hindi")}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMetaListItem("left", idx)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* List II */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">List - II (सूची - II)</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddMetaListItem("right")}
                          className="h-6 text-[11px] gap-1 px-2 text-primary"
                        >
                          <Plus className="h-3 w-3" /> Add Item
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {((meta.right || meta.columnB || []) as any[]).map((item: any, idx: number) => {
                          const itemText = typeof item === "string" ? item : item?.text || "";
                          const isHindi = containsDevanagari(itemText);
                          return (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0 text-center">
                                {idx + 1}
                              </span>
                              <Input
                                value={itemText}
                                onChange={(e) => handleMetaListChange("right", idx, e.target.value)}
                                className={cn("h-8 text-xs flex-1", isHindi && "font-hindi")}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveMetaListItem("right", idx)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {type === "sequence" && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Sequence Items (क्रमानुसार सूची)
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddMetaListItem("items")}
                      className="h-6 text-[11px] gap-1 px-2 text-primary"
                    >
                      <Plus className="h-3 w-3" /> Add Sequence Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {((meta.items || []) as any[]).map((item: any, idx: number) => {
                      const itemText = typeof item === "string" ? item : item?.text || "";
                      const isHindi = containsDevanagari(itemText);
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <Input
                            value={itemText}
                            onChange={(e) => handleMetaListChange("items", idx, e.target.value)}
                            className={cn("h-8 text-xs flex-1", isHindi && "font-hindi")}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMetaListItem("items", idx)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Options Editors (A, B, C, D) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Answer Options (विकल्प)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Option
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {options.map((opt, idx) => {
                    const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
                    const isSelectedAnswer = correctAnswer === opt.id;
                    const isHindi = containsDevanagari(opt.text);

                    return (
                      <div
                        key={opt.id || idx}
                        className={cn(
                          "relative flex flex-col gap-2 rounded-xl border p-3 transition-all bg-card shadow-2xs",
                          isSelectedAnswer
                            ? "border-primary/80 ring-2 ring-primary/20 bg-primary/[0.02]"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        {/* Option Header Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold border transition-colors",
                                isSelectedAnswer
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border"
                              )}
                            >
                              {letter}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground font-mono">
                              ID: {opt.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Make correct answer button */}
                            <button
                              type="button"
                              onClick={() => setCorrectAnswer(opt.id)}
                              className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer",
                                isSelectedAnswer
                                  ? "bg-success/15 text-success border border-success/30 font-bold"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                              )}
                            >
                              <CheckCircle2
                                className={cn(
                                  "h-3.5 w-3.5",
                                  isSelectedAnswer ? "text-success fill-success/20" : "text-muted-foreground"
                                )}
                              />
                              {isSelectedAnswer ? "Correct Answer" : "Set as Correct"}
                            </button>

                            {options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Remove option"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Option Input Textarea */}
                        <textarea
                          value={opt.text}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Enter Option ${letter} text...`}
                          className={cn(
                            "w-full min-h-[60px] rounded-lg border border-border bg-background p-2.5 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y",
                            isHindi && "font-hindi"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Correct Answer Visual Selector ── */}
              <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Correct Answer Selector (सही उत्तर चयन)
                </Label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {options.map((opt, idx) => {
                    const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
                    const isSelected = correctAnswer === opt.id;
                    const isHindi = containsDevanagari(opt.text);

                    return (
                      <button
                        key={opt.id || idx}
                        type="button"
                        onClick={() => setCorrectAnswer(opt.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all cursor-pointer select-none",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "border-border bg-card text-foreground hover:bg-muted/70"
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={cn(
                              "text-xs font-bold px-1.5 py-0.5 rounded",
                              isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                          >
                            Option {letter}
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                        </div>
                        <span
                          className={cn(
                            "text-xs truncate w-full mt-0.5",
                            isHindi && "font-hindi"
                          )}
                        >
                          {opt.text || `(Empty Option ${letter})`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Explanation Editor */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  Explanation / Detailed Answer (व्याख्या)
                  {isExplanationHindi && (
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground py-0">
                      Anek Devanagari
                    </Badge>
                  )}
                </Label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Provide a clear, educational explanation for why this answer is correct..."
                  className={cn(
                    "w-full min-h-[90px] rounded-xl border border-border bg-background p-3.5 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y",
                    isExplanationHindi && "font-hindi"
                  )}
                />
              </div>
            </div>
          ) : (
            /* ── Student Preview Tab ── */
            <div className="space-y-6 py-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>
                  This preview renders the question exactly as a student sees it during quizzes and test sets.
                </span>
              </div>

              <QuestionShell
                number={1}
                type={type}
                questionText={questionText || "Question text will appear here..."}
                isBookmarked={false}
                onToggleBookmark={() => {}}
                reviewBadge="correct"
              >
                {type === "mcq" && (
                  <McqRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "statement_reason" && (
                  <StatementReasonRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "assertion_reason" && (
                  <AssertionReasonRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "match_following" && (
                  <MatchFollowingRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "sequence" && (
                  <SequenceRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "table" && (
                  <TableRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}
                {type === "true_false" && (
                  <TrueFalseRenderer
                    question={previewQuestion}
                    selected={correctAnswer}
                    onSelect={() => {}}
                    mode="review"
                  />
                )}

                {/* Explanation Card in Student Preview */}
                {explanation && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1.5">
                    <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Explanation (व्याख्या)
                    </h5>
                    <p
                      className={cn(
                        "text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line",
                        containsDevanagari(explanation) && "font-hindi"
                      )}
                    >
                      {explanation}
                    </p>
                  </div>
                )}
              </QuestionShell>
            </div>
          )}
        </ScrollArea>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-t border-border bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {question?._id ? `Question ID: ${question._id}` : ""}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-9 px-4 text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-9 px-5 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
