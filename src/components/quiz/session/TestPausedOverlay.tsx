"use client";

import { Button } from "@/components/ui/button";
import { Pause, Play, DoorOpen } from "lucide-react";
import { formatTime } from "./quizHelpers";

interface TestPausedOverlayProps {
  testSetName?: string;
  currentIndex: number;
  totalQuestions: number;
  remainingSeconds: number;
  answeredCount: number;
  onResume: () => void;
  onExit: () => void;
}

export function TestPausedOverlay({
  testSetName,
  currentIndex,
  totalQuestions,
  remainingSeconds,
  answeredCount,
  onResume,
  onExit,
}: TestPausedOverlayProps) {
  const remainingQuestions = Math.max(0, totalQuestions - answeredCount);

  return (
    <div className="rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4 my-4 animate-in fade-in-0 duration-150">
      <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 w-fit mx-auto">
        <Pause className="h-8 w-8" />
      </div>
      <div className="space-y-1.5 max-w-md mx-auto">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-1">
          <span>Paused at Question {currentIndex + 1} of {totalQuestions}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground font-hindi">
          {testSetName || "Test Paused"}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your answers and timer are securely saved. Remaining time:{" "}
          <span className="font-mono font-bold text-foreground">
            {formatTime(remainingSeconds)}
          </span>{" "}
          · Progress:{" "}
          <span className="font-semibold text-foreground">
            {answeredCount} answered, {remainingQuestions} remaining
          </span>.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          onClick={onResume}
          className="w-full sm:w-auto rounded-xl px-6 font-bold text-xs h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer shadow-md"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Resume Test</span>
        </Button>
        <Button
          variant="outline"
          onClick={onExit}
          className="w-full sm:w-auto rounded-xl px-5 font-semibold text-xs h-10 border-border hover:bg-muted text-muted-foreground hover:text-foreground gap-2 cursor-pointer"
        >
          <DoorOpen className="h-4 w-4" />
          <span>Exit &amp; Save for Later</span>
        </Button>
      </div>
    </div>
  );
}
