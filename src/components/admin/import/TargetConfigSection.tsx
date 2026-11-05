"use client";

import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Master Topic
          </Label>
          <SyllabusSelect
            options={topicsList}
            value={selectedTopicId}
            onValueChange={onTopicChangeId}
            disabled={!selectedSubjectId}
            placeholder="Select Master Topic..."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Batch Size (Sets)
          </Label>
          <Select
            value={String(batchSize)}
            onValueChange={(val: string | null) => val && onBatchSizeChange(Number(val))}
            disabled={!selectedTopicId}
          >
            <SelectTrigger className="mt-0.5 h-10 w-full rounded-xl border border-input bg-card px-3 text-sm font-medium">
              <SelectValue placeholder="20 Questions (1 Set)">
                {(val: any) => {
                  const num = Number(val || batchSize);
                  const sets = Math.ceil(num / 20);
                  return `${num} Questions (${sets} ${sets === 1 ? "Set" : "Sets"})`;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="20" className="cursor-pointer font-medium">
                20 Questions (1 Set)
              </SelectItem>
              <SelectItem value="40" className="cursor-pointer font-medium">
                40 Questions (2 Sets)
              </SelectItem>
              <SelectItem value="60" className="cursor-pointer font-medium">
                60 Questions (3 Sets)
              </SelectItem>
              <SelectItem value="80" className="cursor-pointer font-medium">
                80 Questions (4 Sets)
              </SelectItem>
              <SelectItem value="100" className="cursor-pointer font-medium">
                100 Questions (5 Sets)
              </SelectItem>
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

