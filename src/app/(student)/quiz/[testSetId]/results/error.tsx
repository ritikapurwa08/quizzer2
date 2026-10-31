"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ResultsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Results page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            परिणाम लोड करने में समस्या (Error Loading Results)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            इस टेस्ट सेट का परिणाम लोड नहीं हो सका। आपका टेस्ट डेटा सुरक्षित है।
            कृपया पुनः प्रयास करें या डैशबोर्ड पर जाकर टेस्ट हिस्ट्री देखें।
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
            variant="default"
            className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            पुनः प्रयास करें (Try Again)
          </Button>

          <Button
            asChild
            variant="outline"
            className="rounded-xl font-semibold text-xs h-10 px-4 gap-1.5 border-border hover:bg-muted"
          >
            <Link href="/dashboard">
              <Home className="h-3.5 w-3.5" />
              डैशबोर्ड (Dashboard)
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
