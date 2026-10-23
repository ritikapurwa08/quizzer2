"use client";

import React from "react";
import { formatScore } from "@/lib/utils";

interface PdfEndSummaryProps {
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export function PdfEndSummary({
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
}: PdfEndSummaryProps) {
  const maxScore = totalQuestions * 2;
  const percentage = maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  return (
    <div className="pdf-closing-summary mt-3 pt-2.5 border-t-2 border-slate-900 text-slate-800 break-inside-avoid page-break-inside-avoid">
      <div className="rounded-md border border-slate-300 bg-slate-50 p-2.5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white font-bold text-[8pt]">
              Q
            </span>
            <span className="text-[8.5pt] font-black text-slate-900 tracking-tight">
              QUIZZER ASSESSMENT SUMMARY
            </span>
          </div>
          <p className="text-[7pt] text-slate-600 mt-0.5">
            Final Result: <strong>{formatScore(score)} / {maxScore} pts ({percentage}%)</strong> • Solved: <strong>{correctCount} Correct</strong>, <strong>{incorrectCount} Incorrect</strong>{unansweredCount > 0 ? `, ${unansweredCount} Skipped` : ""}.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block rounded border border-slate-300 bg-white px-2 py-0.5 text-[7pt] font-bold text-slate-800 uppercase tracking-wider">
            Verified Examination Key
          </span>
          <p className="text-[6.5pt] text-slate-500 mt-0.5 font-medium">
            Quizzer Exam Portal • quizzer2.vercel.app
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[6.5pt] text-slate-500 pt-1.5 px-1">
        <span>Curriculum: RPSC Senior Teacher (2nd Grade) • REET • Patwar • CET</span>
        <span>End of Official Evaluation Report • Keep Revising & Excel!</span>
      </div>
    </div>
  );
}
