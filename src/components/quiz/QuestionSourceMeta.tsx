"use client";

import { FileText, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type CanonicalSourceType = "PYQ" | "PYQ_MODIFIED" | "AI_NEW";

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

export function isFakeExam(str?: string | null): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return (
    !lower ||
    lower === "unknown" ||
    lower === "unknown exam" ||
    lower === "practice" ||
    lower === "practice exam" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "[object object]" ||
    lower === "object" ||
    lower === "none" ||
    lower === "n/a"
  );
}

export function parseQuestionSource(
  reference?: string | null,
  meta?: { sourceType?: string; exam?: string; [key: string]: unknown } | null
): {
  hasSource: boolean;
  sourceType?: CanonicalSourceType;
  examReference?: string;
  badgeLabel?: string;
} {
  const sanitize = (str: unknown): string | undefined => {
    if (!str || typeof str !== "string") return undefined;
    const trimmed = str.trim();
    if (isFakeExam(trimmed)) {
      return undefined;
    }
    return trimmed;
  };

  const rawSourceType = meta?.sourceType ? String(meta.sourceType).trim().toUpperCase() : undefined;
  let exam = sanitize(meta?.exam);

  const cleanRef = reference ? reference.replace(/^[📌📍📄✎✦\s]+/, "").trim() : undefined;

  let identifiedSourceType: CanonicalSourceType | undefined;

  if (rawSourceType) {
    if (rawSourceType === "AI_NEW") {
      identifiedSourceType = "AI_NEW";
    } else if (rawSourceType === "PYQ_MODIFIED") {
      identifiedSourceType = "PYQ_MODIFIED";
    } else if (rawSourceType === "PYQ" || rawSourceType === "PYQ_EXACT" || rawSourceType.startsWith("PYQ")) {
      identifiedSourceType = "PYQ";
    }
  }

  if (cleanRef) {
    const match = cleanRef.match(
      /^(PYQ(?:[_\s](?:EXACT|MODIFIED))?|AI[_\s]NEW)\s*(?:[—–\-:·•]\s*(.+))?$/i
    );
    if (match) {
      const typePart = match[1].toUpperCase().replace(/\s+/g, "_");
      if (typePart === "AI_NEW") {
        identifiedSourceType = "AI_NEW";
      } else if (typePart === "PYQ_MODIFIED") {
        identifiedSourceType = "PYQ_MODIFIED";
      } else if (typePart.startsWith("PYQ")) {
        identifiedSourceType = "PYQ";
      }
      if (!exam && match[2]) {
        exam = sanitize(match[2]);
      }
    } else if (cleanRef.toUpperCase() === "AI_NEW") {
      identifiedSourceType = "AI_NEW";
    } else {
      // Plain reference without type prefix is treated as a PYQ exam reference only if valid
      const sanitizedRef = sanitize(cleanRef);
      if (sanitizedRef) {
        if (!exam) {
          exam = sanitizedRef;
        }
        if (!identifiedSourceType) {
          identifiedSourceType = "PYQ";
        }
      }
    }
  }

  if (exam) {
    // Strip redundant leading "PYQ — " prefix from exam name if present
    exam = exam
      .replace(/^(?:PYQ[_\s]*(?:EXACT|MODIFIED)?\s*[—–\-:·•]\s*)/i, "")
      .trim();
    exam = sanitize(exam);
  }

  // Never attach an exam to AI_NEW
  if (identifiedSourceType === "AI_NEW") {
    exam = undefined;
  }

  if (!identifiedSourceType && exam) {
    identifiedSourceType = "PYQ";
  }

  if (!identifiedSourceType) {
    return {
      hasSource: false,
      examReference: undefined,
    };
  }

  const badgeLabel =
    identifiedSourceType === "PYQ"
      ? "PYQ"
      : identifiedSourceType === "PYQ_MODIFIED"
      ? "PYQ Modified"
      : "AI Generated";

  return {
    hasSource: true,
    sourceType: identifiedSourceType,
    examReference: exam,
    badgeLabel,
  };
}

export function QuestionSourceMeta({
  reference,
  meta,
  className,
}: QuestionSourceMetaProps) {
  const { hasSource, sourceType, examReference, badgeLabel } = parseQuestionSource(
    reference,
    meta
  );

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

      {/* Inline Icon + Label */}
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 font-medium",
          sourceType === "AI_NEW"
            ? "text-primary/90"
            : sourceType === "PYQ_MODIFIED"
            ? "text-amber-500/90 dark:text-amber-400"
            : "text-foreground/75"
        )}
      >
        {sourceType === "AI_NEW" ? (
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-primary/80" />
        ) : sourceType === "PYQ_MODIFIED" ? (
          <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-amber-500/80 dark:text-amber-400" />
        ) : (
          <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-muted-foreground/80" />
        )}
        <span>{badgeLabel}</span>
      </span>

      {/* Flexible & Shrinkable Exam Reference for PYQ */}
      {sourceType === "PYQ" && examReference && (
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

