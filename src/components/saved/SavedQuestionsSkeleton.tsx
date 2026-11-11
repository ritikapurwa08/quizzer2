import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SavedQuestionsSkeleton() {
  return (
    <div className="space-y-6">
      {/* ── Top Header Row Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-56 sm:w-72 rounded-sm" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded-xs" />
        </div>

        {/* Segmented Tab Switcher Skeleton */}
        <div className="inline-flex items-center p-0.5 rounded-sm bg-secondary border border-border self-start sm:self-auto gap-1">
          <Skeleton className="h-8 w-28 rounded-xs" />
          <Skeleton className="h-8 w-28 rounded-xs" />
        </div>
      </div>

      {/* ── Filter Bar Skeleton ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="inline-flex items-center gap-1 bg-secondary/60 p-0.5 rounded-sm border border-border max-w-full overflow-x-auto no-scrollbar">
          <Skeleton className="h-8 w-36 sm:w-44 rounded-xs" />
          <Skeleton className="h-8 w-36 sm:w-44 rounded-xs" />
        </div>
        <Skeleton className="h-4 w-28 rounded-xs self-end sm:self-auto" />
      </div>

      {/* ── 3 Question Cards Skeletons ── */}
      <div className="space-y-4">
        {[1, 2, 3].map((idx) => (
          <Card
            key={idx}
            className="p-4 sm:p-5 rounded-md border border-border bg-card shadow-xs space-y-4 select-none"
          >
            {/* Header: Question number + Type tag + Flag/Save badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-5 w-28 rounded-xs" />
              </div>
              <Skeleton className="h-6 w-20 rounded-xs" />
            </div>

            {/* Question Text Prompt */}
            <div className="space-y-2 py-1">
              <Skeleton className="h-5 w-full rounded-xs" />
              <Skeleton className="h-5 w-4/5 rounded-xs" />
            </div>

            {/* 4 Option Rows */}
            <div className="space-y-2 pt-1">
              {["A", "B", "C", "D"].map((opt) => (
                <div
                  key={opt}
                  className="w-full h-11 p-2.5 rounded-xs border border-border/70 bg-secondary/30 flex items-center gap-3 animate-pulse"
                >
                  <div className="h-6 w-6 rounded-xs bg-muted/80 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50">
                    {opt}
                  </div>
                  <Skeleton className="h-4 w-1/2 rounded-xs" />
                </div>
              ))}
            </div>

            {/* Explanation box skeleton */}
            <div className="pt-2 border-t border-border/40">
              <Skeleton className="h-14 w-full rounded-xs" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

