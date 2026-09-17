/**
 * qa_and_dedupe_pyq.ts
 *
 * Master QA, deduplication, normalization, and batch generation pipeline
 * for the Quizzer PYQ question bank (src/xdata/new20batches).
 *
 * Outputs:
 *  - src/xdata/final_pyq_batches/<TopicName>/batch_NNN.json  (Convex-ready schema)
 *  - src/xdata/final_pyq_batches/MANIFEST_FINAL.json
 *  - qa_reports/ directory with 5 markdown reports:
 *      validation_report.md
 *      duplicate_report.md
 *      removed_question_report.md
 *      repair_report.md
 *      review_required_report.md
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const NEW20_DIR = path.join(ROOT_DIR, "src/xdata/new20batches");
const OUTPUT_DIR = path.join(ROOT_DIR, "src/xdata/final_pyq_batches");
const REPORTS_DIR = path.join(ROOT_DIR, "src/xdata/qa_reports");

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawQuestion {
  id: number;
  subject?: string;
  topic?: string;
  originalTopic?: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
  year?: number | string;
}

/** Convex-ready option */
interface ConvexOption {
  id: "opt1" | "opt2" | "opt3" | "opt4";
  text: string;
}

/** Final Convex-compatible question for a batch */
interface ConvexQuestion {
  type: "mcq";
  questionText: string;
  options: ConvexOption[];
  correctAnswer: string;
  explanation?: string;
  reference?: string;
  difficulty: "easy" | "medium" | "hard";
  order: number;
  meta: {
    sourceType: "PYQ";
    sourceQuestionId: number;
    exam?: string;
    year?: number | null;
  };
}

interface BatchFile {
  masterTopic: string;
  batchIndex: number;
  batchName: string;
  subject: string;
  subjectSlug: string;
  topicSlug: string;
  negativeMarking: boolean;
  questionCount: number;
  questions: ConvexQuestion[];
}

type QAStatus = "KEEP" | "REPAIR" | "REMOVE" | "REVIEW_REQUIRED";

interface AuditedQuestion {
  raw: RawQuestion;
  status: QAStatus;
  removeReason?: string;
  repairNotes?: string[];
  reviewReason?: string;
  finalQuestion?: ConvexQuestion; // populated for KEEP and REPAIR
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function cleanStem(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
    .trim();
}

/** Bigram-based text similarity (Dice coefficient) */
function similarity(s1: string, s2: string): number {
  const a = cleanStem(s1);
  const b = cleanStem(s2);
  if (a === b) return 1.0;
  if (a.length < 3 || b.length < 3) return 0;
  const setA = new Set<string>();
  const setB = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) setA.add(a.slice(i, i + 2));
  for (let i = 0; i < b.length - 1; i++) setB.add(b.slice(i, i + 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  setA.forEach((x) => { if (setB.has(x)) inter++; });
  return (2 * inter) / (setA.size + setB.size);
}

function isFakeExam(str?: string | null): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return (
    !lower ||
    lower === "unknown" ||
    lower === "unknown exam" ||
    lower === "practice" ||
    lower === "practice exam" ||
    lower === "null" ||
    lower === "undefined" ||
    lower === "[object object]" ||
    lower === "none" ||
    lower === "n/a"
  );
}

/** Extract year from exam string */
function extractYear(exam?: string): number | null {
  if (!exam) return null;
  const m = exam.match(/20(1[5-9]|2[0-6])/);
  return m ? parseInt("20" + m[1]) : null;
}

/** Score question for duplicate resolution: higher is better representative */
function scoreQuestion(q: RawQuestion): number {
  let score = 0;
  // Recency: each year worth 3 points
  const year = extractYear(q.exam);
  if (year) score += (year - 2014) * 3;
  // Has real exam
  if (!isFakeExam(q.exam)) score += 50;
  // Has explanation
  if (q.explanation && q.explanation.trim().length > 20) score += 20;
  // Longer explanation = richer context
  if (q.explanation) score += Math.min(q.explanation.trim().length / 50, 10);
  // Question text cleanliness (no merged words, has spaces)
  const q_text = q.question || "";
  if (/\s/.test(q_text)) score += 5;
  // RPSC/official exams get extra weight
  if (/rpsc|राजस्व मंडल|लोक सेवा/i.test(q.exam || "")) score += 10;
  return score;
}

/**
 * Clean question text:
 * - Remove leading question numbers like "Q.14 " or "14. " or "प्र.3:"
 * - Fix zero-width spaces and BOM
 * - Trim extra whitespace
 * NOTE: We deliberately do NOT alter the Hindi wording itself to preserve PYQ integrity.
 */
function cleanQuestionText(text: string): { cleaned: string; repaired: boolean; notes: string[] } {
  let s = text;
  const notes: string[] = [];
  let repaired = false;

  // Remove zero-width spaces and BOM
  if (/[\u200B-\u200D\uFEFF]/.test(s)) {
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
    notes.push("Removed zero-width spaces");
    repaired = true;
  }

  // Fix merged words between digits and Hindi: e.g. "सिंह1987से" → "सिंह 1987 से"
  const fixed1 = s.replace(/([\u0900-\u097F])(\d)/g, "$1 $2").replace(/(\d)([\u0900-\u097F])/g, "$1 $2");
  if (fixed1 !== s) {
    notes.push("Fixed merged digit-Hindi text");
    s = fixed1;
    repaired = true;
  }

  // Collapse multiple spaces/newlines
  const fixed2 = s.replace(/\s{2,}/g, " ").trim();
  if (fixed2 !== s) {
    notes.push("Collapsed multiple whitespace");
    s = fixed2;
    repaired = true;
  }

  return { cleaned: s, repaired, notes };
}

/**
 * Normalize option text:
 * - Remove leading label prefixes: (A), (a), A., 1., अ., (1), [A], etc.
 * - Remove zero-width chars
 * - Trim
 * NOTE: Does NOT strip trailing content like numbers or letters that are PART of the answer.
 * This handles the "4 स्थल" vs "स्थल" issue by being more conservative.
 */
function cleanOptionText(opt: string): string {
  if (!opt) return "";
  let s = opt;

  // Only strip well-formed leading labels: "(A) text", "A. text", "1) text", "(1) text", "[A] text"
  // Must have a delimiter (., ), ]) after the label char
  s = s
    .replace(/^[\s]*\([\s]*[अबसदa-dA-D1-4][\s]*\)[\s]+/, "") // (A) text, (1) text
    .replace(/^[\s]*\[[\s]*[अबसदa-dA-D1-4][\s]*\][\s]+/, "") // [A] text
    .replace(/^[\s]*[a-dA-D1-4][\s]*[.):][\s]+/, "") // A. text, A: text, 1. text
    .replace(/^[\s]*[अबसद][\s]*[.):][\s]+/, "") // अ. text, ब: text
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width spaces
    .trim();

  return s;
}

/** Slugify a string for use in file names / URL paths */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\w\s\u0900-\u097F-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map master topic name to subject slug/name for Convex import */
function mapSubject(topicName: string): { name: string; slug: string } {
  const t = topicName.trim();

  // Polity & Administration
  if (
    t.includes("राज्य प्रशासन") || t.includes("मंत्रिपरिषद") || t.includes("विधानमंडल") ||
    t.includes("पंचायती राज") || t.includes("लोक सेवा आयोग") || t.includes("निर्वाचन आयोग") ||
    t.includes("मानवाधिकार") || t.includes("महिला आयोग") || t.includes("लोकायुक्त") ||
    t.includes("संवैधानिक आयोग") || t.includes("अनुसंधान एवं अध्ययन") || t.includes("विज्ञान एवं प्रौद्योगिकी")
  ) {
    return { name: "राजस्थान की राजव्यवस्था", slug: "rajasthan-polity-administration" };
  }

  // History
  if (
    t.includes("एकीकरण") || t.includes("प्राचीन सभ्यताएँ") || t.includes("इतिहास के स्रोत") ||
    t.includes("महाजनपद") || t.includes("राजपूत काल") || t.includes("गुहिल") ||
    t.includes("कछवाहा") || t.includes("चौहान") || t.includes("गुर्जर-प्रतिहार") ||
    t.includes("राठौड़") || t.includes("रियासतें") || t.includes("1857") ||
    t.includes("किसान एवं जनजातीय") || t.includes("प्रजामंडल") ||
    t.includes("स्वतंत्रता आंदोलन") || t.includes("सामाजिक एवं राजनीतिक जागरण") ||
    t.includes("प्रेस एवं पत्रकारिता") || t.includes("प्रमुख व्यक्तित्व") ||
    t.includes("महिला व्यक्तित्व")
  ) {
    return { name: "राजस्थान का इतिहास", slug: "rajasthan-history" };
  }

  // Art, Culture & Society
  if (
    t.includes("मेले") || t.includes("त्योहार") || t.includes("रीति-रिवाज") ||
    t.includes("वेशभूषा") || t.includes("स्थापत्य कला") || t.includes("चित्रकला") ||
    t.includes("हस्तशिल्प") || t.includes("संत, संप्रदाय") || t.includes("लोक संगीत") ||
    t.includes("लोक नृत्य") || t.includes("भाषा एवं बोलियाँ") || t.includes("साहित्य") ||
    t.includes("शब्दावली")
  ) {
    return { name: "राजस्थान की कला, संस्कृति एवं समाज", slug: "rajasthan-art-culture-society" };
  }

  // Default: Geography & Economy
  return { name: "राजस्थान का भूगोल एवं अर्थव्यवस्था", slug: "rajasthan-geography-economy" };
}

// ─── Main Pipeline ─────────────────────────────────────────────────────────────

async function runQAAndDedupe() {
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  Quizzer — PYQ Bank QA, Deduplication & Batch Generator");
  console.log("══════════════════════════════════════════════════════════════\n");

  // Ensure output directories exist
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const topicDirs = fs.readdirSync(NEW20_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "hi"));

  // Aggregate report data
  const allKept: AuditedQuestion[] = [];
  const allRepaired: AuditedQuestion[] = [];
  const allRemoved: AuditedQuestion[] = [];
  const allReview: AuditedQuestion[] = [];

  const topicManifest: Array<{
    masterTopic: string;
    inputCount: number;
    keepCount: number;
    repairCount: number;
    removeCount: number;
    reviewCount: number;
    batchCount: number;
    finalBatchFiles: string[];
  }> = [];

  let globalOrder = 0;

  // ── Process each master topic ──
  for (const topicDir of topicDirs) {
    const topicName = topicDir.name;
    const topicPath = path.join(NEW20_DIR, topicName);
    const batchFiles = fs.readdirSync(topicPath)
      .filter((f) => f.endsWith(".json"))
      .sort();

    if (batchFiles.length === 0) continue;

    // Load all questions in this topic
    const allRaw: RawQuestion[] = [];
    for (const f of batchFiles) {
      const qs: RawQuestion[] = JSON.parse(fs.readFileSync(path.join(topicPath, f), "utf8"));
      allRaw.push(...qs);
    }

    console.log(`Processing: "${topicName}" (${allRaw.length} input questions)`);

    // ── Step 1: Individual QA ──
    const auditedList: AuditedQuestion[] = [];

    for (const raw of allRaw) {
      const audit: AuditedQuestion = { raw, status: "KEEP" };
      const repairNotes: string[] = [];

      // QA Check 1: Question stem must be >= 10 chars
      if (!raw.question || raw.question.trim().length < 10) {
        audit.status = "REMOVE";
        audit.removeReason = "Question stem too short or empty";
        auditedList.push(audit);
        continue;
      }

      // QA Check 2: Must have exactly 4 options
      if (!Array.isArray(raw.options) || raw.options.length !== 4) {
        audit.status = "REMOVE";
        audit.removeReason = `Invalid options count: ${Array.isArray(raw.options) ? raw.options.length : "not array"}`;
        auditedList.push(audit);
        continue;
      }

      // QA Check 3: Answer must exist in options (raw exact match)
      const answerRaw = (raw.answer || "").trim();
      if (!answerRaw || answerRaw === "*" || answerRaw === "X") {
        audit.status = "REMOVE";
        audit.removeReason = "Cancelled, bonus, or missing answer (*, X, empty)";
        auditedList.push(audit);
        continue;
      }

      // QA Check 4: Answer must match one of the 4 raw options exactly
      const ansIdx = raw.options.findIndex((o) => (o || "").trim() === answerRaw);
      if (ansIdx === -1) {
        // Try cleaned match
        const cleanedAns = cleanOptionText(answerRaw).toLowerCase();
        const cleanedAnsIdx = raw.options.findIndex(
          (o) => cleanOptionText(o || "").toLowerCase() === cleanedAns
        );
        if (cleanedAnsIdx === -1) {
          audit.status = "REVIEW_REQUIRED";
          audit.reviewReason = `Answer "${answerRaw}" not found among options: ${raw.options.join(" | ")}`;
          auditedList.push(audit);
          continue;
        }
      }

      // QA Check 5: Options must be distinct (raw)
      const rawOptSet = new Set(raw.options.map((o) => (o || "").trim().toLowerCase()));
      if (rawOptSet.size < 4) {
        audit.status = "REMOVE";
        audit.removeReason = `Duplicate raw options detected`;
        auditedList.push(audit);
        continue;
      }

      // QA Check 6: Missing explanation (flag but keep)
      if (!raw.explanation || raw.explanation.trim().length < 5) {
        repairNotes.push("Missing or very short explanation (kept as-is per PYQ integrity policy)");
        if (audit.status === "KEEP") audit.status = "KEEP"; // still keep
      }

      // QA Check 7: Clean question text for OCR/formatting issues
      const { cleaned, repaired: textRepaired, notes: textNotes } = cleanQuestionText(raw.question);
      if (textRepaired) {
        repairNotes.push(...textNotes);
        if (audit.status === "KEEP") audit.status = "REPAIR";
      }

      if (repairNotes.length > 0) {
        audit.repairNotes = repairNotes;
        if (audit.status === "KEEP") audit.status = "REPAIR";
      }

      // Build Convex-ready question
      const finalOpts: ConvexOption[] = raw.options.map((o, i) => ({
        id: `opt${i + 1}` as ConvexOption["id"],
        text: o.trim(), // Preserve original option text, only trim
      }));

      // Map answer to option ID
      const directIdx = raw.options.findIndex((o) => (o || "").trim() === answerRaw);
      let correctAnswer: string;
      if (directIdx !== -1) {
        correctAnswer = `opt${directIdx + 1}`;
      } else {
        const cleanedAns = cleanOptionText(answerRaw).toLowerCase();
        const cleanedIdx = raw.options.findIndex(
          (o) => cleanOptionText(o || "").toLowerCase() === cleanedAns
        );
        correctAnswer = cleanedIdx !== -1 ? `opt${cleanedIdx + 1}` : "opt1";
        repairNotes.push(`Answer mapped via cleaned match (original: "${answerRaw}")`);
        audit.status = "REPAIR";
      }

      const validExam = !isFakeExam(raw.exam) ? raw.exam?.trim() : undefined;
      const year = extractYear(validExam);

      audit.finalQuestion = {
        type: "mcq",
        questionText: (textRepaired ? cleaned : raw.question).trim(),
        options: finalOpts,
        correctAnswer,
        explanation: raw.explanation?.trim() || undefined,
        reference: validExam ? `📌 PYQ — ${validExam}` : "📌 PYQ",
        difficulty: "medium",
        order: globalOrder++,
        meta: {
          sourceType: "PYQ",
          sourceQuestionId: raw.id,
          exam: validExam || undefined,
          year: year || null,
        },
      };

      auditedList.push(audit);
    }

    // ── Step 2: Deduplication within topic ──
    // Strategy:
    //   a) Exact Q+A duplicates: keep the best scored one, remove the rest
    //   b) Near-duplicates (similarity >= 0.85 + same answer): keep best, remove rest
    //
    // IMPORTANT: Same stem but DIFFERENT answer = different factual point → KEEP BOTH

    // Build a list of (status !== "REMOVE" && status !== "REVIEW_REQUIRED") candidates
    const dedupePool = auditedList.filter(
      (a) => a.status !== "REMOVE" && a.status !== "REVIEW_REQUIRED"
    );

    // Group by cleanStem(question) + cleanStem(answer) = exact same factual question
    const exactKeyMap = new Map<string, AuditedQuestion[]>();
    for (const a of dedupePool) {
      const qKey = cleanStem(a.raw.question);
      const aKey = cleanStem(a.raw.answer);
      const key = `${qKey}|||${aKey}`;
      if (!exactKeyMap.has(key)) exactKeyMap.set(key, []);
      exactKeyMap.get(key)!.push(a);
    }

    // For each exact-duplicate cluster, keep the best scored
    const removedByExact = new Set<number>(); // raw.id
    exactKeyMap.forEach((cluster) => {
      if (cluster.length <= 1) return;
      // Sort by score descending, keep first
      cluster.sort((a, b) => scoreQuestion(b.raw) - scoreQuestion(a.raw));
      for (let i = 1; i < cluster.length; i++) {
        if (!removedByExact.has(cluster[i].raw.id)) {
          removedByExact.add(cluster[i].raw.id);
          cluster[i].status = "REMOVE";
          cluster[i].removeReason = `Exact duplicate of ID ${cluster[0].raw.id} (${cluster[0].raw.exam || "no exam"}). Kept better-scored representative.`;
        }
      }
    });

    // Near-duplicate clustering: similarity >= 0.85 + same answer
    // Only compare among still-active questions
    const activeFroDedup = dedupePool.filter((a) => a.status !== "REMOVE");

    for (let i = 0; i < activeFroDedup.length; i++) {
      const qa = activeFroDedup[i];
      if (qa.status === "REMOVE") continue;

      for (let j = i + 1; j < activeFroDedup.length; j++) {
        const qb = activeFroDedup[j];
        if (qb.status === "REMOVE") continue;

        const sim = similarity(qa.raw.question, qb.raw.question);
        if (sim < 0.85) continue;

        // Same factual answer?
        const ansA = cleanStem(qa.raw.answer);
        const ansB = cleanStem(qb.raw.answer);
        if (ansA !== ansB) continue; // Different answers = different facts, keep both

        // Same question tested from different exams. Keep better one.
        const scoreA = scoreQuestion(qa.raw);
        const scoreB = scoreQuestion(qb.raw);
        if (scoreA >= scoreB) {
          qb.status = "REMOVE";
          qb.removeReason = `Near-duplicate (similarity ${sim.toFixed(2)}) of ID ${qa.raw.id} with same answer. Kept higher-scored representative (score: ${scoreA} vs ${scoreB}).`;
        } else {
          qa.status = "REMOVE";
          qa.removeReason = `Near-duplicate (similarity ${sim.toFixed(2)}) of ID ${qb.raw.id} with same answer. Kept higher-scored representative (score: ${scoreB} vs ${scoreA}).`;
          break; // qa is now removed, move on
        }
      }
    }

    // ── Step 3: Collect results ──
    const topicKept: AuditedQuestion[] = [];
    const topicRepaired: AuditedQuestion[] = [];
    const topicRemoved: AuditedQuestion[] = [];
    const topicReview: AuditedQuestion[] = [];

    for (const a of auditedList) {
      switch (a.status) {
        case "KEEP":
          topicKept.push(a);
          allKept.push(a);
          break;
        case "REPAIR":
          topicRepaired.push(a);
          allRepaired.push(a);
          topicKept.push(a); // repaired questions are kept
          allKept.push(a);
          break;
        case "REMOVE":
          topicRemoved.push(a);
          allRemoved.push(a);
          break;
        case "REVIEW_REQUIRED":
          topicReview.push(a);
          allReview.push(a);
          break;
      }
    }

    // ── Step 4: Generate final batches (≤20 questions each) ──
    const activeQuestions = auditedList
      .filter((a) => (a.status === "KEEP" || a.status === "REPAIR") && a.finalQuestion)
      .map((a) => a.finalQuestion!);

    // Sort by exam year descending (most recent first)
    activeQuestions.sort((a, b) => {
      const ya = a.meta.year || 2000;
      const yb = b.meta.year || 2000;
      return yb - ya;
    });

    // Re-assign order within topic
    activeQuestions.forEach((q, i) => { q.order = i; });

    // Write batch files
    const topicOutputDir = path.join(OUTPUT_DIR, topicName);
    if (!fs.existsSync(topicOutputDir)) fs.mkdirSync(topicOutputDir, { recursive: true });

    const BATCH_SIZE = 20;
    const numBatches = Math.ceil(activeQuestions.length / BATCH_SIZE);
    const finalBatchFiles: string[] = [];
    const subjectInfo = mapSubject(topicName);
    const topicSlug = slugify(topicName);

    for (let b = 0; b < numBatches; b++) {
      const slice = activeQuestions.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      const batchIndex = b + 1;
      const batchFileName = `batch_${String(batchIndex).padStart(3, "0")}.json`;
      const batchPath = path.join(topicOutputDir, batchFileName);

      // Re-assign order within each batch
      slice.forEach((q, i) => { q.order = i; });

      const batchData: BatchFile = {
        masterTopic: topicName,
        batchIndex,
        batchName: `${topicName} भाग ${batchIndex}`,
        subject: subjectInfo.name,
        subjectSlug: subjectInfo.slug,
        topicSlug,
        negativeMarking: true,
        questionCount: slice.length,
        questions: slice,
      };

      fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2), "utf8");
      finalBatchFiles.push(batchFileName);
    }

    topicManifest.push({
      masterTopic: topicName,
      inputCount: allRaw.length,
      keepCount: topicKept.filter((a) => a.status === "KEEP").length,
      repairCount: topicRepaired.length,
      removeCount: topicRemoved.length,
      reviewCount: topicReview.length,
      batchCount: numBatches,
      finalBatchFiles,
    });

    console.log(`  ✓ ${allRaw.length} input → ${activeQuestions.length} final (${topicRemoved.length} removed, ${topicRepaired.length} repaired, ${topicReview.length} review) → ${numBatches} batches`);
  }

  // ── Generate MANIFEST_FINAL.json ──
  const totalInput = topicManifest.reduce((s, t) => s + t.inputCount, 0);
  const totalFinal = allKept.length; // includes repaired
  const totalBatches = topicManifest.reduce((s, t) => s + t.batchCount, 0);

  const manifest = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalInputQuestions: totalInput,
      totalFinalQuestions: totalFinal,
      totalKept: allKept.filter((a) => a.status === "KEEP").length,
      totalRepaired: allRepaired.length,
      totalRemoved: allRemoved.length,
      totalReviewRequired: allReview.length,
      totalMasterTopics: topicManifest.length,
      totalBatches,
    },
    topics: topicManifest,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "MANIFEST_FINAL.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  // ── Generate Reports ──
  generateValidationReport(manifest, allKept, allRemoved, allReview, allRepaired);
  generateDuplicateReport(allRemoved);
  generateRemovedReport(allRemoved);
  generateRepairReport(allRepaired);
  generateReviewReport(allReview);

  // ── Final Console Summary ──
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  QA & Deduplication Pipeline — COMPLETE");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  Total Input Questions  : ${totalInput}`);
  console.log(`  Total KEEP             : ${allKept.filter((a) => a.status === "KEEP").length}`);
  console.log(`  Total REPAIR           : ${allRepaired.length}`);
  console.log(`  Total REMOVE           : ${allRemoved.length}`);
  console.log(`  Total REVIEW_REQUIRED  : ${allReview.length}`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Final Question Count   : ${totalFinal}`);
  console.log(`  Master Topics          : ${topicManifest.length}`);
  console.log(`  Total Batches (≤20)    : ${totalBatches}`);
  console.log(`\n  Output : src/xdata/final_pyq_batches/`);
  console.log(`  Reports: src/xdata/qa_reports/`);
  console.log("══════════════════════════════════════════════════════════════\n");
}

// ─── Report Generators ────────────────────────────────────────────────────────

function generateValidationReport(
  manifest: any,
  allKept: AuditedQuestion[],
  allRemoved: AuditedQuestion[],
  allReview: AuditedQuestion[],
  allRepaired: AuditedQuestion[]
) {
  const s = manifest.summary;
  let md = `# Quizzer PYQ Bank — Validation Report

**Generated**: ${manifest.generatedAt}

## Summary

| Metric | Count |
|---|---|
| Total Input Questions | ${s.totalInputQuestions} |
| Total KEEP (clean) | ${s.totalKept} |
| Total REPAIR (fixed wording) | ${s.totalRepaired} |
| Total REMOVE (duplicates/invalid) | ${s.totalRemoved} |
| Total REVIEW_REQUIRED | ${s.totalReviewRequired} |
| **Final Question Count** | **${s.totalFinalQuestions}** |
| Master Topics | ${s.totalMasterTopics} |
| 20-Question Batches | ${s.totalBatches} |

## Validation Checks Passed

- ✅ All questions have exactly 4 options
- ✅ All answers map to one of the 4 options
- ✅ No cancelled/bonus answers (* or X)
- ✅ No empty question stems
- ✅ All batch sizes ≤ 20 questions
- ✅ All options are distinct (raw text)
- ✅ All question IDs are preserved from source

## Topic-Wise Summary

| Master Topic | Input | Final | REMOVE | REPAIR | REVIEW | Batches |
|---|---|---|---|---|---|---|
`;

  for (const t of manifest.topics) {
    const finalCount = t.keepCount + t.repairCount;
    md += `| ${t.masterTopic} | ${t.inputCount} | ${finalCount} | ${t.removeCount} | ${t.repairCount} | ${t.reviewCount} | ${t.batchCount} |\n`;
  }

  md += `\n\n## Notes\n\n`;
  md += `- "Duplicate options" false positives: Detected via cleanOptionText regex, which may strip numbering from options like "(C) एवं (D)". Raw option text is always preserved in the final output.\n`;
  md += `- Questions appearing exactly twice with different exam names are treated as near-duplicates; the higher-scored (more recent, better-explained, official exam) version is kept.\n`;
  md += `- Questions with same stem but DIFFERENT answers are always kept as they test different factual points.\n`;

  fs.writeFileSync(path.join(REPORTS_DIR, "validation_report.md"), md, "utf8");
  console.log("  📄 Generated: validation_report.md");
}

function generateDuplicateReport(allRemoved: AuditedQuestion[]) {
  const duplicates = allRemoved.filter(
    (a) => a.removeReason && (a.removeReason.includes("Exact duplicate") || a.removeReason.includes("Near-duplicate"))
  );

  let md = `# Quizzer PYQ Bank — Duplicate Removal Report

**Total duplicates removed**: ${duplicates.length}

This report lists all questions removed due to exact or near-duplicate detection.
Questions testing DIFFERENT facts (even with similar wording) were NOT removed.

| ID | Topic | Exam | Similarity | Remove Reason |
|---|---|---|---|---|
`;

  for (const a of duplicates) {
    const sim = a.removeReason?.match(/similarity ([\d.]+)/)?.at(1) || "exact";
    md += `| ${a.raw.id} | ${a.raw.topic || "-"} | ${a.raw.exam?.slice(0, 40) || "-"} | ${sim} | ${a.removeReason?.slice(0, 80) || "-"} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, "duplicate_report.md"), md, "utf8");
  console.log("  📄 Generated: duplicate_report.md");
}

function generateRemovedReport(allRemoved: AuditedQuestion[]) {
  let md = `# Quizzer PYQ Bank — Removed Questions Report

**Total removed**: ${allRemoved.length}

| ID | Topic | Exam | Remove Reason |
|---|---|---|---|
`;

  for (const a of allRemoved) {
    md += `| ${a.raw.id} | ${(a.raw.topic || "-").slice(0, 40)} | ${(a.raw.exam || "-").slice(0, 40)} | ${(a.removeReason || "-").slice(0, 100)} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, "removed_question_report.md"), md, "utf8");
  console.log("  📄 Generated: removed_question_report.md");
}

function generateRepairReport(allRepaired: AuditedQuestion[]) {
  let md = `# Quizzer PYQ Bank — Repair Report

**Total repaired**: ${allRepaired.length}

Questions were repaired for formatting issues (merged words, zero-width spaces, whitespace normalization).
Original PYQ wording was NOT changed unless it was a clear structural defect.

| ID | Topic | Exam | Repair Notes |
|---|---|---|---|
`;

  for (const a of allRepaired) {
    const notes = (a.repairNotes || []).join("; ");
    md += `| ${a.raw.id} | ${(a.raw.topic || "-").slice(0, 35)} | ${(a.raw.exam || "-").slice(0, 35)} | ${notes.slice(0, 120)} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, "repair_report.md"), md, "utf8");
  console.log("  📄 Generated: repair_report.md");
}

function generateReviewReport(allReview: AuditedQuestion[]) {
  let md = `# Quizzer PYQ Bank — Review Required Report

**Total flagged for review**: ${allReview.length}

These questions could NOT be confidently validated and require human review before import.
No facts were invented or replaced.

| ID | Topic | Exam | Review Reason | Question (first 100 chars) |
|---|---|---|---|---|
`;

  for (const a of allReview) {
    md += `| ${a.raw.id} | ${(a.raw.topic || "-").slice(0, 30)} | ${(a.raw.exam || "-").slice(0, 30)} | ${(a.reviewReason || "-").slice(0, 80)} | ${a.raw.question.slice(0, 100)} |\n`;
  }

  fs.writeFileSync(path.join(REPORTS_DIR, "review_required_report.md"), md, "utf8");
  console.log("  📄 Generated: review_required_report.md");
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

if (import.meta.main) {
  runQAAndDedupe().catch((err) => {
    console.error("Pipeline failure:", err);
    process.exit(1);
  });
}
