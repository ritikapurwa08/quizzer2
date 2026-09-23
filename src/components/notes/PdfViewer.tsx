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

export function PdfViewer({ pdfPath, topicTitle = "टॉपिक", hasPdf = true }: PdfViewerProps) {
  const [loadError, setLoadError] = useState(false);

  if (!hasPdf || !pdfPath) {
    return (
      <EmptyState
        icon={FileText}
        title="PDF नोट्स अभी उपलब्ध नहीं हैं"
        description="इस टॉपिक के आधिकारिक PDF नोट्स शीघ्र ही अपलोड किए जाएंगे। कृपया अध्ययन सामग्री पढ़ें या अभ्यास सेट हल करें।"
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
              {topicTitle} — पूर्ण PDF नोट्स
            </h3>
            <p className="text-xs text-muted-foreground font-hindi">
              प्रिंट एवं ऑफलाइन अध्ययन के लिए आधिकारिक ई-बुकलेट
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
              <span>खोलें (New Tab)</span>
            </a>
          </Button>

          <Button
            asChild
            className="h-9 px-3 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
          >
            <a href={pdfPath} download>
              <Download className="h-3.5 w-3.5" />
              <span>डाउनलोड PDF</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Embedded Viewer (Desktop) & Fallback */}
      {loadError ? (
        <div className="p-6 rounded-2xl border border-dashed border-border bg-card text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground font-hindi">
              ब्राउज़र में PDF प्रीव्यू लोड नहीं हो सका
            </p>
            <p className="text-xs text-muted-foreground font-hindi max-w-md mx-auto">
              आप नीचे दिए गए बटन पर क्लिक करके सीधे PDF डाउनलोड कर सकते हैं या नई विंडो में खोल सकते हैं।
            </p>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <a href={pdfPath} download>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF डाउनलोड करें
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile Notice */}
          <div className="block sm:hidden text-center py-2">
            <p className="text-[11px] text-muted-foreground font-hindi">
              सुविधाजनक अध्ययन हेतु ऊपर दिए गए &ldquo;खोलें&rdquo; या &ldquo;डाउनलोड PDF&rdquo; का उपयोग करें।
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
