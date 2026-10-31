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
        "focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        // Screen styling
        !selected && !correctness &&
          "border-border bg-card hover:border-foreground/30 hover:bg-muted/40",
        selected && !correctness &&
          "border-primary bg-secondary shadow-xs font-medium",
        correctness === "correct" &&
          "border-success/60 bg-success/10 shadow-sm shadow-success/10",
        correctness === "incorrect" &&
          "border-destructive/60 bg-destructive/10 shadow-sm shadow-destructive/10",
        !disabled && "active:scale-[0.995]",
        disabled && "cursor-default",
        // Print-specific compact styling & high-contrast color preservation
        "print:min-h-0 print:py-1.5 print:px-2.5 print:rounded-lg print:gap-2 print:border",
        !correctness && "print:border-neutral-300 print:bg-white print:text-neutral-900",
        correctness === "correct" &&
          "print:border-emerald-600! print:bg-emerald-50! print:text-emerald-950!",
        correctness === "incorrect" &&
          "print:border-rose-600! print:bg-rose-50! print:text-rose-950!"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-medium",
          "transition-colors",
          !selected && !correctness &&
            "border-border bg-muted text-muted-foreground group-hover:border-foreground/30",
          selected && !correctness &&
            "border-foreground bg-foreground text-background",
          correctness === "correct" &&
            "border-success bg-success text-success-foreground",
          correctness === "incorrect" &&
            "border-destructive bg-destructive text-destructive-foreground",
          // Print badge sizing & colors
          "print:h-5 print:w-5 print:text-[11px] print:rounded",
          !correctness && "print:border-neutral-300 print:bg-neutral-100 print:text-neutral-700",
          correctness === "correct" &&
            "print:border-emerald-600! print:bg-emerald-600! print:text-white!",
          correctness === "incorrect" &&
            "print:border-rose-600! print:bg-rose-600! print:text-white!"
        )}
      >
        {badgeLabel}
      </span>

      <span
        className={cn(
          "min-w-0 flex-1 text-[0.95rem] leading-7 font-normal text-foreground sm:text-base sm:leading-7",
          "print:text-xs print:leading-snug",
          isHindi && "font-hindi"
        )}
      >
        {text}
      </span>

      {/* Screen status icon (rendered only during review evaluation) */}
      {correctness && (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center print:hidden" aria-hidden="true">
          {correctness === "correct" ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-success-foreground">
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </span>
      )}

      {/* Print-only explicit status labels */}
      {correctness === "correct" && (
        <span className="hidden print:inline-flex items-center gap-1 rounded bg-emerald-100/80 border border-emerald-400 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 uppercase tracking-wider shrink-0">
          ✓ Correct Answer
        </span>
      )}
      {correctness === "incorrect" && (
        <span className="hidden print:inline-flex items-center gap-1 rounded bg-rose-100/80 border border-rose-400 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 uppercase tracking-wider shrink-0">
          ✗ Your Choice
        </span>
      )}
    </button>

  );
}
