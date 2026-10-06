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
  const isTopicDisabled = selectedSubject === "all" || !topics || topics.length <= 1;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 sm:gap-2.5", className)}>
      {/* Subject filter */}
      <div className="w-full sm:w-auto min-w-[160px] max-w-[220px]">
        <Select value={selectedSubject} onValueChange={(v) => onSubjectChange(v ?? selectedSubject)}>
          <SelectTrigger
            id="filter-subject"
            className="h-9 w-full text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs truncate cursor-pointer"
            aria-label="Select Subject"
          >
            <SelectValue placeholder="Select Subject" className="truncate">
              {(v: string | null) => {
                const opt = subjects.find((s) => s.value === (v ?? selectedSubject));
                return opt?.label ?? "Select Subject";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-w-[320px]">
            {subjects.map((s) => (
              <SelectItem key={s.value} value={s.value} className="text-xs sm:text-sm">
                <span className="truncate">{s.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Topic filter — placeholder with disabled state to avoid sudden layout jump */}
      {onTopicChange && (
        <div className="w-full sm:w-auto min-w-[160px] max-w-[220px]">
          <Select
            value={isTopicDisabled ? "all" : (selectedTopic ?? "all")}
            onValueChange={(v) => onTopicChange(v ?? "all")}
            disabled={isTopicDisabled}
          >
            <SelectTrigger
              id="filter-topic"
              className={cn(
                "h-9 w-full text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs truncate cursor-pointer",
                isTopicDisabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Select Topic"
            >
              <SelectValue placeholder="All Topics" className="truncate">
                {(v: string | null) => {
                  if (isTopicDisabled) return "All Topics";
                  const opt = topics?.find((t) => t.value === (v ?? selectedTopic ?? "all"));
                  return opt?.label ?? "All Topics";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-w-[320px]">
              {(topics && topics.length > 0
                ? topics
                : [{ value: "all", label: "All Topics" }]
              ).map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs sm:text-sm">
                  <span className="truncate">{t.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sort options */}
      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <div className="w-full sm:w-auto min-w-[140px] max-w-[180px]">
          <Select
            value={selectedSort ?? sortOptions[0].value}
            onValueChange={(v) => onSortChange(v ?? sortOptions[0].value)}
          >
            <SelectTrigger
              id="filter-sort"
              className="h-9 w-full text-xs sm:text-sm font-medium rounded-xl border-border bg-card shadow-xs truncate cursor-pointer"
              aria-label="Sort By"
            >
              <SelectValue placeholder="Sort By" className="truncate">
                {(v: string | null) => {
                  const opt = sortOptions.find(
                    (o) => o.value === (v ?? selectedSort ?? sortOptions[0].value)
                  );
                  return opt?.label ?? "Sort By";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-w-[240px]">
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs sm:text-sm">
                  <span className="truncate">{o.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

