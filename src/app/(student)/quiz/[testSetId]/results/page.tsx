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
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Minus, LayoutList, RotateCcw } from "lucide-react";

export default function ResultsPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;
  const data = useQuery(api.attempts.latestSubmittedForTestSet, { testSetId: id });
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  // Fetch current test set to get topicId
  const currentSet = useQuery(api.testSets.get, { id });
  // Fetch all sets in the same topic (only when topicId is available)
  const siblingSets = useQuery(
    api.testSets.listByTopic,
    currentSet?.topicId ? { topicId: currentSet.topicId } : "skip"
  );

  // Find the next set (by order) after the current one
  const nextSet = (() => {
    if (!siblingSets || !currentSet) return null;
    const currentIndex = siblingSets.findIndex((s) => s._id === id);
    if (currentIndex === -1 || currentIndex === siblingSets.length - 1) return null;
    return siblingSets[currentIndex + 1];
  })();

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
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors font-hindi"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> डैशबोर्ड पर वापस जाएं
      </Link>

      {/* Score summary card */}
      <Card className="p-5 sm:p-6 border border-border shadow-xs rounded-2xl text-center bg-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 font-hindi">
          टेस्ट परिणाम विश्लेषण (Test Result)
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-1">
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
            {formatScore(attempt.score ?? 0)}
            <span className="text-lg sm:text-xl text-muted-foreground font-semibold font-hindi"> / {attempt.totalQuestions * 2} अंक</span>
          </p>
          <span
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-full",
              isPassed
                ? "bg-success/15 text-success border border-success/30"
                : "bg-destructive/15 text-destructive border border-destructive/30"
            )}
          >
            {accuracy.toFixed(1)}% सटीकता
          </span>
        </div>

        {/* Stats mini-row */}
        <div className="flex items-center justify-center gap-4 mt-3 mb-5 text-xs font-hindi">
          <span className="flex items-center gap-1 font-bold text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> {correctCount} सही
          </span>
          <span className="flex items-center gap-1 font-bold text-destructive">
            <XCircle className="h-3.5 w-3.5" /> {incorrectCount} गलत
          </span>
          {unansweredCount > 0 && (
            <span className="flex items-center gap-1 font-bold text-muted-foreground">
              <Minus className="h-3.5 w-3.5" /> {unansweredCount} छोड़े गए
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="outline" className="font-semibold text-xs h-10 rounded-xl border-border font-hindi">
            <Link href="/wrong-questions">
              गलत प्रश्नों का अभ्यास करें
            </Link>
          </Button>

          <Button asChild variant="outline" className="font-semibold text-xs h-10 rounded-xl border-border font-hindi gap-1.5">
            <Link href={`/quiz/${id}`}>
              <RotateCcw className="h-3.5 w-3.5" />
              पुनः टेस्ट दें
            </Link>
          </Button>

          {/* Next Set button — shows if another set exists in this topic, otherwise Back to Subjects */}
          {nextSet ? (
            <Button asChild className="font-bold text-xs h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-hindi shadow-xs">
              <Link href={`/quiz/${nextSet._id}`}>
                अगला सेट हल करें
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="font-semibold text-xs h-10 rounded-xl border-border gap-1.5 font-hindi">
              <Link href="/subjects">
                <LayoutList className="h-3.5 w-3.5" />
                सभी विषय देखें
              </Link>
            </Button>
          )}
        </div>
      </Card>

      {/* Detailed Review section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground font-hindi">
            विस्तृत प्रश्न उत्तर समीक्षा (Question Review)
          </h2>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-hindi">
            कुल {questions.length} प्रश्न
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
