"use client";

import React from "react";
import { cn, containsDevanagari } from "@/lib/utils";
import { BookOpen, HelpCircle, CheckCircle2 } from "lucide-react";

interface FormattedExplanationProps {
  text: string;
  className?: string;
  compact?: boolean;
}

/**
 * Parses markdown bold (**bold**) and renders formatted text nodes
 */
function renderMarkdownInline(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={`bold-${match.index}`} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex));
  }

  return parts;
}

export function FormattedExplanation({ text, className, compact = false }: FormattedExplanationProps) {
  if (!text) return null;

  const isHindi = containsDevanagari(text);

  // Normalize line endings and split into paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={cn(
        "space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed",
        isHindi && "font-hindi",
        className
      )}
    >
      {paragraphs.map((para, pIdx) => {
        // Detect section headers
        const isConceptHeader =
          para.startsWith("**नियम") ||
          para.startsWith("**अवधारणा") ||
          para.toLowerCase().includes("grammar concept");
        const isEliminationHeader =
          para.startsWith("**विकल्प विश्लेषण") ||
          para.startsWith("**elimination") ||
          para.toLowerCase().includes("elimination logic");

        // Split lines within paragraph
        const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);

        return (
          <div
            key={pIdx}
            className={cn(
              "rounded-lg",
              isConceptHeader && "bg-primary/5 border border-primary/15 p-2.5 print:bg-neutral-50 print:border-neutral-300 print:p-2",
              isEliminationHeader && "bg-muted/40 border border-border/60 p-2.5 print:bg-neutral-50 print:border-neutral-300 print:p-2",
              !isConceptHeader && !isEliminationHeader && "py-0.5"
            )}
          >
            {lines.map((line, lIdx) => {
              const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("* ");
              const cleanLine = isBullet ? line.replace(/^[•\-*]\s*/, "") : line;

              return (
                <div
                  key={lIdx}
                  className={cn(
                    "flex items-start gap-1.5",
                    lIdx > 0 && "mt-1",
                    isBullet && "pl-1"
                  )}
                >
                  {isBullet && (
                    <span className="text-primary/70 font-bold select-none shrink-0 leading-5">
                      •
                    </span>
                  )}
                  <span className={cn("flex-1", compact && "text-[11px] print:text-[10px]")}>
                    {renderMarkdownInline(cleanLine)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
