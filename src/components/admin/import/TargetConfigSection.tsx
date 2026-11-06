"use client";

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
  batchSize,
  onBatchSizeChange,
  subtopicName,
  onSubtopicNameChange,
  isDuplicateSetName,
  plannedSetNames,
  remainingCount,
  isComplete,
  isFinalTopicSet,
  maxSetsAvailable = 5,
}: TargetConfigSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Master Topic
            </Label>
            {isComplete && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 bg-emerald-500/10 text-[10px] py-0 px-2 font-bold">
                ✓ 100% Imported
              </Badge>
            )}
            {!isComplete && remainingCount !== undefined && remainingCount > 0 && (
              <span className="text-[11px] font-medium text-primary">
                {remainingCount} questions left in pool
              </span>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Batch Size (Sets)
            </Label>
            {isFinalTopicSet && remainingCount !== undefined && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10 text-[10px] py-0 px-1.5 font-bold">
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
                  {maxSetsAvailable >= 2 && (
                    <SelectItem value="40" className="cursor-pointer font-medium">
                      40 Questions (2 Sets)
                    </SelectItem>
                  )}
                  {maxSetsAvailable >= 3 && (
                    <SelectItem value="60" className="cursor-pointer font-medium">
                      60 Questions (3 Sets)
                    </SelectItem>
                  )}
                  {maxSetsAvailable >= 4 && (
                    <SelectItem value="80" className="cursor-pointer font-medium">
                      80 Questions (4 Sets)
                    </SelectItem>
                  )}
                  {maxSetsAvailable >= 5 && (
                    <SelectItem value="100" className="cursor-pointer font-medium">
                      100 Questions (5 Sets)
                    </SelectItem>
                  )}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Set / Part Name
          </Label>
          <input
            value={subtopicName}
            onChange={(e) => onSubtopicNameChange(e.target.value)}
            disabled={!selectedTopicId}
            placeholder={selectedTopicId ? "e.g. राजस्थान की जलवायु भाग 1" : "Select a topic first"}
            className={cn(
              "mt-0.5 h-10 w-full rounded-xl border bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              isDuplicateSetName
                ? "border-destructive text-destructive focus:ring-destructive"
                : "border-input"
            )}
          />
          {isDuplicateSetName && (
            <p className="text-[11px] font-medium text-destructive mt-1">
              ⚠️ A test set in this batch already exists under this topic.
            </p>
          )}
        </div>
      </div>

      {isComplete && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            Topic is 100% imported! All questions in this topic pool have already been curated into live sets.
          </span>
        </div>
      )}

      {plannedSetNames.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap text-xs bg-muted/40 p-2.5 rounded-xl border border-border/50">
          <span className="font-semibold text-muted-foreground">Sets to create ({plannedSetNames.length}):</span>
          {plannedSetNames.map((name, idx) => (
            <Badge key={idx} variant="outline" className="text-[11px] font-medium bg-background">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
