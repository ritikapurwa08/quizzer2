"use client";

import { useEffect } from "react";
import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface TargetConfigSectionProps {
  subjectsList: Option[];
  topicsList: Option[];
  selectedSubjectId: string;
  selectedTopicId: string;
  onSubjectChangeId: (id: string) => void;
  onTopicChangeId: (id: string) => void;
  availableSubTopics?: Array<{ id: string; name: string }>;
  selectedSubTopicId?: string;
  onSubTopicChange?: (id: string) => void;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  subtopicName: string;
  onSubtopicNameChange: (name: string) => void;
  isDuplicateSetName: boolean;
  plannedSetNames: string[];
  remainingCount?: number;
  isComplete?: boolean;
  isFinalTopicSet?: boolean;
  maxSetsAvailable?: number;
}

export function TargetConfigSection({
  subjectsList,
  topicsList,
  selectedSubjectId,
  selectedTopicId,
  onSubjectChangeId,
  onTopicChangeId,
  availableSubTopics = [],
  selectedSubTopicId = "",
  onSubTopicChange,
  batchSize,
  onBatchSizeChange,
  subtopicName,
  onSubtopicNameChange,
  isDuplicateSetName,
  plannedSetNames,
  remainingCount,
  isComplete,
  isFinalTopicSet,
  maxSetsAvailable = 2,
}: TargetConfigSectionProps) {
  // Hard limit: Max 2 sets (40 questions) to completely prevent AI model hallucinations
  const effectiveMaxSets = Math.min(2, Math.max(1, maxSetsAvailable));

  useEffect(() => {
    if (batchSize > 40) {
      onBatchSizeChange(40);
    }
  }, [batchSize, onBatchSizeChange]);

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* ── ROW 1: 3-Selector Cascading Controls (Subject, Master Topic, Target Sub-Topic) ── */}
      <div
        className={cn(
          "grid gap-4 min-w-0 w-full",
          availableSubTopics.length > 0
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2"
        )}
      >
        <div className="min-w-0">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Subject
          </Label>
          <SyllabusSelect
            options={subjectsList}
            value={selectedSubjectId}
            onValueChange={onSubjectChangeId}
            placeholder="Select Subject..."
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5 min-w-0">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Master Topic
            </Label>
            {isComplete && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px] py-0 px-2 font-bold shrink-0">
                ✓ 100% Imported
              </Badge>
            )}
          </div>
          <SyllabusSelect
            options={topicsList}
            value={selectedTopicId}
            onValueChange={onTopicChangeId}
            disabled={!selectedSubjectId}
            placeholder="Select Master Topic..."
          />
        </div>

        {/* Sub-Topic Selector when topic has subtopics */}
        {availableSubTopics.length > 0 && (
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1.5 min-w-0">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block shrink-0">
                Target Sub-Topic
              </Label>
              <span className="text-[10px] text-muted-foreground truncate">
                (वैकल्पिक)
              </span>
            </div>
            <Select
              value={selectedSubTopicId || "all"}
              onValueChange={(val: string | null) => onSubTopicChange?.(val === "all" ? "" : (val || ""))}
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium font-hindi min-w-0">
                <SelectValue placeholder="पूरा टॉपिक (All Sub-Topics)">
                  {(val: any) => {
                    if (!val || val === "all") return "पूरा टॉपिक (All Sub-Topics)";
                    const found = availableSubTopics.find((s) => s.id === val);
                    return found ? found.name : val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">पूरा टॉपिक (All Sub-Topics)</SelectItem>
                {availableSubTopics.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id} className="font-hindi">
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── ROW 2: Batch Size & Set / Part Name ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 min-w-0 w-full">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5 min-w-0">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Batch Size (Sets)
            </Label>
            {isFinalTopicSet && remainingCount !== undefined && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-[10px] py-0 px-1.5 font-bold shrink-0">
                Final Set
              </Badge>
            )}
          </div>
          <Select
            value={String(batchSize)}
            onValueChange={(val: string | null) => val && onBatchSizeChange(Number(val))}
            disabled={!selectedTopicId || isComplete}
          >
            <SelectTrigger className="mt-0.5 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium">
              <SelectValue placeholder={isComplete ? "0 Questions (Topic Complete)" : "20 Questions (1 Set)"}>
                {(val: any) => {
                  if (isComplete) return "0 Questions (Topic 100% Complete)";
                  const num = Number(val || batchSize);
                  if (isFinalTopicSet && remainingCount && num < 20) {
                    return `${num} Questions (Final Partial Set)`;
                  }
                  const sets = Math.ceil(num / 20);
                  return `${num} Questions (${sets} ${sets === 1 ? "Set" : "Sets"})`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {isFinalTopicSet && remainingCount && remainingCount < 20 ? (
                <SelectItem value={String(remainingCount)} className="cursor-pointer font-medium">
                  {remainingCount} Questions (Final Partial Set)
                </SelectItem>
              ) : (
                <>
                  <SelectItem value="20" className="cursor-pointer font-medium">
                    20 Questions (1 Set)
                  </SelectItem>
                  {effectiveMaxSets >= 2 && (
                    <SelectItem value="40" className="cursor-pointer font-medium">
                      40 Questions (2 Sets — Max Allowed)
                    </SelectItem>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Set / Part Name
          </Label>
          <input
            value={subtopicName}
            onChange={(e) => onSubtopicNameChange(e.target.value)}
            disabled={!selectedTopicId}
            placeholder={selectedTopicId ? "e.g. राजस्थान की जलवायु भाग 1" : "Select a topic first"}
            className={cn(
              "mt-0.5 h-10 w-full rounded-xl border bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0",
              isDuplicateSetName
                ? "border-destructive text-destructive focus:ring-destructive"
                : "border-input"
            )}
          />
          {isDuplicateSetName && (
            <p className="text-[11px] font-medium text-destructive mt-1 break-words">
              ⚠️ A test set in this batch already exists under this topic.
            </p>
          )}
        </div>
      </div>

      {isComplete && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium min-w-0">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="break-words">
            {selectedSubTopicId
              ? "सब-टॉपिक के सभी प्रश्न इम्पोर्ट हो चुके हैं! (All questions in this subtopic have already been curated into live sets)."
              : "Topic is 100% imported! All questions in this topic pool have already been curated into live sets."}
          </span>
        </div>
      )}

      {plannedSetNames.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2.5 rounded-xl border border-border/50 min-w-0">
          <span className="font-semibold text-muted-foreground shrink-0">Sets to create ({plannedSetNames.length}):</span>
          {plannedSetNames.map((name, idx) => (
            <Badge key={idx} variant="outline" className="text-[11px] font-medium bg-background truncate max-w-full">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
