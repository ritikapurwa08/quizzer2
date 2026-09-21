"use client";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type RangeDays = 7 | 15 | 30;

interface AnalyticsHeaderProps {
  rangeDays: RangeDays;
  onRangeChange: (days: RangeDays) => void;
}

const RANGE_OPTIONS: { label: string; value: RangeDays; sublabel: string }[] = [
  { label: "7 Days", value: 7, sublabel: "7D" },
  { label: "15 Days", value: 15, sublabel: "15D" },
  { label: "30 Days", value: 30, sublabel: "30D" },
];

export function AnalyticsHeader({ rangeDays, onRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics & Progress" }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Analytics & Progress
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Track your study consistency, subject-wise accuracy, and test score improvements.
          </p>
        </div>

        {/* Date range filter selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border/80">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1.5 hidden xs:inline" />
          <div className="flex items-center gap-1">
            {RANGE_OPTIONS.map((opt) => {
              const active = rangeDays === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onRangeChange(opt.value)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer select-none",
                    active
                      ? "bg-background text-foreground shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                  aria-pressed={active}
                >
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
