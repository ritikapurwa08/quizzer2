import { Card } from "@/components/ui/card";

export function QuestionShellSkeleton() {
  return (
    <Card className="p-3.5 sm:p-5 space-y-4 animate-pulse">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted" />
          <div className="h-5 w-24 rounded-md bg-muted" />
        </div>
        <div className="h-7 w-20 rounded-lg bg-muted" />
      </div>

      {/* Question text placeholder */}
      <div className="space-y-2 mb-4">
        <div className="h-5 w-11/12 rounded bg-muted" />
        <div className="h-5 w-3/4 rounded bg-muted" />
      </div>

      {/* Option Buttons placeholders */}
      <div className="space-y-2.5">
        <div className="h-12 w-full rounded-xl bg-muted/70" />
        <div className="h-12 w-full rounded-xl bg-muted/70" />
        <div className="h-12 w-full rounded-xl bg-muted/70" />
        <div className="h-12 w-full rounded-xl bg-muted/70" />
      </div>
    </Card>
  );
}
