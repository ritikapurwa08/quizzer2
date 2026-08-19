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

