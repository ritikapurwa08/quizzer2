"use client";

import React from "react";
import { formatScore } from "@/lib/utils";

interface PdfDashboardProps {
  score?: number;
  totalQuestions: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
}

export function PdfDashboard({
  score = 0,
  totalQuestions,
  correctCount = 0,
  incorrectCount = 0,
  unansweredCount = 0,
}: PdfDashboardProps) {
  const maxScore = totalQuestions * 2;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const percentage =
    maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  const correctPoints = correctCount * 2;
  const incorrectPoints = ((incorrectCount * 2) / 3).toFixed(2);
  const hasSkipped = unansweredCount > 0;

  return (
    <div className="pdf-dashboard mb-2 text-slate-900 bg-white">
      {/* ── Compact Editorial KPI Ribbon ── */}
      <div className="rounded-md border border-slate-200 bg-slate-50/60 py-1.5 px-3 flex items-center justify-between divide-x divide-slate-200 text-slate-800">
        {/* Total Score */}
        <div className="flex-1 text-center px-1">
          <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-wider">
            TOTAL SCORE
          </p>
          <p className="text-[10pt] font-black text-slate-900 leading-tight tracking-tight mt-0.5">
            {formatScore(score)}{" "}
            <span className="text-[6.5pt] font-semibold text-slate-500">
              / {maxScore} ({percentage}%)
            </span>
          </p>
        </div>

        {/* Correct Answers */}
        <div className="flex-1 text-center px-1">
          <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-wider">
            CORRECT
          </p>
          <p className="text-[10pt] font-black text-emerald-600 leading-tight tracking-tight mt-0.5">
            {correctCount}{" "}
            <span className="text-[6.5pt] font-semibold text-emerald-600">
              (+{correctPoints})
            </span>
          </p>
        </div>

        {/* Incorrect Answers */}
        <div className="flex-1 text-center px-1">
          <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-wider">
            INCORRECT
          </p>
          <p className="text-[10pt] font-black text-rose-600 leading-tight tracking-tight mt-0.5">
            {incorrectCount}{" "}
            <span className="text-[6.5pt] font-semibold text-rose-600">
              (-{incorrectPoints})
            </span>
          </p>
        </div>

        {/* Skipped Answers */}
        {hasSkipped && (
          <div className="flex-1 text-center px-1">
            <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-wider">
              SKIPPED
            </p>
            <p className="text-[10pt] font-black text-slate-600 leading-tight tracking-tight mt-0.5">
              {unansweredCount}{" "}
              <span className="text-[6.5pt] font-medium text-slate-500">
                (0.0)
              </span>
            </p>
          </div>
        )}

        {/* Accuracy */}
        <div className="flex-1 text-center px-1">
          <p className="text-[6pt] font-bold text-slate-500 uppercase tracking-wider">
            ACCURACY
          </p>
          <p className="text-[10pt] font-black text-blue-700 leading-tight tracking-tight mt-0.5">
            {accuracy}%{" "}
            <span className="text-[6.5pt] font-medium text-slate-500">
              ({correctCount}/{totalQuestions})
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
