import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TestPageSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-stretch gap-6 w-full pt-1">
      {/* ── Main question column skeleton ── */}
      <div className="flex-1 space-y-3 min-w-0 pb-20 lg:pb-0 min-h-[580px] w-full">
        {/* Top Header & Progress skeleton */}
        <div className="border-b border-border/60 pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 sm:w-64 rounded-sm" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-16 shrink-0 rounded-xs" />
          </div>
        </div>

        {/* Question Card Skeleton */}
        <Card className="p-3.5 sm:p-5 space-y-4 rounded-md border border-border bg-card shadow-xs">
          {/* Header row: Number + Tag + Flag */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-xs" />
            </div>
            <Skeleton className="h-7 w-16 rounded-sm" />
          </div>

          {/* Question Text Prompt */}
          <div className="space-y-2 py-1">
            <Skeleton className="h-5 w-full rounded-xs" />
            <Skeleton className="h-5 w-11/12 rounded-xs" />
            <Skeleton className="h-5 w-3/4 rounded-xs" />
          </div>

          {/* 4 Option Buttons matching exact runner height and radius */}
          <div className="space-y-2.5 pt-1">
            {["A", "B", "C", "D"].map((opt) => (
              <div
                key={opt}
                className="w-full h-12 p-3 rounded-sm border border-border/70 bg-secondary/40 flex items-center gap-3 animate-pulse"
              >
                <div className="h-6 w-6 rounded-xs bg-muted/80 flex items-center justify-center text-[11px] font-bold text-muted-foreground/50">
                  {opt}
                </div>
                <Skeleton className="h-4 w-3/5 rounded-xs" />
              </div>
            ))}
          </div>
        </Card>

        {/* Bottom Control Dock Skeleton */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Skeleton className="h-9 w-24 rounded-sm" />
          <Skeleton className="h-9 w-32 rounded-sm" />
          <Skeleton className="h-9 w-24 rounded-sm" />
        </div>
      </div>

      {/* Desktop Sidebar Question Palette Skeleton */}
      <div className="hidden lg:block w-72 shrink-0 space-y-4">
        <div className="rounded-md border border-border bg-card/60 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-xs" />
            <Skeleton className="h-4 w-12 rounded-xs" />
          </div>
          <div className="grid grid-cols-5 gap-2 pt-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-xs" />
            ))}
          </div>
          <div className="pt-3 border-t border-border/50">
            <Skeleton className="h-9 w-full rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

