"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { cn } from "@/lib/utils";

function CollapsibleDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 80;

  return (
    <div className="mt-1">
      <p className={cn("text-sm text-muted-foreground transition-all", !expanded && "line-clamp-1")}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-primary hover:underline mt-0.5 cursor-pointer"
        >
          {expanded ? "Show less" : "More..."}
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

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "विषय", href: "/subjects" },
          { label: (subject?.nameHindi || subject?.name) ?? "..." },
        ]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{subject?.nameHindi || subject?.name}</h1>
        {subject?.description && (
          <CollapsibleDescription text={subject.description} />
        )}
      </div>

      {topics && topics.length === 0 && (
        <EmptyState icon={Layers} title="No topics in this subject yet" />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fixed Topics ({topics?.length ?? 0})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {topics?.map((t, index) => {
            const setCount = setCounts[t._id] ?? 0;
            const progress = progressMap[t._id];
            const isCompleted = progress?.status === "completed";
            const isInProgress = progress?.status === "in_progress";

            return (
              <Link key={t._id} href={`/subjects/${id}/${t._id}`}>
                <div
                  className={cn(
                    "flex flex-row items-center justify-between p-3.5 border bg-card hover:shadow-md transition-all group min-h-[4rem] rounded-xl select-none",
                    isCompleted
                      ? "border-emerald-400/50 dark:border-emerald-500/40 hover:border-emerald-500/70"
                      : isInProgress
                      ? "border-amber-400/50 dark:border-amber-500/40 hover:border-amber-500/70"
                      : "border-border/80 hover:border-primary/60"
                  )}
                >
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 transition-all duration-200",
                        isCompleted
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white"
                          : isInProgress
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white"
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p
                          className={cn(
                            "font-semibold text-xs sm:text-sm transition-colors truncate",
                            isCompleted
                              ? "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                              : isInProgress
                              ? "text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400"
                              : "text-foreground group-hover:text-primary"
                          )}
                        >
                          {t.nameHindi || t.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {setCount === 0 ? (
                          <p className="text-[10px] text-muted-foreground/60">No sets yet</p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">
                            {setCount} practice set{setCount !== 1 ? "s" : ""}
                          </p>
                        )}

                        {isCompleted && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}

                        {isInProgress && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                            <Clock className="h-3 w-3" /> Attempted ({progress.completedSets}/{progress.totalSets})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 shrink-0 ml-2" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
