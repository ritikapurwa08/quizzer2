"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

export default function TopicDetailPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const sId = subjectId as Id<"subjects">;
  const tId = topicId as Id<"topics">;

  const subject = useQuery(api.subjects.get, { id: sId });
  const topic = useQuery(api.topics.get, { id: tId });
  const testSets = useQuery(api.testSets.listByTopic, { topicId: tId });
  const [localTopicSets, setLocalTopicSets] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/sets/by-topic/${tId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.sets) {
          setLocalTopicSets(json.sets);
        }
      })
      .catch((e) => console.error("Error loading local topic sets:", e));
  }, [tId]);

  // Authoritative test sets: Convex DB is the primary source; fallback to local published sets only if Convex is empty.
  const allTopicSets = useMemo(() => {
    const sourceList = (testSets && testSets.length > 0) ? testSets : localTopicSets;
    const map = new Map<string, any>();
    const seenNames = new Set<string>();

    for (const s of sourceList || []) {
      const cleanName = (s.name || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!map.has(s._id) && (!cleanName || !seenNames.has(cleanName))) {
        map.set(s._id, s);
        if (cleanName) seenNames.add(cleanName);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [testSets, localTopicSets]);

  const topicProgress = useQuery(api.topics.getProgress, { topicId: tId });
  const completedIds = useQuery(api.testSets.completedSetIds) ?? [];

  const completedSet = new Set(completedIds);
  const totalSets = allTopicSets.length;
  const completedCount = allTopicSets.filter((s) => completedSet.has(s._id)).length;
  const isTopicCompleted = topicProgress?.status === "completed";

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";
  const topicTitle = getTopicDisplayName(topic) || "Topic";

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subjectTitle, href: `/subjects/${sId}` },
          { label: topicTitle },
        ]}
      />

      {/* Topic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
              {topicTitle}
            </h1>
            {isTopicCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice test sets for this topic.
            {topicProgress && topicProgress.attemptCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {topicProgress.attemptCount} attempts recorded
                {topicProgress.latestScore !== undefined
                  ? ` · Latest Score: ${topicProgress.latestScore}`
                  : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Quiz Sets List ───────────────────────────────────────────────── */}
      {testSets !== undefined && allTopicSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No practice sets available yet"
          description="Question sets for this topic will be available soon."
        />
      )}

      {allTopicSets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Practice Sets ({totalSets})
            </h2>
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{totalSets} completed
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allTopicSets.map((set) => {
              const isDone = completedSet.has(set._id);
              return (
                <Link key={set._id} href={`/quiz/${set._id}`} className="block focus-visible:outline-hidden">
                  <Card className="flex flex-row items-center justify-between p-4 border border-border/80 hover:border-foreground/30 bg-card hover:shadow-xs transition-all group rounded-xl min-h-[4rem] select-none">
                    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg shrink-0 transition-all duration-200 bg-muted text-foreground group-hover:bg-foreground group-hover:text-background">
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-xs sm:text-sm transition-colors truncate text-foreground group-hover:text-primary">
                            {set.name}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3 transition-all border border-border bg-card text-foreground group-hover:bg-foreground group-hover:text-background">
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isDone ? "Retake" : "Start"}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
