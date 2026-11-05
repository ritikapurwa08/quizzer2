"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ImportErrorAlertProps {
  errors: string[];
}

export function ImportErrorAlert({ errors }: ImportErrorAlertProps) {
  if (errors.length === 0) return null;

  return (
    <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10 py-2.5">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="text-xs font-bold">
        Cannot Import — Please fix the following errors:
      </AlertTitle>
      <AlertDescription className="mt-1.5 text-xs">
        <ul className="list-disc pl-4 space-y-0.5">
          {errors.slice(0, 6).map((err, i) => (
            <li key={i}>{err}</li>
          ))}
          {errors.length > 6 && (
            <li>...and {errors.length - 6} more errors.</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
