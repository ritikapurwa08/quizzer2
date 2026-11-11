"use client";

import { Button } from "@/components/ui/button";
import { X, Play, Pause, Clock, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "./quizHelpers";

interface MobileQuestionPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  testSetName?: string;
  questions: any[];
  currentIndex: number;
  answeredIndices: Set<number>;
  bookmarkedIds: Set<string>;
  isPaused: boolean;
  remainingSeconds: number;
  timerDisplayMode: "time" | "status";
  onToggleTimerMode: () => void;
  onPause: () => void;
  onResume: () => void;
  onExit: () => void;
  onJumpToQuestion: (index: number) => void;
}

export function MobileQuestionPaletteModal({
  isOpen,
  onClose,
  testSetName,
  questions,
  currentIndex,
  answeredIndices,
  bookmarkedIds,
  isPaused,
  remainingSeconds,
  timerDisplayMode,
  onToggleTimerMode,
  onPause,
  onResume,
  onExit,
  onJumpToQuestion,
}: MobileQuestionPaletteModalProps) {
  if (!isOpen) return null;

  const answeredCount = answeredIndices.size;
  const percentageSolved = Math.round((answeredCount / (questions.length || 1)) * 100);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden animate-in fade-in-0 duration-200"
        onClick={onClose}
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
              {testSetName}
            </h2>
            <button
              type="button"
              onClick={onClose}
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
              onClick={isPaused ? onResume : onPause}
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
              onClick={onToggleTimerMode}
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
              onClick={onExit}
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
              {answeredCount} of {questions.length} answered ({percentageSolved}%)
            </p>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full tabular-nums">
            {answeredCount}/{questions.length} Solved
          </span>
        </div>

        {/* ── Section 3: Status Legend ── */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground py-2 border-y border-border/60 px-1 shrink-0 select-none flex-wrap gap-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span>Current</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/25 border border-primary/50 shrink-0" />
            <span>Answered</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted border border-border shrink-0" />
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
              onClick={onResume}
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
              const qKey = q.canonicalId || q._id || q.convexId || q.id || `q_idx_${i}`;
              const isCurrent = i === currentIndex;
              const isAnswered = answeredIndices.has(i);
              const isBookmarked =
                bookmarkedIds.has(qKey) ||
                Boolean(q._id && bookmarkedIds.has(q._id)) ||
                Boolean(q.convexId && bookmarkedIds.has(q.convexId)) ||
                Boolean(q.canonicalId && bookmarkedIds.has(q.canonicalId));

              return (
                <button
                  key={qKey}
                  type="button"
                  disabled={isPaused}
                  onClick={() => {
                    if (isPaused) return;
                    onJumpToQuestion(i);
                    onClose();
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-11 rounded-xl text-xs font-bold transition-all select-none shadow-2xs border",
                    isPaused
                      ? "opacity-50 cursor-not-allowed border-border/60 bg-muted/30"
                      : isCurrent
                        ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30 cursor-pointer active:scale-95"
                        : isAnswered
                          ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/15 hover:border-primary/40 cursor-pointer active:scale-95"
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
  );
}

