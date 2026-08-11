"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { autoFixJson } from "@/lib/importParser";
import { importJsonSchema, ImportJson } from "@/lib/validators/question";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { PromptPreviewDialog } from "./PromptPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/Toast";
import {
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  Copy,
  Sparkles,
  Eye,
  Check,
} from "lucide-react";

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
  onChange: (value: string, parsed: ImportJson | null, errors: string[]) => void;
  subjectsList?: SubjectOption[];
  topicsList?: TopicOption[];
  selectedSubjectName?: string;
  selectedTopicName?: string;
  onSubjectChangeName?: (name: string) => void;
  onTopicChangeName?: (name: string) => void;
}


export function QuestionImportEditor({
  initialValue = "",
  onChange,
  subjectsList = [],
  topicsList = [],
  selectedSubjectName = "",
  selectedTopicName = "",
  onSubjectChangeName,
  onTopicChangeName,
}: QuestionImportEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [syntaxError, setSyntaxError] = useState<{ line: number | null; message: string } | null>(null);
  const [schemaErrors, setSchemaErrors] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<ImportJson | null>(null);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  // AI Prompt Generator Parameters
  const [promptSubject, setPromptSubject] = useState(selectedSubjectName || "Indian Polity & Foreign Policy");
  const [promptTopic, setPromptTopic] = useState(selectedTopicName || "Constitutional Development");
  const [promptDifficulty, setPromptDifficulty] = useState<string>("hard");
  const [promptLanguage, setPromptLanguage] = useState<string>("hindi");
  const [promptCount, setPromptCount] = useState<number>(10);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Sync prop → state
  useEffect(() => {
    if (selectedSubjectName) setPromptSubject(selectedSubjectName);
  }, [selectedSubjectName]);

  useEffect(() => {
    if (selectedTopicName) {
      setPromptTopic(selectedTopicName);
    } else if (topicsList.length > 0 && topicsList[0]) {
      setPromptTopic(topicsList[0].name);
    }
  }, [selectedTopicName, topicsList]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Derived: line numbers
  const lines = code.split("\n").length;
  const lineCount = Math.max(lines, 20);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync line-number scroll with textarea scroll
  const syncScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Validate JSON on every code change
  useEffect(() => {
    if (!code.trim()) {
      setSyntaxError(null);
      setSchemaErrors([]);
      setParsedData(null);
      onChangeRef.current(code, null, []);
      return;
    }

    try {
      const obj = JSON.parse(code);
      setSyntaxError(null);

      const result = importJsonSchema.safeParse(obj);
      if (!result.success) {
        const errs = result.error.issues.map(
          (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
        );
        setSchemaErrors(errs);
        setParsedData(null);
        onChangeRef.current(code, null, errs);
      } else {
        setSchemaErrors([]);
        setParsedData(result.data);
        onChangeRef.current(code, result.data, []);
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
      setParsedData(null);
      onChangeRef.current(code, null, [errMsg]);
    }
  }, [code]);

  // Prompt
  const currentPrompt = generateAiQuestionPrompt({
    subject: promptSubject,
    topic: promptTopic,
    difficulty: promptDifficulty,
    language: promptLanguage,
    count: promptCount,
  });

  function handleCopyAiPrompt() {
    navigator.clipboard.writeText(currentPrompt);
    showToast("📋 Prompt copied! Paste directly into ChatGPT, Gemini, or Claude.", "success");
  }

  function handleFormat() {
    try {
      const obj = JSON.parse(code);
      setCode(JSON.stringify(obj, null, 2));
    } catch {
      const { fixedText } = autoFixJson(code);
      try {
        setCode(JSON.stringify(JSON.parse(fixedText), null, 2));
      } catch {
        setCode(fixedText);
      }
    }
  }

  function handleAutoFix() {
    const { fixedText } = autoFixJson(code);
    setCode(fixedText);
  }

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── AI Prompt Generator ── */}
      <Card className="rounded-xl shadow-sm">
        {/* Card header */}
        <CardHeader className="px-5 py-4 border-b flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-bold text-foreground">AI Question Generator Prompt</span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Generate JSON prompts for ChatGPT, Gemini, Claude, Grok &amp; DeepSeek
          </span>
        </CardHeader>

        <CardContent className="px-5 py-4 space-y-4">
          {/* Input grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Subject</Label>
              {subjectsList.length > 0 ? (
                <Select
                  value={promptSubject}
                  onValueChange={(v) => {
                    if (!v) return;
                    setPromptSubject(v);
                    onSubjectChangeName?.(v);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectsList.map((s) => (
                      <SelectItem key={s._id} value={s.name}>
                        {s.name}{s.nameHindi ? ` (${s.nameHindi})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={promptSubject}
                  onChange={(e) => setPromptSubject(e.target.value)}
                  placeholder="e.g. Indian Polity & Foreign Policy"
                  className="h-9 text-xs"
                />
              )}
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Topic</Label>
              {topicsList.length > 0 ? (
                <Select
                  value={promptTopic}
                  onValueChange={(v) => {
                    if (!v) return;
                    setPromptTopic(v);
                    onTopicChangeName?.(v);
                  }}
                >
                  <SelectTrigger className="w-full h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topicsList.map((t) => (
                      <SelectItem key={t._id} value={t.name}>
                        {t.name}{t.nameHindi ? ` (${t.nameHindi})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  placeholder="e.g. Constitutional Development"
                  className="h-9 text-xs"
                />
              )}
            </div>

            {/* Question Count */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Questions Count</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={promptCount}
                onChange={(e) => setPromptCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreviewModal(true)}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Eye className="h-4 w-4" />
              Preview Prompt
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopyAiPrompt}
              className="h-9 gap-1.5 text-xs font-semibold px-4 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Copy className="h-4 w-4" />
              Copy AI Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Code Editor ── */}
      <div className="flex flex-col rounded-xl border border-border overflow-hidden shadow-sm">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/80 px-4 py-2.5 border-b border-border">
          {/* Status badge */}
          <div className="text-sm font-semibold min-w-0">
            {syntaxError || schemaErrors.length > 0 ? (
              <Badge variant="destructive" className="gap-1.5 text-[10px] px-2.5 py-1 rounded-md">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {syntaxError ? "JSON Syntax Error" : `${schemaErrors.length} Schema Issue(s)`}
              </Badge>
            ) : parsedData ? (
              <Badge className="gap-1.5 text-[10px] px-2.5 py-1 rounded-md bg-success/15 text-success border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Valid · {parsedData.questions.length} Questions Ready
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs truncate">
                Paste JSON from ChatGPT, Gemini, Grok, Claude, or DeepSeek
              </span>
            )}
          </div>

          {/* Toolbar actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormat}
              className="h-8 gap-1.5 text-xs font-semibold"
              title="Beautify and auto-indent JSON"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Format
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!code.trim()}
              className="h-8 gap-1 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/*
          ─────────────────────────────────────────────────────────────
          FIXED-HEIGHT CODE WORKSPACE
          h-[420px] caps the editor height on both mobile and desktop.
          overflow-hidden on the row prevents ANY content from leaking
          out and stretching the page. Only the textarea itself scrolls.
          ─────────────────────────────────────────────────────────────
        */}
        <div className="relative flex h-[420px] bg-card font-mono text-xs overflow-hidden">

          {/* Line numbers — scrolls in sync with textarea via JS */}
          <div
            ref={lineNumbersRef}
            aria-hidden
            className="select-none overflow-hidden py-3.5 px-3 bg-muted/40 text-muted-foreground text-right border-r border-border min-w-[46px] font-mono text-xs leading-[1.6rem]"
          >
            {lineNumbers.map((n) => (
              <div
                key={n}
                className={
                  syntaxError?.line === n
                    ? "text-destructive font-bold bg-destructive/20 px-1 rounded ring-1 ring-destructive/40"
                    : ""
                }
              >
                {n}
              </div>
            ))}
          </div>

          {/* Textarea — the ONLY scrollable element in the editor */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onScroll={syncScroll}
            placeholder={`Paste JSON from ChatGPT / Gemini / Claude / DeepSeek here...\n\n{\n  "subject": "Rajasthan Geography & Economy",\n  "topic": "Physical Features",\n  "testSet": "Set 1",\n  "negativeMarking": true,\n  "questions": [\n    {\n      "type": "mcq",\n      "questionText": "What is the capital of Rajasthan?",\n      "options": [\n        { "id": "opt1", "text": "Jodhpur" },\n        { "id": "opt2", "text": "Jaipur" },\n        { "id": "opt3", "text": "Udaipur" },\n        { "id": "opt4", "text": "Kota" }\n      ],\n      "correctAnswer": "opt2",\n      "explanation": "Jaipur is the capital city of Rajasthan.",\n      "difficulty": "easy"\n    }\n  ]\n}`}
            spellCheck={false}
            /* resize:none is critical — prevents the textarea from growing the page */
            className="flex-1 p-3.5 bg-transparent font-mono text-xs focus:outline-none resize-none leading-[1.6rem] text-foreground placeholder:text-muted-foreground/50 overflow-y-auto overflow-x-auto"
          />
        </div>
      </div>

      {/* ── Error panels ── */}
      {syntaxError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Syntax Error{syntaxError.line ? ` on Line ${syntaxError.line}` : ""}
          </AlertTitle>
          <AlertDescription className="font-mono text-xs">
            {syntaxError.message}
          </AlertDescription>
        </Alert>
      )}

      {schemaErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {schemaErrors.length} Schema Validation Issue{schemaErrors.length > 1 ? "s" : ""}
          </AlertTitle>
          <AlertDescription>
            <ScrollArea className="max-h-32">
              <ul className="list-disc pl-4 space-y-1 font-mono text-xs">
                {schemaErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Dialog */}
      <PromptPreviewDialog
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        promptText={currentPrompt}
        onCopySuccess={() => showToast("📋 Prompt copied to clipboard!", "success")}
      />
    </div>
  );
}
