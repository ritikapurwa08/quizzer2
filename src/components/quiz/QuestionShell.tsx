"use client";

import { Bookmark, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn, containsDevanagari, cleanQuestionPrompt } from "@/lib/utils";
import { getQuestionTypeLabel, QuestionType } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuestionShellProps {
  number: number;
  type: QuestionType | string;  // string covers legacy types from DB
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
      {/* Header: number + type + badges on left, bookmark on right */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Question number chip */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
            {number}
          </span>

          {/* Question type badge */}
          <Badge variant="secondary" className="text-xs tracking-wide px-2.5 py-0.5 rounded-full font-hindi font-medium">
            {getQuestionTypeLabel(type)}
          </Badge>

          {/* Miss count badge */}
          {missCount !== undefined && missCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full font-hindi">
              {missCount}× गलत
            </Badge>
          )}

          {/* Review status badge */}
          {reviewBadge && (
            <Badge
              className={cn(
                "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full capitalize border font-hindi",
                reviewBadge === "correct" && "bg-success/15 text-success border-success/25",
                reviewBadge === "incorrect" && "bg-destructive/15 text-destructive border-destructive/25",
                reviewBadge === "unanswered" && "bg-muted text-muted-foreground border-border"
              )}
            >
              {reviewBadge === "correct" && <CheckCircle2 className="h-3 w-3" />}
              {reviewBadge === "incorrect" && <XCircle className="h-3 w-3" />}
              {reviewBadge === "unanswered" && <HelpCircle className="h-3 w-3" />}
              {reviewBadge === "correct" ? "सही" : reviewBadge === "incorrect" ? "गलत" : "छोड़ा गया"}
            </Badge>
          )}
        </div>

        {/* Bookmark button — TooltipTrigger IS the button to avoid button-in-button */}
        <Tooltip>
          <TooltipTrigger
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "बुकमार्क हटाएं" : "प्रश्न सहेजें"}
            className={cn(
              "flex h-8 items-center gap-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer font-hindi",
              isBookmarked
                ? "bg-amber-500/15 border-amber-500/35 text-amber-400 hover:bg-amber-500/25"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 transition-all",
                isBookmarked && "fill-amber-400 text-amber-400"
              )}
            />
            <span className="hidden sm:inline">
              {isBookmarked ? "सहेजा गया" : "बुकमार्क"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-hindi">
            {isBookmarked ? "बुकमार्क हटाएं" : "रिवीजन के लिए सहेजें"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Question text — visually prominent, comfortable Devanagari line height */}
      {cleanedText ? (
        <p
          className={cn(
            "whitespace-pre-line font-semibold text-sm sm:text-base md:text-[1.05rem] mb-4.5 leading-relaxed text-foreground",
            isHindi && "font-hindi"
          )}
        >
          {cleanedText}
        </p>
      ) : null}

      {children}
    </>
  );

  if (unwrapped) {
    return <div>{content}</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
      {content}
    </div>
  );
}
