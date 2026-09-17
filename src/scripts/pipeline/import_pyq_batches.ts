/**
 * import_pyq_batches.ts
 *
 * CLI importer for src/xdata/final_pyq_batches/ → Convex (Dev or Production).
 *
 * Usage:
 *   bun run src/scripts/pipeline/import_pyq_batches.ts
 *   bun run src/scripts/pipeline/import_pyq_batches.ts --dry-run
 *   bun run src/scripts/pipeline/import_pyq_batches.ts --topic="राजस्थान का एकीकरण"
 *   bun run src/scripts/pipeline/import_pyq_batches.ts --limit=10
 *   bun run src/scripts/pipeline/import_pyq_batches.ts --prod
 */

import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const BATCHES_DIR = path.join(ROOT_DIR, "src/xdata/final_pyq_batches");

interface BatchFile {
  masterTopic: string;
  batchIndex: number;
  batchName: string;
  subject: string;
  subjectSlug: string;
  topicSlug: string;
  negativeMarking: boolean;
  questionCount: number;
  questions: Array<{
    type: "mcq";
    questionText: string;
    options: Array<{ id: string; text: string }>;
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
  }>;
}

interface CliOptions {
  topic?: string;
  dryRun: boolean;
  prod: boolean;
  limit?: number;
  batchDelay: number; // ms between batches
}

function parseCliArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    prod: false,
    batchDelay: 200,
  };
  for (const arg of args) {
    if (arg === "--dry-run" || arg === "--dryRun") options.dryRun = true;
    else if (arg === "--prod") options.prod = true;
    else if (arg.startsWith("--topic=")) options.topic = arg.split("=")[1].replace(/^['"]|['"]$/g, "").trim();
    else if (arg.startsWith("--limit=")) options.limit = parseInt(arg.split("=")[1], 10);
    else if (arg.startsWith("--delay=")) options.batchDelay = parseInt(arg.split("=")[1], 10);
  }
  return options;
}

function getConvexUrl(options: CliOptions): string {
  if (options.prod) {
    return "https://marvelous-chickadee-496.convex.cloud";
  }
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    return process.env.NEXT_PUBLIC_CONVEX_URL;
  }
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("NEXT_PUBLIC_CONVEX_URL=")) {
        return trimmed.split("=")[1].trim();
      }
    }
  }
  return "https://healthy-spider-788.convex.cloud";
}

async function importBatch(
  client: ConvexHttpClient,
  batchPath: string,
  batchFile: string,
  dryRun: boolean
): Promise<{
  status: "imported" | "already_exists" | "validation_failed" | "error";
  count?: number;
  error?: string;
}> {
  let data: BatchFile;
  try {
    data = JSON.parse(fs.readFileSync(batchPath, "utf-8"));
  } catch (e: unknown) {
    return { status: "error", error: `JSON parse error: ${(e as Error).message}` };
  }

  // Validate batch
  if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
    return { status: "validation_failed", error: "No questions in batch" };
  }
  if (data.questions.length > 20) {
    return { status: "validation_failed", error: `Batch has ${data.questions.length} questions (max 20)` };
  }

  // Check all questions have valid sourceQuestionId
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (!q.questionText || !q.options || q.options.length !== 4) {
      return { status: "validation_failed", error: `Question ${i + 1}: missing questionText or invalid options` };
    }
    if (!q.correctAnswer || !q.options.find((o) => o.id === q.correctAnswer)) {
      return { status: "validation_failed", error: `Question ${i + 1}: correctAnswer "${q.correctAnswer}" not found in options` };
    }
    if (!q.meta?.sourceQuestionId || q.meta.sourceQuestionId <= 0) {
      return { status: "validation_failed", error: `Question ${i + 1}: invalid sourceQuestionId` };
    }
  }

  if (dryRun) {
    return { status: "imported", count: data.questions.length };
  }

  // Live import
  let retries = 2;
  while (retries >= 0) {
    try {
      const result = await client.mutation(api.questions.importTestSetAtomic, {
        subjectSlug: data.subjectSlug,
        subjectName: data.subject,
        subjectNameHindi: data.subject,
        topicSlug: data.topicSlug,
        topicName: data.masterTopic,
        topicNameHindi: data.masterTopic,
        testSetName: data.batchName,
        negativeMarking: data.negativeMarking ?? true,
        questions: data.questions.map((q) => ({
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          reference: q.reference || "",
          difficulty: q.difficulty,
          meta: {
            sourceType: q.meta.sourceType,
            sourceQuestionId: q.meta.sourceQuestionId,
            exam: q.meta.exam,
          },
        })),
      });

      if ((result as any).status === "already_exists") {
        return { status: "already_exists", count: (result as any).existingCount };
      }
      return { status: "imported", count: (result as any).imported };
    } catch (err: unknown) {
      if (retries === 0) {
        return { status: "error", error: (err as Error).message || String(err) };
      }
      retries--;
      await new Promise((r) => setTimeout(r, 800));
    }
  }
  return { status: "error", error: "Exceeded retries" };
}

async function runImporter() {
  const options = parseCliArgs();
  const convexUrl = getConvexUrl(options);

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("   Quizzer — PYQ Batch Importer (final_pyq_batches)");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`Target Env : ${options.prod ? `🔥 PRODUCTION (${convexUrl})` : `🛠️  DEV (${convexUrl})`}`);
  console.log(`Mode       : ${options.dryRun ? "🔍 DRY-RUN (no database writes)" : "🚀 LIVE IMPORT"}`);
  if (options.topic) console.log(`Topic Filter: "${options.topic}"`);
  if (options.limit) console.log(`Limit      : ${options.limit} batches`);

  if (!fs.existsSync(BATCHES_DIR)) {
    console.error(`\n[ERROR] final_pyq_batches directory not found: ${BATCHES_DIR}`);
    console.error("Run: bun run src/scripts/pipeline/qa_and_dedupe_pyq.ts first.");
    process.exit(1);
  }

  // Collect all batch files
  interface BatchEntry { file: string; filePath: string; topic: string; batchIndex: number; }
  const allBatches: BatchEntry[] = [];

  const topicDirs = fs.readdirSync(BATCHES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, "hi"));

  for (const td of topicDirs) {
    if (options.topic && !td.name.includes(options.topic)) continue;

    const tPath = path.join(BATCHES_DIR, td.name);
    const files = fs.readdirSync(tPath)
      .filter((f) => f.endsWith(".json"))
      .sort();

    for (const f of files) {
      allBatches.push({
        file: f,
        filePath: path.join(tPath, f),
        topic: td.name,
        batchIndex: parseInt(f.replace(/[^\d]/g, ""), 10) || 0,
      });
    }
  }

  if (options.limit) {
    allBatches.splice(options.limit);
  }

  const total = allBatches.length;
  if (total === 0) {
    console.log("\n[INFO] No batches found matching the given filter.");
    return;
  }

  console.log(`\nTotal batches to process: ${total}`);
  console.log("══════════════════════════════════════════════════════════════\n");

  const client = new ConvexHttpClient(convexUrl);
  let imported = 0;
  let alreadyExists = 0;
  let validationFailed = 0;
  let errors = 0;
  const failedList: { batch: string; error: string }[] = [];

  for (let i = 0; i < allBatches.length; i++) {
    const entry = allBatches[i];
    const label = `[${i + 1}/${total}] "${entry.topic}" / ${entry.file}`;

    const result = await importBatch(client, entry.filePath, entry.file, options.dryRun);

    switch (result.status) {
      case "imported":
        imported++;
        console.log(`  ✅ ${label} — imported ${result.count} questions`);
        break;
      case "already_exists":
        alreadyExists++;
        console.log(`  ⏭️  ${label} — already exists (${result.count} questions), skipped`);
        break;
      case "validation_failed":
        validationFailed++;
        console.log(`  ⚠️  ${label} — validation failed: ${result.error}`);
        failedList.push({ batch: label, error: result.error || "validation failed" });
        break;
      case "error":
        errors++;
        console.log(`  ❌ ${label} — error: ${result.error}`);
        failedList.push({ batch: label, error: result.error || "unknown error" });
        break;
    }

    if (options.batchDelay > 0 && i < allBatches.length - 1) {
      await new Promise((r) => setTimeout(r, options.batchDelay));
    }
  }

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log("  Import Summary");
  console.log("══════════════════════════════════════════════════════════════");
  console.log(`  ✅ Imported      : ${imported}`);
  console.log(`  ⏭️  Already Exists: ${alreadyExists}`);
  console.log(`  ⚠️  Validation Failed: ${validationFailed}`);
  console.log(`  ❌ Errors        : ${errors}`);
  console.log(`  Total Processed  : ${total}`);

  if (failedList.length > 0) {
    console.log("\n  Failed Batches:");
    for (const f of failedList) {
      console.log(`    - ${f.batch}: ${f.error}`);
    }
  }

  console.log("\n══════════════════════════════════════════════════════════════\n");
}

if (import.meta.main) {
  runImporter().catch((err) => {
    console.error("Import failure:", err);
    process.exit(1);
  });
}
