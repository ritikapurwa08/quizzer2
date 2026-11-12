"use client";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RangeDays = 1 | 7 | 15 | 30 | 60 | 90 | 365;

interface AnalyticsHeaderProps {
  rangeDays: RangeDays;
  onRangeChange: (days: RangeDays) => void;
}

export const RANGE_OPTIONS: { label: string; value: RangeDays; sublabel: string }[] = [
  { label: "Today", value: 1, sublabel: "1D" },
  { label: "Last 7 Days", value: 7, sublabel: "7D" },
  { label: "Last 15 Days", value: 15, sublabel: "15D" },
  { label: "Last 30 Days", value: 30, sublabel: "30D" },
  { label: "Last 60 Days", value: 60, sublabel: "60D" },
  { label: "Last 90 Days", value: 90, sublabel: "90D" },
  { label: "Overall (All Time)", value: 365, sublabel: "All" },
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

        {/* Date range filter select */}
        <div className="self-start sm:self-auto shrink-0">
          <Select
            value={String(rangeDays)}
            onValueChange={(val: string | null) => {
              if (val) onRangeChange(Number(val) as RangeDays);
            }}
          >
            <SelectTrigger
              className="h-9 w-44 sm:w-50 rounded-xl border border-border bg-card hover:bg-card/90 px-3 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer select-none gap-2"
              aria-label="Filter Date Range"
            >
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                <SelectValue placeholder="Select Range" className="truncate">
                  {(selectedValue: any) => {
                    const opt = RANGE_OPTIONS.find(
                      (o) => String(o.value) === String(selectedValue ?? rangeDays)
                    );
                    return opt?.label ?? `${rangeDays} Days`;
                  }}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent
              align="end"
              className="bg-popover border border-border shadow-xl rounded-xl min-w-44 p-1"
            >
              {RANGE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                  className="cursor-pointer text-xs font-medium py-2 rounded-lg"
                >
                  <span className="font-medium text-foreground">{opt.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
