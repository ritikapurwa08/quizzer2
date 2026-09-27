"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { DataTable } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CANONICAL_SUBJECTS, CANONICAL_TOPICS, StaticTopic } from "@/lib/static-syllabus";
import { RefreshCw, CheckCircle2, ShieldCheck, ChevronDown, ChevronUp, Layers, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminTopicsPage() {
  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState<string>(CANONICAL_SUBJECTS[0].slug);
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);

  const rawSubjects = useQuery(api.subjects.list) ?? [];
  const currentDbSubject = rawSubjects.find((s) => s.slug === selectedSubjectSlug);

  const rawDbTopics = useQuery(
    api.topics.listBySubject,
    currentDbSubject ? { subjectId: currentDbSubject._id } : "skip"
  );
  const dbTopics = rawDbTopics ?? [];
  const isTopicsLoading = currentDbSubject ? rawDbTopics === undefined : false;

  const seedFixedSyllabus = useMutation(api.seed.seedFixedSyllabus);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showToast } = useToast();

  async function handleSyncSyllabus() {
    setIsSyncing(true);
    try {
      const res = await seedFixedSyllabus();
      showToast(`Syllabus synced with Convex! (${res.topicCount} topics added/verified)`, "success");
    } catch (err: any) {
      showToast(err.message || "Syllabus sync failed", "warning");
    } finally {
      setIsSyncing(false);
    }
  }

  // Authoritative static topics for the selected subject
  const subjectStaticTopics = CANONICAL_TOPICS.filter((t) => t.subjectSlug === selectedSubjectSlug);

  // Match static topic with DB topic
  const combinedTopics = subjectStaticTopics.map((st) => {
    const dbRecord = dbTopics.find(
      (dt) => dt.slug === st.slug || dt.name.toLowerCase() === st.name.toLowerCase() || (dt.nameHindi && dt.nameHindi === st.nameHindi)
    );
    return {
      ...st,
      dbId: dbRecord?._id,
      isSynced: Boolean(dbRecord),
    };
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Topics & Sub-topics</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> 70 Master Topics Contract
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 font-hindi">
            राजस्थान GK के 70 आधिकारिक मास्टर टॉपिक्स एवं उनके उप-विषय (Sub-topics)।
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
          {isSyncing ? "Syncing..." : "Sync All 70 Topics"}
        </Button>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        {CANONICAL_SUBJECTS.map((subj) => (
          <button
            key={subj.slug}
            type="button"
            onClick={() => setSelectedSubjectSlug(subj.slug)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 select-none",
              selectedSubjectSlug === subj.slug
                ? "bg-foreground text-background border-foreground shadow-xs"
                : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/40"
            )}
          >
            <span>{subj.order}. {subj.nameHindi}</span>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
              selectedSubjectSlug === subj.slug ? "bg-background/20 text-background" : "bg-muted text-foreground"
            )}>
              {subj.topicCount}
            </span>
          </button>
        ))}
      </div>

      {isTopicsLoading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
          <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading topics...
        </div>
      ) : (
        <div className="space-y-2">
          {combinedTopics.map((topic) => {
            const isExpanded = expandedTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs transition-all"
              >
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold text-foreground shrink-0">
                      #{topic.id}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs sm:text-sm text-foreground font-hindi leading-snug truncate">
                        {topic.nameHindi}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {topic.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {topic.isSynced ? (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] gap-1 hidden xs:inline-flex">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Synced
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        Pending DB Sync
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                      className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted rounded-lg border border-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="h-3 w-3" />
                      <span>{topic.subTopics.length} Sub-topics</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Sub-topics list dropdown */}
                {isExpanded && (
                  <div className="bg-muted/30 border-t border-border/60 p-3 sm:p-3.5 space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-hindi">
                      सब-टॉपिक्स एवं प्रमुख अध्ययन बिंदु (Sub-Topics / Headings):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {topic.subTopics.map((st, sIdx) => (
                        <div
                          key={st.id}
                          className="p-2 rounded-lg bg-card border border-border/70 text-xs space-y-0.5"
                        >
                          <div className="font-semibold text-foreground font-hindi flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground">{sIdx + 1}.</span>
                            <span>{st.titleHindi}</span>
                          </div>
                          {st.titleEnglish && (
                            <div className="text-[10.5px] text-muted-foreground pl-3.5">
                              {st.titleEnglish}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
