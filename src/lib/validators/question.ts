import { z } from "zod";
import { sanitizeLlmArtifacts } from "../sanitizer";

/** Client-side mirror of convex/lib/validators.ts, used by the JSON import wizard.
 *  Supports both v2 canonical types and the new minified AI prompt schema:
 *    q → questionText, o → options[], a → correctAnswer index (0-3), e → explanation, t → type
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
// Maps: q→questionText, o→options, a→correctAnswer index (0-3), e→explanation, t→type
const MINIFIED_INDEX_TO_OPT: Record<number, string> = {
  0: "opt1",
  1: "opt2",
  2: "opt3",
  3: "opt4",
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
export interface MatchListItem {
  id: string;
  text: string;
}

export interface ExtractedMatchLists {
  left: MatchListItem[];
  right: MatchListItem[];
  leftTitle?: string;
  rightTitle?: string;
}

function extractTitles(text: string): { leftTitle?: string; rightTitle?: string } {
  // 1. Parenthesized descriptions in question prompt sentence: e.g. "सूची-I (समिति) को सूची-II (विशेषता) से..."
  const promptM = text.match(/(?:सूची|List)\s*[-–—:\s]*(?:I{1,3}|[12]|A)\s*\(([^)]+)\).*?(?:सूची|List)\s*[-–—:\s]*(?:II|2|B)\s*\(([^)]+)\)/i);
  if (promptM) {
    const leftSub = promptM[1]?.trim();
    const rightSub = promptM[2]?.trim();
    const isEng = /List/i.test(promptM[0]);
    return {
      leftTitle: leftSub ? `${isEng ? "List – I" : "सूची – I"} (${leftSub})` : undefined,
      rightTitle: rightSub ? `${isEng ? "List – II" : "सूची – II"} (${rightSub})` : undefined,
    };
  }

  // 2. Standalone table header line: e.g. "सूची-I (समिति)   सूची-II (विशेषता)"
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^(?:सूची|List|Column)\s*[-–—:\s]*(?:I{1,3}|[12]|A)\b(?:\s*\(([^)]+)\))?.*?[\s\t]{2,}(?:सूची|List|Column)\s*[-–—:\s]*(?:II|2|B)\b(?:\s*\(([^)]+)\))?/i);
    if (m) {
      const leftSub = m[1]?.trim();
      const rightSub = m[2]?.trim();
      const isEng = /^List/i.test(line);
      return {
        leftTitle: leftSub ? `${isEng ? "List – I" : "सूची – I"} (${leftSub})` : undefined,
        rightTitle: rightSub ? `${isEng ? "List – II" : "सूची – II"} (${rightSub})` : undefined,
      };
    }
  }
  return {};
}

/**
 * Extracts List-I and List-II structured items from question text for match questions.
 * Robustly supports:
 *  1. Side-by-side lines (e.g. "A. समिति ...   i. सिफारिश ...") with single/multi space or tab separators
 *  2. Sequential blocks (List-I block followed by List-II block)
 *  3. All marker varieties: A-E, 1-5, (A)-(E), (i)-(v), i-v, (क)-(घ)
 *  4. Dynamic column title extraction from prompt/header
 */
export function extractMatchListsFromText(text: string): ExtractedMatchLists {
  if (!text) return { left: [], right: [] };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titles = extractTitles(text);

  // ── Strategy 1: Side-by-side lines ──
  const sideBySideRegex =
    /^(?:(?:\(([A-Ea-e1-5\u0915-\u0918])\)|([A-Ea-e1-5\u0915-\u0918])\s*[.)\-:]))\s*(.*?)(?:\s{2,}|\t|\s+(?=\([a-zA-Z0-9ivxlc\u0900-\u097F]+\)|(?:[\divxlc]+|[a-eA-E\u0915-\u0918])\s*[.)\-:]))(?:\(([a-zA-Z0-9ivxlc\u0900-\u097F]+)\)|([a-zA-Z0-9ivxlc\u0900-\u097F]+)\s*[.)\-:])\s*(.*)$/i;

  const leftItems: MatchListItem[] = [];
  const rightItems: MatchListItem[] = [];

  for (const line of lines) {
    // Skip headers or codes lines
    if (/^(?:सूची|List|Column)\s*[-–—:\s]*(?:I{1,3}|[12]|[AB])\b/i.test(line)) continue;
    if (/^(?:कूट|Codes?)\s*[:=]?$/i.test(line)) continue;

    const m = line.match(sideBySideRegex);
    if (m) {
      const leftId = (m[1] || m[2] || "").trim();
      const leftText = (m[3] || "").trim();
      const rightId = (m[4] || m[5] || "").trim();
      const rightText = (m[6] || "").trim();

      if (leftText && rightText) {
        leftItems.push({ id: leftId, text: leftText });
        rightItems.push({ id: rightId, text: rightText });
      }
    }
  }

  if (leftItems.length >= 2 && rightItems.length >= 2) {
    return { left: leftItems, right: rightItems, ...titles };
  }

  // ── Strategy 2: Sequential blocks (List-I block ... List-II block) ──
  const isList2Header = (line: string) =>
    /^(?:सूची|List|Column)\s*[-–—:\s]*(?:II|2|B)\b(?!.*(?:को|से|with|and|from|सुमेलित))/i.test(line);

  let splitIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isList2Header(lines[i])) {
      splitIdx = i;
      break;
    }
  }

  if (splitIdx !== -1) {
    const part1Lines = lines.slice(0, splitIdx);
    const part2Lines = lines.slice(splitIdx);

    const itemRegex =
      /^(?:(?:(?:\(([A-Ea-e\divxlc\u0915-\u0918]+)\)|([A-Ea-e\divxlc\u0915-\u0918]+)\s*[.)\-:]))|([\divxlc]+)\s*[.)\-:]|\(([\divxlc]+)\))\s*(.*)/i;

    const extractFromLines = (arr: string[]): MatchListItem[] => {
      const items: MatchListItem[] = [];
      for (const line of arr) {
        if (/^(?:सूची|List|Column|कूट|Codes)/i.test(line)) continue;
        const m = line.match(itemRegex);
        if (m) {
          const id = (m[1] || m[2] || m[3] || m[4] || "").trim();
          const itemText = (m[5] || "").trim();
          if (itemText) items.push({ id, text: itemText });
        }
      }
      return items;
    };

    const seqLeft = extractFromLines(part1Lines);
    const seqRight = extractFromLines(part2Lines);

    if (seqLeft.length >= 2 || seqRight.length >= 2) {
      return { left: seqLeft, right: seqRight, ...titles };
    }
  }

  return { left: [], right: [] };
}

/** Converts a raw minified AI output question object to standard QuestionInput.
 *  Handles both minified keys (q/o/a/e/t) and full keys (questionText/options/etc.).
 */
/** Converts a raw AI output question object to standard QuestionInput.
 *  Handles both the new Gemini JSON format (question/options/answer/sourceType/exam/explanation),
 *  the minified format (q/o/a/e/t), and standard format (questionText/options/correctAnswer/etc.).
 */
export function normalizeMinifiedQuestion(rawInput: Record<string, any>): QuestionInput | null {
  if (!rawInput || typeof rawInput !== "object") return null;

  try {
    const raw = sanitizeLlmArtifacts(rawInput);
    const questionText: string = String(raw.question ?? raw.questionText ?? raw.q ?? "").trim();
    if (!questionText) return null;

    // Options: string[] or {id, text}[]
    let options: { id: string; text: string }[] = [];
    const rawOptions = raw.options ?? raw.o;
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

    // Filter non-empty options
    options = options.filter(o => o.text.length > 0);

    const isAiFormat = ("q" in raw) || ("question" in raw) || ("sourceType" in raw);
    if (isAiFormat && options.length !== 4) return null;
    if (options.length < 2) return null;

    const allOptionText = options.map((o) => o.text.trim().toLowerCase());
    if (new Set(allOptionText).size !== allOptionText.length) return null;

    // Correct answer: integer index (0-3), option ID string ("opt1", "A"), or array
    let correctAnswer: string | string[] = "opt1";
    const rawAnswer = raw.answer !== undefined ? raw.answer : raw.a !== undefined ? raw.a : raw.correctAnswer;
    if (typeof rawAnswer === "number") {
      if (!Number.isInteger(rawAnswer)) return null;
      if (rawAnswer < 0 || rawAnswer > 3) return null;
      correctAnswer = MINIFIED_INDEX_TO_OPT[rawAnswer] ?? `opt${rawAnswer + 1}`;
    } else if (typeof rawAnswer === "string") {
      const trimmed = rawAnswer.trim();
      const upper = trimmed.toUpperCase();
      if (upper === "A" || upper === "1") correctAnswer = "opt1";
      else if (upper === "B" || upper === "2") correctAnswer = "opt2";
      else if (upper === "C" || upper === "3") correctAnswer = "opt3";
      else if (upper === "D" || upper === "4") correctAnswer = "opt4";
      else if (upper === "E" || upper === "5") correctAnswer = "opt5";
      else if (/^[0-3]$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        correctAnswer = MINIFIED_INDEX_TO_OPT[num] ?? `opt${num + 1}`;
      } else correctAnswer = trimmed;
    } else if (Array.isArray(rawAnswer)) {
      correctAnswer = rawAnswer.map(String);
    }

    // Type: map minified or legacy type to canonical
    const rawType: string = String(raw.t ?? raw.type ?? "mcq").toLowerCase().trim();
    const type: AcceptedQuestionType = MINIFIED_TYPE_MAP[rawType] ?? "mcq";

    const explanation: string | undefined =
      (raw.explanation !== undefined && raw.explanation !== null ? String(raw.explanation).trim() : undefined) ??
      (raw.e !== undefined && raw.e !== null ? String(raw.e).trim() : undefined);

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
            ...(extracted.leftTitle ? { leftTitle: extracted.leftTitle } : {}),
            ...(extracted.rightTitle ? { rightTitle: extracted.rightTitle } : {}),
          };
        } else {
          meta = { ...(meta || {}), left: [], right: [] };
        }
      }
    }

    // ── PYQ Provenance capture ───────────────────────────────────────────────
    // Extract optional provenance fields from AI output and store in meta.
    // Accepted sourceType values: "PYQ" | "PYQ_MODIFIED" | "AI_NEW" (and backward compat "PYQ_EXACT")
    const VALID_SOURCE_TYPES = new Set(["PYQ", "PYQ_EXACT", "PYQ_MODIFIED", "AI_NEW"]);
    const rawSourceType = raw.sourceType != null ? String(raw.sourceType).trim() : undefined;
    const sourceType = rawSourceType && VALID_SOURCE_TYPES.has(rawSourceType)
      ? (rawSourceType === "PYQ_EXACT" ? "PYQ" : (rawSourceType as "PYQ" | "PYQ_MODIFIED" | "AI_NEW"))
      : undefined;

    // sourceQuestionId must be a positive integer and only belongs to PYQ questions
    const rawSourceId = raw.sourceQuestionId ?? raw.id;
    const isPyqSource = sourceType === "PYQ" || sourceType === "PYQ_MODIFIED";
    const sourceQuestionId =
      isPyqSource && typeof rawSourceId === "number" && Number.isInteger(rawSourceId) && rawSourceId > 0
        ? rawSourceId
        : isPyqSource && typeof rawSourceId === "string" && /^\d+$/.test(rawSourceId.trim())
          ? parseInt(rawSourceId.trim(), 10)
          : undefined;

    // exam: only attach if it came from a PYQ (never for AI_NEW) and not null/fake
    const rawExam = raw.exam != null ? String(raw.exam).trim() : undefined;
    const isFake = !rawExam || rawExam.toLowerCase() === "null" || rawExam.toLowerCase() === "unknown" || rawExam.toLowerCase() === "unknown exam" || rawExam.toLowerCase() === "practice exam" || rawExam.toLowerCase() === "mock exam";
    const examVerified = rawExam && isPyqSource && !isFake ? rawExam : undefined;

    if (sourceType || sourceQuestionId !== undefined || examVerified) {
      meta = {
        ...(meta || {}),
        ...(sourceType ? { sourceType } : {}),
        ...(sourceQuestionId !== undefined ? { sourceQuestionId } : {}),
        ...(examVerified ? { exam: examVerified } : {}),
      };
    }

    // ── Reference field: human-readable attribution ──────────────────────────
    const explicitReference = raw.reference ? String(raw.reference).trim() : undefined;
    let computedReference: string | undefined = explicitReference;

    if (!computedReference && sourceType) {
      if (examVerified) {
        computedReference = `📌 ${sourceType} — ${examVerified}`;
      } else if (sourceType !== "AI_NEW") {
        computedReference = `📌 ${sourceType}`;
      }
    }

    return {
      type,
      questionText,
      options,
      correctAnswer,
      explanation: explanation || undefined,
      reference: computedReference || undefined,
      difficulty,
      meta,
    };
  } catch {
    return null;
  }
}

/**
 * Validates whether an imported batch meets the Gemini 20-question composition contract:
 * Exactly 20 questions = 14 PYQ + 4 PYQ_MODIFIED + 2 AI_NEW.
 */
export function validateGeminiComposition(questions: QuestionInput[]): {
  total: number;
  pyqCount: number;
  pyqModifiedCount: number;
  aiNewCount: number;
  isValid20: boolean;
  warnings: string[];
} {
  let pyqCount = 0;
  let pyqModifiedCount = 0;
  let aiNewCount = 0;

  for (const q of questions) {
    const st = q.meta?.sourceType;
    if (st === "PYQ" || st === "PYQ_EXACT") pyqCount++;
    else if (st === "PYQ_MODIFIED") pyqModifiedCount++;
    else if (st === "AI_NEW") aiNewCount++;
  }

  const warnings: string[] = [];
  if (questions.length !== 20) {
    warnings.push(`कुल प्रश्न: ${questions.length} (अपेक्षित: ठीक 20 प्रश्न)`);
  }
  if (pyqCount !== 14) {
    warnings.push(`PYQ: ${pyqCount} (अपेक्षित: ठीक 14 PYQ)`);
  }
  if (pyqModifiedCount !== 4) {
    warnings.push(`PYQ_MODIFIED: ${pyqModifiedCount} (अपेक्षित: ठीक 4 PYQ_MODIFIED)`);
  }
  if (aiNewCount !== 2) {
    warnings.push(`AI_NEW: ${aiNewCount} (अपेक्षित: ठीक 2 AI_NEW)`);
  }

  return {
    total: questions.length,
    pyqCount,
    pyqModifiedCount,
    aiNewCount,
    isValid20: questions.length === 20 && pyqCount === 14 && pyqModifiedCount === 4 && aiNewCount === 2,
    warnings,
  };
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
    const sanitized = sanitizeLlmArtifacts(val);
    const normalized = normalizeMinifiedQuestion(sanitized as Record<string, any>);
    if (normalized) return normalized;
    return sanitized;
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
