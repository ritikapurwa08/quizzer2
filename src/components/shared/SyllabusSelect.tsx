"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SyllabusOption {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface SyllabusSelectProps {
  options: SyllabusOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared ShadCN/base-ui Select for subject/topic dropdowns.
 * Displays nameHindi || name as the visible label.
 * Keeps the internal Convex _id as the Select value — no DB identifiers are altered.
 *
 * Note: this project uses @base-ui/react/select (not Radix).
 * base-ui onValueChange passes (value: string | null, eventDetails).
 * We normalize null → "" before calling the consumer.
 */
export function SyllabusSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  disabled = false,
  className,
}: SyllabusSelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(v: string | null) => onValueChange(v ?? "")}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "h-10 w-full text-sm font-medium bg-background border border-input rounded-md px-3",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border">
        {options.map((opt) => {
          const displayLabel = opt.nameHindi || opt.name;
          return (
            <SelectItem
              key={opt._id}
              value={opt._id}
              className="text-sm font-medium cursor-pointer"
            >
              {displayLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
