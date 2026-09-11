"use client";

import { cn } from "@/lib/utils";

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

const selectBase =
  "h-9 max-w-full rounded-xl border border-border bg-card text-xs sm:text-sm font-medium text-foreground pl-3 pr-8 appearance-none cursor-pointer transition-colors hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 font-hindi shadow-xs";

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
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {/* Subject filter */}
      <div className="relative">
        <select
          id="filter-subject"
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className={selectBase}
          aria-label="विषय फ़िल्टर"
        >
          {subjects.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </span>
      </div>

      {/* Topic filter — only when a subject is selected */}
      {topics && topics.length > 0 && selectedSubject !== "all" && onTopicChange && (
        <div className="relative">
          <select
            id="filter-topic"
            value={selectedTopic ?? "all"}
            onChange={(e) => onTopicChange(e.target.value)}
            className={selectBase}
            aria-label="टॉपिक फ़िल्टर"
          >
            {topics.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L1 3h10L6 8z" />
            </svg>
          </span>
        </div>
      )}

      {/* Sort options */}
      {sortOptions && sortOptions.length > 0 && onSortChange && (
        <div className="relative">
          <select
            id="filter-sort"
            value={selectedSort ?? sortOptions[0].value}
            onChange={(e) => onSortChange(e.target.value)}
            className={selectBase}
            aria-label="क्रम"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-foreground">
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L1 3h10L6 8z" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
