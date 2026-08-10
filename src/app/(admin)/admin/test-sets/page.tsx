"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";

export default function AdminTestSetsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];
  const [subjectId, setSubjectId] = useState<Id<"subjects"> | "">("");
  const topics =
    useQuery(api.topics.listBySubject, subjectId ? { subjectId } : "skip") ?? [];
  const [topicId, setTopicId] = useState<Id<"topics"> | "">("");

  const testSets =
    useQuery(api.testSets.listByTopic, topicId ? { topicId } : "skip") ?? [];
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

      {/* Subject + Topic filter row */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Subject</Label>
          <select
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value as Id<"subjects">);
              setTopicId("");
            }}
            className="select-native"
          >
            <option value="" disabled>Select a subject…</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Topic</Label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value as Id<"topics">)}
            disabled={!subjectId}
            className="select-native"
          >
            <option value="" disabled>
              {!subjectId ? "Select a subject first" : "Select a topic…"}
            </option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {topicId && (
        <>
          {/* Add new test set form */}
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">New Test Set Name</Label>
              <Input
                placeholder="e.g. Practice Set 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2.5 pb-0.5">
              <Switch
                id="neg-marking-ts"
                checked={negativeMarking}
                onCheckedChange={setNegativeMarking}
              />
              <label
                htmlFor="neg-marking-ts"
                className="text-sm text-muted-foreground cursor-pointer select-none whitespace-nowrap"
              >
                Neg. marking
              </label>
            </div>
            <Button type="submit" className="shrink-0">
              Add Set
            </Button>
          </form>

          <DataTable
            rows={testSets}
            rowKey={(s) => s._id}
            columns={[
              { header: "Name", render: (s) => s.name },
              { header: "Questions", render: (s) => s.questionCount },
              {
                header: "Neg. Marking",
                render: (s) => (
                  <span className={s.negativeMarking ? "text-destructive font-semibold" : "text-muted-foreground"}>
                    {s.negativeMarking ? "Yes" : "No"}
                  </span>
                ),
              },
              {
                header: "",
                render: (s) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(s._id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
