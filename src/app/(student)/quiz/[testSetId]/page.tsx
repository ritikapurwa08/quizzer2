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
  QuestionPalette,
  QuestionShellSkeleton,
} from "@/components/quiz";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { Clock, Loader2, Pause, Play, ChevronLeft, ChevronRight, Check, DoorOpen, LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWakeLock } from "@/hooks/useWakeLock";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Single source of truth helper: safely checks candidate question IDs
 * against local answers map, ensuring empty strings / arrays count as unattempted.
 */
function getQuestionAnswer(q: any, answers: Record<string, any>) {
  if (!q || !answers) return undefined;
  const candidates = [q._id, q.id, q.canonicalId, q.convexId, q.sourceQuestionId];
  for (const cid of candidates) {
    if (cid && answers[cid] !== undefined && answers[cid] !== null && answers[cid] !== "") {
      if (Array.isArray(answers[cid]) && answers[cid].length === 0) continue;
      return answers[cid];
    }
  }
  return undefined;
}

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
      } catch {}
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
          } catch {}
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
      // 1. Never handle options or shortcuts while paused
      if (isPaused) return;

      // Close palette on Escape if open
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
        return;
      }

      // 2. Ignore browser/OS shortcuts with modifiers (e.g. Ctrl+C, Cmd+A, Alt+Tab)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // 3. Ignore typing in inputs or when modal is open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        confirmSubmitOpen
      ) {
        return;
      }

      // 4. If focus is on a button and user hits Enter, let button handle it natively
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
          selectAnswer(enrichedCurrent._id, enrichedCurrent.options[targetOptIdx].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questions.length, enrichedCurrent, selectAnswer, confirmSubmitOpen, isPaused, paletteOpen, setCurrentIndex]);

  // Single Source of Truth for answered status:
  const answeredSet = useMemo(() => {
    const set = new Set<string>();
    for (const q of questions) {
      if (getQuestionAnswer(q, localAnswers) !== undefined) {
        set.add(q._id);
      }
    }
    return set;
  }, [questions, localAnswers]);

  const answeredCount = answeredSet.size;

  // Shared palette data — using exact same single source of truth
  const paletteQuestions = useMemo(() => {
    return questions.map((q) => ({
      id: q._id,
      answered: answeredSet.has(q._id),
      bookmarked: bookmarkedIds.has(q._id),
    }));
  }, [questions, answeredSet, bookmarkedIds]);

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
        } catch {}
      }
      router.push(`/quiz/${id}/results`);
    } catch (err) {
      console.error("Submit failed:", err);
      showToast("Failed to submit test. Please check your connection and try again.", "warning");
      setIsSubmitting(false);
    }
  }

  async function handleExit() {
    // Navigate to /subjects — attempt stays in_progress, user can resume from dashboard
    router.push("/subjects");
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Main question column (Top is 100% clean, question starts immediately) ── */}
      <div className="flex-1 space-y-3 min-w-0 pb-36 lg:pb-0">

        {/* ── Desktop Header: title below border (Hidden on mobile) ── */}
        <div className="hidden lg:block border-b border-border/60 pb-2">
          <h1 className="font-semibold text-lg tracking-tight text-foreground font-hindi">
            {testSet?.name}
          </h1>
        </div>

        {/* ── Test Paused Full Overlay ── */}
        {isPaused ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4 my-4 animate-in fade-in-0 duration-150">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit mx-auto">
              <Pause className="h-8 w-8" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-1">
                <span>Paused at Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <h2 className="text-xl font-bold text-foreground font-hindi">
                {testSet?.name || "Test Paused"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your answers and timer are securely saved. Remaining time:{" "}
                <span className="font-mono font-bold text-foreground">
                  {formatTime(remainingSeconds)}
                </span>{" "}
                · Progress:{" "}
                <span className="font-semibold text-foreground">
                  {answeredCount} answered, {questions.length - answeredCount} remaining
                </span>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={resume}
                className="w-full sm:w-auto rounded-xl px-6 font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-md"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Resume Test</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmExitOpen(true)}
                className="w-full sm:w-auto rounded-xl px-5 font-semibold text-xs h-10 border-border hover:bg-muted text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
              >
                <DoorOpen className="h-4 w-4" />
                <span>Exit &amp; Save for Later</span>
              </Button>
            </div>
          </div>
        ) : (
          /* ── Active question (Maximized screen space, starts directly at top on mobile) ── */
          enrichedCurrent && Renderer && (
            <QuestionShell
              number={currentIndex + 1}
              type={enrichedCurrent.type}
              questionText={enrichedCurrent.questionText}
              isBookmarked={bookmarkedIds.has(enrichedCurrent._id)}
              onToggleBookmark={() => toggleBookmark(enrichedCurrent._id)}
              reference={enrichedCurrent.reference}
              meta={enrichedCurrent.meta}
            >
              <Renderer
                question={enrichedCurrent}
                selected={getQuestionAnswer(enrichedCurrent, localAnswers)}
                onSelect={(value) => selectAnswer(enrichedCurrent._id, value)}
                mode="quiz"
              />
            </QuestionShell>
          )
        )}

        {/* ── Fixed Mobile Bottom Control Dock: Header Strip + Navigation Controls ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-border bg-card/95 backdrop-blur-md px-3.5 pt-2 pb-2.5 shadow-xl safe-bottom space-y-2">
          {/* Tier 1: Header Strip — Only rendered when palette is closed to avoid duplicate controls */}
          {!paletteOpen && (
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h1
                className="font-semibold text-xs text-foreground font-hindi truncate min-w-0 flex-1 pr-1"
                title={testSet?.name}
              >
                {testSet?.name}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Pause / Resume Button Capsule */}
                <button
                  type="button"
                  onClick={() => (isPaused ? resume() : pause())}
                  className={cn(
                    "h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0",
                    isPaused
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "border-border/80 bg-muted/50 hover:bg-muted text-foreground"
                  )}
                  title={isPaused ? "Resume Test" : "Pause Test"}
                  aria-label={isPaused ? "Resume Test" : "Pause Test"}
                >
                  {isPaused ? (
                    <Play className="h-3 w-3 fill-current" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                </button>

                {/* Compact Alternating Timer Capsule (Fixed Dimensions: min-w-[80px]) */}
                <button
                  type="button"
                  onClick={() => setTimerDisplayMode((prev) => (prev === "time" ? "status" : "time"))}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 h-7 px-2 rounded-lg font-mono text-[11px] font-bold tabular-nums shrink-0 transition-colors border select-none cursor-pointer",
                    isPaused
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      : remainingSeconds < 120
                      ? "bg-destructive/15 text-destructive border-destructive/30 animate-pulse"
                      : "bg-muted/50 text-foreground border-border/80 hover:bg-muted"
                  )}
                  style={{ width: "80px", minWidth: "80px" }}
                  title={isPaused ? "Test Paused" : "Click to toggle Time / Status"}
                  aria-label="Timer capsule"
                >
                  {isPaused ? (
                    <>
                      <Pause className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="tracking-tight text-[10px] font-extrabold">PAUSED</span>
                    </>
                  ) : remainingSeconds < 120 || timerDisplayMode === "time" ? (
                    <>
                      <Clock className="h-3 w-3 text-primary shrink-0" aria-hidden="true" />
                      <span className="tabular-nums tracking-tight">{formatTime(remainingSeconds)}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="tabular-nums tracking-tight text-[10px]">
                        {Math.ceil(remainingSeconds / 60)}m left
                      </span>
                    </>
                  )}
                </button>

                {/* Exit Test Button Capsule */}
                <button
                  type="button"
                  onClick={() => setConfirmExitOpen(true)}
                  className="h-7 w-7 rounded-lg border border-border/80 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Exit Test"
                  aria-label="Exit Test"
                >
                  <DoorOpen className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Tier 2: Question Navigation Action Bar (Prev + Modern Capsule + Next/Submit) */}
          <div className="flex items-center justify-between gap-2.5 pt-1 border-t border-border/40">
            {/* Previous Button — Disabled when paused */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={isPaused || currentIndex === 0}
              className="h-9 px-3 font-semibold text-xs rounded-xl border-border/80 bg-background hover:bg-muted cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous question"
            >
              <ChevronLeft className="h-4 w-4 mr-0.5" />
              Prev
            </Button>

            {/* Modern Question Navigation Capsule */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl border border-border/80 bg-muted/70 hover:bg-muted text-foreground text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-2xs min-w-0"
              aria-label="Open question navigation palette"
              title="Open Question Palette"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
              <span className="tabular-nums font-mono font-bold tracking-tight text-foreground">
                {currentIndex + 1}/{questions.length}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full tabular-nums shrink-0">
                {answeredCount}✓
              </span>
            </button>

            {/* Next or Submit Button — Disabled when paused */}
            {isLastQuestion ? (
              <Button
                size="sm"
                onClick={() => setConfirmSubmitOpen(true)}
                disabled={isPaused || isSubmitting}
                className="h-9 px-3.5 sm:px-4 font-bold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0 gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden="true" />
                    <span>Submitting...</span>
                  </span>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Submit</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={isPaused}
                className="h-9 px-3.5 font-semibold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next question"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            )}
          </div>
        </div>

        {/* ── Redesigned Question Navigation Panel with Full Quiz Header Inside ── */}
        {paletteOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden animate-in fade-in-0 duration-200"
              onClick={() => setPaletteOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Question Navigation Palette"
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden rounded-t-3xl border-t border-border bg-card p-4 pb-6 shadow-2xl safe-bottom max-h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-250"
            >
              {/* Drag Handle */}
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30 mx-auto mb-3 shrink-0" />

              {/* ── Section 1: Full Quiz Header (Spacious layout with natural wrapping) ── */}
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 mb-3 shrink-0 space-y-3">
                {/* Row A: Test Name (Natural wrapping) + Close X Button */}
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold text-sm sm:text-base text-foreground font-hindi leading-snug flex-1">
                    {testSet?.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(false)}
                    className="h-8 w-8 rounded-xl border border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-2xs"
                    aria-label="Close question navigation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Row B: Spacious Action Controls (Pause / Resume, Timer Capsule, Exit) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  {/* Pause / Resume Button with clear label */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => (isPaused ? resume() : pause())}
                    className={cn(
                      "h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shrink-0 border-border/80",
                      isPaused
                        ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                        : "bg-card hover:bg-muted text-foreground"
                    )}
                  >
                    {isPaused ? (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </>
                    )}
                  </Button>

                  {/* Timer Capsule with Stable Dimensions */}
                  <div
                    onClick={() => setTimerDisplayMode((prev) => (prev === "time" ? "status" : "time"))}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl font-mono text-xs font-bold tabular-nums shrink-0 transition-colors border select-none cursor-pointer",
                      isPaused
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : remainingSeconds < 120
                        ? "bg-destructive/15 text-destructive border-destructive/30 animate-pulse"
                        : "bg-card text-foreground border-border/80 hover:bg-muted"
                    )}
                    style={{ minWidth: "96px" }}
                    title={isPaused ? "Test Paused" : "Click to toggle Time / Status"}
                  >
                    {isPaused ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="tracking-tight text-[11px] font-extrabold">PAUSED</span>
                      </>
                    ) : remainingSeconds < 120 || timerDisplayMode === "time" ? (
                      <>
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                        <span className="tabular-nums tracking-tight">{formatTime(remainingSeconds)}</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="tabular-nums tracking-tight text-[11px]">
                          {Math.ceil(remainingSeconds / 60)}m left
                        </span>
                      </>
                    )}
                  </div>

                  {/* Exit Button with clear label */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmExitOpen(true)}
                    className="h-8 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 border-border/80 bg-card hover:bg-destructive/5 gap-1.5 cursor-pointer shrink-0"
                  >
                    <DoorOpen className="h-3.5 w-3.5" />
                    <span>Exit</span>
                  </Button>
                </div>
              </div>

              {/* ── Section 2: Question Navigation Header & Solved Progress ── */}
              <div className="flex items-center justify-between pb-2 shrink-0">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Question Palette
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                    {answeredCount} of {questions.length} answered ({Math.round((answeredCount / (questions.length || 1)) * 100)}%)
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full tabular-nums">
                  {answeredCount}/{questions.length} Solved
                </span>
              </div>

              {/* ── Section 3: Status Legend ── */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground py-2 border-y border-border/60 px-1 shrink-0 select-none flex-wrap gap-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-primary shrink-0" />
                  <span>Current</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500/30 border border-emerald-500/60 shrink-0" />
                  <span>Answered</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-muted border border-border shrink-0" />
                  <span>Unanswered</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Flagged</span>
                </span>
              </div>

              {/* Pause Warning Inside Sheet */}
              {isPaused && (
                <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Pause className="h-3.5 w-3.5 shrink-0" />
                    <span>Test is paused. Resume to jump to questions.</span>
                  </span>
                  <Button
                    size="sm"
                    onClick={resume}
                    className="h-6 px-2 text-[10px] font-bold rounded-lg bg-amber-500 text-black hover:bg-amber-400 shrink-0 cursor-pointer"
                  >
                    Resume Now
                  </Button>
                </div>
              )}

              {/* ── Section 4: Grid of Rounded Question Buttons ── */}
              <div className="overflow-y-auto py-3 max-h-[45vh] overscroll-contain">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, i) => {
                    const isCurrent = i === currentIndex;
                    const isAnswered = answeredSet.has(q._id);
                    const isBookmarked = bookmarkedIds.has(q._id);

                    return (
                      <button
                        key={q._id}
                        type="button"
                        disabled={isPaused}
                        onClick={() => {
                          if (isPaused) return;
                          setCurrentIndex(i);
                          setPaletteOpen(false);
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center h-11 rounded-xl text-xs font-bold transition-all select-none shadow-2xs border",
                          isPaused
                            ? "opacity-50 cursor-not-allowed border-border/60 bg-muted/30"
                            : isCurrent
                            ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30 cursor-pointer active:scale-95"
                            : isAnswered
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer active:scale-95"
                            : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground cursor-pointer active:scale-95"
                        )}
                        aria-label={`Jump to question ${i + 1}`}
                      >
                        <span className="tabular-nums font-mono text-[13px]">{i + 1}</span>
                        {isBookmarked && (
                          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
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

          {/* Question Palette grid — disabled when paused */}
          <QuestionPalette
            questions={paletteQuestions}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
            disabled={isPaused}
          />

          {/* Navigation controls + Submit — Disabled when paused */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={isPaused || currentIndex === 0}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous question"
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={isPaused || isLastQuestion}
                className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next question"
              >
                Next →
              </Button>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={isPaused || isSubmitting}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmExitOpen(true)}
              className="w-full h-8 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              <DoorOpen className="h-3.5 w-3.5" />
              Exit Test
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

      {/* Exit Test confirmation dialog */}
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
