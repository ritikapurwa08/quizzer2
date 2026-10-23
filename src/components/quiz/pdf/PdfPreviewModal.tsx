"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye, X } from "lucide-react";
import { PdfHeader } from "./PdfHeader";
import { PdfDashboard } from "./PdfDashboard";
import { PdfQuestionCard } from "./PdfQuestionCard";
import { PdfEndSummary } from "./PdfEndSummary";
import { EvaluatedQuestionItem } from "./PrintableAssessmentReport";

interface PdfPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}

export function PdfPreviewModal({
  open,
  onOpenChange,
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
}: PdfPreviewModalProps) {
  function handlePrintNow() {
    onOpenChange(false);
    setTimeout(() => {
      window.print();
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 flex flex-col bg-neutral-900 border-neutral-700 text-neutral-100 overflow-hidden shadow-2xl rounded-2xl">
        {/* ── Modal Control Bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                PDF Assessment Report Preview
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                  A4 Portrait • Two Columns
                </span>
              </DialogTitle>
              <DialogDescription className="text-[11px] text-neutral-400">
                Official typeset evaluation sheet ready to download or print
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrintNow}
              className="h-8.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg gap-1.5 cursor-pointer shadow-sm px-3.5"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8.5 w-8.5 p-0 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer"
              title="Close Preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Virtual A4 Sheet Scroll Container ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-950/50 flex justify-center">
          <div className="w-full max-w-[850px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-8 border border-neutral-300">
            {/* Header */}
            <PdfHeader
              testSetName={testSetName}
              subjectName={subjectName}
              topicName={topicName}
              examReference={examReference}
              submittedAt={submittedAt}
              filterLabel={filterLabel}
            />

            {/* Dashboard */}
            <PdfDashboard
              score={score}
              totalQuestions={totalQuestions}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
            />

            {/* Two Column Grid */}
            <div className="columns-1 md:columns-2 gap-4 mt-3">
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

            {/* End Summary */}
            <PdfEndSummary
              score={score}
              totalQuestions={totalQuestions}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
