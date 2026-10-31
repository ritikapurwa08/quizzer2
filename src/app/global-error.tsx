"use client";

import { useEffect } from "react";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-[#27272a] bg-[#111113] p-6 sm:p-8 text-center shadow-2xl space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl border border-[#27272a] bg-[#18181b]">
              <QuizzerLogoIcon className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#f4f4f5]">
                Something went wrong
              </h1>
              <p className="text-xs text-[#a1a1aa] mt-1.5 leading-relaxed">
                तकनीकी समस्या आई है। An unexpected error occurred while loading this page.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              onClick={() => reset()}
              className="rounded-xl font-semibold text-xs h-10 px-5 bg-white text-black hover:bg-white/90 gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

