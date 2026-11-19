"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

export interface CandidateSetData {
  setName: string;
  setNumber: number;
  candidateCount: number;
  targetCount: number;
  batchSize: number;
  setCount: number;
  remainingCount: number;
  totalPoolCount?: number;
  importedCount?: number;
  usedQuestionIds?: string[];
  maxSetsAvailable?: number;
  isFinalTopicSet?: boolean;
  isComplete?: boolean;
  message?: string;
  questions: any[];
  geminiPrompt: string;
  freshGenerationPrompt?: string;
}

interface UseCandidateSetParams {
  selectedTopicId: string;
  selectedSubTopicId: string;
  selectedSubjectId: string;
  activeMasterTopicId?: number;
  currentSetNumber: number;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  onSubtopicNameChange: (name: string) => void;
  subtopicName: string;
}

export function useCandidateSet({
  selectedTopicId,
  selectedSubTopicId,
  selectedSubjectId,
  activeMasterTopicId,
  currentSetNumber,
  batchSize,
  onBatchSizeChange,
  onSubtopicNameChange,
  subtopicName,
}: UseCandidateSetParams) {
  const { showToast } = useToast();
  const [candidateData, setCandidateData] = useState<CandidateSetData | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFreshPrompt, setCopiedFreshPrompt] = useState(false);

  // Strict cascading reset: clear stale candidate data immediately when topic or subtopic changes
  const prevTopicRef = useRef(selectedTopicId);
  const prevSubTopicRef = useRef(selectedSubTopicId);
  const prevSubjectRef = useRef(selectedSubjectId);

  useEffect(() => {
    if (
      prevTopicRef.current !== selectedTopicId ||
      prevSubTopicRef.current !== selectedSubTopicId ||
      prevSubjectRef.current !== selectedSubjectId
    ) {
      prevTopicRef.current = selectedTopicId;
      prevSubTopicRef.current = selectedSubTopicId;
      prevSubjectRef.current = selectedSubjectId;
      setCandidateData(null);
      setCandidateError(null);
    }
  }, [selectedTopicId, selectedSubTopicId, selectedSubjectId]);

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
            onBatchSizeChange(data.remainingCount);
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
        setCandidateError(
          errData?.message || errData?.error || `Failed to load candidate questions (HTTP ${res.status}).`
        );
      }
    } catch (err: any) {
      setCandidateData(null);
      setCandidateError(err?.message || "Failed to load candidate questions.");
    } finally {
      setLoadingCandidates(false);
    }
  }, [
    selectedTopicId,
    activeMasterTopicId,
    selectedSubTopicId,
    currentSetNumber,
    batchSize,
    subtopicName,
    onBatchSizeChange,
    onSubtopicNameChange,
  ]);

  useEffect(() => {
    if (!selectedTopicId || !activeMasterTopicId) {
      setCandidateData(null);
      setCandidateError(null);
      return;
    }
    fetchCandidates();
  }, [fetchCandidates, selectedTopicId, activeMasterTopicId]);

  const handleCopyReviewPrompt = () => {
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
    showToast(
      `✓ Gemini Review prompt with ${candidateData.candidateCount} candidate questions copied to clipboard!`,
      "success"
    );
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

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

  return {
    candidateData,
    loadingCandidates,
    candidateError,
    copiedPrompt,
    copiedFreshPrompt,
    handleCopyReviewPrompt,
    handleCopyFreshPrompt,
    refetchCandidates: fetchCandidates,
  };
}
