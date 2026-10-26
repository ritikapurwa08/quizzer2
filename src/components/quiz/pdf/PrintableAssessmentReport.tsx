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
            {/* ── Page Header Area ── */}
            <div className="pdf-page-header shrink-0">
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

                  {/* Compact Performance KPI Dashboard */}
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
                  <div className="flex items-center justify-between pb-1 my-1.5 border-b border-slate-200">
                    <span className="text-[9pt] font-black text-slate-900 tracking-tight">
                      {filterLabel?.toLowerCase().includes("incorrect") ||
                      filterLabel?.toLowerCase().includes("mistake")
                        ? "Questions to revise"
                        : "Question Review"}
                    </span>
                    <span className="text-[7pt] font-semibold text-slate-400">
                      Page 1 · 4 questions per page
                    </span>
                  </div>
                </>
              ) : (
                /* ── Pages 2+: Modern Sleek Running Header Bar ── */
                <div className="pdf-running-header rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 flex items-center justify-between text-slate-800 shadow-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-blue-600 text-white font-black text-[7.5pt]">
                      Q
                    </span>
                    <span className="text-[8.5pt] font-black tracking-tight text-slate-900">
                      QUIZZER
                    </span>
                    <span className="text-[7.5pt] text-slate-300">/</span>
                    <span className="text-[7.5pt] font-bold text-slate-700 uppercase tracking-tight max-w-[280px] truncate">
                      {testSetName}
                    </span>
                    {subjectName && (
                      <span className="text-[6.8pt] text-slate-500 font-medium">
                        · {subjectName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {filterLabel && (
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.2 text-[6pt] font-extrabold uppercase text-blue-700 tracking-wider">
                        {filterLabel}
                      </span>
                    )}
                    <span className="text-[7pt] font-extrabold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Page {pageNum} of {totalPages}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Page Main: 2-Column × 2-Row Grid that completely FILLS all available vertical space! ── */}
            <div className="pdf-page-main flex-1 min-h-0 flex flex-col justify-between my-1">
              <div className="pdf-question-grid grid grid-cols-2 grid-rows-2 gap-3.5 h-full">
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
            <div className="pdf-page-footer shrink-0 mt-1.5">
              {isLastPage && (score !== undefined || correctCount !== undefined) ? (
                <PdfEndSummary
                  score={score}
                  totalQuestions={totalQuestions}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                  unansweredCount={unansweredCount}
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1 text-[6.5pt] text-slate-600 flex items-center justify-between shadow-xs">
                  <span>
                    <strong>Exam revision note:</strong> प्रत्येक प्रश्न का सही उत्तर एवं मुख्य बिंदु (Key Concept) ध्यानपूर्वक पढ़ें और परीक्षा पूर्व आवश्यक दोहराव करें।
                  </span>
                  <span className="font-extrabold text-slate-600 shrink-0 ml-2 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
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
