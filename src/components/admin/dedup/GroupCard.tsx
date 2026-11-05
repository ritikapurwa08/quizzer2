import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { cn, containsDevanagari } from "@/lib/utils";
import { MergedGroupItem } from "./types";

interface GroupCardProps {
  group: MergedGroupItem;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const canonical = group.members[0];
  if (!canonical) return null;

  return (
    <div className="space-y-4">
      {/* 1. CANONICAL QUESTION */}
      <Card className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/[0.02] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-emerald-500 text-white uppercase tracking-wider">
              ✓ CANONICAL (KEPT IN POOL)
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              ID: {canonical.id}
            </span>
            {canonical.exam && (
              <Badge variant="outline" className="text-[10px] bg-background">
                {canonical.exam} {canonical.year ? `(${canonical.year})` : ""}
              </Badge>
            )}
          </div>
          <Badge className="font-bold text-xs bg-emerald-500/15 text-emerald-500 border-emerald-500/30">
            Official Key: {canonical.answer}
          </Badge>
        </div>

        {/* Question Stem */}
        <p className="text-sm sm:text-base font-bold text-foreground font-hindi leading-relaxed">
          {canonical.question}
        </p>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {canonical.options.map((opt, oIdx) => {
            const letter = String.fromCharCode(65 + oIdx);
            const isCorrect = letter === canonical.answer;
            return (
              <div
                key={oIdx}
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                  isCorrect
                    ? "bg-emerald-500/15 border-emerald-500/40 font-bold text-foreground"
                    : "bg-muted/30 border-border/60 text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black",
                    isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                  {opt}
                </span>
                {isCorrect && (
                  <span className="ml-auto text-[10px] font-bold text-emerald-500">
                    ✓ Correct Option
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. DUPLICATE VARIANTS (MERGED & REMOVED) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
          <span>
            Duplicate Variants Merged into this Question ({group.duplicateVariantsCount}):
          </span>
          <span className="text-[11px] text-amber-500">
            All variants confirmed identical in fact and answer key
          </span>
        </div>

        {group.members.slice(1).map((variant, vIdx) => (
          <Card
            key={variant.id}
            className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-card shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 uppercase tracking-wider">
                  Duplicate #{vIdx + 1} (Merged & Removed)
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  ID: {variant.id}
                </span>
                {variant.exam && (
                  <Badge variant="outline" className="text-[10px] bg-background">
                    {variant.exam} {variant.year ? `(${variant.year})` : ""}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="font-bold text-xs">
                Answer Key: {variant.answer}
              </Badge>
            </div>

            {/* Question Stem */}
            <p className="text-xs sm:text-sm font-semibold text-foreground font-hindi leading-relaxed">
              {variant.question}
            </p>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {variant.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                const isCorrect = letter === variant.answer;
                return (
                  <div
                    key={oIdx}
                    className={cn(
                      "p-2 rounded-xl border text-xs flex items-center gap-2",
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 font-semibold text-foreground"
                        : "bg-muted/20 border-border/50 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-black",
                        isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {letter}
                    </span>
                    <span className={cn(containsDevanagari(opt) && "font-hindi")}>
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>
                Verified duplicate: tests identical concept with matching official answer ({variant.answer}).
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
