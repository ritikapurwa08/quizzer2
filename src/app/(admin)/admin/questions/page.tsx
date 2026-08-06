"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { Trash2, Pencil } from "lucide-react";

export default function AdminQuestionsPage() {
  const [term, setTerm] = useState("");
  const results = useQuery(api.questions.search, { term }) ?? [];
  const removeQuestion = useMutation(api.questions.remove);
  const updateQuestion = useMutation(api.questions.update);

  const [deleteTarget, setDeleteTarget] = useState<Id<"questions"> | null>(null);
  const [editTarget, setEditTarget] = useState<
    (typeof results)[number] | null
  >(null);
  const [editText, setEditText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");

  function openEdit(q: (typeof results)[number]) {
    setEditTarget(q);
    setEditText(q.questionText);
    setEditExplanation(q.explanation ?? "");
  }

  async function saveEdit() {
    if (!editTarget) return;
    await updateQuestion({
      id: editTarget._id,
      questionText: editText,
      explanation: editExplanation,
    });
    setEditTarget(null);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-semibold">Questions</h1>

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
              render: (q) => <span className="line-clamp-2">{q.questionText}</span>,
              className: "px-3 py-2 max-w-md",
            },
            { header: "Type", render: (q) => QUESTION_TYPE_LABELS[q.type] },
            { header: "Difficulty", render: (q) => q.difficulty },
            {
              header: "",
              render: (q) => (
                <div className="flex gap-1">
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(q._id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogTitle>Edit question</DialogTitle>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Question text</Label>
              <textarea
                className="w-full min-h-24 rounded-md border border-border bg-background p-3 text-sm"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Explanation</Label>
              <textarea
                className="w-full min-h-20 rounded-md border border-border bg-background p-3 text-sm"
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={saveEdit}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
