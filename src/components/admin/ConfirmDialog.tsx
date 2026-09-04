"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => any;
  confirmLabel?: React.ReactNode;
  variant?: "destructive" | "primary" | "default";
  isLoading?: boolean;
  loadingLabel?: React.ReactNode;
}

/** Stitch-spec confirm dialog: backdrop blur, rounded-xl card, colored action button with animated loading state */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  variant = "destructive",
  isLoading = false,
  loadingLabel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !isLoading && onOpenChange(val)}>
      <DialogContent className="rounded-xl border border-border bg-card shadow-xl max-w-sm p-6">
        <div className="flex items-start gap-3 mb-2">
          {variant === "destructive" && (
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
          <div>
            <DialogTitle className="text-base font-bold text-foreground tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border/60">
          <Button
            variant="outline"
            disabled={isLoading}
            className="h-9 text-xs font-semibold rounded-lg border-border cursor-pointer disabled:opacity-50"
            onClick={() => onOpenChange(false)}
          >
            रद्द करें (Cancel)
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isLoading}
            className={cn(
              "h-9 text-xs font-semibold rounded-lg cursor-pointer transition-all gap-1.5",
              isLoading && "cursor-wait opacity-90"
            )}
            onClick={async () => {
              if (isLoading) return;
              const result = onConfirm();
              if (result instanceof Promise) {
                await result;
              }
              if (!isLoading) {
                onOpenChange(false);
              }
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>{loadingLabel || "प्रतीक्षा करें…"}</span>
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
