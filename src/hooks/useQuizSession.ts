"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const SAVE_DEBOUNCE_MS = 300;

export function useQuizSession(testSetId: Id<"testSets">) {
  const start = useMutation(api.attempts.start);
  const pauseAttempt = useMutation(api.attempts.pause);
  const resumeAttempt = useMutation(api.attempts.resume);
  const saveAnswer = useMutation(api.attempts.saveAnswer);
  const submitAttempt = useMutation(api.attempts.submit);
  const toggleBookmarkRemote = useMutation(api.bookmarks.toggle);
  const userBookmarksData = useQuery(api.bookmarks.listByUser);

  const [attemptId, setAttemptId] = useState<Id<"attempts"> | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | string[]>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Fixed duration pausable timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(900);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(900);

  const isInitializedRef = useRef(false);
  const hasAutoSubmittedRef = useRef(false);
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

  const attempt = data?.attempt;
  const isPaused = Boolean(attempt?.isPaused);
  const isSubmitted = attempt?.status === "submitted";

  // 3. Hydrate saved answers from server when attempt data arrives
  useEffect(() => {
    if (attempt?.answers && !isInitializedRef.current) {
      const initial: Record<string, string | string[]> = {};
      for (const item of attempt.answers) {
        if (item.selected !== undefined) {
          initial[item.questionId] = item.selected;
        }
      }
      setLocalAnswers(initial);
      isInitializedRef.current = true;
    }
  }, [attempt]);

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

  // 5. Total Duration Resolution
  useEffect(() => {
    if (attempt?.totalDurationSeconds) {
      setTotalDurationSeconds(attempt.totalDurationSeconds);
    } else if (data?.questions && data.questions.length > 0) {
      const fallbackDuration = Math.max(10, data.questions.length) * 60;
      setTotalDurationSeconds(fallbackDuration);
    }
  }, [attempt?.totalDurationSeconds, data?.questions]);

  // 6. Robust Pausable Timer Engine
  useEffect(() => {
    if (!attempt || isSubmitted) return;

    const duration = attempt.totalDurationSeconds || totalDurationSeconds;

    // Helper to calculate exact active elapsed from Convex timestamps
    function computeCurrentTimes() {
      if (!attempt) return { elapsed: 0, remaining: duration };

      let currentElapsed = attempt.elapsedSeconds ?? 0;
      if (!attempt.isPaused && attempt.lastResumedAt) {
        const activeSegment = Math.max(
          0,
          Math.floor((Date.now() - attempt.lastResumedAt) / 1000)
        );
        currentElapsed += activeSegment;
      }
      const clampedElapsed = Math.min(duration, currentElapsed);
      const remaining = Math.max(0, duration - clampedElapsed);
      return { elapsed: clampedElapsed, remaining };
    }

    // Set initial sync
    const initial = computeCurrentTimes();
    setElapsedSeconds(initial.elapsed);
    setRemainingSeconds(initial.remaining);

    // If paused, don't run ticker
    if (attempt.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const times = computeCurrentTimes();
      setElapsedSeconds(times.elapsed);
      setRemainingSeconds(times.remaining);

      // Auto-submit when time reaches zero
      if (times.remaining <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        clearInterval(interval);
        if (attemptId) {
          submitAttempt({ attemptId }).catch(console.error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    attempt,
    attemptId,
    isSubmitted,
    totalDurationSeconds,
    attempt?.isPaused,
    attempt?.elapsedSeconds,
    attempt?.lastResumedAt,
    submitAttempt,
  ]);

  // 7. Select answer handler
  const selectAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      // Disallow answering while paused
      if (attempt?.isPaused) return;

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
    [attemptId, attempt?.isPaused, saveAnswer]
  );

  // 8. Toggle bookmark handler
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

  // 9. Pause handler
  const pause = useCallback(async () => {
    if (!attemptId || isPaused || isSubmitted) return;
    await pauseAttempt({ attemptId });
  }, [attemptId, isPaused, isSubmitted, pauseAttempt]);

  // 10. Resume handler
  const resume = useCallback(async () => {
    if (!attemptId || !isPaused || isSubmitted) return;
    await resumeAttempt({ attemptId });
  }, [attemptId, isPaused, isSubmitted, resumeAttempt]);

  // 11. Submit test handler
  const submit = useCallback(async () => {
    if (!attemptId) return null;
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};

    return await submitAttempt({ attemptId });
  }, [attemptId, submitAttempt]);

  return {
    attemptId,
    questions: data?.questions ?? [],
    attempt,
    localAnswers,
    selectAnswer,
    bookmarkedIds,
    toggleBookmark,
    elapsedSeconds,
    remainingSeconds,
    totalDurationSeconds,
    isPaused,
    pause,
    resume,
    submit,
    isLoading: !data,
  };
}
