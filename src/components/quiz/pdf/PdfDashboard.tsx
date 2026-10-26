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
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
}: PdfDashboardProps) {
  const safeScore = score ?? 0;
  const safeTotal = Math.max(1, totalQuestions || 0);
  const safeCorrect = correctCount ?? 0;
  const safeIncorrect = incorrectCount ?? 0;
  const safeUnanswered = unansweredCount ?? 0;

  const maxScore = safeTotal * 2;
  const accuracy = Math.round((safeCorrect / safeTotal) * 100);
  const percentage = maxScore > 0 ? ((safeScore / maxScore) * 100).toFixed(1) : "0";

  const correctPoints = safeCorrect * 2;
  const incorrectPoints = ((safeIncorrect * 2) / 3).toFixed(2);

  return (
    <div className="pdf-dashboard mb-3 text-slate-900 bg-white">
      {/* ── 4 Distinct KPI Dashboard Cards ── */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Total Score Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
          <span className="text-[6.5pt] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            TOTAL SCORE
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span className="text-[13pt] font-black text-slate-900 tracking-tight">
              {formatScore(safeScore)}
            </span>
            <span className="text-[8pt] font-bold text-slate-400">
              / {maxScore}
            </span>
          </div>
          <span className="text-[6.8pt] font-semibold text-slate-400 block mt-1 leading-none">
            {percentage}% marks
          </span>
        </div>

        {/* Correct Answers Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
          <span className="text-[6.5pt] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            CORRECT
          </span>
          <div className="leading-none">
            <span className="text-[13pt] font-black text-emerald-600 tracking-tight">
              {safeCorrect}
            </span>
          </div>
          <span className="text-[6.8pt] font-bold text-emerald-600 block mt-1 leading-none">
            +{correctPoints} points
          </span>
        </div>

        {/* Incorrect Answers Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
          <span className="text-[6.5pt] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            INCORRECT
          </span>
          <div className="leading-none">
            <span className="text-[13pt] font-black text-rose-600 tracking-tight">
              {safeIncorrect}
            </span>
          </div>
          <span className="text-[6.8pt] font-bold text-rose-600 block mt-1 leading-none">
            −{incorrectPoints} points
          </span>
        </div>

        {/* Accuracy Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
          <span className="text-[6.5pt] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            ACCURACY
          </span>
          <div className="leading-none">
            <span className="text-[13pt] font-black text-blue-600 tracking-tight">
              {accuracy}%
            </span>
          </div>
          <span className="text-[6.8pt] font-semibold text-slate-400 block mt-1 leading-none">
            {safeCorrect} of {safeTotal} questions
          </span>
        </div>
      </div>

      {/* ── Blue Progress/Accent Bar Underneath KPIs ── */}
      <div className="w-full h-1 bg-slate-100 rounded-full mt-2.5 mb-1 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all"
          style={{ width: `${Math.min(100, Math.max(15, accuracy))}%` }}
        />
      </div>
    </div>
  );
}
