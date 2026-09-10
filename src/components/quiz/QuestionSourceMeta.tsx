"use client";

import { Pin, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuestionSourceMetaProps {
  reference?: string | null;
  meta?: {
    sourceType?: string;
    exam?: string;
    sourceQuestionId?: number;
    [key: string]: unknown;
  } | null;
  className?: string;
}

export function parseQuestionSource(
  reference?: string | null,
  meta?: { sourceType?: string; exam?: string; [key: string]: unknown } | null
) {
  let sourceType = meta?.sourceType ? String(meta.sourceType).trim() : undefined;
  let exam = meta?.exam ? String(meta.exam).trim() : undefined;

  const cleanRef = reference ? reference.replace(/^[📌📍📄\s]+/, "").trim() : undefined;

  if (cleanRef) {
    // Check if reference contains a PYQ prefix pattern e.g. "PYQ_EXACT — CHEMIST..."
    const match = cleanRef.match(
      /^(PYQ[_\s](?:EXACT|MODIFIED)|AI[_\s]NEW)\s*(?:[—–\-:]\s*(.+))?$/i
    );
    if (match) {
      if (!sourceType) {
        sourceType = match[1].replace(/\s+/g, "_").toUpperCase();
      }
      if (!exam && match[2]) {
        exam = match[2].trim();
      }
    } else if (!exam) {
      exam = cleanRef;
    }
  }

  // Format friendly display name for sourceType
  let sourceTypeLabel: string | undefined;
  if (sourceType === "PYQ_EXACT") {
    sourceTypeLabel = "PYQ Exact";
  } else if (sourceType === "PYQ_MODIFIED") {
    sourceTypeLabel = "PYQ Modified";
  } else if (sourceType && sourceType !== "AI_NEW") {
    sourceTypeLabel = sourceType.replace(/_/g, " ");
  }

  const hasSource = Boolean(sourceTypeLabel || exam);

  return {
    hasSource,
    label: "संदर्भ",
    sourceTypeLabel,
    examReference: exam,
  };
}

export function QuestionSourceMeta({
  reference,
  meta,
  className,
}: QuestionSourceMetaProps) {
  const { hasSource, label, sourceTypeLabel, examReference } = parseQuestionSource(
    reference,
    meta
  );

  if (!hasSource) return null;

  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground max-w-full leading-normal",
        className
      )}
    >
      {/* 1. Source / Reference Indicator */}
      <span className="inline-flex items-center gap-1 font-medium text-muted-foreground font-hindi shrink-0 text-[11px] sm:text-xs">
        <Pin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/70 shrink-0 rotate-45" />
        <span>{label}</span>
      </span>

      {/* 2. PYQ Type Indicator */}
      {sourceTypeLabel && (
        <>
          <span
            className="text-border text-[10px] select-none shrink-0"
            aria-hidden="true"
          >
            •
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary text-[11px] sm:text-xs shrink-0">
            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
            <span>{sourceTypeLabel}</span>
          </span>
        </>
      )}

      {/* 3. Exam Reference */}
      {examReference && (
        <>
          <span
            className="text-border text-[10px] select-none shrink-0"
            aria-hidden="true"
          >
            •
          </span>
          <span className="font-medium text-foreground/90 font-hindi break-words tracking-tight text-[11px] sm:text-xs">
            {examReference}
          </span>
        </>
      )}
    </div>
  );
}
