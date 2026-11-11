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
        "p-3.5 sm:p-4 rounded-md border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card shadow-xs group",
        isDone
          ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
          : "border-border hover:border-foreground/30"
      )}
    >
      {/* Left: Checkbox + Topic Number + Title */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onToggle(topic.id)}
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border transition-all cursor-pointer",
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
              : "border-border hover:border-foreground/40 bg-background"
          )}
          aria-label={`Mark topic ${topic.id} as ${isDone ? "pending" : "completed"}`}
        >
          {isDone ? (
            <Check className="h-3.5 w-3.5 stroke-3" />
          ) : (
            <Circle className="h-2 w-2 text-transparent" />
          )}
        </button>

        <div className="min-w-0 space-y-0.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-xs bg-muted text-muted-foreground tabular-nums">
              #{topic.id.toString().padStart(2, "0")}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <SectionIcon className="h-3 w-3" />
              {topic.subjectHindi}
            </span>
            {isDone && (
              <Badge className="text-[10px] h-4.5 px-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                Completed
              </Badge>
            )}
          </div>

          <h3
            onClick={() => onToggle(topic.id)}
            className={cn(
              "text-xs sm:text-sm font-medium text-foreground leading-snug cursor-pointer font-hindi transition-colors",
              isDone && "line-through opacity-75"
            )}
          >
            {topic.nameHindi}
          </h3>
          <p className="text-[11px] text-muted-foreground truncate">{topic.nameEnglish}</p>
        </div>
      </div>

      {/* Right: Quick Action Link */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 rounded-md text-xs font-semibold gap-1.5 border-border hover:bg-muted"
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

