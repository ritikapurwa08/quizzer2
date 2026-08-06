"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionReviewCard } from "@/components/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function ResultsPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;
  const data = useQuery(api.attempts.latestSubmittedForTestSet, { testSetId: id });
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  if (data === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading attempt results...</p>
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Scoring your attempt...</p>
      </div>
    );
  }

  const { attempt, questions } = data;
  const accuracy = attempt.totalQuestions > 0
    ? ((attempt.answers.filter((a) => a.isCorrect).length / attempt.totalQuestions) * 100)
    : 0;

  return (
    <div className="space-y-5 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <Card className="text-center p-5 bg-card border border-border shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Attempt Results</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1.5">
          <p className="text-4xl font-extrabold tracking-tight">
            {formatScore(attempt.score ?? 0)}{" "}
            <span className="text-lg text-muted-foreground font-semibold">/ {attempt.totalQuestions}</span>
          </p>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {accuracy.toFixed(1)}% Accuracy
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-4">
          <Button asChild variant="outline" className="font-semibold text-xs h-9">
            <Link href="/wrong-questions">Practice Wrong Questions</Link>
          </Button>
          <Button asChild className="font-semibold text-xs h-9">
            <Link href="/subjects">Browse Other Subjects</Link>
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-base sm:text-lg font-bold tracking-tight">Detailed Question Review</h2>
          <span className="text-xs font-medium text-muted-foreground">
            {questions.length} Questions Reviewed
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
