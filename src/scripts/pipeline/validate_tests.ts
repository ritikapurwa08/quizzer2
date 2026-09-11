import fs from "fs";
import path from "path";
import { validateQuestionBank, QuestionForValidation } from "../../lib/questionQualityValidator";
import { isFakeExam } from "../../components/quiz/QuestionSourceMeta";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const PREPARED_DIR = path.join(XDATA_DIR, "prepared_tests");

export interface PreparedQuestion {
  type: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  sourceType: "PYQ" | "PYQ_MODIFIED" | "AI_NEW";
  exam?: string;
  sourceQuestionId?: number;
  reference?: string;
}

export interface PreparedTestSet {
  subject: string;
  subjectSlug: string;
  topic: string;
  topicSlug: string;
  testSetName: string;
  negativeMarking: boolean;
  questionCount: number;
  questions: PreparedQuestion[];
}

export function validateTestSet(testSet: PreparedTestSet, _fileName?: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check basic headers
  if (!testSet.subject?.trim()) errors.push("Missing subject");
  if (!testSet.topic?.trim()) errors.push("Missing topic");
  if (!testSet.testSetName?.trim()) errors.push("Missing testSetName");

  // 2. Exact question count contract
  if (testSet.questions.length !== 10) {
    errors.push(`Exact count contract failed: Expected 10 questions, got ${testSet.questions.length}`);
  }

  // 3. Exact 7:2:1 ratio contract
  let pyqCount = 0;
  let modCount = 0;
  let aiCount = 0;

  testSet.questions.forEach((q, idx) => {
    const qNum = idx + 1;
    if (q.sourceType === "PYQ") pyqCount++;
    else if (q.sourceType === "PYQ_MODIFIED") modCount++;
    else if (q.sourceType === "AI_NEW") aiCount++;
    else errors.push(`Q${qNum}: Invalid sourceType "${q.sourceType}"`);

    // Options check
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Q${qNum}: Must have exactly 4 options (found ${q.options?.length || 0})`);
    }

    // Answer check
    const validOptIds = q.options?.map((o) => o.id) || [];
    if (!validOptIds.includes(q.correctAnswer)) {
      errors.push(`Q${qNum}: correctAnswer "${q.correctAnswer}" not in options [${validOptIds.join(", ")}]`);
    }

    // Question stem check
    if (!q.questionText || q.questionText.trim().length < 10) {
      errors.push(`Q${qNum}: Question text is too short or empty`);
    }

    // Fake exam check
    if (q.exam && isFakeExam(q.exam)) {
      errors.push(`Q${qNum}: Fake or prohibited exam string "${q.exam}"`);
    }

    // AI_NEW exam check
    if (q.sourceType === "AI_NEW" && q.exam) {
      errors.push(`Q${qNum}: AI_NEW must not have an exam attached`);
    }

    // Topic relevance: ensure question stem is non-empty and not completely blank
    if (/^[\s\d.?-]+$/.test(q.questionText)) {
      errors.push(`Q${qNum}: Question text contains only numbers or punctuation`);
    }
  });

  if (pyqCount !== 7 || modCount !== 2 || aiCount !== 1) {
    errors.push(`7:2:1 contract violation: Expected 7 PYQ, 2 PYQ_MODIFIED, 1 AI_NEW. Got PYQ: ${pyqCount}, MOD: ${modCount}, AI: ${aiCount}`);
  }

  // 4. Run question quality validator for duplicates, position bias, etc.
  const validationQuestions: QuestionForValidation[] = testSet.questions.map((q) => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    type: q.type,
    difficulty: q.difficulty,
    explanation: q.explanation,
    sourceType: q.sourceType,
    exam: q.exam,
    sourceQuestionId: q.sourceQuestionId,
    meta: {
      sourceType: q.sourceType,
      exam: q.exam,
      sourceQuestionId: q.sourceQuestionId,
    },
  }));

  const report = validateQuestionBank(validationQuestions);
  for (const issue of report.issues) {
    if (issue.severity === "error") {
      errors.push(`Quality Validator Error [${issue.code}]: ${issue.message}`);
    } else {
      warnings.push(`Quality Validator Warning [${issue.code}]: ${issue.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1]?.replace(/^["']|["']$/g, "");
  const fileArg = args.find((a) => a.startsWith("--file="))?.split("=")[1]?.replace(/^["']|["']$/g, "");

  console.log("=== Quizzer2 — Test Set Validation Suite ===");

  if (!fs.existsSync(PREPARED_DIR)) {
    console.error(`Prepared tests directory not found: ${PREPARED_DIR}`);
    console.log("Please run 'bun run prepare:tests' first.");
    process.exit(1);
  }

  let files = fs.readdirSync(PREPARED_DIR).filter((f) => f.endsWith(".json"));

  if (fileArg) {
    files = files.filter((f) => f.includes(fileArg) || f === fileArg);
  }

  if (topicArg) {
    const normArg = topicArg.replace(/[\s_-]+/g, "").toLowerCase();
    files = files.filter((f) => {
      const normF = f.replace(/[\s_-]+/g, "").toLowerCase();
      return normF.includes(normArg);
    });
  }

  if (files.length === 0) {
    console.warn("No prepared test files found matching criteria.");
    process.exit(0);
  }

  console.log(`Validating ${files.length} test set file(s)...\n`);

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const fullPath = path.join(PREPARED_DIR, file);
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      const testSet: PreparedTestSet = JSON.parse(content);

      const result = validateTestSet(testSet, file);

      if (result.isValid) {
        console.log(`✅ PASS: [${file}] — "${testSet.topic}" (10 Qs: 7 PYQ, 2 MOD, 1 AI)`);
        if (result.warnings.length > 0) {
          result.warnings.forEach((w) => console.log(`   ⚠️  ${w}`));
        }
        passed++;
      } else {
        console.error(`❌ FAIL: [${file}] — "${testSet.topic}"`);
        result.errors.forEach((err) => console.error(`   ❌  ${err}`));
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ CRITICAL ERROR parsing [${file}]:`, err.message);
      failed++;
    }
  }

  console.log(`\n=== Validation Summary ===`);
  console.log(`Total: ${files.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.error("\n[FAIL CLOSED] Validation failed. Data must NOT be imported to production until errors are resolved.");
    process.exit(1);
  } else {
    console.log("\n[PASS] All test sets satisfy 7:2:1 contract, valid schema, quality checks, and real exam rules.");
  }
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Validation execution failed:", err);
    process.exit(1);
  });
}
