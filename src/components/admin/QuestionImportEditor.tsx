"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  ImportJson,
  QuestionInput,
  validateImportBatch,
  BatchValidationResult,
} from "@/lib/validators/question";
import {
  validateAndIsolateQuestions,
  parsePlainTextQuestions,
} from "@/lib/importParser";

import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Check,
  Copy,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  Sparkles,
  FileCode,
  ShieldCheck,
  Database,
} from "lucide-react";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface Props {
  initialValue?: string;
  onChange: (value: string, parsed: ImportJson | null, errors: string[]) => void;
  subjectsList: Option[];
  topicsList: Option[];
  selectedSubjectId: string;
  selectedTopicId: string;
  onSubjectChangeId: (id: string) => void;
  onTopicChangeId: (id: string) => void;
  subtopicName: string;
  onSubtopicNameChange: (value: string) => void;
  negativeMarking: boolean;
  onNegativeMarkingChange: (value: boolean) => void;
  isImporting?: boolean;
  onImportClick?: () => void;
}

export function QuestionImportEditor({
  initialValue = "",
  onChange,
  subjectsList,
  topicsList,
  selectedSubjectId,
  selectedTopicId,
  onSubjectChangeId,
  onTopicChangeId,
  subtopicName,
  onSubtopicNameChange,
  negativeMarking,
  onNegativeMarkingChange,
  isImporting = false,
  onImportClick,
}: Props) {
  const [code, setCode] = useState(initialValue);
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Final PYQ batch state loaded from repository
  const [pyqBatch, setPyqBatch] = useState<{
    batchName: string;
    questionCount: number;
    questionsText: string;
  } | null>(null);
  const [pyqBatchError, setPyqBatchError] = useState<string>("");
  const [pyqBatchLoading, setPyqBatchLoading] = useState(false);

  useEffect(() => {
    setCode(initialValue);
  }, [initialValue]);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const subjectName = getSubjectDisplayName(subject) || "";
  const topicName = getTopicDisplayName(topic) || "";

  // Automatically fetch corresponding batch from Final PYQ folder
  useEffect(() => {
    if (!topicName || !selectedTopicId) {
      setPyqBatch(null);
      setPyqBatchError("");
      return;
    }

    let isMounted = true;
    setPyqBatchLoading(true);
    setPyqBatchError("");

    fetch(
      `/api/admin/pyq-batch?topic=${encodeURIComponent(topicName)}&set=${encodeURIComponent(subtopicName)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setPyqBatch({
            batchName: data.batchName,
            questionCount: data.questionCount,
            questionsText: data.questionsText,
          });
          setPyqBatchError("");
        } else {
          setPyqBatch(null);
          setPyqBatchError(
            data.error || "इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।"
          );
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setPyqBatch(null);
        setPyqBatchError("इस Topic/Set का Final PYQ batch नहीं मिला। पहले सही batch उपलब्ध कराएँ।");
      })
      .finally(() => {
        if (isMounted) setPyqBatchLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topicName, selectedTopicId, subtopicName]);

  // Generate prompt embedding the 20 PYQ questions from Final PYQ folder
  const prompt = useMemo(
    () =>
      generateAiQuestionPrompt({
        subject: subjectName || "Rajasthan General Knowledge",
        topic: topicName || "General Topic",
        subtopic: subtopicName || "Set 1",
        questionsText: pyqBatch?.questionsText || "",
      }),
    [subjectName, topicName, subtopicName, pyqBatch]
  );

  // Parse and validate pasted input
  const parseResult = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        questions: [] as QuestionInput[],
        parseError: "",
        isolationErrors: [] as string[],
      };
    }

    // Attempt Stage A: Extract JSON and validate questions
    try {
      const isolation = validateAndIsolateQuestions(trimmed);
      if (isolation.validQuestions.length > 0) {
        return {
          questions: isolation.validQuestions,
          parseError: "",
          isolationErrors: isolation.invalidQuestions.map((iq) => iq.reason),
        };
      }
    } catch {
      // Fall through to plain text parser
    }

    // Fallback: Plain text question format
    const plain = parsePlainTextQuestions(
      trimmed,
      subjectName || "Rajasthan General Knowledge",
      topicName || "General Topic",
      subtopicName || "Set 1"
    );

    if (plain.data && plain.data.questions.length > 0) {
      return {
        questions: plain.data.questions,
        parseError: "",
        isolationErrors: [],
      };
    }

    return {
      questions: [] as QuestionInput[],
      parseError: plain.error || "प्रश्न पार्स नहीं हो सके। कृपया मान्य JSON पेस्ट करें।",
      isolationErrors: [],
    };
  }, [code, subjectName, topicName, subtopicName]);

  // Stage B: In-batch quality and provenance validation
  const batchValidation: BatchValidationResult | null = useMemo(() => {
    if (!code.trim() || parseResult.questions.length === 0) return null;
    return validateImportBatch(parseResult.questions);
  }, [code, parseResult.questions]);

  // Server-side duplicate provenance check (query Convex)
  const sourceIdsForDbCheck = useMemo(() => {
    return batchValidation?.sourceQuestionIds ?? [];
  }, [batchValidation]);

  const provenanceCheck = useQuery(
    api.questions.checkExistingProvenance,
    sourceIdsForDbCheck.length > 0 ? { sourceQuestionIds: sourceIdsForDbCheck } : "skip"
  );

  const existingInDbIds = provenanceCheck?.existingSourceIds ?? [];

  // Combined error list and canImport gate
  const allErrors = useMemo(() => {
    const errs: string[] = [];
    if (parseResult.parseError) {
      errs.push(parseResult.parseError);
    }
    if (parseResult.isolationErrors.length > 0) {
      errs.push(...parseResult.isolationErrors);
    }
    if (batchValidation) {
      errs.push(...batchValidation.errors);
    }
    if (existingInDbIds.length > 0) {
      for (const id of existingInDbIds) {
        errs.push(`यह PYQ पहले से Quizzer में imported है (sourceQuestionId: ${id})।`);
      }
    }
    return errs;
  }, [parseResult, batchValidation, existingInDbIds]);

  const isExact20 = parseResult.questions.length === 20;
  const hasNoDbCollisions = existingInDbIds.length === 0;
  const canImport =
    isExact20 &&
    batchValidation?.isValid === true &&
    allErrors.length === 0 &&
    Boolean(selectedTopicId) &&
    Boolean(subtopicName.trim()) &&
    !isImporting;

  // Propagate parsed payload to parent
  useEffect(() => {
    if (!code.trim()) {
      onChange(code, null, []);
      return;
    }
    if (canImport && parseResult.questions.length === 20) {
      const payload: ImportJson = {
        subject: subjectName,
        topic: topicName,
        testSet: subtopicName.trim(),
        negativeMarking,
        questions: parseResult.questions,
      };
      onChange(code, payload, []);
    } else {
      onChange(code, null, allErrors);
    }
  }, [code, canImport, parseResult.questions, allErrors, subjectName, topicName, subtopicName, negativeMarking, onChange]);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const detectedCount = parseResult.questions.length;

  return (
    <div className="space-y-5">
      {/* 1. Target Configuration */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold tracking-tight">
              1. Target Configuration / विषय एवं सेट चयन
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3.5 p-4 sm:p-6 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Subject (विषय)
            </Label>
            <SyllabusSelect
              options={subjectsList}
              value={selectedSubjectId}
              onValueChange={onSubjectChangeId}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Master Topic (शीर्षक)
            </Label>
            <SyllabusSelect
              options={topicsList}
              value={selectedTopicId}
              onValueChange={onTopicChangeId}
              disabled={!selectedSubjectId}
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Set / Part Name (भाग / सेट नाम)
            </Label>
            <input
              value={subtopicName}
              onChange={(e) => onSubtopicNameChange(e.target.value)}
              placeholder="e.g. आमेर का कछवाहा वंश भाग 1"
              className="mt-0.5 h-10 w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <div className="flex items-center sm:pt-6">
            <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => onNegativeMarkingChange(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
              />
              <span>Negative Marking (-0.33)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Gemini Prompt */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-bold tracking-tight">
                2. Quality-Control Prompt (Gemini AI)
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPromptOpen(!promptOpen)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                {promptOpen ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyPrompt}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {/* Final PYQ Source Status Banner */}
          <div className="flex flex-wrap items-center gap-2">
            {pyqBatchLoading ? (
              <Badge variant="outline" className="text-xs font-medium py-1 px-2.5 gap-1.5 text-muted-foreground animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Final PYQ batch लोड हो रहा है…
              </Badge>
            ) : pyqBatch ? (
              <Badge className="bg-success/15 text-success border-success/30 text-xs font-semibold py-1 px-2.5 gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>Final PYQ Loaded: <strong>{pyqBatch.batchName}</strong> ({pyqBatch.questionCount} प्रश्न स्वतः शामिल)</span>
              </Badge>
            ) : null}
          </div>

          {pyqBatchError && (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 py-2.5 px-3.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                {pyqBatchError}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-xs text-muted-foreground">
            {pyqBatch
              ? `Copy Prompt पर क्लिक करने पर इस सेट के सभी 20 मूल PYQ प्रश्न Prompt में स्वतः जुड़ चुके हैं। इसे सीधे Gemini में पेस्ट करें।`
              : `इस prompt को कॉपी करके Gemini में paste करें।`}
          </p>

          {promptOpen && (
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 border border-border/50 p-3.5 font-mono text-[11px] leading-relaxed text-muted-foreground animate-in fade-in-0 duration-150">
              {prompt}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* 3. Gemini Response (Textarea) */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold tracking-tight">
                  3. Gemini JSON Response
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste the complete JSON response from Gemini. Quizzer will validate it before import.
              </p>
            </div>
            <div className="shrink-0 flex items-center">
              {detectedCount === 0 ? (
                <Badge variant="outline" className="text-xs font-medium text-muted-foreground py-1 px-2.5">
                  0 / 20 प्रश्न
                </Badge>
              ) : detectedCount === 20 ? (
                <Badge className="bg-success/15 text-success border-success/30 text-xs font-semibold py-1 px-2.5 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 20 / 20 प्रश्न तैयार हैं ✓
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs font-semibold py-1 px-2.5 gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> 20 प्रश्न आवश्यक हैं। अभी {detectedCount} मिले हैं।
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="relative rounded-xl border border-input bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-ring overflow-hidden">
            <textarea
              ref={textRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`[\n  {\n    "q": "प्रश्न पाठ...",\n    "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],\n    "a": 0,\n    "e": "प्रमाणिक व्याख्या...",\n    "t": "mcq",\n    "sourceType": "PYQ",\n    "sourceQuestionId": 13540,\n    "exam": "RPSC Sub Inspector",\n    "year": 2021,\n    "reference": "RPSC Sub Inspector 13/09/2021"\n  }\n]`}
              spellCheck={false}
              className="w-full min-h-[360px] max-h-[580px] resize-y bg-transparent p-4 font-mono text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden whitespace-pre overflow-x-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Import Quality Gate & Checklist */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold tracking-tight">
              4. Import Quality Gate / गुणवत्ता परीक्षण
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {isExact20 ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>20 प्रश्न आवश्यक (मिले: {detectedCount} / 20)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.validStructure ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>वैध प्रश्न एवं विकल्प संरचना (4 options per MCQ)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.uniqueOptions ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>प्रत्येक प्रश्न के विकल्प अद्वितीय (Unique options)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.validAnswers ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>सही उत्तर का सूचकांक मान्य (Answer index 0–3)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.explanationsPresent ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>व्याख्या अनिवार्य (Explanations present)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.noDuplicateQuestions ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>सेट के अंदर कोई दोहराव नहीं (No duplicates in set)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {batchValidation?.checklist.noDuplicateSourceIds ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>Source IDs सत्यापित (Unique sourceQuestionId)</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {hasNoDbCollisions ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>Convex में कोई पुराना PYQ दोहराव नहीं</span>
            </div>
          </div>

          {/* Validation Failure Reasons */}
          {allErrors.length > 0 && code.trim().length > 0 && (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm font-bold">
                Import नहीं किया जा सकता — निम्नलिखित त्रुटियाँ सुधारें:
              </AlertTitle>
              <AlertDescription className="mt-2 text-xs space-y-1">
                <ul className="list-disc pl-4 space-y-1">
                  {allErrors.slice(0, 8).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {allErrors.length > 8 && (
                    <li>...तथा {allErrors.length - 8} अन्य त्रुटियाँ।</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {canImport && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>सभी 20 प्रश्न गुणवत्ता मानकों के अनुरूप हैं। अब आप इन्हें सुरक्षित रूप से आयात कर सकते हैं।</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Final Import Button */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={onImportClick}
          disabled={!canImport}
          className="h-12 w-full rounded-xl text-sm font-bold shadow-xs transition-all"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing 20 Questions into Convex…
            </>
          ) : (
            `✓ Import 20 Questions (${subtopicName || "Current Set"})`
          )}
        </Button>
        {!canImport && code.trim().length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            सभी validation checks (ठीक 20 प्रश्न, वैध विकल्प, अद्वितीय Source ID) पास होने पर ही Import बटन सक्षम होगा।
          </p>
        )}
      </div>
    </div>
  );
}
