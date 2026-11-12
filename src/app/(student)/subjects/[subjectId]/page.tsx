"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { cn, getSubjectDisplayName, getTopicDisplayName, containsDevanagari } from "@/lib/utils";

function CollapsibleDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 100;

  return (
    <div className="mt-1">
      <p
        className={cn(
          "text-sm text-muted-foreground transition-all leading-relaxed",
          !expanded && "line-clamp-2"
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary hover:underline mt-0.5 cursor-pointer"
        >
          {expanded ? "Show less" : "Read more..."}
        </button>
      )}
    </div>
  );
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const id = subjectId as Id<"subjects">;

  const subject = useQuery(api.subjects.get, { id });
  const topics = useQuery(api.topics.listBySubject, { subjectId: id });
  const setCounts = useQuery(api.testSets.countsBySubject, { subjectId: id }) ?? {};
  const progressMap = useQuery(api.topics.progressBySubject, { subjectId: id }) ?? {};

  const [localTopicCounts, setLocalTopicCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/sets/counts")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.topicCounts) {
          setLocalTopicCounts(json.topicCounts);
        }
      })
      .catch(() => {});
  }, []);

  const effectiveCounts = useMemo(() => {
    if (Object.keys(localTopicCounts).length > 0) {
      return { ...setCounts, ...localTopicCounts };
    }
    return setCounts;
  }, [setCounts, localTopicCounts]);

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";

  const totalQuizSets = Object.values(effectiveCounts).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Breadcrumb Navigation ── */}
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subjectTitle },
        ]}
      />

      {/* ── Subject Header ── */}
      <div className="space-y-1.5 border-b border-border/70 pb-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-hindi">
          {subjectTitle}
        </h1>
        {subject?.description && (
          <CollapsibleDescription text={subject.description} />
        )}
      </div>

      {/* ── Quiz Topics List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Syllabus Topics ({topics?.length ?? 0})
          </h2>
          {totalQuizSets > 0 && (
            <span className="text-xs text-muted-foreground font-semibold">
              {totalQuizSets} Total Practice Sets
            </span>
          )}
        </div>

        {topics === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="h-16 rounded-md border border-border bg-card p-3.5 shadow-none flex items-center gap-3"
              >
                <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 sm:w-40 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No topics available"
            description="Topics and practice sets will be added soon for this subject."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topics.map((t, index) => {
              const setCount = effectiveCounts[t._id] ?? 0;
              const progress = progressMap[t._id];
              const isCompleted = progress?.status === "completed";
              const isInProgress = progress?.status === "in_progress";

              return (
                <Link key={t._id} href={`/subjects/${id}/${t._id}`} className="block focus-visible:outline-hidden">
                  <Card className="flex flex-row items-center justify-between p-3.5 border border-border bg-card hover:border-primary/50 hover:shadow-xs transition-all group min-h-[4rem] rounded-md select-none">
                    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                      <span className="flex h-7 w-7 items-center justify-center rounded-sm text-xs font-semibold shrink-0 transition-all duration-200 bg-muted text-foreground group-hover:bg-foreground group-hover:text-background">
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "font-medium text-xs sm:text-sm transition-colors truncate text-foreground group-hover:text-primary",
                            containsDevanagari(getTopicDisplayName(t)) && "font-hindi"
                          )}
                        >
                          {getTopicDisplayName(t)}
                        </p>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {setCount === 0 ? (
                            <p className="text-xs text-muted-foreground/60">No sets yet</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {setCount} Practice Sets
                            </p>
                          )}

                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-sm border border-success/20">
                              <CheckCircle2 className="h-3 w-3" /> Completed
                            </span>
                          )}

                          {isInProgress && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-sm border border-warning/20">
                              <Clock className="h-3 w-3" /> In Progress ({progress.completedSets}/{progress.totalSets})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
