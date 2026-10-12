import fs from "fs";
import path from "path";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "../src/lib/constants/rajasthanGkMasterTopics";

const CONVEX_PROD_URL = "https://shiny-wildcat-270.convex.cloud";

async function main() {
  console.log("=========================================================");
  console.log("   SYNC LOCAL POOL-STATE.JSON WITH PROD CONVEX DATABASE  ");
  console.log("=========================================================\n");

  console.log(`Connecting to prod Convex: ${CONVEX_PROD_URL}...`);
  const res = await fetch(`${CONVEX_PROD_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "audit:getAllUsedSourceQuestionIds",
      args: {},
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to query prod Convex: ${res.statusText}`);
  }

  const { value } = await res.json();
  const { totalQuestions, totalUsedSourceIds, byTopic } = value;
  console.log(`✓ Fetched ${totalQuestions} questions (${totalUsedSourceIds} source IDs) across ${byTopic.length} topics from prod Convex.\n`);

  const topicMapByHindi = new Map<string, string[]>();
  for (const t of byTopic) {
    topicMapByHindi.set(t.nameHindi, t.sourceIds);
  }

  const cwd = process.cwd();
  const poolStateFile = path.join(cwd, "data", "ddd", "pool-state.json");
  const topicsDir = path.join(cwd, "data", "ddd", "topics");

  if (!fs.existsSync(poolStateFile)) {
    throw new Error(`pool-state.json not found at ${poolStateFile}`);
  }

  const poolState = JSON.parse(fs.readFileSync(poolStateFile, "utf-8"));

  // Build Master Topics Map
  const masterTopicsMap = new Map<number, string>();
  for (const sec of RAJASTHAN_GK_MASTER_SECTIONS) {
    for (const top of sec.topics) {
      masterTopicsMap.set(top.id, top.nameHindi);
    }
  }

  let totalUpdatedTopics = 0;
  let totalSynchronizedUsed = 0;

  for (let id = 1; id <= 55; id++) {
    const topicKey = String(id);
    const nameHindi = masterTopicsMap.get(id) || `Topic ${id}`;
    const padTopic = String(id).padStart(2, "0");

    // Find topic json file
    const files = fs.readdirSync(topicsDir);
    const fileName = files.find((f) => f.startsWith(`${padTopic}_`) && f.endsWith(".json"));
    if (!fileName) continue;

    const topicFilePath = path.join(topicsDir, fileName);
    const topicData = JSON.parse(fs.readFileSync(topicFilePath, "utf-8"));
    const allQuestions: any[] = topicData.questions || [];
    const allIds = allQuestions.map((q) => String(q.id));

    // Get live used IDs for this topic from prod
    const liveUsedIdsForTopic = new Set<string>(topicMapByHindi.get(nameHindi) || []);


    // Merge existing local used IDs with live prod used IDs
    const existingTopicState = poolState.topics?.[topicKey] || {
      masterTopicId: id,
      masterTopic: nameHindi,
      totalAvailable: allIds.length,
      available: allIds,
      candidate: [],
      used: [],
      requeued: [],
      rejected: [],
    };

    const combinedUsedSet = new Set<string>();
    for (const u of existingTopicState.used || []) {
      const uid = typeof u === "object" && u !== null ? u.id : String(u);
      if (uid) combinedUsedSet.add(uid);
    }
    for (const sid of liveUsedIdsForTopic) {
      combinedUsedSet.add(sid);
    }

    const usedArray = Array.from(combinedUsedSet);
    const availableArray = allIds.filter((id) => !combinedUsedSet.has(id));

    poolState.topics[topicKey] = {
      ...existingTopicState,
      masterTopicId: id,
      masterTopic: nameHindi,
      totalAvailable: availableArray.length,
      available: availableArray,
      candidate: [],
      used: usedArray,
      requeued: existingTopicState.requeued || [],
      rejected: existingTopicState.rejected || [],
    };

    totalSynchronizedUsed += usedArray.length;
    totalUpdatedTopics++;

    if (usedArray.length > 0) {
      console.log(`Topic ${id.toString().padStart(2, " ")}: ${nameHindi.padEnd(45, " ")} | Used: ${usedArray.length.toString().padStart(4, " ")} | Remaining: ${availableArray.length.toString().padStart(4, " ")}`);
    }
  }

  poolState.totalUsed = totalSynchronizedUsed;
  poolState.totalAvailable = 15949 - totalSynchronizedUsed;
  poolState.updatedAt = new Date().toISOString();

  fs.writeFileSync(poolStateFile, JSON.stringify(poolState, null, 2), "utf-8");
  console.log(`\n✓ Successfully synced pool-state.json!`);
  console.log(`  Total Topics Synced: ${totalUpdatedTopics}`);
  console.log(`  Total Used Questions Recorded: ${totalSynchronizedUsed}`);
  console.log(`  Total Remaining Questions in Pool: ${poolState.totalAvailable}`);
}

main().catch(console.error);
