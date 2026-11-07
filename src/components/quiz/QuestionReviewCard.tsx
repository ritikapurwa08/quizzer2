"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { isUserAdmin } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { QuestionShell } from "./QuestionShell";
import { QUESTION_RENDERERS } from "./index";
import { FormattedExplanation } from "./FormattedExplanation";
import { SimilarQuestionsCarousel } from "./SimilarQuestionsCarousel";
import { GitCompare, Check, Trash2, Shield, X } from "lucide-react";
import {
  markLocalDuplicate,
  unmarkLocalDuplicate,
  getLocalDuplicatesForQuestion,
} from "@/lib/localdb/gkQuestions";
import { enrichQuestionStructure } from "@/lib/matchQuestionParser";

interface QuestionReviewCardProps {
  number: number;
  question: any;
  selectedAnswer?: string | string[];
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  reviewBadge?: "correct" | "incorrect" | "unanswered";
  missCount?: number;
}

export function QuestionReviewCard({
  number,
  question,
  selectedAnswer,
  isBookmarked,
  onToggleBookmark,
  reviewBadge,
  missCount,
}: QuestionReviewCardProps) {
  const me = useQuery(api.users.me);
  const isAdmin = isUserAdmin(me);
  const sourceId = question?.sourceQuestionId || question?.meta?.sourceQuestionId || question?._id || "";

  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [isMarking, setIsMarking] = useState(false);
  const [preferredIdInput, setPreferredIdInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin || !sourceId) return;
    getLocalDuplicatesForQuestion(sourceId).then((res) => {
      setDuplicates(res);
    }).catch(() => {});
  }, [isAdmin, sourceId]);

  const handleSaveDuplicate = async () => {
    if (!preferredIdInput.trim() || !sourceId) return;
    setIsSaving(true);
    try {
      const target = preferredIdInput.trim();
      await markLocalDuplicate(sourceId, target, me?.email || "admin");
      setDuplicates((prev) => Array.from(new Set([...prev, target])));
      setIsMarking(false);
      setPreferredIdInput("");
    } catch (e) {
      console.error("Failed to mark local duplicate:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnmarkDuplicate = async (prefId: string) => {
    try {
      await unmarkLocalDuplicate(sourceId, prefId);
      setDuplicates((prev) => prev.filter((id) => id !== prefId));
    } catch (e) {
      console.error("Failed to unmark duplicate:", e);
    }
  };

  const q = useMemo(() => {
    if (!question) return question;
    if (
      (!question.meta?.left || question.meta.left.length === 0) &&
      (!question.meta?.rows || question.meta.rows.length === 0)
    ) {
      return enrichQuestionStructure(question);
    }
    return question;
  }, [question]);

  const Renderer = QUESTION_RENDERERS[q?.type as keyof typeof QUESTION_RENDERERS] || QUESTION_RENDERERS.mcq;

  return (
    <Card className="border border-border bg-card shadow-xs rounded-xl overflow-hidden print:overflow-visible print:border-neutral-300 print:rounded-lg print:shadow-none print:mb-3 print:break-inside-avoid print:page-break-inside-avoid">
      {/* Main question + options */}
      <div className="p-4 sm:p-5 print:p-2.5">
        <QuestionShell
          number={number}
          type={q?.type}
          questionText={q?.questionText || q?.question}
          isBookmarked={isBookmarked}
          onToggleBookmark={onToggleBookmark}
          reviewBadge={reviewBadge}
          missCount={missCount}
          reference={q?.reference}
          meta={q?.meta}
          unwrapped
        >
          {Renderer ? (
            <Renderer
              question={q}
              selected={selectedAnswer}
              onSelect={() => {}}
              mode="review"
            />
          ) : (
            <div className="p-3 rounded-lg bg-muted text-muted-foreground text-xs">
              Preview not available for question type &ldquo;{q?.type}&rdquo;.
            </div>
          )}
        </QuestionShell>
      </div>

      {/* Explanation — separated by hairline divider, muted background tint */}
      {q?.explanation && (
        <div className="px-4 sm:px-5 py-3 border-t border-border/60 bg-muted/30 print:px-2.5 print:py-1.5 print:bg-neutral-50 print:border-neutral-200">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 print:text-[9px] print:mb-1">
              Detailed Explanation
            </p>
            <FormattedExplanation text={q.explanation} compact />
          </div>
        </div>
      )}

      {/* Similar Questions / Variations Carousel (Hidden on print) */}
      {q?.similarQuestions && q.similarQuestions.length > 0 && (
        <div className="px-4 sm:px-5 py-2 border-t border-border/60 bg-primary/2 print:hidden">
          <SimilarQuestionsCarousel similarQuestions={q.similarQuestions} />
        </div>
      )}

      {/* Admin-only In-Review Duplicate Management Bar (Hidden on print) */}
      {isAdmin && (
        <div className="px-4 sm:px-5 py-2.5 border-t border-border/60 bg-muted/15 flex flex-wrap items-center justify-between gap-2.5 print:hidden text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3 text-amber-500" /> Admin
            </span>
            {sourceId && (
              <Badge variant="outline" className="font-mono text-[10px] h-4.5 px-1.5">
                {sourceId}
              </Badge>
            )}

            {/* List marked duplicates */}
            {duplicates.map((prefId) => (
              <span
                key={prefId}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium text-[11px]"
              >
                <GitCompare className="h-3 w-3" />
                Duplicate of <strong className="font-mono">{prefId}</strong>
                <button
                  type="button"
                  onClick={() => handleUnmarkDuplicate(prefId)}
                  className="ml-1 hover:text-destructive cursor-pointer"
                  title="Remove duplicate mark"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isMarking ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMarking(true)}
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg cursor-pointer"
              >
                <GitCompare className="h-3.5 w-3.5" />
                <span>Mark as Duplicate</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  value={preferredIdInput}
                  onChange={(e) => setPreferredIdInput(e.target.value)}
                  placeholder="Preferred ID (e.g. rg_001234)"
                  className="h-7 text-xs w-44 font-mono rounded-lg border-border"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveDuplicate}
                  disabled={!preferredIdInput.trim() || isSaving}
                  className="h-7 px-2.5 text-xs rounded-lg cursor-pointer gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMarking(false);
                    setPreferredIdInput("");
                  }}
                  className="h-7 px-1.5 text-xs rounded-lg"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
