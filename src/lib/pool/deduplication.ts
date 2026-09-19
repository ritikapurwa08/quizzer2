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
  level?: 1 | 2 | 3 | 4;
  reason?: string;
  matchedId?: string;
}

export class QuestionDuplicateRegistry {
  private sourceIds = new Set<string>();
  private textNorms = new Map<string, string>(); // normText -> id
  private fingerprints = new Map<string, string>(); // fingerprint -> id
  // Token inverted index for Level 4 fast candidate retrieval
  private tokenIndex = new Map<string, Array<{ id: string; norm: string; tokenCount: number }>>();

  constructor() {}

  public hasSourceId(source: string, sourceQuestionId: string | number): boolean {
    return this.sourceIds.has(`${source}::${String(sourceQuestionId).trim()}`);
  }

  public checkDuplicate(
    source: string,
    sourceQuestionId: string | number,
    questionText: string,
    options: string[] = []
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

    // Level 4: High token similarity (only for substantial questions >= 40 chars)
    // Uses inverted token index for fast lookups
    if (norm.length >= 40) {
      const tokens = norm.split(" ").filter((t) => t.length > 2);
      if (tokens.length >= 6) {
        // Collect candidate matches that share significant tokens
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

        // Only compute full similarity for candidates sharing >= 80% tokens
        for (const [candidateId, cand] of candidateCounts) {
          const minTokens = Math.min(tokens.length, cand.tokenCount);
          if (cand.count / minTokens >= 0.85) {
            const sim = tokenSimilarity(norm, cand.norm);
            if (sim >= 0.96) {
              return {
                isDuplicate: true,
                level: 4,
                reason: `Level 4 Duplicate: High token similarity (${(sim * 100).toFixed(1)}%) with question ${candidateId}.`,
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
    options: string[] = []
  ) {
    const sId = String(sourceQuestionId).trim();
    const sourceKey = `${source}::${sId}`;
    const norm = normalizeQuestionText(questionText);
    const fp = computeQuestionFingerprint(questionText, options);

    this.sourceIds.add(sourceKey);
    if (norm) {
      this.textNorms.set(norm, sId);
      if (norm.length >= 40) {
        const tokens = norm.split(" ").filter((t) => t.length > 2);
        if (tokens.length >= 6) {
          const entry = { id: sId, norm, tokenCount: tokens.length };
          // Index rare or informative tokens (max 10 tokens per question)
          const indexedTokens = new Set(tokens.slice(0, 10));
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
