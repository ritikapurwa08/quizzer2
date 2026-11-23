import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function HistoryLoading() {
  return (
    <div className="space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-40 rounded-md" />
          <Skeleton className="h-4 w-60 rounded-md opacity-70" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-3.5 sm:p-4 rounded-md border border-border bg-card flex items-center justify-between">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md opacity-60" />
            </div>
            <Skeleton className="h-6 w-16 rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  );
}
