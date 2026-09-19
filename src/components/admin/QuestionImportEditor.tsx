"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
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
  RotateCcw,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { generateAiQuestionPrompt } from "@/lib/prompts/aiQuestionPrompt";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

export interface ImportOptionsPayload {
  isFinalSet?: boolean;
  masterTopicId?: number;
  requeuedSourceIds?: Array<string | number>;
  sessionId?: string;
}

interface Props {
  initialValue?: string;
  resetKey?: number;
  onParsedChange?: (parsed: ImportJson | null) => void;
  onChange?: (value: string, parsed: ImportJson | null, errors: string[]) => void;
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
  onImportClick?: (options?: ImportOptionsPayload) => void;
  initialMasterTopicId?: number;
  initialExamPref?: "all" | "prefer_exam" | "limit_exam";
  initialExamLimit?: number;
}

export function QuestionImportEditor({
  initialValue = "",
  resetKey,
  onParsedChange,
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
  initialMasterTopicId,
  initialExamPref = "all",
  initialExamLimit = 15,
}: Props) {
  const [code, setCode] = useState(initialValue);
  const [copied, setCopied] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Persistent session id for concurrency claiming
  const [sessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem("quizzer_pool_session_id");
      if (!sid) {
        sid = "admin_session_" + Math.random().toString(36).slice(2, 10);
        sessionStorage.setItem("quizzer_pool_session_id", sid);
      }
      return sid;
    }
    return "admin_session_default";
  });

  // Candidate Exam Controls
  const [examPreference, setExamPreference] = useState<"all" | "prefer_exam" | "limit_exam">(initialExamPref);
  const [examLimit, setExamLimit] = useState<number>(initialExamLimit);

  // Final Set < 20 Control
  const [isFinalSet, setIsFinalSet] = useState(false);

  // Candidate Window from Persistent Topic Pool
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState("");
  const lastLoadedTopicRef = useRef<string>("");

  const getCandidatesMutation = useMutation(api.pool.getCandidates);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const subjectName = getSubjectDisplayName(subject) || "";
  const topicName = getTopicDisplayName(topic) || "";

  // Derive masterTopicId
  const masterTopicInfo = useMemo(() => {
    if (!topicName) return null;
    return MASTER_TOPICS_LIST.find(
      (mt) =>
        mt.nameHindi === topicName ||
        topicName.includes(mt.nameHindi) ||
        mt.nameHindi.includes(topicName)
    );
  }, [topicName]);

  const activeMasterTopicId = initialMasterTopicId || masterTopicInfo?.id;

  // Real-time topic summary from Convex
  const topicSummary = useQuery(
    api.pool.getTopicSummary,
    activeMasterTopicId ? { masterTopicId: activeMasterTopicId } : "skip"
  );

  const isExhaustedTopic = Boolean(topicSummary && topicSummary.available < 20);

  // Reset editor text on resetKey change
  const lastResetKeyRef = useRef(resetKey ?? 0);
  useEffect(() => {
    if (resetKey !== undefined && resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      setCode("");
      setIsFinalSet(false);
    }
  }, [resetKey]);

  useEffect(() => {
    if (initialValue !== undefined && initialValue === "" && code !== "") {
      setCode("");
    }
  }, [initialValue]);

  // Load Candidate Questions from Queue Engine
  const loadCandidates = useCallback(async () => {
    if (!activeMasterTopicId) {
      setCandidates([]);
      setCandidatesError("");
      return;
    }

    setCandidatesLoading(true);
    setCandidatesError("");

    try {
      const res = await getCandidatesMutation({
        masterTopicId: activeMasterTopicId,
        sessionId,
        examPreference,
        examLimit: examPreference === "limit_exam" ? examLimit : undefined,
        windowSize: 30,
      });

      if (res.success) {
        setCandidates(res.candidates);
        if (res.candidates.length === 0) {
          setCandidatesError("इस टॉपिक पूल में कोई प्रश्न शेष नहीं हैं (Topic Exhausted)।");
        }
      } else {
        setCandidates([]);
        setCandidatesError(res.message || "कैंडिडेट प्रश्न लोड करने में त्रुटि।");
      }
    } catch (err: any) {
      setCandidates([]);
      setCandidatesError(err.message || "कैंडिडेट प्रश्न लोड करने में त्रुटि।");
    } finally {
      setCandidatesLoading(false);
    }
  }, [activeMasterTopicId, sessionId, examPreference, examLimit, getCandidatesMutation]);

  // Automatically fetch candidates when activeMasterTopicId changes
  useEffect(() => {
    if (!activeMasterTopicId) {
      setCandidates([]);
      setCandidatesError("");
      lastLoadedTopicRef.current = "";
      return;
    }

    const key = `${activeMasterTopicId}::${subtopicName}::${examPreference}::${examLimit}`;
    if (lastLoadedTopicRef.current === key) return;
    lastLoadedTopicRef.current = key;

    loadCandidates();
  }, [activeMasterTopicId, subtopicName, examPreference, examLimit, loadCandidates]);

  // Format candidates into clean JSON for Gemini quality-control prompt
  const candidatesJsonText = useMemo(() => {
    if (candidates.length === 0) return "";
    return JSON.stringify(
      candidates.map((c) => ({
        q: c.questionText,
        o: c.options,
        a: c.correctAnswer,
        e: c.explanation || "",
        t: c.type || "mcq",
        sourceQuestionId: c.sourceQuestionId,
        sourceType: "PYQ",
        exam: c.exam || null,
        year: c.year || null,
        reference: c.reference || null,
      })),
      null,
      2
    );
  }, [candidates]);

  // Generate quality-control prompt embedding candidate window
  const prompt = useMemo(
    () =>
      generateAiQuestionPrompt({
        subject: subjectName || "Rajasthan General Knowledge",
        topic: topicName || "General Topic",
        subtopic: subtopicName || "Set 1",
        count: isFinalSet && isExhaustedTopic && topicSummary ? topicSummary.available : 20,
        questionsText: candidatesJsonText,
        candidateCount: candidates.length,
      }),
    [
      subjectName,
      topicName,
      subtopicName,
      isFinalSet,
      isExhaustedTopic,
      topicSummary,
      candidatesJsonText,
      candidates.length,
    ]
  );

  // Parse and validate pasted input
  const parseResult = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        questions: [] as QuestionInput[],
        parseError: "",
        isolationErrors: [] as string[],
        requeuedSourceIds: [] as Array<string | number>,
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
          requeuedSourceIds: isolation.requeuedSourceIds || [],
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
        requeuedSourceIds: [],
      };
    }

    return {
      questions: [] as QuestionInput[],
      parseError: plain.error || "प्रश्न पार्स नहीं हो सके। कृपया मान्य JSON पेस्ट करें।",
      isolationErrors: [],
      requeuedSourceIds: [],
    };
  }, [code, subjectName, topicName, subtopicName]);

  // Stage B: In-batch quality and provenance validation
  const batchValidation: BatchValidationResult | null = useMemo(() => {
    if (!code.trim() || parseResult.questions.length === 0) return null;
    return validateImportBatch(parseResult.questions, {
      allowFinalBelow20: Boolean(isFinalSet && isExhaustedTopic),
      isFinalSet,
    });
  }, [code, parseResult.questions, isFinalSet, isExhaustedTopic]);

  // Server-side duplicate provenance check (query Convex)
  const sourceIdsForDbCheck = useMemo(() => {
    return batchValidation?.sourceQuestionIds ?? [];
  }, [batchValidation]);

  const provenanceCheck = useQuery(
    api.questions.checkExistingProvenance,
    sourceIdsForDbCheck.length > 0 ? { sourceQuestionIds: sourceIdsForDbCheck } : "skip"
  );

  const existingInDbIds = provenanceCheck?.existingSourceIds ?? [];

  // Compute which candidates were repetitive or excluded to move to end of queue
  const redundantSourceIds = useMemo(() => {
    if (candidates.length === 0 || parseResult.questions.length === 0) return [];

    const retainedSet = new Set(
      parseResult.questions.map((q) => {
        const sid = q.meta?.sourceQuestionId ?? (q as any).sourceQuestionId ?? (q as any).id;
        return String(sid).trim();
      })
    );

    const fromWindow = candidates
      .map((c) => String(c.sourceQuestionId).trim())
      .filter((id) => !retainedSet.has(id));

    const explicitRequeued = (parseResult.requeuedSourceIds || []).map(String);
    return Array.from(new Set([...fromWindow, ...explicitRequeued]));
  }, [candidates, parseResult.questions, parseResult.requeuedSourceIds]);

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
        errs.push(`यह प्रश्न पहले से Quizzer में imported है (sourceQuestionId: ${id})।`);
      }
    }
    return errs;
  }, [parseResult, batchValidation, existingInDbIds]);

  const isExact20 = parseResult.questions.length === 20;
  const isCountValid =
    isExact20 || (Boolean(isFinalSet && isExhaustedTopic) && parseResult.questions.length > 0);
  const hasNoDbCollisions = existingInDbIds.length === 0;

  const canImport =
    isCountValid &&
    batchValidation?.isValid === true &&
    allErrors.length === 0 &&
    Boolean(selectedTopicId) &&
    Boolean(subtopicName.trim()) &&
    !isImporting;

  // Propagate parsed payload to parent
  const lastEmittedRef = useRef<string>("");
  useEffect(() => {
    let currentPayload: ImportJson | null = null;
    let signature = "empty";

    if (code.trim() && canImport && isCountValid) {
      currentPayload = {
        subject: subjectName,
        topic: topicName,
        testSet: subtopicName.trim(),
        negativeMarking,
        questions: parseResult.questions,
      };
      signature = `valid::${selectedTopicId}::${subtopicName.trim()}::${parseResult.questions.length}`;
    } else if (code.trim()) {
      signature = `invalid::${allErrors.length}::${allErrors[0] ?? ""}`;
    }

    if (lastEmittedRef.current !== signature) {
      lastEmittedRef.current = signature;
      onParsedChange?.(currentPayload);
      onChange?.(code, currentPayload, allErrors);
    }
  }, [
    code,
    canImport,
    isCountValid,
    parseResult.questions,
    allErrors,
    subjectName,
    topicName,
    selectedTopicId,
    subtopicName,
    negativeMarking,
    onParsedChange,
    onChange,
  ]);

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
              placeholder="e.g. राजस्थान के प्रमुख उद्योग भाग 1"
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

      {/* 2. Candidate Queue & Exam Controls */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight">
                2. Topic Question Pool &amp; Candidate Buffer
              </CardTitle>
            </div>
            {topicSummary && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="font-hindi text-[11px]">
                  Topic #{topicSummary.masterTopicId}
                </Badge>
                <Badge className="bg-success/15 text-success border-success/30 font-semibold text-[11px]">
                  Available: {topicSummary.available}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground text-[11px]">
                  Used: {topicSummary.used}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Exam Question Filter (परीक्षा प्रश्न नियंत्रण)
              </label>
              <select
                value={examPreference}
                onChange={(e) => setExamPreference(e.target.value as any)}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="all">Automatic (Queue Order)</option>
                <option value="prefer_exam">Prefer Exam Questions</option>
                <option value="limit_exam">Limit Exam Questions</option>
              </select>
            </div>

            {examPreference === "limit_exam" && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Max Exam Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={examLimit}
                  onChange={(e) => setExamLimit(parseInt(e.target.value, 10) || 15)}
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadCandidates}
                disabled={candidatesLoading || !activeMasterTopicId}
                className="h-10 text-xs font-semibold rounded-xl gap-1.5 shadow-2xs w-full"
              >
                {candidatesLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                <span>Reload Candidates (पूल से पुनः लोड करें)</span>
              </Button>
            </div>
          </div>

          {/* Candidate Status Banner */}
          <div className="flex flex-wrap items-center gap-2">
            {candidatesLoading ? (
              <Badge
                variant="outline"
                className="text-xs font-medium py-1 px-2.5 gap-1.5 text-muted-foreground animate-pulse"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                पूल से 25–30 कैंडिडेट प्रश्न लोड हो रहे हैं…
              </Badge>
            ) : candidates.length > 0 ? (
              <Badge className="bg-success/15 text-success border-success/30 text-xs font-semibold py-1 px-2.5 gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  Candidate Buffer Ready: <strong>{candidates.length} प्रश्न</strong> पूल कतार से स्वतः Prompt में शामिल हैं
                </span>
              </Badge>
            ) : null}
          </div>

          {candidatesError && (
            <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 py-2.5 px-3.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs font-medium">
                {candidatesError}
              </AlertDescription>
            </Alert>
          )}

          {/* Final Set (<20) Explicit Confirmation Control */}
          {isExhaustedTopic && (
            <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/30 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                <p className="text-xs font-bold text-foreground">
                  Final Topic Set Exception (अंतिम सेट छूट)
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                इस टॉपिक में केवल <strong>{topicSummary?.available} प्रश्न</strong> शेष हैं। सामान्य 20 प्रश्नों का सेट पूरा नहीं हो सकता। यदि आप इस अंतिम सेट को 20 से कम प्रश्नों के साथ आयात करना चाहते हैं, तो नीचे पुष्टि करें:
              </p>
              <label className="flex items-center gap-2.5 text-xs font-bold text-warning-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFinalSet}
                  onChange={(e) => setIsFinalSet(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border text-primary focus:ring-primary"
                />
                <span>Allow Final Set with fewer than 20 questions ({topicSummary?.available} questions)</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Gemini Prompt */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-bold tracking-tight">
                3. Quality-Control Prompt (Gemini AI)
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
          <p className="text-xs text-muted-foreground">
            Copy Prompt पर क्लिक करने पर इस टॉपिक के सभी <strong>{candidates.length} कैंडिडेट प्रश्न</strong> Prompt में स्वतः शामिल हो जाते हैं। Gemini व्याकरण/OCR सुधारेगा, पुनरावृत्ति हटाएगा, और ठीक 20 प्रश्नों का सेट तैयार करेगा।
          </p>

          {promptOpen && (
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 border border-border/50 p-3.5 font-mono text-[11px] leading-relaxed text-muted-foreground animate-in fade-in-0 duration-150">
              {prompt}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* 4. Gemini Response (Textarea) */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold tracking-tight">
                  4. Gemini JSON Response
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste the clean JSON response from Gemini. Quizzer will validate it before import.
              </p>
            </div>
            <div className="shrink-0 flex items-center">
              {detectedCount === 0 ? (
                <Badge variant="outline" className="text-xs font-medium text-muted-foreground py-1 px-2.5">
                  0 / 20 प्रश्न
                </Badge>
              ) : isCountValid ? (
                <Badge className="bg-success/15 text-success border-success/30 text-xs font-semibold py-1 px-2.5 gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {detectedCount} / {isExact20 ? 20 : detectedCount} प्रश्न तैयार हैं ✓
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
              placeholder={`[\n  {\n    "q": "प्रश्न पाठ...",\n    "o": ["विकल्प 1", "विकल्प 2", "विकल्प 3", "विकल्प 4"],\n    "a": 0,\n    "e": "प्रमाणिक व्याख्या...",\n    "t": "mcq",\n    "sourceType": "PYQ",\n    "sourceQuestionId": "rg_000001",\n    "exam": "REET",\n    "year": 2022,\n    "reference": "📌 PYQ — REET (2022)"\n  }\n]`}
              spellCheck={false}
              className="w-full min-h-[360px] max-h-[580px] resize-y bg-transparent p-4 font-mono text-xs sm:text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden whitespace-pre overflow-x-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Requeued Questions Banner (FIFO Requeueing) */}
      {redundantSourceIds.length > 0 && (
        <Card className="rounded-2xl border-border/70 shadow-xs bg-warning/5 border-warning/20">
          <CardContent className="p-4 flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">
                Queue Requeueing ({redundantSourceIds.length} Repetitive Questions Return to Queue End)
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                इस सेट में शामिल न किए गए {redundantSourceIds.length} प्रश्न स्थायी रूप से नष्ट नहीं होंगे। Import करने पर इन्हें इस टॉपिक की कतार के <strong>अंत (End of Queue)</strong> में पुनः जोड़ दिया जाएगा ताकि भविष्य के सेट्स में इनका उपयोग किया जा सके।
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Import Quality Gate & Checklist */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold tracking-tight">
              5. Import Quality Gate / गुणवत्ता परीक्षण
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
              {isCountValid ? (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span>
                {isFinalSet && isExhaustedTopic
                  ? `अंतिम सेट स्वीकार्य (मिले: ${detectedCount} प्रश्न)`
                  : `20 प्रश्न आवश्यक (मिले: ${detectedCount} / 20)`}
              </span>
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
              <span>Convex में कोई पुराना दोहराव नहीं</span>
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
              <span>
                सभी {detectedCount} प्रश्न गुणवत्ता मानकों के अनुरूप हैं। अब आप इन्हें सुरक्षित रूप से आयात कर सकते हैं।
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Final Import Button */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() =>
            onImportClick?.({
              isFinalSet,
              masterTopicId: activeMasterTopicId,
              requeuedSourceIds: redundantSourceIds,
              sessionId,
            })
          }
          disabled={!canImport}
          className="h-12 w-full rounded-xl text-sm font-bold shadow-xs transition-all"
        >
          {isImporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing Questions &amp; Updating Pool Queue…
            </>
          ) : (
            `✓ Import ${detectedCount} Questions (${subtopicName || "Current Set"})`
          )}
        </Button>
        {!canImport && code.trim().length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            {isFinalSet && isExhaustedTopic
              ? "अंतिम सेट के प्रश्नों की पुष्टि होने पर Import बटन सक्षम होगा।"
              : "सभी validation checks (ठीक 20 प्रश्न, वैध विकल्प, अद्वितीय Source ID) पास होने पर ही Import बटन सक्षम होगा।"}
          </p>
        )}
      </div>
    </div>
  );
}
