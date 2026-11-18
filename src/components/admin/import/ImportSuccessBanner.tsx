"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Play, Plus } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

export interface ImportSuccessBannerProps {
  lastImportedSet: {
    id: Id<"testSets">;
    count: number;
    timeSeconds: number;
  };
  onDismiss: () => void;
}

export function ImportSuccessBanner({
  lastImportedSet,
  onDismiss,
}: ImportSuccessBannerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-success/15 border border-success/30 text-success animate-in fade-in-0 slide-in-from-top-2 duration-200 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div className="text-sm font-medium">
          <span className="font-bold">✓ {lastImportedSet.count} questions imported successfully</span>{" "}
          <span className="text-xs opacity-80">({lastImportedSet.timeSeconds}s)</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Link
          href={`/quiz/${lastImportedSet.id}`}
          className="flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-success text-success-foreground hover:bg-success/90 transition-colors shadow-xs"
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Take Test Now →
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="h-8 text-xs font-semibold rounded-xl border-success/40 text-success hover:bg-success/10 gap-1.5"
        >
          <Plus className="h-3 w-3" /> Add Next Set
        </Button>
      </div>
    </div>
  );
}
