import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { buildTopicPoolQuestions, MASTER_TOPICS_LIST } from "../src/lib/pool/poolBuilder";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const ADMIN_SECRET = "quizzer_admin_pool_init_2026";
const BATCH_SIZE = 150;

async function main() {
  const args = process.argv.slice(2);
  const topicArg = args.find((a) => a.startsWith("--topic="));
  const targetTopicId = topicArg ? parseInt(topicArg.split("=")[1], 10) : undefined;

  console.log("=== QUIZZER QUESTION POOL HYDRATION ===");
  if (targetTopicId) {
    console.log(`Targeting Master Topic ID: ${targetTopicId}`);
  } else {
    console.log("Targeting: ALL 73 Master Topics");
  }

  console.log("Building deduplicated question pool in memory...");
  const { questionsByTopic, stats } = buildTopicPoolQuestions(targetTopicId);

  console.log(`Evaluated: ${stats.totalEvaluated}`);
  console.log(`Available: ${stats.totalKept}`);
  console.log(`Used (from Production): ${stats.totalUsed}`);
  console.log(`Duplicates Excluded: ${stats.totalDuplicates}`);

  // Now push to Convex per topic
  for (const [topicId, questions] of questionsByTopic.entries()) {
    if (questions.length === 0) continue;
    const topicInfo = MASTER_TOPICS_LIST.find((t) => t.id === topicId);
    console.log(`\nTopic ${topicId}: ${topicInfo?.nameHindi || ""} (${questions.length} questions)`);

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
      const batch = questions.slice(i, i + BATCH_SIZE);
      const res = await client.mutation(api.pool.batchInsertPoolQuestions, {
        adminSecret: ADMIN_SECRET,
        questions: batch,
      });
      process.stdout.write(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(questions.length / BATCH_SIZE)} (${res.inserted} items)\r`);
    }
    console.log(`  ✓ Topic ${topicId} completed!`);
  }

  console.log("\n=== ALL POOL HYDRATION COMPLETED SUCCESSFULLY ===");
}

main().catch((err) => {
  console.error("Hydration failed:", err);
  process.exit(1);
});
