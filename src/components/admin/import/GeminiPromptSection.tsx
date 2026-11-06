"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Check, Copy, AlertCircle } from "lucide-react";

interface GeminiPromptSectionProps {
  loadingCandidates: boolean;
  candidateData: {
    candidateCount: number;
    geminiPrompt: string;
    isComplete?: boolean;
    isFinalTopicSet?: boolean;
    remainingCount?: number;
    message?: string;
  } | null;
  candidateError: string | null;
  promptOpen: boolean;
  onTogglePrompt: () => void;
  copiedPrompt: boolean;
  onCopyPrompt: () => void;
}

export function GeminiPromptSection({
  loadingCandidates,
  candidateData,
  candidateError,
  promptOpen,
  onTogglePrompt,
  copiedPrompt,
  onCopyPrompt,
}: GeminiPromptSectionProps) {
  return (
    <div className="pt-3 border-t border-border/40 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <p className="text-xs text-muted-foreground">
          {loadingCandidates
            ? "Fetching candidate questions from the pool, please wait..."
            : candidateData?.isComplete
            ? "✓ This topic is 100% complete! All questions have already been published into live sets."
            : candidateData?.isFinalTopicSet
            ? `⚡ Final Partial Set ready (${candidateData.candidateCount} questions remaining in pool). Copy prompt for Gemini review.`
            : candidateData
            ? `Candidate questions ready (${candidateData.candidateCount} questions). Copy prompt for Gemini review.`
            : candidateError
            ? "Could not load candidate questions. Please verify your selection or retry."
            : "Select a Subject and Master Topic above to load candidate questions from the pool."}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {candidateData?.geminiPrompt && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTogglePrompt}
              disabled={loadingCandidates}
              className="h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {promptOpen ? "Hide Prompt Preview" : "Show Prompt Preview"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={onCopyPrompt}
            disabled={!candidateData?.geminiPrompt || loadingCandidates}
            className="h-9 px-4 text-xs font-semibold rounded-xl gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCandidates ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Fetching...</span>
              </>
            ) : copiedPrompt ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Gemini Prompt</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {candidateError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in-0 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{candidateError}</span>
        </div>
      )}

      {/* Collapsible preview: takes 0 space unless promptOpen */}
      {promptOpen && candidateData?.geminiPrompt && (
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 border border-border/50 p-3.5 font-mono text-[11px] leading-relaxed text-muted-foreground animate-in fade-in-0 duration-150">
          {candidateData.geminiPrompt}
        </pre>
      )}
    </div>
  );
}

