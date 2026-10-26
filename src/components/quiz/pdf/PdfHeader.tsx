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
  let formattedDate = "";
  try {
    const d = submittedAt && !isNaN(Number(submittedAt)) ? new Date(Number(submittedAt)) : new Date();
    formattedDate = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    formattedDate = new Date().toLocaleDateString("en-IN");
  }

  const subjectTopicLine = [subjectName, topicName].filter(Boolean).join(" · ");
  const examLine = examReference || "RPSC Senior Teacher (2nd Grade)";

  return (
    <div className="pdf-header text-slate-900 bg-white mb-2">
      {/* ── Top Branding & Performance Report Ribbon ── */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          {/* Logo Badge */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-[12pt] shadow-xs">
            Q
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-[11.5pt] font-black tracking-tight text-slate-900 leading-none">
                QUIZZER
              </span>
              <span className="text-[9pt] font-light text-slate-300 leading-none">/</span>
              <span className="text-[8.5pt] font-extrabold text-slate-600 tracking-wide uppercase leading-none">
                EXAM REVISION
              </span>
            </div>
            <p className="text-[6.8pt] font-medium text-slate-400 mt-0.5 leading-none">
              Rajasthan Exam Study & Practice Portal
            </p>
          </div>
        </div>

        <div className="text-right leading-tight">
          <span className="text-[7.8pt] font-black text-slate-700 uppercase tracking-wider block">
            PERFORMANCE REPORT
          </span>
          <span className="text-[6.8pt] font-medium text-slate-400 mt-0.5 block">
            Generated: {formattedDate}
          </span>
          {subjectTopicLine && (
            <span className="text-[6.8pt] font-medium text-slate-400 mt-0.5 block max-w-[260px] truncate">
              {subjectTopicLine}
            </span>
          )}
        </div>
      </div>

      {/* ── Full Width Accent Divider Line with vibrant blue anchor ── */}
      <div className="w-full h-[1.5px] bg-slate-200 mt-1.5 mb-2 relative">
        <div className="absolute left-0 top-[-0.5px] h-[2.5px] w-28 bg-blue-600 rounded-full" />
      </div>

      {/* ── Prominent Title & Filter Pill Row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[13.5pt] font-black text-slate-900 leading-tight tracking-tight">
            {testSetName}
          </h1>
          <p className="text-[7.5pt] font-medium text-slate-500 mt-0.5 leading-normal">
            {filterLabel?.toLowerCase().includes("mistake") || filterLabel?.toLowerCase().includes("incorrect")
              ? `Mistake Revision Sheet · ${examLine}`
              : `Comprehensive Revision Assessment · ${examLine}`}
          </p>
        </div>

        {filterLabel && (
          <div className="shrink-0 pt-0.5">
            <span className="inline-block rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1 text-[6.8pt] font-extrabold text-blue-700 uppercase tracking-wider shadow-xs">
              {filterLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
