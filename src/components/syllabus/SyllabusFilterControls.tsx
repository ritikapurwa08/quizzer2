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
      {/* Subject / Scope Segmented Switcher — Single-line horizontal scrollable container */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => onScopeChange("all")}
          className={cn(
            "whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-2 border-0",
            scope === "all"
              ? "bg-foreground text-background shadow-xs font-bold"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <span>All Topics</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              scope === "all"
                ? "bg-background/20 text-background"
                : "bg-muted text-muted-foreground"
            )}
          >
            88
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("rajasthan_gk")}
          className={cn(
            "whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-2 border-0",
            scope === "rajasthan_gk"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <span>राजस्थान GK (Paper-I)</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              scope === "rajasthan_gk"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            55
          </span>
        </button>

        <button
          type="button"
          onClick={() => onScopeChange("english")}
          className={cn(
            "whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-2 border-0",
            scope === "english"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <span>English (Paper-II)</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              scope === "english"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            33
          </span>
        </button>
      </div>

      {/* Section Selector Filter Tabs — Single-line horizontal scrollable container */}
      {sectionTabs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {sectionTabs.map((sec) => {
            const isActive = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                className={cn(
                  "whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 border-0",
                  isActive
                    ? "bg-secondary text-foreground font-bold shadow-2xs"
                    : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{sec.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isActive
                      ? "bg-foreground/10 text-foreground"
                      : "bg-muted text-muted-foreground"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-2xl border-0 shadow-xs">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search topic by name, #ID, or keyword..."
            className="pl-9 h-8.5 text-xs rounded-xl bg-background border-0"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl self-start sm:self-auto shrink-0 border-0">
          {(["all", "completed", "pending"] as StatusFilter[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors cursor-pointer select-none border-0",
                statusFilter === st
                  ? "bg-card text-foreground shadow-2xs font-semibold"
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
