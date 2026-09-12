/**
 * Shared PYQ Types & Client-Safe Formatters
 *
 * Safe to import in both client-side and server-side components.
 * Does NOT import Node builtins (fs/path).
 */

export interface RawCorpusQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
}

export interface PyqQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answerIndex: number;
  answerText: string;
  exam: string | null;
  explanation: string;
  repeatCount?: number;
  _score: number;
}

export interface PyqRetrievalQuery {
  topic: string;
  subject?: string;
  subtopic?: string;
}

export interface PyqRetrievalOptions {
  /** Maximum number of questions in this batch. Default: 100 */
  maxResults?: number;
  /** IDs of questions already used/processed in previous batches */
  usedQuestionIds?: Set<number> | number[];
  /** Minimum score threshold (default: 0) */
  minScore?: number;
  /** Return all currently available unused questions without a batch size limit */
  allUnused?: boolean;
}

export interface PyqRetrievalResult {
  questions: PyqQuestion[];
  /** Total questions genuinely available for this canonical topic in the corpus */
  totalFound: number;
  /** Number of questions previously marked used */
  usedCount: number;
  /** Total unused available pool in topic before this batch (totalFound - usedCount) */
  unusedPoolCount: number;
  /** Number of unused questions remaining after this batch */
  remainingCount: number;
  /** Number of questions sent in this batch */
  sent: number;
  /** Batch index (1-based) */
  batchNumber: number;
  /** Number of near-duplicate questions consolidated into primary entries */
  duplicatesRemoved: number;
  /** Information about the canonical topic resolved */
  canonicalTopic?: {
    subject: string;
    topic: string;
    matchedCorpusTopics: string[];
  };
}

/**
 * Strips all occurrences of Rajasthan Gyan / rajasthangyan URLs & mentions from explanations.
 */
export function cleanCorpusExplanation(explanation?: string): string {
  if (!explanation) return "";
  return explanation
    .replace(/https?:\/\/(?:www\.)?rajasthangyan\.com[^\s]*/gi, "")
    .replace(/more\s*detail\s*:\s*[^\n]*rajasthangyan[^\n]*/gi, "")
    .replace(/rajasthangyan(?:\.com)?/gi, "")
    .replace(/rajasthan\s+gyan/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Converts a PyqQuestion array into a clean, numbered PYQ reference data block
 * for inclusion in the Gemini 20-question generation prompt.
 */
export function formatPyqsForPrompt(questions: PyqQuestion[]): string {
  if (!questions || questions.length === 0) return "";

  const lines: string[] = [];

  questions.forEach((q, idx) => {
    const examBadge = q.exam ? ` | परीक्षा: ${q.exam}` : "";
    const repBadge = q.repeatCount && q.repeatCount > 1 ? ` | [परीक्षा आवृत्ति: ${q.repeatCount} बार]` : "";

    lines.push(`--- PYQ #${idx + 1} (Corpus ID: ${q.id}${examBadge}${repBadge}) ---`);
    lines.push(`प्रश्न: ${q.question}`);

    q.options.forEach((opt, i) => {
      const marker = ["(A)", "(B)", "(C)", "(D)", "(E)"][i] ?? `(${i + 1})`;
      const isCorrect = i === q.answerIndex;
      lines.push(`  ${marker} ${opt}${isCorrect ? " ✓ [सही उत्तर]" : ""}`);
    });

    const cleanExp = cleanCorpusExplanation(q.explanation);
    if (cleanExp) {
      lines.push(`व्याख्या: ${cleanExp}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}
