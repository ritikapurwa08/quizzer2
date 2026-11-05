"use client";

import { Card } from "@/components/ui/card";
import type { SyllabusScope } from "./syllabusTypes";

interface SyllabusProgressBannerProps {
  scope: SyllabusScope;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  progressPercent: number;
  isClient: boolean;
}

export function SyllabusProgressBanner({
  scope,
  totalCount,
  completedCount,
  pendingCount,
  progressPercent,
  isClient,
}: SyllabusProgressBannerProps) {
  const scopeLabel =
    scope === "rajasthan_gk"
      ? "Rajasthan GK Total"
      : scope === "english"
      ? "English Total"
      : "Combined Total";

  const progressTitle =
    scope === "rajasthan_gk"
      ? "Rajasthan GK Preparation Progress"
      : scope === "english"
      ? "English Preparation Progress"
      : "Total Syllabus Completion";

  return (
    <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs bg-card space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {scopeLabel}
          </span>
          <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
            {totalCount} Topics
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Completed
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-500 tabular-nums">
            {isClient ? completedCount : "—"}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Remaining
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">
            {isClient ? pendingCount : "—"}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Prepared
          </span>
          <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">
            {isClient ? `${progressPercent}%` : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
          <span>{progressTitle}</span>
          <span className="font-bold text-foreground tabular-nums">
            {isClient ? `${completedCount} / ${totalCount} (${progressPercent}%)` : "0%"}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${isClient ? progressPercent : 0}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

