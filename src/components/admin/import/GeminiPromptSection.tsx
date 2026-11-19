"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Copy, AlertCircle, Sparkles, FileText, Eye, EyeOff } from "lucide-react";

interface GeminiPromptSectionProps {
  loadingCandidates: boolean;
  candidateData: {
    candidateCount: number;
    geminiPrompt: string;
    freshGenerationPrompt?: string;
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
  copiedFreshPrompt?: boolean;
  onCopyFreshPrompt?: () => void;
}

export function GeminiPromptSection({
  loadingCandidates,
  candidateData,
  candidateError,
  promptOpen,
  onTogglePrompt,
  copiedPrompt,
  onCopyPrompt,
  copiedFreshPrompt,
  onCopyFreshPrompt,
}: GeminiPromptSectionProps) {
  const [lastCopiedType, setLastCopiedType] = useState<"review" | "new">("review");
  const [activeTab, setActiveTab] = useState<"review" | "fresh">("review");

  const effectivePrompt =
    activeTab === "fresh" && candidateData?.freshGenerationPrompt
      ? candidateData.freshGenerationPrompt
      : candidateData?.geminiPrompt || candidateData?.freshGenerationPrompt || "";

  function handlePreviewToggle() {
    if (!promptOpen) {
      // Auto-detect which prompt was last interacted with
      setActiveTab(
        lastCopiedType === "new" || (candidateData?.isComplete && !candidateData?.geminiPrompt)
          ? "fresh"
          : "review"
      );
    }
    onTogglePrompt();
  }

  function handleReviewClick() {
    setLastCopiedType("review");
    setActiveTab("review");
    onCopyPrompt();
  }

  function handleNewClick() {
    setLastCopiedType("new");
    setActiveTab("fresh");
    onCopyFreshPrompt?.();
  }

  return (
    <div className="pt-3 border-t border-border/40 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <p className="text-xs text-muted-foreground truncate">
          {loadingCandidates
            ? "Fetching candidate questions, please wait..."
            : candidateData?.isComplete
            ? "✓ Topic is 100% complete! Click 'New' to generate fresh questions."
            : candidateData?.isFinalTopicSet
            ? `⚡ Final set ready (${candidateData.candidateCount} Qs). Click Review or New.`
            : candidateData
            ? `Candidate questions ready (${candidateData.candidateCount} Qs). Click Review or New.`
            : candidateError
            ? "Could not load candidate questions."
            : "Select Subject and Topic above to load prompts."}
        </p>

        {/* Ultra-compact action buttons: Preview, Review, New */}
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          {(candidateData?.geminiPrompt || candidateData?.freshGenerationPrompt) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviewToggle}
              disabled={loadingCandidates}
              className="h-8 px-2.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground cursor-pointer gap-1 shrink-0"
              title="Show or hide prompt preview"
            >
              {promptOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{promptOpen ? "Hide" : "Preview"}</span>
            </Button>
          )}

          {/* Review Candidate Questions Button */}
          {!candidateData?.isComplete && (
            <Button
              type="button"
              size="sm"
              onClick={handleReviewClick}
              disabled={!candidateData?.geminiPrompt || loadingCandidates}
              className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title="Copy Candidate Review Prompt"
            >
              {loadingCandidates ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Review</span>
                </>
              )}
            </Button>
          )}

          {/* Fresh 2027 Question Generation Button */}
          {candidateData?.freshGenerationPrompt && (
            <Button
              type="button"
              variant={candidateData?.isComplete ? "default" : "outline"}
              size="sm"
              onClick={handleNewClick}
              disabled={loadingCandidates}
              className="h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              title="Copy Fresh 2027 Question Generation Prompt"
            >
              {copiedFreshPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>New</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {candidateError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium animate-in fade-in-0 duration-150">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{candidateError}</span>
        </div>
      )}

      {/* Collapsible preview: takes 0 space unless promptOpen */}
      {promptOpen && effectivePrompt && (
        <div className="space-y-2 animate-in fade-in-0 duration-150">
          {candidateData?.geminiPrompt && candidateData?.freshGenerationPrompt && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("review")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "review"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3 inline mr-1" />
                Review Prompt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fresh")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === "fresh"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3 inline mr-1" />
                New (2027) Prompt
              </button>
            </div>
          )}
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-muted/60 border border-border/50 p-3.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {effectivePrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
