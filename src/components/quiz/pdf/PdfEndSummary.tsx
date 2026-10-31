"use client";

import React from "react";
import { formatScore } from "@/lib/utils";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";

interface PdfEndSummaryProps {
  score?: number;
  totalQuestions: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
}

export function PdfEndSummary({
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
}: PdfEndSummaryProps) {
  const safeScore = score ?? 0;
  const safeTotal = Math.max(1, totalQuestions || 0);
  const safeCorrect = correctCount ?? 0;
  const safeIncorrect = incorrectCount ?? 0;
  const safeUnanswered = unansweredCount ?? 0;

  const maxScore = safeTotal * 2;
  const percentage = maxScore > 0 ? ((safeScore / maxScore) * 100).toFixed(1) : "0";

  return (
    <div
      className="pdf-closing-summary mt-2 pt-2 border-t break-inside-avoid"
      style={{
        borderColor: "var(--pdf-border)",
        color: "var(--pdf-text)",
      }}
    >
      <div
        className="rounded-xl border p-2.5 flex items-center justify-between gap-3"
        style={{
          background: "var(--pdf-surface-2)",
          borderColor: "var(--pdf-border)",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <div
              className="flex h-5 w-5 items-center justify-center rounded-md border p-0.5"
              style={{
                background: "var(--pdf-surface)",
                borderColor: "var(--pdf-border)",
              }}
            >
              <QuizzerLogoIcon className="h-4 w-4" />
            </div>
            <span
              className="text-[8.5pt] font-black tracking-tight"
              style={{ color: "var(--pdf-text)" }}
            >
              QUIZZER ASSESSMENT SUMMARY
            </span>
          </div>
          <p
            className="text-[7pt] mt-1 leading-normal"
            style={{ color: "var(--pdf-muted)" }}
          >
            Final Result:{" "}
            <strong style={{ color: "var(--pdf-text)" }}>
              {formatScore(safeScore)} / {maxScore} pts ({percentage}%)
            </strong>{" "}
            • Solved:{" "}
            <strong style={{ color: "var(--pdf-ok)" }}>
              {safeCorrect} Correct
            </strong>
            ,{" "}
            <strong style={{ color: "var(--pdf-bad)" }}>
              {safeIncorrect} Incorrect
            </strong>
            {safeUnanswered > 0 ? `, ${safeUnanswered} Skipped` : ""}.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span
            className="inline-block rounded-full border px-2.5 py-0.5 text-[6.8pt] font-extrabold uppercase tracking-wider"
            style={{
              background: "var(--pdf-surface)",
              borderColor: "var(--pdf-border)",
              color: "var(--pdf-text)",
            }}
          >
            Verified Examination Key
          </span>
          <p
            className="text-[6.5pt] mt-0.5 font-medium"
            style={{ color: "var(--pdf-muted)" }}
          >
            Quizzer Exam Portal
          </p>
        </div>
      </div>

      <div
        className="flex items-center justify-between text-[6.5pt] pt-1.5 px-1"
        style={{ color: "var(--pdf-muted)" }}
      >
        <span>Official Examination Revision Document • Quizzer Learning Portal</span>
        <span>End of Assessment Report • Verified Evaluation Key</span>
      </div>
    </div>
  );
}
