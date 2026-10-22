"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className={cn("flex items-center justify-center gap-3 py-2", className)}>
      <Button
        id="pagination-prev"
        type="button"
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={page === 0}
        className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Previous
      </Button>

      <span className="text-xs font-semibold text-muted-foreground tabular-nums select-none">
        {label ?? `Page ${page + 1}`}
      </span>

      <Button
        id="pagination-next"
        type="button"
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={isLastPage}
        className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
