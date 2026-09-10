/**
 * PYQ Retrieval Engine — Phase 1
 *
 * Given a topic name, retrieves the most relevant questions from the
 * 17,143-question Rajasthan exam corpus and returns them for inclusion
 * in the AI generation prompt.
 *
 * Design principles:
 *  - No external vector DB — topic-based + keyword scoring is sufficient
 *  - Original corpus is NEVER mutated
 *  - Answer index is resolved so AI receives clean structured PYQs
 *  - Deduplication prevents flooding the prompt with near-identical questions
 *  - Quality bonus for questions with exam metadata and explanations
 */

// ─── Raw corpus type (as stored in the JSON file) ────────────────────────────

export interface RawCorpusQuestion {
  id: number;
  topic: string;
  question: string;
  /** Options with Devanagari prefix markers: ["(अ) ...", "(ब) ...", "(स) ...", "(द) ..."] */
  options: string[];
  /** Text string matching the content of one option */
  answer: string;
  exam: string;
  explanation: string;
}

// ─── Enriched question returned to prompt builder ─────────────────────────────

export interface PyqQuestion {
  /** Original corpus ID — preserved for sourceQuestionId provenance */
  id: number;
  topic: string;
  question: string;
  /** Clean options without Devanagari prefix markers */
  options: string[];
  /** 0-based answer index derived from answer text matching */
  answerIndex: number;
  /** Original answer text (for double-checking) */
  answerText: string;
  /** Exam name — empty string if not available */
  exam: string;
  /** Explanation — empty string if not available */
  explanation: string;
  /** Relevance score (internal, not exposed to AI) */
  _score: number;
}

// ─── Retrieval options ─────────────────────────────────────────────────────────

export interface PyqRetrievalOptions {
  /** Maximum number of questions to return. Default: 100 */
  maxResults?: number;
  /** Minimum relevance score to include. Default: 10 */
  minScore?: number;
}

export interface PyqRetrievalResult {
  questions: PyqQuestion[];
  /** Total questions found before limiting to maxResults */
  totalFound: number;
  /** Number of questions sent (after maxResults cap) */
  sent: number;
  /** Exact duplicate groups removed during deduplication */
  duplicatesRemoved: number;
}

// ─── Lazy-loaded corpus ────────────────────────────────────────────────────────
// The corpus import is intentionally at module level for caching, but the
// 16 MB JSON is only bundled on the admin route (dynamic import not needed
// because Next.js tree-shakes admin-only modules from student pages).

let _corpus: RawCorpusQuestion[] | null = null;

function getCorpus(): RawCorpusQuestion[] {
  if (!_corpus) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _corpus = require("@/xdata/rajasthan_selected_topics_question_15000.json") as RawCorpusQuestion[];
  }
  return _corpus;
}

// ─── Text normalization utilities ──────────────────────────────────────────────

/** Lowercase, trim, collapse whitespace, remove punctuation */
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[।,.!?;:'"()\[\]{}|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract meaningful Hindi words (≥2 chars, excluding common stop words) */
const STOP_WORDS = new Set([
  // Standard Hindi stop words
  "का", "की", "के", "में", "है", "हैं", "से", "को", "और", "या",
  "पर", "यह", "वह", "इस", "उस", "एक", "था", "थी", "थे", "हो",
  "कि", "जो", "तो", "भी", "ने", "द्वारा", "तथा", "व", "एवं",
  "के", "लिए", "में", "पर", "को", "से", "ने", "at", "the", "of",
  "in", "is", "to", "and", "or", "a", "an", "by", "for",
  // Ultra-high-frequency Rajasthan corpus words (55+/73 topics contain these)
  // These words appear in almost every topic and add zero discriminative power
  "राजस्थान", "राजस्थानी", "राजस्थान के", "rajasthan",
  "प्रमुख", "विशेष", "विभिन्न",
]);

function extractKeywords(text: string): Set<string> {
  const words = normalizeText(text).split(" ");
  const keywords = new Set<string>();
  for (const w of words) {
    if (w.length >= 2 && !STOP_WORDS.has(w)) {
      keywords.add(w);
    }
  }
  return keywords;
}

/** Strip option prefix markers like "(अ)", "(ब)", "(स)", "(द)" */
function stripOptionPrefix(option: string): string {
  return option
    .replace(/^\s*[\(\（][अबसदabcd12345]\s*[\)\）]\s*/i, "")
    .replace(/^\s*[अबसदabcd12345]\s*[\.\)]\s*/i, "")
    .trim();
}

// ─── Answer index resolution ────────────────────────────────────────────────────

/**
 * Given the answer text and the raw options array, derive the 0-based index.
 * Tries exact match first, then substring containment.
 * Returns 0 as fallback if no match found.
 */
function resolveAnswerIndex(answerText: string, options: string[]): number {
  const normAnswer = normalizeText(answerText);

  // Pass 1: exact normalized match against stripped option text
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeText(stripOptionPrefix(options[i]));
    if (stripped === normAnswer) return i;
  }

  // Pass 2: answer contained in option (handles partial prefix strips)
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeText(stripOptionPrefix(options[i]));
    if (stripped.includes(normAnswer) || normAnswer.includes(stripped)) {
      return i;
    }
  }

  // Pass 3: raw option text contains answer text
  for (let i = 0; i < options.length; i++) {
    const normOpt = normalizeText(options[i]);
    if (normOpt.includes(normAnswer)) return i;
  }

  // Fallback — return 0 with a warning in dev mode
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[PYQ] Could not resolve answer index for: "${answerText}" in options:`,
      options
    );
  }
  return 0;
}

// ─── Relevance scoring ─────────────────────────────────────────────────────────

function scoreQuestion(
  q: RawCorpusQuestion,
  normQueryTopic: string,
  queryKeywords: Set<string>
): number {
  const normCorpusTopic = normalizeText(q.topic);

  let score = 0;

  // Exact topic match — highest priority
  if (normCorpusTopic === normQueryTopic) {
    score = 100;
  }
  // One contains the other (handles partial prefix/suffix matches)
  else if (normCorpusTopic.includes(normQueryTopic) || normQueryTopic.includes(normCorpusTopic)) {
    score = 75;
  }
  // Keyword overlap between topic strings
  // NOTE: We require ≥2 overlapping keywords to avoid matching too broadly.
  // Single-word overlaps on common words like "नदियां" can still match
  // unrelated topics; requiring 2+ ensures meaningful thematic overlap.
  else {
    const corpusTopicKeywords = extractKeywords(q.topic);
    let overlap = 0;
    for (const kw of queryKeywords) {
      if (corpusTopicKeywords.has(kw)) overlap++;
    }
    // Require at least 2 matching non-trivial keywords for any score
    if (overlap >= 4) score = 60;
    else if (overlap === 3) score = 45;
    else if (overlap === 2) score = 25;
    // overlap ≤ 1: score stays 0 (no credit for single-word matches)
  }

  // Quality bonuses (only applied if there's a base score)
  if (score > 0) {
    if (q.exam && q.exam.trim()) score += 5;
    if (q.explanation && q.explanation.trim()) score += 3;
  }

  return score;
}

// ─── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Remove near-duplicate questions.
 * Two questions are considered duplicates if their normalized question text
 * is identical. Keeps the first occurrence (highest-scored, since list is
 * already sorted by score before deduplication).
 */
function deduplicateQuestions(
  questions: (RawCorpusQuestion & { _score: number })[]
): { deduped: (RawCorpusQuestion & { _score: number })[]; removed: number } {
  const seen = new Set<string>();
  const deduped: (RawCorpusQuestion & { _score: number })[] = [];
  let removed = 0;

  for (const q of questions) {
    const key = normalizeText(q.question);
    if (seen.has(key)) {
      removed++;
    } else {
      seen.add(key);
      deduped.push(q);
    }
  }

  return { deduped, removed };
}

// ─── Main retrieval function ───────────────────────────────────────────────────

/**
 * Retrieves the most relevant PYQs from the 17K corpus for a given topic.
 *
 * @param topicName - The Hindi topic name (from the app's topic selector)
 * @param options   - Optional configuration
 * @returns PyqRetrievalResult with questions and stats
 */
export function getRelevantPyqQuestions(
  topicName: string,
  options: PyqRetrievalOptions = {}
): PyqRetrievalResult {
  const { maxResults = 100, minScore = 10 } = options;

  if (!topicName || !topicName.trim()) {
    return { questions: [], totalFound: 0, sent: 0, duplicatesRemoved: 0 };
  }

  const corpus = getCorpus();
  const normQueryTopic = normalizeText(topicName);
  const queryKeywords = extractKeywords(topicName);

  // Score every question in the corpus
  const scored: (RawCorpusQuestion & { _score: number })[] = [];
  for (const q of corpus) {
    const score = scoreQuestion(q, normQueryTopic, queryKeywords);
    if (score >= minScore) {
      scored.push({ ...q, _score: score });
    }
  }

  // Sort by score descending, then by id ascending (stable secondary sort)
  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return a.id - b.id;
  });

  // Deduplicate (operates on sorted list, so highest-scored version is kept)
  const { deduped, removed } = deduplicateQuestions(scored);

  const totalFound = deduped.length;

  // Cap at maxResults
  const selected = deduped.slice(0, maxResults);

  // Enrich: strip option prefixes + resolve answer index
  const enriched: PyqQuestion[] = selected.map((q) => {
    const cleanOptions = q.options.map(stripOptionPrefix);
    const answerIndex = resolveAnswerIndex(q.answer, q.options);

    return {
      id: q.id,
      topic: q.topic,
      question: q.question,
      options: cleanOptions,
      answerIndex,
      answerText: q.answer,
      exam: q.exam || "",
      explanation: q.explanation || "",
      _score: q._score,
    };
  });

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[PYQ Retrieval] Topic: "${topicName}" → scored: ${scored.length}, ` +
        `after dedup: ${totalFound}, sent: ${enriched.length}, ` +
        `duplicates removed: ${removed}`
    );
    if (enriched.length > 0) {
      console.log(
        "[PYQ Retrieval] Score distribution:",
        enriched.slice(0, 5).map((q) => ({ id: q.id, score: q._score, topic: q.topic }))
      );
    }
  }

  return {
    questions: enriched,
    totalFound,
    sent: enriched.length,
    duplicatesRemoved: removed,
  };
}

// ─── Prompt-ready serializer ───────────────────────────────────────────────────

/**
 * Converts a PyqQuestion array into a concise text block for inclusion
 * in the AI generation prompt. Each question is formatted compactly to
 * minimize token usage while preserving all essential information.
 */
export function formatPyqsForPrompt(questions: PyqQuestion[]): string {
  if (questions.length === 0) return "";

  const lines: string[] = [];

  questions.forEach((q, idx) => {
    lines.push(`--- PYQ #${idx + 1} (ID: ${q.id}${q.exam ? ` | परीक्षा: ${q.exam}` : ""}) ---`);
    lines.push(`प्रश्न: ${q.question}`);

    q.options.forEach((opt, i) => {
      const marker = ["(A)", "(B)", "(C)", "(D)", "(E)"][i] ?? `(${i + 1})`;
      const isCorrect = i === q.answerIndex;
      lines.push(`  ${marker} ${opt}${isCorrect ? " ✓" : ""}`);
    });

    if (q.explanation) {
      lines.push(`व्याख्या: ${q.explanation}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}
