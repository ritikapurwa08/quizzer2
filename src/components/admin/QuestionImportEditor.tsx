"use client";

import { useState, useEffect, useRef } from "react";
import { autoFixJson } from "@/lib/importParser";
import { importJsonSchema, ImportJson } from "@/lib/validators/question";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { PromptPreviewDialog } from "./PromptPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  CheckCircle2,
  Wand2,
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

  // AI Prompt Generator Parameters State
  const [promptSubject, setPromptSubject] = useState(selectedSubjectName || "Indian Polity & Foreign Policy");
  const [promptTopic, setPromptTopic] = useState(selectedTopicName || "Constitutional Development");
  const [promptDifficulty, setPromptDifficulty] = useState<string>("mixed");
  const [promptLanguage, setPromptLanguage] = useState<string>("English");
  const [promptCount, setPromptCount] = useState<number>(10);

  // Modal & Toast state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync prop changes for subject/topic names if parent passes them
  useEffect(() => {
    if (selectedSubjectName) {
      setPromptSubject(selectedSubjectName);
    }
  }, [selectedSubjectName]);

  useEffect(() => {
    if (selectedTopicName) {
      setPromptTopic(selectedTopicName);
    } else if (topicsList.length > 0 && topicsList[0]) {
      setPromptTopic(topicsList[0].name);
    }
  }, [selectedTopicName, topicsList]);

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Derived state for line numbers
  const lines = code.split("\n").length;
  const lineCount = Math.max(lines, 20);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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
      const match = err.message?.match(/at line (\d+) column (\d+)/i) || err.message?.match(/line (\d+)/i);
      if (match && match[1]) {
        line = parseInt(match[1], 10);
      }

      const errMsg = err.message || "Invalid JSON syntax.";
      setSyntaxError({ line, message: errMsg });
      setSchemaErrors([]);
      setParsedData(null);
      onChangeRef.current(code, null, [errMsg]);
    }
  }, [code]);

  // Trigger Toast Notification
  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }

  // Generate Current Prompt
  const currentPrompt = generateAiQuestionPrompt({
    subject: promptSubject,
    topic: promptTopic,
    difficulty: promptDifficulty,
    language: promptLanguage,
    count: promptCount,
  });

  // Handle Copy AI Prompt
  function handleCopyAiPrompt() {
    navigator.clipboard.writeText(currentPrompt);
    triggerToast("📋 Prompt copied to clipboard! Paste directly into ChatGPT, Gemini, or Claude.");
  }

  // Format JSON (Auto-indentation)
  function handleFormat() {
    try {
      const obj = JSON.parse(code);
      const formatted = JSON.stringify(obj, null, 2);
      setCode(formatted);
    } catch {
      const { fixedText } = autoFixJson(code);
      try {
        const obj = JSON.parse(fixedText);
        setCode(JSON.stringify(obj, null, 2));
      } catch {
        setCode(fixedText);
      }
    }
  }

  // Fix Common Errors
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
    <div className="space-y-4 flex flex-col h-full min-h-[65vh] relative">
      {/* Copy Success Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 text-sm font-medium border border-emerald-500">
          <Check className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AI Prompt Generator Card */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-foreground">AI Question Generator Prompt</h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Generate compatible JSON prompts for ChatGPT, Gemini, Claude, Grok & DeepSeek
          </span>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Subject</Label>
            {subjectsList.length > 0 ? (
              <select
                value={promptSubject}
                onChange={(e) => {
                  setPromptSubject(e.target.value);
                  if (onSubjectChangeName) onSubjectChangeName(e.target.value);
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {subjectsList.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name} {s.nameHindi ? `(${s.nameHindi})` : ""}
                  </option>
                ))}
              </select>
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
              <select
                value={promptTopic}
                onChange={(e) => {
                  setPromptTopic(e.target.value);
                  if (onTopicChangeName) onTopicChangeName(e.target.value);
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {topicsList.map((t) => (
                  <option key={t._id} value={t.name}>
                    {t.name} {t.nameHindi ? `(${t.nameHindi})` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder="e.g. Constitutional Development"
                className="h-9 text-xs"
              />
            )}
          </div>




          {/* Number of Questions */}
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

        {/* Action Buttons */}
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
            📋 Copy AI Prompt
          </Button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/80 px-4 py-3 rounded-t-xl border border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {syntaxError || schemaErrors.length > 0 ? (
            <span className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-2.5 py-1 rounded-md border border-destructive/20 text-xs">
              <AlertCircle className="h-4 w-4" />
              {syntaxError ? "JSON Syntax Error" : `${schemaErrors.length} Schema Issue(s)`}
            </span>
          ) : parsedData ? (
            <span className="flex items-center gap-1.5 text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Valid JSON ({parsedData.questions.length} Questions Ready)
            </span>
          ) : (
            <span className="text-muted-foreground text-xs">
              Paste JSON directly from ChatGPT, Gemini, Grok, Claude, or DeepSeek below
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFormat}
            className="h-8 gap-1.5 text-xs font-semibold"
            title="Beautify and auto-indent JSON"
          >
            <AlignLeft className="h-3.5 w-3.5" />
            Format JSON
          </Button>


          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!code.trim()}
            className="h-8 gap-1 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Main Code Workspace */}
      <div className="relative flex flex-1 min-h-[45vh] rounded-b-xl border border-t-0 border-border bg-card font-mono text-xs overflow-hidden shadow-inner">
        {/* Line Numbers Sidebar */}
        <div className="select-none py-3 px-3 bg-muted/40 text-muted-foreground text-right border-r border-border min-w-[50px] space-y-0.5 font-mono text-xs">
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

        {/* Textarea Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`Paste JSON from ChatGPT / Gemini / Claude / DeepSeek here...\n\n{\n  "subject": "Rajasthan Geography & Economy",\n  "topic": "Physical Features",\n  "testSet": "Set 1",\n  "negativeMarking": true,\n  "questions": [\n    {\n      "type": "mcq",\n      "questionText": "What is the capital of Rajasthan?",\n      "options": [\n        { "id": "opt1", "text": "Jodhpur" },\n        { "id": "opt2", "text": "Jaipur" },\n        { "id": "opt3", "text": "Udaipur" },\n        { "id": "opt4", "text": "Kota" }\n      ],\n      "correctAnswer": "opt2",\n      "explanation": "Jaipur is the capital city of Rajasthan.",\n      "difficulty": "easy"\n    }\n  ]\n}`}
          rows={20}
          spellCheck={false}
          className="flex-1 p-3.5 bg-transparent max-h-80 overflow-y-scroll font-mono text-xs focus:outline-none resize-y leading-relaxed text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Live Error Bar */}
      {syntaxError && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> Syntax Error {syntaxError.line ? `on Line ${syntaxError.line}` : ""}
          </p>
          <p className="font-mono text-xs">{syntaxError.message}</p>
        </div>
      )}

      {schemaErrors.length > 0 && (
        <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium space-y-1.5 max-h-40 overflow-y-auto">
          <p className="font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" /> {schemaErrors.length} Schema Validation Issue(s):
          </p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
            {schemaErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Dialog */}
      <PromptPreviewDialog
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        promptText={currentPrompt}
        onCopySuccess={() => triggerToast("📋 Prompt copied to clipboard!")}
      />
    </div>
  );
}

