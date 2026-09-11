import { describe, it, expect } from "bun:test";
import { parseQuestionSource } from "../QuestionSourceMeta";

describe("parseQuestionSource", () => {
  it("extracts plain exam reference without PYQ prefix", () => {
    const result = parseQuestionSource("Lab Assistant Exam 2026 (Science)");
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ");
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
    expect(result.badgeLabel).toBe("PYQ");
  });

  it("extracts exam from PYQ_EXACT prefixed reference", () => {
    const result = parseQuestionSource("📌 PYQ_EXACT — Lab Assistant Exam 2026 (Science)");
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ");
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
    expect(result.badgeLabel).toBe("PYQ");
  });

  it("identifies PYQ_MODIFIED prefixed reference", () => {
    const result = parseQuestionSource("PYQ_MODIFIED — Chemist 2024");
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ_MODIFIED");
    expect(result.badgeLabel).toBe("PYQ Modified");
  });

  it("extracts exam from meta.exam for PYQ", () => {
    const result = parseQuestionSource(undefined, {
      sourceType: "PYQ",
      exam: "Lab Assistant Exam 2026 (Science)",
    });
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ");
    expect(result.examReference).toBe("Lab Assistant Exam 2026 (Science)");
    expect(result.badgeLabel).toBe("PYQ");
  });

  it("handles PYQ with no exam name", () => {
    const result = parseQuestionSource("📌 PYQ_EXACT");
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ");
    expect(result.examReference).toBeUndefined();
    expect(result.badgeLabel).toBe("PYQ");
  });

  it("returns hasSource: true with AI Generated label for AI_NEW questions", () => {
    const result = parseQuestionSource(undefined, {
      sourceType: "AI_NEW",
    });
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("AI_NEW");
    expect(result.badgeLabel).toBe("AI Generated");
    expect(result.examReference).toBeUndefined();
  });

  it("returns hasSource: true with AI Generated label for reference 'AI_NEW'", () => {
    const result = parseQuestionSource("AI_NEW");
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("AI_NEW");
    expect(result.badgeLabel).toBe("AI Generated");
    expect(result.examReference).toBeUndefined();
  });

  it("filters out fake exams like 'Unknown' or 'Practice Exam'", () => {
    const result = parseQuestionSource(undefined, {
      sourceType: "PYQ",
      exam: "Unknown Exam",
    });
    expect(result.hasSource).toBe(true);
    expect(result.sourceType).toBe("PYQ");
    expect(result.examReference).toBeUndefined();
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

