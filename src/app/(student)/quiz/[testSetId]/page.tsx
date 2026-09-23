"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuizSession } from "@/hooks/useQuizSession";
import {
  QUESTION_RENDERERS,
  QuestionShell,
  QuestionPalette,
  QuestionShellSkeleton,
} from "@/components/quiz";
import { QuestionPaletteToggle } from "@/components/quiz/QuestionPaletteToggle";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Clock, Loader2, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

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
    remainingSeconds,
    totalDurationSeconds,
    isPaused,
    pause,
    resume,
    submit,
    isLoading,
  } = useQuizSession(id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const current = questions[currentIndex];

  // Keyboard shortcuts: 1-4/A-D for options, ArrowLeft/Right for nav, Enter to advance/submit
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
      <div className="flex flex-col lg:flex-row gap-6 w-full pt-1">
        <div className="flex-1 space-y-3 min-w-0">
          <QuestionShellSkeleton />
        </div>
        <div className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="h-64 rounded-2xl border border-border bg-card/60 p-4 animate-pulse" />
        </div>
      </div>
    );
  }

  const Renderer = current ? QUESTION_RENDERERS[current.type] : null;
  const answeredCount = Object.keys(localAnswers).length;

  // Shared palette data — avoid duplicating the map call
  const paletteQuestions = questions.map((q) => ({
    id: q._id,
    answered: localAnswers[q._id] !== undefined,
    bookmarked: bookmarkedIds.has(q._id),
  }));

  const isLastQuestion = currentIndex === questions.length - 1;

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
      {/* ── Main question column ── */}
      <div className="flex-1 space-y-3 min-w-0 pb-20 lg:pb-0">

        {/* ── Mobile Header: name + countdown timer + pause button ── */}
        <div className="flex lg:hidden items-center justify-between gap-2 bg-card px-3 py-2.5 rounded-xl border border-border">
          <h1 className="font-semibold text-sm text-foreground font-hindi truncate min-w-0">
            {testSet?.name}
          </h1>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => (isPaused ? resume() : pause())}
              className="p-1 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors"
              title={isPaused ? "Resume Test" : "Pause Test"}
              aria-label={isPaused ? "Resume Test" : "Pause Test"}
            >
              {isPaused ? (
                <Play className="h-3.5 w-3.5 fill-current text-primary" />
              ) : (
                <Pause className="h-3.5 w-3.5" />
              )}
            </button>
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold shrink-0 transition-colors",
                remainingSeconds < 120
                  ? "bg-destructive/15 text-destructive border border-destructive/30 animate-pulse"
                  : "bg-muted text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          </div>
        </div>

        {/* ── Desktop Header: title below border ── */}
        <div className="hidden lg:block border-b border-border/60 pb-2">
          <h1 className="font-semibold text-lg tracking-tight text-foreground font-hindi">
            {testSet?.name}
          </h1>
        </div>

        {/* ── Test Paused Full Overlay ── */}
        {isPaused ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-8 text-center space-y-4 my-4 animate-in fade-in-0 duration-150">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit mx-auto">
              <Pause className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h2 className="text-xl font-bold text-foreground font-hindi">
                टेस्ट रोक दिया गया है (Test Paused)
              </h2>
              <p className="text-xs text-muted-foreground font-hindi leading-relaxed">
                आपका समय और प्रश्न-उत्तर सुरक्षित हैं। शेष समय:{" "}
                <span className="font-mono font-bold text-foreground">
                  {formatTime(remainingSeconds)}
                </span>
                । जब आप तैयार हों, तब नीचे दिए गए बटन पर क्लिक करके टेस्ट जारी रखें।
              </p>
            </div>
            <Button
              onClick={resume}
              className="rounded-xl px-6 font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-md"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>टेस्ट जारी रखें (Resume Test)</span>
            </Button>
          </div>
        ) : (
          /* ── Active question ── */
          current && Renderer && (
            <QuestionShell
              number={currentIndex + 1}
              type={current.type}
              questionText={current.questionText}
              isBookmarked={bookmarkedIds.has(current._id)}
              onToggleBookmark={() => toggleBookmark(current._id)}
              reference={current.reference}
              meta={current.meta}
            >
              <Renderer
                question={current}
                selected={localAnswers[current._id]}
                onSelect={(value) => selectAnswer(current._id, value)}
                mode="quiz"
              />
            </QuestionShell>
          )
        )}


        {/* ── Mobile navigation row: ← prev | answered/total | next/submit → ── */}
        <div className="flex lg:hidden items-center gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="h-10 px-3 font-semibold text-xs rounded-xl border-border cursor-pointer shrink-0"
            aria-label="Previous question"
          >
            ← Prev
          </Button>

          {/* Compact answered/total count — center */}
          <span className="flex-1 text-center text-xs font-semibold tabular-nums text-muted-foreground">
            {answeredCount}&thinsp;/&thinsp;{questions.length} answered
          </span>

          {/* Next or Submit */}
          {isLastQuestion ? (
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={isSubmitting}
              className="h-10 px-3 font-bold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span>Submitting...</span>
                </span>
              ) : (
                "Submit ✓"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="h-10 px-3 font-semibold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0"
              aria-label="Next question"
            >
              Next →
            </Button>
          )}
        </div>

        {/* ── Mobile Question Palette — collapsible ── */}
        <div className="block lg:hidden">
          <QuestionPaletteToggle
            questions={paletteQuestions}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
          />
        </div>
      </div>

      {/* ── Desktop Sidebar: progress, timer, palette, navigation, submit ── */}
      <div className="hidden lg:block w-[272px] shrink-0">
        <div className="sticky top-20 space-y-3">

          {/* Progress & Timer card */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Progress
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full tabular-nums">
                {answeredCount} / {questions.length} Solved
              </span>
            </div>

            {/* Countdown Remaining Timer */}
            <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Remaining Time
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Total: {formatTime(totalDurationSeconds)}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 font-mono text-sm font-bold px-2 py-1 rounded-lg transition-colors",
                  remainingSeconds < 120
                    ? "bg-destructive/15 text-destructive border border-destructive/30 animate-pulse"
                    : "bg-muted text-foreground"
                )}
              >
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            {/* Pause / Resume Button */}
            <Button
              type="button"
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={() => (isPaused ? resume() : pause())}
              className={cn(
                "w-full h-8 text-xs font-bold rounded-xl gap-1.5 cursor-pointer transition-colors",
                isPaused
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border hover:bg-muted"
              )}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume Test</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause Test</span>
                </>
              )}
            </Button>
          </div>


          {/* Question Palette grid — always visible on desktop */}
          <QuestionPalette
            questions={paletteQuestions}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
          />

          {/* Navigation controls + Submit */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer"
                aria-label="Previous question"
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={isLastQuestion}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer"
                aria-label="Next question"
              >
                Next →
              </Button>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl cursor-pointer"
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span>Submitting test...</span>
                </span>
              ) : (
                "Submit Test"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setConfirmSubmitOpen(open);
        }}
        title="Submit Test?"
        description={`You have answered ${answeredCount} of ${questions.length} questions. Are you sure you want to finish the test?`}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
        confirmLabel="Yes, Submit Test"
        loadingLabel="Submitting..."
      />
    </div>
  );
}
