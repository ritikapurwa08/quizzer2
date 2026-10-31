"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Shield } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="p-3 rounded-2xl bg-destructive/10 text-destructive w-fit mx-auto">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Admin Portal Error</h2>
          <p className="text-xs text-muted-foreground mt-1">
            An error occurred while loading this administrative view or dataset.
          </p>
        </div>
        <div className="flex justify-center gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="rounded-xl text-xs h-9 px-4 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
          <Button asChild className="rounded-xl text-xs h-9 px-4 gap-1.5">
            <Link href="/admin">
              <Shield className="h-3.5 w-3.5" />
              Admin Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

