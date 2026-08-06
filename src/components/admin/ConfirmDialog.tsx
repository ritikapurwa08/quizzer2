"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: "destructive" | "primary";
}

/** Stitch-spec confirm dialog: backdrop blur, rounded-xl card, colored action button */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Delete",
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            className="h-9 text-xs font-semibold rounded-lg border-border cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            className="h-9 text-xs font-semibold rounded-lg cursor-pointer"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
