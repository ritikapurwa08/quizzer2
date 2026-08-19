"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionReviewCard, QuestionShellSkeleton } from "@/components/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, XCircle, Minus } from "lucide-react";

export default function ResultsPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;
  const data = useQuery(api.attempts.latestSubmittedForTestSet, { testSetId: id });
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  if (data === undefined || data === null) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pt-4">
        <QuestionShellSkeleton />
        <QuestionShellSkeleton />
      </div>
    );
  }

  const { attempt, questions } = data;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectCount = attempt.answers.filter((a) => !a.isCorrect).length;
  const unansweredCount = attempt.totalQuestions - attempt.answers.length;
  const accuracy =
    attempt.totalQuestions > 0 ? (correctCount / attempt.totalQuestions) * 100 : 0;
  const isPassed = accuracy >= 60;

  return (
    <div className="space-y-5 pb-12">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Score summary card */}
      <Card className="p-5 sm:p-6 border border-border shadow-sm rounded-xl text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          Test Attempt Results
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-1">
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatScore(attempt.score ?? 0)}
            <span className="text-xl text-muted-foreground font-semibold"> / {attempt.totalQuestions * 2} Marks</span>
          </p>
          <span
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full",
              isPassed
                ? "bg-success/10 text-success border border-success/25"
                : "bg-destructive/10 text-destructive border border-destructive/25"
            )}
          >
            {accuracy.toFixed(1)}% Accuracy
          </span>
        </div>

        {/* Stats mini-row */}
        <div className="flex items-center justify-center gap-4 mt-3 mb-4 text-xs">
          <span className="flex items-center gap-1 font-semibold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> {correctCount} Correct
          </span>
          <span className="flex items-center gap-1 font-semibold text-destructive">
            <XCircle className="h-3.5 w-3.5" /> {incorrectCount} Incorrect
          </span>
          {unansweredCount > 0 && (
            <span className="flex items-center gap-1 font-semibold text-muted-foreground">
              <Minus className="h-3.5 w-3.5" /> {unansweredCount} Skipped
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="outline" className="font-semibold text-xs h-10 rounded-lg border-border">
            <Link href="/wrong-questions">Practice Wrong Questions</Link>
          </Button>
          <Button asChild className="font-semibold text-xs h-10 rounded-lg bg-primary hover:bg-primary/90">
            <Link href="/subjects">Browse Other Subjects</Link>
          </Button>
        </div>
      </Card>

      {/* Review section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            Detailed Question Review
          </h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {questions.length} Questions
          </span>
        </div>

        {questions.map((q, i) => {
          const answer = attempt.answers.find((a) => a.questionId === q._id);
          const badge = !answer ? "unanswered" : answer.isCorrect ? "correct" : "incorrect";

          return (
            <QuestionReviewCard
              key={q._id}
              number={i + 1}
              question={q}
              selectedAnswer={answer?.selected}
              isBookmarked={bookmarked.has(q._id)}
              onToggleBookmark={() => {
                setBookmarked((prev) => {
                  const next = new Set(prev);
                  next.has(q._id) ? next.delete(q._id) : next.add(q._id);
                  return next;
                });
                toggleBookmark({ questionId: q._id });
              }}
              reviewBadge={badge}
            />
          );
        })}
      </div>
    </div>
  );
}
