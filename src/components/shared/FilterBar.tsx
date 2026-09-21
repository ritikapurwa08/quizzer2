"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  value: string;
  label: string;
}

interface FilterBarProps {
  /** Subject options; first item should be an "all" option. */
  subjects: Option[];
  selectedSubject: string;
  onSubjectChange: (v: string) => void;

  /** Optional topic options; shown only when selectedSubject is not "all". */
  topics?: Option[];
  selectedTopic?: string;
  onTopicChange?: (v: string) => void;

  /** Optional sort options. */
  sortOptions?: Option[];
  selectedSort?: string;
  onSortChange?: (v: string) => void;

  className?: string;
}

export function FilterBar({
  subjects,
  selectedSubject,
  onSubjectChange,
  topics,
  selectedTopic,
  onTopicChange,
  sortOptions,
  selectedSort,
  onSortChange,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Subject filter */}
      <Select value={selectedSubject} onValueChange={(v) => onSubjectChange(v ?? selectedSubject)}>
        <SelectTrigger
          id="filter-subject"
          className="h-9 min-w-32 max-w-56 text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs"
          aria-label="Select Subject"
        >
          <SelectValue placeholder="Select Subject">
            {(v: string | null) => {
              const opt = subjects.find((s) => s.value === (v ?? selectedSubject));
              return opt?.label ?? "Select Subject";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {subjects.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs sm:text-sm">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Topic filter — only when a subject is selected */}
      {topics && topics.length > 0 && selectedSubject !== "all" && onTopicChange && (
        <Select value={selectedTopic ?? "all"} onValueChange={(v) => onTopicChange(v ?? "all")}>
          <SelectTrigger
            id="filter-topic"
            className="h-9 min-w-32 max-w-56 text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs"
            aria-label="Select Topic"
          >
            <SelectValue placeholder="Select Topic">
              {(v: string | null) => {
                const opt = topics.find((t) => t.value === (v ?? selectedTopic ?? "all"));
                return opt?.label ?? "Select Topic";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {topics.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort options */}
      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <Select value={selectedSort ?? sortOptions[0].value} onValueChange={(v) => onSortChange(v ?? sortOptions[0].value)}>
          <SelectTrigger
            id="filter-sort"
            className="h-9 min-w-28 max-w-44 text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs"
            aria-label="Sort By"
          >
            <SelectValue placeholder="Sort By">
              {(v: string | null) => {
                const opt = sortOptions.find((o) => o.value === (v ?? selectedSort ?? sortOptions[0].value));
                return opt?.label ?? "Sort By";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs sm:text-sm">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

