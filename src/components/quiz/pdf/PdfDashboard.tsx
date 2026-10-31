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
    <div className="pdf-dashboard mb-3" style={{ color: "var(--pdf-text)" }}>
      {/* ── 4 Distinct KPI Dashboard Cards ── */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Total Score Card */}
        <div
          className="rounded-xl border p-2.5"
          style={{
            background: "var(--pdf-surface)",
            borderColor: "var(--pdf-border)",
          }}
        >
          <span
            className="text-[6.5pt] font-bold uppercase tracking-wider block mb-1"
            style={{ color: "var(--pdf-muted)" }}
          >
            TOTAL SCORE
          </span>
          <div className="flex items-baseline gap-1 leading-none">
            <span
              className="text-[13pt] font-black tracking-tight"
              style={{ color: "var(--pdf-text)" }}
            >
              {formatScore(safeScore)}
            </span>
            <span className="text-[8pt] font-bold" style={{ color: "var(--pdf-muted)" }}>
              / {maxScore}
            </span>
          </div>
          <span
            className="text-[6.8pt] font-semibold block mt-1 leading-none"
            style={{ color: "var(--pdf-muted)" }}
          >
            {percentage}% marks
          </span>
        </div>

        {/* Correct Answers Card */}
        <div
          className="rounded-xl border p-2.5"
          style={{
            background: "var(--pdf-surface)",
            borderColor: "var(--pdf-border)",
          }}
        >
          <span
            className="text-[6.5pt] font-bold uppercase tracking-wider block mb-1"
            style={{ color: "var(--pdf-muted)" }}
          >
            CORRECT
          </span>
          <div className="leading-none">
            <span
              className="text-[13pt] font-black tracking-tight"
              style={{ color: "var(--pdf-ok)" }}
            >
              {safeCorrect}
            </span>
          </div>
          <span
            className="text-[6.8pt] font-bold block mt-1 leading-none"
            style={{ color: "var(--pdf-ok)" }}
          >
            +{correctPoints} points
          </span>
        </div>

        {/* Incorrect Answers Card */}
        <div
          className="rounded-xl border p-2.5"
          style={{
            background: "var(--pdf-surface)",
            borderColor: "var(--pdf-border)",
          }}
        >
          <span
            className="text-[6.5pt] font-bold uppercase tracking-wider block mb-1"
            style={{ color: "var(--pdf-muted)" }}
          >
            INCORRECT
          </span>
          <div className="leading-none">
            <span
              className="text-[13pt] font-black tracking-tight"
              style={{ color: "var(--pdf-bad)" }}
            >
              {safeIncorrect}
            </span>
          </div>
          <span
            className="text-[6.8pt] font-bold block mt-1 leading-none"
            style={{ color: "var(--pdf-bad)" }}
          >
            −{incorrectPoints} points
          </span>
        </div>

        {/* Accuracy Card */}
        <div
          className="rounded-xl border p-2.5"
          style={{
            background: "var(--pdf-surface)",
            borderColor: "var(--pdf-border)",
          }}
        >
          <span
            className="text-[6.5pt] font-bold uppercase tracking-wider block mb-1"
            style={{ color: "var(--pdf-muted)" }}
          >
            ACCURACY
          </span>
          <div className="leading-none">
            <span
              className="text-[13pt] font-black tracking-tight"
              style={{ color: "var(--pdf-text)" }}
            >
              {accuracy}%
            </span>
          </div>
          <span
            className="text-[6.8pt] font-semibold block mt-1 leading-none"
            style={{ color: "var(--pdf-muted)" }}
          >
            {safeCorrect} of {safeTotal} questions
          </span>
        </div>
      </div>

      {/* ── Progress Bar Underneath KPIs ── */}
      <div
        className="w-full h-1 rounded-full mt-2.5 mb-1 overflow-hidden"
        style={{ background: "var(--pdf-surface-2)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            background: "var(--pdf-accent)",
            width: `${Math.min(100, Math.max(10, accuracy))}%`,
          }}
        />
      </div>
    </div>
  );
}
