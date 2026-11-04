"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionReviewCard, QuestionShellSkeleton } from "@/components/quiz";
import { QuestionReviewFilter, type ReviewFilter } from "@/components/quiz/QuestionReviewFilter";
import { PrintableAssessmentReport } from "@/components/quiz/pdf/PrintableAssessmentReport";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  LayoutList,
  RotateCcw,
  FileDown,
  Share2,
} from "lucide-react";

/**
 * Automatically derives a clean, filesystem-safe filename for PDF printing
 * so the browser's "Save Print Output As" dialog automatically pre-fills the name.
 */
export function getSuggestedPdfFileName({
  setName,
  setOrder,
  topicName,
  topicSlug,
  filter,
}: {
  setName?: string;
  setOrder?: number;
  topicName?: string;
  topicSlug?: string;
  filter?: ReviewFilter;
}): string {
  const numberMatch =
    setName?.match(/(?:भाग|part|set|test|quiz|\#)\s*(\d+)/i) ||
    setName?.match(/\b(\d+)\b/);
  const num = numberMatch ? numberMatch[1] : (setOrder !== undefined && setOrder > 0 ? String(setOrder) : "");

  let baseName = "";

  const isTense =
    topicSlug?.toLowerCase().includes("tense") ||
    topicName?.toLowerCase().includes("tense") ||
    setName?.toLowerCase().includes("tense");

  if (isTense && num) {
    baseName = `tense-${num}`;
  } else if (setName) {
    baseName = setName;
  } else if (topicName && num) {
    baseName = `${topicName} - Part ${num}`;
  } else if (topicName) {
    baseName = topicName;
  } else {
    baseName = "Quizzer-Assessment-Report";
  }

  // Sanitize Windows illegal file characters: \ / : * ? " < > |
  baseName = baseName.replace(/[<>:"/\\|?*]/g, "-").replace(/\s+/g, " ").trim();

  if (filter === "incorrect") {
    baseName += " - Mistakes";
  } else if (filter === "correct") {
    baseName += " - Correct";
  } else if (filter === "unattempted") {
    baseName += " - Unattempted";
  }

  return baseName;
}

class PdfReportErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("Printable assessment report render error:", error);
  }
  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export default function ResultsPage() {
  const params = useParams<{ testSetId: string }>();
  const rawId = Array.isArray(params?.testSetId) ? params.testSetId[0] : params?.testSetId;
  const id = (rawId || "") as Id<"testSets">;

  // ── Local state — declared first so localSetMeta can inform queries ──
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [localSetQuestions, setLocalSetQuestions] = useState<any[]>([]);
  const [localSetMeta, setLocalSetMeta] = useState<any>(null);
  const { showToast } = useToast();

  // ── Data queries — guarded with "skip" when id is not yet available ──
  const data = useQuery(
    api.attempts.latestSubmittedForTestSet,
    id ? { testSetId: id } : "skip"
  );
  const toggleBookmark = useMutation(api.bookmarks.toggle);
  const currentSet = useQuery(api.testSets.get, id ? { id } : "skip");

  const effectiveSet = currentSet || localSetMeta;
  const topicId = currentSet?.topicId || localSetMeta?.topicId;

  const topic = useQuery(
    api.topics.get,
    topicId ? { id: topicId } : "skip"
  );
  const subject = useQuery(
    api.subjects.get,
    topic?.subjectId ? { id: topic.subjectId } : "skip"
  );

  const siblingSets = useQuery(
    api.testSets.listByTopic,
    topicId ? { topicId } : "skip"
  );

  useEffect(() => {
    if ((!currentSet || !data?.questions || data.questions.length === 0) && id) {
      fetch(`/api/sets/${id}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.set) {
            if (json.set.questions) setLocalSetQuestions(json.set.questions);
            setLocalSetMeta(json.set);
          }
        })
        .catch((e) => console.error("Local set fetch error:", e));
    }
  }, [currentSet, data, id]);

  const resolvedQuestions =
    data?.questions && data.questions.length > 0
      ? data.questions
      : localSetQuestions;

  // Next-set logic: find the next set by order within the same topic
  const nextSet = useMemo(() => {
    if (!siblingSets || !effectiveSet) return null;
    const currentIndex = siblingSets.findIndex((s) => s._id === id || (s as any).id === id);
    if (currentIndex === -1 || currentIndex === siblingSets.length - 1) return null;
    return siblingSets[currentIndex + 1];
  }, [siblingSets, effectiveSet, id]);

  // Derived: filtered questions with their original indices and multi-alias resolution
  const filteredQuestionsWithIndex = useMemo(() => {
    if (!data?.attempt) return [];
    const { attempt } = data;
    const answers = attempt.answers || [];
    return (resolvedQuestions || [])
      .map((q, i) => {
        if (!q) return null;
        const candidates = [
          q._id,
          q.convexId,
          q.canonicalId,
          q.id,
          q.sourceQuestionId,
          q.meta?.sourceQuestionId,
          `q_${i}`,
          `q_${i + 1}`,
        ]
          .filter(Boolean)
          .map(String);

        const answer =
          answers.find(
            (a: any) =>
              a &&
              (candidates.includes(String(a.questionId)) ||
                (a.orderIndex !== undefined && a.orderIndex === i))
          ) || answers[i];

        const isAttempted =
          answer &&
          answer.selected !== undefined &&
          answer.selected !== null &&
          answer.selected !== "" &&
          (!Array.isArray(answer.selected) || answer.selected.length > 0);

        const badge = !isAttempted
          ? "unanswered"
          : answer.isCorrect
          ? "correct"
          : "incorrect";

        return {
          question: q,
          answer: isAttempted ? answer : undefined,
          badge,
          originalIndex: i,
          questionId: candidates[0] || `q_${i}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(({ badge }) => {
        if (reviewFilter === "correct") return badge === "correct";
        if (reviewFilter === "incorrect") return badge === "incorrect";
        if (reviewFilter === "unattempted") return badge === "unanswered";
        return true; // "all"
      });
  }, [data, resolvedQuestions, reviewFilter]);

  // Formatted evaluated questions for the publication-grade PDF report
  const evaluatedQuestions = useMemo(() => {
    return filteredQuestionsWithIndex.map(({ question, answer, badge, originalIndex }) => ({
      question: question || {
        type: "mcq",
        questionText: "Question details unavailable",
        options: [],
        correctAnswer: "",
      },
      answer,
      status: (badge || "unanswered") as "correct" | "incorrect" | "unanswered",
      originalIndex,
    }));
  }, [filteredQuestionsWithIndex]);

  // Derived suggested file name for print / Save As PDF
  const suggestedFileName = useMemo(() => {
    return getSuggestedPdfFileName({
      setName: effectiveSet?.name,
      setOrder: effectiveSet?.order,
      topicName: topic?.name,
      topicSlug: topic?.slug,
      filter: reviewFilter,
    });
  }, [effectiveSet, topic, reviewFilter]);

  // Keep document.title synchronized so the browser automatically populates
  // the exact test name in Windows "Save Print Output As" / "Save As PDF"
  useEffect(() => {
    if (suggestedFileName) {
      document.title = suggestedFileName;
    }
  }, [suggestedFileName]);

  // ── Loading state ──
  if (data === undefined || (currentSet === undefined && !localSetMeta)) {
    return (
      <div className="w-full space-y-4 pt-1">
        <div className="h-48 rounded-2xl border border-border bg-card/60 p-6 animate-pulse" />
        <QuestionShellSkeleton />
      </div>
    );
  }

  // ── Test Set Not Found & No Results ──
  if (effectiveSet === null && data === null) {
    return (
      <Card className="p-8 border border-border rounded-2xl text-center bg-card max-w-md mx-auto my-12 shadow-sm">
        <p className="text-base font-bold text-foreground mb-2">Test Set Not Found</p>
        <p className="text-xs text-muted-foreground mb-6">
          This test set does not exist or may have been updated.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/subjects">Browse All Subjects</Link>
          </Button>
        </div>
      </Card>
    );
  }

  // ── Empty / Unattempted state ──
  if (!data || !data.attempt) {
    return (
      <Card className="p-8 border border-border rounded-2xl text-center bg-card max-w-md mx-auto my-12 shadow-sm">
        <p className="text-base font-bold text-foreground mb-2">No Test Results Found</p>
        <p className="text-xs text-muted-foreground mb-6">
          You haven&apos;t completed this test set yet, or your attempt is still in progress.
        </p>
        <div className="flex justify-center gap-3">
          {effectiveSet ? (
            <Button asChild className="rounded-xl">
              <Link href={`/quiz/${id}`}>Start Test Now</Link>
            </Button>
          ) : null}
          <Button asChild variant={effectiveSet ? "outline" : "default"} className="rounded-xl">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Card>
    );
  }

  const { attempt } = data;
  const questionsList = resolvedQuestions || [];
  const answersList = (attempt.answers || []).filter(Boolean);
  const correctCount = answersList.filter((a: any) => Boolean(a?.isCorrect)).length;
  const incorrectCount = answersList.filter(
    (a: any) =>
      !a?.isCorrect &&
      a?.selected !== undefined &&
      a?.selected !== null &&
      a?.selected !== "" &&
      (!Array.isArray(a?.selected) || a?.selected.length > 0)
  ).length;
  const totalQCount = attempt.totalQuestions ?? (questionsList.length || 20);
  const unansweredCount = Math.max(0, totalQCount - (correctCount + incorrectCount));

  const filterCounts = useMemo(() => {
    return {
      all: questionsList.length,
      correct: correctCount,
      incorrect: incorrectCount,
      unattempted: unansweredCount,
    };
  }, [questionsList.length, correctCount, incorrectCount, unansweredCount]);

  function handleToggleBookmark(questionId: string) {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
    toggleBookmark({ questionId });
  }

  const handleShareResult = async () => {
    const title = effectiveSet?.name || "Quizzer Test Result";
    const totalMarks = (attempt.totalQuestions || 20) * 2;
    const userScore = formatScore(attempt.score ?? 0);
    const shareText = `मैंने QuizzER 2 पर "${title}" में ${userScore}/${totalMarks} अंक प्राप्त किए! (${correctCount} सही, ${incorrectCount} गलत)।`;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        showToast("Result summary copied to clipboard!", "success");
        return;
      } catch {}
    }

    showToast("Sharing not supported on this browser.", "info");
  };

  const handlePrint = async (filter?: ReviewFilter) => {
    try {
      const activeFilter = filter ?? reviewFilter;

      const printFileName = getSuggestedPdfFileName({
        setName: effectiveSet?.name,
        setOrder: effectiveSet?.order,
        topicName: topic?.name,
        topicSlug: topic?.slug,
        filter: activeFilter,
      });

      if (typeof document !== "undefined") {
        document.title = printFileName;
        if (document.fonts) {
          try {
            await document.fonts.ready;
          } catch {}
        }
      }

      await new Promise<void>((resolve) => {
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        } else {
          setTimeout(resolve, 60);
        }
      });

      if (typeof window !== "undefined" && typeof window.print === "function") {
        window.print();
      }
    } catch (err) {
      console.error("Print execution error:", err);
      try {
        if (typeof window !== "undefined" && typeof window.print === "function") {
          window.print();
        }
      } catch (innerErr) {
        console.error("Direct fallback print failed:", innerErr);
      }
    }
  };

  return (
    <>
      {/* ── Screen UI View (Hidden completely during Print) ── */}
      <div id="screen-results-view" className="space-y-6 pb-12 print:hidden">
        {/* Back to dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        {/* ── Score Summary Card ── */}
        <Card className="p-5 sm:p-6 border border-border shadow-xs rounded-2xl text-center bg-card">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 font-hindi">
            {effectiveSet?.name || "Test Result"}
          </p>

          {/* Score */}
          <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground tabular-nums mb-3">
            {formatScore(attempt.score ?? 0)}
            <span className="text-lg sm:text-xl text-muted-foreground font-semibold">
              {" "}/ {(attempt.totalQuestions || 20) * 2} pts
            </span>
          </p>

          {/* Stats: correct / incorrect / unanswered */}
          <div className="flex items-center justify-center gap-4 mb-2 text-xs flex-wrap">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {correctCount} Correct (+{correctCount * 2})
            </span>
            <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {incorrectCount} Incorrect (-{((incorrectCount * 2) / 3).toFixed(2)})
            </span>
            {unansweredCount > 0 && (
              <span className="flex items-center gap-1 font-semibold text-muted-foreground">
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                {unansweredCount} Skipped (0)
              </span>
            )}
          </div>

          {/* Canonical Scoring Rule Note */}
          <p className="text-[11px] text-muted-foreground mb-6">
            Standard RPSC Scoring: +2 marks per correct answer · 1/3 negative marking (-0.67 per incorrect)
          </p>

          {/* ── EXACTLY FOUR ACTION BUTTONS: Retake (Left) | PDF | Share Result | Next Set (Right) ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* 1. Left side: Retake Test */}
            <Button
              asChild
              variant="outline"
              className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs"
            >
              <Link href={`/quiz/${id}`}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Retake Test
              </Link>
            </Button>

            {/* 2 & 3. Middle: PDF & Share Result */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePrint(reviewFilter)}
                className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs text-foreground"
                title={`Export ${reviewFilter === "incorrect" ? "Mistakes" : reviewFilter === "correct" ? "Correct" : reviewFilter === "unattempted" ? "Unattempted" : "All"} as PDF`}
              >
                <FileDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                <span>PDF</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleShareResult}
                className="font-semibold text-xs h-10 px-4 rounded-xl border-border gap-1.5 cursor-pointer hover:bg-muted/80 shadow-2xs text-foreground"
                title="Share test result"
              >
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Share Result</span>
              </Button>
            </div>

            {/* 4. Right side: Next Set */}
            {nextSet ? (
              <Button
                asChild
                className="font-bold text-xs h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
              >
                <Link href={`/quiz/${nextSet._id || (nextSet as any).id}`}>
                  Next Set
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="font-bold text-xs h-10 px-5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 cursor-pointer shadow-xs"
              >
                <Link href="/subjects">
                  <LayoutList className="h-3.5 w-3.5" aria-hidden="true" />
                  Next Set
                </Link>
              </Button>
            )}
          </div>
        </Card>

        {/* ── Question Review Section Header with 4-Option Filter Capsule ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground font-hindi">
              {reviewFilter === "incorrect"
                ? "Mistake Revision Sheet"
                : reviewFilter === "correct"
                ? "Correct Answers Review"
                : reviewFilter === "unattempted"
                ? "Unattempted Questions"
                : "Question Review"}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full tabular-nums">
              {filteredQuestionsWithIndex.length} of {questionsList.length} Questions
            </span>
          </div>

          {/* Authoritative 4-Option Filter Control: All | Correct | Incorrect | Unattempted */}
          <QuestionReviewFilter
            value={reviewFilter}
            onChange={setReviewFilter}
            counts={filterCounts}
          />
        </div>

        {/* ── Question List (Screen interactive view) ── */}
        <div className="space-y-4">
          {filteredQuestionsWithIndex.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 font-hindi">
              {reviewFilter === "incorrect"
                ? "शाबाश! आपने इस टेस्ट में कोई गलत उत्तर नहीं दिया।"
                : reviewFilter === "correct"
                ? "इस टेस्ट में कोई सही उत्तर नहीं है।"
                : reviewFilter === "unattempted"
                ? "शाबाश! आपने सभी प्रश्नों के उत्तर दिए हैं।"
                : "कोई प्रश्न उपलब्ध नहीं है।"}
            </p>
          ) : (
            filteredQuestionsWithIndex.map(({ question: q, answer, badge, originalIndex, questionId }) => {
              const safeId = questionId || q?._id || `q_${originalIndex}`;
              return (
                <QuestionReviewCard
                  key={safeId}
                  number={originalIndex + 1}
                  question={q}
                  selectedAnswer={answer?.selected}
                  isBookmarked={bookmarked.has(safeId)}
                  onToggleBookmark={() => handleToggleBookmark(safeId)}
                  reviewBadge={badge as "correct" | "incorrect" | "unanswered"}
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Official A4 Two-Column Assessment Report (Pure Light Mode Print ONLY) ── */}
      <PdfReportErrorBoundary>
        <PrintableAssessmentReport
          testSetName={effectiveSet?.name || "Assessment Report"}
          subjectName={subject?.name}
          topicName={topic?.name}
          score={attempt.score ?? 0}
          totalQuestions={attempt.totalQuestions || 20}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          unansweredCount={unansweredCount}
          submittedAt={attempt.submittedAt}
          filterLabel={
            reviewFilter === "incorrect"
              ? "Mistake Revision Sheet (Incorrect Only)"
              : reviewFilter === "correct"
              ? "Correct Answers Only"
              : reviewFilter === "unattempted"
              ? "Unattempted Questions"
              : "Complete Question Review"
          }
          questions={evaluatedQuestions}
          theme="light"
        />
      </PdfReportErrorBoundary>
    </>
  );
}
