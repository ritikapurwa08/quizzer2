import Link from "next/link";
import { QuizzerLogoIcon } from "@/components/icons/QuizzerIcons";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, LayoutGrid } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 rounded-2xl border border-border bg-muted/40 shadow-xs">
            <QuizzerLogoIcon className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground tabular-nums">
              404
            </h1>
            <h2 className="text-lg font-bold text-foreground mt-1">
              Page Not Found
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
              पृष्ठ नहीं मिला। The test set, topic, or document you are looking for may have been moved, renamed, or is unavailable.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 px-5 gap-1.5">
            <Link href="/dashboard">
              <LayoutGrid className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl font-semibold text-xs h-10 px-4 gap-1.5 border-border">
            <Link href="/subjects">
              <BookOpen className="h-4 w-4" />
              Browse Subjects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

