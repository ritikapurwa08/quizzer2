"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { autoFixJson, validateAndIsolateQuestions, IsolatedImportResult } from "@/lib/importParser";
import { ImportJson, validateBatchQuality, QualityIssue } from "@/lib/validators/question";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { distributeAndShuffleAnswers } from "@/lib/utils";
import { PromptPreviewDialog } from "./PromptPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/Toast";
import {
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  Copy,
  Sparkles,
  Eye,
  Check,
  FileCode2,
  Shuffle,
  Info,
} from "lucide-react";
import { containsDevanagari } from "@/lib/utils";

interface SubjectOption {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface TopicOption {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface QuestionImportEditorProps {
  initialValue?: string;
  onChange: (
    value: string,
    parsed: ImportJson | null,
    errors: string[],
    isolated?: IsolatedImportResult
  ) => void;
  subjectsList?: SubjectOption[];
  topicsList?: TopicOption[];
  selectedSubjectId?: string;
  selectedTopicId?: string;
  onSubjectChangeId?: (id: string) => void;
  onTopicChangeId?: (id: string) => void;
  subtopicName: string;
  onSubtopicNameChange: (val: string) => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  negativeMarking: boolean;
  onNegativeMarkingChange: (enabled: boolean) => void;
  isImporting?: boolean;
  onImportClick?: () => void;
}

export function QuestionImportEditor({
  initialValue = "",
  onChange,
  subjectsList = [],
  topicsList = [],
  selectedSubjectId = "",
  selectedTopicId = "",
  onSubjectChangeId,
  onTopicChangeId,
  subtopicName,
  onSubtopicNameChange,
  questionCount,
  onQuestionCountChange,
  negativeMarking,
  onNegativeMarkingChange,
  isImporting = false,
  onImportClick,
}: QuestionImportEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [syntaxError, setSyntaxError] = useState<{ line: number | null; message: string } | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [qualityIssues, setQualityIssues] = useState<QualityIssue[]>([]);
  const [isolatedData, setIsolatedData] = useState<IsolatedImportResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef(code);
  const { showToast } = useToast();

  // Keep codeRef updated without causing re-render
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Synchronize from parent only when value genuinely changes externally (e.g. cleared on import)
  useEffect(() => {
    if (initialValue !== codeRef.current) {
      setCode(initialValue);
    }
  }, [initialValue]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Compute line count safely with upper cap to prevent DOM thrashing
  const lineCount = useMemo(() => {
    const rawLines = code.split("\n").length;
    return Math.min(Math.max(rawLines, 14), 500);
  }, [code]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [lineCount]);

  // Sync line-number scroll with textarea scroll
  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Debounced parsing and validation to prevent UI freeze and unblock navigation links
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = code.trim();
      if (!trimmed) {
        setSyntaxError(null);
        setSchemaErrors([]);
        setQualityIssues([]);
        setIsolatedData(null);
        onChangeRef.current(code, null, [], undefined);
        return;
      }

      try {
        const isolated = validateAndIsolateQuestions(code);
        setIsolatedData(isolated);

        if (isolated.invalidQuestions.length > 0) {
          const errs = isolated.invalidQuestions.map((iq) => iq.reason);
          setSchemaErrors(errs);
        } else {
          setSchemaErrors([]);
        }

        if (isolated.validQuestions.length > 0) {
          const { issues } = validateBatchQuality(isolated.validQuestions);
          setQualityIssues(issues);
          setSyntaxError(null);

          const fullPayload: ImportJson = {
            subject: isolated.metadata?.subject,
            topic: isolated.metadata?.topic,
            testSet: isolated.metadata?.testSet,
            negativeMarking: isolated.metadata?.negativeMarking,
            questions: isolated.validQuestions,
          };

          onChangeRef.current(
            code,
            fullPayload,
            isolated.invalidQuestions.map((iq) => iq.reason),
            isolated
          );
        } else {
          setQualityIssues([]);
          if (isolated.invalidQuestions.length > 0) {
            setSyntaxError({
              line: isolated.invalidQuestions[0].index,
              message: isolated.invalidQuestions[0].reason,
            });
          }
          onChangeRef.current(
            code,
            null,
            isolated.invalidQuestions.map((iq) => iq.reason),
            isolated
          );
        }
      } catch (err: any) {
        let line: number | null = null;
        const match =
          err.message?.match(/at line (\d+) column (\d+)/i) ||
          err.message?.match(/line (\d+)/i);
        if (match && match[1]) line = parseInt(match[1], 10);

        const errMsg = err.message || "Invalid JSON syntax.";
        setSyntaxError({ line, message: errMsg });
        setSchemaErrors([]);
        setQualityIssues([]);
        setIsolatedData(null);
        onChangeRef.current(code, null, [errMsg], undefined);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [code]);

  // Selected subject & topic objects for prompt generation
  const activeSubject = subjectsList.find((s) => s._id === selectedSubjectId);
  const activeTopic = topicsList.find((t) => t._id === selectedTopicId);

  const currentPrompt = generateAiQuestionPrompt({
    subject: activeSubject?.name || "Rajasthan General Knowledge",
    topic: activeTopic?.name || "General Topic",
    subtopic: subtopicName.trim() || undefined,
    count: questionCount,
  });

  function handleCopyAiPrompt() {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    showToast("📋 Exam-grade AI Prompt copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFormat() {
    if (!code.trim()) return;
    const { fixedText, success } = autoFixJson(code);
    if (success) {
      setCode(fixedText);
      showToast("✨ JSON formatted and cleaned successfully!", "success");
    } else {
      try {
        const parsed = JSON.parse(code);
        setCode(JSON.stringify(parsed, null, 2));
        showToast("✨ JSON formatted successfully!", "success");
      } catch (err: any) {
        showToast(err.message || "Cannot format invalid JSON.", "warning");
      }
    }
  }

  function handleShuffleAnswers() {
    if (!isolatedData || isolatedData.validQuestions.length === 0) {
      showToast("No valid questions found to shuffle.", "warning");
      return;
    }

    const { shuffledQuestions, distribution } = distributeAndShuffleAnswers(
      isolatedData.validQuestions
    );

    // Format minified or standard array
    const formatted = shuffledQuestions.map((q) => {
      // Map option ID back to 0-3 index for minified format
      let ansIdx = 0;
      if (q.correctAnswer === "opt2") ansIdx = 1;
      else if (q.correctAnswer === "opt3") ansIdx = 2;
      else if (q.correctAnswer === "opt4") ansIdx = 3;

      return {
        q: q.questionText,
        o: q.options.map((o) => o.text),
        a: ansIdx,
        e: q.explanation || "",
        t: q.type,
      };
    });

    setCode(JSON.stringify(formatted, null, 2));
    showToast(
      `🎲 Shuffled & Balanced! (A:${distribution.opt1}, B:${distribution.opt2}, C:${distribution.opt3}, D:${distribution.opt4})`,
      "success"
    );
  }

  const validCount = isolatedData?.validQuestions.length ?? 0;
  const invalidCount = isolatedData?.invalidQuestions.length ?? 0;
  const isValid = validCount > 0;

  return (
    <div className="space-y-4">
      {/* ── 1. Target Syllabus & AI Prompt Form ── */}
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
        <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground">
              Target Syllabus &amp; Exam-Grade AI Prompt
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            Step 1: Configure &amp; Copy Prompt
          </span>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Subject (विषय)
              </Label>
              <select
                value={selectedSubjectId}
                onChange={(e) => onSubjectChangeId?.(e.target.value)}
                className={`select-native h-10 text-xs font-medium${subjectsList.some((s) => containsDevanagari(s.name)) ? " font-hindi" : ""}`}
              >
                <option value="" disabled>Select Subject</option>
                {subjectsList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}{s.nameHindi ? ` (${s.nameHindi})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Topic (टॉपिक)
              </Label>
              <select
                value={selectedTopicId}
                onChange={(e) => onTopicChangeId?.(e.target.value)}
                disabled={topicsList.length === 0}
                className={`select-native h-10 text-xs font-medium${topicsList.some((t) => containsDevanagari(t.name)) ? " font-hindi" : ""}`}
              >
                <option value="" disabled>
                  {topicsList.length === 0 ? "Select a Subject first" : "Select Topic"}
                </option>
                {topicsList.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.nameHindi ? ` (${t.nameHindi})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Subtopic / Test Set Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Subtopic / Part (उप-टॉपिक)
              </Label>
              <Input
                value={subtopicName}
                onChange={(e) => onSubtopicNameChange(e.target.value)}
                placeholder="e.g. Part 1, Part 2, Prajamandal..."
                className="h-10 text-xs font-semibold px-3"
              />
            </div>

            {/* Questions Count */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Questions Count
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={questionCount}
                onChange={(e) => onQuestionCountChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-10 text-xs font-semibold px-3"
              />
            </div>
          </div>

          {/* Negative Marking & Prompt Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border/80">
            <div className="flex items-center justify-between sm:justify-start gap-2.5 py-1">
              <Label htmlFor="neg-marking" className="text-xs font-medium cursor-pointer text-muted-foreground order-1 sm:order-2">
                Negative Marking <span className="text-[11px] font-normal text-muted-foreground/70">(-0.33 per wrong)</span>
              </Label>
              <Switch
                id="neg-marking"
                checked={negativeMarking}
                onCheckedChange={onNegativeMarkingChange}
                className="order-2 sm:order-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="w-full sm:w-auto h-10 sm:h-9 gap-1.5 text-xs font-semibold rounded-xl justify-center"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview Prompt
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleCopyAiPrompt}
                className="w-full sm:w-auto h-10 sm:h-9 gap-1.5 text-xs font-semibold px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs justify-center"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy AI Prompt"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Direct JSON Paste Code Editor ── */}
      <div className="flex flex-col rounded-2xl border border-border overflow-hidden shadow-sm bg-card">
        {/* Editor Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/60 px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {syntaxError ? (
              <Badge variant="destructive" className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-semibold">
                <AlertCircle className="h-3 w-3 shrink-0" />
                JSON Syntax Error
              </Badge>
            ) : validCount > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-success/15 text-success border border-success/20 font-semibold">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {validCount} Question{validCount !== 1 ? "s" : ""} Ready
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {invalidCount} Skipped
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground text-xs truncate">
                Paste JSON response from ChatGPT / Gemini / Claude below
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {validCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleShuffleAnswers}
                className="h-8 gap-1.5 text-xs font-semibold rounded-lg text-primary hover:text-primary"
                title="Intelligently shuffle options and balance A/B/C/D correct answer distribution"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Balance &amp; Shuffle (A/B/C/D)
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormat}
              className="h-8 gap-1.5 text-xs font-semibold rounded-lg"
              title="Beautify & Auto-Fix JSON"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Format JSON
            </Button>
          </div>
        </div>

        {/* Textarea Code Workspace (Stable Fixed Height on Mobile & Desktop) */}
        <div className="relative flex h-[380px] min-h-[380px] max-h-[380px] bg-card font-mono text-xs overflow-hidden">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            aria-hidden="true"
            className="w-11 shrink-0 select-none bg-muted/30 border-r border-border/60 py-3.5 text-right font-mono text-[11px] text-muted-foreground/50 overflow-hidden leading-[1.625rem]"
          >
            {lineNumbers.map((num) => (
              <div
                key={num}
                className={`pr-2.5 ${syntaxError?.line === num ? "bg-destructive/20 text-destructive font-bold" : ""}`}
              >
                {num}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={syncScroll}
            placeholder={`[\n  {\n    "q": "राजस्थान का राज्य पक्षी कौन सा है?",\n    "o": ["गोडावण", "मोर", "तोता", "कबूतर"],\n    "a": 0,\n    "e": "गोडावण (Great Indian Bustard) राजस्थान का राज्य पक्षी है।",\n    "t": "mcq"\n  }\n]`}
            spellCheck={false}
            className="flex-1 resize-none bg-transparent p-3.5 font-mono text-xs sm:text-[13px] leading-[1.625rem] text-foreground focus:outline-none placeholder:text-muted-foreground/40 overflow-y-auto h-full box-border"
          />
        </div>

        {/* ── 3. Bottom Action Bar: Target Info + Direct "✓ Import" Button ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 px-4 sm:px-5 py-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 min-w-0 text-center sm:text-left">
            <span className="font-semibold text-foreground shrink-0">Target:</span>
            <span className="truncate">
              {activeSubject?.name || "Subject"} &rarr; {activeTopic?.name || "Topic"} &rarr; <span className="font-semibold text-foreground">{subtopicName || "Part 1"}</span>
            </span>
          </div>

          <Button
            type="button"
            onClick={onImportClick}
            disabled={!isValid || !selectedTopicId || !subtopicName.trim() || isImporting}
            className="w-full sm:w-auto h-11 sm:h-10 px-6 font-bold text-sm rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-95 transition-all cursor-pointer justify-center shrink-0"
          >
            <Check className="h-4 w-4 stroke-[2.5]" />
            {isImporting ? "Importing..." : `Import ${validCount > 0 ? `(${validCount})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Warnings & Diagnostics: Schema / Syntax Errors Display */}
      {syntaxError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">JSON Syntax Issue</AlertTitle>
          <AlertDescription className="text-xs mt-0.5">
            {syntaxError.line ? `Question / Line ${syntaxError.line}: ` : ""}
            {syntaxError.message}
          </AlertDescription>
        </Alert>
      )}

      {schemaErrors.length > 0 && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold">
            {schemaErrors.length} Malformed Question(s) Isolated
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <p className="mb-1 text-[11px] font-medium text-foreground">
              Valid questions will still import safely. The following items have issues:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
              {schemaErrors.slice(0, 5).map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
              {schemaErrors.length > 5 && (
                <li className="italic text-muted-foreground">...and {schemaErrors.length - 5} more issues</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Quality Gate Warnings */}
      {qualityIssues.length > 0 && (
        <Alert className="rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-xs font-bold">Exam Quality Advisory</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
              {qualityIssues.slice(0, 3).map((qi, idx) => (
                <li key={idx}>{qi.message}</li>
              ))}
              {qualityIssues.length > 3 && (
                <li className="italic">...and {qualityIssues.length - 3} other advisory points</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* AI Prompt Preview Modal */}
      <PromptPreviewDialog
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        promptText={currentPrompt}
        onCopySuccess={handleCopyAiPrompt}
      />
    </div>
  );
}
