"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Play,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";

export function TopicDetailView({ forcedSubTopicId }: { forcedSubTopicId?: string }) {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sId = subjectId as Id<"subjects">;
  const tId = topicId as Id<"topics">;

  const activeSubTopic = forcedSubTopicId || searchParams.get("subTopic") || "all";

  const subject = useQuery(api.subjects.get, { id: sId });
  const topic = useQuery(api.topics.get, { id: tId });
  const testSets = useQuery(api.testSets.listByTopic, { topicId: tId });
  const completedIds = useQuery(api.testSets.completedSetIds, { topicId: tId }) ?? [];
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);

  const [localTopicSets, setLocalTopicSets] = useState<any[]>([]);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/sets/by-topic/${tId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.sets) {
          setLocalTopicSets(json.sets);
        }
      })
      .catch((e) => console.error("Error loading local topic sets:", e))
      .finally(() => setIsLocalLoaded(true));
  }, [tId]);

  // Combine Convex sets with local metadata to ensure subTopicId and subTopic are preserved
  const allTopicSets = useMemo(() => {
    let sourceList: any[] = [];
    if (localTopicSets && localTopicSets.length > 0) {
      sourceList = localTopicSets.filter((s) => s.status !== "archived" && !s.isArchived);
    } else if (testSets && testSets.length > 0) {
      sourceList = testSets.filter((s) => !s.isArchived);
    } else if (!isLocalLoaded) {
      return [];
    }

    const localMap = new Map<string, any>(localTopicSets.map((s) => [s._id || s.id, s]));
    const map = new Map<string, any>();
    const seenNames = new Set<string>();

    for (const s of sourceList) {
      const id = s._id || s.id;
      const cleanName = (s.name || "").replace(/\s+/g, " ").trim().toLowerCase();
      const localMeta = localMap.get(id);

      const merged = {
        ...s,
        _id: id,
        subTopicId: s.subTopicId || localMeta?.subTopicId,
        subTopic: s.subTopic || localMeta?.subTopic,
      };

      if (!map.has(id) && (!cleanName || !seenNames.has(cleanName))) {
        map.set(id, merged);
        if (cleanName) seenNames.add(cleanName);
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [testSets, localTopicSets, isLocalLoaded]);

  // Extract all unique subtopics for nested navigation
  const subTopics = useMemo(() => {
    const subMap = new Map<string, { id: string; name: string; count: number }>();
    for (const s of allTopicSets) {
      const subId = s.subTopicId || s.subTopic;
      const subName = s.subTopic || s.subTopicId;
      if (subId && subName) {
        if (!subMap.has(subId)) {
          subMap.set(subId, { id: subId, name: subName, count: 0 });
        }
        subMap.get(subId)!.count += 1;
      }
    }
    return Array.from(subMap.values());
  }, [allTopicSets]);

  const topicProgress = useQuery(api.topics.getProgress, { topicId: tId });

  // Filter displayed sets based on selected subtopic
  const displayedSets = useMemo(() => {
    if (!activeSubTopic || activeSubTopic === "all") {
      return allTopicSets;
    }
    return allTopicSets.filter(
      (s) => s.subTopicId === activeSubTopic || s.subTopic === activeSubTopic
    );
  }, [allTopicSets, activeSubTopic]);

  const handleSubTopicChange = (subId: string) => {
    if (subId === "all") {
      router.push(`/subjects/${sId}/${tId}`, { scroll: false });
    } else {
      router.push(`/subjects/${sId}/${tId}/${encodeURIComponent(subId)}`, { scroll: false });
    }
  };

  const totalSets = allTopicSets.length;
  const completedCount = allTopicSets.filter((s) => completedSet.has(s._id)).length;
  const isTopicCompleted = topicProgress?.status === "completed" || (totalSets > 0 && completedCount === totalSets);

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";
  const topicTitle = getTopicDisplayName(topic) || "Topic";
  const activeSubName = subTopics.find((s) => s.id === activeSubTopic)?.name;

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subjectTitle, href: `/subjects/${sId}` },
          ...(activeSubTopic !== "all" && activeSubName
            ? [
                { label: topicTitle, href: `/subjects/${sId}/${tId}` },
                { label: activeSubName },
              ]
            : [{ label: topicTitle }]),
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

      {/* ── Sub-Topic Navigation Tabs / Pills (Clean Day-1 UI) ──────────────── */}
      {subTopics.length > 0 && (
        <div className="space-y-2 pt-1 pb-2 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Targeted Sub-Topics ({subTopics.length}):</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              type="button"
              onClick={() => handleSubTopicChange("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5",
                activeSubTopic === "all"
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>सभी सेट्स</span>
              <span className="text-[10px] opacity-80 px-1 py-0.2 rounded-full bg-background/20 font-bold">
                {allTopicSets.length}
              </span>
            </button>

            {subTopics.map((sub) => {
              const isActive = activeSubTopic === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSubTopicChange(sub.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 font-hindi",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{sub.name}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      isActive
                        ? "bg-background/25 text-primary-foreground"
                        : "bg-background text-muted-foreground"
                    )}
                  >
                    {sub.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Loading Skeleton Placeholder ─────────────────────────────────── */}
      {!isLocalLoaded && testSets === undefined && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-md border border-border bg-card flex items-center justify-between animate-pulse"
              >
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quiz Sets List ───────────────────────────────────────────────── */}
      {isLocalLoaded && testSets !== undefined && displayedSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No practice sets found for this section"
          description="Try switching to another sub-topic or 'सभी सेट्स'."
        />
      )}

      {displayedSets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>
                {activeSubName ? activeSubName : "Practice Sets"} ({displayedSets.length})
              </span>
            </h2>
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{totalSets} completed
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayedSets.map((set) => {
              const isCompleted = completedSet.has(set._id);

              return (
                <Link
                  key={set._id}
                  href={`/quiz/${set._id}`}
                  className="block focus-visible:outline-hidden"
                >
                  <Card className="flex flex-row items-center justify-between p-4 border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all group rounded-md min-h-[4rem] select-none">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-xs sm:text-sm transition-colors truncate text-foreground group-hover:text-primary font-hindi">
                          {set.name}
                        </h3>
                        {set.subTopic && activeSubTopic === "all" && (
                          <span className="text-[10px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded font-hindi">
                            {set.subTopic}
                          </span>
                        )}

                        {/* Standard Day-1 Completed Badge */}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-xs border border-emerald-500/20 font-hindi">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md shrink-0 ml-3 transition-all border border-border/80 bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                      <Play className="h-3 w-3 fill-current" />
                      <span>{isCompleted ? "Retake" : "Start"}</span>
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

export default function TopicDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading practice sets...</div>}>
      <TopicDetailView />
    </Suspense>
  );
}
