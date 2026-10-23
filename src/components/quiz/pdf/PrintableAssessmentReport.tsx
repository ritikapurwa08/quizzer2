"use client";

import React from "react";
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

interface PrintableAssessmentReportProps {
  testSetName: string;
  subjectName?: string;
  topicName?: string;
  examReference?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  submittedAt?: number;
  filterLabel?: string;
  questions: EvaluatedQuestionItem[];
  className?: string;
}

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
  return (
    <div
      id="printable-assessment-report"
      className={cn(
        "pdf-document-root hidden print:block w-full text-slate-900 bg-white",
        className
      )}
    >
      {/* ── Executive Cover & Header ── */}
      <PdfHeader
        testSetName={testSetName}
        subjectName={subjectName}
        topicName={topicName}
        examReference={examReference}
        submittedAt={submittedAt}
        filterLabel={filterLabel}
      />

      {/* ── Executive Performance Dashboard ── */}
      <PdfDashboard
        score={score}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        unansweredCount={unansweredCount}
      />

      {/* ── Two-Column Question Review Grid ── */}
      <div className="pdf-two-column-layout">
        {questions.map((item) => (
          <PdfQuestionCard
            key={item.question._id || item.question.id || item.originalIndex}
            number={item.originalIndex + 1}
            question={item.question}
            selectedAnswer={item.answer?.selected}
            status={item.status}
          />
        ))}
      </div>

      {/* ── End of Report Certification Summary ── */}
      <PdfEndSummary
        score={score}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        unansweredCount={unansweredCount}
      />
    </div>
  );
}
