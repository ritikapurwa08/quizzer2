"use client";

import { FileText } from "lucide-react";
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
  const sanitize = (str: unknown): string | undefined => {
    if (!str || typeof str !== "string") return undefined;
    const trimmed = str.trim();
    if (
      !trimmed ||
      trimmed === "[object Object]" ||
      trimmed.toLowerCase() === "object" ||
      trimmed.toLowerCase() === "undefined" ||
      trimmed.toLowerCase() === "null"
    ) {
      return undefined;
    }
    return trimmed;
  };

  const rawSourceType = sanitize(meta?.sourceType);
  let exam = sanitize(meta?.exam);

  const cleanRef = sanitize(
    reference ? reference.replace(/^[📌📍📄\s]+/, "").trim() : undefined
  );

  let isPyq = false;

  if (
    rawSourceType &&
    (rawSourceType === "PYQ_EXACT" ||
      rawSourceType === "PYQ_MODIFIED" ||
      rawSourceType.startsWith("PYQ"))
  ) {
    isPyq = true;
  }

  if (cleanRef) {
    const match = cleanRef.match(
      /^(PYQ(?:[_\s](?:EXACT|MODIFIED))?|AI[_\s]NEW)\s*(?:[—–\-:·•]\s*(.+))?$/i
    );
    if (match) {
      const typePart = match[1].toUpperCase().replace(/\s+/g, "_");
      if (typePart.startsWith("PYQ")) {
        isPyq = true;
      }
      if (!exam && match[2]) {
        exam = sanitize(match[2]);
      }
    } else if (cleanRef.toUpperCase() !== "AI_NEW") {
      if (!exam) {
        exam = cleanRef;
      }
      isPyq = true;
    }
  }

  // If question is AI_NEW and has no explicit exam reference, don't show PYQ source
  if (rawSourceType === "AI_NEW" && !exam) {
    return {
      hasSource: false,
      examReference: undefined,
    };
  }

  if (exam) {
    // Strip redundant leading "PYQ — " prefix from exam name if present
    exam = exam
      .replace(/^(?:PYQ[_\s]*(?:EXACT|MODIFIED)?\s*[—–\-:·•]\s*)/i, "")
      .trim();
    exam = sanitize(exam);
  }

  const hasSource = isPyq || Boolean(exam);

  return {
    hasSource,
    examReference: exam,
  };
}

export function QuestionSourceMeta({
  reference,
  meta,
  className,
}: QuestionSourceMetaProps) {
  const { hasSource, examReference } = parseQuestionSource(reference, meta);

  if (!hasSource) return null;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs text-muted-foreground",
        className
      )}
    >
      {/* Subtle Separator Dot */}
      <span
        className="text-muted-foreground/40 text-[10px] sm:text-xs select-none shrink-0"
        aria-hidden="true"
      >
        ·
      </span>

      {/* Inline Document Icon + PYQ Label */}
      <span className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground/75">
        <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-muted-foreground/80" />
        <span>PYQ</span>
      </span>

      {/* Flexible & Shrinkable Exam Reference */}
      {examReference && (
        <>
          <span
            className="text-muted-foreground/40 text-[10px] select-none shrink-0"
            aria-hidden="true"
          >
            ·
          </span>
          <span
            title={examReference}
            className="min-w-0 truncate font-normal text-muted-foreground font-hindi"
          >
            {examReference}
          </span>
        </>
      )}
    </div>
  );
}
