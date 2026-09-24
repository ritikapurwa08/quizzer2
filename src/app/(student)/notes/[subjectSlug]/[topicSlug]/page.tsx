"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { NoteBlockRenderer } from "@/components/notes/NoteBlockRenderer";
import { PdfViewer } from "@/components/notes/PdfViewer";
import { NoteDocument } from "@/types/notes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Play,
  ListOrdered,
} from "lucide-react";
import { getSubjectDisplayName, getTopicDisplayName, cn } from "@/lib/utils";

type ActiveTab = "content" | "pdf" | "images" | "practice";

export default function TopicStudyPage() {
  const { subjectSlug, topicSlug } = useParams<{ subjectSlug: string; topicSlug: string }>();

  const data = useQuery(api.notes.getTopicNoteBySlug, {
    subjectSlug,
    topicSlug,
  });

  const subject = data?.subject;
  const topic = data?.topic;
  const note = data?.note;

  // Sibling topics for sidebar / navigation
  const siblingTopics = useQuery(
    api.topics.listBySubject,
    subject?._id ? { subjectId: subject._id } : "skip"
  );

  // Test sets for practice connection
  const testSets = useQuery(
    api.testSets.listByTopic,
    topic?._id ? { topicId: topic._id } : "skip"
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("content");

  // Parse structured JSON content safely
  const rawContent = note?.content;
  const parsedContent: NoteDocument | null = useMemo(() => {
    if (!rawContent) return null;
    try {
      return JSON.parse(rawContent);
    } catch (e) {
      console.error("Failed to parse note content JSON:", e);
      return null;
    }
  }, [rawContent]);

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";
  const topicTitle = getTopicDisplayName(topic) || "Topic";

  const hasPdf = Boolean(note?.hasPdf || note?.pdfPath);
  const hasContent = Boolean(parsedContent && parsedContent.blocks && parsedContent.blocks.length > 0);
  const images = note?.images || [];
  const hasImages = images.length > 0;
  const hasPractice = Boolean(testSets && testSets.length > 0);

  // Auto-switch tab if content is not available but PDF is
  useState(() => {
    if (!hasContent && hasPdf) {
      setActiveTab("pdf");
    }
  });

  if (data === undefined) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-10 w-96 rounded bg-muted" />
        <div className="h-64 rounded-2xl border border-border bg-card p-6" />
      </div>
    );
  }

  if (data === null || !subject || !topic) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Topic Not Found"
        description="The requested topic or subject is not available."
        action={
          <Button asChild className="rounded-xl mt-3 cursor-pointer">
            <Link href="/notes">Back to Notes Home</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* ── Breadcrumb Navigation ── */}
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Study Notes", href: "/notes" },
          { label: subjectTitle, href: `/notes/${subjectSlug}` },
          { label: topicTitle },
        ]}
      />

      {/* ── Topic Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/70 pb-5">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground font-hindi">
              {topicTitle}
            </h1>
            {hasPdf && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <FileText className="h-3 w-3" /> PDF Notes Available
              </span>
            )}
          </div>
          {topic.nameHindi && topic.name && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {topic.name}
            </p>
          )}
          {(note?.summary || parsedContent?.overview) && (
            <p className="text-xs sm:text-sm text-muted-foreground font-hindi pt-1 leading-relaxed">
              {note?.summary || parsedContent?.overview}
            </p>
          )}
        </div>

        {/* Quick Practice button in header */}
        {hasPractice && (
          <Button asChild className="rounded-xl font-bold text-xs h-9 px-4 shrink-0 shadow-xs cursor-pointer">
            <Link
              href={`/subjects/${subject._id}/${topic._id}`}
              className="inline-flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Practice Sets ({testSets?.length})</span>
            </Link>
          </Button>
        )}
      </div>

      {/* ── Nav Tabs Bar (Segmented / Pill selector) ── */}
      <div className="flex items-center gap-1.5 border-b border-border/60 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
            activeTab === "content"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>Study Notes</span>
          {hasContent && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </button>

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
          <FileText className="h-4 w-4" />
          <span>PDF Notes</span>
          {hasPdf && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-background/20 font-bold">
              PDF
            </span>
          )}
        </button>

        {hasImages && (
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
            <ImageIcon className="h-4 w-4" />
            <span>Maps & Images ({images.length})</span>
          </button>
        )}

        {hasPractice && (
          <button
            type="button"
            onClick={() => setActiveTab("practice")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none",
              activeTab === "practice"
                ? "bg-primary text-primary-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Play className="h-4 w-4" />
            <span>Practice Questions ({testSets?.length})</span>
          </button>
        )}
      </div>

      {/* ── Main Layout: Content Area + Sticky Sibling Topics Sidebar ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Tab Views */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* TAB 1: Structured Content Notes */}
          {activeTab === "content" && (
            <div className="space-y-4">
              {!hasContent ? (
                <EmptyState
                  icon={BookOpen}
                  title="Study notes not available yet"
                  description="Written examination notes for this topic are being prepared. Please check the PDF notes or solve practice test sets."
                  action={
                    hasPdf ? (
                      <Button
                        onClick={() => setActiveTab("pdf")}
                        className="rounded-xl mt-3 font-semibold text-xs cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        View PDF Notes
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <article className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  {parsedContent?.blocks.map((block, idx) => (
                    <NoteBlockRenderer key={idx} block={block} />
                  ))}
                </article>
              )}
            </div>
          )}

          {/* TAB 2: PDF Document */}
          {activeTab === "pdf" && (
            <PdfViewer
              pdfPath={note?.pdfPath || `/notes/rajasthan-gk/${subjectSlug}/${topicSlug}/notes.pdf`}
              topicTitle={topicTitle}
              hasPdf={hasPdf}
            />
          )}

          {/* TAB 3: Images & Diagrams Gallery */}
          {activeTab === "images" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {images.map((img) => (
                  <Card key={img.id} className="overflow-hidden rounded-2xl border border-border bg-card p-3 space-y-2">
                    <div className="overflow-hidden rounded-xl bg-muted/40 flex items-center justify-center min-h-[220px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-auto object-contain max-h-[350px]"
                        loading="lazy"
                      />
                    </div>
                    {(img.title || img.caption) && (
                      <div className="text-xs space-y-0.5 px-1">
                        {img.title && <p className="font-bold text-foreground font-hindi">{img.title}</p>}
                        {img.caption && <p className="text-muted-foreground font-hindi">{img.caption}</p>}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Practice Test Sets Connection */}
          {activeTab === "practice" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Available Practice Sets ({testSets?.length ?? 0})
                </h3>
              </div>

              {!hasPractice ? (
                <EmptyState
                  icon={Play}
                  title="No test sets available yet"
                  description="Practice test sets for this topic will be uploaded soon."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {testSets?.map((set) => (
                    <Link key={set._id} href={`/quiz/${set._id}`}>
                      <div className="flex items-center justify-between p-4 border border-border/80 hover:border-foreground/30 bg-card hover:shadow-xs transition-all group rounded-xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                            <Play className="h-4 w-4 fill-current" />
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate font-hindi group-hover:text-primary transition-colors">
                              {set.name}
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              {set.questionCount} Questions · RPSC Pattern
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sibling Topics Navigator (Desktop Sidebar) */}
        {siblingTopics && siblingTopics.length > 0 && (
          <aside className="hidden lg:block w-72 shrink-0 space-y-3">
            <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-border/60 shrink-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="h-3.5 w-3.5 text-primary" />
                  Other Topics in Subject
                </span>
                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                  {siblingTopics.length}
                </span>
              </div>

              <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                {siblingTopics.map((t, idx) => {
                  const isCurrent = t._id === topic._id;
                  return (
                    <Link
                      key={t._id}
                      href={`/notes/${subjectSlug}/${t.slug}`}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 text-xs font-hindi rounded-xl transition-all block",
                        isCurrent
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-mono shrink-0",
                        isCurrent ? "text-primary-foreground font-bold" : "text-muted-foreground/60"
                      )}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate flex-1">{getTopicDisplayName(t)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
