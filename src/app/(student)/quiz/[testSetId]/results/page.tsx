"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionReviewCard, QuestionShellSkeleton } from "@/components/quiz";
import { QuestionReviewFilter, type ReviewFilter } from "@/components/quiz/QuestionReviewFilter";
import { PrintableAssessmentReport } from "@/components/quiz/pdf/PrintableAssessmentReport";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore, cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  LayoutList,
  RotateCcw,
  Printer,
  Sun,
  Moon,
} from "lucide-react";

/**
 * Automatically derives a clean, filesystem-safe filename for PDF printing
 * so the browser's "Save Print Output As" dialog automatically pre-fills the name.
 */
export function getSuggestedPdfFileName({
  setName,
  setOrder,
  topicName,
  topicSlug,
  filter,
}: {
  setName?: string;
  setOrder?: number;
  topicName?: string;
  topicSlug?: string;
  filter?: ReviewFilter;
}): string {
  // Extract number from test set name (e.g., "भाग 13" -> 13, "Set 7" -> 7) or order
  const numberMatch =
    setName?.match(/(?:भाग|part|set|test|quiz|\#)\s*(\d+)/i) ||
    setName?.match(/\b(\d+)\b/);
  const num = numberMatch ? numberMatch[1] : (setOrder !== undefined && setOrder > 0 ? String(setOrder) : "");

  let baseName = "";

  const isTense =
    topicSlug?.toLowerCase().includes("tense") ||
    topicName?.toLowerCase().includes("tense") ||
    setName?.toLowerCase().includes("tense");

  if (isTense && num) {
    baseName = `tense-${num}`;
  } else if (setName) {
    baseName = setName;
  } else if (topicName && num) {
    baseName = `${topicName} - Part ${num}`;
  } else if (topicName) {
    baseName = topicName;
  } else {
    baseName = "Quizzer-Assessment-Report";
  }

  // Sanitize Windows illegal file characters: \ / : * ? " < > |
  baseName = baseName.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").trim();

  // If filtering for mistakes only:
  if (filter === "incorrect") {
    baseName += " - Mistakes";
  } else if (filter === "correct") {
    baseName += " - Correct";
  }

  return baseName;
}

class PdfReportErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("Printable assessment report render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function ResultsPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;

  // ── Data queries — all hooks must be declared before any early returns ──
  const data = useQuery(api.attempts.latestSubmittedForTestSet, { testSetId: id });
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const currentSet = useQuery(api.testSets.get, { id });
  const topic = useQuery(
    api.topics.get,
    currentSet?.topicId ? { id: currentSet.topicId } : "skip"
  );
  const subject = useQuery(
    api.subjects.get,
    topic?.subjectId ? { id: topic.subjectId } : "skip"
  );

  const siblingSets = useQuery(
    api.testSets.listByTopic,
    currentSet?.topicId ? { topicId: currentSet.topicId } : "skip"
  );

  // ── Local state — also before any early returns ──
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [pdfTheme, setPdfTheme] = useState<"dark" | "light">("dark");

  // Next-set logic: find the next set by order within the same topic
  const nextSet = useMemo(() => {
    if (!siblingSets || !currentSet) return null;
    const currentIndex = siblingSets.findIndex((s) => s._id === id);
    if (currentIndex === -1 || currentIndex === siblingSets.length - 1) return null;
    return siblingSets[currentIndex + 1];
  }, [siblingSets, currentSet, id]);

  // Derived: filtered questions with their original indices.
  const filteredQuestionsWithIndex = useMemo(() => {
    if (!data) return [];
    const { attempt, questions } = data;
    return (questions || [])
      .map((q, i) => {
        const answer = (attempt.answers || []).find((a) => a.questionId === q._id);
        const badge = !answer ? "unanswered" : answer.isCorrect ? "correct" : "incorrect";
        return { question: q, answer, badge, originalIndex: i };
      })
      .filter(({ badge }) => {
        if (reviewFilter === "correct") return badge === "correct";
        if (reviewFilter === "incorrect") return badge === "incorrect";
        return true; // "all"
      });
  }, [data, reviewFilter]);

  // Formatted evaluated questions for the publication-grade PDF report
  const evaluatedQuestions = useMemo(() => {
    return filteredQuestionsWithIndex.map(({ question, answer, badge, originalIndex }) => ({
      question: question || {
        type: "mcq",
        questionText: "Question details unavailable",
        options: [],
        correctAnswer: "",
      },
      answer,
      status: (badge || "unanswered") as "correct" | "incorrect" | "unanswered",
      originalIndex,
    }));
  }, [filteredQuestionsWithIndex]);

  // Derived suggested file name for print / Save As PDF (declared before any early returns)
  const suggestedFileName = useMemo(() => {
    return getSuggestedPdfFileName({
      setName: currentSet?.name,
      setOrder: currentSet?.order,
      topicName: topic?.name,
      topicSlug: topic?.slug,
      filter: reviewFilter,
    });
  }, [currentSet, topic, reviewFilter]);

  // Keep document.title synchronized so the browser automatically populates
  // the exact test name in Windows "Save Print Output As" / "Save As PDF"
  useEffect(() => {
    if (suggestedFileName) {
      document.title = suggestedFileName;
    }
  }, [suggestedFileName]);

  // ── Loading state ──
  if (data === undefined || currentSet === undefined) {
    return (
      <div className="w-full space-y-4 pt-1">
        <div className="h-48 rounded-2xl border border-border bg-card/60 p-6 animate-pulse" />
        <QuestionShellSkeleton />
      </div>
    );
  }

  // ── Test Set Not Found & No Results ──
  if (currentSet === null && data === null) {
    return (
      <Card className="p-8 border border-border rounded-2xl text-center bg-card max-w-md mx-auto my-12 shadow-sm">
        <p className="text-base font-bold text-foreground mb-2">Test Set Not Found</p>
        <p className="text-xs text-muted-foreground mb-6">
          This test set does not exist or may have been updated.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/subjects">Browse All Subjects</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // ── Empty / Unattempted state ──
  if (data === null) {
    return (
      <Card className="p-8 border border-border rounded-2xl text-center bg-card max-w-md mx-auto my-12 shadow-sm">
        <p className="text-base font-bold text-foreground mb-2">No Test Results Found</p>
        <p className="text-xs text-muted-foreground mb-6">
          You haven&apos;t completed this test set yet, or your attempt is still in progress.
        </p>
        <div className="flex justify-center gap-3">
          {currentSet ? (
            <Button asChild className="rounded-xl">
              <Link href={`/quiz/${id}`}>Start Test Now</Link>
            </Button>
          ) : null}
          <Button asChild variant={currentSet ? "outline" : "default"} className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const { attempt, questions } = data;
  const questionsList = questions || [];
  const answersList = attempt?.answers || [];
  const correctCount = answersList.filter((a) => a.isCorrect).length;
  const incorrectCount = answersList.filter((a) => !a.isCorrect).length;
  const totalQCount = attempt?.totalQuestions ?? questionsList.length;
  const unansweredCount = Math.max(0, totalQCount - answersList.length);

  const filterCounts = {
    all: questionsList.length,
    correct: correctCount,
    incorrect: incorrectCount,
  };

  function handleToggleBookmark(questionId: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
    toggleBookmark({ questionId: questionId as Id<"questions"> });
  }

  const handlePrint = async (filter?: ReviewFilter, themeOverride?: "dark" | "light") => {
    try {
      const activeFilter = filter ?? reviewFilter;
      const activeTheme = themeOverride ?? pdfTheme;

      if (themeOverride && themeOverride !== pdfTheme) {
        setPdfTheme(themeOverride);
      }
      if (filter && filter !== reviewFilter) {
        setReviewFilter(filter);
      }

      const printFileName = getSuggestedPdfFileName({
        setName: currentSet?.name,
        setOrder: currentSet?.order,
        topicName: topic?.name,
        topicSlug: topic?.slug,
        filter: activeFilter,
      });

      if (typeof document !== "undefined") {
        document.title = printFileName;
        if (document.fonts) {
          try {
            await document.fonts.ready;
          } catch {
            // Non-critical font ready failure
          }
        }
      }

      await new Promise<void>((resolve) => {
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        } else {
          setTimeout(resolve, 60);
        }
      });

      if (typeof window !== "undefined" && typeof window.print === "function") {
        window.print();
      }
    } catch (err) {
      console.error("Print execution error:", err);
      try {
        if (typeof window !== "undefined" && typeof window.print === "function") {
          window.print();
        }
      } catch (innerErr) {
        console.error("Direct fallback print failed:", innerErr);
      }
    }
  };

  return (
    <>
      {/* ── Screen UI View (Hidden completely during Print) ── */}
      <div id="screen-results-view" className="space-y-5 pb-12 print:hidden">
        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        {/* Score summary card (screen only) */}
        <Card className="p-5 sm:p-6 border border-border shadow-xs rounded-2xl text-center bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Test Result
          </p>

          {/* Score */}
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground tabular-nums mb-3">
            {formatScore(attempt.score ?? 0)}
            <span className="text-lg sm:text-xl text-muted-foreground font-semibold">
              {" "}/ {attempt.totalQuestions * 2} pts
            </span>
          </p>

          {/* Stats: correct / incorrect / unanswered */}
          <div className="flex items-center justify-center gap-4 mb-2 text-xs flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {correctCount} Correct (+{correctCount * 2})
            </span>
            <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {incorrectCount} Incorrect (-{((incorrectCount * 2) / 3).toFixed(2)})
            </span>
            {unansweredCount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                {unansweredCount} Skipped (0)
              </span>
            )}
          </div>

          {/* Canonical Scoring Rule Note */}
          <p className="text-[11px] text-muted-foreground mb-5">
            Standard RPSC Scoring: +2 marks per correct answer · 1/3 negative marking (-0.67 per incorrect)
          </p>

          {/* Action buttons: Retake Test, Direct Print, Dark/Light Mode Toggle, Mistakes sheet, Next Set */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button
                asChild
                variant="outline"
                className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80"
              >
                <Link href={`/quiz/${id}`}>
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retake Test
                </Link>
              </Button>

              {/* Direct Print / Save PDF Button */}
              <Button
                type="button"
                onClick={() => handlePrint()}
                className="font-bold text-xs h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-sm"
                title={`Print / Save: ${suggestedFileName}.pdf (${pdfTheme === "dark" ? "Dark Report" : "Light Ink-Saver"})`}
              >
                <Printer className="h-3.5 w-3.5" />
                Print / Save PDF
              </Button>

              {/* Ink-Saver Light / Dark Theme Selector Pill */}
              <div
                className="inline-flex items-center rounded-xl border border-border bg-muted/40 p-1 text-xs"
                role="group"
                aria-label="PDF Theme"
              >
                <button
                  type="button"
                  onClick={() => setPdfTheme("dark")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    pdfTheme === "dark"
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Dark PDF Report (Default zinc theme)"
                >
                  <Moon className="h-3 w-3" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfTheme("light")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer",
                    pdfTheme === "light"
                      ? "bg-card text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Light PDF Report (Ink-Saver mode)"
                >
                  <Sun className="h-3 w-3" />
                  <span>Light</span>
                </button>
              </div>

              {/* Quick Mistakes Revision Sheet Button */}
              {incorrectCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePrint("incorrect")}
                  className="font-semibold text-xs h-10 px-3.5 rounded-xl border-border gap-1.5 cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                  title="One-click Print: Mistake Revision Sheet"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Mistakes Sheet ({incorrectCount})</span>
                </Button>
              )}

              {nextSet ? (
                <Button
                  asChild
                  variant="outline"
                  className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80"
                >
                  <Link href={`/quiz/${nextSet._id}`}>
                    Next Test Set
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80"
                >
                  <Link href="/subjects">
                    <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                    View All Subjects
                  </Link>
                </Button>
              )}
            </div>

            {suggestedFileName && (
              <span className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
                Save as: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-semibold">{suggestedFileName}.pdf</code>
                <span className="text-muted-foreground/60 text-[9.5px]">({pdfTheme === "dark" ? "Dark Theme" : "Light Ink-Saver"})</span>
              </span>
            )}
          </div>
        </Card>

        {/* ── Question Review section (screen interactive list) ── */}
        <div className="space-y-4">
          {/* Header row: title + count + filter + print shortcut */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                Question Review
              </h2>
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full tabular-nums">
                {filteredQuestionsWithIndex.length} of {questionsList.length} Questions
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <QuestionReviewFilter
                value={reviewFilter}
                onChange={setReviewFilter}
                counts={filterCounts}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePrint()}
                className="h-8 text-xs font-semibold rounded-lg gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                title="Print current review list"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {reviewFilter === "all"
                    ? "Print All"
                    : reviewFilter === "incorrect"
                    ? "Print Mistakes"
                    : "Print Correct"}
                </span>
              </Button>
            </div>
          </div>

          {/* Filtered question list — original question number preserved */}
          {filteredQuestionsWithIndex.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {reviewFilter === "correct"
                ? "No correct answers found."
                : "No incorrect answers found."}
            </p>
          ) : (
            filteredQuestionsWithIndex.map(({ question: q, answer, badge, originalIndex }) => (
              <QuestionReviewCard
                key={q._id}
                number={originalIndex + 1}
                question={q}
                selectedAnswer={answer?.selected}
                isBookmarked={bookmarked.has(q._id)}
                onToggleBookmark={() => handleToggleBookmark(q._id)}
                reviewBadge={badge as "correct" | "incorrect" | "unanswered"}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Official A4 Two-Column Assessment Report (Shown ONLY during Print) ── */}
      <PdfReportErrorBoundary>
        <PrintableAssessmentReport
          testSetName={currentSet?.name || "Assessment Report"}
          subjectName={subject?.name}
          topicName={topic?.name}
          score={attempt.score ?? 0}
          totalQuestions={attempt.totalQuestions}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          unansweredCount={unansweredCount}
          submittedAt={attempt.submittedAt}
          filterLabel={
            reviewFilter === "all"
              ? "Complete Question Review"
              : reviewFilter === "incorrect"
              ? "Mistake Revision Sheet (Incorrect Only)"
              : "Correct Answers Only"
          }
          questions={evaluatedQuestions}
          theme={pdfTheme}
        />
      </PdfReportErrorBoundary>
    </>
  );
}
