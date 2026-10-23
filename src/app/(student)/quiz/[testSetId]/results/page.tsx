"use client";

import { useState, useMemo } from "react";
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
import { formatScore } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  LayoutList,
  RotateCcw,
  Printer,
} from "lucide-react";

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
      question,
      answer,
      status: badge as "correct" | "incorrect" | "unanswered",
      originalIndex,
    }));
  }, [filteredQuestionsWithIndex]);

  // ── Loading state ──
  if (data === undefined) {
    return (
      <div className="w-full space-y-4 pt-1">
        <div className="h-48 rounded-2xl border border-border bg-card/60 p-6 animate-pulse" />
        <QuestionShellSkeleton />
      </div>
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
          <Button asChild className="rounded-xl">
            <Link href={`/quiz/${id}`}>Start Test Now</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const { attempt, questions } = data;
  const answersList = attempt.answers || [];
  const correctCount = answersList.filter((a) => a.isCorrect).length;
  const incorrectCount = answersList.filter((a) => !a.isCorrect).length;
  const unansweredCount = Math.max(0, attempt.totalQuestions - answersList.length);

  const filterCounts = {
    all: questions?.length || 0,
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

  const handlePrint = (filter?: ReviewFilter) => {
    if (filter && filter !== reviewFilter) {
      setReviewFilter(filter);
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
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
            Standard RPSC Scoring: +2 marks per correct answer · 1/3 negative marking (-0.66 per incorrect)
          </p>

          {/* Action buttons: Retake Test, Print / Save PDF in Middle, Next Test Set */}
          <div className="flex flex-wrap items-center justify-center gap-3">
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

            {/* Print / Save PDF Button — CENTERED & PROMINENT */}
            <Button
              type="button"
              onClick={() => handlePrint()}
              className="font-bold text-xs h-10 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-sm"
              title="Download publication-grade A4 PDF or print evaluation report"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>

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
                {filteredQuestionsWithIndex.length} of {questions.length} Questions
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
      <PrintableAssessmentReport
        testSetName={currentSet?.name || "Test Result"}
        subjectName={subject?.name || "English (Paper-II)"}
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
      />
    </>
  );
}
