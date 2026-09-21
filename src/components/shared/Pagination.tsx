"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  /** Current 0-based page index. */
  page: number;
  onPrev: () => void;
  onNext: () => void;
  /** True when there is no next page. */
  isLastPage: boolean;
  /** Human-readable page label (e.g., "पृष्ठ 2"). If omitted, shows page number. */
  label?: string;
  className?: string;
}

export function Pagination({
  page,
  onPrev,
  onNext,
  isLastPage,
  label,
  className,
}: PaginationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-2",
        className,
      )}
    >
      <button
        id="pagination-prev"
        type="button"
        onClick={onPrev}
        disabled={page === 0}
        className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </button>

      <span className="text-xs font-semibold text-muted-foreground tabular-nums select-none">
        {label ?? `Page ${page + 1}`}
      </span>

      <button
        id="pagination-next"
        type="button"
        onClick={onNext}
        disabled={isLastPage}
        className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/60 hover:border-primary/40 transition-all disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
