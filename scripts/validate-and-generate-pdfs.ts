import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrintableAssessmentReport, EvaluatedQuestionItem } from "../src/components/quiz/pdf/PrintableAssessmentReport";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// 1. Load actual questions from convex-tenses-questions.json
const rawQuestions = JSON.parse(
  fs.readFileSync("scripts/convex-tenses-questions.json", "utf8")
);

// Read compiled CSS and globals.css
const chunkCss = fs.readFileSync(".next/static/chunks/2qh-vpgttwl47.css", "utf8");
const globalsCss = fs.readFileSync("src/app/globals.css", "utf8");

const outputDir = path.resolve("test_output_pdfs");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function wrapHtml(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="bg-white">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800;900&display=swap');
    ${chunkCss}
    ${globalsCss}
    /* Ensure visible in both screen and print for test evaluation */
    #printable-assessment-report {
      display: block !important;
    }
  </style>
</head>
<body class="bg-white text-slate-900 m-0 p-0">
  ${content}
</body>
</html>`;
}

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function generatePdf(htmlFilename: string, pdfFilename: string, title: string, element: React.ReactElement): { pageCount: number; sizeBytes: number } {
  const htmlContent = wrapHtml(renderToStaticMarkup(element), title);
  const htmlPath = path.join(outputDir, htmlFilename);
  const pdfPath = path.join(outputDir, pdfFilename);

  fs.writeFileSync(htmlPath, htmlContent, "utf8");

  const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
  execSync(
    `"${chrome}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfPath}" "${fileUrl}"`,
    { stdio: "inherit" }
  );

  const pngPath = pdfPath.replace(/\.pdf$/, ".png");
  try {
    execSync(
      `"${chrome}" --headless --disable-gpu --screenshot="${pngPath}" --window-size=1240,1754 "${fileUrl}"`,
      { stdio: "pipe" }
    );
  } catch (e) {}

  const stats = fs.statSync(pdfPath);

  // Parse PDF to check exact page count (matches /Type /Page or count in PDF trailer)
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfText = pdfBuffer.toString("binary");
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 1;

  console.log(`[Generated] ${pdfFilename} -> Pages: ${pageCount}, Size: ${stats.size} bytes`);
  return { pageCount, sizeBytes: stats.size };
}

// ─────────────────────────────────────────────────────────────
// SCENARIO 1: Incorrect-questions report (6 questions)
// Expected: 2 pages (Page 1 has 4 questions, Page 2 has 2 questions)
// ─────────────────────────────────────────────────────────────
const scenario1Questions: EvaluatedQuestionItem[] = rawQuestions.slice(0, 6).map((q: any, i: number) => {
  const wrongOpt = q.options.find((o: any) => o.id !== q.correctAnswer) || q.options[1];
  return {
    question: q,
    answer: { selected: wrongOpt.id, isCorrect: false },
    status: "incorrect" as const,
    originalIndex: i,
  };
});

const scenario1 = React.createElement(PrintableAssessmentReport, {
  testSetName: "Tenses & Sequence of Tenses - Practice Set 01",
  subjectName: "General English",
  topicName: "Tenses & Time Markers",
  examReference: "RPSC Senior Teacher (Grade II) Exam 2024",
  score: -4.0,
  totalQuestions: 6,
  correctCount: 0,
  incorrectCount: 6,
  unansweredCount: 0,
  submittedAt: Date.now() - 3600000,
  filterLabel: "Mistake Revision Sheet (Incorrect Only)",
  questions: scenario1Questions,
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 2: All-questions report (20 questions)
// Expected: 5 pages (4 questions per page × 5 pages)
// ─────────────────────────────────────────────────────────────
const scenario2Questions: EvaluatedQuestionItem[] = rawQuestions.slice(0, 20).map((q: any, i: number) => {
  const isCorrect = i % 3 !== 0;
  const isSkipped = i === 18 || i === 19;
  const wrongOpt = q.options.find((o: any) => o.id !== q.correctAnswer) || q.options[1];

  if (isSkipped) {
    return {
      question: q,
      answer: { selected: undefined, isCorrect: false },
      status: "unanswered" as const,
      originalIndex: i,
    };
  }

  return {
    question: q,
    answer: {
      selected: isCorrect ? q.correctAnswer : wrongOpt.id,
      isCorrect,
    },
    status: isCorrect ? ("correct" as const) : ("incorrect" as const),
    originalIndex: i,
  };
});

const correct2 = scenario2Questions.filter((q) => q.status === "correct").length;
const incorrect2 = scenario2Questions.filter((q) => q.status === "incorrect").length;
const skipped2 = scenario2Questions.filter((q) => q.status === "unanswered").length;
const score2 = correct2 * 2 - (incorrect2 * 2) / 3;

const scenario2 = React.createElement(PrintableAssessmentReport, {
  testSetName: "English Grammar Comprehensive - Tenses & Structures",
  subjectName: "General English (Paper-II)",
  topicName: "Tenses, Voice & Concord",
  examReference: "Competitive Examination 2024",
  score: score2,
  totalQuestions: 20,
  correctCount: correct2,
  incorrectCount: incorrect2,
  unansweredCount: skipped2,
  submittedAt: Date.now() - 7200000,
  filterLabel: "Complete Question Review",
  questions: scenario2Questions,
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 3: Report containing only 1 or 2 questions (2 questions)
// Expected: Exactly 1 page
// ─────────────────────────────────────────────────────────────
const scenario3Questions: EvaluatedQuestionItem[] = rawQuestions.slice(0, 2).map((q: any, i: number) => ({
  question: q,
  answer: { selected: q.correctAnswer, isCorrect: true },
  status: "correct" as const,
  originalIndex: i,
}));

const scenario3 = React.createElement(PrintableAssessmentReport, {
  testSetName: "Quick Concept Drill - Set 01",
  subjectName: "General English",
  topicName: "Tenses Spotting",
  score: 4.0,
  totalQuestions: 2,
  correctCount: 2,
  incorrectCount: 0,
  unansweredCount: 0,
  submittedAt: Date.now(),
  filterLabel: "Correct Answers Only",
  questions: scenario3Questions,
});

// ─────────────────────────────────────────────────────────────
// SCENARIO 4: Report with long questions and lengthy explanations
// ─────────────────────────────────────────────────────────────
const longQuestions = rawQuestions.filter((q: any) => q.explanation && q.explanation.length > 250);
const scenario4Questions: EvaluatedQuestionItem[] = (longQuestions.length >= 4 ? longQuestions.slice(0, 4) : rawQuestions.slice(0, 4)).map((q: any, i: number) => {
  const isCorrect = i % 2 === 0;
  const wrongOpt = q.options.find((o: any) => o.id !== q.correctAnswer) || q.options[0];
  return {
    question: {
      ...q,
      questionText: `Direction: Read the following complex examination scenario and choose the most appropriate tense form according to formal grammar concord:\n\n${q.questionText}`,
      explanation: `**अवधारणा / Concept**: ${q.explanation}\n\n**विकल्प विश्लेषण / Elimination Logic**: Option (A) is incorrect due to tense disagreement. Option (B) confuses past perfect with simple past. The official answer key confirms the standard rule for past actions completed prior to reference time.`,
    },
    answer: {
      selected: isCorrect ? q.correctAnswer : wrongOpt.id,
      isCorrect,
    },
    status: isCorrect ? ("correct" as const) : ("incorrect" as const),
    originalIndex: i,
  };
});

const scenario4 = React.createElement(PrintableAssessmentReport, {
  testSetName: "Advanced Verbal Ability & Concord Analysis",
  subjectName: "English Language & Pedagogy",
  topicName: "Advanced Tense Synthesis",
  examReference: "State Level Teacher Eligibility / Senior Grade",
  score: 4.67,
  totalQuestions: 4,
  correctCount: 2,
  incorrectCount: 2,
  unansweredCount: 0,
  submittedAt: Date.now(),
  filterLabel: "Complete Question Review",
  questions: scenario4Questions,
});

console.log("=== Generating All 4 Validation Reports ===");
const res1 = generatePdf("scenario_1_incorrect_6q.html", "scenario_1_incorrect_6q.pdf", "Scenario 1: 6 Incorrect Questions", scenario1);
const res2 = generatePdf("scenario_2_all_20q.html", "scenario_2_all_20q.pdf", "Scenario 2: 20 Questions", scenario2);
const res3 = generatePdf("scenario_3_small_2q.html", "scenario_3_small_2q.pdf", "Scenario 3: 2 Questions", scenario3);
const res4 = generatePdf("scenario_4_long_questions.html", "scenario_4_long_questions.pdf", "Scenario 4: Long Questions", scenario4);

console.log("\n=== Validation Results Summary ===");
console.log(`Scenario 1 (6 questions): ${res1.pageCount} pages (Expected: 2) -> ${res1.pageCount === 2 ? "PASS ✓" : "FAIL ✕"}`);
console.log(`Scenario 2 (20 questions): ${res2.pageCount} pages (Expected: 5) -> ${res2.pageCount === 5 ? "PASS ✓" : "FAIL ✕"}`);
console.log(`Scenario 3 (2 questions): ${res3.pageCount} pages (Expected: 1) -> ${res3.pageCount === 1 ? "PASS ✓" : "FAIL ✕"}`);
console.log(`Scenario 4 (4 long questions): ${res4.pageCount} pages (Expected: 1) -> ${res4.pageCount === 1 ? "PASS ✓" : "FAIL ✕"}`);
