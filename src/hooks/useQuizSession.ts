"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const SAVE_DEBOUNCE_MS = 300;

/**
 * Robust Answer Matcher: Resolves options by id ("opt1".."opt4"), letter ("A".."D"),
 * numeric digit (1..4), or full text, with multi-select array support.
 */
export function checkAnswerMatch(
  correctAnswer: any,
  selected: any,
  options?: any[]
): boolean {
  if (selected === undefined || selected === null || selected === "") return false;
  if (!correctAnswer) return false;

  // Array comparison (e.g. matching or multi-select questions)
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(selected) || selected.length !== correctAnswer.length) return false;
    return correctAnswer.every((c, i) => checkAnswerMatch(c, selected[i], options));
  }

  const selStr = String(selected).trim().toUpperCase();
  const corStr = String(correctAnswer).trim().toUpperCase();

  // Direct match: "A" === "A", "opt1" === "opt1"
  if (selStr === corStr) return true;

  // Determine selected option index (0 for opt1/A/1, 1 for opt2/B/2, etc.)
  let selIdx = -1;
  const optMatch = selStr.match(/^OPT([1-9]\d*)$/);
  if (optMatch) {
    selIdx = parseInt(optMatch[1], 10) - 1;
  } else if (/^[A-D]$/.test(selStr)) {
    selIdx = selStr.charCodeAt(0) - 65;
  } else if (/^[1-4]$/.test(selStr)) {
    selIdx = parseInt(selStr, 10) - 1;
  }

  // Determine correct option index
  let corIdx = -1;
  const corOptMatch = corStr.match(/^OPT([1-9]\d*)$/);
  if (corOptMatch) {
    corIdx = parseInt(corOptMatch[1], 10) - 1;
  } else if (/^[A-D]$/.test(corStr)) {
    corIdx = corStr.charCodeAt(0) - 65;
  } else if (/^[1-4]$/.test(corStr)) {
    corIdx = parseInt(corStr, 10) - 1;
  }

  if (selIdx !== -1 && corIdx !== -1 && selIdx === corIdx) {
    return true;
  }

  // If options array is provided, match by option text
  if (Array.isArray(options) && options.length > 0) {
    if (selIdx !== -1 && selIdx < options.length) {
      const opt = options[selIdx];
      const optText = (typeof opt === "string" ? opt : opt?.text || "").trim().toUpperCase();
      if (optText === corStr) return true;
    }
    if (corIdx !== -1 && corIdx < options.length) {
      const opt = options[corIdx];
      const optText = (typeof opt === "string" ? opt : opt?.text || "").trim().toUpperCase();
      if (optText === selStr) return true;
    }
  }

  return false;
}

export function useQuizSession(testSetId: Id<"testSets">) {
  const start = useMutation(api.attempts.start);
  const pauseAttempt = useMutation(api.attempts.pause);
  const resumeAttempt = useMutation(api.attempts.resume);
  const saveAnswer = useMutation(api.attempts.saveAnswer);
  const submitAttempt = useMutation(api.attempts.submit);
  const toggleBookmarkRemote = useMutation(api.bookmarks.toggle);
  const userBookmarkIds = useQuery(api.bookmarks.listQuestionIdsByUser);

  const storageKey = `quiz_answers_${String(testSetId)}`;

  const [attemptId, setAttemptId] = useState<Id<"attempts"> | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string | string[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return {};
  });
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

  // 2. Fetch attempt & questions from Convex (with static published-sets fallback)
  const data = useQuery(
    api.attempts.getWithQuestions,
    attemptId ? { attemptId } : "skip"
  );

  const [localSetQuestions, setLocalSetQuestions] = useState<any[]>([]);

  useEffect(() => {
    // If Convex questions table doesn't have the questions, fetch from static published sets
    if (data && (!data.questions || data.questions.length === 0)) {
      fetch(`/api/sets/${testSetId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.set?.questions) {
            setLocalSetQuestions(json.set.questions);
          }
        })
        .catch((e) => console.error("Local set fetch error:", e));
    }
  }, [data, testSetId]);

  const resolvedQuestions =
    data?.questions && data.questions.length > 0
      ? data.questions
      : localSetQuestions;

  const attempt = data?.attempt;
  const isPaused = Boolean(attempt?.isPaused);
  const isSubmitted = attempt?.status === "submitted";

  // 3. Hydrate saved answers from server when attempt data arrives & merge with local storage
  useEffect(() => {
    if (attempt?.answers && !isInitializedRef.current) {
      const initial: Record<string, string | string[]> = {};
      for (const item of attempt.answers) {
        if (item.selected !== undefined) {
          initial[item.questionId] = item.selected;
        }
      }
      setLocalAnswers((prev) => {
        const merged = { ...initial, ...prev };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(merged));
          } catch {}
        }
        return merged;
      });
      isInitializedRef.current = true;
    }
  }, [attempt, storageKey]);

  // 4. Hydrate user bookmarks from Convex
  useEffect(() => {
    if (userBookmarkIds) {
      setBookmarkedIds(new Set(userBookmarkIds));
    }
  }, [userBookmarkIds]);

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

  // 7. Select answer handler (instant local persistence + debounced server sync)
  const selectAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      if (attempt?.isPaused) return;

      setLocalAnswers((prev) => {
        const next = { ...prev, [questionId]: value };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {}
        }
        return next;
      });

      if (debounceTimers.current[questionId]) {
        clearTimeout(debounceTimers.current[questionId]);
      }
      debounceTimers.current[questionId] = setTimeout(() => {
        if (!attemptId) return;
        saveAnswer({
          attemptId,
          questionId,
          selected: value,
        });
      }, SAVE_DEBOUNCE_MS);
    },
    [attemptId, attempt?.isPaused, saveAnswer, storageKey]
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
      await toggleBookmarkRemote({ questionId });
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

  // 11. Submit test handler (evaluates answers and cleans up localStorage on success)
  const submit = useCallback(async () => {
    if (!attemptId) return null;
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};

    // Prepare evaluations from resolved questions
    const evaluations = resolvedQuestions.map((q) => {
      const qid = q._id || q.id || q.canonicalId || q.convexId;
      const selected =
        localAnswers[String(q._id)] ??
        localAnswers[String(q.id)] ??
        localAnswers[String(q.canonicalId)] ??
        localAnswers[String(q.convexId)] ??
        localAnswers[String(qid)];

      const isAttempted =
        selected !== undefined &&
        selected !== null &&
        selected !== "" &&
        (!Array.isArray(selected) || selected.length > 0);

      let isCorrect = false;
      if (isAttempted && q.correctAnswer) {
        isCorrect = checkAnswerMatch(q.correctAnswer, selected, q.options);
      }

      return {
        questionId: String(qid),
        selected,
        isCorrect,
      };
    });

    const res = await submitAttempt({ attemptId, evaluations });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
    }
    return res;
  }, [attemptId, resolvedQuestions, localAnswers, submitAttempt, storageKey]);

  return {
    attemptId,
    questions: resolvedQuestions,
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
