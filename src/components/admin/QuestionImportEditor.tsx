"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/Toast";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Layers,
  FileCode,
} from "lucide-react";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import {
  calculateNextSetName,
  calculateBatchSetNames,
  extractBaseTopicName,
  getNextPartNumber,
} from "@/lib/setNumbering";
import {
  TargetConfigSection,
  GeminiPromptSection,
  QualityGateChecklist,
  ImportErrorAlert,
  QuestionPasteCard,
} from "./import";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

export interface ImportOptionsPayload {
  isFinalSet?: boolean;
  masterTopicId?: number;
  subTopicId?: string;
  subTopic?: string;
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
  selectedSubTopicId?: string;
  onSubTopicChange?: (id: string) => void;
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
  selectedSubTopicId = "",
  onSubTopicChange,
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
  const [copiedFreshPrompt, setCopiedFreshPrompt] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [isFinalSet, setIsFinalSet] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(20);

  // Candidate questions from local pool API
  const [candidateData, setCandidateData] = useState<{
    candidateCount: number;
    batchSize?: number;
    setCount?: number;
    targetCount?: number;
    remainingCount?: number;
    maxSetsAvailable?: number;
    isFinalTopicSet?: boolean;
    isComplete?: boolean;
    message?: string;
    questions: any[];
    geminiPrompt: string;
    freshGenerationPrompt?: string;
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
    if (!topic && !topicName) return null;

    const tName = topic?.name || topicName || "";
    const tHindi = topic?.nameHindi || topicName || "";
    const lowerName = tName.toLowerCase();

    return (
      MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === tHindi ||
          mt.nameHindi === tName ||
          mt.nameEnglish === tName ||
          mt.nameEnglish.toLowerCase() === lowerName ||
          (mt.nameHindi && tHindi && (tHindi.includes(mt.nameHindi) || mt.nameHindi.includes(tHindi))) ||
          (mt.nameEnglish && tName && (lowerName.includes(mt.nameEnglish.toLowerCase()) || mt.nameEnglish.toLowerCase().includes(lowerName)))
      ) || null
    );
  }, [topic, topicName, initialMasterTopicId]);

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
      const subParam = selectedSubTopicId ? `&subTopicId=${encodeURIComponent(selectedSubTopicId)}` : "";
      const res = await fetch(
        `/api/admin/candidate-set?masterTopicId=${activeMasterTopicId}&setNumber=${currentSetNumber}&batchSize=${batchSize}${subParam}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCandidateData(data);
          setCandidateError(null);
          if (data.isFinalTopicSet && data.remainingCount && data.remainingCount < batchSize) {
            setBatchSize(data.remainingCount);
          }
          if (data.setName) {
            if (
              selectedSubTopicId ||
              !subtopicName.trim() ||
              subtopicName.endsWith("भाग 1") ||
              subtopicName.endsWith("Part 1")
            ) {
              if (data.setName !== subtopicName) {
                onSubtopicNameChange(data.setName);
              }
            }
          }
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
  }, [selectedTopicId, activeMasterTopicId, selectedSubTopicId, currentSetNumber, batchSize, subtopicName, onSubtopicNameChange]);

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
    if (candidateData?.isComplete) {
      showToast("Topic is 100% complete! No unassigned questions remaining to import.", "info");
      return;
    }
    if (!candidateData || !candidateData.geminiPrompt) {
      showToast("Candidate questions are loading, please wait...", "warning");
      return;
    }

    navigator.clipboard.writeText(candidateData.geminiPrompt);
    setCopiedPrompt(true);
    showToast(`✓ Gemini prompt with ${candidateData.candidateCount} candidate questions copied to clipboard!`, "success");
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Handle "Copy Fresh 2027 Question Generation Prompt"
  const handleCopyFreshPrompt = () => {
    if (!candidateData || !candidateData.freshGenerationPrompt) {
      showToast("Fresh generation prompt is loading, please wait...", "warning");
      return;
    }

    navigator.clipboard.writeText(candidateData.freshGenerationPrompt);
    setCopiedFreshPrompt(true);
    showToast("✓ Fresh 2027 Question Generation Prompt copied to clipboard!", "success");
    setTimeout(() => setCopiedFreshPrompt(false), 2000);
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

  // Auto-fill subtopicName if topic is selected but set name is empty
  useEffect(() => {
    if (selectedTopicId && topicName && !subtopicName.trim()) {
      const { fullName } = calculateNextSetName(existingTestSets, topicName);
      onSubtopicNameChange(fullName);
    }
  }, [selectedTopicId, topicName, subtopicName, existingTestSets, onSubtopicNameChange]);

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

  const existingInDbIds: string[] = [];

  const detectedCount = parseResult.questions.length;
  const isMultipleOf20 = detectedCount > 0 && detectedCount % 20 === 0;
  const isExact20 = detectedCount === 20;
  const setCountToCreate = Math.max(1, Math.ceil(detectedCount / 20));
  const isCountValid = isMultipleOf20 || (isFinalSet && detectedCount > 0);
  const hasNoDbCollisions = existingInDbIds.length === 0;

  const plannedSetNames = useMemo(() => {
    if (!subtopicName.trim()) return [];
    const baseName = extractBaseTopicName(subtopicName) || subtopicName.trim();
    const match = subtopicName.match(/(?:Part|भाग|Set|सेट)[\s\-–—:]*(\d+)/i) || subtopicName.match(/(\d+)/);
    const startNum = match ? parseInt(match[1], 10) : getNextPartNumber(existingTestSets);
    const count = detectedCount > 0 ? Math.ceil(detectedCount / 20) : Math.ceil(batchSize / 20);
    return calculateBatchSetNames(baseName, startNum, Math.max(1, count));
  }, [subtopicName, detectedCount, batchSize, existingTestSets]);

  // Duplicate Set Name check in Convex under target topic
  const isDuplicateSetName = useMemo(() => {
    if (!subtopicName.trim() || !existingTestSets.length) return false;
    const existingLower = new Set(existingTestSets.map((s) => s.name.trim().toLowerCase()));
    if (plannedSetNames.length > 0) {
      return plannedSetNames.some((name) => existingLower.has(name.toLowerCase()));
    }
    return existingLower.has(subtopicName.trim().toLowerCase());
  }, [subtopicName, existingTestSets, plannedSetNames]);

  // Auto-detect Syllabus from pasted JSON metadata if not already selected
  useEffect(() => {
    if (!parseResult.rawParsedObj) return;
    const obj = parseResult.rawParsedObj;
    const firstQ = Array.isArray(obj) ? obj[0] : (obj.questions?.[0] || obj);
    if (!firstQ && typeof obj !== "object") return;

    const topicHint =
      obj?.masterTopic ||
      obj?.topic ||
      obj?.topicName ||
      firstQ?.topic ||
      firstQ?.meta?.sourceTopic;
    const masterTopicIdHint =
      obj?.masterTopicId ||
      firstQ?.masterTopicId ||
      firstQ?.meta?.masterTopicId;
    const setHint =
      obj?.testSet ||
      obj?.setName ||
      obj?.subtopic ||
      obj?.name;

    let matchedMt = null;
    if (masterTopicIdHint) {
      const num = Number(masterTopicIdHint);
      matchedMt = MASTER_TOPICS_LIST.find((mt) => mt.id === num);
    }
    if (!matchedMt && typeof topicHint === "string" && topicHint.trim()) {
      const cleanHint = topicHint.trim();
      matchedMt = MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === cleanHint ||
          cleanHint.includes(mt.nameHindi) ||
          mt.nameHindi.includes(cleanHint)
      );
    }

    if (matchedMt) {
      if (!selectedSubjectId && subjectsList.length > 0) {
        const sub = subjectsList.find(
          (s) =>
            s.nameHindi === matchedMt!.subjectHindi ||
            s.name === matchedMt!.subjectName
        );
        if (sub) {
          onSubjectChangeId(sub._id);
        }
      }
      if (selectedSubjectId && !selectedTopicId && topicsList.length > 0) {
        const top = topicsList.find(
          (t) =>
            t.nameHindi === matchedMt!.nameHindi ||
            (t.nameHindi && matchedMt!.nameHindi.includes(t.nameHindi))
        );
        if (top) {
          onTopicChangeId(top._id);
        }
      }
    }

    if (setHint && typeof setHint === "string" && !subtopicName.trim()) {
      onSubtopicNameChange(setHint.trim());
    }
  }, [
    parseResult.rawParsedObj,
    selectedSubjectId,
    selectedTopicId,
    subtopicName,
    subjectsList,
    topicsList,
    onSubjectChangeId,
    onTopicChangeId,
    onSubtopicNameChange,
  ]);

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
      errs.push(`A test set named '${subtopicName.trim()}' (or in this batch) already exists under this topic.`);
    }
    if (code.trim().length > 0) {
      if (!selectedSubjectId) {
        errs.push("Step 1 incomplete: Please select a Subject above.");
      }
      if (!selectedTopicId) {
        errs.push("Step 1 incomplete: Please select a Master Topic above.");
      }
      if (!subtopicName.trim()) {
        errs.push("Step 1 incomplete: Please enter a Set / Part Name above.");
      }
    }
    return errs;
  }, [parseResult, batchValidation, existingInDbIds, isDuplicateSetName, subtopicName, code, selectedSubjectId, selectedTopicId]);

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
              ) : candidateData?.isComplete ? (
                <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[11px] font-semibold">
                  Pool Status: 100% Imported
                </Badge>
              ) : candidateData ? (
                <Badge className="bg-success/15 text-success border-success/30 text-[11px] font-semibold">
                  Candidates: {candidateData.candidateCount} loaded ({batchSize} Target / {Math.ceil(batchSize / 20)} Sets)
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
          <TargetConfigSection
            subjectsList={subjectsList}
            topicsList={topicsList}
            selectedSubjectId={selectedSubjectId}
            selectedTopicId={selectedTopicId}
            onSubjectChangeId={onSubjectChangeId}
            onTopicChangeId={onTopicChangeId}
            availableSubTopics={masterTopicInfo?.subTopics || []}
            selectedSubTopicId={selectedSubTopicId}
            onSubTopicChange={onSubTopicChange}
            batchSize={batchSize}
            onBatchSizeChange={setBatchSize}
            subtopicName={subtopicName}
            onSubtopicNameChange={onSubtopicNameChange}
            isDuplicateSetName={isDuplicateSetName}
            plannedSetNames={plannedSetNames}
            remainingCount={candidateData?.remainingCount}
            isComplete={candidateData?.isComplete}
            isFinalTopicSet={candidateData?.isFinalTopicSet}
            maxSetsAvailable={candidateData?.maxSetsAvailable}
          />

          {code.trim().length > 0 && (!selectedTopicId || !subtopicName.trim()) && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                {!selectedSubjectId
                  ? "Questions detected below. Please select a Subject and Master Topic to assign them."
                  : !selectedTopicId
                    ? "Questions detected below. Please select a Master Topic above."
                    : "Please confirm or enter a Set / Part Name above to enable import."}
              </span>
            </div>
          )}

          {/* Gemini AI Action Row */}
          <GeminiPromptSection
            loadingCandidates={loadingCandidates}
            candidateData={candidateData}
            candidateError={candidateError}
            promptOpen={promptOpen}
            onTogglePrompt={() => setPromptOpen(!promptOpen)}
            copiedPrompt={copiedPrompt}
            onCopyPrompt={handleCopyForGemini}
            copiedFreshPrompt={copiedFreshPrompt}
            onCopyFreshPrompt={handleCopyFreshPrompt}
          />
        </CardContent>
      </Card>

      {/* ── CARD 2: Question Import & Quality Gate ── */}
      <QuestionPasteCard
        code={code}
        onCodeChange={setCode}
        isFinalSet={isFinalSet}
        onIsFinalSetChange={setIsFinalSet}
        detectedCount={detectedCount}
        isExact20={isExact20}
        isMultipleOf20={isMultipleOf20}
        setCountToCreate={setCountToCreate}
        isCountValid={isCountValid}
        canImport={canImport}
        batchValidation={batchValidation}
        hasNoDbCollisions={hasNoDbCollisions}
        isDuplicateSetName={isDuplicateSetName}
        selectedSubjectId={selectedSubjectId}
        selectedTopicId={selectedTopicId}
        subtopicName={subtopicName}
        allErrors={allErrors}
        isImporting={isImporting}
        onImportClick={() => {
          const availableSubTopics = masterTopicInfo?.subTopics || [];
          const activeSubName = availableSubTopics.find((s) => s.id === selectedSubTopicId)?.name;
          onImportClick?.({
            isFinalSet,
            masterTopicId: activeMasterTopicId,
            subTopicId: selectedSubTopicId || undefined,
            subTopic: activeSubName || undefined,
          });
        }}
      />
    </div>
  );
}
