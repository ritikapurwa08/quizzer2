"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
  Image as ImageIcon,
  Search,
} from "lucide-react";
import { getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

export default function SubjectNotesDirectoryPage() {
  const { subjectSlug } = useParams<{ subjectSlug: string }>();
  const subject = useQuery(api.subjects.getBySlug, { slug: subjectSlug });
  const topics = useQuery(
    api.topics.listBySubject,
    subject?._id ? { subjectId: subject._id } : "skip"
  );
  const publishedNotes = useQuery(
    api.notes.listPublishedBySubject,
    subject?._id ? { subjectId: subject._id } : "skip"
  );
  const setCounts = useQuery(
    api.testSets.countsBySubject,
    subject?._id ? { subjectId: subject._id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");

  const publishedMap = new Map((publishedNotes || []).map((n) => [n.topicId, n]));

  const filteredTopics = topics?.filter((topic) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      topic.name.toLowerCase().includes(q) ||
      (topic.nameHindi && topic.nameHindi.toLowerCase().includes(q))
    );
  });

  const subjectTitle = getSubjectDisplayName(subject) || "विषय";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <BreadcrumbNav
        items={[
          { label: "डैशबोर्ड", href: "/dashboard" },
          { label: "नोट्स", href: "/notes" },
          { label: subjectTitle },
        ]}
      />

      {/* Subject Header */}
      <div className="space-y-1.5 border-b border-border/60 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
          {subjectTitle}
        </h1>
        {subject?.name && subject.nameHindi && (
          <p className="text-xs text-muted-foreground">{subject.name}</p>
        )}
        {subject?.description && (
          <p className="text-xs sm:text-sm text-muted-foreground font-hindi pt-0.5 max-w-3xl">
            {subject.description}
          </p>
        )}
      </div>

      {/* Search & Topic Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-hindi flex items-center gap-2">
          <Layers className="h-4 w-4 text-foreground" />
          <span>उपलब्ध टॉपिक</span>
          {topics && <span className="tabular-nums">({topics.length})</span>}
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="टॉपिक खोजें…"
            className="w-full pl-8.5 pr-3 py-1.5 text-xs sm:text-sm bg-card rounded-xl border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground font-hindi transition-colors"
          />
        </div>
      </div>

      {/* Topics Listing */}
      {topics === undefined ? (
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-border/80 bg-card p-4 animate-pulse"
            />
          ))}
        </div>
      ) : filteredTopics && filteredTopics.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="कोई टॉपिक नहीं मिला"
          description="आपकी खोज के अनुसार कोई टॉपिक उपलब्ध नहीं है।"
        />
      ) : (
        <div className="space-y-2.5">
          {filteredTopics?.map((topic, idx) => {
            const note = publishedMap.get(topic._id);
            const setsCount = setCounts?.[topic._id] ?? 0;
            const hasPdf = note?.hasPdf || Boolean(note?.pdfPath);
            const hasContent = Boolean(note?.content && note.content.length > 0);
            const hasImages = Boolean(note?.images && note.images.length > 0);

            return (
              <Link
                key={topic._id}
                href={`/notes/${subjectSlug}/${topic.slug}`}
                className="block group select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-foreground text-xs font-bold shrink-0 group-hover:bg-foreground group-hover:text-background transition-colors">
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate font-hindi group-hover:text-primary transition-colors">
                        {getTopicDisplayName(topic)}
                      </h3>
                      {topic.nameHindi && topic.name && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {topic.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Resource Badges */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {hasPdf && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-hindi">
                        <FileText className="h-3 w-3" />
                        PDF
                      </span>
                    )}

                    {hasContent && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/15 text-success text-[10px] font-bold font-hindi">
                        <Sparkles className="h-3 w-3" />
                        नोट्स
                      </span>
                    )}

                    {hasImages && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-medium font-hindi">
                        <ImageIcon className="h-3 w-3" />
                        चित्र
                      </span>
                    )}

                    {setsCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground text-[10px] font-bold tabular-nums">
                        {setsCount} अभ्यास सेट
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-1 shrink-0 hidden sm:inline" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
