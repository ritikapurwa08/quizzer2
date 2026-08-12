"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Question } from "@/types";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QuestionEditorModal } from "@/components/admin/QuestionEditorModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { containsDevanagari, cn } from "@/lib/utils";
import { Trash2, Pencil } from "lucide-react";

export default function AdminQuestionsPage() {
  const [term, setTerm] = useState("");
  const results = useQuery(api.questions.search, { term }) ?? [];
  const removeQuestion = useMutation(api.questions.remove);

  const [deleteTarget, setDeleteTarget] = useState<Id<"questions"> | null>(null);
  const [editTarget, setEditTarget] = useState<Question | null>(null);

  function openEdit(q: (typeof results)[number]) {
    setEditTarget(q as Question);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Questions Bank</h1>
          <p className="text-xs text-muted-foreground">
            Search, view, edit options, correct answers, and manage question bank entries.
          </p>
        </div>
      </div>

      <Input
        placeholder="Search question text across the whole bank..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />

      {term.trim().length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Type to search — results appear across all subjects and topics.
        </p>
      ) : (
        <DataTable
          rows={results}
          rowKey={(q) => q._id}
          emptyMessage="No questions match your search."
          columns={[
            {
              header: "Question",
              render: (q) => {
                const isHindi = containsDevanagari(q.questionText);
                return (
                  <span
                    className={cn(
                      "line-clamp-2 text-sm text-foreground leading-snug",
                      isHindi && "font-hindi"
                    )}
                  >
                    {q.questionText}
                  </span>
                );
              },
              className: "px-3 py-2 max-w-md",
            },
            {
              header: "Type",
              render: (q) => (
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                  {QUESTION_TYPE_LABELS[q.type]}
                </Badge>
              ),
            },
            {
              header: "Difficulty",
              render: (q) => (
                <span className="text-xs capitalize text-muted-foreground font-medium">
                  {q.difficulty}
                </span>
              ),
            },
            {
              header: "",
              render: (q) => (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(q)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit question"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q._id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {/* Comprehensive Question Editor Modal */}
      <QuestionEditorModal
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        question={editTarget}
        onSaveSuccess={() => setEditTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete question?"
        description="This cannot be undone."
        onConfirm={() => deleteTarget && removeQuestion({ id: deleteTarget })}
      />
    </div>
  );
}
