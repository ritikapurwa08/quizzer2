"use client";

import { CheckCircle2, X } from "lucide-react";

export interface ImportConfirmationData {
  addedCount: number;
  subjectName: string;
  topicName: string;
  subTopicName?: string;
  setNames: string[];
}

interface ImportConfirmationBannerProps {
  confirmation: ImportConfirmationData | null;
  onDismiss: () => void;
}

export function ImportConfirmationBanner({
  confirmation,
  onDismiss,
}: ImportConfirmationBannerProps) {
  if (!confirmation) return null;

  return (
    <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-medium animate-in fade-in-0 duration-150">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-emerald-700 dark:text-emerald-200">
            ✓ Verified: +{confirmation.addedCount} questions added to Filtered (
            {confirmation.topicName}
            {confirmation.subTopicName ? ` › ${confirmation.subTopicName}` : ""}
            ) and deducted from Unused.
          </p>
          <p className="text-[11px] text-muted-foreground">
            Committed to {confirmation.setNames.length} set(s): {confirmation.setNames.join(", ")} under {confirmation.subjectName}.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer p-0.5"
        title="Dismiss confirmation"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
