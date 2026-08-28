"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuizSession } from "@/hooks/useQuizSession";
import { QUESTION_RENDERERS, QuestionShell, QuestionPalette, QuestionShellSkeleton } from "@/components/quiz";
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

  const current = questions[currentIndex];

  // Keyboard Shortcuts Handler (1-4/A-D for options, ArrowLeft/Right for nav, Enter to advance/submit)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        confirmSubmitOpen
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setConfirmSubmitOpen(true);
        }
      } else if (current && current.options) {
        const key = e.key.toLowerCase();
        let targetOptIdx = -1;
        if (key === "1" || key === "a") targetOptIdx = 0;
        else if (key === "2" || key === "b") targetOptIdx = 1;
        else if (key === "3" || key === "c") targetOptIdx = 2;
        else if (key === "4" || key === "d") targetOptIdx = 3;

        if (targetOptIdx >= 0 && current.options[targetOptIdx]) {
          e.preventDefault();
          selectAnswer(current._id, current.options[targetOptIdx].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions.length, current, selectAnswer, confirmSubmitOpen]);

  if (isLoading || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pt-4">
        <QuestionShellSkeleton />
      </div>
    );
  }

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
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4 min-w-0 pb-20 lg:pb-0">
        {/* Mobile Header Bar */}
        <div className="flex lg:hidden flex-wrap items-center justify-between gap-2 bg-card p-3 rounded-xl border border-border shadow-xs">
          <div>
            <h1 className="font-bold text-sm sm:text-base text-foreground font-hindi">{testSet?.name}</h1>
            <span className="text-xs text-muted-foreground font-hindi">
              {answeredCount} / {questions.length} उत्तर दिए गए
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted font-mono text-xs font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Desktop Header Title */}
        <div className="hidden lg:block border-b border-border/60 pb-2">
          <h1 className="font-bold text-lg tracking-tight text-foreground font-hindi">{testSet?.name}</h1>
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

        {/* Mobile Navigation Buttons */}
        <div className="flex lg:hidden items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="h-10 px-4 font-semibold text-xs rounded-xl border-border cursor-pointer font-hindi"
          >
            ← पिछला
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="h-10 px-4 font-semibold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-hindi"
            >
              अगला →
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              className="h-10 px-4 font-bold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-hindi"
            >
              टेस्ट सबमिट करें ✓
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar (Progress, Timer, Palette & Navigation Controls) */}
      <div className="hidden lg:block w-[280px] shrink-0">
        <div className="sticky top-20 space-y-4">
          {/* Progress & Time Card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-hindi">
                प्रगति
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-hindi">
                {answeredCount} / {questions.length} हल
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-hindi">
                समय
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Question Palette Grid */}
          <QuestionPalette
            questions={questions.map((q) => ({
              id: q._id,
              answered: localAnswers[q._id] !== undefined,
              bookmarked: bookmarkedIds.has(q._id),
            }))}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
          />

          {/* Navigation Controls & Submit Test */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer font-hindi"
              >
                ← पिछला
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer font-hindi"
              >
                अगला →
              </Button>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl shadow-xs cursor-pointer font-hindi"
              onClick={() => setConfirmSubmitOpen(true)}
            >
              टेस्ट सबमिट करें
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={setConfirmSubmitOpen}
        title="टेस्ट सबमिट करें?"
        description={`आपने ${questions.length} में से ${answeredCount} प्रश्नों के उत्तर दिए हैं। क्या आप टेस्ट समाप्त करना चाहते हैं?`}
        onConfirm={handleSubmit}
        confirmLabel={isSubmitting ? "सबमिट हो रहा है…" : "हाँ, सबमिट करें"}
      />
    </div>
  );
}
