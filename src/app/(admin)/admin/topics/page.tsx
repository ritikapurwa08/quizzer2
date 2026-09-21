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
import { Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

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
  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Id<"topics"> | null>(null);

  async function handleSyncSyllabus() {
    setIsSyncing(true);
    try {
      const res = await seedFixedSyllabus();
      showToast(`Syllabus synced successfully! (${res.topicCount} new topics added)`, "success");
    } catch (err: any) {
      showToast(err.message || "Syllabus sync failed", "warning");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subjectId) return;
    await createTopic({ subjectId, name: name.trim(), slug: slugify(name) });
    setName("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Topics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage the fixed syllabus topic hierarchy; sync from master AGENTS.md.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncSyllabus}
          disabled={isSyncing}
          className="gap-2 text-xs rounded-xl h-9 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Syllabus"}
        </Button>
      </div>

      <div className="space-y-1.5 w-full sm:w-72">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Subject</Label>
        <SyllabusSelect
          options={subjects}
          value={subjectId}
          onValueChange={(v) => setSubjectId(v as Id<"subjects">)}
          placeholder="Select Subject..."
        />
      </div>

      {subjectId && (
        <>
          <form onSubmit={handleCreate} className="flex gap-2.5">
            <input
              placeholder="New topic name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-ring transition-colors shadow-2xs"
            />
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-10 px-5 rounded-xl text-sm font-semibold shadow-xs cursor-pointer"
            >
              Add Topic
            </Button>
          </form>

          {isTopicsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading topics...
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
