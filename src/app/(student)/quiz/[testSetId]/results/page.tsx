"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionReviewCard, QuestionShellSkeleton } from "@/components/quiz";
import { QuestionReviewFilter, type ReviewFilter } from "@/components/quiz/QuestionReviewFilter";
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
} from "lucide-react";

export default function ResultsPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;

  // ── Data queries — all hooks must be declared before any early returns ──
  const data = useQuery(api.attempts.latestSubmittedForTestSet, { testSetId: id });
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const currentSet = useQuery(api.testSets.get, { id });
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
  // Must be above the early return — will safely return [] when data is not yet available.
  const filteredQuestionsWithIndex = useMemo(() => {
    if (!data) return [];
    const { attempt, questions } = data;
    return questions
      .map((q, i) => {
        const answer = attempt.answers.find((a) => a.questionId === q._id);
        const badge = !answer ? "unanswered" : answer.isCorrect ? "correct" : "incorrect";
        return { question: q, answer, badge, originalIndex: i };
      })
      .filter(({ badge }) => {
        if (reviewFilter === "correct") return badge === "correct";
        if (reviewFilter === "incorrect") return badge === "incorrect";
        return true; // "all"
      });
  }, [data, reviewFilter]);

  // ── Loading state ──
  if (data === undefined || data === null) {
    return (
      <div className="w-full space-y-4 pt-1">
        <div className="h-48 rounded-2xl border border-border bg-card/60 p-6 animate-pulse" />
        <QuestionShellSkeleton />
      </div>
    );
  }

  const { attempt, questions } = data;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectCount = attempt.answers.filter((a) => !a.isCorrect).length;
  const unansweredCount = attempt.totalQuestions - attempt.answers.length;

  const filterCounts = {
    all: questions.length,
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

  return (
    <div className="space-y-5 pb-12">
      {/* Back to dashboard */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {/* Score summary card */}
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
        <div className="flex items-center justify-center gap-4 mb-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {correctCount} Correct (+{correctCount * 2})
          </span>
          <span className="flex items-center gap-1 font-semibold text-destructive">
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


        {/* Action buttons: retest + next set (or subjects fallback) */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            asChild
            variant="outline"
            className="font-semibold text-xs h-10 rounded-xl border-border gap-1.5 cursor-pointer"
          >
            <Link href={`/quiz/${id}`}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Retake Test
            </Link>
          </Button>

          {nextSet ? (
            <Button
              asChild
              className="font-bold text-xs h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer"
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
              className="font-semibold text-xs h-10 rounded-xl border-border gap-1.5 cursor-pointer"
            >
              <Link href="/subjects">
                <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                View All Subjects
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {/* Question Review section */}
      <div className="space-y-4">
        {/* Header row: title + count + filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Question Review
            </h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full tabular-nums">
              {questions.length} Questions
            </span>
          </div>
          <QuestionReviewFilter
            value={reviewFilter}
            onChange={setReviewFilter}
            counts={filterCounts}
          />
        </div>

        {/* Filtered question list — original question number (originalIndex + 1) preserved */}
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
  );
}
