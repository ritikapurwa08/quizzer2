"use client";

import { Button } from "@/components/ui/button";
import { Clock, Play, Pause, DoorOpen, Loader2 } from "lucide-react";
import { QuestionPalette } from "@/components/quiz";
import { cn } from "@/lib/utils";
import { formatTime } from "./quizHelpers";

interface DesktopQuizSidebarProps {
  paletteQuestions: Array<{ id: string; answered: boolean; bookmarked: boolean }>;
  totalQuestions: number;
  answeredCount: number;
  remainingSeconds: number;
  totalDurationSeconds: number;
  currentIndex: number;
  isPaused: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onPause: () => void;
  onResume: () => void;
  onJumpToQuestion: (updater: number | ((prev: number) => number)) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onExit: () => void;
}

export function DesktopQuizSidebar({
  paletteQuestions,
  totalQuestions,
  answeredCount,
  remainingSeconds,
  totalDurationSeconds,
  currentIndex,
  isPaused,
  isLastQuestion,
  isSubmitting,
  onPause,
  onResume,
  onJumpToQuestion,
  onPrev,
  onNext,
  onSubmit,
  onExit,
}: DesktopQuizSidebarProps) {
  return (
    <div className="hidden lg:block w-68 shrink-0">
      <div className="sticky top-20 space-y-3">
        {/* Progress & Timer card */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full tabular-nums">
              {answeredCount} / {totalQuestions} Solved
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
            onClick={isPaused ? onResume : onPause}
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
          onJump={onJumpToQuestion}
          disabled={isPaused}
        />

        {/* Navigation controls + Submit — Disabled when paused */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={isPaused || currentIndex === 0}
              className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous question"
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNext}
              disabled={isPaused || isLastQuestion}
              className="font-semibold text-xs h-10 rounded-xl border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next question"
            >
              Next →
            </Button>
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/30 transition-colors"
            onClick={onSubmit}
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
            onClick={onExit}
            className="w-full h-8 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
          >
            <DoorOpen className="h-3.5 w-3.5" />
            Exit Test
          </Button>
        </div>
      </div>
    </div>
  );
}

