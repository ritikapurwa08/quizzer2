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

/**
 * Stitch design spec option row:
 * - Fixed height regardless of state — NO layout shift ever.
 * - border-2 is constant across ALL states.
 * - Only background tint, border color, and ring change between states.
 * - Font weight is ALWAYS normal (400) — no bold on selection.
 */
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
        // Base: fixed layout, constant border-2, never changes box size
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors duration-100 min-h-[3rem] select-none group outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary",
        // Default state
        !selected && !correctness && "border-border bg-card hover:bg-muted/50 hover:border-primary/40 cursor-pointer",
        // Selected (during quiz — violet tint)
        selected && !correctness && "border-primary bg-primary/10 ring-1 ring-primary/30 cursor-pointer",
        // Review: correct (green tint)
        correctness === "correct" && "border-success bg-success/15 ring-1 ring-success/30",
        // Review: incorrect (red tint)
        correctness === "incorrect" && "border-destructive bg-destructive/15 ring-1 ring-destructive/30",
        // Disabled
        disabled && "cursor-default"
      )}
    >
      {/* A/B/C/D badge — rounded square, state-colored */}
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors",
          !selected && !correctness && "border-border bg-muted text-muted-foreground group-hover:border-primary/40",
          selected && !correctness && "border-primary bg-primary text-primary-foreground",
          correctness === "correct" && "border-success bg-success text-success-foreground",
          correctness === "incorrect" && "border-destructive bg-destructive text-destructive-foreground"
        )}
      >
        {badgeLabel}
      </span>

      {/* Option text — ALWAYS font-normal (400), never bold on selection */}
      <span
        className={cn(
          "flex-1 leading-snug text-sm sm:text-base font-normal text-foreground",
          isHindi && "font-hindi"
        )}
      >
        {text}
      </span>

      {/* Right indicator: radio circle in quiz mode, check/x icons in review mode */}
      <div className="shrink-0 pl-1">
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
              "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
              selected && !correctness
                ? "border-primary bg-primary"
                : "border-muted-foreground/30 bg-background group-hover:border-primary/50"
            )}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
          </span>
        )}
      </div>
    </button>
  );
}
