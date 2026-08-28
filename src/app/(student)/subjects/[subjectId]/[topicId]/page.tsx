"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText, Play, CheckCircle2, Sparkles } from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

export default function TopicDetailPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const sId = subjectId as Id<"subjects">;
  const tId = topicId as Id<"topics">;

  const subject = useQuery(api.subjects.get, { id: sId });
  const topic = useQuery(api.topics.get, { id: tId });
  const testSets = useQuery(api.testSets.listByTopic, { topicId: tId });
  const topicProgress = useQuery(api.topics.getProgress, { topicId: tId });
  const completedIds = useQuery(api.testSets.completedSetIds) ?? [];
  const completedSet = new Set(completedIds);

  const totalSets = testSets?.length ?? 0;
  const completedCount = testSets?.filter((s) => completedSet.has(s._id)).length ?? 0;
  const isTopicCompleted = topicProgress?.status === "completed";

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "विषय", href: "/subjects" },
          { label: (subject?.nameHindi || subject?.name) ?? "...", href: `/subjects/${sId}` },
          { label: (topic?.nameHindi || topic?.name) ?? "..." },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {topic?.nameHindi || topic?.name}
            </h1>
            {isTopicCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Topic Completed
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Available question sets for practice and self-assessment
            {topicProgress && topicProgress.attemptCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {topicProgress.attemptCount} attempt{topicProgress.attemptCount !== 1 ? "s" : ""} recorded
                {topicProgress.latestScore !== undefined ? ` · Latest: ${topicProgress.latestScore}` : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* No sets yet — clear, friendly message */}
      {testSets && testSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No practice sets yet"
          description="Sets will appear here once uploaded by the administrator. Check back soon!"
        />
      )}

      {testSets && testSets.length > 0 && (
        <div className="space-y-3">
          {/* Header row: count + progress */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Practice Sets ({totalSets})
            </h2>
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{totalSets} completed
              </span>
            )}
          </div>

          {/* Stitch spec: horizontal card — icon chip + name/meta on left, Start/Review pill on right. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {testSets.map((set) => {
              const isDone = completedSet.has(set._id);
              return (
                <Link key={set._id} href={`/quiz/${set._id}`}>
                  <div
                    className={cn(
                      "flex flex-row items-center justify-between p-4 border bg-card hover:shadow-md transition-all group rounded-xl min-h-[4rem] select-none",
                      isDone
                        ? "border-emerald-400/50 dark:border-emerald-500/40 hover:border-emerald-500/70"
                        : "border-border/80 hover:border-primary/60"
                    )}
                  >
                    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                      {/* Icon chip — green if done, primary if not */}
                      <div
                        className={cn(
                          "p-2 rounded-lg shrink-0 transition-all duration-200",
                          isDone
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={cn(
                              "font-semibold text-xs sm:text-sm transition-colors truncate",
                              isDone
                                ? "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {set.name}
                          </h3>
                          {/* Completed / New Badge */}
                          {isDone ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                              <Sparkles className="h-2.5 w-2.5" />
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {set.questionCount} Questions
                          {set.negativeMarking && " · −0.25 marking"}
                        </p>
                      </div>
                    </div>

                    {/* CTA pill */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-3 transition-all",
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white"
                          : "text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground"
                      )}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isDone ? "Redo" : "Start"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
