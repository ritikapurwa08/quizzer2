"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Layers, AlertCircle, Sparkles } from "lucide-react";

interface LivePoolStatusStripProps {
  loadingCandidates: boolean;
  totalPoolCount?: number;
  importedCount?: number;
  remainingCount?: number;
  isComplete?: boolean;
  activeTopicName?: string;
  activeSubTopicName?: string;
}

export function LivePoolStatusStrip({
  loadingCandidates,
  totalPoolCount = 0,
  importedCount = 0,
  remainingCount = 0,
  isComplete = false,
  activeTopicName = "",
  activeSubTopicName = "",
}: LivePoolStatusStripProps) {
  if (!activeTopicName) return null;

  const effectiveRemaining = isComplete ? 0 : remainingCount;
  const effectiveImported = isComplete ? totalPoolCount : importedCount;
  const percentComplete =
    totalPoolCount > 0
      ? Math.min(100, Math.round((effectiveImported / totalPoolCount) * 100))
      : isComplete
      ? 100
      : 0;

  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 p-3 space-y-2 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate">
            {activeTopicName}
            {activeSubTopicName && (
              <span className="text-primary font-normal"> › {activeSubTopicName}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <Badge
              variant="outline"
              className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px] py-0 px-2 font-bold"
            >
              ✓ 100% Imported
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-primary border-primary/30 bg-primary/10 text-[10px] py-0 px-2 font-semibold"
            >
              {percentComplete}% Complete
            </Badge>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/30 text-center sm:text-left">
        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            कुल प्रश्न (Pool)
          </span>
          <span className="font-bold text-foreground text-xs">
            {loadingCandidates ? "..." : totalPoolCount}
          </span>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            इम्पोर्टेड (Filtered)
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            {loadingCandidates ? "..." : effectiveImported}
          </span>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            शेष (Remaining)
          </span>
          <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
            {loadingCandidates ? "..." : effectiveRemaining}
          </span>
        </div>
      </div>
    </div>
  );
}
