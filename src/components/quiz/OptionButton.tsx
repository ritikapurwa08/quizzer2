"use client";

import { cn, containsDevanagari, getOptionLabel } from "@/lib/utils";

interface OptionButtonProps {
  id: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  correctness?: "correct" | "incorrect" | "neutral";
}

export function OptionButton({
  id,
  text,
  selected,
  onClick,
  disabled,
  correctness,
}: OptionButtonProps) {
  const badgeLabel = getOptionLabel(id);
  const isHindi = containsDevanagari(text);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-12 w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left",
        "transition-[background-color,border-color,box-shadow,transform] duration-150",
        "select-none outline-none",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        !selected && !correctness &&
          "border-border bg-card hover:border-primary/35 hover:bg-muted/50",
        selected && !correctness &&
          "border-primary bg-primary/10 shadow-sm shadow-primary/10",
        correctness === "correct" &&
          "border-success/60 bg-success/10 shadow-sm shadow-success/10",
        correctness === "incorrect" &&
          "border-destructive/60 bg-destructive/10 shadow-sm shadow-destructive/10",
        !disabled && "active:scale-[0.995]",
        disabled && "cursor-default"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-medium",
          "transition-colors",
          !selected && !correctness &&
            "border-border bg-muted text-muted-foreground group-hover:border-primary/35",
          selected && !correctness &&
            "border-primary bg-primary text-primary-foreground",
          correctness === "correct" &&
            "border-success bg-success text-success-foreground",
          correctness === "incorrect" &&
            "border-destructive bg-destructive text-destructive-foreground"
        )}
      >
        {badgeLabel}
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 text-[0.95rem] leading-7 font-normal text-foreground sm:text-base sm:leading-7",
          isHindi && "font-hindi"
        )}
      >
        {text}
      </span>

      <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
        {correctness === "correct" ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : correctness === "incorrect" ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        ) : (
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
              selected
                ? "border-primary bg-primary"
                : "border-muted-foreground/35 bg-background group-hover:border-primary/50"
            )}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
          </span>
        )}
      </span>
    </button>
  );
}
