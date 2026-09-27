"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CANONICAL_SUBJECTS, StaticSubject } from "@/lib/static-syllabus";
import { getSubjectDisplayName } from "@/lib/utils";
import { RefreshCw, CheckCircle2, ShieldCheck, Database } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AdminSubjectsPage() {
  const rawSubjects = useQuery(api.subjects.list);
  const isSubjectsLoading = rawSubjects === undefined;
  const dbSubjects = rawSubjects ?? [];
  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);
  const setCounts = useQuery(api.subjects.setCountsAllSubjects) ?? {};
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  async function handleSyncSyllabus() {
    setIsSyncing(true);
    try {
      const res = await seedFixedSyllabus();
      showToast(`Syllabus synced with Convex! (${res.topicCount} topics)`, "success");
    } catch (err: any) {
      showToast(err.message || "Syllabus sync failed", "warning");
    } finally {
      setIsSyncing(false);
    }
  }

  // Combine static authoritative subject data with live Convex database sync info
  const combinedSubjects = CANONICAL_SUBJECTS.map((canon) => {
    const dbRecord = dbSubjects.find(
      (s) => s.slug === canon.slug || s.name.toLowerCase() === canon.name.toLowerCase()
    );
    const sets = dbRecord ? setCounts[dbRecord._id] ?? 0 : 0;
    return {
      ...canon,
      dbId: dbRecord?._id,
      isSynced: Boolean(dbRecord),
      testSetsCount: sets,
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Subjects</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 5 Canonical Subjects
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-hindi">
            राजस्थान GK के 5 आधिकारिक विषय (Master Syllabus Contract). यह संरचना स्टैटिक आर्किटेक्चर द्वारा सुरक्षित है।
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncSyllabus}
          disabled={isSyncing}
          className="gap-2 text-xs rounded-xl h-9 cursor-pointer shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync to Convex"}
        </Button>
      </div>

      <div className="rounded-xl border border-border/70 bg-card p-3.5 text-xs text-muted-foreground flex items-center justify-between gap-3 font-hindi">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary shrink-0" />
          <span>
            डेटाबेस स्थिति: <strong className="text-foreground">{dbSubjects.length} विषय</strong> सक्रिय हैं। स्टैटिक कॉन्ट्रैक्ट के अनुसार कुल 5 विषय मान्य हैं।
          </span>
        </div>
        <Badge variant="secondary" className="text-[11px] font-mono">
          70 Master Topics
        </Badge>
      </div>

      {isSubjectsLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading subjects...
        </div>
      ) : (
        <DataTable
          rows={combinedSubjects}
          rowKey={(s) => s.slug}
          columns={[
            {
              header: "Order",
              render: (s) => (
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground">
                  {s.order}
                </span>
              ),
            },
            {
              header: "Subject Name (Hindi / English)",
              render: (s) => (
                <div className="space-y-0.5">
                  <div className="font-semibold text-sm text-foreground font-hindi">{s.nameHindi}</div>
                  <div className="text-xs text-muted-foreground">{s.name}</div>
                </div>
              ),
            },
            {
              header: "Topics Scope",
              render: (s) => (
                <div className="text-xs">
                  <span className="font-semibold text-foreground">{s.topicCount} Topics</span>
                  <span className="text-muted-foreground text-[11px] block">
                    (ID #{s.topicIdRange[0]} - #{s.topicIdRange[1]})
                  </span>
                </div>
              ),
            },
            {
              header: "Convex Sync",
              render: (s) => (
                <div className="flex items-center gap-1.5">
                  {s.isSynced ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Synced
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[11px]">
                      Not in DB
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              header: "Test Sets",
              render: (s) => (
                <span className="text-xs font-semibold tabular-nums text-foreground">
                  {s.testSetsCount} Sets
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
