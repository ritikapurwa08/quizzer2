"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Layers, ChevronRight } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subject?.name ?? "..." },
        ]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{subject?.name}</h1>
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
            return (
              <Link key={t._id} href={`/subjects/${id}/${t._id}`}>
                <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 bg-card hover:border-primary/60 hover:shadow-md transition-all group min-h-[3.5rem] rounded-xl select-none">
                  <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {t.name}
                      </p>
                      {setCount === 0 ? (
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">No sets yet</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{setCount} practice set{setCount !== 1 ? "s" : ""}</p>
                      )}
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
