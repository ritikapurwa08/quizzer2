import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function QuestionShellSkeleton() {
  return (
    <Card className="p-3.5 sm:p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>

      {/* Question text */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-11/12 rounded" />
        <Skeleton className="h-5 w-3/4 rounded" />
      </div>

      {/* Option buttons */}
      <div className="space-y-2.5">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </Card>
  );
}
