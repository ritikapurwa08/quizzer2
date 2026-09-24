"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

interface PdfViewerProps {
  pdfPath?: string | null;
  topicTitle?: string;
  hasPdf?: boolean;
}

export function PdfViewer({ pdfPath, topicTitle = "Topic", hasPdf = true }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);

  if (!hasPdf || !pdfPath) {
    return (
      <EmptyState
        icon={FileText}
        title="PDF notes not available yet"
        description="Official PDF study notes will be uploaded soon for this topic."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Action / Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-foreground truncate font-hindi">
              {topicTitle} — PDF Notes
            </h3>
            <p className="text-xs text-muted-foreground">
              Official e-booklet for offline study and printing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            className="h-9 px-3 text-xs font-semibold rounded-xl border-border gap-1.5 cursor-pointer"
          >
            <a href={pdfPath} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open (New Tab)</span>
            </a>
          </Button>

          <Button
            asChild
            className="h-9 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
          >
            <a href={pdfPath} download>
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Embedded Viewer (Desktop) & Fallback */}
      {loadError ? (
        <div className="p-6 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              Could not load PDF preview in browser
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You can download the PDF directly or open it in a new window using the button below.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <a href={pdfPath} download>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download PDF
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile Notice */}
          <div className="block sm:hidden text-center py-2">
            <p className="text-[11px] text-muted-foreground">
              For convenient reading, use &ldquo;Open (New Tab)&rdquo; or &ldquo;Download PDF&rdquo; above.
            </p>
          </div>

          <div className="hidden sm:block relative rounded-2xl border border-border overflow-hidden bg-muted/20 shadow-xs h-[750px]">
            <iframe
              src={`${pdfPath}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={`${topicTitle} PDF Notes`}
              onError={() => setLoadError(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
