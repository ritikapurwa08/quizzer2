"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText, ChevronRight, Play } from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";

export default function TopicDetailPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const sId = subjectId as Id<"subjects">;
  const tId = topicId as Id<"topics">;

  const subject = useQuery(api.subjects.get, { id: sId });
  const topic = useQuery(api.topics.get, { id: tId });
  const testSets = useQuery(api.testSets.listByTopic, { topicId: tId });

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subject?.name ?? "...", href: `/subjects/${sId}` },
          { label: topic?.name ?? "..." },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{topic?.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Available Question Sets for practice and self-assessment
        </p>
      </div>

      {testSets && testSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No question sets uploaded for this topic yet"
          description="Question sets will appear here once uploaded by the administrator."
        />
      )}

      <div className="space-y-3">
        {testSets && testSets.length > 0 && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Question Sets ({testSets.length})
          </h2>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {testSets?.map((set, idx) => (
            <Link key={set._id} href={`/quiz/${set._id}`}>
              <Card className="flex items-center justify-between p-4 hover:border-primary hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {set.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {set.questionCount} Questions {set.negativeMarking ? "· Negative Marking (-0.25)" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1.5 rounded-md group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
