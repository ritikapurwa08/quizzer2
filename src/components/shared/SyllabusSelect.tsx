import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getSubjectDisplayName } from "@/lib/utils";

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
 * Displays nameHindi || name as the visible label via getSubjectDisplayName.
 * Keeps the internal Convex _id as the Select value — no DB identifiers are altered.
 */
export function SyllabusSelect({
  options,
  value,
  onValueChange,
  placeholder = "चुनें…",
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
          "h-10 w-full text-sm font-medium bg-card border border-border rounded-xl px-3 font-hindi",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border max-h-60">
        {options.map((opt) => {
          const displayLabel = getSubjectDisplayName(opt);
          return (
            <SelectItem
              key={opt._id}
              value={opt._id}
              className="text-sm font-medium cursor-pointer font-hindi"
            >
              {displayLabel}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
