import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function SavedQuestionsLoading() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-72 rounded-md opacity-70" />
        </div>
        <Skeleton className="h-9 w-60 rounded-md" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5 rounded-md border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-8 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full rounded-md" />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
