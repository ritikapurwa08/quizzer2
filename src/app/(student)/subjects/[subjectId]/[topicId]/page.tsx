"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { FileText, Play, CheckCircle2, Sparkles } from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { cn, getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

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

  const subjectTitle = getSubjectDisplayName(subject) || "विषय";
  const topicTitle = getTopicDisplayName(topic) || "टॉपिक";

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "डैशबोर्ड", href: "/dashboard" },
          { label: "विषय", href: "/subjects" },
          { label: subjectTitle, href: `/subjects/${sId}` },
          { label: topicTitle },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
              {topicTitle}
            </h1>
            {isTopicCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-hindi">
                <CheckCircle2 className="h-3.5 w-3.5" /> टॉपिक पूर्ण (Completed)
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 font-hindi">
            स्व-मूल्यांकन एवं परीक्षा अभ्यास के लिए उपलब्ध प्रश्न-सेट
            {topicProgress && topicProgress.attemptCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {topicProgress.attemptCount} प्रयास दर्ज
                {topicProgress.latestScore !== undefined ? ` · नवीनतम अंक: ${topicProgress.latestScore}` : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* No sets yet — clear, friendly message */}
      {testSets && testSets.length === 0 && (
        <EmptyState
          icon={FileText}
          title="अभी कोई अभ्यास सेट उपलब्ध नहीं है"
          description="इस टॉपिक के प्रश्न-सेट जल्द ही उपलब्ध होंगे। कृपया प्रतीक्षा करें।"
        />
      )}

      {testSets && testSets.length > 0 && (
        <div className="space-y-3">
          {/* Header row: count + progress */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi">
              अभ्यास सेट ({totalSets})
            </h2>
            {completedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-hindi">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedCount}/{totalSets} पूर्ण
              </span>
            )}
          </div>

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
                      {/* Icon chip */}
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
                              "font-semibold text-xs sm:text-sm transition-colors truncate font-hindi",
                              isDone
                                ? "text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                : "text-foreground group-hover:text-primary"
                            )}
                          >
                            {set.name}
                          </h3>
                          {/* Completed / New Badge */}
                          {isDone ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 font-hindi">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              पूर्ण
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 font-hindi">
                              <Sparkles className="h-2.5 w-2.5" />
                              नया
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-hindi">
                          {set.questionCount} प्रश्न
                          {set.negativeMarking && " · −0.33 ऋणात्मक अंकन"}
                        </p>
                      </div>
                    </div>

                    {/* CTA pill */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ml-3 transition-all font-hindi",
                        isDone
                          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white"
                          : "text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground"
                      )}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isDone ? "पुनः हल करें" : "शुरू करें"}</span>
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
