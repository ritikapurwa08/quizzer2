"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import { cn, getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

type SubjectTab = "quiz" | "pdf" | "tricks" | "images";

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
  const publishedNotes = useQuery(api.notes.listPublishedBySubject, { subjectId: id }) ?? [];

  const [activeTab, setActiveTab] = useState<SubjectTab>("quiz");

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";

  // Map notes by topicId for quick lookup
  const publishedMap = useMemo(() => {
    return new Map(publishedNotes.map((n) => [n.topicId, n]));
  }, [publishedNotes]);

  // Derived counts and collections
  const totalQuizSets = useMemo(() => {
    return Object.values(setCounts).reduce((acc, curr) => acc + curr, 0);
  }, [setCounts]);

  const pdfTopics = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t) => {
      const note = publishedMap.get(t._id);
      return Boolean(note?.hasPdf || note?.pdfPath);
    });
  }, [topics, publishedMap]);

  const trickTopics = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t) => {
      const note = publishedMap.get(t._id);
      return Boolean(note?.content && note.content.trim().length > 0);
    });
  }, [topics, publishedMap]);

  const allImages = useMemo(() => {
    const list: Array<{
      id: string;
      src: string;
      alt: string;
      caption?: string;
      title?: string;
      topicName: string;
      topicId: string;
      topicSlug: string;
    }> = [];

    for (const n of publishedNotes) {
      if (n.images && n.images.length > 0) {
        const topicObj = topics?.find((t) => t._id === n.topicId);
        const topicName = topicObj ? getTopicDisplayName(topicObj) : "";
        for (const img of n.images) {
          list.push({
            ...img,
            topicName,
            topicId: n.topicId,
            topicSlug: n.slug,
          });
        }
      }
    }
    return list;
  }, [publishedNotes, topics]);

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

      {/* ── Modern App Segmented Navigation Tabs Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-border/60">
        {/* TAB 1: Quiz */}
        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
            activeTab === "quiz"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>Quiz</span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
              activeTab === "quiz"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {totalQuizSets}
          </span>
        </button>

        {/* TAB 2: PDFs */}
        <button
          type="button"
          onClick={() => setActiveTab("pdf")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
            activeTab === "pdf"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>PDFs</span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
              activeTab === "pdf"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {pdfTopics.length}
          </span>
        </button>

        {/* TAB 3: Tricks */}
        <button
          type="button"
          onClick={() => setActiveTab("tricks")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
            activeTab === "tricks"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Tricks</span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
              activeTab === "tricks"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {trickTopics.length}
          </span>
        </button>

        {/* TAB 4: Images */}
        <button
          type="button"
          onClick={() => setActiveTab("images")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
            activeTab === "images"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>Images</span>
          <span
            className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
              activeTab === "images"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {allImages.length}
          </span>
        </button>
      </div>

      {/* ── SECTION 1: QUIZ CONTENT ── */}
      {activeTab === "quiz" && (
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
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-border/80 bg-card p-4 animate-pulse"
                />
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
                const setCount = setCounts[t._id] ?? 0;
                const progress = progressMap[t._id];
                const isCompleted = progress?.status === "completed";
                const isInProgress = progress?.status === "in_progress";

                return (
                  <Link key={t._id} href={`/subjects/${id}/${t._id}`}>
                    <div className="flex flex-row items-center justify-between p-3.5 border border-border/80 hover:border-foreground/30 bg-card hover:shadow-xs transition-all group min-h-[4rem] rounded-xl select-none">
                      <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold shrink-0 transition-all duration-200 bg-muted text-foreground group-hover:bg-foreground group-hover:text-background">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm transition-colors truncate font-hindi text-foreground group-hover:text-primary">
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
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                                <CheckCircle2 className="h-3 w-3" /> Completed
                              </span>
                            )}

                            {isInProgress && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                                <Clock className="h-3 w-3" /> In Progress ({progress.completedSets}/{progress.totalSets})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200 shrink-0 ml-2" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 2: PDFS CONTENT ── */}
      {activeTab === "pdf" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Downloadable &amp; Printable PDFs ({pdfTopics.length})
            </h2>
          </div>

          {pdfTopics.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No PDF notes available yet"
              description="Official PDF study notes will be uploaded soon for this subject."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pdfTopics.map((topic) => {
                const note = publishedMap.get(topic._id);
                return (
                  <div
                    key={topic._id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate font-hindi">
                          {getTopicDisplayName(topic)}
                        </h3>
                        {note?.summary ? (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {note.summary}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Official Topic Booklet
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                        <FileText className="h-3 w-3" /> PDF Ready
                      </span>
                      <Button asChild size="sm" className="rounded-lg h-7 px-3 text-xs font-semibold">
                        <Link href={`/subjects/${id}/${topic._id}`}>
                          Open Notes <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: TRICKS CONTENT ── */}
      {activeTab === "tricks" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Memory Tricks &amp; Structured Notes ({trickTopics.length})
            </h2>
          </div>

          {trickTopics.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No tricks available yet"
              description="Memory shortcuts, facts, and key points will be published soon for this subject."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trickTopics.map((topic) => {
                const note = publishedMap.get(topic._id);
                return (
                  <div
                    key={topic._id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-card hover:border-foreground/30 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate font-hindi">
                          {getTopicDisplayName(topic)}
                        </h3>
                        {note?.summary ? (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {note.summary}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Detailed memory tricks &amp; exam insights
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/60">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <BookOpen className="h-3 w-3" /> Study Material
                      </span>
                      <Button asChild size="sm" variant="outline" className="rounded-lg h-7 px-3 text-xs font-semibold">
                        <Link href={`/subjects/${id}/${topic._id}`}>
                          Read Tricks <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 4: IMAGES CONTENT ── */}
      {activeTab === "images" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Visual Notes, Maps &amp; Diagrams ({allImages.length})
            </h2>
          </div>

          {allImages.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No visual diagrams available yet"
              description="Geographical maps, flowcharts, and diagrams will be added soon for this subject."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allImages.map((img) => (
                <Card
                  key={img.id}
                  className="overflow-hidden rounded-xl border border-border bg-card p-3 space-y-2 flex flex-col justify-between"
                >
                  <div className="overflow-hidden rounded-lg bg-muted/40 flex items-center justify-center min-h-[160px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-auto object-contain max-h-[220px]"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1">
                    {img.topicName && (
                      <span className="text-[10px] font-semibold text-primary font-hindi truncate block">
                        {img.topicName}
                      </span>
                    )}
                    {img.title && (
                      <p className="text-xs font-semibold text-foreground line-clamp-1">
                        {img.title}
                      </p>
                    )}
                    {img.caption && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {img.caption}
                      </p>
                    )}
                  </div>
                  <div className="pt-1 border-t border-border/50">
                    <Button asChild size="sm" variant="ghost" className="w-full h-7 text-xs font-semibold justify-between px-2">
                      <Link href={`/subjects/${id}/${img.topicId}`}>
                        <span>View in Topic</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
