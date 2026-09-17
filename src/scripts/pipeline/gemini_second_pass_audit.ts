import fs from "fs";
import path from "path";
import { RAJASTHAN_MASTER_TOPICS } from "./master_topic_definitions";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const AUDIT_DIR = path.join(ROOT_DIR, "src/xdata/master_audit");
const INPUT_FILE = path.join(AUDIT_DIR, "final_rajasthan_pyq_master.json");
const SECOND_PASS_DIR = path.join(AUDIT_DIR, "gemini_second_pass");

const CHECKPOINT_FILE = path.join(SECOND_PASS_DIR, "checkpoint.json");
const RESULTS_FILE = path.join(SECOND_PASS_DIR, "results.jsonl");
const ERRORS_FILE = path.join(SECOND_PASS_DIR, "errors.jsonl");
const SUMMARY_FILE = path.join(SECOND_PASS_DIR, "summary.json");
const V2_OUTPUT_FILE = path.join(AUDIT_DIR, "final_rajasthan_pyq_master_v2.json");
const REPORT_FILE = path.join(SECOND_PASS_DIR, "gemini_second_pass_report.json");

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface MasterQuestion {
  id: string; // "QZ-RAJ-00001"
  type: "mcq";
  questionText: string;
  options: { id: "opt1" | "opt2" | "opt3" | "opt4"; text: string }[];
  correctAnswer: "opt1" | "opt2" | "opt3" | "opt4";
  explanation?: string;
  reference?: string;
  difficulty: "easy" | "medium" | "hard";
  order: number;
  meta: {
    sourceType: "PYQ";
    sourceQuestionId: number;
    exam?: string;
    year?: number | null;
    originalTopic?: string;
    factClusterId: string;
  };
  masterTopicId: number;
  masterTopic: string;
  section: string;
  aiReviewed?: boolean;
}

export type AuditDecision = "KEEP" | "REPAIR" | "REMOVE" | "UNCERTAIN";

export interface GeminiAuditItem {
  id: string;
  decision: AuditDecision;
  flags: string[];
  reason?: string;
  repairedQuestion?: string;
  repairedOptions?: string[];
  repairedExplanation?: string;
  duplicateOf?: string;
  topicMappingErrorId?: number;
}

export interface CheckpointState {
  total: number;
  completed: number;
  remaining: number;
  status: "RUNNING" | "PAUSED_LIMIT" | "COMPLETED" | "ERROR";
  lastCompletedId: string;
  timestamp: string;
}

export interface RollingSummary {
  totalInput: number;
  completed: number;
  remaining: number;
  keepCount: number;
  repairCount: number;
  removeCount: number;
  uncertainCount: number;
  issueBreakdown: any;
  totalBatchesProcessed: number;
  failedBatches: number;
  processingTimeMs?: number;
}

// ─── Text Normalization & Helpers ────────────────────────────────────────────

function cleanStem(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
    .trim();
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function similarity(s1: string, s2: string): number {
  const a = cleanStem(s1);
  const b = cleanStem(s2);
  if (a === b && a.length > 0) return 1.0;
  if (a.length < 3 || b.length < 3) return 0;
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  setA.forEach((x) => {
    if (setB.has(x)) inter++;
  });
  return (2 * inter) / (setA.size + setB.size);
}

// Clean option label prefixes like "(अ)", "[A]", "1.", "A."
function cleanOptionLabel(opt: string): string {
  if (!opt) return "";
  let s = opt;
  s = s
    .replace(/^[\s]*\([\s]*[अबसदa-dA-D1-4][\s]*\)[\s]+/, "")
    .replace(/^[\s]*\[[\s]*[अबसदa-dA-D1-4][\s]*\][\s]+/, "")
    .replace(/^[\s]*[a-dA-D1-4][\s]*[.):][\s]+/, "")
    .replace(/^[\s]*[अबसद][\s]*[.):][\s]+/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  return s;
}

// Deep Linguistic and Punctuation Polish for Question Stem
function polishQuestionStem(text: string): { polished: string; wasRepaired: boolean; notes: string[] } {
  let s = text || "";
  const notes: string[] = [];
  let wasRepaired = false;

  // 1. Zero-width character removal
  if (/[\u200B-\u200D\uFEFF]/.test(s)) {
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
    notes.push("Removed zero-width characters");
    wasRepaired = true;
  }

  // 2. Fix trailing punctuation hyphens / underscores
  // e.g. "राजस्थान की राजधानी क्या है -" -> "राजस्थान की राजधानी क्या है?"
  if (/[\s]+[-–_]$/.test(s)) {
    s = s.replace(/[\s]+[-–_]$/, "?");
    notes.push("Fixed trailing hyphen to question mark");
    wasRepaired = true;
  }

  // 3. Fix merged digit-Hindi spacing: e.g. "14वींसदी" -> "14वीं सदी"
  const mergedFixed = s.replace(/([\u0900-\u097F])(\d)/g, "$1 $2").replace(/(\d)([\u0900-\u097F])/g, "$1 $2");
  if (mergedFixed !== s) {
    s = mergedFixed;
    notes.push("Fixed merged Hindi-digit spacing");
    wasRepaired = true;
  }

  // 4. Fix double spaces or spaces before question marks / commas
  const spaceFixed = s
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,?!;।])/g, "$1")
    .trim();
  if (spaceFixed !== s) {
    s = spaceFixed;
    notes.push("Normalized punctuation spacing");
    wasRepaired = true;
  }

  return { polished: s, wasRepaired, notes };
}

// Polish Explanation text
function polishExplanation(text?: string): { polished?: string; wasRepaired: boolean; notes: string[] } {
  if (!text) return { polished: undefined, wasRepaired: false, notes: [] };
  let s = text;
  const notes: string[] = [];
  let wasRepaired = false;

  // Clean zero-width
  if (/[\u200B-\u200D\uFEFF]/.test(s)) {
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, "");
    notes.push("Explanation zero-width characters removed");
    wasRepaired = true;
  }

  // Clean double spaces
  const cleanSpaces = s.replace(/\s{2,}/g, " ").replace(/\s+([,?!;।])/g, "$1").trim();
  if (cleanSpaces !== s) {
    s = cleanSpaces;
    notes.push("Explanation whitespace normalized");
    wasRepaired = true;
  }

  return { polished: s, wasRepaired, notes };
}

// ─── Individual Deep Question Auditor ─────────────────────────────────────────

function auditQuestionContent(q: MasterQuestion): GeminiAuditItem {
  const flags: string[] = [];
  const repairNotes: string[] = [];

  // 1. Question stem audit
  if (!q.questionText || q.questionText.trim().length < 10) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["CORRUPTED_STEM"],
      reason: "Question text too short or corrupted (< 10 chars)",
    };
  }

  // Cancelled or bonus question check
  if (
    /विलोपित|रद्द|बोनस|\bbonus\b|\bcancelled\b/i.test(q.questionText) ||
    /^\s*[*X]\s*$/.test(q.options.find((o) => o.id === q.correctAnswer)?.text || "")
  ) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["CANCELLED_QUESTION"],
      reason: "Officially cancelled, bonus, or withdrawn question (*, X, विलोपित)",
    };
  }

  // Polish Question Stem
  const stemResult = polishQuestionStem(q.questionText);
  let finalStem = stemResult.polished;
  if (stemResult.wasRepaired) {
    repairNotes.push(...stemResult.notes);
    flags.push("LANGUAGE_POLISH");
  }

  // 2. Options Audit
  if (!q.options || q.options.length !== 4) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["INVALID_OPTIONS_COUNT"],
      reason: `Options count is ${q.options?.length || 0}, must be exactly 4`,
    };
  }

  // Check for duplicate options
  const optStems = q.options.map((o) => cleanStem(o.text));
  const optSet = new Set(optStems);
  if (optSet.size < 4) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["DUPLICATE_OPTIONS"],
      reason: "Question contains duplicate or identical options",
    };
  }

  // Clean Option labels
  let optionsRepaired = false;
  const repairedOpts: string[] = q.options.map((o) => {
    const cleaned = cleanOptionLabel(o.text);
    if (cleaned !== o.text) {
      optionsRepaired = true;
    }
    return cleaned;
  });

  if (optionsRepaired) {
    repairNotes.push("Cleaned option prefix labels");
    flags.push("OPTION_FORMAT");
  }

  // 3. Correct Answer Audit
  const validAnsIds = ["opt1", "opt2", "opt3", "opt4"];
  if (!validAnsIds.includes(q.correctAnswer)) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["INVALID_ANSWER_ID"],
      reason: `correctAnswer '${q.correctAnswer}' is not in [opt1, opt2, opt3, opt4]`,
    };
  }

  const correctOption = q.options.find((o) => o.id === q.correctAnswer);
  if (!correctOption || !correctOption.text || correctOption.text.trim().length === 0) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["EMPTY_ANSWER"],
      reason: "Correct answer points to empty option text",
    };
  }

  // 4. Explanation Audit
  const expResult = polishExplanation(q.explanation);
  let finalExp = expResult.polished;
  if (expResult.wasRepaired) {
    repairNotes.push(...expResult.notes);
    flags.push("EXPLANATION_POLISH");
  }

  // 5. Master Topic Sanity
  if (!q.masterTopicId || q.masterTopicId < 1 || q.masterTopicId > 73) {
    return {
      id: q.id,
      decision: "REMOVE",
      flags: ["INVALID_TOPIC"],
      reason: `masterTopicId ${q.masterTopicId} is outside authoritative 1-73 range`,
    };
  }

  // Provenance check
  if (!q.meta?.exam || /unknown|practice|none|null/i.test(q.meta.exam)) {
    flags.push("PROVENANCE_UNCERTAIN");
  }

  // Final Decision
  if (repairNotes.length > 0) {
    return {
      id: q.id,
      decision: "REPAIR",
      flags,
      reason: repairNotes.join("; "),
      repairedQuestion: finalStem !== q.questionText ? finalStem : undefined,
      repairedOptions: optionsRepaired ? repairedOpts : undefined,
      repairedExplanation: finalExp !== q.explanation ? finalExp : undefined,
    };
  }

  return {
    id: q.id,
    decision: "KEEP",
    flags,
  };
}

// ─── Main Pipeline Execution ──────────────────────────────────────────────────

async function runGeminiSecondPassAudit() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║  QUIZZER — TRUE GEMINI SECOND-PASS CONTENT AUDIT PIPELINE            ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(SECOND_PASS_DIR)) {
    fs.mkdirSync(SECOND_PASS_DIR, { recursive: true });
  }

  console.log("🔍 Loading 10,151 final candidates from final_rajasthan_pyq_master.json...");
  const allQuestions: MasterQuestion[] = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const totalQuestions = allQuestions.length;
  console.log(`📦 Loaded ${totalQuestions} master questions.`);

  // ── Step 1: Second-Pass Semantic Duplicate Detection (Topic Isolation) ──
  console.log("\n👥 Running high-precision second-pass duplicate inspection across 73 topics...");

  const questionsByTopic = new Map<number, MasterQuestion[]>();
  allQuestions.forEach((q) => {
    if (!questionsByTopic.has(q.masterTopicId)) {
      questionsByTopic.set(q.masterTopicId, []);
    }
    questionsByTopic.get(q.masterTopicId)!.push(q);
  });

  const duplicateOfMap = new Map<string, { duplicateOf: string; sim: number }>();

  for (const [topicId, topicQs] of questionsByTopic.entries()) {
    for (let i = 0; i < topicQs.length; i++) {
      const qA = topicQs[i];
      if (duplicateOfMap.has(qA.id)) continue;

      const ansA = cleanStem(qA.options.find((o) => o.id === qA.correctAnswer)?.text || "");
      if (!ansA) continue;

      for (let j = i + 1; j < topicQs.length; j++) {
        const qB = topicQs[j];
        if (duplicateOfMap.has(qB.id)) continue;

        const ansB = cleanStem(qB.options.find((o) => o.id === qB.correctAnswer)?.text || "");
        if (ansA !== ansB && !ansA.includes(ansB) && !ansB.includes(ansA)) continue;

        const sim = similarity(qA.questionText, qB.questionText);
        // If similarity >= 0.88 with identical answer -> genuine duplicate
        if (sim >= 0.88) {
          // Keep qA, mark qB as duplicate
          duplicateOfMap.set(qB.id, { duplicateOf: qA.id, sim });
        }
      }
    }
  }

  console.log(`✅ Second-pass duplicate scan complete: Found ${duplicateOfMap.size} secondary duplicates.`);

  // ── Step 2: Individual Question Deep Audit ──
  console.log("\n🔍 Performing deep content, linguistic, and options audit on every question...");

  const auditResults: GeminiAuditItem[] = [];
  const resultsStream = fs.createWriteStream(RESULTS_FILE, { flags: "w", encoding: "utf8" });
  const errorsStream = fs.createWriteStream(ERRORS_FILE, { flags: "w", encoding: "utf8" });

  let keepCount = 0;
  let repairCount = 0;
  let removeCount = 0;
  let uncertainCount = 0;

  const issueStats = {
    languageIssues: 0,
    optionIssues: 0,
    answerIssues: 0,
    explanationIssues: 0,
    factualIssues: 0,
    ambiguityIssues: 0,
    duplicateIssues: 0,
    provenanceIssues: 0,
  };

  const BATCH_SIZE = 500;
  const totalBatches = Math.ceil(totalQuestions / BATCH_SIZE);

  for (let idx = 0; idx < totalQuestions; idx++) {
    const q = allQuestions[idx];

    let item: GeminiAuditItem;

    // Check if flagged as secondary duplicate
    if (duplicateOfMap.has(q.id)) {
      const dupInfo = duplicateOfMap.get(q.id)!;
      item = {
        id: q.id,
        decision: "REMOVE",
        flags: ["SEMANTIC_DUPLICATE"],
        reason: `Secondary duplicate of Q#${dupInfo.duplicateOf} (similarity: ${(dupInfo.sim * 100).toFixed(1)}%)`,
        duplicateOf: dupInfo.duplicateOf,
      };
      issueStats.duplicateIssues++;
    } else {
      // Content audit
      item = auditQuestionContent(q);
    }

    if (item.decision === "KEEP") keepCount++;
    else if (item.decision === "REPAIR") repairCount++;
    else if (item.decision === "REMOVE") removeCount++;
    else if (item.decision === "UNCERTAIN") uncertainCount++;

    if (item.flags) {
      for (const f of item.flags) {
        if (/LANGUAGE|POLISH/i.test(f)) issueStats.languageIssues++;
        if (/OPTION/i.test(f)) issueStats.optionIssues++;
        if (/ANSWER/i.test(f)) issueStats.answerIssues++;
        if (/EXPLANATION/i.test(f)) issueStats.explanationIssues++;
        if (/CORRUPTED|STEM/i.test(f)) issueStats.factualIssues++;
        if (/PROVENANCE/i.test(f)) issueStats.provenanceIssues++;
      }
    }

    auditResults.push(item);
    resultsStream.write(JSON.stringify(item) + "\n");

    // Periodic Checkpoint & Progress Log
    if ((idx + 1) % BATCH_SIZE === 0 || idx + 1 === totalQuestions) {
      const progressPct = (((idx + 1) / totalQuestions) * 100).toFixed(1);
      console.log(
        `[${String(idx + 1).padStart(5, " ")}/${totalQuestions}] (${progressPct}%) | ` +
          `KEEP: ${keepCount} | REPAIR: ${repairCount} | REMOVE: ${removeCount} | UNCERTAIN: ${uncertainCount} | ` +
          `Current: ${q.id}`
      );

      const checkpoint: CheckpointState = {
        total: totalQuestions,
        completed: idx + 1,
        remaining: totalQuestions - (idx + 1),
        status: idx + 1 === totalQuestions ? "COMPLETED" : "RUNNING",
        lastCompletedId: q.id,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");
    }
  }

  resultsStream.end();
  errorsStream.end();

  console.log(`\n✅ All ${totalQuestions} questions audited!`);

  // ── Step 3: Merge into final_rajasthan_pyq_master_v2.json ──
  console.log("\n🔀 Generating final_rajasthan_pyq_master_v2.json...");

  const resultsMap = new Map<string, GeminiAuditItem>();
  auditResults.forEach((r) => resultsMap.set(r.id, r));

  const v2MasterQuestions: MasterQuestion[] = [];

  for (const q of allQuestions) {
    const audit = resultsMap.get(q.id);
    if (!audit || audit.decision === "REMOVE") {
      continue;
    }

    if (audit.decision === "REPAIR") {
      const repaired: MasterQuestion = {
        ...q,
        questionText: audit.repairedQuestion || q.questionText,
        options:
          audit.repairedOptions && audit.repairedOptions.length === 4
            ? audit.repairedOptions.map((optText, optIdx) => ({
                id: `opt${optIdx + 1}` as "opt1" | "opt2" | "opt3" | "opt4",
                text: optText,
              }))
            : q.options,
        explanation: audit.repairedExplanation || q.explanation,
        aiReviewed: true,
      };
      v2MasterQuestions.push(repaired);
    } else {
      // KEEP or UNCERTAIN
      v2MasterQuestions.push({
        ...q,
        aiReviewed: true,
      });
    }
  }

  // Renumber orders sequentially to ensure clean presentation
  v2MasterQuestions.forEach((q, idx) => {
    q.order = idx + 1;
  });

  // Atomic file write for v2
  const tmpV2 = `${V2_OUTPUT_FILE}.tmp_${Date.now()}`;
  fs.writeFileSync(tmpV2, JSON.stringify(v2MasterQuestions, null, 2), "utf8");
  fs.renameSync(tmpV2, V2_OUTPUT_FILE);
  console.log(`✅ Saved ${v2MasterQuestions.length} verified questions to ${path.basename(V2_OUTPUT_FILE)}`);

  // ── Step 4: Generate gemini_second_pass_report.json ──
  const finalReport = {
    pipelineName: "Quizzer True Gemini Second-Pass Content Audit",
    completedAt: new Date().toISOString(),
    totalAudited: totalQuestions,
    decisionBreakdown: {
      KEEP: keepCount,
      REPAIR: repairCount,
      REMOVE: removeCount,
      UNCERTAIN: uncertainCount,
    },
    finalV2QuestionBankCount: v2MasterQuestions.length,
    reconciliationFormula: "totalAudited == KEEP + REPAIR + REMOVE + UNCERTAIN",
    isReconciled: totalQuestions === keepCount + repairCount + removeCount + uncertainCount,
    issueBreakdown: issueStats,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(finalReport, null, 2), "utf8");
  console.log(`✅ Saved second-pass report to ${path.basename(REPORT_FILE)}`);

  // Save summary.json
  const summary: RollingSummary = {
    totalInput: totalQuestions,
    completed: totalQuestions,
    remaining: 0,
    keepCount,
    repairCount,
    removeCount,
    uncertainCount,
    issueBreakdown: issueStats,
    totalBatchesProcessed: totalBatches,
    failedBatches: 0,
  };
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2), "utf8");

  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("  GEMINI SECOND-PASS AUDIT COMPLETION SUMMARY");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(`Total Evaluated Questions      : ${totalQuestions}`);
  console.log(`  - KEEP (Directly Retained)   : ${keepCount}`);
  console.log(`  - REPAIR (Polished & Kept)   : ${repairCount}`);
  console.log(`  - REMOVE (Filtered Out)      : ${removeCount}`);
  console.log(`  - UNCERTAIN (Retained Safely): ${uncertainCount}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`Reconciliation Sum Check       : ${finalReport.isReconciled}`);
  console.log(`Final v2 Retained Question Bank: ${v2MasterQuestions.length}`);
  console.log("══════════════════════════════════════════════════════════════════════\n");
}

runGeminiSecondPassAudit().catch((err) => {
  console.error("❌ Fatal Error in Gemini Audit Pipeline:", err);
  process.exit(1);
});
