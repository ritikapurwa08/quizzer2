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
      {/* Subject / Scope Segmented Switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-2xl border border-border/70 self-start">
        <button
          type="button"
          onClick={() => onScopeChange("rajasthan_gk")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5",
            scope === "rajasthan_gk"
              ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>राजस्थान GK (Paper-I)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/10 text-primary">
            55
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("english")}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5",
            scope === "english"
              ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>English (Paper-II)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-primary/10 text-primary">
            33
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("all")}
          className={cn(
            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5",
            scope === "all"
              ? "bg-card text-foreground font-bold shadow-xs border border-border/80"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span>All Topics</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-muted text-muted-foreground">
            88
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
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5",
                  isActive
                    ? "bg-foreground text-background shadow-xs font-bold"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <span>{sec.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isActive ? "bg-background text-foreground" : "bg-card text-muted-foreground"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-2xs">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search topic by name, #ID, or keyword..."
            className="pl-9 h-9 text-xs rounded-xl bg-background border-border/80"
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

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/60 self-start sm:self-auto shrink-0">
          {(["all", "completed", "pending"] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer select-none",
                statusFilter === st
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
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
