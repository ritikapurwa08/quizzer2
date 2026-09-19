import fs from "fs";
import path from "path";
import {
  CANDIDATES_DIR,
  ensurePoolDirectories,
  getId,
  loadPoolState,
  loadTopicQuestions,
  savePoolState,
} from "./utils";
import { DDDQuestion } from "./types";

function parseArgs() {
  const args = process.argv.slice(2);
  let topicId: number | null = null;
  let count: number = 25;
  let dryRun: boolean = false;
  let forceNew: boolean = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" && args[i + 1]) {
      topicId = parseInt(args[++i], 10);
    } else if (arg.startsWith("--topic=")) {
      topicId = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--count" && args[i + 1]) {
      count = parseInt(args[++i], 10);
    } else if (arg.startsWith("--count=")) {
      count = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--force-new") {
      forceNew = true;
    }
  }

  return { topicId, count, dryRun, forceNew };
}

async function main() {
  ensurePoolDirectories();
  const { topicId, count, dryRun, forceNew } = parseArgs();

  if (!topicId || isNaN(topicId) || topicId < 1 || topicId > 73) {
    console.error("Error: Please provide a valid Master Topic ID (1-73) using --topic <id>");
    console.error("Example: bun run scripts/ddd-pool/get-candidates.ts --topic 17 --count 25");
    process.exit(1);
  }

  const state = loadPoolState();
  const topicState = state.topics[String(topicId)];

  if (!topicState) {
    console.error(`Error: Topic ID ${topicId} not found in pool-state.json`);
    process.exit(1);
  }

  const topicData = loadTopicQuestions(topicId);
  const questionsById = new Map<string, DDDQuestion>();
  for (const q of topicData.questions) {
    questionsById.set(q.id, q);
  }

  const availableIds = topicState.available || [];
  const candidateIds = topicState.candidate || [];
  const usedIds = topicState.used || [];
  const requeuedIds = topicState.requeued || [];
  const rejectedIds = topicState.rejected || [];

  const targetCount = Math.min(count, availableIds.length);

  // DRY RUN MODE
  if (dryRun) {
    console.log("=== CANDIDATE WINDOW GENERATION (DRY RUN) ===");
    console.log("Topic:");
    console.log(topicId);
    console.log("\nMaster Topic:");
    console.log(topicState.masterTopic);
    console.log("\nAvailable:");
    console.log(availableIds.length);
    console.log("\nWould select:");
    console.log(targetCount);
    console.log("\nUSED:");
    console.log(usedIds.length);
    console.log("\nREQUEUED:");
    console.log(requeuedIds.length);
    console.log("\nREJECTED:");
    console.log(rejectedIds.length);
    console.log("\nState mutation:");
    console.log("NONE");
    return;
  }

  // NORMAL EXECUTION
  console.log(`=== CANDIDATE WINDOW GENERATION (TOPIC ${topicId}) ===`);
  console.log(`Topic: ${topicState.masterTopic}`);
  console.log(`Available Questions: ${availableIds.length}`);

  if (availableIds.length === 0) {
    console.error(`Error: No available questions left in Topic ${topicId}. Topic is fully exhausted.`);
    process.exit(1);
  }

  if (candidateIds.length > 0 && !forceNew) {
    console.warn(`\nWARNING: Topic ${topicId} already has ${candidateIds.length} questions in CANDIDATE state.`);
    console.warn(`If you want to discard the pending candidates and draw fresh ones, pass --force-new`);
    console.warn(`Or finalize the existing candidate window using finalize-set.ts`);
    process.exit(1);
  }

  // If forceNew, restore previous candidates to the front of available
  if (candidateIds.length > 0 && forceNew) {
    console.log(`Releasing ${candidateIds.length} previous candidates back to available queue...`);
    topicState.available = [...candidateIds, ...topicState.available];
    topicState.candidate = [];
  }

  // Deterministically select top N available questions
  const selectedIds = topicState.available.slice(0, targetCount);
  const remainingAvailable = topicState.available.slice(targetCount);

  // Move selected to candidate state
  topicState.available = remainingAvailable;
  topicState.candidate = selectedIds;

  // Build candidate questions payload
  const candidateQuestions: DDDQuestion[] = [];
  for (const qid of selectedIds) {
    const qObj = questionsById.get(qid);
    if (qObj) {
      candidateQuestions.push(qObj);
    } else {
      console.warn(`Warning: Question ID ${qid} not found in topic file`);
    }
  }

  const nextSetNum = (topicState.completedSets || 0) + 1;
  const padTopic = String(topicId).padStart(2, "0");
  const padSet = String(nextSetNum).padStart(3, "0");

  const topicCandidatesDir = path.join(CANDIDATES_DIR, `topic-${padTopic}`);
  fs.mkdirSync(topicCandidatesDir, { recursive: true });

  const candidateFileName = `candidate-set-${padSet}.json`;
  const candidateFilePath = path.join(topicCandidatesDir, candidateFileName);

  const candidatePayload = {
    candidateWindowId: `topic-${topicId}-candidate-set-${padSet}`,
    masterTopicId: topicId,
    masterTopic: topicState.masterTopic,
    setNumber: nextSetNum,
    generatedAt: new Date().toISOString(),
    candidateCount: candidateQuestions.length,
    candidateIds: selectedIds,
    candidates: candidateQuestions,
  };

  fs.writeFileSync(candidateFilePath, JSON.stringify(candidatePayload, null, 2), "utf-8");
  savePoolState(state);

  console.log(`\n✓ Selected ${candidateQuestions.length} candidates.`);
  console.log(`✓ Marked ${candidateQuestions.length} questions as CANDIDATE in pool-state.json.`);
  console.log(`✓ Remaining Available in Topic ${topicId}: ${topicState.available.length}`);
  console.log(`✓ Saved candidate file to: ${candidateFilePath}`);
}

main().catch((err) => {
  console.error("Failed to get candidates:", err);
  process.exit(1);
});
