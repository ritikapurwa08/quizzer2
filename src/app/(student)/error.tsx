"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Student section error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4 rounded-2xl border border-border bg-card shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-foreground">
            पेज लोड नहीं हो सका (Page Failed to Load)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            सर्वर या नेटवर्क से डेटा लोड करते समय त्रुटि हुई। आपकी अध्ययन प्रगति सुरक्षित है।
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            पुनः प्रयास करें (Retry)
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
