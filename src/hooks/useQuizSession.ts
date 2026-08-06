"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const SAVE_DEBOUNCE_MS = 300;

export function useQuizSession(testSetId: Id<"testSets">) {
  const start = useMutation(api.attempts.start);
  const saveAnswer = useMutation(api.attempts.saveAnswer);
  const submitAttempt = useMutation(api.attempts.submit);
  const toggleBookmarkRemote = useMutation(api.bookmarks.toggle);
  const userBookmarksData = useQuery(api.bookmarks.listByUser);

  const [attemptId, setAttemptId] = useState<Id<"attempts"> | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | string[]>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const isInitializedRef = useRef(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 1. Start or resume attempt
  useEffect(() => {
    let isMounted = true;
    start({ testSetId }).then((id) => {
      if (isMounted) setAttemptId(id);
    });
    return () => {
      isMounted = false;
    };
  }, [testSetId, start]);

  // 2. Fetch attempt & questions from Convex
  const data = useQuery(
    api.attempts.getWithQuestions,
    attemptId ? { attemptId } : "skip"
  );

  // 3. Hydrate saved answers from server when attempt data arrives
  useEffect(() => {
    if (data?.attempt?.answers && !isInitializedRef.current) {
      const initial: Record<string, string | string[]> = {};
      for (const item of data.attempt.answers) {
        if (item.selected !== undefined) {
          initial[item.questionId] = item.selected;
        }
      }
      setLocalAnswers(initial);
      isInitializedRef.current = true;
    }
  }, [data]);

  // 4. Hydrate user bookmarks from Convex
  useEffect(() => {
    if (userBookmarksData) {
      const set = new Set<string>();
      for (const item of userBookmarksData) {
        if (item.question?._id) {
          set.add(item.question._id);
        }
      }
      setBookmarkedIds(set);
    }
  }, [userBookmarksData]);

  // 5. Timer counter for quiz duration
  useEffect(() => {
    if (!attemptId || data?.attempt?.status === "submitted") return;
    if (data?.attempt?.startedAt && elapsedSeconds === 0) {
      const initial = Math.max(0, Math.floor((Date.now() - data.attempt.startedAt) / 1000));
      setElapsedSeconds(initial);
    }
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [attemptId, data?.attempt?.status, data?.attempt?.startedAt]);

  // 6. Select answer handler
  const selectAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      setLocalAnswers((prev) => ({ ...prev, [questionId]: value }));

      if (debounceTimers.current[questionId]) {
        clearTimeout(debounceTimers.current[questionId]);
      }
      debounceTimers.current[questionId] = setTimeout(() => {
        if (!attemptId) return;
        saveAnswer({
          attemptId,
          questionId: questionId as Id<"questions">,
          selected: value,
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [attemptId, saveAnswer]
  );

  // 7. Toggle bookmark handler
  const toggleBookmark = useCallback(
    async (questionId: string) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) next.delete(questionId);
        else next.add(questionId);
        return next;
      });
      await toggleBookmarkRemote({ questionId: questionId as Id<"questions"> });
    },
    [toggleBookmarkRemote]
  );

  // 8. Submit test handler
  const submit = useCallback(async () => {
    if (!attemptId) return null;
    // Flush any active debounce timers immediately
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};

    return await submitAttempt({ attemptId });
  }, [attemptId, submitAttempt]);

  return {
    attemptId,
    questions: data?.questions ?? [],
    attempt: data?.attempt,
    localAnswers,
    selectAnswer,
    bookmarkedIds,
    toggleBookmark,
    elapsedSeconds,
    submit,
    isLoading: !data,
  };
}
