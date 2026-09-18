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
          className="h-9 min-w-32 max-w-52 text-xs sm:text-sm font-medium font-hindi rounded-xl border-border bg-card shadow-xs"
          aria-label="विषय फ़िल्टर"
        >
          <SelectValue placeholder="विषय चुनें">
            {(v: string | null) => {
              const opt = subjects.find((s) => s.value === (v ?? selectedSubject));
              return opt?.label ?? "विषय चुनें";
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {subjects.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs sm:text-sm font-hindi">
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
            className="h-9 min-w-32 max-w-52 text-xs sm:text-sm font-medium font-hindi rounded-xl border-border bg-card shadow-xs"
            aria-label="टॉपिक फ़िल्टर"
          >
            <SelectValue placeholder="टॉपिक चुनें">
              {(v: string | null) => {
                const opt = topics.find((t) => t.value === (v ?? selectedTopic ?? "all"));
                return opt?.label ?? "टॉपिक चुनें";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {topics.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm font-hindi">
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
            className="h-9 min-w-28 max-w-44 text-xs sm:text-sm font-medium font-hindi rounded-xl border-border bg-card shadow-xs"
            aria-label="क्रम"
          >
            <SelectValue placeholder="क्रम चुनें">
              {(v: string | null) => {
                const opt = sortOptions.find((o) => o.value === (v ?? selectedSort ?? sortOptions[0].value));
                return opt?.label ?? "क्रम चुनें";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs sm:text-sm font-hindi">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

