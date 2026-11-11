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
    <div
      className={cn(
        "bg-muted p-1 rounded-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border-0 max-w-full",
        className
      )}
    >
      {/* Subject filter */}
      <div className="min-w-[140px] sm:min-w-[170px] shrink-0">
        <Select value={selectedSubject} onValueChange={(v) => onSubjectChange(v ?? selectedSubject)}>
          <SelectTrigger
            id="filter-subject"
            className="h-9 w-full typo-small rounded-lg border-0 bg-card shadow-xs text-foreground font-medium truncate cursor-pointer px-3"
            aria-label="Select Subject"
          >
            <SelectValue placeholder="All Subjects" className="truncate">
              {(v: string | null) => {
                const opt = subjects.find((s) => s.value === (v ?? selectedSubject));
                return opt?.label ?? "All Subjects";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-0 shadow-lg max-w-[320px] rounded-xl">
            {subjects.map((s) => (
              <SelectItem key={s.value} value={s.value} className="typo-small cursor-pointer">
                <span className="truncate">{s.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Topic filter */}
      {onTopicChange && (
        <div className="min-w-[140px] sm:min-w-[170px] shrink-0">
          <Select
            value={isTopicDisabled ? "all" : (selectedTopic ?? "all")}
            onValueChange={(v) => onTopicChange(v ?? "all")}
            disabled={isTopicDisabled}
          >
            <SelectTrigger
              id="filter-topic"
              className={cn(
                "h-9 w-full typo-small rounded-lg border-0 bg-card shadow-xs text-foreground font-medium truncate cursor-pointer px-3",
                isTopicDisabled && "opacity-50 cursor-not-allowed bg-transparent shadow-none"
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
            <SelectContent className="bg-popover border-0 shadow-lg max-w-[320px] rounded-xl">
              <SelectItem value="all" className="typo-small cursor-pointer">
                All Topics
              </SelectItem>
              {topics?.map((t) => (
                <SelectItem key={t.value} value={t.value} className="typo-small cursor-pointer">
                  <span className="truncate">{t.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sort filter */}
      {sortOptions && onSortChange && (
        <div className="min-w-[120px] sm:min-w-[140px] shrink-0">
          <Select value={selectedSort} onValueChange={(v) => onSortChange(v ?? "recent")}>
            <SelectTrigger
              id="filter-sort"
              className="h-9 w-full typo-small rounded-lg border-0 bg-card shadow-xs text-foreground font-medium truncate cursor-pointer px-3"
              aria-label="Sort by"
            >
              <SelectValue placeholder="Sort by" className="truncate">
                {(v: string | null) => {
                  const opt = sortOptions.find((s) => s.value === (v ?? selectedSort));
                  return opt?.label ?? "Sort by";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-0 shadow-lg max-w-[240px] rounded-xl">
              {sortOptions.map((s) => (
                <SelectItem key={s.value} value={s.value} className="typo-small cursor-pointer">
                  <span className="truncate">{s.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
