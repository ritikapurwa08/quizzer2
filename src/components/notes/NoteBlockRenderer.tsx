"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  NoteBlock,
  HeadingBlock,
  ParagraphBlock,
  FactsBlock,
  KeyPointsBlock,
  BulletListBlock,
  NumberedListBlock,
  TableBlock,
  ComparisonTableBlock,
  TimelineBlock,
  TrickBlock,
  ExamTipBlock,
  ExamTrapBlock,
  CalloutBlock,
  QuoteBlock,
  ImageBlock,
  FaqBlock,
  QuickRevisionBlock,
  PyqConnectionBlock,
  DefinitionBlock,
} from "@/types/notes";
import { cn } from "@/lib/utils";
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  Quote,
  Target,
  FileCheck2,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export function NoteBlockRenderer({ block }: { block: NoteBlock }) {
  switch (block.type) {
    case "heading":
      return <RenderHeading block={block} />;
    case "paragraph":
      return <RenderParagraph block={block} />;
    case "facts":
    case "key_points":
      return <RenderFacts block={block} />;
    case "bullet_list":
      return <RenderBulletList block={block} />;
    case "numbered_list":
      return <RenderNumberedList block={block} />;
    case "table":
      return <RenderTable block={block} />;
    case "comparison_table":
      return <RenderComparisonTable block={block} />;
    case "timeline":
      return <RenderTimeline block={block} />;
    case "trick":
    case "mnemonic":
      return <RenderTrick block={block} />;
    case "exam_tip":
      return <RenderExamTip block={block} />;
    case "exam_trap":
      return <RenderExamTrap block={block} />;
    case "callout":
      return <RenderCallout block={block} />;
    case "quote":
      return <RenderQuote block={block} />;
    case "image":
      return <RenderImage block={block} />;
    case "faq":
      return <RenderFaq block={block} />;
    case "quick_revision":
      return <RenderQuickRevision block={block} />;
    case "pyq_connection":
      return <RenderPyqConnection block={block} />;
    case "definition":
      return <RenderDefinition block={block} />;
    default:
      return null;
  }
}

// ── 1. Heading ─────────────────────────────────────────────────────────────
function RenderHeading({ block }: { block: HeadingBlock }) {
  const level = block.level || 2;
  const HeadingTag = `h${level}` as "h1" | "h2" | "h3" | "h4";

  const sizeClasses = {
    1: "text-2xl sm:text-3xl font-extrabold tracking-tight mt-8 mb-3 text-foreground",
    2: "text-xl sm:text-2xl font-bold tracking-tight mt-6 mb-2.5 text-foreground border-b border-border/60 pb-2",
    3: "text-lg sm:text-xl font-bold mt-5 mb-2 text-foreground",
    4: "text-base sm:text-lg font-semibold mt-4 mb-1.5 text-foreground",
  }[level];

  return (
    <div className="space-y-0.5">
      <HeadingTag className={cn("font-hindi", sizeClasses)}>
        {block.text}
      </HeadingTag>
      {block.subtitle && (
        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
          {block.subtitle}
        </p>
      )}
    </div>
  );
}

// ── 2. Paragraph ───────────────────────────────────────────────────────────
function RenderParagraph({ block }: { block: ParagraphBlock }) {
  return (
    <p className="text-sm sm:text-base leading-relaxed text-foreground/90 font-hindi my-2.5">
      {block.content}
    </p>
  );
}

// ── 3. Facts & Key Points ──────────────────────────────────────────────────
function RenderFacts({ block }: { block: FactsBlock | KeyPointsBlock }) {
  return (
    <div className="my-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <h4 className="font-bold text-sm sm:text-base text-foreground font-hindi">
          {block.title || "महत्वपूर्ण तथ्य (Key Facts)"}
        </h4>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-hindi text-foreground/90">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
              {idx + 1}
            </span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 4. Bullet List ─────────────────────────────────────────────────────────
function RenderBulletList({ block }: { block: BulletListBlock }) {
  return (
    <ul className="my-3 space-y-1.5 list-none pl-1">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm font-hindi text-foreground/90">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ── 5. Numbered List ───────────────────────────────────────────────────────
function RenderNumberedList({ block }: { block: NumberedListBlock }) {
  return (
    <ol className="my-3 space-y-2 list-none pl-1">
      {block.items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5 text-sm font-hindi text-foreground/90">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-xs font-bold font-mono">
            {idx + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ── 6. Table ───────────────────────────────────────────────────────────────
function RenderTable({ block }: { block: TableBlock }) {
  return (
    <div className="my-4 space-y-1.5">
      {block.title && (
        <h4 className="text-sm font-bold text-foreground font-hindi flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {block.title}
        </h4>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs sm:text-sm font-hindi border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {block.columns.map((col, idx) => (
                <th key={idx} className="px-3.5 py-2.5 font-bold text-foreground whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2.5 text-foreground/90 leading-relaxed align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.caption && (
        <p className="text-[11px] text-muted-foreground italic font-hindi pl-1">
          {block.caption}
        </p>
      )}
    </div>
  );
}

// ── 7. Comparison Table ────────────────────────────────────────────────────
function RenderComparisonTable({ block }: { block: ComparisonTableBlock }) {
  return (
    <div className="my-4 space-y-1.5">
      {block.title && (
        <h4 className="text-sm font-bold text-foreground font-hindi flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-primary" />
          {block.title}
        </h4>
      )}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-left text-xs sm:text-sm font-hindi border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/80">
              <th className="px-3.5 py-2.5 font-bold text-muted-foreground w-1/4">पहलू / आधार</th>
              <th className="px-3.5 py-2.5 font-bold text-primary w-3/8">{block.headers[0]}</th>
              <th className="px-3.5 py-2.5 font-bold text-foreground w-3/8">{block.headers[1]}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {block.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className="px-3.5 py-2.5 font-semibold text-muted-foreground bg-muted/20 align-top">
                  {row.feature}
                </td>
                <td className="px-3.5 py-2.5 text-foreground/90 align-top">
                  {row.col1}
                </td>
                <td className="px-3.5 py-2.5 text-foreground/90 align-top">
                  {row.col2}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 8. Timeline ────────────────────────────────────────────────────────────
function RenderTimeline({ block }: { block: TimelineBlock }) {
  return (
    <div className="my-4 space-y-3">
      {block.title && (
        <h4 className="text-sm font-bold text-foreground font-hindi flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {block.title}
        </h4>
      )}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {block.events.map((event, idx) => (
          <div key={idx} className="relative space-y-1">
            <span className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold font-mono">
                {event.dateOrEra}
              </span>
              <h5 className="font-bold text-xs sm:text-sm text-foreground font-hindi">
                {event.title}
              </h5>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-hindi leading-relaxed">
              {event.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 9. Memory Trick / Mnemonic ─────────────────────────────────────────────
function RenderTrick({ block }: { block: TrickBlock }) {
  return (
    <div className="my-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm sm:text-base text-foreground font-hindi">
            {block.title || "याद रखने की ट्रिक (Memory Trick)"}
          </h4>
        </div>
        {block.examContext && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-hindi">
            {block.examContext}
          </span>
        )}
      </div>

      <div className="p-3 rounded-lg bg-background/80 border border-amber-500/20 font-hindi">
        <p className="text-xs text-muted-foreground font-semibold mb-0.5 uppercase tracking-wide">
          सूत्र / Mnemonic:
        </p>
        <p className="text-sm sm:text-base font-bold text-amber-700 dark:text-amber-300 font-mono">
          &ldquo;{block.mnemonic}&rdquo;
        </p>
      </div>

      <p className="text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed">
        <span className="font-bold">स्पष्टीकरण: </span>
        {block.explanation}
      </p>
    </div>
  );
}

// ── 10. Exam Tip ───────────────────────────────────────────────────────────
function RenderExamTip({ block }: { block: ExamTipBlock }) {
  return (
    <div className="my-3 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
      <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 space-y-0.5">
        <h5 className="font-bold text-xs sm:text-sm text-foreground font-hindi">
          {block.title || "परीक्षा टिप (Exam Tip)"}
        </h5>
        <p className="text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed">
          {block.content}
        </p>
      </div>
    </div>
  );
}

// ── 11. Exam Trap / Common Confusion ───────────────────────────────────────
function RenderExamTrap({ block }: { block: ExamTrapBlock }) {
  return (
    <div className="my-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <h4 className="font-bold text-sm sm:text-base text-destructive font-hindi">
          {block.title || "सावधानी / सामान्य भ्रम (Exam Trap)"}
        </h4>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm font-hindi">
        <div className="p-3 rounded-lg bg-background/80 border border-destructive/20 space-y-1">
          <p className="text-[11px] font-bold text-destructive flex items-center gap-1">
            ✕ सामान्य गलती (Confusion):
          </p>
          <p className="text-foreground/90 leading-relaxed">{block.confusion}</p>
        </div>
        <div className="p-3 rounded-lg bg-background/80 border border-success/30 space-y-1">
          <p className="text-[11px] font-bold text-success flex items-center gap-1">
            ✓ सही तथ्य (Reality):
          </p>
          <p className="text-foreground/90 leading-relaxed">{block.clarification}</p>
        </div>
      </div>
    </div>
  );
}

// ── 12. Callout ────────────────────────────────────────────────────────────
function RenderCallout({ block }: { block: CalloutBlock }) {
  const type = block.calloutType || "info";

  const styles = {
    info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    success: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    tip: "border-primary/30 bg-primary/10 text-primary",
  }[type];

  return (
    <div className={cn("my-3 rounded-xl border p-3.5 space-y-1", styles)}>
      {block.title && (
        <h5 className="font-bold text-xs sm:text-sm flex items-center gap-1.5 font-hindi text-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          {block.title}
        </h5>
      )}
      <p className="text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed">
        {block.content}
      </p>
    </div>
  );
}

// ── 13. Quote ──────────────────────────────────────────────────────────────
function RenderQuote({ block }: { block: QuoteBlock }) {
  return (
    <blockquote className="my-4 pl-4 border-l-4 border-primary/50 py-1 space-y-1">
      <p className="text-sm sm:text-base italic text-foreground font-hindi leading-relaxed">
        &ldquo;{block.quote}&rdquo;
      </p>
      {(block.author || block.source) && (
        <p className="text-xs text-muted-foreground font-hindi">
          — {block.author} {block.source ? `(${block.source})` : ""}
        </p>
      )}
    </blockquote>
  );
}

// ── 14. Image ──────────────────────────────────────────────────────────────
function RenderImage({ block }: { block: ImageBlock }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="my-3 p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center text-xs text-muted-foreground font-hindi">
        {block.alt || "चित्र उपलब्ध नहीं है"}
      </div>
    );
  }

  return (
    <figure className="my-4 space-y-2">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.src}
          alt={block.alt}
          className="w-full h-auto max-h-[500px] object-contain mx-auto"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
      {(block.caption || block.explanation) && (
        <figcaption className="text-xs text-muted-foreground text-center font-hindi space-y-0.5">
          {block.caption && <p className="font-semibold text-foreground/90">{block.caption}</p>}
          {block.explanation && <p>{block.explanation}</p>}
        </figcaption>
      )}
    </figure>
  );
}

// ── 15. FAQ ────────────────────────────────────────────────────────────────
function RenderFaq({ block }: { block: FaqBlock }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="my-4 space-y-2">
      {block.title && (
        <h4 className="text-sm font-bold text-foreground font-hindi flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-primary" />
          {block.title}
        </h4>
      )}
      <div className="space-y-1.5">
        {block.items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-3.5 text-left text-xs sm:text-sm font-bold text-foreground font-hindi hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <span>Q: {item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform shrink-0 ml-2",
                    isOpen && "rotate-180"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed border-t border-border/50 bg-muted/10 animate-in fade-in-0 duration-100">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 16. Quick Revision ─────────────────────────────────────────────────────
function RenderQuickRevision({ block }: { block: QuickRevisionBlock }) {
  return (
    <div className="my-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <FileCheck2 className="h-5 w-5 text-primary shrink-0" />
        <h4 className="font-bold text-base text-foreground font-hindi">
          {block.title || "त्वरित पुनरावलोकन (Quick Revision Points)"}
        </h4>
      </div>
      <ul className="space-y-2">
        {block.summaryPoints.map((pt, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-hindi text-foreground/90">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="leading-snug">{pt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── 17. PYQ Connection ─────────────────────────────────────────────────────
function RenderPyqConnection({ block }: { block: PyqConnectionBlock }) {
  return (
    <div className="my-3 rounded-xl border border-border bg-card p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-bold text-primary font-hindi">
          <BookOpen className="h-3.5 w-3.5" />
          PYQ संबंध ({block.examName || "RPSC Exams"})
        </span>
        {block.year && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {block.year}
          </span>
        )}
      </div>
      {block.questionSnippet && (
        <p className="text-xs italic text-muted-foreground font-hindi pl-2 border-l-2 border-primary/40">
          &ldquo;{block.questionSnippet}&rdquo;
        </p>
      )}
      <p className="text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed">
        <span className="font-semibold text-foreground">परीक्षा दृष्टिकोण: </span>
        {block.insight}
      </p>
    </div>
  );
}

// ── 18. Definition ─────────────────────────────────────────────────────────
function RenderDefinition({ block }: { block: DefinitionBlock }) {
  return (
    <div className="my-3 rounded-xl border border-border bg-card/60 p-3.5 space-y-1">
      <div className="flex items-baseline gap-2">
        <h5 className="font-bold text-sm text-foreground font-hindi">{block.term}</h5>
        <span className="text-[11px] text-muted-foreground uppercase font-mono">परिभाषा</span>
      </div>
      <p className="text-xs sm:text-sm text-foreground/90 font-hindi leading-relaxed">
        {block.definition}
      </p>
      {block.details && (
        <p className="text-xs text-muted-foreground font-hindi pt-0.5">
          {block.details}
        </p>
      )}
    </div>
  );
}
