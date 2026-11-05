"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { QuestionShellSkeleton } from "@/components/quiz";
import { QuestionReviewFilter, type ReviewFilter } from "@/components/quiz/QuestionReviewFilter";
import { PrintableAssessmentReport } from "@/components/quiz/pdf/PrintableAssessmentReport";
import {
  ScoreSummaryCard,
  ReviewQuestionList,
  PdfReportErrorBoundary,
  getSuggestedPdfFileName,
} from "@/components/quiz/results";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatScore } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft } from "lucide-react";

export { getSuggestedPdfFileName };

export default function ResultsPage() {
  const params = useParams<{ testSetId: string }>();
  const rawId = Array.isArray(params?.testSetId) ? params.testSetId[0] : params?.testSetId;
  const id = (rawId || "") as Id<"testSets">;

  // ── Local state — declared first so localSetMeta can inform queries ──
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [localSetQuestions, setLocalSetQuestions] = useState<any[]>([]);
  const [localSetMeta, setLocalSetMeta] = useState<any>(null);
  const [isLoadingLocalQuestions, setIsLoadingLocalQuestions] = useState<boolean>(true);
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
    let isMounted = true;
    if (id) {
      setIsLoadingLocalQuestions(true);
      fetch(`/api/sets/${id}`)
        .then((res) => res.json())
        .then((json) => {
          if (!isMounted) return;
          if (json.success && json.set) {
            if (json.set.questions) setLocalSetQuestions(json.set.questions);
            setLocalSetMeta(json.set);
          }
        })
        .catch((e) => console.error("Local set fetch error:", e))
        .finally(() => {
          if (isMounted) setIsLoadingLocalQuestions(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

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
          q.canonicalId,
          q._id,
          q.convexId,
          q.id,
          q.sourceQuestionId,
          q.meta?.sourceQuestionId,
          `q_idx_${i}`,
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
          questionId: candidates[0] || `q_idx_${i}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(({ badge }) => {
        if (reviewFilter === "correct") return badge === "correct";
        if (reviewFilter === "incorrect") return badge === "incorrect";
        if (reviewFilter === "unattempted") return badge === "unanswered";
        return true;
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

  // ── Global unconditioned calculations & hooks (Strictly BEFORE any early returns) ──
  const attempt = data?.attempt;
  const questionsList = resolvedQuestions || [];
  const answersList = useMemo(() => (attempt?.answers || []).filter(Boolean), [attempt?.answers]);
  const correctCount = useMemo(
    () => answersList.filter((a: any) => Boolean(a?.isCorrect)).length,
    [answersList]
  );
  const incorrectCount = useMemo(
    () =>
      answersList.filter(
        (a: any) =>
          !a?.isCorrect &&
          a?.selected !== undefined &&
          a?.selected !== null &&
          a?.selected !== "" &&
          (!Array.isArray(a?.selected) || a?.selected.length > 0)
      ).length,
    [answersList]
  );
  const totalQCount = attempt?.totalQuestions ?? (questionsList.length || 20);
  const unansweredCount = Math.max(0, totalQCount - (correctCount + incorrectCount));

  const filterCounts = useMemo(() => {
    return {
      all: questionsList.length,
      correct: correctCount,
      incorrect: incorrectCount,
      unattempted: unansweredCount,
    };
  }, [questionsList.length, correctCount, incorrectCount, unansweredCount]);

  // ── Loading state ──
  if (
    data === undefined ||
    (currentSet === undefined && !localSetMeta) ||
    ((!data?.questions || data.questions.length === 0) && localSetQuestions.length === 0 && isLoadingLocalQuestions)
  ) {
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
        <ScoreSummaryCard
          setName={effectiveSet?.name}
          score={attempt.score ?? 0}
          totalQuestions={attempt.totalQuestions || 20}
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          unansweredCount={unansweredCount}
          testSetId={id}
          nextSet={nextSet}
          activeFilter={reviewFilter}
          onPrint={() => handlePrint(reviewFilter)}
          onShare={handleShareResult}
        />

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

          <QuestionReviewFilter
            value={reviewFilter}
            onChange={setReviewFilter}
            counts={filterCounts}
          />
        </div>

        {/* ── Question List (Screen interactive view) ── */}
        <ReviewQuestionList
          filteredQuestionsWithIndex={filteredQuestionsWithIndex}
          reviewFilter={reviewFilter}
          bookmarked={bookmarked}
          onToggleBookmark={handleToggleBookmark}
        />
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
