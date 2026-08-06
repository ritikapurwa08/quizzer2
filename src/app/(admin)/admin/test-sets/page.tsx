"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export default function AdminTestSetsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];
  const [subjectId, setSubjectId] = useState<Id<"subjects"> | null>(null);
  const topics = useQuery(api.topics.listBySubject, subjectId ? { subjectId } : "skip") ?? [];
  const [topicId, setTopicId] = useState<Id<"topics"> | null>(null);

  const testSets = useQuery(api.testSets.listByTopic, topicId ? { topicId } : "skip") ?? [];
  const createTestSet = useMutation(api.testSets.create);
  const removeTestSet = useMutation(api.testSets.remove);

  const [name, setName] = useState("");
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Id<"testSets"> | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !topicId) return;
    await createTestSet({ topicId, name: name.trim(), negativeMarking });
    setName("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Test Sets</h1>

      <div className="flex flex-col sm:flex-row gap-2">
        <select
          className="h-11 rounded-md border border-border bg-background px-3 text-sm flex-1"
          value={subjectId ?? ""}
          onChange={(e) => {
            setSubjectId((e.target.value || null) as Id<"subjects"> | null);
            setTopicId(null);
          }}
        >
          <option value="">Select a subject...</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          className="h-11 rounded-md border border-border bg-background px-3 text-sm flex-1"
          value={topicId ?? ""}
          onChange={(e) => setTopicId((e.target.value || null) as Id<"topics"> | null)}
          disabled={!subjectId}
        >
          <option value="">Select a topic...</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      {topicId && (
        <>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
            <Input placeholder="New test set name" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
            <label className="flex items-center gap-2 text-sm px-1">
              <input type="checkbox" checked={negativeMarking} onChange={(e) => setNegativeMarking(e.target.checked)} />
              Negative marking
            </label>
            <Button type="submit">Add</Button>
          </form>

          <DataTable
            rows={testSets}
            rowKey={(s) => s._id}
            columns={[
              { header: "Name", render: (s) => s.name },
              { header: "Questions", render: (s) => s.questionCount },
              { header: "Neg. Marking", render: (s) => (s.negativeMarking ? "Yes" : "No") },
              {
                header: "",
                render: (s) => (
                  <button onClick={() => setDeleteTarget(s._id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
          />
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete test set?"
        description="This will delete all questions inside it. This cannot be undone."
        onConfirm={() => deleteTarget && removeTestSet({ id: deleteTarget })}
      />
    </div>
  );
}
