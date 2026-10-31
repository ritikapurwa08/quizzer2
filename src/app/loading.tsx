import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col justify-center items-center p-6 space-y-4">
      <div className="h-10 w-10 rounded-2xl border border-border bg-card animate-pulse" />
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-3 w-28 rounded opacity-70" />
    </div>
  );
}

