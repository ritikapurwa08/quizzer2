import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

interface ImportAiReviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  importText: string;
  onChangeImportText: (text: string) => void;
  detectedCount: number;
  importError: string | null;
  importSuccessCount: number | null;
  importing: boolean;
  onImport: () => void;
}

export const ImportAiReviewDialog: React.FC<ImportAiReviewDialogProps> = ({
  isOpen,
  onOpenChange,
  importText,
  onChangeImportText,
  detectedCount,
  importError,
  importSuccessCount,
  importing,
  onImport,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !importing && onOpenChange(val)}>
      <DialogContent className="rounded-2xl border border-border bg-card shadow-2xl max-w-xl p-5 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Import AI Review Batch
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Paste the JSON array response received from ChatGPT, Claude, or Gemini for any batch from{" "}
              <code className="text-primary font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                data/sets/dedup/ai_batches/
              </code>
              .
            </DialogDescription>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Paste AI Response JSON:</span>
              {detectedCount > 0 ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px] font-semibold">
                  ✓ {detectedCount} items detected
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[11px]">Accepts raw JSON array</span>
              )}
            </div>
            <Textarea
              value={importText}
              onChange={(e) => onChangeImportText(e.target.value)}
              placeholder={`[\n  {\n    "id": "rg_000127___rg_011425",\n    "decision": "CONFIRMED_DUPLICATE",\n    "preferred_id": "rg_011425",\n    "correct_answer": "D",\n    "note": "दोनों समान हैं। कर्नल टॉड सही है।"\n  }\n]`}
              rows={11}
              className="font-mono text-xs bg-muted/30 border-border focus:border-primary/50 resize-y"
            />
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccessCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Successfully imported {importSuccessCount} reviews! Station updated.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              disabled={importing}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={importing || detectedCount === 0}
              onClick={onImport}
              className="rounded-xl text-xs font-semibold h-9 gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {importing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Import {detectedCount} Reviews</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

