"use client";

import React from "react";
import { formatScore } from "@/lib/utils";
import { CheckCircle2, XCircle, Minus, Award, Percent } from "lucide-react";

interface PrintableReportHeaderProps {
  testSetName: string;
  subjectName?: string;
  topicName?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  submittedAt?: number;
  filterLabel?: string;
}

export function PrintableReportHeader({
  testSetName,
  subjectName,
  topicName,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
  submittedAt,
  filterLabel,
}: PrintableReportHeaderProps) {
  const maxScore = totalQuestions * 2;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const percentage =
    maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  return (
    <div className="hidden print:block mb-6 border-b-2 border-neutral-800 pb-4">
      {/* ── Top Bar: Logo & Institution Header ── */}
      <div className="flex items-center justify-between border-b border-neutral-300 pb-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold text-sm">
            Q
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 leading-tight">
              QUIZZER
            </h1>
            <p className="text-[10px] text-neutral-600 font-medium">
              RPSC 2nd Grade & Rajasthan Competitive Exam Revision Portal
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block rounded-md bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-[10px] font-semibold text-neutral-800">
            Official Performance Report & Key
          </span>
          <p className="text-[9px] text-neutral-500 mt-0.5">Attempted: {formattedDate}</p>
        </div>
      </div>

      {/* ── Test Title & Subject Details ── */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 leading-snug">
            {testSetName}
          </h2>
          <p className="text-xs font-semibold text-neutral-700 mt-0.5">
            {subjectName || "Subject"} {topicName ? `• ${topicName}` : ""}
          </p>
        </div>

        {filterLabel && (
          <div className="shrink-0 text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded">
              View: {filterLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Compact Printable Scorecard Ribbon ── */}
      <div className="grid grid-cols-5 gap-2 rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 text-center">
        {/* Score */}
        <div className="border-r border-neutral-300 pr-2">
          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
            Total Score
          </p>
          <p className="text-sm font-bold text-neutral-900 mt-0.5">
            {formatScore(score)} <span className="text-[10px] text-neutral-500 font-semibold">/ {maxScore}</span>
          </p>
          <span className="text-[9px] font-semibold text-neutral-600">({percentage}%)</span>
        </div>

        {/* Correct */}
        <div className="border-r border-neutral-300 pr-2">
          <p className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
            Correct (+2)
          </p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">
            {correctCount}
          </p>
          <span className="text-[9px] text-emerald-600">+{correctCount * 2} pts</span>
        </div>

        {/* Incorrect */}
        <div className="border-r border-neutral-300 pr-2">
          <p className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">
            Incorrect (-1/3)
          </p>
          <p className="text-sm font-bold text-rose-700 mt-0.5">
            {incorrectCount}
          </p>
          <span className="text-[9px] text-rose-600">
            -{((incorrectCount * 2) / 3).toFixed(2)} pts
          </span>
        </div>

        {/* Skipped */}
        <div className="border-r border-neutral-300 pr-2">
          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
            Skipped
          </p>
          <p className="text-sm font-bold text-neutral-700 mt-0.5">
            {unansweredCount}
          </p>
          <span className="text-[9px] text-neutral-500">0 pts</span>
        </div>

        {/* Accuracy */}
        <div>
          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
            Accuracy
          </p>
          <p className="text-sm font-bold text-neutral-900 mt-0.5">
            {accuracy}%
          </p>
          <span className="text-[9px] text-neutral-500">{correctCount}/{totalQuestions} Qs</span>
        </div>
      </div>

      {/* ── Scoring Rule Reference ── */}
      <div className="flex items-center justify-between text-[9px] text-neutral-500 mt-2 px-1">
        <span>Standard RPSC Scoring: +2 per correct answer · 1/3 negative marking (-0.66 per incorrect)</span>
        <span>Generated for self-study and revision</span>
      </div>
    </div>
  );
}
