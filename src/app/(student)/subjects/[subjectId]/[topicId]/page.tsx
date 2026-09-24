"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { EmptyState } from "@/components/shared/EmptyState";
import { NoteBlockRenderer } from "@/components/notes/NoteBlockRenderer";
import { PdfViewer } from "@/components/notes/PdfViewer";
import { NoteDocument, FactsBlock, KeyPointsBlock } from "@/types/notes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Play,
  CheckCircle2,
  BookOpen,
  Image as ImageIcon,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { api } from "../../../../../../convex/_generated/api";
import { cn, getSubjectDisplayName, getTopicDisplayName } from "@/lib/utils";

type ActiveTab = "quiz" | "notes" | "images" | "pdf" | "facts";

export default function TopicDetailPage() {
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>();
  const sId = subjectId as Id<"subjects">;
  const tId = topicId as Id<"topics">;

  const subject = useQuery(api.subjects.get, { id: sId });
  const topic = useQuery(api.topics.get, { id: tId });
  const testSets = useQuery(api.testSets.listByTopic, { topicId: tId });
  const topicProgress = useQuery(api.topics.getProgress, { topicId: tId });
  const completedIds = useQuery(api.testSets.completedSetIds) ?? [];
  const note = useQuery(api.notes.getTopicNote, { topicId: tId });

  const [activeTab, setActiveTab] = useState<ActiveTab>("quiz");

  const completedSet = new Set(completedIds);
  const totalSets = testSets?.length ?? 0;
  const completedCount = testSets?.filter((s) => completedSet.has(s._id)).length ?? 0;
  const isTopicCompleted = topicProgress?.status === "completed";

  const subjectTitle = getSubjectDisplayName(subject) || "Subject";
  const topicTitle = getTopicDisplayName(topic) || "Topic";

  // Parse structured JSON content safely
  const noteContent = note?.content;
  const parsedContent: NoteDocument | null = useMemo(() => {
    if (!noteContent) return null;
    try {
      return JSON.parse(noteContent);
    } catch {
      return null;
    }
  }, [noteContent]);

  // Derived note availability flags
  const hasNotes = Boolean(parsedContent && parsedContent.blocks && parsedContent.blocks.length > 0);
  const hasPdf = Boolean(note?.hasPdf || note?.pdfPath);
  const images = note?.images ?? [];
  const hasImages = images.length > 0;

  // Extract facts/key_points blocks for the dedicated Facts tab
  const factsBlocks: (FactsBlock | KeyPointsBlock)[] = useMemo(() => {
    if (!parsedContent?.blocks) return [];
    return parsedContent.blocks.filter(
      (b): b is FactsBlock | KeyPointsBlock =>
        b.type === "facts" || b.type === "key_points"
    );
  }, [parsedContent]);
  const hasFacts = factsBlocks.length > 0;

  const pdfPath =
    note?.pdfPath ||
    `/notes/rajasthan-gk/${subject?.slug ?? ""}/${topic?.slug ?? ""}/notes.pdf`;

  return (
    <div className="space-y-5">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Subjects", href: "/subjects" },
          { label: subjectTitle, href: `/subjects/${sId}` },
          { label: topicTitle },
        ]}
      />

      {/* Topic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
              {topicTitle}
            </h1>
            {isTopicCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice test sets and revision materials for this topic.
            {topicProgress && topicProgress.attemptCount > 0 && (
              <span className="ml-2 text-foreground font-medium">
                · {topicProgress.attemptCount} attempts recorded
                {topicProgress.latestScore !== undefined
                  ? ` · Latest Score: ${topicProgress.latestScore}`
                  : ""}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border/60 pb-0 overflow-x-auto scrollbar-none">
        {/* Quiz tab — always visible */}
        <TabButton
          active={activeTab === "quiz"}
          onClick={() => setActiveTab("quiz")}
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Quiz"
          badge={totalSets > 0 ? String(totalSets) : undefined}
        />
        {/* Notes tab */}
        <TabButton
          active={activeTab === "notes"}
          onClick={() => setActiveTab("notes")}
          icon={<BookOpen className="h-3.5 w-3.5" />}
          label="Notes"
          dot={hasNotes || hasPdf}
        />
        {/* PDF tab */}
        <TabButton
          active={activeTab === "pdf"}
          onClick={() => setActiveTab("pdf")}
          icon={<FileText className="h-3.5 w-3.5" />}
          label="PDF"
          dot={hasPdf}
        />
        {/* Images tab */}
        <TabButton
          active={activeTab === "images"}
          onClick={() => setActiveTab("images")}
          icon={<ImageIcon className="h-3.5 w-3.5" />}
          label="Images"
          badge={images.length > 0 ? String(images.length) : undefined}
        />
        {/* Facts tab */}
        <TabButton
          active={activeTab === "facts"}
          onClick={() => setActiveTab("facts")}
          icon={<Lightbulb className="h-3.5 w-3.5" />}
          label="Facts"
          badge={factsBlocks.length > 0 ? String(factsBlocks.length) : undefined}
        />
      </div>

      {/* ── TAB: QUIZ ───────────────────────────────────────────────── */}
      {activeTab === "quiz" && (
        <>
          {testSets && testSets.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No practice sets available yet"
              description="Question sets for this topic will be available soon."
            />
          )}

          {testSets && testSets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Practice Sets ({totalSets})
                </h2>
                {completedCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completedCount}/{totalSets} completed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {testSets.map((set) => {
                  const isDone = completedSet.has(set._id);
                  return (
                    <Link key={set._id} href={`/quiz/${set._id}`}>
                      <div className="flex flex-row items-center justify-between p-4 border border-border/80 hover:border-foreground/30 bg-card hover:shadow-xs transition-all group rounded-xl min-h-[4rem] select-none">
                        <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg shrink-0 transition-all duration-200 bg-muted text-foreground group-hover:bg-foreground group-hover:text-background">
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium text-xs sm:text-sm transition-colors truncate text-foreground group-hover:text-primary">
                                {set.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ml-3 transition-all border border-border bg-card text-foreground group-hover:bg-foreground group-hover:text-background">
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>{isDone ? "Retake" : "Start"}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: NOTES ──────────────────────────────────────────────── */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Loading */}
          {note === undefined && (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-40 rounded-xl bg-muted" />
              <div className="h-24 rounded-xl bg-muted" />
            </div>
          )}

          {/* No JSON note yet, but PDF is available -> provide direct note viewing */}
          {note !== undefined && !hasNotes && hasPdf && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span>PDF booklet notes are available for this topic.</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab("pdf")}
                  className="rounded-lg text-xs font-semibold h-7"
                >
                  Open Full PDF
                </Button>
              </div>
              <PdfViewer pdfPath={pdfPath} topicTitle={topicTitle} hasPdf={hasPdf} />
            </div>
          )}

          {/* No notes and no PDF */}
          {note !== undefined && !hasNotes && !hasPdf && (
            <EmptyState
              icon={BookOpen}
              title="Study notes not available yet"
              description="Detailed notes are being prepared for this topic."
            />
          )}

          {/* Structured JSON content */}
          {hasNotes && (
            <>
              {hasPdf && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/40 text-xs text-foreground">
                  <span>Full PDF booklet is also available for this topic.</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveTab("pdf")}
                    className="text-xs font-semibold h-7 text-primary hover:text-primary"
                  >
                    View PDF Notes →
                  </Button>
                </div>
              )}
              {parsedContent?.overview && (
                <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/40 pl-3">
                  {parsedContent.overview}
                </p>
              )}
              <article className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                {parsedContent?.blocks.map((block, idx) => (
                  <NoteBlockRenderer key={idx} block={block} />
                ))}
              </article>
            </>
          )}
        </div>
      )}

      {/* ── TAB: IMAGES ─────────────────────────────────────────────── */}
      {activeTab === "images" && (
        <div>
          {images.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No diagrams or images available"
              description="Infographics, diagrams, and maps will be added soon for this topic."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((img) => (
                <Card
                  key={img.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card p-3 space-y-2"
                >
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
                      {img.title && <p className="font-bold text-foreground">{img.title}</p>}
                      {img.caption && <p className="text-muted-foreground">{img.caption}</p>}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PDF ────────────────────────────────────────────────── */}
      {activeTab === "pdf" && (
        <PdfViewer
          pdfPath={pdfPath}
          topicTitle={topicTitle}
          hasPdf={hasPdf}
        />
      )}

      {/* ── TAB: FACTS ──────────────────────────────────────────────── */}
      {activeTab === "facts" && (
        <div className="space-y-4">
          {!hasFacts ? (
            <EmptyState
              icon={Sparkles}
              title="No key facts available"
              description="Key points and exam facts are not yet available for this topic."
            />
          ) : (
            factsBlocks.map((block, idx) => (
              <NoteBlockRenderer key={idx} block={block} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab Button Component ────────────────────────────────────────────────────
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  dot?: boolean;
}

function TabButton({ active, onClick, icon, label, badge, dot }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap select-none border-b-2 -mb-px rounded-none",
        active
          ? "border-primary text-primary font-bold"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
      {dot && !badge && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            active ? "bg-primary" : "bg-muted-foreground/50"
          )}
        />
      )}
    </button>
  );
}
