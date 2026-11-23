"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

export type ReviewFilter = "all" | "correct" | "incorrect" | "unattempted";

interface QuestionReviewFilterProps {
  value: ReviewFilter;
  onChange: (filter: ReviewFilter) => void;
  counts: {
    all: number;
    correct: number;
    incorrect: number;
    unattempted: number;
  };
  className?: string;
}

/**
 * Authoritative 4-option Select Dropdown for the Question Review section:
 * All Questions | Correct | Incorrect | Unattempted
 */
export function QuestionReviewFilter({
  value,
  onChange,
  counts,
  className,
}: QuestionReviewFilterProps) {
  return (
    <div className={cn("shrink-0", className)}>
      <Select
        value={value}
        onValueChange={(val: string | null) => {
          if (val) onChange(val as ReviewFilter);
        }}
      >
        <SelectTrigger
          className="h-9 w-full sm:w-56 rounded-md border border-border bg-card hover:bg-card/90 px-3 text-xs font-semibold transition-colors shadow-2xs cursor-pointer select-none gap-2 min-w-0"
          aria-label="Filter Question Review"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {value === "all" && (
              <>
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">All Questions</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-muted text-foreground tabular-nums">
                  {counts.all}
                </span>
              </>
            )}
            {value === "correct" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="truncate text-emerald-600 dark:text-emerald-400">Correct Answers</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {counts.correct}
                </span>
              </>
            )}
            {value === "incorrect" && (
              <>
                <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span className="truncate text-rose-600 dark:text-rose-400">Incorrect Only</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 tabular-nums">
                  {counts.incorrect}
                </span>
              </>
            )}
            {value === "unattempted" && (
              <>
                <HelpCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate text-amber-600 dark:text-amber-400">Unattempted</span>
                <span className="ml-auto px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 tabular-nums">
                  {counts.unattempted}
                </span>
              </>
            )}
          </div>
        </SelectTrigger>

        <SelectContent
          align="end"
          className="bg-popover border border-border shadow-xl rounded-md min-w-56 p-1.5"
        >
          {/* 1. All Questions */}
          <SelectItem
            value="all"
            className="cursor-pointer text-xs font-medium py-2 rounded-md"
          >
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium text-foreground">All Questions</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-muted text-foreground tabular-nums">
                {counts.all}
              </span>
            </div>
          </SelectItem>

          {/* 2. Correct */}
          <SelectItem
            value="correct"
            className="cursor-pointer text-xs font-medium py-2 rounded-md"
          >
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span className="font-semibold">Correct Answers</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 tabular-nums">
                {counts.correct}
              </span>
            </div>
          </SelectItem>

          {/* 3. Incorrect */}
          <SelectItem
            value="incorrect"
            className="cursor-pointer text-xs font-medium py-2 rounded-md"
          >
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span className="font-semibold">Incorrect (Review)</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 tabular-nums">
                {counts.incorrect}
              </span>
            </div>
          </SelectItem>

          {/* 4. Unattempted */}
          <SelectItem
            value="unattempted"
            className="cursor-pointer text-xs font-medium py-2 rounded-md"
          >
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <HelpCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="font-semibold">Unattempted</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 tabular-nums">
                {counts.unattempted}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
