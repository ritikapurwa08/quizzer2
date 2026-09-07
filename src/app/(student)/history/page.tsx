"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { Pagination } from "@/components/shared/Pagination";
import { ResultHistoryItem } from "@/components/shared/ResultHistoryItem";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { History, ListChecks } from "lucide-react";

const PAGE_SIZE = 15;

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);

  const currentCursor = cursorStack[page] ?? null;
  const result = useQuery(api.attempts.historyByUser, {
    paginationOpts: { numItems: PAGE_SIZE, cursor: currentCursor },
  });

  const handleNext = useCallback(() => {
    if (!result || result.isDone) return;
    const nextCursor = result.continueCursor ?? null;
    setCursorStack((prev) => {
      const next = [...prev];
      next[page + 1] = nextCursor;
      return next;
    });
    setPage((p) => p + 1);
  }, [result, page]);

  const handlePrev = useCallback(() => {
    if (page === 0) return;
    setPage((p) => p - 1);
  }, [page]);

  const items = result?.page ?? [];
  const isLastPage = result?.isDone ?? false;

  return (
    <div className="space-y-5 pb-12">
      <BreadcrumbNav
        items={[{ label: "डैशबोर्ड", href: "/dashboard" }, { label: "परीक्षा इतिहास" }]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          परीक्षा इतिहास
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
          आपके द्वारा दिए गए सभी टेस्ट का पूर्ण रिकॉर्ड, नवीनतम से पुराने क्रम में।
        </p>
      </div>

      <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <History className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-foreground font-hindi">
            सभी प्रयास (Latest First)
          </h2>
        </div>

        {/* Loading */}
        {result === undefined && <LoadingState />}

        {/* Empty state */}
        {result !== undefined && items.length === 0 && page === 0 && (
          <EmptyState
            icon={ListChecks}
            title="अभी तक कोई टेस्ट नहीं दिया गया"
            description="विषय चुनें और अपना पहला प्रयास करें। यहाँ सारा इतिहास सुरक्षित रहेगा।"
          />
        )}

        {/* List */}
        {items.length > 0 && (
          <ul className="space-y-2">
            {items.map((a: any) => (
              <li key={a._id}>
                <ResultHistoryItem
                  attemptId={a._id}
                  testSetId={a.testSetId}
                  testSetName={a.testSetName}
                  submittedAt={a.submittedAt ?? 0}
                  score={a.score}
                  totalQuestions={a.totalQuestions}
                  answers={a.answers ?? []}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {result !== undefined && (items.length > 0 || page > 0) && (
          <Pagination
            page={page}
            onPrev={handlePrev}
            onNext={handleNext}
            isLastPage={isLastPage}
            label={`पृष्ठ ${page + 1}`}
            className="mt-4"
          />
        )}
      </Card>
    </div>
  );
}
