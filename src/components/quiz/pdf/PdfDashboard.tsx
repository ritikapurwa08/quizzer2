"use client";

import React from "react";
import { formatScore } from "@/lib/utils";

interface PdfDashboardProps {
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

export function PdfDashboard({
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
}: PdfDashboardProps) {
  const maxScore = totalQuestions * 2;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const percentage =
    maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  const correctPct = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const incorrectPct = totalQuestions > 0 ? (incorrectCount / totalQuestions) * 100 : 0;
  const unansweredPct = totalQuestions > 0 ? (unansweredCount / totalQuestions) * 100 : 0;

  // Strategic revision insight based on accuracy
  let revisionInsight = "Systematic revision of core rules recommended.";
  if (accuracy >= 80) {
    revisionInsight = `High Proficiency — Mastered ${correctCount}/${totalQuestions} questions. Review the ${incorrectCount} incorrect questions below to eliminate edge-case errors.`;
  } else if (accuracy >= 60) {
    revisionInsight = `Moderate Proficiency — ${correctCount} correct, ${incorrectCount} mistakes. Prioritize the rule concepts highlighted in the incorrect questions below.`;
  } else {
    revisionInsight = `Targeted Revision Required — High mistake count (${incorrectCount}). Review grammar concepts thoroughly before attempting the next test set.`;
  }

  return (
    <div className="mb-3 text-slate-900">
      {/* ── 5 Metric KPI Ribbon ── */}
      <div className="grid grid-cols-5 gap-1.5 rounded-md border border-slate-300 bg-slate-50/90 p-2 text-center shadow-xs">
        {/* Total Score */}
        <div className="border-r border-slate-200 pr-1">
          <p className="text-[7pt] font-bold text-slate-500 uppercase tracking-wider">
            Total Score
          </p>
          <p className="text-[12pt] font-black text-slate-900 mt-0.5 leading-none">
            {formatScore(score)}
            <span className="text-[7.5pt] font-semibold text-slate-500 ml-0.5">
              / {maxScore}
            </span>
          </p>
          <span className="text-[7pt] font-bold text-slate-600 mt-0.5 block">
            {percentage}% Marks
          </span>
        </div>

        {/* Correct Answers */}
        <div className="border-r border-slate-200 pr-1">
          <p className="text-[7pt] font-bold text-emerald-800 uppercase tracking-wider">
            Correct (+2.0)
          </p>
          <p className="text-[12pt] font-black text-emerald-700 mt-0.5 leading-none">
            {correctCount}
          </p>
          <span className="text-[7pt] font-bold text-emerald-800 mt-0.5 block">
            +{correctCount * 2} pts
          </span>
        </div>

        {/* Incorrect Answers */}
        <div className="border-r border-slate-200 pr-1">
          <p className="text-[7pt] font-bold text-rose-800 uppercase tracking-wider">
            Incorrect (-1/3)
          </p>
          <p className="text-[12pt] font-black text-rose-700 mt-0.5 leading-none">
            {incorrectCount}
          </p>
          <span className="text-[7pt] font-bold text-rose-800 mt-0.5 block">
            -{((incorrectCount * 2) / 3).toFixed(2)} pts
          </span>
        </div>

        {/* Skipped */}
        <div className="border-r border-slate-200 pr-1">
          <p className="text-[7pt] font-bold text-slate-500 uppercase tracking-wider">
            Skipped
          </p>
          <p className="text-[12pt] font-black text-slate-700 mt-0.5 leading-none">
            {unansweredCount}
          </p>
          <span className="text-[7pt] font-bold text-slate-500 mt-0.5 block">
            0 pts
          </span>
        </div>

        {/* Accuracy */}
        <div>
          <p className="text-[7pt] font-bold text-blue-900 uppercase tracking-wider">
            Accuracy
          </p>
          <p className="text-[12pt] font-black text-blue-800 mt-0.5 leading-none">
            {accuracy}%
          </p>
          <span className="text-[7pt] font-bold text-blue-900 mt-0.5 block">
            {correctCount}/{totalQuestions} Qs
          </span>
        </div>
      </div>

      {/* ── Visual Performance Distribution Bar ── */}
      <div className="mt-1.5 mb-1.5 flex h-2 w-full overflow-hidden rounded border border-slate-200 bg-slate-100">
        {correctPct > 0 && (
          <div
            style={{ width: `${correctPct}%` }}
            className="bg-emerald-600 transition-all"
            title={`Correct: ${correctCount} (${correctPct.toFixed(1)}%)`}
          />
        )}
        {incorrectPct > 0 && (
          <div
            style={{ width: `${incorrectPct}%` }}
            className="bg-rose-600 transition-all"
            title={`Incorrect: ${incorrectCount} (${incorrectPct.toFixed(1)}%)`}
          />
        )}
        {unansweredPct > 0 && (
          <div
            style={{ width: `${unansweredPct}%` }}
            className="bg-slate-400 transition-all"
            title={`Skipped: ${unansweredCount} (${unansweredPct.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* ── Scoring Rules & Revision Priority Banner ── */}
      <div className="flex items-center justify-between gap-3 text-[7.5pt] text-slate-600 bg-white border border-slate-200 rounded px-2 py-1">
        <div>
          <span className="font-bold text-slate-800">Scoring Formula: </span>
          <span>
            ({correctCount} × 2.0) - ({incorrectCount} × 0.67) ={" "}
            <strong className="text-slate-900">{formatScore(score)} Marks</strong>
          </span>
        </div>
        <div className="text-right">
          <span className="font-bold text-slate-800">Revision Note: </span>
          <span className="text-slate-700">{revisionInsight}</span>
        </div>
      </div>
    </div>
  );
}
