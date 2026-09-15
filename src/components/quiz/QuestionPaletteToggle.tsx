"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionPalette } from "./QuestionPalette";

interface PaletteQuestion {
  id: string;
  answered: boolean;
  bookmarked: boolean;
}

interface QuestionPaletteToggleProps {
  questions: PaletteQuestion[];
  currentIndex: number;
  onJump: (index: number) => void;
  className?: string;
}

/**
 * Mobile-only collapsible wrapper for QuestionPalette.
 * Defaults to closed so the question gets maximum vertical space.
 * Desktop layouts should use QuestionPalette directly (always visible in sidebar).
 */
export function QuestionPaletteToggle({
  questions,
  currentIndex,
  onJump,
  className,
}: QuestionPaletteToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const answeredCount = questions.filter((q) => q.answered).length;

  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Toggle trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="question-palette-panel"
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none font-hindi"
      >
        <span>
          प्रश्न नेविगेशन
          <span className="ml-1.5 text-primary font-bold">
            {answeredCount}/{questions.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {/* Palette grid — conditionally visible */}
      {isOpen && (
        <div id="question-palette-panel" className="border-t border-border">
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            onJump={(index) => {
              onJump(index);
              setIsOpen(false); // auto-close after jumping
            }}
            className="border-0 rounded-none shadow-none"
          />
        </div>
      )}
    </div>
  );
}
