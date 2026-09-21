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
  const rawSubjects = useQuery(api.subjects.list);
  const isSubjectsLoading = rawSubjects === undefined;
  const subjects = rawSubjects ?? [];
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
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Subjects</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Add and manage exam subjects.</p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2.5">
        <input
          placeholder="New subject name (e.g. राजस्थान सामान्य ज्ञान)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors shadow-2xs"
        />
        <Button
          type="submit"
          disabled={!name.trim()}
          className="h-10 px-5 rounded-xl text-sm font-semibold shadow-xs cursor-pointer"
        >
          Add Subject
        </Button>
      </form>

      {isSubjectsLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading subjects...
        </div>
      ) : (
        <DataTable
          rows={subjects}
          rowKey={(s) => s._id}
          columns={[
            { header: "Name", render: (s) => getSubjectDisplayName(s) },
            { header: "Slug", render: (s) => <span className="text-muted-foreground">{s.slug}</span> },
            {
              header: "",
              render: (s) => (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(s._id)}
                  className="h-9 w-9 text-destructive hover:bg-destructive/15 cursor-pointer rounded-lg"
                  aria-label="Delete subject"
                  title="Delete subject"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ),
            },
          ]}
        />
      )}

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
