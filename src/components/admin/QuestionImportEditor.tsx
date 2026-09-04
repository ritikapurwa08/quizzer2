"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { autoFixJson } from "@/lib/importParser";
import { importJsonSchema, ImportJson } from "@/lib/validators/question";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
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
  Loader2,
} from "lucide-react";
import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";

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
  const [parsedData, setParsedData] = useState<ImportJson | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Keep internal code synced when initialValue is cleared from outside
  useEffect(() => {
    setCode(initialValue);
  }, [initialValue]);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Derived: line numbers
  const lines = code.split("\n").length;
  const lineCount = Math.max(lines, 16);
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

  // Selected subject & topic objects for prompt generation
  const activeSubject = subjectsList.find((s) => s._id === selectedSubjectId);
  const activeTopic = topicsList.find((t) => t._id === selectedTopicId);

  const currentPrompt = generateAiQuestionPrompt({
    subject: getSubjectDisplayName(activeSubject) || "Rajasthan General Knowledge",
    topic: getTopicDisplayName(activeTopic) || "General Topic",
    subtopic: subtopicName.trim() || undefined,
    count: questionCount,
  });

  function handleCopyAiPrompt() {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    showToast("📋 AI Prompt copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2500);
  }

  function handleFormat() {
    if (!code.trim()) return;
    const { fixedText, success } = autoFixJson(code);
    if (success) {
      setCode(fixedText);
      showToast("✨ JSON formatted and validated cleanly!", "success");
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

  const isValid = parsedData !== null && !syntaxError && schemaErrors.length === 0;

  return (
    <div className="space-y-4">
      {/* ── 1. Target Syllabus & AI Prompt Form ── */}
      <Card className="rounded-2xl border border-border shadow-xs overflow-hidden bg-card">
        <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground font-hindi">
              लक्षित पाठ्यक्रम एवं AI प्रॉम्प्ट
            </span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground font-hindi">
            चरण 1: प्रॉम्प्ट तैयार एवं कॉपी करें
          </span>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                विषय
              </Label>
              <SyllabusSelect
                options={subjectsList}
                value={selectedSubjectId}
                onValueChange={(v) => onSubjectChangeId?.(v)}
                placeholder="विषय चुनें…"
              />
            </div>

            {/* Topic */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                टॉपिक
              </Label>
              <SyllabusSelect
                options={topicsList}
                value={selectedTopicId}
                onValueChange={(v) => onTopicChangeId?.(v)}
                placeholder={topicsList.length === 0 ? "पहले विषय चुनें" : "टॉपिक चुनें…"}
                disabled={topicsList.length === 0}
              />
            </div>

            {/* Subtopic / Test Set Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                उप-टॉपिक / भाग
              </Label>
              <Input
                value={subtopicName}
                onChange={(e) => onSubtopicNameChange(e.target.value)}
                placeholder="उदा. Part 1, प्रजामंडल..."
                className="h-10 text-xs font-semibold px-3 font-hindi"
              />
            </div>

            {/* Questions Count */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                प्रश्नों की संख्या
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={questionCount}
                onChange={(e) => onQuestionCountChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="h-10 text-xs font-semibold px-3 tabular-nums"
              />
            </div>
          </div>

          {/* Negative Marking & Prompt Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pt-3.5 border-t border-border/80">
            <div className="flex items-center gap-2.5">
              <Switch
                id="neg-marking"
                checked={negativeMarking}
                onCheckedChange={onNegativeMarkingChange}
              />
              <Label htmlFor="neg-marking" className="text-xs font-medium cursor-pointer text-muted-foreground font-hindi">
                ऋणात्मक अंकन (Negative Marking) <span className="text-[11px] font-normal text-muted-foreground/70">(-0.33 प्रति गलत)</span>
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto sm:flex sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreviewModal(true)}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-semibold rounded-xl active:scale-[0.98] transition-transform font-hindi"
              >
                <Eye className="h-3.5 w-3.5" />
                प्रॉम्प्ट देखें
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleCopyAiPrompt}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-bold px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-[0.98] transition-transform font-hindi"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "कॉपी हो गया!" : "प्रॉम्प्ट कॉपी करें"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 2. Direct JSON Paste Code Editor ── */}
      <div className="flex flex-col rounded-2xl border border-border overflow-hidden shadow-xs bg-card">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between gap-2.5 bg-muted/60 px-3.5 sm:px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" />
            {syntaxError || schemaErrors.length > 0 ? (
              <Badge variant="destructive" className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md font-semibold shrink-0">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {syntaxError ? "JSON Syntax Error" : `${schemaErrors.length} Issue(s)`}
              </Badge>
            ) : parsedData ? (
              <Badge className="gap-1 text-[11px] px-2.5 py-0.5 rounded-md bg-success/15 text-success border border-success/20 font-bold shrink-0 font-hindi">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                तैयार · {parsedData.questions.length} प्रश्न
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs truncate font-hindi">
                ChatGPT / Gemini / Claude से प्राप्त JSON यहाँ पेस्ट करें
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFormat}
              className="h-8 gap-1.5 text-xs font-semibold rounded-lg shrink-0 active:scale-95 transition-transform"
              title="Beautify & Auto-Fix JSON"
            >
              <AlignLeft className="h-3.5 w-3.5" />
              Format JSON
            </Button>
          </div>
        </div>

        {/* Textarea Code Workspace */}
        <div className="relative flex h-[380px] bg-card font-mono text-xs overflow-hidden">
          {/* Line Numbers */}
          <div
            ref={lineNumbersRef}
            aria-hidden="true"
            className="w-11 shrink-0 select-none bg-muted/30 border-r border-border/60 py-3.5 text-right font-mono text-[11px] text-muted-foreground/60 overflow-hidden leading-[1.625rem]"
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
            placeholder={`[\n  {\n    "q": "प्रश्न यहाँ लिखें...",\n    "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],\n    "a": 0,\n    "e": "विस्तृत व्याख्या...",\n    "t": "mcq"\n  }\n]`}
            spellCheck={false}
            className="flex-1 resize-none bg-transparent p-3.5 font-mono text-xs sm:text-[13px] leading-[1.625rem] text-foreground focus:outline-none placeholder:text-muted-foreground/40 overflow-y-auto"
          />
        </div>

        {/* ── 3. Bottom Action Bar: Target Info + Direct "Import" Button ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/40 px-4 sm:px-5 py-3 border-t border-border">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 font-hindi">
            <span className="font-bold text-foreground shrink-0">लक्ष्य:</span>
            <span className="truncate">
              {getSubjectDisplayName(activeSubject) || "विषय"} &rarr; {getTopicDisplayName(activeTopic) || "टॉपिक"} &rarr; <span className="font-bold text-foreground">{subtopicName || "Part 1"}</span>
            </span>
          </div>

          <Button
            type="button"
            onClick={onImportClick}
            disabled={!isValid || !selectedTopicId || !subtopicName.trim() || isImporting}
            className={cn(
              "w-full sm:w-auto h-10 px-6 font-bold text-sm rounded-xl gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs active:scale-95 transition-all shrink-0 font-hindi relative overflow-hidden",
              isImporting ? "cursor-wait opacity-90" : "cursor-pointer"
            )}
          >
            {isImporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary-foreground" />
                <span className="inline-flex items-center">
                  <span>प्रश्न आयात हो रहे हैं</span>
                  <span className="inline-flex tracking-widest animate-pulse ml-0.5">…</span>
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>प्रश्न आयात करें (Import)</span>
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Schema / Syntax Errors Display */}
      {syntaxError && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold font-hindi">JSON में सिंटैक्स त्रुटि (Syntax Error)</AlertTitle>
          <AlertDescription className="text-xs mt-0.5">
            {syntaxError.line ? `पंक्ति ${syntaxError.line}: ` : ""}
            {syntaxError.message}
          </AlertDescription>
        </Alert>
      )}

      {schemaErrors.length > 0 && (
        <Alert variant="destructive" className="rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-xs font-bold font-hindi">
            JSON में {schemaErrors.length} त्रुटि(याँ) मिलीं (Schema Validation)
          </AlertTitle>
          <AlertDescription className="text-xs mt-1">
            <ul className="list-disc pl-4 space-y-0.5 font-mono text-xs">
              {schemaErrors.slice(0, 5).map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
              {schemaErrors.length > 5 && (
                <li className="italic text-muted-foreground font-hindi">...और {schemaErrors.length - 5} अन्य त्रुटियाँ</li>
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
