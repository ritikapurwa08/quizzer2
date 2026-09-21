"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers,
  Sparkles,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

export interface ImportOptionsPayload {
  isFinalSet?: boolean;
  masterTopicId?: number;
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
  isImporting?: boolean;
  onImportClick?: (options?: ImportOptionsPayload) => void;
  initialMasterTopicId?: number;
  existingTestSets?: Array<{ _id: string; name: string }>;
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
  isImporting = false,
  onImportClick,
  initialMasterTopicId,
  existingTestSets = [],
}: Props) {
  const { showToast } = useToast();
  const [code, setCode] = useState(initialValue);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [isFinalSet, setIsFinalSet] = useState(false);

  // Candidate questions from local pool API
  const [candidateData, setCandidateData] = useState<{
    candidateCount: number;
    questions: any[];
    geminiPrompt: string;
  } | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const subjectName = getSubjectDisplayName(subject) || "";
  const topicName = getTopicDisplayName(topic) || "";

  // Derive masterTopicId from topic name or initial prop
  const masterTopicInfo = useMemo(() => {
    if (initialMasterTopicId) {
      return MASTER_TOPICS_LIST.find((mt) => mt.id === initialMasterTopicId) || null;
    }
    if (!topicName) return null;
    return (
      MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === topicName ||
          topicName.includes(mt.nameHindi) ||
          mt.nameHindi.includes(topicName)
      ) || null
    );
  }, [topicName, initialMasterTopicId]);

  const activeMasterTopicId = initialMasterTopicId || masterTopicInfo?.id;

  // Derive current set number from subtopicName
  const currentSetNumber = useMemo(() => {
    if (!subtopicName) return 1;
    const m = subtopicName.match(/(?:Part|भाग|Set|सेट)\s*(\d+)/i) || subtopicName.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  }, [subtopicName]);

  // Fetch local candidate set for "Copy for Gemini"
  const fetchCandidates = useCallback(async () => {
    if (!selectedTopicId || !activeMasterTopicId) {
      setCandidateData(null);
      setCandidateError(null);
      return;
    }

    setLoadingCandidates(true);
    setCandidateError(null);
    try {
      const res = await fetch(
        `/api/admin/candidate-set?masterTopicId=${activeMasterTopicId}&setNumber=${currentSetNumber}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.geminiPrompt) {
          setCandidateData(data);
          setCandidateError(null);
        } else {
          setCandidateData(null);
          setCandidateError(data.message || data.error || "Failed to load candidate questions.");
        }
      } else {
        const errData = await res.json().catch(() => null);
        setCandidateData(null);
        setCandidateError(errData?.message || errData?.error || `Failed to load candidate questions (HTTP ${res.status}).`);
      }
    } catch (err: any) {
      setCandidateData(null);
      setCandidateError(err?.message || "Failed to load candidate questions.");
    } finally {
      setLoadingCandidates(false);
    }
  }, [selectedTopicId, activeMasterTopicId, currentSetNumber]);

  useEffect(() => {
    if (!selectedTopicId || !activeMasterTopicId) {
      setCandidateData(null);
      setCandidateError(null);
      return;
    }
    fetchCandidates();
  }, [fetchCandidates, selectedTopicId, activeMasterTopicId]);

  // Handle "Copy for Gemini"
  const handleCopyForGemini = () => {
    if (!candidateData || !candidateData.geminiPrompt) {
      showToast("Candidate questions are loading, please wait...", "warning");
      return;
    }

    navigator.clipboard.writeText(candidateData.geminiPrompt);
    setCopiedPrompt(true);
    showToast(`✓ Gemini prompt with ${candidateData.candidateCount} candidate questions copied to clipboard!`, "success");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

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

  // Parse and validate pasted input
  const parseResult = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        questions: [] as QuestionInput[],
        parseError: "",
        isolationErrors: [] as string[],
        requeuedSourceIds: [] as Array<string | number>,
        rawParsedObj: null as any,
      };
    }

    try {
      const isolation = validateAndIsolateQuestions(trimmed);
      if (isolation.validQuestions.length > 0) {
        let rawParsedObj: any = null;
        try {
          rawParsedObj = JSON.parse(trimmed);
        } catch {
          // Plain text fallback or partial
        }
        return {
          questions: isolation.validQuestions,
          parseError: "",
          isolationErrors: isolation.invalidQuestions.map((iq) => iq.reason),
          requeuedSourceIds: isolation.requeuedSourceIds || [],
          rawParsedObj,
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
        rawParsedObj: null,
      };
    }

    return {
      questions: [] as QuestionInput[],
      parseError: plain.error || "Could not parse questions. Please paste valid JSON.",
      isolationErrors: [],
      requeuedSourceIds: [],
      rawParsedObj: null,
    };
  }, [code, subjectName, topicName, subtopicName]);

  // Quality gate checklist and structure validation
  const batchValidation: BatchValidationResult | null = useMemo(() => {
    if (!code.trim() || parseResult.questions.length === 0) return null;
    return validateImportBatch(parseResult.questions, {
      allowFinalBelow20: isFinalSet,
      isFinalSet,
    });
  }, [code, parseResult.questions, isFinalSet]);

  // Server-side duplicate provenance check (query Convex)
  const sourceIdsForDbCheck = useMemo(() => {
    return batchValidation?.sourceQuestionIds ?? [];
  }, [batchValidation]);

  const provenanceCheck = useQuery(
    api.questions.checkExistingProvenance,
    sourceIdsForDbCheck.length > 0 ? { sourceQuestionIds: sourceIdsForDbCheck } : "skip"
  );

  const existingInDbIds = provenanceCheck?.existingSourceIds ?? [];

  // Duplicate Set Name check in Convex under target topic
  const isDuplicateSetName = useMemo(() => {
    if (!subtopicName.trim() || !existingTestSets.length) return false;
    const cleanCurrent = subtopicName.trim().toLowerCase();
    return existingTestSets.some(
      (s) => s.name.trim().toLowerCase() === cleanCurrent
    );
  }, [subtopicName, existingTestSets]);

  // Combined error list
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
        errs.push(`This question is already imported in Quizzer (sourceQuestionId: ${id}).`);
      }
    }
    if (isDuplicateSetName) {
      errs.push(`A test set named '${subtopicName.trim()}' already exists under this topic. Please choose a different name.`);
    }
    return errs;
  }, [parseResult, batchValidation, existingInDbIds, isDuplicateSetName, subtopicName]);

  const detectedCount = parseResult.questions.length;
  const isExact20 = detectedCount === 20;
  const isCountValid = isExact20 || (isFinalSet && detectedCount > 0);
  const hasNoDbCollisions = existingInDbIds.length === 0;

  const canImport =
    isCountValid &&
    batchValidation?.isValid === true &&
    allErrors.length === 0 &&
    !isDuplicateSetName &&
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
        negativeMarking: true,
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
    onParsedChange,
    onChange,
  ]);

  return (
    <div className="space-y-6">
      {/* ── CARD 1: Target Configuration & Gemini Review ── */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight">
                Target Configuration &amp; Gemini Prompt
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeMasterTopicId && (
                <Badge variant="outline" className="text-[11px] font-medium">
                  Master Topic #{activeMasterTopicId}
                </Badge>
              )}
              {loadingCandidates ? (
                <Badge variant="outline" className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Candidates: Fetching...
                </Badge>
              ) : candidateData ? (
                <Badge className="bg-success/15 text-success border-success/30 text-[11px] font-semibold">
                  Candidates: {candidateData.candidateCount} loaded
                </Badge>
              ) : candidateError ? (
                <Badge variant="destructive" className="text-[11px] font-semibold">
                  Candidates: Failed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                  Candidates: Not loaded
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Subject
              </Label>
              <SyllabusSelect
                options={subjectsList}
                value={selectedSubjectId}
                onValueChange={onSubjectChangeId}
                placeholder="Select Subject..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Master Topic
              </Label>
              <SyllabusSelect
                options={topicsList}
                value={selectedTopicId}
                onValueChange={onTopicChangeId}
                disabled={!selectedSubjectId}
                placeholder="Select Master Topic..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Set / Part Name
              </Label>
              <input
                value={subtopicName}
                onChange={(e) => onSubtopicNameChange(e.target.value)}
                disabled={!selectedTopicId}
                placeholder={selectedTopicId ? "e.g. Rajasthan Rivers Part 1" : "Select a topic first"}
                className={cn(
                  "mt-0.5 h-10 w-full rounded-xl border bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  isDuplicateSetName
                    ? "border-destructive text-destructive focus:ring-destructive"
                    : "border-input"
                )}
              />
              {isDuplicateSetName && (
                <p className="text-[11px] font-medium text-destructive mt-1">
                  ⚠️ A test set named &apos;{subtopicName.trim()}&apos; already exists under this topic.
                </p>
              )}
            </div>
          </div>

          {/* Gemini AI Action Row */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <p className="text-xs text-muted-foreground">
                {loadingCandidates
                  ? "Fetching candidate questions from the pool, please wait..."
                  : candidateData
                  ? `Candidate questions ready (${candidateData.candidateCount} questions). Copy prompt for Gemini review.`
                  : candidateError
                  ? "Could not load candidate questions. Please verify your selection or retry."
                  : "Select a Subject and Master Topic above to load candidate questions from the pool."}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                {candidateData?.geminiPrompt && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPromptOpen(!promptOpen)}
                    disabled={loadingCandidates}
                    className="h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {promptOpen ? "Hide Prompt Preview" : "Show Prompt Preview"}
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyForGemini}
                  disabled={!candidateData?.geminiPrompt || loadingCandidates}
                  className="h-9 px-4 text-xs font-semibold rounded-xl gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCandidates ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Fetching...</span>
                    </>
                  ) : copiedPrompt ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span>Prompt Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Gemini Prompt</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {candidateError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in-0 duration-150">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{candidateError}</span>
              </div>
            )}

            {/* Collapsible preview: takes 0 space unless promptOpen */}
            {promptOpen && candidateData?.geminiPrompt && (
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 border border-border/50 p-3.5 font-mono text-[11px] leading-relaxed text-muted-foreground animate-in fade-in-0 duration-150">
                {candidateData.geminiPrompt}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 2: Question Import & Quality Gate ── */}
      <Card className="rounded-2xl border-border/70 shadow-xs">
        <CardHeader className="pb-3 pt-4 px-4 sm:px-6 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold tracking-tight">
                Question Import &amp; Quality Gate
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {code.trim().length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCode("")}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Clear Text
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="relative rounded-xl border border-input bg-card shadow-2xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-ring overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`[\n  {\n    "id": "rg_004945",\n    "question": "राजस्थान में सफेद सीमेंट का प्रथम कारखाना कहाँ स्थापित हुआ?",\n    "options": ["गोटन", "खारिया खंगार", "ब्यावर", "चित्तौड़गढ़"],\n    "answer": 0,\n    "explanation": "राजस्थान में सफेद सीमेंट का पहला कारखाना 1984 में गोटन (नागौर) में स्थापित हुआ।",\n    "exam": "REET",\n    "year": 2021\n  }\n]`}
              spellCheck={false}
              className="w-full min-h-[200px] max-h-[340px] resize-y bg-transparent p-4 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-hidden whitespace-pre overflow-x-auto"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-muted-foreground">Final Questions:</span>
              {detectedCount === 0 ? (
                <span className="text-muted-foreground font-semibold">0 / 20 questions</span>
              ) : isCountValid ? (
                <span className="text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isExact20 ? "20 / 20 questions ready" : `${detectedCount} / 20 questions ready (Final Set)`}
                </span>
              ) : (
                <span className="text-destructive font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {detectedCount} / 20 questions (20 required)
                </span>
              )}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs">
              <input
                type="checkbox"
                checked={isFinalSet}
                onChange={(e) => setIsFinalSet(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm border-border text-primary"
              />
              <span>Allow Final Set &lt; 20 (Final Set Exception)</span>
            </label>
          </div>

          {/* Quality Gate display */}
          {code.trim().length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border/40">
              {canImport ? (
                /* Compact Single-Line Quality Gate when all pass */
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-semibold animate-in fade-in-0 duration-150">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      All 8 Quality Gates Passed — {detectedCount} questions verified (structure, 4 unique options, answer, explanation, set &amp; DB uniqueness).
                    </span>
                  </div>
                  <Badge className="bg-success/20 text-success border-success/40 text-[10px] uppercase tracking-wider shrink-0 font-bold">
                    Passed
                  </Badge>
                </div>
              ) : (
                /* Full breakdown when checks fail or are incomplete */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {isCountValid ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>
                        {isFinalSet
                          ? `Final set accepted (${detectedCount} questions)`
                          : `Exactly 20 questions required (${detectedCount} / 20)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.validStructure ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Valid question and option structure (4 options)</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.uniqueOptions ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Unique options per question</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.validAnswers ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Valid correct answer verified</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.explanationsPresent ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Authentic explanations required</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.noDuplicateQuestions ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>No duplicate questions within set</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {batchValidation?.checklist.noDuplicateSourceIds ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Unique source IDs within set</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40">
                      {hasNoDbCollisions && !isDuplicateSetName ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span>Unique in database (no Convex duplicates)</span>
                    </div>
                  </div>

                  {allErrors.length > 0 && (
                    <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-bold">
                        Cannot Import — Please fix the following errors:
                      </AlertTitle>
                      <AlertDescription className="mt-1.5 text-xs">
                        <ul className="list-disc pl-4 space-y-0.5">
                          {allErrors.slice(0, 6).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {allErrors.length > 6 && (
                            <li>...and {allErrors.length - 6} more errors.</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}

          {/* Import Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
            {!canImport && code.trim().length > 0 ? (
              <p className="text-xs text-muted-foreground">
                Import will be enabled once all quality validation checks pass.
              </p>
            ) : (
              <div />
            )}
            <Button
              type="button"
              onClick={() => onImportClick?.({ isFinalSet, masterTopicId: activeMasterTopicId })}
              disabled={!canImport || isImporting}
              className="h-10 px-6 text-sm font-semibold rounded-xl min-w-[120px] shadow-xs sm:ml-auto w-full sm:w-auto cursor-pointer"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Questions"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
