/**
 * PYQ Retrieval Engine — Syllabus-Locked Multi-Signal Ranked Retrieval
 *
 * Designed for Quizzer2:
 * 1. Uses the complete 26,151-question master corpus from `rajasthan_pyq_merged_26151.json`.
 * 2. Enforces a HARD CANONICAL SYLLABUS BOUNDARY via `syllabusTopicMap.ts`.
 *    Zero cross-subject leakage (Rajasthan geography never matches World/India geography).
 * 3. High-Quality Multi-Signal Ranking:
 *    - Frequently repeated PYQs across actual exams are prioritized.
 *    - Reliable, prestigious, and recent exams (e.g. RAS, RSMSSB, 2020-2026) get high weights.
 *    - Comprehensive explanations and 4 substantive options are prioritized.
 *    - Consolidates near-identical repetitions without losing their exam significance.
 * 4. Batch Processing System:
 *    - Supports `usedQuestionIds` tracking to cycle through 50, 100, 200, 500+ questions
 *      without returning the same batch repeatedly.
 *    - Default batch size: 100 questions.
 */

import path from "path";
import fs from "fs";
import { resolveCanonicalTopic } from "./syllabusTopicMap";
import {
  RawCorpusQuestion,
  PyqQuestion,
  PyqRetrievalQuery,
  PyqRetrievalOptions,
  PyqRetrievalResult,
  cleanCorpusExplanation,
} from "./pyqTypes";

export * from "./pyqTypes";


// ─── Devanagari & String Normalization ───────────────────────────────────────

export function cleanStem(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
    .trim();
}

export function normalizeDevanagari(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u093C/g, "") // strip nukta
    .replace(/ँ/g, "ं")
    .replace(/ण्ड/g, "ंड")
    .replace(/न्द/g, "ंद")
    .replace(/म्ब/g, "ंब")
    .replace(/ङ्ग/g, "ंग")
    .replace(/ञ्/g, "ं")
    .replace(/त्यौहार/g, "त्योहार")
    .replace(/आन्दोलन/g, "आंदोलन")
    .replace(/प्रजामण्डल/g, "प्रजामंडल")
    .replace(/सम्प्रदाय/g, "संप्रदाय")
    .replace(/मण्‍डल|मण्डल/g, "मंडल")
    .replace(/[।,?!;:""''()\[\]{}|\/\\_~`@#$%^&*+=<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripOptionPrefix(option: string): string {
  if (!option) return "";
  return option
    .replace(/^[\s(\[]*(?:[अबसदa-dA-D1-5]|[ivxIVX]+)[\s)\]:.-]+/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function isFakeExam(str?: string | null): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return (
    !lower ||
    lower === "unknown" ||
    lower === "unknown exam" ||
    lower === "practice" ||
    lower === "practice exam" ||
    lower === "mock" ||
    lower === "mock exam" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "[object object]" ||
    lower === "none" ||
    lower === "n/a"
  );
}

export function resolveAnswerIndex(answerText: string, options: string[]): number {
  const normAnswer = normalizeDevanagari(answerText);
  const cleanAns = cleanStem(answerText);

  // Pass 1: exact match against stripped options
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeDevanagari(stripOptionPrefix(options[i]));
    if (stripped === normAnswer) return i;
  }

  // Pass 2: clean stem match
  for (let i = 0; i < options.length; i++) {
    const optStem = cleanStem(stripOptionPrefix(options[i]));
    if (optStem && cleanAns && (optStem === cleanAns || optStem.includes(cleanAns) || cleanAns.includes(optStem))) {
      return i;
    }
  }

  // Pass 3: substring containment
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeDevanagari(stripOptionPrefix(options[i]));
    if (stripped && normAnswer && (stripped.includes(normAnswer) || normAnswer.includes(stripped))) {
      return i;
    }
  }

  return 0;
}

// ─── In-Memory Corpus Indexing ───────────────────────────────────────────────

let _corpus: RawCorpusQuestion[] | null = null;
let _topicToIndices: Map<string, number[]> | null = null;
let _factToIndices: Map<string, number[]> | null = null;

function loadCorpus(): {
  corpus: RawCorpusQuestion[];
  topicToIndices: Map<string, number[]>;
  factToIndices: Map<string, number[]>;
} {
  if (_corpus && _topicToIndices && _factToIndices) {
    return { corpus: _corpus, topicToIndices: _topicToIndices, factToIndices: _factToIndices };
  }

  // Resolve 26k corpus path
  let data: RawCorpusQuestion[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    data = require("@/xdata/rajasthan_pyq_merged_26151.json") as RawCorpusQuestion[];
  } catch {
    const fallbackPath = path.resolve(process.cwd(), "src/xdata/rajasthan_pyq_merged_26151.json");
    if (fs.existsSync(fallbackPath)) {
      data = JSON.parse(fs.readFileSync(fallbackPath, "utf8")) as RawCorpusQuestion[];
    } else {
      throw new Error(`Master question corpus not found at ${fallbackPath}`);
    }
  }

  _corpus = data;
  _topicToIndices = new Map<string, number[]>();
  _factToIndices = new Map<string, number[]>();

  for (let idx = 0; idx < data.length; idx++) {
    const q = data[idx];

    // Topic indexing
    const rawTopic = (q.topic || "UNKNOWN").trim();
    const normTopic = normalizeDevanagari(rawTopic);
    if (!_topicToIndices.has(normTopic)) {
      _topicToIndices.set(normTopic, []);
    }
    _topicToIndices.get(normTopic)!.push(idx);

    // Also keep raw topic key
    if (rawTopic !== normTopic) {
      if (!_topicToIndices.has(rawTopic)) {
        _topicToIndices.set(rawTopic, []);
      }
      _topicToIndices.get(rawTopic)!.push(idx);
    }

    // Fact repetition indexing: (stem + answer)
    const factKey = cleanStem(q.question) + "___" + cleanStem(q.answer);
    if (factKey !== "___") {
      if (!_factToIndices.has(factKey)) {
        _factToIndices.set(factKey, []);
      }
      _factToIndices.get(factKey)!.push(idx);
    }
  }

  return { corpus: _corpus, topicToIndices: _topicToIndices, factToIndices: _factToIndices };
}

// ─── Quality Ranking Score Calculator ────────────────────────────────────────

function calculateQualityScore(
  q: RawCorpusQuestion,
  repetitionCount: number,
  distinctExamsCount: number
): number {
  let score = 50; // base score

  // 1. Repetition boost (frequently tested exam facts)
  if (repetitionCount > 1) {
    score += Math.min(60, (repetitionCount - 1) * 15 + distinctExamsCount * 15);
  }

  // 2. Exam Reliability & Recency
  if (q.exam && !isFakeExam(q.exam)) {
    score += 40; // real exam presence

    const examUpper = q.exam.toUpperCase();

    // Prestigious / major Rajasthan exam bonus
    if (
      examUpper.includes("RAS") ||
      examUpper.includes("RPSC") ||
      examUpper.includes("RSMSSB") ||
      examUpper.includes("LECTURER") ||
      examUpper.includes("TEACHER") ||
      examUpper.includes("PATWAR") ||
      examUpper.includes("SI") ||
      examUpper.includes("SUB INSPECTOR") ||
      examUpper.includes("CET") ||
      examUpper.includes("FORESTER") ||
      examUpper.includes("CONSTABLE")
    ) {
      score += 25;
    }

    // Recency weighting from year
    const yearMatch = q.exam.match(/\b(20[12]\d)\b/);
    if (yearMatch && yearMatch[1]) {
      const year = parseInt(yearMatch[1], 10);
      if (year >= 2024) score += 30;
      else if (year >= 2020) score += 20;
      else if (year >= 2016) score += 10;
      else score += 5;
    }
  }

  // 3. Explanation quality
  if (q.explanation && q.explanation.trim().length > 30) {
    score += 20;
  }

  // 4. Options completeness
  if (Array.isArray(q.options) && q.options.length === 4) {
    score += 15;
  }

  return score;
}

// ─── Main Retrieval Function ─────────────────────────────────────────────────

export function getRelevantPyqQuestions(
  query: string | PyqRetrievalQuery,
  options: PyqRetrievalOptions = {}
): PyqRetrievalResult {
  const { maxResults = 100, usedQuestionIds, minScore = 0, allUnused = false } = options;

  const topicQuery = typeof query === "string" ? query : query.topic;
  const subjectQuery = typeof query === "object" ? query.subject : undefined;

  if (!topicQuery || !topicQuery.trim()) {
    return {
      questions: [],
      totalFound: 0,
      usedCount: 0,
      unusedPoolCount: 0,
      remainingCount: 0,
      sent: 0,
      batchNumber: 1,
      duplicatesRemoved: 0,
    };
  }

  const { corpus, topicToIndices, factToIndices } = loadCorpus();

  // Convert usedQuestionIds to Set
  const usedSet = new Set<number>();
  if (usedQuestionIds) {
    if (usedQuestionIds instanceof Set) {
      usedQuestionIds.forEach((id) => usedSet.add(id));
    } else if (Array.isArray(usedQuestionIds)) {
      usedQuestionIds.forEach((id) => usedSet.add(id));
    }
  }

  // 1. Resolve Canonical Topic Mapping
  const canonicalDef = resolveCanonicalTopic(subjectQuery || "", topicQuery);
  const candidateIndices = new Set<number>();
  let authorizedCorpusTopics: string[] = [];

  if (canonicalDef) {
    authorizedCorpusTopics = canonicalDef.corpusTopics;
    for (const ct of authorizedCorpusTopics) {
      const normCt = normalizeDevanagari(ct);
      const indices = topicToIndices.get(normCt) || topicToIndices.get(ct) || [];
      indices.forEach((idx) => candidateIndices.add(idx));
    }
  } else {
    // Strict fallback: only exact or normalized match against corpus topics
    // Never search across unrelated topics
    const normQ = normalizeDevanagari(topicQuery);
    const indices = topicToIndices.get(normQ) || topicToIndices.get(topicQuery) || [];
    indices.forEach((idx) => candidateIndices.add(idx));
    authorizedCorpusTopics = [topicQuery];
  }

  if (candidateIndices.size === 0) {
    return {
      questions: [],
      totalFound: 0,
      usedCount: 0,
      remainingCount: 0,
      unusedPoolCount: 0,
      sent: 0,
      batchNumber: 1,
      duplicatesRemoved: 0,
      canonicalTopic: canonicalDef
        ? {
            subject: canonicalDef.subjectNameHindi || canonicalDef.subjectName,
            topic: canonicalDef.topicNameHindi || canonicalDef.topicName,
            matchedCorpusTopics: authorizedCorpusTopics,
          }
        : undefined,
    };
  }

  const totalFound = candidateIndices.size;
  let usedCountForTopic = 0;

  // 2. Score and Filter candidates
  interface ScoredCandidate {
    raw: RawCorpusQuestion;
    score: number;
    factKey: string;
    repeatCount: number;
    distinctExams: string[];
    isUsed: boolean;
  }

  const scoredPool: ScoredCandidate[] = [];

  for (const idx of candidateIndices) {
    const raw = corpus[idx];
    const isUsed = usedSet.has(raw.id);
    if (isUsed) {
      usedCountForTopic++;
    }

    const factKey = cleanStem(raw.question) + "___" + cleanStem(raw.answer);
    const repIndices = factToIndices.get(factKey) || [idx];
    const repeatCount = repIndices.length;

    const distinctExamsSet = new Set<string>();
    for (const rIdx of repIndices) {
      const ex = corpus[rIdx].exam;
      if (ex && !isFakeExam(ex)) distinctExamsSet.add(ex.trim());
    }
    const distinctExams = Array.from(distinctExamsSet);

    const score = calculateQualityScore(raw, repeatCount, distinctExams.length);

    if (score >= minScore) {
      scoredPool.push({
        raw,
        score,
        factKey,
        repeatCount,
        distinctExams,
        isUsed,
      });
    }
  }

  // 3. Sort: Unused first, then score descending, then id ascending
  scoredPool.sort((a, b) => {
    if (a.isUsed !== b.isUsed) return a.isUsed ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    return a.raw.id - b.raw.id;
  });

  // 4. Selection of unused questions
  const selectedRaw: (RawCorpusQuestion & { _score: number; repeatCount: number; combinedExam: string | null })[] = [];
  const seenFactKeys = new Set<string>();
  let duplicatesRemoved = 0;

  for (const item of scoredPool) {
    if (item.isUsed) continue; // Skip used questions

    // When NOT in allUnused mode, deduplicate near-identical questions within the batch
    if (!allUnused && seenFactKeys.has(item.factKey)) {
      duplicatesRemoved++;
      // If the already added entry doesn't have an exam but this duplicate does, enhance it
      const existing = selectedRaw.find(
        (x) => cleanStem(x.question) + "___" + cleanStem(x.answer) === item.factKey
      );
      if (existing && !existing.combinedExam && item.raw.exam && !isFakeExam(item.raw.exam)) {
        existing.combinedExam = item.raw.exam.trim();
      }
      continue;
    }

    seenFactKeys.add(item.factKey);

    // Prepare combined exam string
    let combinedExam: string | null = null;
    if (item.distinctExams.length > 0) {
      combinedExam = item.distinctExams.slice(0, 3).join(" | ");
    } else if (item.raw.exam && !isFakeExam(item.raw.exam)) {
      combinedExam = item.raw.exam.trim();
    }

    selectedRaw.push({
      ...item.raw,
      _score: item.score,
      repeatCount: item.repeatCount,
      combinedExam,
    });

    if (!allUnused && selectedRaw.length >= maxResults) break;
  }

  const batchNumber = Math.floor(usedCountForTopic / (maxResults || 100)) + 1;
  const unusedPoolCount = Math.max(0, totalFound - usedCountForTopic);
  const remainingCount = Math.max(0, totalFound - usedCountForTopic - selectedRaw.length);

  // 5. Enrich with clean options and 0-based answer index
  const enriched: PyqQuestion[] = selectedRaw.map((q) => {
    const cleanOptions = (q.options || []).map(stripOptionPrefix);
    const answerIndex = resolveAnswerIndex(q.answer, q.options || []);

    return {
      id: q.id,
      topic: q.topic,
      question: q.question,
      options: cleanOptions,
      answerIndex,
      answerText: q.answer,
      exam: q.combinedExam,
      explanation: cleanCorpusExplanation(q.explanation),
      repeatCount: q.repeatCount,
      _score: q._score,
    };
  });

  return {
    questions: enriched,
    totalFound,
    usedCount: usedCountForTopic,
    unusedPoolCount,
    remainingCount,
    sent: enriched.length,
    batchNumber,
    duplicatesRemoved,
    canonicalTopic: canonicalDef
      ? {
          subject: canonicalDef.subjectNameHindi || canonicalDef.subjectName,
          topic: canonicalDef.topicNameHindi || canonicalDef.topicName,
          matchedCorpusTopics: authorizedCorpusTopics,
        }
      : undefined,
  };
}

// (formatPyqsForPrompt is exported from ./pyqTypes)

/**
 * Convenience helper to retrieve questions for a canonical subject & topic.
 */
export function retrievePyqsForTopic(params: {
  subjectName?: string;
  topicName: string;
  batchSize?: number;
  usedQuestionIds?: number[] | Set<number>;
  allUnused?: boolean;
}): {
  questions: PyqQuestion[];
  totalAvailableInTopic: number;
  usedCount: number;
  remainingUnusedCount: number;
  matchedCorpusTopics: string[];
} {
  const res = getRelevantPyqQuestions(
    { topic: params.topicName, subject: params.subjectName },
    {
      maxResults: params.batchSize ?? 100,
      usedQuestionIds: params.usedQuestionIds,
      allUnused: params.allUnused,
    }
  );
  return {
    questions: res.questions,
    totalAvailableInTopic: res.totalFound,
    usedCount: res.usedCount,
    remainingUnusedCount: res.remainingCount,
    matchedCorpusTopics: res.canonicalTopic?.matchedCorpusTopics || [],
  };
}

