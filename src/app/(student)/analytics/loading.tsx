import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-9 w-60 rounded-md" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card className="rounded-md border border-border bg-card p-5 h-96 flex flex-col justify-between">
          <Skeleton className="h-6 w-40 rounded-md" />
          <div className="h-48 w-48 rounded-full border border-border mx-auto animate-pulse" />
          <Skeleton className="h-4 w-full rounded-md opacity-60" />
        </Card>
        <Card className="rounded-md border border-border bg-card p-5 h-96 flex flex-col justify-between">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md opacity-60" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <Card className="rounded-md border border-border bg-card p-5 h-96 flex flex-col justify-between">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md opacity-60" />
        </Card>
        <Card className="rounded-md border border-border bg-card p-5 h-96 flex flex-col justify-between">
          <Skeleton className="h-6 w-40 rounded-md" />
          <div className="h-48 w-48 rounded-full border border-border mx-auto animate-pulse" />
          <Skeleton className="h-4 w-full rounded-md opacity-60" />
        </Card>
      </div>
    </div>
  );
}
