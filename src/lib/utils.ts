import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatAccuracy(accuracy: number): string {
  return `${accuracy.toFixed(1)}%`;
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(2);
}

export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Standardized display helper for Subjects.
 * Returns Hindi title if present, otherwise English title.
 * Keeps internal DB keys and slugs unchanged.
 */
export function getSubjectDisplayName(subject?: { name: string; nameHindi?: string } | null): string {
  if (!subject) return "";
  return subject.nameHindi?.trim() || subject.name || "";
}

/**
 * Standardized display helper for Topics.
 * Returns Hindi title if present, otherwise English title.
 * Keeps internal DB keys and slugs unchanged.
 */
export function getTopicDisplayName(topic?: { name: string; nameHindi?: string } | null): string {
  if (!topic) return "";
  return topic.nameHindi?.trim() || topic.name || "";
}

/**
 * Derives a display letter from a zero-based option index.
 * 0 → A, 1 → B, 2 → C, 3 → D, 4 → E, etc.
 * Also handles "opt1".."opt5" ID strings.
 */
export function getOptionLabel(indexOrId: number | string): string {
  if (typeof indexOrId === "number") {
    return String.fromCharCode(65 + indexOrId);
  }
  // Handle "opt1" → 0, "opt2" → 1, etc.
  const match = indexOrId.match(/^opt(\d+)$/);
  if (match && match[1]) {
    const idx = parseInt(match[1], 10) - 1;
    if (idx >= 0 && idx < 26) return String.fromCharCode(65 + idx);
  }
  return indexOrId;
}

function isInstructionLine(line: string): boolean {
  return /(?:सुमेलित|मिलान|कीजिए|करें|चुनिए|उत्तर|match|following|select|below|code|कूट|(?:को|से|with|and)\s*(?:सूची|List|Column))/i.test(line);
}

function isTableOrItemLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Standalone list header: e.g. "सूची-I                 सूची-II", "सूची-I:", "List-I List-II", "Column A"
  // but NOT instruction sentences like "सूची-I को सूची-II से सुमेलित कीजिए"
  if (/(?:सूची|List|Column)\s*[-–—:\s]*(?:I{1,3}|[12]|[AB])\b/i.test(trimmed)) {
    if (!isInstructionLine(trimmed)) {
      return true;
    }
  }

  // List bullet items: "A. ...", "(A) ...", "1. ...", "(i) ...", "i. ...", "(क) ..."
  if (/^(?:(?:\([A-Ea-e1-5\divxlc\u0915-\u0918]+\))|(?:[A-Ea-e1-5\divxlc\u0915-\u0918]+[\.\):]))\s+/i.test(trimmed)) {
    return true;
  }

  // Standalone "कूट:" / "Codes:"
  if (/^(?:कूट|Codes?)\s*[:=]?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * For match_following (and similar list-based) questions, questionText often contains
 * both the instruction prompt and the raw text lists (List I / List II / सूची-I / सूची-II).
 * This function strips out the embedded raw text lists so only the clean instruction prompt is shown above the rendered boxes.
 */
export function cleanQuestionPrompt(text: string, type?: string): string {
  if (!text) return "";
  if (type && type !== "match_following" && type !== "match") {
    return text;
  }

  const lines = text.split(/\r?\n/);
  const promptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isTableOrItemLine(trimmed)) {
      break;
    }
    promptLines.push(trimmed);
  }

  const promptResult = promptLines.join("\n").trim();
  return promptResult || text;
}

/**
 * Intelligently shuffles options and balances correct answer distribution
 * across an entire set of questions, eliminating repetitive answer keys.
 * Supports both 4-option and 5-option questions dynamically.
 */
export function distributeAndShuffleAnswers<T extends {
  type: string;
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  [key: string]: any;
}>(questions: T[]): {
  shuffledQuestions: T[];
  distribution: Record<string, number>;
} {
  if (!questions || questions.length === 0) {
    return { shuffledQuestions: [], distribution: { opt1: 0, opt2: 0, opt3: 0, opt4: 0, opt5: 0 } };
  }

  const distribution: Record<string, number> = { opt1: 0, opt2: 0, opt3: 0, opt4: 0, opt5: 0 };

  // Pre-compute balanced slot sequences for 4 and 5 option lengths
  function buildBalancedSlots(slotCount: number, total: number): number[] {
    const slots = Array.from({ length: slotCount }, (_, i) => i);
    const balanced: number[] = [];
    let last = -1;
    while (balanced.length < total) {
      const round = [...slots].sort(() => Math.random() - 0.5);
      if (round[0] === last && round.length > 1) {
        [round[0], round[1]] = [round[1], round[0]];
      }
      for (const slot of round) {
        if (balanced.length < total) {
          balanced.push(slot);
          last = slot;
        }
      }
    }
    return balanced;
  }

  const slots4 = buildBalancedSlots(4, questions.length);
  const slots5 = buildBalancedSlots(5, questions.length);

  const shuffledQuestions = questions.map((q, idx) => {
    const optCount = Array.isArray(q.options) ? q.options.length : 0;
    // Only shuffle single-choice MCQ-style options with 4 or 5 options
    if (
      (q.type === "mcq" || q.type === "true_false" || q.type === "assertion" || q.type === "match") &&
      (optCount === 4 || optCount === 5) &&
      typeof q.correctAnswer === "string"
    ) {
      const currentOptions = [...q.options];
      const correctOptIndex = currentOptions.findIndex((o) => o.id === q.correctAnswer);

      if (correctOptIndex !== -1) {
        const correctOpt = currentOptions[correctOptIndex];
        const distractors = currentOptions.filter((_, i) => i !== correctOptIndex);
        distractors.sort(() => Math.random() - 0.5);

        const targetIndex = optCount === 5 ? slots5[idx] : slots4[idx];
        const newOptionsList: { text: string }[] = [];

        let distractorIdx = 0;
        for (let i = 0; i < optCount; i++) {
          if (i === targetIndex) {
            newOptionsList.push({ text: correctOpt.text });
          } else {
            newOptionsList.push({ text: distractors[distractorIdx].text });
            distractorIdx++;
          }
        }

        const finalOptions = newOptionsList.map((item, i) => ({
          id: `opt${i + 1}`,
          text: item.text,
        }));

        const newCorrectId = `opt${targetIndex + 1}`;
        distribution[newCorrectId] = (distribution[newCorrectId] || 0) + 1;

        return {
          ...q,
          options: finalOptions,
          correctAnswer: newCorrectId,
        };
      }
    }

    // Default tracking for un-shuffled questions
    if (typeof q.correctAnswer === "string") {
      distribution[q.correctAnswer] = (distribution[q.correctAnswer] || 0) + 1;
    }

    return { ...q };
  });

  return { shuffledQuestions, distribution };
}

