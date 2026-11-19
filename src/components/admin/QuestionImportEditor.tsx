"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ImportJson } from "@/lib/validators/question";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { getTopicDisplayName, getSubjectDisplayName } from "@/lib/utils";
import {
  GeminiPromptSection,
  TargetConfigSection,
  QuestionPasteCard,
  LivePoolStatusStrip,
  QuestionImportEditorProps,
  ImportOptionsPayload,
} from "./import";
import { useCandidateSet } from "./import/useCandidateSet";
import { useSyllabusAutoDetect } from "./import/useSyllabusAutoDetect";
import { useQuestionParser } from "./import/useQuestionParser";
import { useImportValidation } from "./import/useImportValidation";

export type { ImportOptionsPayload };

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
}: QuestionImportEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [promptOpen, setPromptOpen] = useState(false);
  const [isFinalSet, setIsFinalSet] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(20);

  const subject = subjectsList.find((x) => x._id === selectedSubjectId);
  const topic = topicsList.find((x) => x._id === selectedTopicId);
  const subjectName = getSubjectDisplayName(subject) || "";
  const topicName = getTopicDisplayName(topic) || "";

  // Derive masterTopic strictly from selected topic (never stale)
  const masterTopicInfo = useMemo(() => {
    if (!topic && !topicName) return null;
    const tName = topic?.name || topicName || "";
    const tHindi = topic?.nameHindi || topicName || "";
    const lower = tName.toLowerCase();

    return (
      MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === tHindi ||
          mt.nameHindi === tName ||
          mt.nameEnglish === tName ||
          mt.nameEnglish.toLowerCase() === lower ||
          (mt.nameHindi && tHindi && (tHindi.includes(mt.nameHindi) || mt.nameHindi.includes(tHindi))) ||
          (mt.nameEnglish && tName && (lower.includes(mt.nameEnglish.toLowerCase()) || mt.nameEnglish.toLowerCase().includes(lower)))
      ) || null
    );
  }, [topic, topicName]);

  const activeMasterTopicId = masterTopicInfo?.id || (selectedTopicId ? undefined : initialMasterTopicId);

  const currentSetNumber = useMemo(() => {
    if (!subtopicName) return 1;
    const m = subtopicName.match(/(?:Part|भाग|Set|सेट)\s*(\d+)/i) || subtopicName.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 1;
  }, [subtopicName]);

  // Candidate set hook for prompt generation & live pool state
  const {
    candidateData,
    loadingCandidates,
    candidateError,
    copiedPrompt,
    copiedFreshPrompt,
    handleCopyReviewPrompt,
    handleCopyFreshPrompt,
  } = useCandidateSet({
    selectedTopicId,
    selectedSubTopicId,
    selectedSubjectId,
    activeMasterTopicId,
    currentSetNumber,
    batchSize,
    onBatchSizeChange: setBatchSize,
    onSubtopicNameChange,
    subtopicName,
  });

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

  // Parse pasted input
  const parseResult = useQuestionParser({ code, subjectName, topicName, subtopicName });

  // Auto-detect syllabus if user pastes questions with embedded topic tags
  useSyllabusAutoDetect({
    rawParsedObj: parseResult.rawParsedObj,
    selectedSubjectId,
    selectedTopicId,
    subtopicName,
    subjectsList,
    topicsList,
    onSubjectChangeId,
    onTopicChangeId,
    onSubtopicNameChange,
  });

  // Validation, error checking & duplicate collisions
  const {
    batchValidation,
    detectedCount,
    isMultipleOf20,
    isExact20,
    setCountToCreate,
    isCountValid,
    hasNoDbCollisions,
    plannedSetNames,
    isDuplicateSetName,
    allErrors,
    canImport,
  } = useImportValidation({
    code,
    questions: parseResult.questions,
    parseError: parseResult.parseError,
    isolationErrors: parseResult.isolationErrors,
    isFinalSet,
    batchSize,
    subtopicName,
    selectedSubjectId,
    selectedTopicId,
    isImporting,
    usedQuestionIds: candidateData?.usedQuestionIds,
    existingTestSets,
  });

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
  }, [code, canImport, isCountValid, parseResult.questions, allErrors, subjectName, topicName, selectedTopicId, subtopicName, onParsedChange, onChange]);

  const availableSubTopics = masterTopicInfo?.subTopics || [];
  const activeSubTopicObj = availableSubTopics.find((s) => s.id === selectedSubTopicId);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* ── CARD 1: Syllabus Target & Prompt Generator ── */}
      <Card className="rounded-2xl border-border/70 shadow-xs bg-card overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border/40">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Step 1: Syllabus & Candidate Target
            </span>
            <span className="text-xs font-semibold text-primary">Import Batch</span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3.5">
          <TargetConfigSection
            subjectsList={subjectsList}
            topicsList={topicsList}
            selectedSubjectId={selectedSubjectId}
            selectedTopicId={selectedTopicId}
            onSubjectChangeId={onSubjectChangeId}
            onTopicChangeId={onTopicChangeId}
            availableSubTopics={availableSubTopics}
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
            maxSetsAvailable={candidateData?.maxSetsAvailable ?? 2}
          />

          {/* Live Pool Count & Progress Strip */}
          {selectedTopicId && (
            <LivePoolStatusStrip
              loadingCandidates={loadingCandidates}
              totalPoolCount={candidateData?.totalPoolCount}
              importedCount={candidateData?.importedCount}
              remainingCount={candidateData?.remainingCount}
              isComplete={candidateData?.isComplete}
              activeTopicName={topicName}
              activeSubTopicName={activeSubTopicObj?.name}
            />
          )}

          {/* Gemini AI Action Row */}
          <GeminiPromptSection
            loadingCandidates={loadingCandidates}
            candidateData={candidateData}
            candidateError={candidateError}
            promptOpen={promptOpen}
            onTogglePrompt={() => setPromptOpen(!promptOpen)}
            copiedPrompt={copiedPrompt}
            onCopyPrompt={handleCopyReviewPrompt}
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
          onImportClick?.({
            isFinalSet,
            masterTopicId: activeMasterTopicId,
            subTopicId: selectedSubTopicId || undefined,
            subTopic: activeSubTopicObj?.name || undefined,
          });
        }}
      />
    </div>
  );
}
