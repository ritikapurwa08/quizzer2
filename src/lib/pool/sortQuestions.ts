/**
 * Canonical sorting logic for Rajasthan GK Question Pool.
 *
 * Priority Hierarchy:
 * 1. Tier 1 (Exam Questions with Year):
 *    - Valid numeric year (>= 1950) sorted DESCENDING (latest exam first: 2026 -> 2025 -> 2024 -> ...).
 * 2. Tier 2 (Exam Questions without Year):
 *    - Has non-empty exam string, but year is null.
 * 3. Tier 3 (Non-Exam / General Questions):
 *    - Has neither exam nor year. Placed at the very end.
 *
 * Tie-breaker:
 * - Within the same tier and same year: deterministic alphabetical order by ID (e.g., rg_000001 < rg_000002).
 */

export interface SortableQuestion {
  id: string;
  year?: number | null;
  exam?: string | null;
  [key: string]: any;
}

export function parseYear(year: unknown): number | null {
  if (typeof year === "number" && !isNaN(year) && year >= 1950 && year <= 2099) {
    return year;
  }
  if (typeof year === "string") {
    const parsed = parseInt(year.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1950 && parsed <= 2099) {
      return parsed;
    }
  }
  return null;
}

export function hasValidExam(exam: unknown): boolean {
  if (typeof exam !== "string") return false;
  const trimmed = exam.trim().toLowerCase();
  return trimmed.length > 0 && trimmed !== "null" && trimmed !== "undefined";
}

export function getQuestionTier(q: SortableQuestion): number {
  const y = parseYear(q.year);
  if (y !== null) return 1; // Tier 1: Valid exam year
  if (hasValidExam(q.exam)) return 2; // Tier 2: Has exam name, missing year
  return 3; // Tier 3: Non-exam / General
}

export function comparePoolQuestions(a: SortableQuestion, b: SortableQuestion): number {
  const aTier = getQuestionTier(a);
  const bTier = getQuestionTier(b);

  if (aTier !== bTier) {
    return aTier - bTier; // 1 before 2, 2 before 3
  }

  // Tier 1: Latest year first (Descending)
  if (aTier === 1) {
    const aYear = parseYear(a.year)!;
    const bYear = parseYear(b.year)!;
    if (bYear !== aYear) {
      return bYear - aYear;
    }
  }

  // Deterministic tie-breaker by ID
  return String(a.id || "").localeCompare(String(b.id || ""));
}

export function sortPoolQuestions<T extends SortableQuestion>(questions: T[]): T[] {
  return [...questions].sort(comparePoolQuestions);
}
