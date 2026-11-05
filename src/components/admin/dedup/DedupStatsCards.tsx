import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ViewMode } from "./types";

interface DedupStatsCardsProps {
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  initialPoolCount?: number;
  mergedDuplicatesCount?: number;
  mergedGroupsCount?: number;
  reviewPairsCount?: number;
  cleanPoolCount?: number;
}

export const DedupStatsCards: React.FC<DedupStatsCardsProps> = ({
  viewMode,
  onSelectViewMode,
  initialPoolCount = 18762,
  mergedDuplicatesCount = 1193,
  mergedGroupsCount = 959,
  reviewPairsCount = 3397,
  cleanPoolCount = 16646,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
        <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
          Total Initial Pool
        </span>
        <p className="text-xl sm:text-2xl font-black text-foreground tabular-nums">
          {initialPoolCount.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">(15.9k GK)</span>
        </p>
      </Card>

      <Card
        onClick={() => onSelectViewMode("groups")}
        className={cn(
          "p-3.5 rounded-xl border bg-card shadow-2xs space-y-1 cursor-pointer transition-all hover:border-emerald-500/50",
          viewMode === "groups" ? "border-emerald-500/80 bg-emerald-500/5" : "border-border/80"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
            Auto-Merged Duplicates
          </span>
          <Badge className="bg-emerald-500/15 text-emerald-500 text-[10px]">Tab 1</Badge>
        </div>
        <p className="text-xl sm:text-2xl font-black text-emerald-500 tabular-nums">
          {mergedDuplicatesCount.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">({mergedGroupsCount} groups)</span>
        </p>
      </Card>

      <Card
        onClick={() => onSelectViewMode("review")}
        className={cn(
          "p-3.5 rounded-xl border bg-card shadow-2xs space-y-1 cursor-pointer transition-all hover:border-amber-500/50",
          viewMode === "review" ? "border-amber-500/80 bg-amber-500/5" : "border-border/80"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
            Review Pairs
          </span>
          <Badge className="bg-amber-500/15 text-amber-500 text-[10px]">Tab 2</Badge>
        </div>
        <p className="text-xl sm:text-2xl font-black text-amber-500 tabular-nums">
          {reviewPairsCount.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">pairs</span>
        </p>
      </Card>

      <Card className="p-3.5 rounded-xl border border-border/80 bg-card shadow-2xs space-y-1">
        <span className="text-[10.5px] font-semibold text-muted-foreground uppercase tracking-wider">
          Final Clean Pool
        </span>
        <p className="text-xl sm:text-2xl font-black text-primary tabular-nums">
          {cleanPoolCount.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">questions</span>
        </p>
      </Card>
    </div>
  );
};
