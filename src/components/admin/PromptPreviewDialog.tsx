"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Eye } from "lucide-react";

interface PromptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  onCopySuccess?: () => void;
}

export function PromptPreviewDialog({
  open,
  onOpenChange,
  promptText,
  onCopySuccess,
}: PromptPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    if (onCopySuccess) {
      onCopySuccess();
    }
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Preview AI Generation Prompt
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              This complete prompt will be copied to your clipboard to paste into ChatGPT, Gemini, Claude, Grok, or DeepSeek.
            </DialogDescription>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 font-semibold shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                Copied Prompt!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy AI Prompt
              </>
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/60 border rounded-lg p-4 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap select-all">
          {promptText}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
