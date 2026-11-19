"use client";

import { useMemo } from "react";
import {
  QuestionInput,
  validateImportBatch,
  BatchValidationResult,
} from "@/lib/validators/question";
import {
  extractBaseTopicName,
  getNextPartNumber,
  calculateBatchSetNames,
} from "@/lib/setNumbering";

interface UseImportValidationParams {
  code: string;
  questions: QuestionInput[];
  parseError: string;
  isolationErrors: string[];
  isFinalSet: boolean;
  batchSize: number;
  subtopicName: string;
  selectedSubjectId: string;
  selectedTopicId: string;
  isImporting: boolean;
  usedQuestionIds?: string[];
  existingTestSets: Array<{ _id: string; name: string }>;
}

export function useImportValidation({
  code,
  questions,
  parseError,
  isolationErrors,
  isFinalSet,
  batchSize,
  subtopicName,
  selectedSubjectId,
  selectedTopicId,
  isImporting,
  usedQuestionIds = [],
  existingTestSets,
}: UseImportValidationParams) {
  const batchValidation: BatchValidationResult | null = useMemo(() => {
    if (!code.trim() || questions.length === 0) return null;
    return validateImportBatch(questions, {
      allowFinalBelow20: isFinalSet,
      isFinalSet,
    });
  }, [code, questions, isFinalSet]);

  const collidingIds = useMemo(() => {
    if (!usedQuestionIds.length || !questions.length) return [];
    const used = new Set(usedQuestionIds.map(String));
    return questions
      .map((q) => String((q as any).id || (q as any).sourceQuestionId || q.meta?.sourceQuestionId || ""))
      .filter((id) => id && used.has(id));
  }, [usedQuestionIds, questions]);

  const detectedCount = questions.length;
  const isMultipleOf20 = detectedCount > 0 && detectedCount % 20 === 0;
  const isExact20 = detectedCount === 20;
  const setCountToCreate = Math.max(1, Math.ceil(detectedCount / 20));
  const isCountValid = isMultipleOf20 || (isFinalSet && detectedCount > 0);
  const hasNoDbCollisions = collidingIds.length === 0;

  const plannedSetNames = useMemo(() => {
    if (!subtopicName.trim()) return [];
    const baseName = extractBaseTopicName(subtopicName) || subtopicName.trim();
    const match = subtopicName.match(/(?:Part|भाग|Set|सेट)[\s\-–—:]*(\d+)/i) || subtopicName.match(/(\d+)/);
    const startNum = match ? parseInt(match[1], 10) : getNextPartNumber(existingTestSets);
    const count = detectedCount > 0 ? Math.ceil(detectedCount / 20) : Math.ceil(batchSize / 20);
    return calculateBatchSetNames(baseName, startNum, Math.max(1, count));
  }, [subtopicName, detectedCount, batchSize, existingTestSets]);

  const isDuplicateSetName = useMemo(() => {
    if (!subtopicName.trim() || !existingTestSets.length) return false;
    const existingLower = new Set(existingTestSets.map((s) => s.name.trim().toLowerCase()));
    if (plannedSetNames.length > 0) {
      return plannedSetNames.some((name) => existingLower.has(name.toLowerCase()));
    }
    return existingLower.has(subtopicName.trim().toLowerCase());
  }, [subtopicName, existingTestSets, plannedSetNames]);

  const allErrors = useMemo(() => {
    const errs: string[] = [];
    if (parseError) errs.push(parseError);
    if (isolationErrors.length > 0) errs.push(...isolationErrors);
    if (batchValidation) errs.push(...batchValidation.errors);
    if (collidingIds.length > 0) {
      errs.push(
        `⚠️ ${collidingIds.length} प्रश्न पहले से इम्पोर्ट हो चुके हैं (उदा. ${collidingIds.slice(0, 3).join(", ")}). डुप्लीकेट इम्पोर्ट रोका गया।`
      );
    }
    if (isDuplicateSetName) {
      errs.push(`A test set named '${subtopicName.trim()}' (or in this batch) already exists under this topic.`);
    }
    if (code.trim().length > 0) {
      if (!selectedSubjectId) errs.push("Step 1 incomplete: Please select a Subject above.");
      if (!selectedTopicId) errs.push("Step 1 incomplete: Please select a Master Topic above.");
      if (!subtopicName.trim()) errs.push("Step 1 incomplete: Please enter a Set / Part Name above.");
    }
    return errs;
  }, [parseError, isolationErrors, batchValidation, collidingIds, isDuplicateSetName, subtopicName, code, selectedSubjectId, selectedTopicId]);

  const canImport =
    isCountValid &&
    batchValidation?.isValid === true &&
    allErrors.length === 0 &&
    hasNoDbCollisions &&
    !isDuplicateSetName &&
    Boolean(selectedTopicId) &&
    Boolean(subtopicName.trim()) &&
    !isImporting;

  return {
    batchValidation,
    collidingIds,
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
  };
}
