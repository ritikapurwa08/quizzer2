"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Card } from "@/components/ui/card";
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

        <div className="grid sm:grid-cols-2 gap-3">
          {topics?.map((t, index) => (
            <Link key={t._id} href={`/subjects/${id}/${t._id}`}>
              <Card className="flex items-center justify-between p-3.5 hover:border-primary hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {t.name}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
