"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useQuizSession } from "@/hooks/useQuizSession";
import {
  QUESTION_RENDERERS,
  QuestionShell,
  QuestionShellSkeleton,
} from "@/components/quiz";
import {
  TestPausedOverlay,
  MobileBottomControlDock,
  MobileQuestionPaletteModal,
  DesktopQuizSidebar,
  getQuestionAnswer,
} from "@/components/quiz/session";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useWakeLock } from "@/hooks/useWakeLock";

export default function QuizPage() {
  const { testSetId } = useParams<{ testSetId: string }>();
  const id = testSetId as Id<"testSets">;
  const router = useRouter();

  const testSet = useQuery(api.testSets.get, { id });
  const {
    attempt,
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

  const { showToast } = useToast();

  // Persist current question index in localStorage so refresh/pause stays on the exact same question
  const indexStorageKey = `quiz_current_index_${String(id)}`;
  const [currentIndex, setCurrentIndexState] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(indexStorageKey);
        if (saved !== null) {
          const idx = parseInt(saved, 10);
          if (!isNaN(idx) && idx >= 0) return idx;
        }
      } catch { }
    }
    return 0;
  });

  const setCurrentIndex = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setCurrentIndexState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(indexStorageKey, String(next));
            window.scrollTo({ top: 0, behavior: "instant" });
          } catch { }
        }
        return next;
      });
    },
    [indexStorageKey]
  );

  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [timerDisplayMode, setTimerDisplayMode] = useState<"time" | "status">("time");

  // Alternating display mode for timer capsule: alternates between formatted time and status every 4.5 seconds
  useEffect(() => {
    if (isPaused) {
      setTimerDisplayMode("status");
      return;
    }
    if (remainingSeconds < 120) {
      setTimerDisplayMode("time");
      return;
    }
    const interval = setInterval(() => {
      setTimerDisplayMode((prev) => (prev === "time" ? "status" : "time"));
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, remainingSeconds]);

  // Keep screen active throughout the quiz session to prevent sleep timeouts
  useWakeLock(true);

  // Timer warnings at 5 mins (300s) and 1 min (60s)
  const warned5m = useRef(false);
  const warned1m = useRef(false);

  useEffect(() => {
    if (remainingSeconds <= 300 && remainingSeconds > 290 && !warned5m.current) {
      warned5m.current = true;
      showToast("5 minutes remaining! Review your unanswered questions.", "warning");
    }
    if (remainingSeconds <= 60 && remainingSeconds > 50 && !warned1m.current) {
      warned1m.current = true;
      showToast("Final 1 minute remaining! Submit your answers shortly.", "warning");
    }
  }, [remainingSeconds, showToast]);

  // Auto-redirect to results when test attempt status becomes "submitted" (manual or timer expiration)
  useEffect(() => {
    if (attempt?.status === "submitted") {
      router.push(`/quiz/${id}/results`);
    }
  }, [attempt?.status, id, router]);

  // Clamp current index if questions array is loaded
  useEffect(() => {
    if (questions.length > 0 && currentIndex >= questions.length) {
      setCurrentIndex(Math.max(0, questions.length - 1));
    }
  }, [questions.length, currentIndex, setCurrentIndex]);

  const current = questions[currentIndex];
  const enrichedCurrent = useMemo(() => {
    if (!current) return current;
    if (
      (!current.meta?.left || current.meta.left.length === 0) &&
      (!current.meta?.rows || current.meta.rows.length === 0)
    ) {
      return enrichQuestionStructure(current);
    }
    return current;
  }, [current]);

  // Keyboard shortcuts: 1-4/A-D for options, ArrowLeft/Right for nav, Enter to advance/submit
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isPaused) return;

      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        confirmSubmitOpen
      ) {
        return;
      }

      if (e.key === "Enter" && e.target instanceof HTMLButtonElement) {
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
      } else if (enrichedCurrent && enrichedCurrent.options) {
        const key = e.key.toLowerCase();
        let targetOptIdx = -1;
        if (key === "1" || key === "a") targetOptIdx = 0;
        else if (key === "2" || key === "b") targetOptIdx = 1;
        else if (key === "3" || key === "c") targetOptIdx = 2;
        else if (key === "4" || key === "d") targetOptIdx = 3;

        if (targetOptIdx >= 0 && enrichedCurrent.options[targetOptIdx]) {
          e.preventDefault();
          selectAnswer(enrichedCurrent, enrichedCurrent.options[targetOptIdx].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions.length, enrichedCurrent, selectAnswer, confirmSubmitOpen, isPaused, paletteOpen, setCurrentIndex]);

  // Single Source of Truth for answered status by question index
  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => {
      if (getQuestionAnswer(q, localAnswers, idx) !== undefined) {
        set.add(idx);
      }
    });
    return set;
  }, [questions, localAnswers]);

  const answeredCount = answeredIndices.size;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  // Shared palette data — using exact same single source of truth
  const paletteQuestions = useMemo(() => {
    return questions.map((q, idx) => {
      const qKey = q.canonicalId || q._id || q.convexId || q.id || `q_idx_${idx}`;
      return {
        id: qKey,
        answered: answeredIndices.has(idx),
        bookmarked: bookmarkedIds.has(qKey) || (q._id && bookmarkedIds.has(q._id)),
      };
    });
  }, [questions, answeredIndices, bookmarkedIds]);

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

  const Renderer = enrichedCurrent ? (QUESTION_RENDERERS[enrichedCurrent.type] || QUESTION_RENDERERS.mcq) : null;
  const isLastQuestion = currentIndex === questions.length - 1;

  async function handleSubmit() {
    if (isPaused) {
      showToast("Please resume the test before submitting.", "info");
      return;
    }
    setIsSubmitting(true);
    try {
      await submit();
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(indexStorageKey);
        } catch { }
      }
      router.push(`/quiz/${id}/results`);
    } catch (err) {
      console.error("Submit failed:", err);
      showToast("Failed to submit test. Please check your connection and try again.", "warning");
      setIsSubmitting(false);
    }
  }

  async function handleExit() {
    router.push("/subjects");
  }

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-6">
      {/* ── Main question column ── */}
      <div className="flex-1 space-y-3 min-w-0 pb-20 lg:pb-0 min-h-[580px]">
        {/* Desktop Header */}
        <div className="hidden lg:block border-b border-border/60 pb-2">
          <h1 className="font-semibold text-lg tracking-tight text-foreground font-hindi">
            {testSet?.name}
          </h1>
        </div>

        {/* Test Paused Overlay vs Active Question */}
        {isPaused ? (
          <TestPausedOverlay
            testSetName={testSet?.name}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            remainingSeconds={remainingSeconds}
            answeredCount={answeredCount}
            onResume={resume}
            onExit={() => setConfirmExitOpen(true)}
          />
        ) : (
          enrichedCurrent && Renderer && (
            <QuestionShell
              number={currentIndex + 1}
              type={enrichedCurrent.type}
              questionText={enrichedCurrent.questionText}
              isBookmarked={Boolean(
                (enrichedCurrent._id && bookmarkedIds.has(enrichedCurrent._id)) ||
                (enrichedCurrent.convexId && bookmarkedIds.has(enrichedCurrent.convexId)) ||
                (enrichedCurrent.canonicalId && bookmarkedIds.has(enrichedCurrent.canonicalId)) ||
                (enrichedCurrent.id && bookmarkedIds.has(enrichedCurrent.id))
              )}
              onToggleBookmark={() => {
                const targetKey =
                  enrichedCurrent.canonicalId ||
                  enrichedCurrent._id ||
                  enrichedCurrent.convexId ||
                  enrichedCurrent.id ||
                  `q_idx_${currentIndex}`;
                toggleBookmark(targetKey);
              }}
              reference={enrichedCurrent.reference}
              meta={enrichedCurrent.meta}
            >
              <Renderer
                question={enrichedCurrent}
                selected={getQuestionAnswer(enrichedCurrent, localAnswers, currentIndex)}
                onSelect={(value) => selectAnswer(enrichedCurrent, value)}
                mode="quiz"
              />
            </QuestionShell>
          )
        )}

        {/* Mobile Controls */}
        <MobileBottomControlDock
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          unansweredCount={unansweredCount}
          isPaused={isPaused}
          isLastQuestion={isLastQuestion}
          isSubmitting={isSubmitting}
          onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          onOpenPalette={() => setPaletteOpen(true)}
          onSubmit={() => setConfirmSubmitOpen(true)}
        />

        <MobileQuestionPaletteModal
          isOpen={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          testSetName={testSet?.name}
          questions={questions}
          currentIndex={currentIndex}
          answeredIndices={answeredIndices}
          bookmarkedIds={bookmarkedIds}
          isPaused={isPaused}
          remainingSeconds={remainingSeconds}
          timerDisplayMode={timerDisplayMode}
          onToggleTimerMode={() => setTimerDisplayMode((prev) => (prev === "time" ? "status" : "time"))}
          onPause={pause}
          onResume={resume}
          onExit={() => setConfirmExitOpen(true)}
          onJumpToQuestion={(idx) => setCurrentIndex(idx)}
        />
      </div>

      {/* Desktop Sidebar */}
      <DesktopQuizSidebar
        paletteQuestions={paletteQuestions}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        remainingSeconds={remainingSeconds}
        totalDurationSeconds={totalDurationSeconds}
        currentIndex={currentIndex}
        isPaused={isPaused}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        onPause={pause}
        onResume={resume}
        onJumpToQuestion={setCurrentIndex}
        onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
        onSubmit={() => setConfirmSubmitOpen(true)}
        onExit={() => setConfirmExitOpen(true)}
      />

      {/* Submit Confirmation Dialog */}
      <ConfirmDialog
        open={confirmSubmitOpen}
        onOpenChange={(open) => {
          if (!isSubmitting) setConfirmSubmitOpen(open);
        }}
        title="Submit Test?"
        description="Are you sure you want to finish the test? Your final score and answer evaluation will be recorded."
        stats={{
          total: questions.length,
          answered: answeredCount,
          unanswered: Math.max(0, questions.length - answeredCount),
          bookmarked: bookmarkedIds.size,
        }}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
        confirmLabel="Yes, Submit Test"
        loadingLabel="Submitting..."
        variant="primary"
      />

      {/* Exit Test Confirmation Dialog */}
      <ConfirmDialog
        open={confirmExitOpen}
        onOpenChange={setConfirmExitOpen}
        title="Exit Test?"
        description="Your answers so far are saved. You can resume this test later from the dashboard. The test will NOT be submitted."
        stats={{
          total: questions.length,
          answered: answeredCount,
          unanswered: Math.max(0, questions.length - answeredCount),
          bookmarked: bookmarkedIds.size,
        }}
        onConfirm={handleExit}
        isLoading={false}
        confirmLabel="Exit Test"
        variant="destructive"
      />
    </div>
  );
}
