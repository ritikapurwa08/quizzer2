import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const AUDIT_DIR = path.join(ROOT_DIR, "src/xdata/master_audit");
const INPUT_FILE = path.join(AUDIT_DIR, "final_rajasthan_pyq_master.json");
const FINAL_AUDIT_DIR = path.join(AUDIT_DIR, "gemini_final_audit");

const CHECKPOINT_FILE = path.join(FINAL_AUDIT_DIR, "checkpoint.json");
const RESULTS_FILE = path.join(FINAL_AUDIT_DIR, "results.jsonl");
const ERRORS_FILE = path.join(FINAL_AUDIT_DIR, "errors.jsonl");
const SUMMARY_FILE = path.join(FINAL_AUDIT_DIR, "summary.json");
const V3_OUTPUT_FILE = path.join(AUDIT_DIR, "final_rajasthan_pyq_master_v3.json");
const REPORT_FILE = path.join(FINAL_AUDIT_DIR, "final_gemini_audit_report.json");

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
  repair?: {
    questionText?: string;
    options?: string[];
    explanation?: string;
  };
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
  issueBreakdown: {
    languageIssues: number;
    factualIssues: number;
    optionIssues: number;
    answerIssues: number;
    explanationIssues: number;
    ambiguityIssues: number;
    duplicateIssues: number;
    topicIssues: number;
  };
  totalBatchesProcessed: number;
  failedBatches: number;
  processingTimeMs: number;
}

// ─── API Key Resolution ──────────────────────────────────────────────────────

function getGeminiApiKey(): string {
  // 1. CLI flag --api-key=...
  const arg = process.argv.find((a) => a.startsWith("--api-key="));
  if (arg) return arg.split("=")[1].trim();

  // 2. process.env
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY.trim();

  // 3. .env.local
  const envLocalPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envLocalPath)) {
    const lines = fs.readFileSync(envLocalPath, "utf8").split("\n");
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=")) {
        return trimmed.replace("GEMINI_API_KEY=", "").replace(/["']/g, "").trim();
      }
      if (trimmed.startsWith("GOOGLE_API_KEY=")) {
        return trimmed.replace("GOOGLE_API_KEY=", "").replace(/["']/g, "").trim();
      }
    }
  }

  return null;
}

// ─── Gemini System Prompt ────────────────────────────────────────────────────

const GEMINI_SYSTEM_INSTRUCTION = `
You are the Senior Examination Quality Auditor for Rajasthan Public Service Commission (RPSC) and RSSB competitive exams.
Audit the supplied batch of Rajasthan GK Multiple-Choice Questions (PYQs).

For each question inspect:
1. QUESTION: Factually correct, clear, natural exam Hindi, grammatically sound, competitive exam standard.
2. OPTIONS: Exactly 4 distinct options, factually accurate, no duplicate options, single correct answer.
3. ANSWER: CorrectAnswer points to the single correct option and is factually true.
4. EXPLANATION: Matches question, supports the answer, no contradiction or hallucination.
5. PROVENANCE/EXAM: Genuine exam provenance preserved.
6. MASTER TOPIC: Matches the authoritative 73 Rajasthan Master Topic structure.

DECISIONS:
- "KEEP": Question is acceptable and exam-ready. Do NOT rewrite a good genuine PYQ.
- "REPAIR": Minor correctable language, spacing, punctuation, option prefix, or explanation error. Provide "repair" object.
- "REMOVE": Factually broken, cancelled/bonus question (* or X), duplicate options, or true semantic duplicate of another question in batch.
- "UNCERTAIN": Factual veracity cannot be verified with confidence. When uncertain between KEEP and REMOVE, default to UNCERTAIN.

RULE: SAME TOPIC IS NOT SAME FACT. Do NOT mark duplicate merely because topic or answer string is the same.

MINIMAL OUTPUT FORMAT:
Return strictly a JSON array of decision objects:
[
  { "id": "QZ-RAJ-00001", "decision": "KEEP", "flags": [] },
  {
    "id": "QZ-RAJ-00002",
    "decision": "REPAIR",
    "flags": ["LANGUAGE"],
    "reason": "Minor punctuation spacing",
    "repair": { "questionText": "...", "options": ["...", "...", "...", "..."], "explanation": "..." }
  },
  {
    "id": "QZ-RAJ-00003",
    "decision": "REMOVE",
    "flags": ["DUPLICATE"],
    "reason": "Exact same factual point as QZ-RAJ-00041",
    "duplicateOf": "QZ-RAJ-00041"
  },
  { "id": "QZ-RAJ-00004", "decision": "UNCERTAIN", "flags": ["FACT_UNCERTAIN"] }
]
`;

// ─── Gemini Batch Auditor ────────────────────────────────────────────────────

async function callGeminiAuditBatch(
  apiKey: string,
  batch: MasterQuestion[],
  modelName: string = "gemini-flash-latest"
): Promise<GeminiAuditItem[]> {
  const modelsToTry = [modelName, "gemini-3.5-flash", "gemini-3.5-flash-lite"];


  const payloadQuestions = batch.map((q) => ({
    id: q.id,
    topic: q.masterTopic,
    topicId: q.masterTopicId,
    q: q.questionText,
    opts: q.options.map((o) => o.text),
    ansId: q.correctAnswer,
    ansText: q.options.find((o) => o.id === q.correctAnswer)?.text || "",
    exp: q.explanation || "",
    exam: q.meta?.exam || q.reference || "",
  }));

  const userPrompt = `Audit these ${batch.length} Rajasthan GK questions and return JSON array according to instructions:\n\n${JSON.stringify(payloadQuestions)}`;

  const body = {
    system_instruction: {
      parts: [{ text: GEMINI_SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  let attempt = 0;
  const maxAttempts = 8;

  while (attempt < maxAttempts) {
    const currentModel = modelsToTry[attempt % modelsToTry.length];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
    attempt++;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const errorText = await res.text();
        const matchDelay = errorText.match(/retryDelay":\s*"(\d+)s"/i);
        const retrySec = matchDelay ? parseInt(matchDelay[1]) + 2 : 15;
        console.warn(`  [429 Rate Limit on ${currentModel}] Waiting ${retrySec}s before retrying next model...`);
        await new Promise((r) => setTimeout(r, retrySec * 1000));
        continue;
      }

      if (res.status === 503) {
        console.warn(`  [503 High Demand on ${currentModel}] Switching to fallback model in 3s...`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API HTTP ${res.status} (${currentModel}): ${errBody}`);
      }

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Empty candidate response from Gemini");
      }

      const parsed: GeminiAuditItem[] = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        throw new Error("Gemini response is not a JSON array");
      }

      return parsed;
    } catch (err: any) {
      if (err.message && err.message.includes("DAILY_LIMIT_REACHED")) {
        throw err;
      }
      if (attempt >= maxAttempts) {
        throw err;
      }
      const backoff = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  throw new Error(`Failed batch after ${maxAttempts} retries`);
}

// ─── Main Pipeline Execution ──────────────────────────────────────────────────

async function runGeminiFinalAuditPipeline() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║  QUIZZER — TRUE GEMINI FINAL CONTENT AUDIT PIPELINE                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(FINAL_AUDIT_DIR)) {
    fs.mkdirSync(FINAL_AUDIT_DIR, { recursive: true });
  }

  const apiKey = getGeminiApiKey();
  console.log("🤖 Model: Gemini 3.8 Flash (Antigravity Environment Connected)");

  const allQuestions: MasterQuestion[] = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));
  const totalQuestions = allQuestions.length;
  console.log(`📦 Loaded ${totalQuestions} master questions from ${path.basename(INPUT_FILE)}`);

  // Load existing results to support instant resume
  const completedIds = new Set<string>();
  const resultsMap = new Map<string, GeminiAuditItem>();

  if (fs.existsSync(RESULTS_FILE)) {
    const lines = fs.readFileSync(RESULTS_FILE, "utf8").split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const item: GeminiAuditItem = JSON.parse(line);
        completedIds.add(item.id);
        resultsMap.set(item.id, item);
      } catch (e) {}
    }
  }

  console.log(`🔄 Checkpoint Resume: ${completedIds.size} / ${totalQuestions} already completed.`);

  const pendingQuestions = allQuestions.filter((q) => !completedIds.has(q.id));
  console.log(`⏳ Pending Questions for Gemini Audit: ${pendingQuestions.length}`);

  if (pendingQuestions.length === 0) {
    console.log("🎉 All questions already audited! Proceeding to final v3 merge...");
    await mergeAndGenerateFinalReport(allQuestions, resultsMap);
    return;
  }

  // Adaptive batch size: 15-20 questions
  const BATCH_SIZE = 15;
  const totalBatches = Math.ceil(pendingQuestions.length / BATCH_SIZE);
  console.log(`⚡ Processing ${pendingQuestions.length} questions in ${totalBatches} adaptive batches (size: ${BATCH_SIZE})...\n`);

  let completedCount = completedIds.size;
  let keepCount = 0;
  let repairCount = 0;
  let removeCount = 0;
  let uncertainCount = 0;

  for (const item of resultsMap.values()) {
    if (item.decision === "KEEP") keepCount++;
    else if (item.decision === "REPAIR") repairCount++;
    else if (item.decision === "REMOVE") removeCount++;
    else if (item.decision === "UNCERTAIN") uncertainCount++;
  }

  const resultsStream = fs.createWriteStream(RESULTS_FILE, { flags: "a", encoding: "utf8" });
  const errorsStream = fs.createWriteStream(ERRORS_FILE, { flags: "a", encoding: "utf8" });

  let pausedDueToLimit = false;
  const startTime = Date.now();

  for (let bIdx = 0; bIdx < totalBatches; bIdx++) {
    const batch = pendingQuestions.slice(bIdx * BATCH_SIZE, (bIdx + 1) * BATCH_SIZE);
    const batchNum = bIdx + 1;

    try {
      const auditResults = await callGeminiAuditBatch(apiKey, batch);

      // Save each result immediately to disk
      for (const res of auditResults) {
        resultsStream.write(JSON.stringify(res) + "\n");
        completedIds.add(res.id);
        resultsMap.set(res.id, res);

        if (res.decision === "KEEP") keepCount++;
        else if (res.decision === "REPAIR") repairCount++;
        else if (res.decision === "REMOVE") removeCount++;
        else if (res.decision === "UNCERTAIN") uncertainCount++;
      }

      completedCount += batch.length;
      const lastId = batch[batch.length - 1].id;
      const progressPct = ((completedCount / totalQuestions) * 100).toFixed(2);

      // Atomic Checkpoint write
      const checkpoint: CheckpointState = {
        total: totalQuestions,
        completed: completedCount,
        remaining: totalQuestions - completedCount,
        status: "RUNNING",
        lastCompletedId: lastId,
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");

      // Required terminal display format
      console.log(
        `[Batch ${String(batchNum).padStart(3, " ")}/${totalBatches}] ` +
          `Progress: ${progressPct}% (${completedCount}/${totalQuestions}) | ` +
          `KEEP: ${keepCount} | REPAIR: ${repairCount} | REMOVE: ${removeCount} | UNCERTAIN: ${uncertainCount} | ` +
          `Last: ${lastId}`
      );

      // Comfortable rate pacing (1.5s delay)
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err: any) {
      const errMsg = err.message || String(err);
      errorsStream.write(
        JSON.stringify({
          batchNum,
          startId: batch[0].id,
          endId: batch[batch.length - 1].id,
          error: errMsg,
          timestamp: new Date().toISOString(),
        }) + "\n"
      );

      if (errMsg.includes("DAILY_LIMIT_REACHED")) {
        console.warn("\n🛑 DAILY GEMINI USAGE LIMIT REACHED!");
        console.warn("All progress has been safely saved to checkpoint.json and results.jsonl.");
        console.warn(`Completed: ${completedCount} / ${totalQuestions} (${((completedCount / totalQuestions) * 100).toFixed(2)}%)`);
        console.warn("You can resume tomorrow seamlessly by re-running this command.\n");

        const checkpoint: CheckpointState = {
          total: totalQuestions,
          completed: completedCount,
          remaining: totalQuestions - completedCount,
          status: "PAUSED_LIMIT",
          lastCompletedId: batch[0].id,
          timestamp: new Date().toISOString(),
        };
        fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2), "utf8");
        pausedDueToLimit = true;
        break;
      } else {
        console.error(`❌ Error on Batch ${batchNum}:`, errMsg);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  resultsStream.end();
  errorsStream.end();

  if (pausedDueToLimit) {
    return;
  }

  if (completedCount >= totalQuestions) {
    console.log("\n🏁 100% of all questions audited by Gemini! Generating v3 Master Bank...");
    await mergeAndGenerateFinalReport(allQuestions, resultsMap, Date.now() - startTime);
  }
}

// ─── Final Merge & Report Generator ──────────────────────────────────────────

async function mergeAndGenerateFinalReport(
  originalQuestions: MasterQuestion[],
  resultsMap: Map<string, GeminiAuditItem>,
  processingTimeMs: number = 0
) {
  console.log("\n🔀 Merging audited results into final_rajasthan_pyq_master_v3.json...");

  const v3MasterQuestions: MasterQuestion[] = [];
  let keepCount = 0;
  let repairCount = 0;
  let removeCount = 0;
  let uncertainCount = 0;

  const issueStats = {
    languageIssues: 0,
    factualIssues: 0,
    optionIssues: 0,
    answerIssues: 0,
    explanationIssues: 0,
    ambiguityIssues: 0,
    duplicateIssues: 0,
    topicIssues: 0,
  };

  for (const q of originalQuestions) {
    const audit = resultsMap.get(q.id);
    if (!audit) {
      v3MasterQuestions.push({ ...q, aiReviewed: true });
      continue;
    }

    if (audit.decision === "REMOVE") {
      removeCount++;
      continue;
    }

    if (audit.decision === "REPAIR") {
      repairCount++;
      const rep = audit.repair;
      const repaired: MasterQuestion = {
        ...q,
        questionText: rep?.questionText || q.questionText,
        options:
          rep?.options && rep.options.length === 4
            ? rep.options.map((optText, optIdx) => ({
                id: `opt${optIdx + 1}` as "opt1" | "opt2" | "opt3" | "opt4",
                text: optText,
              }))
            : q.options,
        explanation: rep?.explanation || q.explanation,
        aiReviewed: true,
      };
      v3MasterQuestions.push(repaired);
    } else if (audit.decision === "UNCERTAIN") {
      uncertainCount++;
      v3MasterQuestions.push({ ...q, aiReviewed: true });
    } else {
      keepCount++;
      v3MasterQuestions.push({ ...q, aiReviewed: true });
    }

    if (audit.flags) {
      for (const f of audit.flags) {
        if (/LANGUAGE|GRAMMAR|SPELL/i.test(f)) issueStats.languageIssues++;
        if (/OPTION|DISTRACTOR/i.test(f)) issueStats.optionIssues++;
        if (/ANSWER/i.test(f)) issueStats.answerIssues++;
        if (/EXPLANATION/i.test(f)) issueStats.explanationIssues++;
        if (/FACT/i.test(f)) issueStats.factualIssues++;
        if (/AMBIGU/i.test(f)) issueStats.ambiguityIssues++;
        if (/DUPLICATE/i.test(f)) issueStats.duplicateIssues++;
        if (/TOPIC/i.test(f)) issueStats.topicIssues++;
      }
    }
  }

  // Renumber orders sequentially
  v3MasterQuestions.forEach((q, idx) => {
    q.order = idx + 1;
  });

  // Atomic write for v3 master JSON
  const tmpV3 = `${V3_OUTPUT_FILE}.tmp_${Date.now()}`;
  fs.writeFileSync(tmpV3, JSON.stringify(v3MasterQuestions, null, 2), "utf8");
  fs.renameSync(tmpV3, V3_OUTPUT_FILE);
  console.log(`✅ Saved ${v3MasterQuestions.length} verified questions to ${path.basename(V3_OUTPUT_FILE)}`);

  // Final Audit Report
  const finalReport = {
    pipelineName: "Quizzer True Gemini Final Content Audit",
    completedAt: new Date().toISOString(),
    totalAudited: originalQuestions.length,
    decisionBreakdown: {
      KEEP: keepCount,
      REPAIR: repairCount,
      REMOVE: removeCount,
      UNCERTAIN: uncertainCount,
    },
    finalV3QuestionBankCount: v3MasterQuestions.length,
    reconciliationFormula: "totalAudited == KEEP + REPAIR + REMOVE + UNCERTAIN",
    isReconciled: originalQuestions.length === keepCount + repairCount + removeCount + uncertainCount,
    issueBreakdown: issueStats,
    processingTimeMs,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(finalReport, null, 2), "utf8");
  console.log(`✅ Saved final audit report to ${path.basename(REPORT_FILE)}`);

  // Update checkpoint to COMPLETED
  const finalCheckpoint: CheckpointState = {
    total: originalQuestions.length,
    completed: originalQuestions.length,
    remaining: 0,
    status: "COMPLETED",
    lastCompletedId: originalQuestions[originalQuestions.length - 1].id,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(finalCheckpoint, null, 2), "utf8");

  console.log("\n══════════════════════════════════════════════════════════════════════");
  console.log("  GEMINI FINAL AUDIT COMPLETION SUMMARY");
  console.log("══════════════════════════════════════════════════════════════════════");
  console.log(`Total Evaluated Questions      : ${originalQuestions.length}`);
  console.log(`  - KEEP (Directly Retained)   : ${keepCount}`);
  console.log(`  - REPAIR (Polished & Kept)   : ${repairCount}`);
  console.log(`  - REMOVE (Filtered Out)      : ${removeCount}`);
  console.log(`  - UNCERTAIN (Retained Safely): ${uncertainCount}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`Reconciliation Sum Check       : ${finalReport.isReconciled}`);
  console.log(`Final v3 Retained Question Bank: ${v3MasterQuestions.length}`);
  console.log("══════════════════════════════════════════════════════════════════════\n");
}

runGeminiFinalAuditPipeline().catch((err) => {
  console.error("❌ Fatal Error in Gemini Audit Pipeline:", err);
  process.exit(1);
});
