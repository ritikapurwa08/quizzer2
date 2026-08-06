"use client";

import { McqRenderer } from "./McqRenderer";
import { QuestionRendererProps } from "@/types";

/**
 * Statement & Reason questions share the standard 4-option verdict list
 * with Assertion-Reason (SRD Section 10) — questionText already contains
 * the labeled statements, QuestionShell renders it with whitespace-pre-line
 * so line breaks in the source JSON are preserved.
 */
export function StatementReasonRenderer(props: QuestionRendererProps) {
  return <McqRenderer {...props} />;
}
