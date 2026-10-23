"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { formatScore } from "@/lib/utils";
import {
  Share2,
  Copy,
  Check,
  MessageSquare,
  Send,
  ExternalLink,
  Award,
} from "lucide-react";

interface ShareResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testSetName: string;
  subjectName?: string;
  topicName?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
}

export function ShareResultModal({
  open,
  onOpenChange,
  testSetName,
  subjectName,
  topicName,
  score,
  totalQuestions,
  correctCount,
  incorrectCount,
}: ShareResultModalProps) {
  const { showToast } = useToast();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const maxScore = totalQuestions * 2;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const percentage =
    maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : "0";

  // Current URL in browser
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // Structured scorecard text
  const shareText = `🏆 Quizzer Test Result: ${testSetName}
🎯 Score: ${formatScore(score)} / ${maxScore} pts (${percentage}%)
✅ Correct: ${correctCount} | ❌ Incorrect: ${incorrectCount} | ⚡ Accuracy: ${accuracy}%
📚 Subject: ${subjectName || "Rajasthan GK"}${topicName ? ` • ${topicName}` : ""}
🔗 Check it out on Quizzer: ${shareUrl}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedText(true);
      showToast("Scorecard text copied to clipboard!", "success");
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      showToast("Could not copy to clipboard", "warning");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast("Result link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast("Could not copy link", "warning");
    }
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      `🏆 Quizzer Test Result: ${testSetName}\n🎯 Score: ${formatScore(score)} / ${maxScore} pts (${percentage}%)\n✅ Correct: ${correctCount} | ❌ Incorrect: ${incorrectCount}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quizzer Result: ${testSetName}`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-5 sm:p-6 rounded-2xl border-border bg-card">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Share2 className="h-5 w-5 text-primary" />
            Share Your Test Result
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share your scorecard with study groups, friends, or mentors.
          </DialogDescription>
        </DialogHeader>

        {/* ── Preview Scorecard Card ── */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5 font-sans">
          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {subjectName || "Subject"}
              </p>
              <h3 className="text-sm font-bold text-foreground line-clamp-1">
                {testSetName}
              </h3>
            </div>
            <span className="shrink-0 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
              {percentage}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-foreground text-sm">
              {formatScore(score)} <span className="text-xs text-muted-foreground font-semibold">/ {maxScore} pts</span>
            </span>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="text-emerald-700 dark:text-emerald-400">✓ {correctCount} Correct</span>
              <span className="text-rose-700 dark:text-rose-400">✗ {incorrectCount} Incorrect</span>
              <span className="text-muted-foreground">{accuracy}% Acc.</span>
            </div>
          </div>
        </div>

        {/* ── Quick Share Buttons ── */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppShare}
              className="h-10 text-xs font-semibold rounded-xl border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-700 dark:hover:text-emerald-400 gap-2 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              WhatsApp
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleTelegramShare}
              className="h-10 text-xs font-semibold rounded-xl border-border hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-700 dark:hover:text-sky-400 gap-2 cursor-pointer"
            >
              <Send className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Telegram
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              onClick={handleCopyText}
              className="h-10 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-2 cursor-pointer w-full"
            >
              {copiedText ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  Copied Scorecard Text!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Scorecard Summary
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleCopyLink}
              className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ExternalLink className="h-3.5 w-3.5" />}
              {copiedLink ? "Link Copied!" : "Copy Result Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
