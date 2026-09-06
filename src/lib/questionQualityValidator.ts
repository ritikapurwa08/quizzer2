/**
 * Question Quality Validator
 *
 * Deterministic checks for the 620-question dataset problems:
 *  - Duplicate / near-duplicate question stems
 *  - Answer-position bias (A/B/C/D distribution)
 *  - Option imbalance (length, structure)
 *  - Malformed questions (missing fields, wrong option count)
 *  - Difficulty distribution analysis
 *  - Citation/artifact contamination
 */

export type QuestionForValidation = {
  _id?: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  type: string;
  difficulty?: "easy" | "medium" | "hard";
  explanation?: string;
};

export type QualityIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  questionIndex?: number;
  questionId?: string;
  detail?: string;
};

export type ValidationReport = {
  totalQuestions: number;
  passedQuestions: number;
  issues: QualityIssue[];
  stats: {
    answerDistribution: Record<string, number>;
    difficultyDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    duplicateGroups: number;
    averageOptionLength: number;
    artifactCount: number;
  };
  score: number; // 0–100
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[।,.?!;:""'']/g, "")
    .replace(/\u200b/g, ""); // zero-width space
}

/** Rough similarity: returns true if stems are ≥ threshold similar */
function isSimilarStem(a: string, b: string, threshold = 0.85): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return true;

  // Fast bigram Dice coefficient
  function bigrams(s: string): Set<string> {
    const result = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) result.add(s.slice(i, i + 2));
    return result;
  }

  const ba = bigrams(na);
  const bb = bigrams(nb);
  let intersection = 0;
  ba.forEach((b) => { if (bb.has(b)) intersection++; });
  const dice = (2 * intersection) / (ba.size + bb.size);
  return dice >= threshold;
}

const ARTIFACT_PATTERN = /\[cite\s*:|\[span[_-]|<citation|```|\bsource\s*:/i;

/** Map option id to 0-based position index */
function getAnswerPosition(
  options: { id: string }[],
  correctAnswer: string | string[]
): number | null {
  const answerId = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
  return options.findIndex((o) => o.id === answerId);
}

// ─── Main Validator ───────────────────────────────────────────────────────────

export function validateQuestionBank(
  questions: QuestionForValidation[]
): ValidationReport {
  const issues: QualityIssue[] = [];
  const answerDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, "?": 0 };
  const difficultyDistribution: Record<string, number> = { easy: 0, medium: 0, hard: 0, unknown: 0 };
  const typeDistribution: Record<string, number> = {};
  let duplicateGroups = 0;
  let totalOptionLength = 0;
  let totalOptionCount = 0;
  let artifactCount = 0;

  const seenStems: { normalized: string; original: string; index: number; id?: string }[] = [];
  const duplicatedIndexes = new Set<number>();

  questions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qId = q._id;
    const addIssue = (
      severity: QualityIssue["severity"],
      code: string,
      message: string,
      detail?: string
    ) =>
      issues.push({ severity, code, message, questionIndex: qNum, questionId: qId, detail });

    // ── 1. Structural completeness ─────────────────────────────────────────
    if (!q.questionText?.trim()) {
      addIssue("error", "MISSING_STEM", `प्रश्न ${qNum}: questionText गायब है।`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      addIssue(
        "error",
        "MISSING_OPTIONS",
        `प्रश्न ${qNum}: विकल्प अनुपस्थित या अपर्याप्त (${q.options?.length ?? 0} मिले, न्यूनतम 2 चाहिए)।`
      );
    }

    if (q.options?.length > 0 && q.options.length !== 4) {
      addIssue(
        "warning",
        "OPTION_COUNT",
        `प्रश्न ${qNum}: ${q.options.length} विकल्प मिले — मानक 4 होने चाहिए।`
      );
    }

    // ── 2. Artifact contamination ──────────────────────────────────────────
    const stemHasArtifact = ARTIFACT_PATTERN.test(q.questionText ?? "");
    const explanationHasArtifact = ARTIFACT_PATTERN.test(q.explanation ?? "");
    const optionsHaveArtifact = q.options?.some((o) => ARTIFACT_PATTERN.test(o.text ?? ""));

    if (stemHasArtifact || explanationHasArtifact || optionsHaveArtifact) {
      artifactCount++;
      addIssue(
        "error",
        "ARTIFACT_CONTAMINATION",
        `प्रश्न ${qNum}: [cite:], [span_], markdown या source artifact मिला — पुनः generate करें।`,
        stemHasArtifact
          ? "stem में artifact"
          : explanationHasArtifact
          ? "explanation में artifact"
          : "option में artifact"
      );
    }

    // ── 3. Answer validity ────────────────────────────────────────────────
    if (q.options?.length > 0 && q.correctAnswer !== undefined) {
      const answerId = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;
      const validIds = q.options.map((o) => o.id);
      if (!validIds.includes(answerId as string)) {
        addIssue(
          "error",
          "INVALID_ANSWER",
          `प्रश्न ${qNum}: correctAnswer "${answerId}" किसी option ID से मेल नहीं खाता।`,
          `Valid IDs: ${validIds.join(", ")}`
        );
      }
    }

    // ── 4. Answer position tracking ───────────────────────────────────────
    if (q.options?.length >= 4) {
      const pos = getAnswerPosition(q.options, q.correctAnswer);
      const posLabel = pos === 0 ? "A" : pos === 1 ? "B" : pos === 2 ? "C" : pos === 3 ? "D" : "?";
      answerDistribution[posLabel] = (answerDistribution[posLabel] ?? 0) + 1;
    }

    // ── 5. Option quality ─────────────────────────────────────────────────
    if (Array.isArray(q.options) && q.options.length >= 2) {
      // Duplicate options
      const optTexts = q.options.map((o) => normalizeText(o.text ?? ""));
      if (new Set(optTexts).size !== optTexts.length) {
        addIssue(
          "error",
          "DUPLICATE_OPTIONS",
          `प्रश्न ${qNum}: दो या अधिक options का text एक जैसा है।`
        );
      }

      // Empty option text
      q.options.forEach((o, oi) => {
        if (!o.text?.trim()) {
          addIssue("error", "EMPTY_OPTION", `प्रश्न ${qNum}: विकल्प ${oi + 1} (${o.id}) खाली है।`);
        }
      });

      // Option length imbalance
      const lengths = q.options.map((o) => (o.text ?? "").length);
      const maxLen = Math.max(...lengths);
      const minLen = Math.min(...lengths);
      lengths.forEach((l) => {
        totalOptionLength += l;
        totalOptionCount++;
      });

      // Flag if one option is 3× longer than the shortest (common answer-leak pattern)
      if (minLen > 0 && maxLen / minLen > 3 && maxLen > 40) {
        addIssue(
          "warning",
          "OPTION_LENGTH_IMBALANCE",
          `प्रश्न ${qNum}: एक option बाकी से बहुत लंबा है (max: ${maxLen} chars, min: ${minLen} chars) — उत्तर leak हो सकता है।`
        );
      }
    }

    // ── 6. Difficulty tracking ────────────────────────────────────────────
    const diff = q.difficulty ?? "unknown";
    difficultyDistribution[diff] = (difficultyDistribution[diff] ?? 0) + 1;

    // ── 7. Type tracking ──────────────────────────────────────────────────
    const type = q.type ?? "unknown";
    typeDistribution[type] = (typeDistribution[type] ?? 0) + 1;

    // ── 8. Duplicate/near-duplicate stems ────────────────────────────────
    const normalized = normalizeText(q.questionText ?? "");
    if (normalized.length > 10) {
      const matchIdx = seenStems.findIndex((s) => isSimilarStem(s.normalized, normalized));
      if (matchIdx !== -1) {
        const match = seenStems[matchIdx];
        if (!duplicatedIndexes.has(matchIdx)) {
          duplicateGroups++;
          duplicatedIndexes.add(matchIdx);
        }
        duplicatedIndexes.add(idx);
        addIssue(
          "error",
          "DUPLICATE_STEM",
          `प्रश्न ${qNum}: प्रश्न ${match.index + 1} से बहुत मिलता-जुलता है।`,
          `Q${match.index + 1}: "${(match.original ?? "").slice(0, 80)}..."`
        );
      } else {
        seenStems.push({ normalized, original: q.questionText, index: idx, id: qId });
      }
    }
  });

  // ── Global checks ─────────────────────────────────────────────────────────

  // Answer distribution bias (if > 40% of answers are at same position)
  const totalWithPos = Object.values(answerDistribution).reduce((a, b) => a + b, 0);
  if (totalWithPos >= 10) {
    Object.entries(answerDistribution).forEach(([pos, count]) => {
      if (pos === "?") return;
      const pct = Math.round((count / totalWithPos) * 100);
      if (pct > 40) {
        issues.push({
          severity: "warning",
          code: "ANSWER_POSITION_BIAS",
          message: `उत्तर position "${pos}" पर ${pct}% प्रश्नों का सही उत्तर है — यह bias है।`,
          detail: `Distribution: ${JSON.stringify(answerDistribution)}`,
        });
      }
    });
  }

  // Difficulty: warn if > 80% are "medium"
  if (questions.length >= 10) {
    const mediumPct = Math.round(
      ((difficultyDistribution.medium ?? 0) / questions.length) * 100
    );
    if (mediumPct > 80) {
      issues.push({
        severity: "warning",
        code: "DIFFICULTY_MONOTONE",
        message: `${mediumPct}% प्रश्न "medium" difficulty पर हैं — easy और hard प्रश्न जोड़ें।`,
      });
    }
  }

  // ── Score calculation ─────────────────────────────────────────────────────
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const deduction = Math.min(100, errorCount * 5 + warningCount * 2);
  const score = Math.max(0, 100 - deduction);

  const passedQuestions = questions.length - duplicatedIndexes.size - artifactCount;

  return {
    totalQuestions: questions.length,
    passedQuestions: Math.max(0, passedQuestions),
    issues,
    stats: {
      answerDistribution,
      difficultyDistribution,
      typeDistribution,
      duplicateGroups,
      averageOptionLength:
        totalOptionCount > 0
          ? Math.round(totalOptionLength / totalOptionCount)
          : 0,
      artifactCount,
    },
    score,
  };
}

// ─── Per-question quick check (used in import wizard) ────────────────────────

export type SingleQuestionIssue = {
  severity: "error" | "warning";
  message: string;
};

export function validateSingleQuestion(q: QuestionForValidation): SingleQuestionIssue[] {
  const issues: SingleQuestionIssue[] = [];

  if (!q.questionText?.trim()) {
    issues.push({ severity: "error", message: "Question text गायब है।" });
  }

  if (!Array.isArray(q.options) || q.options.length < 2) {
    issues.push({ severity: "error", message: `विकल्प अपर्याप्त (${q.options?.length ?? 0})।` });
  }

  if (Array.isArray(q.options) && q.options.length !== 4) {
    issues.push({
      severity: "warning",
      message: `${q.options.length} विकल्प मिले — 4 होने चाहिए।`,
    });
  }

  if (Array.isArray(q.options) && q.options.length >= 2) {
    const texts = q.options.map((o) => normalizeText(o.text ?? ""));
    if (new Set(texts).size !== texts.length) {
      issues.push({ severity: "error", message: "Duplicate option texts मिले।" });
    }

    q.options.forEach((o, i) => {
      if (!o.text?.trim()) {
        issues.push({ severity: "error", message: `Option ${i + 1} (${o.id}) खाली है।` });
      }
    });

    const answerId = Array.isArray(q.correctAnswer)
      ? q.correctAnswer[0]
      : q.correctAnswer;
    if (!q.options.map((o) => o.id).includes(answerId as string)) {
      issues.push({
        severity: "error",
        message: `correctAnswer "${answerId}" options में नहीं मिला।`,
      });
    }
  }

  if (ARTIFACT_PATTERN.test(q.questionText ?? "") ||
      ARTIFACT_PATTERN.test(q.explanation ?? "") ||
      q.options?.some((o) => ARTIFACT_PATTERN.test(o.text ?? ""))) {
    issues.push({
      severity: "error",
      message: "Citation/artifact ([cite:], markdown, source:) मिला — regenerate करें।",
    });
  }

  return issues;
}

// ─── Utility: format report as readable summary ───────────────────────────────

export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push(`═══════════════════════════════════════`);
  lines.push(`  Question Quality Report`);
  lines.push(`═══════════════════════════════════════`);
  lines.push(`  Total questions : ${report.totalQuestions}`);
  lines.push(`  Score           : ${report.score}/100`);
  lines.push(`  Errors          : ${report.issues.filter((i) => i.severity === "error").length}`);
  lines.push(`  Warnings        : ${report.issues.filter((i) => i.severity === "warning").length}`);
  lines.push(`  Duplicate groups: ${report.stats.duplicateGroups}`);
  lines.push(`  Artifact issues : ${report.stats.artifactCount}`);
  lines.push(``);

  lines.push(`  Answer Distribution:`);
  Object.entries(report.stats.answerDistribution).forEach(([pos, count]) => {
    const pct = Math.round((count / Math.max(report.totalQuestions, 1)) * 100);
    lines.push(`    ${pos}: ${count} (${pct}%)`);
  });

  lines.push(``);
  lines.push(`  Difficulty:`);
  Object.entries(report.stats.difficultyDistribution).forEach(([d, count]) => {
    const pct = Math.round((count / Math.max(report.totalQuestions, 1)) * 100);
    lines.push(`    ${d}: ${count} (${pct}%)`);
  });

  lines.push(``);

  if (report.issues.length === 0) {
    lines.push(`  ✓ No issues found.`);
  } else {
    lines.push(`  Issues:`);
    report.issues.slice(0, 50).forEach((issue) => {
      const prefix = issue.severity === "error" ? "✗" : "⚠";
      lines.push(`  ${prefix} [${issue.code}] ${issue.message}`);
      if (issue.detail) lines.push(`      ${issue.detail}`);
    });
    if (report.issues.length > 50) {
      lines.push(`  ... और ${report.issues.length - 50} और issues।`);
    }
  }

  lines.push(`═══════════════════════════════════════`);
  return lines.join("\n");
}
