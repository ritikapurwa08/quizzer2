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
 * For match_following (and similar list-based) questions, questionText often contains
 * both the instruction prompt and the raw text lists (List I / List II / सूची-I / सूची-II).
 * This function strips out the embedded raw text lists so only the clean instruction prompt is shown above the rendered boxes.
 */
export function cleanQuestionPrompt(text: string, type?: string): string {
  if (!text) return "";
  if (type && type !== "match_following" && type !== "match") {
    return text;
  }

  // 1. Look for the start of List-I / सूची-I / List 1 / Column A header
  const listHeaderRegex = /(?:\r?\n|^)\s*(?:सूची|List|Column)\s*[-–—:]?\s*(?:I{1,3}|[12]|[AB])\b/i;
  const match = text.match(listHeaderRegex);

  if (match && match.index !== undefined) {
    const mainPrompt = text.slice(0, match.index).trim();
    if (mainPrompt) return mainPrompt;
  }

  // 2. Fallback: If no explicit header, check if lines start with list item bullets (A., B., 1., 2., etc.)
  const lines = text.split(/\r?\n/);
  const promptLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /^(?:(?:[A-D1-4][\.\):])|(?:\([A-D1-4]\))|(?:सूची|List|Column))\s+/i.test(trimmed)
    ) {
      break;
    }
    promptLines.push(line);
  }

  return promptLines.join("\n").trim();
}

/**
 * Intelligently shuffles options and balances correct answer distribution (A, B, C, D)
 * across an entire set of questions, eliminating repetitive answer keys (e.g. A-A-A-A).
 */
export function distributeAndShuffleAnswers<T extends {
  type: string;
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  [key: string]: any;
}>(questions: T[]): {
  shuffledQuestions: T[];
  distribution: { opt1: number; opt2: number; opt3: number; opt4: number };
} {
  if (!questions || questions.length === 0) {
    return { shuffledQuestions: [], distribution: { opt1: 0, opt2: 0, opt3: 0, opt4: 0 } };
  }

  const distribution = { opt1: 0, opt2: 0, opt3: 0, opt4: 0 };
  const targetSlots = [0, 1, 2, 3]; // 0=opt1 (A), 1=opt2 (B), 2=opt3 (C), 3=opt4 (D)

  // Generate a pseudo-random balanced sequence of target slots for the question set
  const balancedSlots: number[] = [];
  let lastSlot = -1;

  while (balancedSlots.length < questions.length) {
    // Shuffle slots
    const round = [...targetSlots].sort(() => Math.random() - 0.5);
    // Prevent immediate repeat at boundary
    if (round[0] === lastSlot && round.length > 1) {
      const temp = round[0];
      round[0] = round[1];
      round[1] = temp;
    }
    for (const slot of round) {
      if (balancedSlots.length < questions.length) {
        balancedSlots.push(slot);
        lastSlot = slot;
      }
    }
  }

  const shuffledQuestions = questions.map((q, idx) => {
    // Only shuffle single-choice options with 4 options
    if (
      (q.type === "mcq" || q.type === "true_false" || q.type === "assertion" || q.type === "match") &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correctAnswer === "string"
    ) {
      const currentOptions = [...q.options];
      const correctOptIndex = currentOptions.findIndex((o) => o.id === q.correctAnswer);

      if (correctOptIndex !== -1) {
        const correctOpt = currentOptions[correctOptIndex];
        const distractors = currentOptions.filter((_, i) => i !== correctOptIndex);
        // Shuffle distractors
        distractors.sort(() => Math.random() - 0.5);

        const targetIndex = balancedSlots[idx];
        const newOptionsList: { text: string }[] = [];

        let distractorIdx = 0;
        for (let i = 0; i < 4; i++) {
          if (i === targetIndex) {
            newOptionsList.push({ text: correctOpt.text });
          } else {
            newOptionsList.push({ text: distractors[distractorIdx].text });
            distractorIdx++;
          }
        }

        // Reassign clean IDs: opt1, opt2, opt3, opt4
        const finalOptions = newOptionsList.map((item, i) => ({
          id: `opt${i + 1}`,
          text: item.text,
        }));

        const newCorrectId = `opt${targetIndex + 1}`;
        distribution[newCorrectId as keyof typeof distribution]++;

        return {
          ...q,
          options: finalOptions,
          correctAnswer: newCorrectId,
        };
      }
    }

    // Default tracking for un-shuffled questions
    if (typeof q.correctAnswer === "string" && q.correctAnswer in distribution) {
      distribution[q.correctAnswer as keyof typeof distribution]++;
    }

    return { ...q };
  });

  return { shuffledQuestions, distribution };
}

