"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { History } from "lucide-react";

/** Auto-populated on every incorrect answer during Attempt Submit (SRD Section 9). */
export default function WrongQuestionsPage() {
  const wrongQuestions = useQuery(api.wrongQuestions.listByUser);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Wrong Questions</h1>
        <p className="text-sm text-muted-foreground">
          Questions you've missed, auto-saved for focused practice.
        </p>
      </div>

      {wrongQuestions && wrongQuestions.length === 0 && (
        <EmptyState icon={History} title="No wrong questions — nice work!" />
      )}

      <div className="space-y-3">
        {wrongQuestions?.map(({ wrongQuestion, question }) => (
          question && (
            <Card key={wrongQuestion._id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground">
                  {QUESTION_TYPE_LABELS[question.type]} · {question.difficulty}
                </p>
                <span className="text-xs text-muted-foreground">
                  Missed {wrongQuestion.missCount}x
                </span>
              </div>
              <p className="whitespace-pre-line text-sm mb-2">{question.questionText}</p>
              {question.explanation && (
                <p className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                  {question.explanation}
                </p>
              )}
            </Card>
          )
        ))}
      </div>
    </div>
  );
}
