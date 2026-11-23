"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SubTopic {
  id: string;
  name: string;
  count: number;
}

interface TopicSubTopicFilterProps {
  subTopics: SubTopic[];
  activeSubTopic: string;
  totalSets: number;
  onSelect: (id: string) => void;
}

export function TopicSubTopicFilter({
  subTopics,
  activeSubTopic,
  totalSets,
  onSelect,
}: TopicSubTopicFilterProps) {
  if (subTopics.length <= 1) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border border-border",
            activeSubTopic === "all"
              ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
              : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>All Sets</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              activeSubTopic === "all"
                ? "bg-background/25 text-primary-foreground"
                : "bg-background text-muted-foreground"
            )}
          >
            {totalSets}
          </span>
        </button>

        {subTopics.map((sub) => {
          const isActive = activeSubTopic === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => onSelect(sub.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-hindi",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{sub.name}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive
                    ? "bg-background/25 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}
              >
                {sub.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
