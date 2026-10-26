"use client";

import React from "react";

interface PdfHeaderProps {
  testSetName: string;
  subjectName?: string;
  topicName?: string;
  examReference?: string;
  submittedAt?: number;
  filterLabel?: string;
}

export function PdfHeader({
  testSetName,
  subjectName,
  topicName,
  examReference,
  submittedAt,
  filterLabel,
}: PdfHeaderProps) {
  const formattedDate = submittedAt
    ? new Date(submittedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

  const subjectTopicLine = [subjectName, topicName, examReference].filter(Boolean).join(" · ");

  return (
    <div className="pdf-header border-b border-slate-200 pb-1.5 mb-2 text-slate-900 bg-white">
      {/* ── Top Branding & Performance Report Ribbon ── */}
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          {/* Logo Badge */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-600 text-white font-black text-[7.5pt] tracking-tight">
            Q
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[9.5pt] font-black tracking-tight text-slate-900">
              QUIZZER
            </span>
            <span className="text-[8pt] font-light text-slate-300">/</span>
            <span className="text-[7.5pt] font-bold text-slate-700 tracking-wide uppercase">
              EXAM REVISION
            </span>
          </div>
        </div>

        <div className="text-right flex items-center gap-2 leading-tight">
          <span className="text-[6.5pt] font-bold text-slate-600 uppercase tracking-wider">
            PERFORMANCE REPORT
          </span>
          <span className="text-[6.5pt] text-slate-400">·</span>
          <span className="text-[6.5pt] text-slate-500">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* ── Prominent Exam Title & Metadata Row + Filter Pill ── */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-[12pt] font-extrabold text-slate-900 leading-tight tracking-tight">
            {testSetName}
          </h1>
          {subjectTopicLine && (
            <p className="text-[7.2pt] font-medium text-slate-600 mt-0.5 leading-normal">
              {subjectTopicLine}
            </p>
          )}
        </div>

        {filterLabel && (
          <div className="shrink-0 pt-0.5">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[6.5pt] font-extrabold text-blue-700 uppercase tracking-wider">
              {filterLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
