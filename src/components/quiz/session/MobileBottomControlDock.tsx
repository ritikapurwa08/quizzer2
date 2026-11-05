"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, LayoutGrid, CheckCircle2, MinusCircle, Loader2 } from "lucide-react";

interface MobileBottomControlDockProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  isPaused: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenPalette: () => void;
  onSubmit: () => void;
}

export function MobileBottomControlDock({
  currentIndex,
  totalQuestions,
  answeredCount,
  unansweredCount,
  isPaused,
  isLastQuestion,
  isSubmitting,
  onPrev,
  onNext,
  onOpenPalette,
  onSubmit,
}: MobileBottomControlDockProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-border bg-card/95 backdrop-blur-md px-3 sm:px-4 py-2.5 shadow-xl safe-bottom">
      <div className="flex items-center justify-between gap-2 sm:gap-2.5">
        {/* Previous Button — Disabled when paused */}
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={isPaused || currentIndex === 0}
          className="h-10 px-3 sm:px-3.5 font-semibold text-xs rounded-xl border-border/80 bg-background hover:bg-muted cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          aria-label="Previous question"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          Prev
        </Button>

        {/* Modern Expanded Question Navigation Capsule with Attempted & Skipped status */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="inline-flex items-center justify-center gap-2 sm:gap-2.5 h-10 px-3 sm:px-3.5 rounded-2xl border border-border/80 bg-muted/60 hover:bg-muted text-foreground transition-all cursor-pointer select-none active:scale-95 shadow-2xs flex-1 max-w-[240px] min-w-0"
          aria-label="Open question navigation palette"
          title="Open Question Palette"
        >
          {/* Question Index with Grid Icon */}
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs tracking-tight text-foreground shrink-0">
            <LayoutGrid className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>{currentIndex + 1}/{totalQuestions}</span>
          </div>

          <span className="h-3.5 w-px bg-border/80 shrink-0" />

          {/* Attempted Status Badge with CheckCircle2 */}
          <div
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1.5 sm:px-2 py-0.5 rounded-lg tabular-nums shrink-0"
            title={`${answeredCount} Attempted`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{answeredCount}</span>
          </div>

          {/* Skipped / Unanswered Status Badge with MinusCircle */}
          <div
            className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-muted border border-border/80 px-1.5 sm:px-2 py-0.5 rounded-lg tabular-nums shrink-0"
            title={`${unansweredCount} Skipped / Unanswered`}
          >
            <MinusCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>{unansweredCount}</span>
          </div>
        </button>

        {/* Next or Submit Button — Disabled when paused */}
        {isLastQuestion ? (
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isPaused || isSubmitting}
            className="h-10 px-3.5 sm:px-4 font-bold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0 gap-1.5 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={onNext}
            disabled={isPaused}
            className="h-10 px-3.5 font-semibold text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shrink-0 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next question"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

