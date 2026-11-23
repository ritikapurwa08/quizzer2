import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-md" />
          <Skeleton className="h-4 w-96 rounded-md opacity-70" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Top 4 stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 sm:p-5 rounded-md border border-border bg-card space-y-2">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-3 w-32 rounded-md opacity-60" />
          </Card>
        ))}
      </div>

      {/* Continue practice */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-md border border-border bg-card p-4 space-y-2.5">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md opacity-70" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
