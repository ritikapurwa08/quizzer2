import { z } from "zod";

/** Client-side mirror of convex/lib/validators.ts, used by the JSON import wizard.
 *  Supports both v2 canonical types and the new minified AI prompt schema:
 *    q → questionText, o → options[], a → correctAnswer index (0-4), e → explanation, t → type
 */

export const optionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

// All accepted type strings (v2 canonical + legacy aliases)
export const questionTypeSchema = z.enum([
  "mcq",
  "match",
  "assertion",
  "true_false",
  // legacy aliases — kept for backward compat
  "match_following",
  "assertion_reason",
  "statement_reason",
  "sequence",
  "table",
]);

export type AcceptedQuestionType = z.infer<typeof questionTypeSchema>;

export const difficultySchema = z.enum(["easy", "medium", "hard"]);

export const questionSchema = z
  .object({
    type: questionTypeSchema,
    questionText: z.string().min(1, "questionText is required"),
    options: z.array(optionSchema),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    explanation: z.string().optional(),
    reference: z.string().optional(),
    difficulty: difficultySchema.default("medium"),
    meta: z.any().optional(),
  })
  .superRefine((q, ctx) => {
    const needsOptions = ["mcq", "true_false", "assertion", "assertion_reason", "statement_reason", "match", "match_following"];
    if (needsOptions.includes(q.type) && q.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Question type "${q.type}" requires at least one option`,
        path: ["options"],
      });
    }

    if (typeof q.correctAnswer === "string" && needsOptions.includes(q.type)) {
      const validIds = q.options.map((o) => o.id);
      if (validIds.length > 0 && !validIds.includes(q.correctAnswer)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `correctAnswer "${q.correctAnswer}" not found in options`,
          path: ["correctAnswer"],
        });
      }
    }
  });

// ── Minified JSON key mapping (AI prompt schema) ────────────────────────
// Maps: q→questionText, o→options, a→correctAnswer index, e→explanation, t→type
const MINIFIED_INDEX_TO_OPT: Record<number, string> = {
  0: "opt1",
  1: "opt2",
  2: "opt3",
  3: "opt4",
  4: "opt5",
};

const MINIFIED_TYPE_MAP: Record<string, AcceptedQuestionType> = {
  mcq: "mcq",
  match: "match",
  match_following: "match",
  assertion: "assertion",
  assertion_reason: "assertion",
  statement_reason: "assertion",
  true_false: "true_false",
  sequence: "mcq", // downgrade to mcq safely
  table: "mcq",    // downgrade to mcq safely
};

// ── Match list item interfaces ──────────────────────────────────────────
interface MatchListItem {
  id: string;
  text: string;
}

/**
 * Extracts List-I and List-II structured items from question text for match questions.
 * Supports all common formats:
 *  Headers: सूची-I, सूची – I, सूची-I:, List I, List-II, Column A/B
 *  Items: A. text, A) text, (A) text, A - text, A: text, 1. text, (i) text, (ii) text
 */
export function extractMatchListsFromText(text: string): { left: MatchListItem[]; right: MatchListItem[] } {
  if (!text) return { left: [], right: [] };

  // Find the split point between List-I and List-II sections
  const list2HeaderRegex = /(?:\r?\n|^)\s*(?:सूची|List|Column)\s*[-–—:\s]*(?:II|2|B)\b/im;
  const match2 = text.match(list2HeaderRegex);

  if (!match2 || match2.index === undefined) {
    return { left: [], right: [] };
  }

  const part1 = text.slice(0, match2.index);
  const part2 = text.slice(match2.index);

  // Regex for list items — supports:
  //   A. text, A) text, (A) text, A - text, A: text
  //   1. text, 2. text, 3. text, 4. text, 5. text
  //   (i) text, (ii) text, (iii) text, (iv) text, (v) text
  //   i. text, ii. text, iii. text, iv. text
  const itemRegex = /^(?:(?:\(([A-Ea-e])\)|([A-Ea-e])\s*[.)\-:])|([\divxlc]+)\s*[.)\-:]|\(([\divxlc]+)\))\s*(.*)/;

  function extractItems(section: string): MatchListItem[] {
    const items: MatchListItem[] = [];
    for (const line of section.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const m = trimmed.match(itemRegex);
      if (m) {
        // Determine the identifier from capture groups
        const id = m[1] || m[2] || m[3] || m[4] || "";
        const text = (m[5] || "").trim();

        // Skip if no actual text content (just the header)
        if (!text) continue;

        items.push({ id: id.trim(), text });
      }
    }
    return items;
  }

  const left = extractItems(part1);
  const right = extractItems(part2);

  if (left.length > 0 || right.length > 0) {
    return { left, right };
  }

  return { left: [], right: [] };
}

/** Converts a raw minified AI output question object to standard QuestionInput.
 *  Handles both minified keys (q/o/a/e/t) and full keys (questionText/options/etc.).
 */
export function normalizeMinifiedQuestion(raw: Record<string, any>): QuestionInput | null {
  if (!raw || typeof raw !== "object") return null;

  try {
    const isMinified = "q" in raw && !("questionText" in raw);

    const questionText: string = isMinified
      ? String(raw.q ?? "").trim()
      : String(raw.questionText ?? "").trim();

    if (!questionText) return null;

    // Options: string[] or {id, text}[]
    let options: { id: string; text: string }[] = [];
    const rawOptions = raw.o ?? raw.options;
    if (Array.isArray(rawOptions)) {
      options = rawOptions.map((item: any, i: number) => {
        if (typeof item === "string") {
          return { id: `opt${i + 1}`, text: item.trim() };
        }
        if (item && typeof item === "object") {
          return { id: item.id || `opt${i + 1}`, text: String(item.text ?? "").trim() };
        }
        return { id: `opt${i + 1}`, text: String(item ?? "").trim() };
      });
    }

    // Filter out empty-text options instead of padding to 4
    options = options.filter(o => o.text.length > 0);

    // Minimum 2 options required for a valid question
    if (options.length < 2) return null;

    // Correct answer: integer index (0-4), option ID string ("opt1", "A"), or array
    let correctAnswer: string | string[] = "opt1";
    const rawAnswer = raw.a !== undefined ? raw.a : raw.correctAnswer;
    if (typeof rawAnswer === "number") {
      correctAnswer = MINIFIED_INDEX_TO_OPT[rawAnswer] ?? `opt${rawAnswer + 1}`;
    } else if (typeof rawAnswer === "string") {
      const trimmed = rawAnswer.trim();
      const upper = trimmed.toUpperCase();
      if (upper === "A" || upper === "1") correctAnswer = "opt1";
      else if (upper === "B" || upper === "2") correctAnswer = "opt2";
      else if (upper === "C" || upper === "3") correctAnswer = "opt3";
      else if (upper === "D" || upper === "4") correctAnswer = "opt4";
      else if (upper === "E" || upper === "5") correctAnswer = "opt5";
      else correctAnswer = trimmed;
    } else if (Array.isArray(rawAnswer)) {
      correctAnswer = rawAnswer.map(String);
    }

    // Type: map minified or legacy type to canonical
    const rawType: string = String(raw.t ?? raw.type ?? "mcq").toLowerCase().trim();
    const type: AcceptedQuestionType = MINIFIED_TYPE_MAP[rawType] ?? "mcq";

    const explanation: string | undefined =
      (raw.e !== undefined ? String(raw.e).trim() : undefined) ??
      (raw.explanation !== undefined ? String(raw.explanation).trim() : undefined);

    const difficulty = (raw.difficulty as "easy" | "medium" | "hard") ?? "medium";

    // Meta handling for match questions
    let meta: any = raw.meta ?? undefined;
    if (type === "match" || type === "match_following") {
      const existingLeft = meta?.left ?? meta?.columnA;
      const existingRight = meta?.right ?? meta?.columnB;

      // Check if existing meta has valid, non-empty lists
      const hasValidMeta =
        Array.isArray(existingLeft) && existingLeft.length > 0 &&
        Array.isArray(existingRight) && existingRight.length > 0;

      if (hasValidMeta) {
        // Normalize existing lists to { id, text } format
        meta = {
          ...(meta || {}),
          left: normalizeMetaList(existingLeft, "left"),
          right: normalizeMetaList(existingRight, "right"),
        };
      } else {
        // Extract from questionText
        const extracted = extractMatchListsFromText(questionText);
        if (extracted.left.length > 0 || extracted.right.length > 0) {
          meta = {
            ...(meta || {}),
            left: extracted.left,
            right: extracted.right,
          };
        } else {
          meta = { ...(meta || {}), left: [], right: [] };
        }
      }
    }

    return {
      type,
      questionText,
      options,
      correctAnswer,
      explanation: explanation || undefined,
      reference: raw.reference ? String(raw.reference).trim() : undefined,
      difficulty,
      meta,
    };
  } catch {
    return null;
  }
}

/**
 * Normalizes a meta list (left/right) to { id, text }[] format.
 * Handles both string arrays and object arrays.
 */
function normalizeMetaList(arr: any[], side: "left" | "right"): MatchListItem[] {
  return arr.map((item: any, idx: number) => {
    if (typeof item === "string") {
      // Parse "A. text" or "(i) text" or "1. text" format
      const m = item.match(/^(?:\(([A-Ea-e\divxlc]+)\)|([A-Ea-e\divxlc]+)\s*[.)\-:])\s*(.*)/);
      if (m) {
        const id = (m[1] || m[2] || "").trim();
        const text = (m[3] || "").trim();
        if (id && text) return { id, text };
      }
      // Fallback: use default ID, full text
      const defaultId = side === "left"
        ? String.fromCharCode(65 + idx)
        : String(idx + 1);
      return { id: defaultId, text: item.trim() };
    }
    if (item && typeof item === "object") {
      const defaultId = side === "left"
        ? String.fromCharCode(65 + idx)
        : String(idx + 1);
      return {
        id: String(item.id || defaultId),
        text: String(item.text || item),
      };
    }
    return {
      id: side === "left" ? String.fromCharCode(65 + idx) : String(idx + 1),
      text: String(item ?? ""),
    };
  });
}

/** Preprocesses any raw question object, adapting minified schema automatically */
export const adaptableQuestionSchema = z.preprocess((val) => {
  if (val && typeof val === "object") {
    const normalized = normalizeMinifiedQuestion(val as Record<string, any>);
    if (normalized) return normalized;
  }
  return val;
}, questionSchema);

export const importObjectSchema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  testSet: z.string().optional(),
  negativeMarking: z.boolean().optional(),
  questions: z.array(adaptableQuestionSchema).min(1, "At least one question is required"),
});

export const importArraySchema = z.array(adaptableQuestionSchema).min(1, "At least one question is required");

export const importJsonSchema = z.union([
  importArraySchema.transform((questions) => ({
    subject: undefined,
    topic: undefined,
    testSet: undefined,
    negativeMarking: undefined,
    questions,
  })),
  importObjectSchema,
]);

export type ImportJson = {
  subject?: string;
  topic?: string;
  testSet?: string;
  negativeMarking?: boolean;
  questions: z.infer<typeof questionSchema>[];
};
export type QuestionInput = z.infer<typeof questionSchema>;

export interface QualityIssue {
  questionIndex: number;
  questionText: string;
  severity: "error" | "warning";
  code:
  | "DUPLICATE_OPTION"
  | "INVALID_OPTION_COUNT"
  | "MISSING_CORRECT_ANSWER"
  | "LENGTH_SKEW"
  | "DUPLICATE_QUESTION"
  | "EMPTY_FIELD";
  message: string;
}

/**
 * Validates a batch of questions against quality gate standards:
 * - 2–5 options (type-dependent)
 * - Unique options
 * - Valid answer key
 * - No extreme length skew (where correct option is artificially 3x longer than distractors)
 * - No duplicate questions
 */
export function validateBatchQuality(questions: QuestionInput[]): {
  isValid: boolean;
  issues: QualityIssue[];
} {
  const issues: QualityIssue[] = [];
  const seenQuestionTexts = new Map<string, number>();

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const cleanText = q.questionText.trim().toLowerCase();

    // 1. Duplicate question check
    if (seenQuestionTexts.has(cleanText)) {
      issues.push({
        questionIndex: idx,
        questionText: q.questionText,
        severity: "warning",
        code: "DUPLICATE_QUESTION",
        message: `Q${qNum} is very similar or duplicate to Q${seenQuestionTexts.get(cleanText)! + 1}`,
      });
    } else {
      seenQuestionTexts.set(cleanText, idx);
    }

    // 2. Option count check — support 2–5 options
    const optCount = q.options?.length ?? 0;
    if (optCount < 2 || optCount > 5) {
      issues.push({
        questionIndex: idx,
        questionText: q.questionText,
        severity: "error",
        code: "INVALID_OPTION_COUNT",
        message: `Q${qNum}: ${optCount} विकल्प — मान्य सीमा 2–5 है (${optCount} options, expected 2–5)`,
      });
    }

    if (q.options && q.options.length > 0) {
      // 3. Duplicate options check
      const optTexts = new Set<string>();
      for (const opt of q.options) {
        const textKey = opt.text.trim().toLowerCase();
        if (optTexts.has(textKey)) {
          issues.push({
            questionIndex: idx,
            questionText: q.questionText,
            severity: "error",
            code: "DUPLICATE_OPTION",
            message: `Q${qNum} has duplicate option: "${opt.text}"`,
          });
        }
        optTexts.add(textKey);
      }

      // 4. Correct answer check
      if (typeof q.correctAnswer === "string") {
        const validIds = q.options.map((o) => o.id);
        if (!validIds.includes(q.correctAnswer)) {
          issues.push({
            questionIndex: idx,
            questionText: q.questionText,
            severity: "error",
            code: "MISSING_CORRECT_ANSWER",
            message: `Q${qNum}: सही उत्तर "${q.correctAnswer}" दिया गया है लेकिन विकल्पों में मौजूद नहीं है`,
          });
        }

        // 5. Length skew / obvious answer check
        const correctOpt = q.options.find((o) => o.id === q.correctAnswer);
        const distractors = q.options.filter((o) => o.id !== q.correctAnswer);
        if (correctOpt && distractors.length >= 2) {
          const correctLen = correctOpt.text.trim().length;
          const avgDistractorLen =
            distractors.reduce((sum, d) => sum + d.text.trim().length, 0) / distractors.length;

          if (avgDistractorLen > 5 && correctLen > avgDistractorLen * 3.5) {
            issues.push({
              questionIndex: idx,
              questionText: q.questionText,
              severity: "warning",
              code: "LENGTH_SKEW",
              message: `Q${qNum} correct option is significantly longer than distractors (${correctLen} vs avg ${Math.round(avgDistractorLen)} chars), making it predictable.`,
            });
          }
        }
      }
    }
  });

  const hasErrors = issues.some((i) => i.severity === "error");
  return { isValid: !hasErrors, issues };
}
