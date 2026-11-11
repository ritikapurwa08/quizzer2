"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StatusFilter, SyllabusScope } from "./syllabusTypes";

interface SectionTab {
  id: string;
  title: string;
  count: number;
}

interface SyllabusFilterControlsProps {
  scope: SyllabusScope;
  onScopeChange: (scope: SyllabusScope) => void;
  sectionTabs: SectionTab[];
  selectedSection: string;
  onSelectSection: (sectionId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
}

export function SyllabusFilterControls({
  scope,
  onScopeChange,
  sectionTabs,
  selectedSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SyllabusFilterControlsProps) {
  return (
    <div className="space-y-3">
      {/* Subject / Scope Segmented Switcher (Crisp Linear/Raycast Style) */}
      <div className="inline-flex items-center p-0.5 bg-secondary/80 rounded-md border border-border self-start gap-0.5">
        <button
          type="button"
          onClick={() => onScopeChange("all")}
          className={cn(
            "px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 border",
            scope === "all"
              ? "bg-card text-foreground font-bold shadow-2xs border-border"
              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
          )}
        >
          <span>All Topics</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-bold bg-muted text-muted-foreground">
            88
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("rajasthan_gk")}
          className={cn(
            "px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 border",
            scope === "rajasthan_gk"
              ? "bg-card text-foreground font-bold shadow-2xs border-border"
              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
          )}
        >
          <span>राजस्थान GK (Paper-I)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-bold bg-primary/15 text-primary border border-primary/20">
            55
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("english")}
          className={cn(
            "px-3 py-1.5 rounded-sm text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 border",
            scope === "english"
              ? "bg-card text-foreground font-bold shadow-2xs border-border"
              : "text-muted-foreground hover:text-foreground border-transparent hover:bg-card/40"
          )}
        >
          <span>English (Paper-II)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-xs font-bold bg-primary/15 text-primary border border-primary/20">
            33
          </span>
        </button>
      </div>

      {/* Section Selector Filter Tabs */}
      {sectionTabs.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {sectionTabs.map((sec) => {
            const isActive = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5 border",
                  isActive
                    ? "bg-secondary text-foreground border-border font-bold shadow-2xs"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border/80"
                )}
              >
                <span>{sec.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-xs font-bold",
                    isActive ? "bg-card text-foreground border border-border" : "bg-muted text-muted-foreground"
                  )}
                >
                  {sec.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search and Status Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-md border border-border shadow-xs">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search topic by name, #ID, or keyword..."
            className="pl-9 h-8.5 text-xs rounded-sm bg-background border-border"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-md border border-border/70 self-start sm:self-auto shrink-0">
          {(["all", "completed", "pending"] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-sm capitalize transition-colors cursor-pointer select-none border",
                statusFilter === st
                  ? "bg-card text-foreground shadow-2xs font-semibold border-border"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
