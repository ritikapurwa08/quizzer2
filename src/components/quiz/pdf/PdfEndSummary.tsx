"use client";

import React from "react";
import { formatScore } from "@/lib/utils";

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
    <div className="pdf-closing-summary mt-2 pt-2 border-t border-slate-200 text-slate-800 break-inside-avoid page-break-inside-avoid bg-white">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-[8pt]">
              Q
            </span>
            <span className="text-[8.5pt] font-black text-slate-900 tracking-tight">
              QUIZZER ASSESSMENT SUMMARY
            </span>
          </div>
          <p className="text-[7pt] text-slate-600 mt-1 leading-normal">
            Final Result: <strong>{formatScore(safeScore)} / {maxScore} pts ({percentage}%)</strong> • Solved: <strong>{safeCorrect} Correct</strong>, <strong>{safeIncorrect} Incorrect</strong>{safeUnanswered > 0 ? `, ${safeUnanswered} Skipped` : ""}.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[6.8pt] font-extrabold text-slate-700 uppercase tracking-wider shadow-xs">
            Verified Examination Key
          </span>
          <p className="text-[6.5pt] text-slate-400 mt-0.5 font-medium">
            Quizzer Exam Portal
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[6.5pt] text-slate-400 pt-1.5 px-1">
        <span>Official Examination Revision Document • Quizzer Learning Portal</span>
        <span>End of Assessment Report • Verified Evaluation Key</span>
      </div>
    </div>
  );
}
