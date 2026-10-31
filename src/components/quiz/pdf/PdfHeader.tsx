"use client";

import React from "react";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";

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
    <header className="pdf-header mb-3" style={{ color: "var(--pdf-text)" }}>
      {/* ── Top Branding & Performance Report Ribbon ── */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-2.5">
          {/* Logo Badge */}
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl p-0.5 border"
            style={{
              background: "var(--pdf-surface)",
              borderColor: "var(--pdf-border)",
            }}
          >
            <QuizzerLogoIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11.5pt] font-black tracking-tight leading-none"
                style={{ color: "var(--pdf-text)" }}
              >
                QUIZZER
              </span>
              <span className="text-[9pt] leading-none" style={{ color: "var(--pdf-muted)" }}>
                ·
              </span>
              <span
                className="text-[8.5pt] font-extrabold tracking-wide uppercase leading-none"
                style={{ color: "var(--pdf-muted)" }}
              >
                EXAM REVISION
              </span>
            </div>
            <p
              className="text-[7pt] font-medium mt-0.5 leading-none"
              style={{ color: "var(--pdf-muted)" }}
            >
              Rajasthan Exam Study &amp; Practice Portal
            </p>
          </div>
        </div>

        <div className="text-right leading-tight">
          <span
            className="text-[7.8pt] font-black uppercase tracking-wider block"
            style={{ color: "var(--pdf-text)" }}
          >
            PERFORMANCE REPORT
          </span>
          <span
            className="text-[6.8pt] font-medium mt-0.5 block"
            style={{ color: "var(--pdf-muted)" }}
          >
            Generated: {formattedDate}
          </span>
          {subjectTopicLine && (
            <span
              className="text-[6.8pt] font-medium mt-0.5 block max-w-[280px] truncate"
              style={{ color: "var(--pdf-muted)" }}
            >
              {subjectTopicLine}
            </span>
          )}
        </div>
      </div>

      {/* ── Full Width Accent Divider Line ── */}
      <div
        className="w-full h-[1.5px] mt-1.5 mb-2 relative"
        style={{ background: "var(--pdf-border)" }}
      >
        <div
          className="absolute left-0 top-[-0.5px] h-[2.5px] w-24 rounded-full"
          style={{ background: "var(--pdf-accent)" }}
        />
      </div>

      {/* ── Prominent Title & Filter Pill Row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className="text-[14pt] font-black leading-tight tracking-tight font-hindi"
            style={{ color: "var(--pdf-text)" }}
          >
            {testSetName}
          </h1>
          <p
            className="text-[7.8pt] font-medium mt-0.5 leading-normal"
            style={{ color: "var(--pdf-muted)" }}
          >
            {filterLabel?.toLowerCase().includes("mistake") || filterLabel?.toLowerCase().includes("incorrect")
              ? `Mistake Revision Sheet · ${examLine}`
              : `Comprehensive Revision Assessment · ${examLine}`}
          </p>
        </div>

        {filterLabel && (
          <div className="shrink-0 pt-0.5">
            <span
              className="inline-block rounded-full border px-3 py-1 text-[7pt] font-extrabold uppercase tracking-wider"
              style={{
                background: "var(--pdf-surface-2)",
                borderColor: "var(--pdf-border)",
                color: "var(--pdf-text)",
              }}
            >
              {filterLabel}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
