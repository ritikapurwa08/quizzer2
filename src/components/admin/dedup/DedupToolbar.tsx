import React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Layers, GitCompare, AlertTriangle, Search, Maximize2, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewMode, WhyFilter } from "./types";

interface DedupToolbarProps {
  viewMode: ViewMode;
  onSelectViewMode: (mode: ViewMode) => void;
  whyFilter: WhyFilter;
  onChangeWhyFilter: (why: WhyFilter) => void;
  search: string;
  onChangeSearch: (val: string) => void;
  displayStyle: "focus" | "list";
  onChangeDisplayStyle: (style: "focus" | "list") => void;
  pageSize: number;
  onChangePageSize: (size: number) => void;
}

export const DedupToolbar: React.FC<DedupToolbarProps> = ({
  viewMode,
  onSelectViewMode,
  whyFilter,
  onChangeWhyFilter,
  search,
  onChangeSearch,
  displayStyle,
  onChangeDisplayStyle,
  pageSize,
  onChangePageSize,
}) => {
  return (
    <div className="p-3 sm:p-4 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left: View Mode Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/40 border border-border/60">
          <button
            type="button"
            onClick={() => onSelectViewMode("groups")}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              viewMode === "groups"
                ? "bg-card text-foreground shadow-2xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>1. Auto-Merged Groups</span>
            <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] font-bold">
              959 groups (1,193 dups)
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => onSelectViewMode("review")}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2",
              viewMode === "review"
                ? "bg-card text-foreground shadow-2xs font-bold border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitCompare className="h-4 w-4 text-amber-500" />
            <span>2. Manual Review Pairs</span>
            <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-bold">
              3,397 pairs
            </Badge>
          </button>
        </div>

        {/* Sub-Filters for Review Pairs */}
        {viewMode === "review" && (
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => onChangeWhyFilter("all")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                whyFilter === "all"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              )}
            >
              All (3,397)
            </button>
            <button
              type="button"
              onClick={() => onChangeWhyFilter("similar_text_DIFFERENT_answer")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1",
                whyFilter === "similar_text_DIFFERENT_answer"
                  ? "bg-rose-500 text-white font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              )}
              title="Questions with conflicting answer keys (1,598)"
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Key Conflicts (1,598)</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeWhyFilter("same_answer_reworded")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer",
                whyFilter === "same_answer_reworded"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground bg-muted/30"
              )}
              title="Same answer with reworded stems (1,799)"
            >
              <span>Reworded (1,799)</span>
            </button>
          </div>
        )}
      </div>

      {/* Right: Search & Display Style */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative min-w-[170px] sm:min-w-[210px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onChangeSearch(e.target.value)}
            placeholder={viewMode === "groups" ? "Search exam, ID, question..." : "Search pair ID or question..."}
            className="pl-8 h-8 text-xs rounded-xl bg-background border-border/80"
          />
        </div>

        {/* Display Style Toggle (Focus Inspector vs List) */}
        <div className="flex items-center bg-muted/40 p-0.5 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => onChangeDisplayStyle("focus")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              displayStyle === "focus"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Focus Mode (Inspect 1 at a time)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Focus Mode</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeDisplayStyle("list")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
              displayStyle === "list"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="List Mode (Browse multiple at once)"
          >
            <ListFilter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List Mode</span>
          </button>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center bg-muted/40 px-2 py-1 rounded-xl border border-border/60 text-[11px] font-semibold text-muted-foreground">
          <span className="mr-1.5 hidden sm:inline">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onChangePageSize(parseInt(e.target.value, 10))}
            className="bg-transparent font-bold text-foreground outline-none cursor-pointer"
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
    </div>
  );
};

