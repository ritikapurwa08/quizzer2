import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import { validateTestSet, PreparedTestSet, PreparedQuestion } from "./validate_tests";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const PREPARED_DIR = path.join(XDATA_DIR, "prepared_tests");

interface ImportCliOptions {
  topic?: string;
  file?: string;
  dryRun: boolean;
  batchSize: number;
  limit?: number;
}

function parseCliArgs(): ImportCliOptions {
  const args = process.argv.slice(2);
  const options: ImportCliOptions = {
    dryRun: false,
    batchSize: 20, // 20 test sets per batch
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg.startsWith("--topic=")) {
      options.topic = arg.split("=")[1].replace(/^["']|["']$/g, "").trim();
    } else if (arg.startsWith("--file=")) {
      options.file = arg.split("=")[1].replace(/^["']|["']$/g, "").trim();
    } else if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseInt(arg.split("=")[1], 10) || 20;
    } else if (arg.startsWith("--limit=")) {
      options.limit = parseInt(arg.split("=")[1], 10);
    }
  }

  return options;
}

function getConvexUrl(): string {
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

async function importSingleTestSet(
  client: ConvexHttpClient,
  filePath: string,
  fileName: string,
  dryRun: boolean
): Promise<{ status: "imported" | "already_exists" | "validation_failed" | "error"; error?: string; count?: number }> {
  let rawData: PreparedTestSet;
  try {
    rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e: unknown) {
    return { status: "error", error: `JSON parse error: ${(e as Error).message}` };
  }

  // 1. Mandatory fail-closed validation
  const valResult = validateTestSet(rawData, fileName);
  if (!valResult.isValid) {
    return { status: "validation_failed", error: valResult.errors.join("; ") };
  }

  if (dryRun) {
    return { status: "imported", count: rawData.questions.length };
  }

  // 2. Atomic live import
  try {
    const payload = {
      subjectSlug: rawData.subjectSlug,
      subjectName: rawData.subject,
      subjectNameHindi: rawData.subject,
      topicSlug: rawData.topicSlug,
      topicName: rawData.topic,
      topicNameHindi: rawData.topic,
      testSetName: rawData.testSetName,
      negativeMarking: rawData.negativeMarking ?? true,
      questions: rawData.questions.map((q: PreparedQuestion) => ({
        type: q.type as "mcq" | "match" | "assertion" | "true_false",
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        reference: q.reference || (q.exam ? `📌 PYQ — ${q.exam}` : undefined),
        difficulty: q.difficulty,
        meta: {
          sourceType: q.sourceType,
          exam: q.exam,
          sourceQuestionId: q.sourceQuestionId,
        },
      })),
    };

    const result = await client.mutation(api.questions.importTestSetAtomic, payload);

    if (result.status === "already_exists") {
      return { status: "already_exists", count: result.existingCount };
    }

    return { status: "imported", count: result.imported };
  } catch (err: unknown) {
    return { status: "error", error: (err as Error).message || String(err) };
  }
}

async function runImporter() {
  const options = parseCliArgs();
  console.log("\n========================================================");
  console.log("   Quizzer2 — Production Batched Test Set Importer");
  console.log("========================================================");
  console.log(`Mode       : ${options.dryRun ? "🔍 DRY-RUN (no database writes)" : "🚀 LIVE PRODUCTION IMPORT"}`);
  console.log(`Batch Size : ${options.batchSize} test sets per batch`);
  if (options.topic) console.log(`Topic Filter: "${options.topic}"`);
  if (options.file) console.log(`File Filter : "${options.file}"`);
  if (options.limit) console.log(`Limit Total : ${options.limit} files`);

  if (!fs.existsSync(PREPARED_DIR)) {
    console.error(`[ERROR] Prepared directory not found: ${PREPARED_DIR}`);
    console.error("Please run 'bun run prepare:tests' first.");
    process.exit(1);
  }

  let testFiles = fs.readdirSync(PREPARED_DIR).filter((f) => f.endsWith(".json"));

  if (options.file) {
    testFiles = testFiles.filter((f) => f.includes(options.file!));
  }

  if (options.topic) {
    const slugifiedTopic = options.topic.toLowerCase().replace(/\s+/g, "-");
    testFiles = testFiles.filter((f) => {
      return f.includes(options.topic!) || f.includes(slugifiedTopic);
    });
  }

  if (options.limit) {
    testFiles = testFiles.slice(0, options.limit);
  }

  const totalFiles = testFiles.length;
  if (totalFiles === 0) {
    console.log(`[INFO] No matching prepared test set files found in ${PREPARED_DIR}`);
    return;
  }

  console.log(`Total test sets to process: ${totalFiles}\n`);

  const convexUrl = getConvexUrl();
  const client = new ConvexHttpClient(convexUrl);

  let totalImported = 0;
  let totalAlreadyExists = 0;
  let totalValidationFailed = 0;
  let totalErrors = 0;
  const failedList: { file: string; error: string }[] = [];

  const totalBatches = Math.ceil(totalFiles / options.batchSize);

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * options.batchSize;
    const endIdx = Math.min(startIdx + options.batchSize, totalFiles);
    const batchFiles = testFiles.slice(startIdx, endIdx);

    // Concurrently process the mini-batch (bounded concurrency: batchSize)
    const results = await Promise.all(
      batchFiles.map(async (fileName) => {
        const filePath = path.join(PREPARED_DIR, fileName);
        const res = await importSingleTestSet(client, filePath, fileName, options.dryRun);
        return { fileName, ...res };
      })
    );

    let batchImported = 0;
    let batchSkipped = 0;
    let batchErrors = 0;

    for (const r of results) {
      if (r.status === "imported") {
        totalImported++;
        batchImported++;
      } else if (r.status === "already_exists") {
        totalAlreadyExists++;
        batchSkipped++;
      } else if (r.status === "validation_failed") {
        totalValidationFailed++;
        batchErrors++;
        failedList.push({ file: r.fileName, error: r.error || "Validation failed" });
      } else if (r.status === "error") {
        totalErrors++;
        batchErrors++;
        failedList.push({ file: r.fileName, error: r.error || "Convex error" });
      }
    }

    const processedSoFar = endIdx;
    const percent = ((processedSoFar / totalFiles) * 100).toFixed(1);
    console.log(
      `[Batch ${b + 1}/${totalBatches}] Processed ${batchFiles.length} sets (${startIdx + 1}..${endIdx} of ${totalFiles}) | New: ${batchImported}, Skipped: ${batchSkipped}, Err: ${batchErrors} | Overall: ${processedSoFar}/${totalFiles} (${percent}%)`
    );

    // Brief gentle pause between batches (50ms)
    if (b < totalBatches - 1 && !options.dryRun) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // Final Summary
  console.log("\n========================================================");
  console.log("   Convex Batch Import Final Summary");
  console.log("========================================================");
  console.log(`Total Test Set Files Processed: ${totalFiles}`);
  console.log(`Successfully Imported (New)   : ${totalImported} sets (${totalImported * 10} questions)`);
  console.log(`Already Existed (Idempotent)  : ${totalAlreadyExists} sets (${totalAlreadyExists * 10} questions)`);
  console.log(`Validation Failures           : ${totalValidationFailed}`);
  console.log(`Convex Errors                 : ${totalErrors}`);

  if (failedList.length > 0) {
    console.log(`\nFailed Files (${failedList.length}):`);
    for (const item of failedList.slice(0, 20)) {
      console.log(`  - [${item.file}]: ${item.error}`);
    }
    if (failedList.length > 20) {
      console.log(`  ... and ${failedList.length - 20} more.`);
    }
  }

  // Query updated global stats
  if (!options.dryRun) {
    try {
      const stats = await client.query(api.testSets.siteStats);
      console.log("\nLive Convex Global Database Stats:");
      console.log(`  Total Test Sets : ${stats.totalSets}`);
      console.log(`  Total Questions : ${stats.totalQuestions}`);
    } catch (e: unknown) {
      console.warn(`Could not query siteStats: ${(e as Error).message}`);
    }
  }

  console.log("========================================================\n");

  if (totalErrors > 0 || totalValidationFailed > 0) {
    process.exit(1);
  }
}

runImporter().catch((err: unknown) => {
  console.error("Fatal import failure:", (err as Error).message || err);
  process.exit(1);
});
