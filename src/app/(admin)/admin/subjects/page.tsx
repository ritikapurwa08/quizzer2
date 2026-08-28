"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify, getSubjectDisplayName } from "@/lib/utils";
import { Trash2 } from "lucide-react";

export default function AdminSubjectsPage() {
  const subjects = useQuery(api.subjects.list) ?? [];
  const createSubject = useMutation(api.subjects.create);
  const removeSubject = useMutation(api.subjects.remove);

  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Id<"subjects"> | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createSubject({ name: name.trim(), slug: slugify(name) });
    setName("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold">Subjects</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input placeholder="New subject name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>

      <DataTable
        rows={subjects}
        rowKey={(s) => s._id}
        columns={[
          { header: "Name", render: (s) => getSubjectDisplayName(s) },
          { header: "Slug", render: (s) => <span className="text-muted-foreground">{s.slug}</span> },
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete subject?"
        description="This will delete all topics, test sets, and questions inside it. This cannot be undone."
        onConfirm={() => deleteTarget && removeSubject({ id: deleteTarget })}
      />
    </div>
  );
}
