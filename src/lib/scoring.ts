/**
 * Authoritative Canonical Scoring Engine for Quizzer
 * 
 * Rules:
 * - 2 marks per question by default (configurable per test).
 * - Canonical negative marking: 1/3 penalty of question marks per incorrect answer.
 *   For a 2-mark question:
 *     Correct: +2
 *     Incorrect: -2/3 ≈ -0.6667
 *     Unanswered: 0
 * - Exact rational calculation is used internally to avoid floating-point drift.
 *   (e.g., 3 wrong answers of 2-mark questions lose exactly 2.0 full marks).
 */

export const DEFAULT_MARKS_PER_QUESTION = 2.0;
export const NEGATIVE_PENALTY_RATIO = 1 / 3;

export interface ScoreCalculationResult {
  /** Rounded to 2 decimal places for clean storage and display, clamped >= 0 */
  score: number;
  /** Exact unrounded raw score (can be negative before clamp if desired) */
  rawScore: number;
  /** Marks earned for correct answers */
  positiveMarks: number;
  /** Marks lost to negative penalty */
  penaltyMarks: number;
  /** Positive marks per question */
  marksPerQuestion: number;
  /** Penalty per incorrect answer (e.g. 2/3 = 0.6666...) */
  penaltyPerWrong: number;
  /** Display string for UI breakdown e.g. "0.66" */
  penaltyPerWrongDisplay: string;
  /** Maximum possible score for the test */
  maxPossibleScore: number;
}

export function calculateQuestionScore(params: {
  correctCount: number;
  wrongCount: number;
  totalQuestions?: number;
  marksPerQuestion?: number;
  negativeMarkingEnabled?: boolean;
}): ScoreCalculationResult {
  const marksPerQ = params.marksPerQuestion ?? DEFAULT_MARKS_PER_QUESTION;
  const isNegativeMarking = params.negativeMarkingEnabled !== false;

  const positiveMarks = params.correctCount * marksPerQ;
  // Rational negative marking: (wrongCount * marksPerQ) / 3
  const penaltyMarks = isNegativeMarking ? (params.wrongCount * marksPerQ) / 3 : 0;
  const rawScore = positiveMarks - penaltyMarks;
  const finalScore = Math.max(0, Number(rawScore.toFixed(2)));

  const totalQ = params.totalQuestions ?? (params.correctCount + params.wrongCount);
  const maxPossibleScore = totalQ * marksPerQ;

  const penaltyPerWrong = isNegativeMarking ? marksPerQ / 3 : 0;
  const penaltyPerWrongDisplay = isNegativeMarking ? (marksPerQ / 3).toFixed(2) : "0";

  return {
    score: finalScore,
    rawScore,
    positiveMarks,
    penaltyMarks: Number(penaltyMarks.toFixed(2)),
    marksPerQuestion: marksPerQ,
    penaltyPerWrong,
    penaltyPerWrongDisplay,
    maxPossibleScore,
  };
}
