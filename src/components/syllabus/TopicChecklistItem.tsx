"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubjectSectionIcon } from "@/components/icons/QuizzerIcons";
import type { MasterTopicInfo } from "@/lib/pool/masterTopics";

interface TopicChecklistItemProps {
  topic: MasterTopicInfo;
  isDone: boolean;
  onToggle: (id: number) => void;
}

export function TopicChecklistItem({
  topic,
  isDone,
  onToggle,
}: TopicChecklistItemProps) {
  const SectionIcon = getSubjectSectionIcon(topic.subjectHindi);

  return (
    <div
      className={cn(
        "p-2.5 sm:p-3 rounded-xl border-0 transition-all flex items-center justify-between gap-2.5 bg-card shadow-xs group",
        isDone
          ? "bg-emerald-500/5 hover:bg-emerald-500/10"
          : "hover:bg-muted/40"
      )}
    >
      {/* Left: Checkbox + Topic Number + Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(topic.id)}
          className={cn(
            "flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer border-0",
            isDone
              ? "bg-emerald-500 text-white shadow-xs"
              : "border border-border/80 hover:border-foreground/50 bg-background"
          )}
          aria-label={`Mark topic ${topic.id} as ${isDone ? "pending" : "completed"}`}
        >
          {isDone ? (
            <Check className="h-3 w-3 stroke-3" />
          ) : (
            <Circle className="h-1.5 w-1.5 text-transparent" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground tabular-nums">
              #{topic.id.toString().padStart(2, "0")}
            </span>
            <span className="text-[10.5px] font-medium text-muted-foreground flex items-center gap-1 truncate">
              <SectionIcon className="h-3 w-3 shrink-0" />
              <span>{topic.subjectHindi}</span>
            </span>
            {isDone && (
              <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-bold">
                Done
              </Badge>
            )}
          </div>

          <h3
            onClick={() => onToggle(topic.id)}
            className={cn(
              "text-xs sm:text-sm font-medium text-foreground leading-snug cursor-pointer font-hindi transition-colors truncate mt-0.5",
              isDone && "line-through opacity-70"
            )}
            title={topic.nameHindi}
          >
            {topic.nameHindi}
          </h3>
        </div>
      </div>

      {/* Right: Quick Action Link */}
      <div className="shrink-0">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 sm:h-7.5 px-2.5 rounded-lg text-xs font-medium gap-1 border-0 bg-secondary/80 hover:bg-muted"
        >
          <Link href={`/subjects`}>
            <span>Practice</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
