"use client";

import { Activity } from "lucide-react";
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
  rangeDays,
}: ActivityHeaderProps) {
  const periodLabel = rangeDays >= 365 ? "All Time" : `Last ${rangeDays} Days`;

  return (
    <div className="p-4 sm:p-5 pb-3 border-b border-border/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Study Activity</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily practice volume &amp; consistency ({periodLabel})
          </p>
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
    </div>
  );
}
