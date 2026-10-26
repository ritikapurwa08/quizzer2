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
  score = 0,
  totalQuestions,
  correctCount = 0,
  incorrectCount = 0,
  unansweredCount = 0,
}: PdfEndSummaryProps) {
  const maxScore = totalQuestions * 2;
  const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  return (
    <div className="pdf-closing-summary mt-2 pt-2 border-t border-slate-200 text-slate-800 break-inside-avoid page-break-inside-avoid bg-white">
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-white font-black text-[7pt]">
              Q
            </span>
            <span className="text-[7.8pt] font-black text-slate-900 tracking-tight">
              QUIZZER ASSESSMENT SUMMARY
            </span>
          </div>
          <p className="text-[6.8pt] text-slate-600 mt-1 leading-normal">
            Final Result: <strong>{formatScore(score)} / {maxScore} pts ({percentage}%)</strong> • Solved: <strong>{correctCount} Correct</strong>, <strong>{incorrectCount} Incorrect</strong>{unansweredCount > 0 ? `, ${unansweredCount} Skipped` : ""}.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block rounded border border-slate-200 bg-white px-2 py-0.5 text-[6.5pt] font-bold text-slate-700 uppercase tracking-wider">
            Verified Examination Key
          </span>
          <p className="text-[6pt] text-slate-500 mt-0.5 font-medium">
            Quizzer Exam Portal
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[6pt] text-slate-500 pt-1 px-1">
        <span>Official Examination Revision Document • Quizzer Learning Portal</span>
        <span>End of Assessment Report • Verified Evaluation Key</span>
      </div>
    </div>
  );
}
