"use client";

import { Bookmark, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn, containsDevanagari, cleanQuestionPrompt } from "@/lib/utils";
import { QuestionType } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionSourceMeta } from "./QuestionSourceMeta";

interface QuestionShellProps {
  number: number;
  type: QuestionType | string;
  questionText: string;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  children: React.ReactNode;
  reviewBadge?: "correct" | "incorrect" | "unanswered";
  missCount?: number;
  unwrapped?: boolean;
  reference?: string | null;
  meta?: Record<string, unknown> | null;
}

export function QuestionShell({
  number,
  type,
  questionText,
  isBookmarked,
  onToggleBookmark,
  children,
  reviewBadge,
  missCount: _missCount,
  unwrapped = false,
  reference,
  meta,
}: QuestionShellProps) {
  const { showToast } = useToast();

  function handleBookmarkClick() {
    onToggleBookmark();
    showToast(
      isBookmarked ? "Bookmark removed" : "Question saved to bookmarks",
      isBookmarked ? "info" : "success"
    );
  }

  const cleanedText = cleanQuestionPrompt(questionText, type);
  const isHindi = containsDevanagari(cleanedText || questionText);

  const content = (
    <>
      {/* Single Compact Question Header Row */}
      <div className="mb-2 sm:mb-2.5 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5 overflow-hidden">
          {/* 1. Question number: fixed / non-shrinking */}
          <span className="flex h-5.5 min-w-5.5 sm:h-6.5 sm:min-w-6.5 shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[11px] sm:text-xs font-semibold tabular-nums text-foreground">
            {number}
          </span>

          {reviewBadge && (
            <Badge
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium whitespace-nowrap",
                reviewBadge === "correct" &&
                "border-success/25 bg-success/10 text-success",
                reviewBadge === "incorrect" &&
                "border-destructive/25 bg-destructive/10 text-destructive",
                reviewBadge === "unanswered" &&
                "border-border bg-muted text-muted-foreground"
              )}
            >
              {reviewBadge === "correct" && <CheckCircle2 className="h-3 w-3" />}
              {reviewBadge === "incorrect" && <XCircle className="h-3 w-3" />}
              {reviewBadge === "unanswered" && <HelpCircle className="h-3 w-3" />}
              {reviewBadge === "correct"
                ? "Correct"
                : reviewBadge === "incorrect"
                  ? "Incorrect"
                  : "Skipped"}
            </Badge>
          )}

          {/* 3. Inline PYQ & Exam reference (shrinkable) */}
          <QuestionSourceMeta reference={reference} meta={meta} />
        </div>

        {/* 4. Bookmark: fixed / non-shrinking on right */}
        <Tooltip>
          <TooltipTrigger
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Remove bookmark" : "Save question"}
            className={cn(
              "flex h-7 sm:h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium",
              "transition-colors active:scale-[0.98] cursor-pointer",
              isBookmarked
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current text-primary-foreground")} />
            <span className="hidden sm:inline">
              {isBookmarked ? "Saved" : "Bookmark"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">
            {isBookmarked ? "Remove bookmark" : "Save for revision"}
          </TooltipContent>
        </Tooltip>
      </div>

      {cleanedText ? (
        <p
          className={cn(
            "mb-3.5 sm:mb-4 text-[0.95rem] leading-relaxed font-medium text-foreground sm:text-[1.025rem] sm:leading-8 whitespace-pre-wrap",
            isHindi && "font-hindi"
          )}
        >
          {cleanedText}
        </p>
      ) : null}

      {children}
    </>
  );

  if (unwrapped) return <div>{content}</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-xs">
      {content}
    </div>
  );
}
