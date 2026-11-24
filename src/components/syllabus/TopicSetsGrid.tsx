"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Play, CheckCircle2 } from "lucide-react";

interface SetItem {
  _id: string;
  name: string;
  subTopic?: string;
}

interface TopicSetsGridProps {
  sets: SetItem[];
  completedSet: Set<string>;
  activeSubTopic: string;
}

export function TopicSetsGrid({
  sets,
  completedSet,
  activeSubTopic,
}: TopicSetsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sets.map((set) => {
        const isCompleted = completedSet.has(set._id);

        return (
          <Link
            key={set._id}
            href={isCompleted ? `/quiz/${set._id}?retake=true` : `/quiz/${set._id}`}
            className="block focus-visible:outline-hidden"
          >
            <Card className="flex flex-row items-center justify-between p-4 border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all group rounded-md min-h-[4rem] select-none">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-xs sm:text-sm transition-colors truncate text-foreground group-hover:text-primary font-hindi">
                    {set.name}
                  </h3>
                  {set.subTopic && activeSubTopic === "all" && (
                    <span className="text-[10px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded font-hindi">
                      {set.subTopic}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/20 font-hindi">
                      <CheckCircle2 className="h-3 w-3" /> Completed
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md shrink-0 ml-3 transition-all border border-border/80 bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                <Play className="h-3 w-3 fill-current" />
                <span>{isCompleted ? "Retake" : "Start"}</span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
