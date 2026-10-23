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

  return (
    <div className="border-b-2 border-slate-900 pb-2.5 mb-3 text-slate-900">
      {/* ── Top Official Institution Ribbon ── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-sm tracking-tight shadow-xs">
            Q
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13pt] font-black tracking-tight text-slate-900 leading-none">
                QUIZZER
              </span>
              <span className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-wider">
                • Examination Revision Engine
              </span>
            </div>
            <p className="text-[7.5pt] text-slate-600 font-medium">
              Rajasthan Exam Study & Practice Portal • RPSC 2nd Grade / REET / Patwar
            </p>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
          <span className="inline-block rounded border border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[7.5pt] font-bold text-blue-900 uppercase tracking-wide">
            Official Performance Report & Evaluation Key
          </span>
          <span className="text-[7pt] text-slate-500 font-medium mt-0.5">
            Attempted: {formattedDate}
          </span>
        </div>
      </div>

      {/* ── Test Title & Subject Details ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[12pt] font-extrabold text-slate-900 leading-snug">
            {testSetName}
          </h1>
          <p className="text-[8.5pt] font-semibold text-slate-700 mt-0.5">
            {subjectName || "Subject"} {topicName ? `• ${topicName}` : ""}
            {examReference ? ` • ${examReference}` : " • Target: RPSC Senior Teacher (2nd Grade)"}
          </p>
        </div>

        {filterLabel && (
          <div className="shrink-0 text-right">
            <span className="text-[7.5pt] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              {filterLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
