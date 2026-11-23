import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function SubjectsLoading() {
  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-1">
        <Skeleton className="h-7 w-48 rounded-md" />
        <Skeleton className="h-4 w-80 rounded-md opacity-70" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-5 rounded-md border border-border bg-card h-40 flex flex-col justify-between">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md opacity-60" />
          </Card>
        ))}
      </div>
    </div>
  );
}
