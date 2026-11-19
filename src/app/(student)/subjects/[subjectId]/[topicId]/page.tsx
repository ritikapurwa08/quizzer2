"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle2 } from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";
import { TopicSubTopicFilter } from "@/components/syllabus/TopicSubTopicFilter";
import { TopicSetsGrid } from "@/components/syllabus/TopicSetsGrid";

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

  // Combine Convex sets with local metadata to ensure all active sets are preserved
  const allTopicSets = useMemo(() => {
    if (!isLocalLoaded && (!testSets || testSets.length === 0)) {
      return [];
    }

    const localMap = new Map<string, any>(localTopicSets.map((s) => [s._id || s.id, s]));
    const map = new Map<string, any>();
    const seenNames = new Set<string>();

    // 1. Add local sets first (preserves rich local metadata like subTopic)
    const activeLocal = (localTopicSets || []).filter((s) => s.status !== "archived" && !s.isArchived);
    for (const s of activeLocal) {
      const id = s._id || s.id;
      const cleanName = (s.name || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!map.has(id) && (!cleanName || !seenNames.has(cleanName))) {
        map.set(id, { ...s, _id: id });
        if (cleanName) seenNames.add(cleanName);
      }
    }

    // 2. Incorporate any active Convex sets not already present
    const activeConvex = (testSets || []).filter((s) => !s.isArchived);
    for (const s of activeConvex) {
      const id = s._id;
      const cleanName = (s.name || "").replace(/\s+/g, " ").trim().toLowerCase();
      const localMeta = localMap.get(id);
      if (!map.has(id) && (!cleanName || !seenNames.has(cleanName))) {
        map.set(id, {
          ...s,
          subTopicId: s.subTopicId || localMeta?.subTopicId,
          subTopic: s.subTopic || localMeta?.subTopic,
        });
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
        </div>
      </div>

      {/* Sub-Topics Tabs */}
      <TopicSubTopicFilter
        subTopics={subTopics}
        activeSubTopic={activeSubTopic}
        totalSets={totalSets}
        onSelect={handleSubTopicChange}
      />

      {/* Loading Skeleton Placeholder */}
      {!isLocalLoaded && testSets === undefined && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
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

      {/* Quiz Sets List */}
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

          <TopicSetsGrid
            sets={displayedSets}
            completedSet={completedSet}
            activeSubTopic={activeSubTopic}
          />
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
