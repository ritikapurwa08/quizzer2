import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-40 rounded" />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 sm:h-8 w-64 sm:w-80 rounded-lg" />
            <Skeleton className="h-4 w-48 sm:w-60 rounded" />
          </div>
          <Skeleton className="h-9 w-44 rounded-xl" />
        </div>
      </div>

      {/* 2x2 grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
            <CardHeader className="p-0 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-44 rounded" />
                  <Skeleton className="h-3.5 w-60 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <Skeleton className="h-[220px] sm:h-[260px] w-full rounded-xl" />
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
