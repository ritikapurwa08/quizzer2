import { describe, it, expect } from "bun:test";
import { parseQuestionSource } from "../QuestionSourceMeta";

describe("parseQuestionSource", () => {
  it("extracts plain exam reference without PYQ prefix", () => {
    const result = parseQuestionSource("Lab Assistant Exam 2026 (Science)");
    expect(result.hasSource).toBe(true);
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
  });

  it("extracts exam from PYQ_EXACT prefixed reference", () => {
    const result = parseQuestionSource("📌 PYQ_EXACT — Lab Assistant Exam 2026 (Science)");
    expect(result.hasSource).toBe(true);
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
  });

  it("extracts exam from PYQ_MODIFIED prefixed reference", () => {
    const result = parseQuestionSource("PYQ_MODIFIED — Chemist 2024");
    expect(result.hasSource).toBe(true);
    expect(result.examReference).toBe("Chemist 2024");
  });

  it("extracts exam from meta.exam", () => {
    const result = parseQuestionSource(undefined, {
      sourceType: "PYQ_EXACT",
      exam: "Lab Assistant Exam 2026 (Science)",
    });
    expect(result.hasSource).toBe(true);
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
  });

  it("handles PYQ with no exam name", () => {
    const result = parseQuestionSource("📌 PYQ_EXACT");
    expect(result.hasSource).toBe(true);
    expect(result.examReference).toBeUndefined();
  });

  it("returns hasSource: false for AI_NEW questions with no exam", () => {
    const result = parseQuestionSource(undefined, {
      sourceType: "AI_NEW",
    });
    expect(result.hasSource).toBe(false);
    expect(result.examReference).toBeUndefined();
  });

  it("returns hasSource: false for reference 'AI_NEW'", () => {
    const result = parseQuestionSource("AI_NEW");
    expect(result.hasSource).toBe(false);
  });

  it("filters out '[object Object]' or invalid strings", () => {
    const result = parseQuestionSource("[object Object]");
    expect(result.hasSource).toBe(false);
    expect(result.examReference).toBeUndefined();
  });

  it("filters out empty or undefined values", () => {
    const result = parseQuestionSource(undefined, null);
    expect(result.hasSource).toBe(false);
    expect(result.examReference).toBeUndefined();
  });
});
