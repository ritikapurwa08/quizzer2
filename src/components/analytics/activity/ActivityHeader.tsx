"use client";

import { CheckCircle2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityHeaderProps {
  viewMode: "daily" | "recent";
  onViewModeChange: (mode: "daily" | "recent") => void;
  cumulativeMastered: number;
  totalQuestionBank: number;
  activeDays: number;
  rangeDays: number;
}

export function ActivityHeader({
  viewMode,
  onViewModeChange,
  cumulativeMastered,
  totalQuestionBank,
  activeDays,
  rangeDays,
}: ActivityHeaderProps) {
  const coveragePercent = totalQuestionBank > 0
    ? ((cumulativeMastered / totalQuestionBank) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="p-4 sm:p-5 pb-3 border-b border-border/50 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Monotonic Cumulative Progress (Never goes down) */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">
                {cumulativeMastered.toLocaleString("en-IN")} / {totalQuestionBank.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Mastered ({coveragePercent}%)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cumulative mastery · Every correct answer permanently advances your syllabus progress
            </p>
          </div>
        </div>

        {/* View Mode Switcher: Daily | Recent Tests */}
        <div className="inline-flex items-center p-0.5 rounded-md bg-muted/60 border border-border gap-0.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("daily")}
            className={cn(
              "h-7 px-3 text-xs font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap border select-none",
              viewMode === "daily"
                ? "bg-card text-foreground font-bold shadow-2xs border-border"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
            )}
          >
            Daily Activity
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("recent")}
            className={cn(
              "h-7 px-3 text-xs font-semibold rounded-sm transition-all cursor-pointer whitespace-nowrap border select-none",
              viewMode === "recent"
                ? "bg-card text-foreground font-bold shadow-2xs border-border"
                : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
            )}
          >
            Recent Tests
          </button>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, Number(coveragePercent)))}%` }}
        />
      </div>
    </div>
  );
}
