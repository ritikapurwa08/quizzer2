import fs from "fs";
import path from "path";
import {
  ensurePoolDirectories,
  loadPoolState,
  savePoolState,
  loadTopicQuestions,
  SETS_DIR,
  HISTORY_DIR,
  getId,
} from "./utils";
import { DDDQuestion, RequeuedEntry, UsedEntry, RejectedEntry } from "./types";

function parseArgs() {
  const args = process.argv.slice(2);
  let topicId: number | null = null;
  let setNumber: number | null = null;
  let inputPath: string | null = null;
  let allowPartial: boolean = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" && args[i + 1]) {
      topicId = parseInt(args[++i], 10);
    } else if (arg.startsWith("--topic=")) {
      topicId = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--set" && args[i + 1]) {
      setNumber = parseInt(args[++i], 10);
    } else if (arg.startsWith("--set=")) {
      setNumber = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--input" && args[i + 1]) {
      inputPath = args[++i];
    } else if (arg.startsWith("--input=")) {
      inputPath = arg.split("=")[1];
    } else if (arg === "--allow-partial") {
      allowPartial = true;
    }
  }

  return { topicId, setNumber, inputPath, allowPartial };
}

async function main() {
  ensurePoolDirectories();
  const { topicId, setNumber, inputPath, allowPartial } = parseArgs();

  if (!topicId || isNaN(topicId) || topicId < 1 || topicId > 73) {
    console.error("Error: Please provide a valid Master Topic ID (1-73) using --topic <id>");
    process.exit(1);
  }

  if (!setNumber || isNaN(setNumber) || setNumber < 1) {
    console.error("Error: Please provide a valid Set number using --set <n>");
    process.exit(1);
  }

  if (!inputPath || !fs.existsSync(inputPath)) {
    console.error(`Error: Reviewed input JSON file not found at: ${inputPath}`);
    console.error("Expected format: { selectedIds: [...], requeuedIds: [...], rejectedIds: [{ id, reason }] }");
    process.exit(1);
  }

  const reviewedData = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
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

  const padTopic = String(topicId).padStart(2, "0");
  const padSet = String(setNumber).padStart(3, "0");
  const setId = `topic-${topicId}-set-${padSet}`;

  // Extract reviewed ID groupings
  // reviewedData can either have selectedIds: string[] or selected: Array<{ id, ... }>
  const extractIds = (val: any): string[] => {
    if (!Array.isArray(val)) return [];
    return val.map(getId).filter(Boolean);
  };

  const selectedIds: string[] = extractIds(reviewedData.selectedIds || reviewedData.selected || []);
  const requeuedIds: string[] = extractIds(reviewedData.requeuedIds || reviewedData.requeued || []);

  const rawRejected = reviewedData.rejectedIds || reviewedData.rejected || [];
  const rejectedEntries: { id: string; reason: string }[] = [];
  if (Array.isArray(rawRejected)) {
    for (const item of rawRejected) {
      if (typeof item === "string") {
        rejectedEntries.push({ id: item, reason: "Invalid or corrupted question" });
      } else if (item && typeof item === "object") {
        rejectedEntries.push({
          id: String(item.id),
          reason: item.reason || "Question corrupted or invalid",
        });
      }
    }
  }

  console.log(`=== FINALIZING SET ${setNumber} FOR TOPIC ${topicId} ===`);
  console.log(`Topic: ${topicState.masterTopic}`);
  console.log(`Selected questions: ${selectedIds.length}`);
  console.log(`Requeued (within-set repetition): ${requeuedIds.length}`);
  console.log(`Rejected (invalid/corrupt): ${rejectedEntries.length}`);

  // Validation: Check set size
  const totalAvailableAndCandidate = (topicState.available?.length || 0) + (topicState.candidate?.length || 0);
  const isExhaustedTopic = totalAvailableAndCandidate < 20;

  if (selectedIds.length !== 20) {
    if (isExhaustedTopic || allowPartial) {
      console.warn(`NOTE: Set has ${selectedIds.length} questions (<20) because topic is near exhaustion / allow-partial set.`);
    } else {
      console.error(`Error: A normal set must have EXACTLY 20 selected questions. Got: ${selectedIds.length}`);
      console.error(`If the topic is genuinely exhausted and has fewer than 20 questions, use --allow-partial`);
      process.exit(1);
    }
  }

  // Validation: All selected IDs must exist in topic questions
  for (const qid of selectedIds) {
    if (!questionsById.has(qid)) {
      console.error(`Error: Selected question ID ${qid} does not exist in Topic ${topicId}`);
      process.exit(1);
    }
  }

  // Check overlap between selected, requeued, and rejected
  const allReviewedIds = [...selectedIds, ...requeuedIds, ...rejectedEntries.map((r) => r.id)];
  const reviewedIdSet = new Set(allReviewedIds);
  if (reviewedIdSet.size !== allReviewedIds.length) {
    console.error("Error: Duplicate IDs found across selected, requeued, or rejected categories.");
    process.exit(1);
  }

  // 1. Move selected to USED
  const usedMap = new Map<string, UsedEntry>();
  for (const u of topicState.used) {
    const uid = getId(u);
    usedMap.set(uid, typeof u === "object" ? u : { id: uid, usedInSet: setId, usedAt: new Date().toISOString() });
  }

  for (const qid of selectedIds) {
    usedMap.set(qid, {
      id: qid,
      usedInSet: setId,
      usedAt: new Date().toISOString(),
    });
  }
  topicState.used = Array.from(usedMap.values());

  // 2. Move requeued to end of AVAILABLE queue
  const prevRequeuedMap = new Map<string, RequeuedEntry>();
  for (const r of topicState.requeued) {
    const rid = getId(r);
    prevRequeuedMap.set(rid, typeof r === "object" ? r : { id: rid, requeueCount: 1, lastRejectedFromSet: setId });
  }

  const existingAvailableSet = new Set(topicState.available);
  for (const qid of requeuedIds) {
    const prev = prevRequeuedMap.get(qid);
    const newCount = (prev?.requeueCount || 0) + 1;
    prevRequeuedMap.set(qid, {
      id: qid,
      requeueCount: newCount,
      lastRejectedFromSet: setId,
      reason: "Current-set repetition",
    });

    // Append to end of topic available queue if not already there
    if (!existingAvailableSet.has(qid)) {
      topicState.available.push(qid);
      existingAvailableSet.add(qid);
    }
  }
  topicState.requeued = Array.from(prevRequeuedMap.values());

  // 3. Record REJECTED
  const rejectedMap = new Map<string, RejectedEntry>();
  for (const r of topicState.rejected) {
    const rid = getId(r);
    rejectedMap.set(rid, typeof r === "object" ? r : { id: rid, reason: "Corrupted", rejectedAt: new Date().toISOString() });
  }
  for (const r of rejectedEntries) {
    rejectedMap.set(r.id, {
      id: r.id,
      reason: r.reason,
      rejectedAt: new Date().toISOString(),
    });
  }
  topicState.rejected = Array.from(rejectedMap.values());

  // 4. Clear candidate state
  const accountedIds = new Set(allReviewedIds);
  topicState.candidate = (topicState.candidate || []).filter((cid) => !accountedIds.has(cid));

  // 5. Update completedSets count
  topicState.completedSets = Math.max(topicState.completedSets || 0, setNumber);

  // 6. Build and write Final Set JSON
  const finalQuestions: DDDQuestion[] = [];
  for (const qid of selectedIds) {
    // If review input modified question wording/explanation (repaired), merge it
    const orig = questionsById.get(qid)!;
    const reviewedItem = (reviewedData.questions || []).find((q: any) => q.id === qid);
    if (reviewedItem) {
      finalQuestions.push({
        ...orig,
        question: reviewedItem.question || orig.question,
        options: reviewedItem.options || orig.options,
        answer: reviewedItem.answer !== undefined ? reviewedItem.answer : orig.answer,
        explanation: reviewedItem.explanation !== undefined ? reviewedItem.explanation : orig.explanation,
      });
    } else {
      finalQuestions.push(orig);
    }
  }

  const topicSetsDir = path.join(SETS_DIR, `topic-${padTopic}`);
  fs.mkdirSync(topicSetsDir, { recursive: true });

  const finalSetPayload = {
    setId,
    masterTopicId: topicId,
    masterTopic: topicState.masterTopic,
    setNumber,
    completedAt: new Date().toISOString(),
    questionCount: finalQuestions.length,
    questionIds: selectedIds,
    questions: finalQuestions,
  };

  const finalSetFilePath = path.join(topicSetsDir, `set-${padSet}.json`);
  fs.writeFileSync(finalSetFilePath, JSON.stringify(finalSetPayload, null, 2), "utf-8");

  // 7. Write History Audit JSON
  const topicHistoryDir = path.join(HISTORY_DIR, `topic-${padTopic}`);
  fs.mkdirSync(topicHistoryDir, { recursive: true });

  const historyPayload = {
    setId,
    masterTopicId: topicId,
    masterTopic: topicState.masterTopic,
    setNumber,
    timestamp: new Date().toISOString(),
    candidateIds: allReviewedIds,
    selectedIds,
    requeuedIds,
    rejectedEntries,
    finalQuestionCount: finalQuestions.length,
  };

  const historyFilePath = path.join(topicHistoryDir, `topic-${padTopic}-set-${padSet}-history.json`);
  fs.writeFileSync(historyFilePath, JSON.stringify(historyPayload, null, 2), "utf-8");

  // Save updated state
  savePoolState(state);

  console.log(`\n✓ Final Set JSON created: ${finalSetFilePath}`);
  console.log(`✓ Audit History created: ${historyFilePath}`);
  console.log(`✓ Successfully updated pool-state.json:`);
  console.log(`  - Used: ${topicState.used.length}`);
  console.log(`  - Requeued: ${topicState.requeued.length}`);
  console.log(`  - Rejected: ${topicState.rejected.length}`);
  console.log(`  - Available Remaining: ${topicState.available.length}`);
  console.log(`  - Completed Sets: ${topicState.completedSets}`);
}

main().catch((err) => {
  console.error("Failed to finalize set:", err);
  process.exit(1);
});
