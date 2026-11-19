"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Copy, AlertCircle, Sparkles, FileText } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"review" | "fresh">("review");

  const effectivePrompt =
    activeTab === "fresh" && candidateData?.freshGenerationPrompt
      ? candidateData.freshGenerationPrompt
      : candidateData?.geminiPrompt || candidateData?.freshGenerationPrompt || "";

  return (
    <div className="pt-3 border-t border-border/40 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <p className="text-xs text-muted-foreground">
          {loadingCandidates
            ? "Fetching candidate questions from the pool, please wait..."
            : candidateData?.isComplete
            ? "✓ This topic is 100% complete! Use 'Copy Fresh 2027 Prompt' to generate new questions."
            : candidateData?.isFinalTopicSet
            ? `⚡ Final Partial Set ready (${candidateData.candidateCount} questions remaining in pool). Copy prompt for Gemini review.`
            : candidateData
            ? `Candidate questions ready (${candidateData.candidateCount} questions). Copy prompt for Gemini review or create brand new questions.`
            : candidateError
            ? "Could not load candidate questions. Please verify your selection or retry."
            : "Select a Subject and Master Topic above to load candidate questions from the pool."}
        </p>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto">
          {(candidateData?.geminiPrompt || candidateData?.freshGenerationPrompt) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTogglePrompt}
              disabled={loadingCandidates}
              className="h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground cursor-pointer flex-1 sm:flex-initial"
            >
              {promptOpen ? "Hide Prompt Preview" : "Show Prompt Preview"}
            </Button>
          )}

          {/* Review Candidate Questions Prompt Button (Disabled if topic is already 100% complete) */}
          {!candidateData?.isComplete && (
            <Button
              type="button"
              size="sm"
              onClick={onCopyPrompt}
              disabled={!candidateData?.geminiPrompt || loadingCandidates}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
            >
              {loadingCandidates ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span>Review Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Review Prompt</span>
                </>
              )}
            </Button>
          )}

          {/* Fresh 2027 Question Generation Prompt Button */}
          {candidateData?.freshGenerationPrompt && (
            <Button
              type="button"
              variant={candidateData?.isComplete ? "default" : "outline"}
              size="sm"
              onClick={onCopyFreshPrompt}
              disabled={loadingCandidates}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial border-primary/30 text-primary hover:bg-primary/10"
            >
              {copiedFreshPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span>Fresh Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>नये प्रश्न (2027) प्रॉम्प्ट</span>
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
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "review"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-3 w-3 inline mr-1" />
                Candidate Review Prompt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("fresh")}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === "fresh"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3 inline mr-1" />
                Fresh 2027 Generation Prompt
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
