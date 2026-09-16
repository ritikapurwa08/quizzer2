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
import { Clock, Loader2 } from "lucide-react";

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

        {/* ── Mobile Header: name + timer in one compact row ── */}
        <div className="flex lg:hidden items-center justify-between gap-2 bg-card px-3 py-2.5 rounded-xl border border-border">
          <h1 className="font-semibold text-sm text-foreground font-hindi truncate min-w-0">
            {testSet?.name}
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted font-mono text-xs font-semibold text-foreground shrink-0">
            <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* ── Desktop Header: title below border ── */}
        <div className="hidden lg:block border-b border-border/60 pb-2">
          <h1 className="font-semibold text-lg tracking-tight text-foreground font-hindi">
            {testSet?.name}
          </h1>
        </div>

        {/* ── Active question ── */}
        {current && Renderer && (
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
        )}

        {/* ── Mobile navigation row: ← prev | answered/total | next/submit → ── */}
        <div className="flex lg:hidden items-center gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="h-10 px-3 font-semibold text-xs rounded-xl border-border cursor-pointer font-hindi shrink-0"
            aria-label="पिछला प्रश्न"
          >
            ← पिछला
          </Button>

          {/* Compact answered/total count — center */}
          <span className="flex-1 text-center text-xs font-semibold tabular-nums text-muted-foreground font-hindi">
            {answeredCount}&thinsp;/&thinsp;{questions.length}
          </span>

          {/* Next or Submit */}
          {isLastQuestion ? (
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={isSubmitting}
              className="h-10 px-3 font-bold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-hindi shrink-0"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span>सबमिट…</span>
                </span>
              ) : (
                "सबमिट ✓"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="h-10 px-3 font-semibold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-hindi shrink-0"
              aria-label="अगला प्रश्न"
            >
              अगला →
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-hindi">
                प्रगति
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full tabular-nums font-hindi">
                {answeredCount} / {questions.length} हल
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-hindi">
                समय
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-foreground">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{formatTime(elapsedSeconds)}</span>
              </div>
            </div>
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
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer font-hindi"
                aria-label="पिछला प्रश्न"
              >
                ← पिछला
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={isLastQuestion}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer font-hindi"
                aria-label="अगला प्रश्न"
              >
                अगला →
              </Button>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl cursor-pointer font-hindi"
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                  <span>सबमिट हो रहा है…</span>
                </span>
              ) : (
                "टेस्ट सबमिट करें"
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
        title="टेस्ट सबमिट करें?"
        description={`आपने ${questions.length} में से ${answeredCount} प्रश्नों के उत्तर दिए हैं। क्या आप टेस्ट समाप्त करना चाहते हैं?`}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
        confirmLabel="हाँ, सबमिट करें"
        loadingLabel={
          <span className="flex items-center gap-1.5">
            <span>सबमिट हो रहा है</span>
            <span className="inline-flex tracking-widest animate-pulse ml-0.5">…</span>
          </span>
        }
      />
    </div>
  );
}
