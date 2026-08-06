"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QUESTION_RENDERERS, QuestionShell } from "@/components/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/utils";
import { CheckCircle2, XCircle, HelpCircle, ArrowLeft } from "lucide-react";

function getOptionText(options: { id: string; text: string }[], selectedId?: string | string[]): string {
  if (!selectedId) return "None (Unanswered)";
  if (Array.isArray(selectedId)) return selectedId.join(", ");
  const opt = options.find((o) => o.id === selectedId);
  return opt ? `${selectedId === "opt1" ? "Option A" : selectedId === "opt2" ? "Option B" : selectedId === "opt3" ? "Option C" : selectedId === "opt4" ? "Option D" : selectedId}: ${opt.text}` : selectedId;
}

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
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <Card className="text-center p-6 bg-card border border-border shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Test Attempt Results</p>
        <p className="text-5xl font-extrabold mt-2 tracking-tight">
          {formatScore(attempt.score ?? 0)}{" "}
          <span className="text-xl text-muted-foreground font-semibold">/ {attempt.totalQuestions}</span>
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-sm font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
            {accuracy.toFixed(1)}% Accuracy
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Button asChild variant="outline" className="font-semibold text-xs">
            <Link href="/wrong-questions">Practice Wrong Questions</Link>
          </Button>
          <Button asChild className="font-semibold text-xs">
            <Link href="/subjects">Browse Other Subjects</Link>
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-bold tracking-tight">Detailed Question Review</h2>
          <span className="text-xs font-medium text-muted-foreground">
            {questions.length} Questions Reviewed
          </span>
        </div>

        {questions.map((q, i) => {
          const Renderer = QUESTION_RENDERERS[q.type];
          const answer = attempt.answers.find((a) => a.questionId === q._id);
          const badge = !answer ? "unanswered" : answer.isCorrect ? "correct" : "incorrect";

          const userSelText = getOptionText(q.options, answer?.selected);
          const correctAnsText = getOptionText(q.options, q.correctAnswer);

          return (
            <div key={q._id} className="space-y-3">
              <QuestionShell
                number={i + 1}
                type={q.type}
                questionText={q.questionText}
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
              >
                <Renderer question={q} selected={answer?.selected} onSelect={() => {}} mode="review" />
              </QuestionShell>

              {/* Explicit Answer Comparison Box */}
              <div className="rounded-xl border border-border bg-card p-4 text-xs sm:text-sm space-y-2.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-muted-foreground min-w-[110px] shrink-0">You Selected:</span>
                  <div className="flex items-center gap-1.5 font-medium flex-1">
                    <span>{userSelText}</span>
                    {answer?.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : answer?.selected ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                  <span className="font-bold text-muted-foreground min-w-[110px] shrink-0">Correct Answer:</span>
                  <div className="flex items-center gap-1.5 font-medium text-success flex-1">
                    <span>{correctAnsText}</span>
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  </div>
                </div>
              </div>

              {/* Explanation Callout */}
              {q.explanation && (
                <div className="text-xs sm:text-sm text-muted-foreground bg-muted/60 border border-border rounded-xl p-4 leading-relaxed">
                  <span className="font-bold text-foreground block mb-1">Explanation & Context:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
