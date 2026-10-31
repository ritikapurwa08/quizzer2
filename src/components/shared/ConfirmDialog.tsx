"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, CheckCircle2, Circle, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogStats {
  total?: number;
  answered?: number;
  unanswered?: number;
  bookmarked?: number;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  stats?: ConfirmDialogStats;
  onConfirm: () => any;
  confirmLabel?: React.ReactNode;
  variant?: "destructive" | "primary" | "default";
  isLoading?: boolean;
  loadingLabel?: React.ReactNode;
}

/** Stitch-spec confirm dialog: backdrop blur, rounded-2xl card, optional stats breakdown, loading state */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  stats,
  onConfirm,
  confirmLabel = "Confirm",
  variant = "destructive",
  isLoading = false,
  loadingLabel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="rounded-2xl border border-border bg-card shadow-xl max-w-sm p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-2">
          {variant === "destructive" && (
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>

        {/* Optional Question Status Breakdown (for test submission) */}
        {stats && (
          <div className="my-3 p-3 rounded-xl border border-border bg-muted/30 grid grid-cols-3 gap-2 text-center">
            <div className="space-y-0.5">
              <span className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Answered
              </span>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {stats.answered ?? 0}
                {stats.total !== undefined && (
                  <span className="text-xs text-muted-foreground font-normal"> / {stats.total}</span>
                )}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                <Circle className="h-3 w-3" /> Unanswered
              </span>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {stats.unanswered ?? 0}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                <Bookmark className="h-3 w-3" /> Flagged
              </span>
              <p className="text-sm font-bold text-foreground tabular-nums">
                {stats.bookmarked ?? 0}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border/60">
          <Button
            variant="outline"
            disabled={isLoading}
            className="h-9 px-3.5 text-xs font-semibold rounded-xl border-border cursor-pointer disabled:opacity-50"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isLoading}
            className={cn(
              "h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer transition-all gap-1.5",
              isLoading && "cursor-wait opacity-90"
            )}
            onClick={async () => {
              if (isLoading) return;
              try {
                const result = onConfirm();
                if (result instanceof Promise) {
                  await result;
                }
              } catch (err) {
                // error handled in caller
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>{loadingLabel || "Submitting..."}</span>
              </span>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

