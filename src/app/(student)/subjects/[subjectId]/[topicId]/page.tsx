"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { Card } from "@/components/ui/card";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText, Play } from "lucide-react";
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
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subject?.name ?? "...", href: `/subjects/${sId}` },
          { label: topic?.name ?? "..." },
        ]}
      />

      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {topic?.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Available question sets for practice and self-assessment
        </p>
      </div>

      {testSets && testSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No question sets uploaded for this topic yet"
          description="Question sets will appear here once uploaded by the administrator."
        />
      )}

      {testSets && testSets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Question Sets ({testSets.length})
          </h2>

          {/* Stitch spec: horizontal card — icon chip + name/meta on left, Start pill on right. Single column on mobile, 2-col on desktop. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {testSets.map((set) => (
              <Link key={set._id} href={`/quiz/${set._id}`}>
                <Card className="flex items-center justify-between p-4 border border-border hover:border-primary hover:shadow-md transition-all group rounded-xl min-h-[4rem]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                        {set.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {set.questionCount} Questions
                        {set.negativeMarking && " · Negative Marking (−0.25)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 ml-3">
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Start</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
