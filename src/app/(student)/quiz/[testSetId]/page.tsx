"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QUESTION_RENDERERS, QuestionShell, QuestionPalette } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Clock } from "lucide-react";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function QuizPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;
  const router = useRouter();

  const testSet = useQuery(api.testSets.get, { id });
  const {
    questions,
    localAnswers,
    selectAnswer,
    bookmarkedIds,
    toggleBookmark,
    elapsedSeconds,
    submit,
    isLoading,
  } = useQuizSession(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading || questions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading quiz questions...</p>
      </div>
    );
  }

  const current = questions[currentIndex];
  const Renderer = current ? QUESTION_RENDERERS[current.type] : null;
  const answeredCount = Object.keys(localAnswers).length;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await submit();
      router.push(`/quiz/${id}/results`);
    } catch (err) {
      console.error("Submit failed:", err);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_260px] gap-6">
      <div className="space-y-4 pb-24 lg:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-lg border border-border">
          <div>
            <h1 className="font-bold text-base">{testSet?.name}</h1>
            <span className="text-xs text-muted-foreground">
              {answeredCount} of {questions.length} answered
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted font-mono text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {current && Renderer && (
          <QuestionShell
            number={currentIndex + 1}
            type={current.type}
            questionText={current.questionText}
            isBookmarked={bookmarkedIds.has(current._id)}
            onToggleBookmark={() => toggleBookmark(current._id)}
          >
            <Renderer
              question={current}
              selected={localAnswers[current._id]}
              onSelect={(value) => selectAnswer(current._id, value)}
              mode="quiz"
            />
          </QuestionShell>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}>
              Next
            </Button>
          ) : (
            <Button onClick={() => setConfirmSubmitOpen(true)} className="bg-primary">
              Submit Test
            </Button>
          )}
        </div>
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-4">
          <QuestionPalette
            questions={questions.map((q) => ({
              id: q._id,
              answered: localAnswers[q._id] !== undefined,
              bookmarked: bookmarkedIds.has(q._id),
            }))}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
          />
          <Button className="w-full" onClick={() => setConfirmSubmitOpen(true)}>
            Submit Test
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={setConfirmSubmitOpen}
        title="Submit test?"
        description={`You've answered ${answeredCount} of ${questions.length} questions. Are you sure you want to finish?`}
        onConfirm={handleSubmit}
        confirmLabel={isSubmitting ? "Submitting..." : "Submit"}
      />
    </div>
  );
}
