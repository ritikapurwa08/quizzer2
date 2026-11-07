/**
 * Multi-Level Deduplication Engine for Quizzer Question Pool
 *
 * Layered Protection:
 * LEVEL 1: Source ID duplicate (source + sourceQuestionId)
 * LEVEL 2: Normalized question text duplicate
 * LEVEL 3: Question + options fingerprint
 * LEVEL 4: High token similarity for long stems (meaningful same-fact duplicate)
 *
 * Indexed for high performance (processes 30,000+ items in milliseconds).
 *
 * CRITICAL RULE: DO NOT OVER-DEDUPE.
 * Questions concerning the same broad topic testing different facts
 * (e.g. State bird vs State flower) must BOTH remain.
 */

export function normalizeQuestionText(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function computeQuestionFingerprint(questionText: string, options: string[] = []): string {
  const normQ = normalizeQuestionText(questionText);
  // Sort normalized options to catch permutations
  const normOpts = options
    .map((o) => normalizeQuestionText(o))
    .filter(Boolean)
    .sort()
    .join("::");
  return `${normQ}###${normOpts}`;
}

export function tokenSimilarity(a: string, b: string): number {
  const aNorm = normalizeQuestionText(a);
  const bNorm = normalizeQuestionText(b);
  const aTokens = new Set(aNorm.split(" ").filter((t) => t.length > 1));
  const bTokens = new Set(bNorm.split(" ").filter((t) => t.length > 1));

  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersection++;
  }

  return (2 * intersection) / (aTokens.size + bTokens.size);
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  level?: 1 | 2 | 3 | 4 | 5;
  reason?: string;
  matchedId?: string;
}

export class QuestionDuplicateRegistry {
  private sourceIds = new Set<string>();
  private textNorms = new Map<string, string>(); // normText -> id
  private fingerprints = new Map<string, string>(); // fingerprint -> id
  private questionAnswers = new Map<string, { norm: string; answerText: string }>(); // id -> { norm, answerText }
  // Token inverted index for fast candidate retrieval
  private tokenIndex = new Map<string, Array<{ id: string; norm: string; tokenCount: number }>>();

  constructor() {}

  public hasSourceId(source: string, sourceQuestionId: string | number): boolean {
    return this.sourceIds.has(`${source}::${String(sourceQuestionId).trim()}`);
  }

  public checkDuplicate(
    source: string,
    sourceQuestionId: string | number,
    questionText: string,
    options: string[] = [],
    answerText: string = ""
  ): DuplicateCheckResult {
    const sId = String(sourceQuestionId).trim();
    const sourceKey = `${source}::${sId}`;

    // Level 1: Source ID duplicate
    if (this.sourceIds.has(sourceKey)) {
      return {
        isDuplicate: true,
        level: 1,
        reason: `Level 1 Duplicate: Source ID ${sourceKey} already exists.`,
        matchedId: sId,
      };
    }

    // Level 2: Exact normalized question text
    const norm = normalizeQuestionText(questionText);
    if (!norm) {
      return { isDuplicate: true, level: 2, reason: "Question text is empty." };
    }

    if (this.textNorms.has(norm)) {
      const existingId = this.textNorms.get(norm)!;
      return {
        isDuplicate: true,
        level: 2,
        reason: `Level 2 Duplicate: Identical normalized question text with question ${existingId}.`,
        matchedId: existingId,
      };
    }

    // Level 3: Question + sorted options fingerprint
    const fp = computeQuestionFingerprint(questionText, options);
    if (this.fingerprints.has(fp)) {
      const existingId = this.fingerprints.get(fp)!;
      return {
        isDuplicate: true,
        level: 3,
        reason: `Level 3 Duplicate: Same question and options fingerprint as question ${existingId}.`,
        matchedId: existingId,
      };
    }

    const normAns = normalizeQuestionText(answerText);

    // Level 4: High token similarity (>= 88%) with same answer OR inverse question match
    if (norm.length >= 25) {
      const tokens = norm.split(" ").filter((t) => t.length > 2);
      if (tokens.length >= 4) {
        const candidateCounts = new Map<string, { norm: string; count: number; tokenCount: number }>();
        for (const token of tokens) {
          const entries = this.tokenIndex.get(token);
          if (entries) {
            for (const entry of entries) {
              const prev = candidateCounts.get(entry.id);
              if (prev) {
                prev.count++;
              } else {
                candidateCounts.set(entry.id, {
                  norm: entry.norm,
                  count: 1,
                  tokenCount: entry.tokenCount,
                });
              }
            }
          }
        }

        for (const [candidateId, cand] of candidateCounts) {
          const minTokens = Math.min(tokens.length, cand.tokenCount);
          if (cand.count / minTokens >= 0.75) {
            const sim = tokenSimilarity(norm, cand.norm);
            const candMeta = this.questionAnswers.get(candidateId);
            const candAns = candMeta?.answerText || "";

            // Same fact / answer with high token similarity
            if (sim >= 0.88 && normAns && candAns && normAns === candAns) {
              return {
                isDuplicate: true,
                level: 4,
                reason: `Level 4 Conceptual Duplicate: High token similarity (${(sim * 100).toFixed(1)}%) testing same fact as question ${candidateId}.`,
                matchedId: candidateId,
              };
            }

            // Inverse question check (e.g. Q1 asks for Y with answer X; Q2 asks for X with answer Y)
            if (
              normAns &&
              candAns &&
              normAns.length >= 3 &&
              candAns.length >= 3 &&
              norm.includes(candAns) &&
              cand.norm.includes(normAns)
            ) {
              return {
                isDuplicate: true,
                level: 5,
                reason: `Level 5 Inverse Duplicate: Direct/Reverse reciprocal question with question ${candidateId}.`,
                matchedId: candidateId,
              };
            }
          }
        }
      }
    }

    return { isDuplicate: false };
  }

  public register(
    source: string,
    sourceQuestionId: string | number,
    questionText: string,
    options: string[] = [],
    answerText: string = ""
  ) {
    const sId = String(sourceQuestionId).trim();
    const sourceKey = `${source}::${sId}`;
    const norm = normalizeQuestionText(questionText);
    const fp = computeQuestionFingerprint(questionText, options);
    const normAns = normalizeQuestionText(answerText);

    this.sourceIds.add(sourceKey);
    if (norm) {
      this.textNorms.set(norm, sId);
      this.questionAnswers.set(sId, { norm, answerText: normAns });
      if (norm.length >= 25) {
        const tokens = norm.split(" ").filter((t) => t.length > 2);
        if (tokens.length >= 4) {
          const entry = { id: sId, norm, tokenCount: tokens.length };
          const indexedTokens = new Set(tokens.slice(0, 12));
          for (const token of indexedTokens) {
            let list = this.tokenIndex.get(token);
            if (!list) {
              list = [];
              this.tokenIndex.set(token, list);
            }
            list.push(entry);
          }
        }
      }
    }
    if (fp) {
      this.fingerprints.set(fp, sId);
    }
  }

  public size(): number {
    return this.sourceIds.size;
  }
}
