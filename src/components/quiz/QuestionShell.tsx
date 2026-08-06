"use client";

import { Bookmark, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn, containsDevanagari } from "@/lib/utils";
import { QUESTION_TYPE_LABELS, QuestionType } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

interface QuestionShellProps {
  number: number;
  type: QuestionType;
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

  const handleBookmarkClick = () => {
    onToggleBookmark();
    if (!isBookmarked) {
      showToast("Question bookmarked", "success");
    } else {
      showToast("Bookmark removed", "info");
    }
  };

  const isHindi = containsDevanagari(questionText);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
            {number}
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-md">
            {QUESTION_TYPE_LABELS[type]}
          </span>
          {missCount !== undefined && missCount > 0 && (
            <span className="text-xs font-medium text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-md border border-destructive/20">
              Missed {missCount}x
            </span>
          )}
          {reviewBadge && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize",
                reviewBadge === "correct" && "bg-success/15 text-success border border-success/30",
                reviewBadge === "incorrect" && "bg-destructive/15 text-destructive border border-destructive/30",
                reviewBadge === "unanswered" && "bg-muted text-muted-foreground"
              )}
            >
              {reviewBadge === "correct" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {reviewBadge === "incorrect" && <XCircle className="h-3.5 w-3.5" />}
              {reviewBadge === "unanswered" && <HelpCircle className="h-3.5 w-3.5" />}
              {reviewBadge}
            </span>
          )}
        </div>

        <button
          onClick={handleBookmarkClick}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-95 shrink-0 cursor-pointer",
            isBookmarked
              ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-sm"
              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-label="Bookmark question"
          title={isBookmarked ? "Remove bookmark" : "Bookmark question"}
        >
          <Bookmark
            className={cn(
              "h-4 w-4 transition-transform",
              isBookmarked && "fill-amber-500 text-amber-500 scale-110"
            )}
          />
          <span className="hidden sm:inline">{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
        </button>
      </div>

      <p
        className={cn(
          "whitespace-pre-line font-semibold text-base mb-4 leading-relaxed text-foreground",
          isHindi && "font-hindi"
        )}
      >
        {questionText}
      </p>

      {children}
    </>
  );

  if (unwrapped) {
    return <div>{content}</div>;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-sm">
      {content}
    </div>
  );
}
