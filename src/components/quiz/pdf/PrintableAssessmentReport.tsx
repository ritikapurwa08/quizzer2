"use client";

import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { PdfHeader } from "./PdfHeader";
import { PdfDashboard } from "./PdfDashboard";
import { PdfQuestionCard } from "./PdfQuestionCard";
import { PdfEndSummary } from "./PdfEndSummary";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";
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
  theme?: "dark" | "light";
  className?: string;
}

interface PdfRow {
  isFullWidth: boolean;
  items: EvaluatedQuestionItem[];
  isCompact?: boolean;
}

interface PdfPagePlan {
  rows: PdfRow[];
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
  theme = "dark",
  className,
}: PrintableAssessmentReportProps) {
  // Offscreen measurement refs
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const measureRulerRef = useRef<HTMLDivElement>(null);
  const measureHeader1Ref = useRef<HTMLDivElement>(null);
  const measureRunningHeaderRef = useRef<HTMLDivElement>(null);
  const measureFooterRef = useRef<HTMLDivElement>(null);
  const measureSummaryRef = useRef<HTMLDivElement>(null);
  const cardColRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardFullRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Planned pages after dynamic measurement
  const [plannedPages, setPlannedPages] = useState<PdfPagePlan[] | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Measure card heights and compute optimal dynamic pagination
  const calculatePagination = () => {
    try {
      if (!isMountedRef.current) return;
      if (!questions || questions.length === 0) {
        setPlannedPages([]);
        return;
      }

      const rulerEl = measureRulerRef.current;
      const header1El = measureHeader1Ref.current;
      const runningHeaderEl = measureRunningHeaderRef.current;
      const footerEl = measureFooterRef.current;
      const summaryEl = measureSummaryRef.current;

      if (!rulerEl || !header1El || !runningHeaderEl || !footerEl || !summaryEl) {
        return;
      }

      const pageHeightPx = rulerEl.offsetHeight || 1118;
      // 20mm total padding (10mm top + 10mm bottom)
      const paddingPx = (20 / 296) * pageHeightPx;
      const gapPx = (3.5 / 296) * pageHeightPx;

      const hHeader1 = header1El.offsetHeight || 220;
      const hRunningHeader = runningHeaderEl.offsetHeight || 38;
      const hFooter = footerEl.offsetHeight || 28;
      const hSummary = summaryEl.offsetHeight || 90;

      // Safety margin of 12px for sub-pixel anti-aliasing in print engines
      const safetyMargin = 12;

      const body1Height = Math.max(200, pageHeightPx - paddingPx - hHeader1 - hFooter - safetyMargin);
      const bodyNHeight = Math.max(200, pageHeightPx - paddingPx - hRunningHeader - hFooter - safetyMargin);

      const pages: PdfPagePlan[] = [];
      let currentRows: PdfRow[] = [];
      let currentRemaining = body1Height;
      let i = 0;

      while (i < questions.length) {
        const isPage1 = pages.length === 0;
        const maxPageBody = isPage1 ? body1Height : bodyNHeight;

        const q1 = questions[i];
        const colEl1 = cardColRefs.current[i];
        const fullEl1 = cardFullRefs.current[i];
        const hCol1 = colEl1?.offsetHeight || 240;
        const hFull1 = fullEl1?.offsetHeight || 200;

        // Card is taller than ~46% of page body -> promote to full width
        const isTall = hCol1 > maxPageBody * 0.46;

        if (isTall) {
          const isTooTallEvenForPage = hFull1 > maxPageBody;
          const isCompact = isTooTallEvenForPage;
          const effectiveRowHeight = isCompact ? hFull1 * 0.88 : hFull1;

          if (currentRows.length > 0 && currentRemaining < effectiveRowHeight + gapPx) {
            pages.push({ rows: currentRows });
            currentRows = [];
            currentRemaining = bodyNHeight;
          }

          currentRows.push({
            isFullWidth: true,
            items: [q1],
            isCompact,
          });
          currentRemaining -= effectiveRowHeight + gapPx;
          i += 1;
        } else {
          // Standard 2-column packing
          const q2 = i + 1 < questions.length ? questions[i + 1] : null;
          const colEl2 = q2 ? cardColRefs.current[i + 1] : null;
          const hCol2 = colEl2?.offsetHeight || 240;
          const q2IsTall = q2 ? hCol2 > maxPageBody * 0.46 : false;

          if (q2 && !q2IsTall) {
            const rowHeight = Math.max(hCol1, hCol2);
            if (currentRows.length > 0 && currentRemaining < rowHeight + gapPx) {
              pages.push({ rows: currentRows });
              currentRows = [];
              currentRemaining = bodyNHeight;
            }
            currentRows.push({
              isFullWidth: false,
              items: [q1, q2],
            });
            currentRemaining -= rowHeight + gapPx;
            i += 2;
          } else {
            // Single card in row
            const rowHeight = hCol1;
            if (currentRows.length > 0 && currentRemaining < rowHeight + gapPx) {
              pages.push({ rows: currentRows });
              currentRows = [];
              currentRemaining = bodyNHeight;
            }
            currentRows.push({
              isFullWidth: false,
              items: [q1],
            });
            currentRemaining -= rowHeight + gapPx;
            i += 1;
          }
        }
      }

      if (currentRows.length > 0) {
        pages.push({ rows: currentRows });
      }

      // Check if EndSummary fits on the last page
      if (pages.length > 0) {
        const lastPage = pages[pages.length - 1];
        if (currentRemaining < hSummary + 8) {
          if (lastPage.rows.length > 1) {
            const poppedRow = lastPage.rows.pop()!;
            pages.push({ rows: [poppedRow] });
          } else {
            pages.push({ rows: [] });
          }
        }
      }

      if (isMountedRef.current) {
        setPlannedPages(pages);
      }
    } catch (err) {
      console.warn("calculatePagination measurement warning (falling back):", err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {
          if (isMountedRef.current) {
            calculatePagination();
          }
        })
        .catch(() => {
          if (isMountedRef.current) {
            calculatePagination();
          }
        });
    } else {
      calculatePagination();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [questions]);

  // Fallback initial chunking while measurement executes
  const fallbackPages: PdfPagePlan[] = React.useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const res: PdfPagePlan[] = [];
    for (let i = 0; i < questions.length; i += 4) {
      const slice = questions.slice(i, i + 4);
      const rows: PdfRow[] = [];
      for (let j = 0; j < slice.length; j += 2) {
        rows.push({
          isFullWidth: false,
          items: slice.slice(j, j + 2),
        });
      }
      res.push({ rows });
    }
    return res;
  }, [questions]);

  const activePages = plannedPages || fallbackPages;
  const totalPages = Math.max(1, activePages.length);

  // If no questions are available
  if (activePages.length === 0) {
    return (
      <div
        id="printable-assessment-report"
        data-pdf-theme={theme}
        className={cn(
          "pdf-document-root hidden print:block w-full",
          theme === "light" && "pdf-theme-light",
          className
        )}
      >
        <section className="pdf-page p-6">
          <PdfHeader
            testSetName={testSetName}
            subjectName={subjectName}
            topicName={topicName}
            examReference={examReference}
            submittedAt={submittedAt}
            filterLabel={filterLabel}
          />
          <div
            className="py-12 text-center text-sm font-medium"
            style={{ color: "var(--pdf-muted)" }}
          >
            No questions available for the selected review mode.
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* ── Off-screen Measurement Container (Strictly ignored in print) ── */}
      <div
        ref={measureContainerRef}
        aria-hidden="true"
        className={cn("print:hidden pointer-events-none", theme === "light" && "pdf-theme-light")}
        data-pdf-theme={theme}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "190mm", // Exact printable width (210mm - 20mm padding)
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        {/* Ruler to establish real browser pixel scale for 296mm */}
        <div ref={measureRulerRef} style={{ height: "296mm", width: "190mm" }} />

        {/* Page 1 Header element to measure */}
        <div ref={measureHeader1Ref}>
          <PdfHeader
            testSetName={testSetName}
            subjectName={subjectName}
            topicName={topicName}
            examReference={examReference}
            submittedAt={submittedAt}
            filterLabel={filterLabel}
          />
          {(score !== undefined || correctCount !== undefined) && (
            <PdfDashboard
              score={score}
              totalQuestions={totalQuestions}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              unansweredCount={unansweredCount}
            />
          )}
          <div
            className="flex items-center justify-between pb-1 my-1.5 border-b"
            style={{ borderColor: "var(--pdf-border)" }}
          >
            <span
              className="text-[9pt] font-black tracking-tight"
              style={{ color: "var(--pdf-text)" }}
            >
              {filterLabel?.toLowerCase().includes("incorrect") ||
              filterLabel?.toLowerCase().includes("mistake")
                ? "Questions to Revise"
                : "Question Review"}
            </span>
          </div>
        </div>

        {/* Pages 2+ Running Header to measure */}
        <div
          ref={measureRunningHeaderRef}
          className="rounded-xl border px-3 py-1.5 flex items-center justify-between mb-2"
          style={{
            background: "var(--pdf-surface-2)",
            borderColor: "var(--pdf-border)",
            color: "var(--pdf-text)",
          }}
        >
          <div className="flex items-center gap-2">
            <QuizzerLogoIcon className="h-4.5 w-4.5" />
            <span className="text-[8.5pt] font-black tracking-tight">QUIZZER</span>
            <span style={{ color: "var(--pdf-muted)" }}>/</span>
            <span className="text-[7.5pt] font-bold uppercase truncate max-w-[280px]">
              {testSetName}
            </span>
          </div>
        </div>

        {/* Page Footer to measure */}
        <div
          ref={measureFooterRef}
          className="rounded-xl border px-3 py-1 text-[6.8pt] flex items-center justify-between shadow-xs mt-1.5"
          style={{
            background: "var(--pdf-surface-2)",
            borderColor: "var(--pdf-border)",
            color: "var(--pdf-muted)",
          }}
        >
          <span>Quizzer · Exam Revision</span>
          <span>Page 1 of 1</span>
        </div>

        {/* End Summary to measure */}
        <div ref={measureSummaryRef}>
          <PdfEndSummary
            score={score}
            totalQuestions={totalQuestions}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            unansweredCount={unansweredCount}
          />
        </div>

        {/* Measure cards in 2-column width: calc((190mm - 3.5mm) / 2) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "3.5mm" }}>
          {questions.map((q, idx) => (
            <div
              key={`measure-col-${idx}`}
              ref={(el) => {
                cardColRefs.current[idx] = el;
              }}
            >
              <PdfQuestionCard
                number={q.originalIndex + 1}
                question={q.question}
                selectedAnswer={q.answer?.selected}
                status={q.status}
              />
            </div>
          ))}
        </div>

        {/* Measure cards in full-width 190mm width */}
        <div style={{ display: "flex", flexDirection: "column", gap: "3.5mm", width: "100%" }}>
          {questions.map((q, idx) => (
            <div
              key={`measure-full-${idx}`}
              ref={(el) => {
                cardFullRefs.current[idx] = el;
              }}
            >
              <PdfQuestionCard
                number={q.originalIndex + 1}
                question={q.question}
                selectedAnswer={q.answer?.selected}
                status={q.status}
                isFullWidth
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Production Printable Assessment Report (Rendered for Print) ── */}
      <div
        id="printable-assessment-report"
        data-pdf-theme={theme}
        className={cn(
          "pdf-document-root hidden print:block w-full",
          theme === "light" && "pdf-theme-light",
          className
        )}
        style={{
          background: "var(--pdf-bg)",
          color: "var(--pdf-text)",
        }}
      >
        {activePages.map((pagePlan, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === activePages.length - 1;
          const pageNum = pageIndex + 1;

          return (
            <section
              key={`pdf-page-${pageIndex}`}
              className="pdf-page flex flex-col justify-between"
              style={{
                background: "var(--pdf-bg)",
                color: "var(--pdf-text)",
              }}
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

                    {/* Section Label */}
                    <div
                      className="flex items-center justify-between pb-1 my-1.5 border-b"
                      style={{ borderColor: "var(--pdf-border)" }}
                    >
                      <span
                        className="text-[9pt] font-black tracking-tight"
                        style={{ color: "var(--pdf-text)" }}
                      >
                        {filterLabel?.toLowerCase().includes("incorrect") ||
                        filterLabel?.toLowerCase().includes("mistake")
                          ? "Questions to Revise"
                          : "Question Review"}
                      </span>
                      <span
                        className="text-[7pt] font-semibold"
                        style={{ color: "var(--pdf-muted)" }}
                      >
                        Page {pageNum} of {totalPages}
                      </span>
                    </div>
                  </>
                ) : (
                  /* ── Pages 2+: Modern Sleek Running Header Bar ── */
                  <div
                    className="pdf-running-header rounded-xl border px-3 py-1.5 flex items-center justify-between shadow-xs mb-2"
                    style={{
                      background: "var(--pdf-surface-2)",
                      borderColor: "var(--pdf-border)",
                      color: "var(--pdf-text)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-md border p-0.5"
                        style={{
                          background: "var(--pdf-surface)",
                          borderColor: "var(--pdf-border)",
                        }}
                      >
                        <QuizzerLogoIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[8.5pt] font-black tracking-tight">QUIZZER</span>
                      <span style={{ color: "var(--pdf-muted)" }}>/</span>
                      <span
                        className="text-[7.5pt] font-bold uppercase tracking-tight max-w-[280px] truncate"
                        style={{ color: "var(--pdf-text)" }}
                      >
                        {testSetName}
                      </span>
                      {subjectName && (
                        <span
                          className="text-[7pt] font-medium hidden sm:inline"
                          style={{ color: "var(--pdf-muted)" }}
                        >
                          · {subjectName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {filterLabel && (
                        <span
                          className="rounded-full border px-2 py-0.5 text-[6.5pt] font-extrabold uppercase tracking-wider"
                          style={{
                            background: "var(--pdf-surface)",
                            borderColor: "var(--pdf-border)",
                            color: "var(--pdf-text)",
                          }}
                        >
                          {filterLabel}
                        </span>
                      )}
                      <span
                        className="text-[7pt] font-extrabold border px-2 py-0.5 rounded-md"
                        style={{
                          background: "var(--pdf-surface)",
                          borderColor: "var(--pdf-border)",
                          color: "var(--pdf-text)",
                        }}
                      >
                        Page {pageNum} of {totalPages}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Page Main: Dynamic Packed Rows of 1 or 2 Cards ── */}
              <div className="pdf-page-main flex-1 min-h-0 flex flex-col justify-start gap-2.5 my-1">
                {pagePlan.rows.map((row, rowIdx) => (
                  <div
                    key={`page-${pageIndex}-row-${rowIdx}`}
                    className={cn(
                      "pdf-question-row",
                      row.isFullWidth ? "grid-cols-1" : "grid-cols-2"
                    )}
                    style={{
                      display: "grid",
                      gap: "3.5mm",
                      alignItems: "stretch",
                    }}
                  >
                    {row.items.map((item) => (
                      <PdfQuestionCard
                        key={item.question._id || item.question.id || item.originalIndex}
                        number={item.originalIndex + 1}
                        question={item.question}
                        selectedAnswer={item.answer?.selected}
                        status={item.status}
                        isFullWidth={row.isFullWidth}
                        isCompact={row.isCompact}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* ── Page Footer: Certification on Last Page, Standard Footer on Intermediate Pages ── */}
              <div className="pdf-page-footer shrink-0 mt-1.5">
                {isLastPage && (score !== undefined || correctCount !== undefined) && (
                  <PdfEndSummary
                    score={score}
                    totalQuestions={totalQuestions}
                    correctCount={correctCount}
                    incorrectCount={incorrectCount}
                    unansweredCount={unansweredCount}
                  />
                )}

                <div
                  className="rounded-xl border px-3 py-1 text-[6.8pt] flex items-center justify-between shadow-xs mt-1"
                  style={{
                    background: "var(--pdf-surface-2)",
                    borderColor: "var(--pdf-border)",
                    color: "var(--pdf-muted)",
                  }}
                >
                  <span className="truncate max-w-[70%]">
                    Quizzer · {testSetName} · Exam Revision Assessment Key
                  </span>
                  <span
                    className="font-extrabold shrink-0 border px-1.5 py-0.2 rounded"
                    style={{
                      background: "var(--pdf-surface)",
                      borderColor: "var(--pdf-border)",
                      color: "var(--pdf-text)",
                    }}
                  >
                    Page {pageNum} of {totalPages}
                  </span>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
