"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { BatchValidationResult } from "@/lib/validators/question";

interface QualityGateChecklistProps {
  isCountValid: boolean;
  isFinalSet: boolean;
  isMultipleOf20: boolean;
  detectedCount: number;
  setCountToCreate: number;
  batchValidation: BatchValidationResult | null;
  hasNoDbCollisions: boolean;
  isDuplicateSetName: boolean;
  selectedSubjectId: string;
  selectedTopicId: string;
  subtopicName: string;
}

export function QualityGateChecklist({
  isCountValid,
  isFinalSet,
  isMultipleOf20,
  detectedCount,
  setCountToCreate,
  batchValidation,
  hasNoDbCollisions,
  isDuplicateSetName,
  selectedSubjectId,
  selectedTopicId,
  subtopicName,
}: QualityGateChecklistProps) {
  return (
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
            : isMultipleOf20
            ? `${detectedCount} questions verified (${setCountToCreate} Sets × 20 questions)`
            : `Batches of 20 required (${detectedCount} questions)`}
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

      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border/40 sm:col-span-2">
        {Boolean(selectedTopicId && subtopicName.trim() && !isDuplicateSetName) ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        )}
        <span>
          {!selectedSubjectId
            ? "Step 1 required: Select a Subject above"
            : !selectedTopicId
            ? "Step 1 required: Select a Master Topic above"
            : !subtopicName.trim()
            ? "Step 1 required: Enter a Set / Part Name above"
            : isDuplicateSetName
            ? "Step 1 error: Duplicate Set Name"
            : "Step 1 complete: Subject, Topic & Set Name assigned"}
        </span>
      </div>
    </div>
  );
}

