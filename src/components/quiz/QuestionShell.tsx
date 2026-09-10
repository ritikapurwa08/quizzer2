"use client";

import { Bookmark, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn, containsDevanagari, cleanQuestionPrompt } from "@/lib/utils";
import { getQuestionTypeLabel, QuestionType } from "@/lib/constants";
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
  missCount,
  unwrapped = false,
  reference,
  meta,
}: QuestionShellProps) {
  const { showToast } = useToast();

  function handleBookmarkClick() {
    onToggleBookmark();
    showToast(
      isBookmarked ? "बुकमार्क हटा दिया गया" : "प्रश्न बुकमार्क में सहेजा गया",
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
          <span className="flex h-5.5 min-w-5.5 sm:h-6.5 sm:min-w-6.5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] sm:text-xs font-semibold tabular-nums text-primary">
            {number}
          </span>

          {/* 2. Question type: readable / non-shrinking */}
          {/* <Badge
            variant="secondary"
            className="shrink-0 rounded-full px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 text-[10.5px] sm:text-xs font-medium tracking-normal font-hindi whitespace-nowrap"
          >
            {getQuestionTypeLabel(type)}
          </Badge>

          {missCount !== undefined && missCount > 0 && (
            <Badge
              variant="destructive"
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium font-hindi whitespace-nowrap"
            >
              {missCount}× गलत
            </Badge>
          )} */}

          {reviewBadge && (
            <Badge
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium font-hindi whitespace-nowrap",
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
                ? "सही"
                : reviewBadge === "incorrect"
                  ? "गलत"
                  : "छोड़ा गया"}
            </Badge>
          )}

          {/* 3. Inline PYQ & Exam reference (shrinkable) */}
          <QuestionSourceMeta reference={reference} meta={meta} />
        </div>

        {/* 4. Bookmark: fixed / non-shrinking on right */}
        <Tooltip>
          <TooltipTrigger
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "बुकमार्क हटाएं" : "प्रश्न सहेजें"}
            className={cn(
              "flex h-7 sm:h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium",
              "transition-colors active:scale-[0.98] cursor-pointer font-hindi",
              isBookmarked
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-amber-400 text-amber-400")} />
            <span className="hidden sm:inline">
              {isBookmarked ? "सहेजा गया" : "बुकमार्क"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-hindi">
            {isBookmarked ? "बुकमार्क हटाएं" : "रिवीजन के लिए सहेजें"}
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
