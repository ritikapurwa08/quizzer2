"use client";

import { Bookmark, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn, containsDevanagari, cleanQuestionPrompt } from "@/lib/utils";
import { getQuestionTypeLabel, QuestionType } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium tabular-nums text-primary">
            {number}
          </span>

          <Badge
            variant="secondary"
            className="rounded-full px-2.5 py-1 text-xs font-medium tracking-normal font-hindi"
          >
            {getQuestionTypeLabel(type)}
          </Badge>

          {missCount !== undefined && missCount > 0 && (
            <Badge
              variant="destructive"
              className="rounded-full px-2 py-1 text-[11px] font-medium font-hindi"
            >
              {missCount}× गलत
            </Badge>
          )}

          {reviewBadge && (
            <Badge
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium font-hindi",
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
        </div>

        <Tooltip>
          <TooltipTrigger
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "बुकमार्क हटाएं" : "प्रश्न सहेजें"}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium",
              "transition-colors active:scale-[0.98] cursor-pointer font-hindi",
              isBookmarked
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/15"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-amber-400 text-amber-400")} />
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
            "mb-5 text-[1rem] leading-7 font-medium text-foreground sm:text-[1.05rem] sm:leading-8",
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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      {content}
    </div>
  );
}
