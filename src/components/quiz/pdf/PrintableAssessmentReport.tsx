"use client";

import React, { useMemo } from "react";
import { PdfHeader } from "./PdfHeader";
import { PdfDashboard } from "./PdfDashboard";
import { PdfQuestionCard } from "./PdfQuestionCard";
import { PdfEndSummary } from "./PdfEndSummary";
import { cn } from "@/lib/utils";

export interface EvaluatedQuestionItem {
  question: {
    _id?: string;
    id?: string;
    type: string;
    questionText: string;
    options: { id: string; text: string }[];
    correctAnswer: string | string[];
    explanation?: string;
    reference?: string | null;
    meta?: any;
  };
  answer?: {
    selected?: string | string[];
    isCorrect?: boolean;
  };
  status: "correct" | "incorrect" | "unanswered";
  originalIndex: number;
}

export interface PrintableAssessmentReportProps {
  testSetName: string;
  subjectName?: string;
  topicName?: string;
  examReference?: string;
  score?: number;
  totalQuestions: number;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  submittedAt?: number;
  filterLabel?: string;
  questions: EvaluatedQuestionItem[];
  className?: string;
}

const QUESTIONS_PER_PAGE = 4;

export function PrintableAssessmentReport({
  testSetName,
  subjectName,
  topicName,
  examReference,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
  unansweredCount,
  submittedAt,
  filterLabel,
  questions,
  className,
}: PrintableAssessmentReportProps) {
  // ── Mandatory Dynamic Pagination: exactly 4 questions per full page ──
  const pages = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const chunks: EvaluatedQuestionItem[][] = [];
    for (let i = 0; i < questions.length; i += QUESTIONS_PER_PAGE) {
      chunks.push(questions.slice(i, i + QUESTIONS_PER_PAGE));
    }
    return chunks;
  }, [questions]);

  const totalPages = Math.max(1, pages.length);

  // If no questions are available
  if (pages.length === 0) {
    return (
      <div
        id="printable-assessment-report"
        className={cn(
          "pdf-document-root hidden print:block w-full text-slate-900 bg-white",
          className
        )}
      >
        <section className="pdf-page bg-white text-slate-900 p-4">
          <PdfHeader
            testSetName={testSetName}
            subjectName={subjectName}
            topicName={topicName}
            examReference={examReference}
            submittedAt={submittedAt}
            filterLabel={filterLabel}
          />
          <div className="py-12 text-center text-slate-500 text-sm">
            No questions available for the selected review mode.
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      id="printable-assessment-report"
      className={cn(
        "pdf-document-root hidden print:block w-full text-slate-900 bg-white",
        className
      )}
    >
      {pages.map((pageQuestions, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;
        const pageNum = pageIndex + 1;

        return (
          <section
            key={`pdf-page-${pageIndex}`}
            className="pdf-page bg-white text-slate-900 flex flex-col justify-between"
          >
            <div>
              {/* ── Page 1: Full Executive Header & KPI Ribbon ── */}
              {isFirstPage ? (
                <>
                  <PdfHeader
                    testSetName={testSetName}
                    subjectName={subjectName}
                    topicName={topicName}
                    examReference={examReference}
                    submittedAt={submittedAt}
                    filterLabel={filterLabel}
                  />

                  {/* Compact Performance KPI Ribbon (shown when attempt data exists) */}
                  {(score !== undefined || correctCount !== undefined) && (
                    <PdfDashboard
                      score={score}
                      totalQuestions={totalQuestions}
                      correctCount={correctCount}
                      incorrectCount={incorrectCount}
                      unansweredCount={unansweredCount}
                    />
                  )}

                  {/* Section Label: Questions to Revise / Question Review */}
                  <div className="flex items-center justify-between pb-0.5 mb-1.5 border-b border-slate-200">
                    <span className="text-[7.8pt] font-extrabold text-slate-900 uppercase tracking-wide">
                      {filterLabel?.toLowerCase().includes("incorrect") ||
                      filterLabel?.toLowerCase().includes("mistake")
                        ? "Questions to Revise"
                        : "Question Review"}
                    </span>
                    <span className="text-[6.8pt] font-medium text-slate-500">
                      Page 1 of {totalPages}
                    </span>
                  </div>
                </>
              ) : (
                /* ── Pages 2+: Minimal Running Header with Branding & Page Counter ── */
                <div className="pdf-running-header flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 text-slate-900">
                  <div className="flex items-center gap-1.5 leading-none">
                    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-blue-600 text-white font-black text-[7pt]">
                      Q
                    </div>
                    <span className="text-[8pt] font-black tracking-tight text-slate-900">
                      QUIZZER
                    </span>
                    <span className="text-[7.5pt] text-slate-300">/</span>
                    <span className="text-[7pt] font-bold text-slate-700 uppercase max-w-[280px] truncate">
                      {testSetName}
                    </span>
                    {subjectName && (
                      <span className="text-[6.5pt] text-slate-500 font-medium">
                        · {subjectName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[6.8pt] text-slate-600 font-medium">
                    {filterLabel && (
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-1.5 py-0.2 text-[6pt] font-extrabold uppercase text-blue-700 tracking-wider">
                        {filterLabel}
                      </span>
                    )}
                    <span className="font-bold text-slate-700">
                      Page {pageNum} of {totalPages}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Exactly Four Per Full Page: 2-Column × 2-Row Grid ── */}
              <div className="pdf-question-grid grid grid-cols-2 gap-x-3 gap-y-2">
                {pageQuestions.map((item) => (
                  <PdfQuestionCard
                    key={item.question._id || item.question.id || item.originalIndex}
                    number={item.originalIndex + 1}
                    question={item.question}
                    selectedAnswer={item.answer?.selected}
                    status={item.status}
                  />
                ))}
              </div>
            </div>

            {/* ── Page Footer: Certification on Last Page, Revision Tip on Intermediate Pages ── */}
            <div className="pdf-page-footer mt-auto pt-1">
              {isLastPage && (score !== undefined || correctCount !== undefined) ? (
                <PdfEndSummary
                  score={score}
                  totalQuestions={totalQuestions}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                  unansweredCount={unansweredCount}
                />
              ) : (
                <div className="rounded border border-slate-200 bg-slate-50/80 px-2 py-0.8 text-[6.5pt] text-slate-600 flex items-center justify-between">
                  <span>
                    <strong>Exam revision note:</strong> प्रत्येक प्रश्न का सही उत्तर एवं मुख्य बिंदु (Key Concept) ध्यानपूर्वक पढ़ें और परीक्षा पूर्व आवश्यक दोहराव करें।
                  </span>
                  <span className="font-semibold text-slate-500 shrink-0 ml-2">
                    Page {pageNum} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
