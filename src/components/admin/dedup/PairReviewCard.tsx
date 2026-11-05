import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Check, X } from "lucide-react";
import { cn, containsDevanagari } from "@/lib/utils";
import { ReviewPairItem, DecisionType } from "./types";

interface PairReviewCardProps {
  pair: ReviewPairItem;
  selectedDecision: DecisionType | null;
  onSelectDecision: (decision: DecisionType) => void;
  reviewNote: string;
  onChangeReviewNote: (note: string) => void;
  onSubmitReview: (pairKey: string, decision: DecisionType, note: string) => void;
  submitting?: boolean;
}

export const PairReviewCard: React.FC<PairReviewCardProps> = ({
  pair,
  selectedDecision,
  onSelectDecision,
  reviewNote,
  onChangeReviewNote,
  onSubmitReview,
  submitting = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Alert for Conflicting Keys */}
      {pair.why === "similar_text_DIFFERENT_answer" && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs flex items-center justify-between gap-3 text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">
              Potential Contradictory Answer Key: Question A marked as [{pair.a.answer}], Question B marked as [{pair.b.answer}]. Inspect official answer keys below!
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold shrink-0">
            Similarity: {Math.round(pair.similarity * 100)}%
          </span>
        </div>
      )}

      {/* Side-by-Side Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── QUESTION A CARD ── */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                  Question A
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {pair.a.id}
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                Answer Key: {pair.a.answer}
              </Badge>
            </div>

            <div
              className={cn(
                "text-xs sm:text-sm font-bold text-foreground leading-relaxed",
                containsDevanagari(pair.a.q) && "font-hindi text-base"
              )}
            >
              {pair.a.q}
            </div>

            {/* Options list A */}
            <div className="space-y-1.5 pt-2">
              {pair.a.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                const isCorrect = letter === pair.a.answer;
                return (
                  <div
                    key={oIdx}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 font-bold text-foreground"
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
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* ── QUESTION B CARD ── */}
        <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  Question B
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {pair.b.id}
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                Answer Key: {pair.b.answer}
              </Badge>
            </div>

            <div
              className={cn(
                "text-xs sm:text-sm font-bold text-foreground leading-relaxed",
                containsDevanagari(pair.b.q) && "font-hindi text-base"
              )}
            >
              {pair.b.q}
            </div>

            {/* Options list B */}
            <div className="space-y-1.5 pt-2">
              {pair.b.options.map((opt, oIdx) => {
                const letter = String.fromCharCode(65 + oIdx);
                const isCorrect = letter === pair.b.answer;
                return (
                  <div
                    key={oIdx}
                    className={cn(
                      "p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors",
                      isCorrect
                        ? "bg-emerald-500/10 border-emerald-500/30 font-bold text-foreground"
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
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Review Decision Panel */}
      <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>Submit Audit Review Decision</span>
            {pair.review && (
              <span className="text-[10px] font-bold text-emerald-500 font-normal">
                (Current: {pair.review.decision})
              </span>
            )}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">1</kbd> Merge · <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">2</kbd> Keep Both
          </span>
        </div>

        {/* 4 Decision Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button
            type="button"
            variant={selectedDecision === "CONFIRMED_DUPLICATE" ? "default" : "outline"}
            onClick={() => onSelectDecision("CONFIRMED_DUPLICATE")}
            className={cn(
              "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3",
              selectedDecision === "CONFIRMED_DUPLICATE" && "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            <Check className="h-3.5 w-3.5" />
            <span>Merge (Duplicate)</span>
          </Button>

          <Button
            type="button"
            variant={selectedDecision === "DIFFERENT_QUESTION" ? "default" : "outline"}
            onClick={() => onSelectDecision("DIFFERENT_QUESTION")}
            className={cn(
              "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3",
              selectedDecision === "DIFFERENT_QUESTION" && "bg-foreground text-background"
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Keep Both (Distinct)</span>
          </Button>

          <Button
            type="button"
            variant={selectedDecision === "KEY_ERROR_A" ? "default" : "outline"}
            onClick={() => onSelectDecision("KEY_ERROR_A")}
            className={cn(
              "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3 text-rose-500 hover:text-rose-600",
              selectedDecision === "KEY_ERROR_A" && "bg-rose-600 hover:bg-rose-700 text-white"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Key Error in A</span>
          </Button>

          <Button
            type="button"
            variant={selectedDecision === "KEY_ERROR_B" ? "default" : "outline"}
            onClick={() => onSelectDecision("KEY_ERROR_B")}
            className={cn(
              "h-10 rounded-xl text-xs font-bold gap-1.5 cursor-pointer justify-start px-3 text-rose-500 hover:text-rose-600",
              selectedDecision === "KEY_ERROR_B" && "bg-rose-600 hover:bg-rose-700 text-white"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Key Error in B</span>
          </Button>
        </div>

        {/* Review Note Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Explanation / Note (Why merged or why answer was changed):
          </label>
          <Textarea
            value={reviewNote}
            onChange={(e) => onChangeReviewNote(e.target.value)}
            placeholder="E.g., दोनों में केवल वर्तनी का अंतर है। उत्तर D कर्नल टॉड ही सही है।"
            rows={2}
            className="text-xs rounded-xl bg-background border-border/80 font-hindi"
          />
        </div>

        {/* Submit & Next Button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Persists directly to <code>data/sets/dedup/user-reviews.json</code>
          </span>
          <Button
            type="button"
            disabled={!selectedDecision || submitting}
            onClick={() => {
              if (selectedDecision) {
                onSubmitReview(pair.pairKey, selectedDecision, reviewNote);
              }
            }}
            className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
          >
            {submitting ? "Saving..." : "Save Review & Next →"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

