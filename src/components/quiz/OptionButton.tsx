"use client";

import { cn, containsDevanagari } from "@/lib/utils";

interface OptionButtonProps {
  id: string;
  text: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  correctness?: "correct" | "incorrect" | "neutral";
}

export function OptionButton({ id, text, selected, onClick, disabled, correctness }: OptionButtonProps) {
  let badgeLabel = id;
  if (id === "opt1") badgeLabel = "A";
  else if (id === "opt2") badgeLabel = "B";
  else if (id === "opt3") badgeLabel = "C";
  else if (id === "opt4") badgeLabel = "D";

  const isHindi = containsDevanagari(text);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-all duration-150 min-h-12.5 select-none cursor-pointer group",
        selected && !correctness && "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md text-foreground",
        !selected && !correctness && "border-border bg-card hover:bg-muted/60 hover:border-primary/40 active:scale-[0.995]",
        correctness === "correct" && "border-success bg-success/15 ring-2 ring-success/20 text-foreground shadow-sm",
        correctness === "incorrect" && "border-destructive bg-destructive/15 ring-2 ring-destructive/20 text-foreground shadow-sm",
        disabled && "cursor-default opacity-90"
      )}
    >
      {/* Option Badge (A/B/C/D) */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs  transition-all",
          selected && !correctness && "border-primary bg-primary text-primary-foreground shadow-sm",
          !selected && !correctness && "border-border bg-muted text-muted-foreground group-hover:border-primary/50",
          correctness === "correct" && "border-success bg-success text-success-foreground shadow-sm",
          correctness === "incorrect" && "border-destructive bg-destructive text-destructive-foreground shadow-sm"
        )}
      >
        {badgeLabel}
      </span>

      {/* Option Content Text */}
      <span className={cn("flex-1 leading-snug text-sm sm:text-base", isHindi && "font-hindi")}>
        {text}
      </span>

      {/* Radio Circle Indicator */}
      <div className="shrink-0 pl-1">
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
            selected && !correctness && "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30",
            !selected && !correctness && "border-muted-foreground/40 bg-background group-hover:border-primary",
            correctness === "correct" && "border-success bg-success text-success-foreground",
            correctness === "incorrect" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          {selected && <span className="h-2 w-2 rounded-full bg-current" />}
        </span>
      </div>
    </button>
  );
}
