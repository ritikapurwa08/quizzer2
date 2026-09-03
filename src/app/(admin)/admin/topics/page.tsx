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
import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { slugify, getTopicDisplayName } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function AdminTopicsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];
  const [subjectId, setSubjectId] = useState<Id<"subjects"> | "">("");

  const rawTopics = useQuery(
    api.topics.listBySubject,
    subjectId ? { subjectId } : "skip"
  );
  const isTopicsLoading = subjectId ? rawTopics === undefined : false;
  const topics = rawTopics ?? [];
  const createTopic = useMutation(api.topics.create);
  const removeTopic = useMutation(api.topics.remove);

  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Id<"topics"> | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subjectId) return;
    await createTopic({ subjectId, name: name.trim(), slug: slugify(name) });
    setName("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Topics</h1>

      <div className="space-y-1.5 w-full sm:w-72">
        <Label className="text-xs font-semibold text-muted-foreground">विषय चुनें</Label>
        <SyllabusSelect
          options={subjects}
          value={subjectId}
          onValueChange={(v) => setSubjectId(v as Id<"subjects">)}
          placeholder="विषय चुनें…"
        />
      </div>

      {subjectId && (
        <>
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="New topic name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>

          {isTopicsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2 font-hindi">
              <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              लोड हो रहा है…
            </div>
          ) : (
            <DataTable
              rows={topics}
              rowKey={(t) => t._id}
              columns={[
                { header: "Name", render: (t) => getTopicDisplayName(t) },
                {
                  header: "",
                  render: (t) => (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(t._id)}
                      className="h-9 w-9 text-destructive hover:bg-destructive/15 cursor-pointer rounded-lg"
                      aria-label="Delete topic"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete topic?"
        description="This will delete all test sets and questions inside it. This cannot be undone."
        onConfirm={() => deleteTarget && removeTopic({ id: deleteTarget })}
      />
    </div>
  );
}
