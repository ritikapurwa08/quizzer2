"use client";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export type RangeDays = 7 | 30 | 90;

interface AnalyticsHeaderProps {
  rangeDays: RangeDays;
  onRangeChange: (days: RangeDays) => void;
}

const RANGE_OPTIONS: { label: string; value: RangeDays; sublabel: string }[] = [
  { label: "7 दिन", value: 7, sublabel: "7D" },
  { label: "30 दिन", value: 30, sublabel: "30D" },
  { label: "90 दिन", value: 90, sublabel: "90D" },
];

export function AnalyticsHeader({ rangeDays, onRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="space-y-4">
      <BreadcrumbNav
        items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "विश्लेषण एवं प्रगति" }]}
      />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
            विश्लेषण एवं प्रगति (Learning Analytics)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-hindi leading-relaxed">
            अपनी अध्ययन निरंतरता, विषयवार सटीकता और टेस्ट स्कोर में सुधार को ट्रैक करें।
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
                    "px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer font-hindi select-none",
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
