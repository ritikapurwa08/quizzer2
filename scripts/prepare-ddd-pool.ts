import fs from "fs";
import path from "path";
import { RAJASTHAN_GK_MASTER_SECTIONS } from "../src/lib/constants/rajasthanGkMasterTopics";

// Master Topics Map (1 to 73)
const masterTopicsMap = new Map<number, { id: number; nameHindi: string; nameEnglish: string }>();
for (const sec of RAJASTHAN_GK_MASTER_SECTIONS) {
  for (const top of sec.topics) {
    masterTopicsMap.set(top.id, {
      id: top.id,
      nameHindi: top.nameHindi,
      nameEnglish: top.name,
    });
  }
}

async function main() {
  console.log("==================================================");
  console.log("   LOCAL DDD MASTER QUESTION POOL (FRESH START)   ");
  console.log("==================================================\n");

  const cwd = process.cwd();
  const rawDddPath = path.join(cwd, "src", "xdata", "ddd.json");

  if (!fs.existsSync(rawDddPath)) {
    console.error(`ERROR: Master DDD file not found at ${rawDddPath}`);
    process.exit(1);
  }

  // Ensure directories
  const dataDir = path.join(cwd, "data", "ddd");
  const rawDir = path.join(dataDir, "raw");
  const prepDir = path.join(dataDir, "prepared");
  const topicsDir = path.join(dataDir, "topics");

  // Clean data/ddd to ensure fresh state
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(prepDir, { recursive: true });
  fs.mkdirSync(topicsDir, { recursive: true });

  // Copy raw ddd.json to data/ddd/raw/ddd.json
  const destRawDdd = path.join(rawDir, "ddd.json");
  fs.copyFileSync(rawDddPath, destRawDdd);
  console.log("✓ Copied raw ddd.json to data/ddd/raw/ddd.json");

  // Clean any old snapshot file in raw if present
  const oldSnap = path.join(rawDir, "uploaded_420_snapshot.jsonl");
  if (fs.existsSync(oldSnap)) {
    fs.unlinkSync(oldSnap);
  }
  const oldRef = path.join(rawDir, "uploaded_420_reference.json");
  if (fs.existsSync(oldRef)) {
    fs.unlinkSync(oldRef);
  }

  // 1. Load Raw DDD (Complete 16,032 Questions)
  const ddd: any[] = JSON.parse(fs.readFileSync(rawDddPath, "utf-8"));
  const rawCount = ddd.length;
  console.log(`Loaded Complete Raw DDD Questions: ${rawCount}`);

  // 2. Separate Question-Level Split Questions
  const questionLevelSplitList: any[] = [];
  const topicAssignedList: any[] = [];

  for (const q of ddd) {
    const isSplit =
      q.masterTopicId === null ||
      q.masterTopicId === undefined ||
      q._questionLevelSplit === true;

    const formattedQuestion = {
      id: q.id,
      source: q.source || "RajasthanGyan",
      sourceTopicId: q.sourceTopicId ?? null,
      sourceTopic: q.sourceTopic ?? null,
      masterTopicId: q.masterTopicId ?? null,
      masterTopic: q.masterTopic ?? null,
      question: q.question,
      options: q.options,
      answer: q.answer,
      exam: q.exam || null,
      year: typeof q.year === "number" && q.year >= 1950 ? q.year : null,
      explanation: q.explanation || null,
      ...(q._questionLevelSplit ? { _questionLevelSplit: true } : {}),
      ...(q._candidateMasterTopicIds ? { _candidateMasterTopicIds: q._candidateMasterTopicIds } : {}),
    };

    if (isSplit) {
      questionLevelSplitList.push(formattedQuestion);
    } else {
      topicAssignedList.push(formattedQuestion);
    }
  }

  // Write _question_level_split_unassigned.json
  const splitOutPath = path.join(prepDir, "_question_level_split_unassigned.json");
  fs.writeFileSync(splitOutPath, JSON.stringify(questionLevelSplitList, null, 2), "utf-8");
  console.log(`✓ Saved ${questionLevelSplitList.length} unassigned split questions to ${splitOutPath}`);

  // Write all_remaining.json (all assigned clean questions from fresh DDD)
  const allRemainingPath = path.join(prepDir, "all_remaining.json");
  fs.writeFileSync(allRemainingPath, JSON.stringify(topicAssignedList, null, 2), "utf-8");
  console.log(`✓ Saved ${topicAssignedList.length} master topic assigned questions to ${allRemainingPath}`);

  // 3. Organize Topic Queues for all 73 Master Topics
  const questionsByTopic = new Map<number, any[]>();
  for (let id = 1; id <= 73; id++) {
    questionsByTopic.set(id, []);
  }

  for (const q of topicAssignedList) {
    const tid = Number(q.masterTopicId);
    if (tid >= 1 && tid <= 73) {
      questionsByTopic.get(tid)!.push(q);
    }
  }

  // Sort each queue deterministically by original DDD id (e.g. rg_000001, rg_000002, ...)
  for (const [tid, list] of questionsByTopic.entries()) {
    list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  }

  const topicsWithoutQuestions: { id: number; nameHindi: string }[] = [];
  let topicsWithQuestions = 0;

  // Initialize persistent pool-state object
  const poolState: {
    generatedAt: string;
    architecture: string;
    totalMasterPoolQuestions: number;
    totalTopicAssignedQuestions: number;
    totalQuestionLevelSplit: number;
    totalAvailable: number;
    totalUsed: number;
    totalRequeued: number;
    totalRejected: number;
    topics: Record<
      string,
      {
        masterTopicId: number;
        masterTopic: string;
        totalAvailable: number;
        queue: string[];
        used: string[];
        requeued: string[];
        rejected: { id: string; reason: string }[];
      }
    >;
  } = {
    generatedAt: new Date().toISOString(),
    architecture: "LOCAL_MASTER_POOL",
    totalMasterPoolQuestions: rawCount,
    totalTopicAssignedQuestions: topicAssignedList.length,
    totalQuestionLevelSplit: questionLevelSplitList.length,
    totalAvailable: topicAssignedList.length,
    totalUsed: 0,
    totalRequeued: 0,
    totalRejected: 0,
    topics: {},
  };

  // Write each topic queue file (01_....json to 73_....json)
  for (let id = 1; id <= 73; id++) {
    const info = masterTopicsMap.get(id);
    const topicNameHindi = info?.nameHindi || `Topic ${id}`;
    const qList = questionsByTopic.get(id) || [];
    const padId = String(id).padStart(2, "0");

    if (qList.length > 0) {
      topicsWithQuestions++;
    } else {
      topicsWithoutQuestions.push({ id, nameHindi: topicNameHindi });
    }

    const topicPayload = {
      masterTopicId: id,
      masterTopic: topicNameHindi,
      totalAvailable: qList.length,
      questions: qList.map((q) => ({
        id: q.id,
        source: q.source || "RajasthanGyan",
        sourceTopicId: q.sourceTopicId,
        sourceTopic: q.sourceTopic,
        masterTopicId: id,
        masterTopic: topicNameHindi,
        question: q.question,
        options: q.options,
        answer: q.answer,
        exam: q.exam || null,
        year: q.year || null,
        explanation: q.explanation || null,
      })),
    };

    // Sanitize folder/file name for safe Windows filesystem
    const safeTopicName = topicNameHindi.replace(/[\\/:*?"<>|]/g, "_");
    const fileName = `${padId}_${safeTopicName}.json`;
    const topicFilePath = path.join(topicsDir, fileName);

    fs.writeFileSync(topicFilePath, JSON.stringify(topicPayload, null, 2), "utf-8");

    // Add to pool-state
    poolState.topics[String(id)] = {
      masterTopicId: id,
      masterTopic: topicNameHindi,
      totalAvailable: qList.length,
      queue: qList.map((q) => q.id),
      used: [],
      requeued: [],
      rejected: [],
    };
  }

  // Save pool-state.json
  const poolStatePath = path.join(dataDir, "pool-state.json");
  fs.writeFileSync(poolStatePath, JSON.stringify(poolState, null, 2), "utf-8");
  console.log(`✓ Saved persistent queue state to ${poolStatePath}`);

  // 4. Generate _MANIFEST.json
  const manifest = {
    source: "DDD",
    rawCount,
    questionsIncludedInMasterPool: rawCount,
    masterTopicAssignedCount: topicAssignedList.length,
    questionLevelSplitCount: questionLevelSplitList.length,
    masterTopicCount: 73,
    topicsWithQuestions,
    topicsWithoutQuestions: topicsWithoutQuestions.map((t) => `#${t.id} ${t.nameHindi}`),
    removedBecauseOfOld420: 0,
    removedBecauseOfOld380: 0,
    removedBecauseOfFinalPyq: 0,
    convexOperations: 0,
    generatedAt: new Date().toISOString(),
    architecture: "LOCAL_MASTER_POOL",
  };

  const manifestPath = path.join(prepDir, "_MANIFEST.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`✓ Saved manifest to ${manifestPath}`);

  // 5. Mandatory Validation Report
  console.log("\n==================================================");
  console.log("              VALIDATION REPORT                   ");
  console.log("==================================================");
  console.log("DDD RAW:");
  console.log(rawCount.toLocaleString());
  console.log("");
  console.log("QUESTIONS INCLUDED IN NEW LOCAL MASTER POOL:");
  console.log(rawCount.toLocaleString());
  console.log("");
  console.log("MASTER TOPIC ASSIGNED:");
  console.log(topicAssignedList.length.toLocaleString());
  console.log("");
  console.log("QUESTION-LEVEL SPLIT:");
  console.log(questionLevelSplitList.length.toLocaleString());
  console.log("");
  console.log("TOPICS WITH QUESTIONS:");
  console.log(topicsWithQuestions);
  console.log("");
  console.log("TOPICS WITHOUT QUESTIONS:");
  console.log(topicsWithoutQuestions.map((t) => `#${t.id} ${t.nameHindi}`).join("\n"));
  console.log("");
  console.log("REMOVED BECAUSE OF OLD 420:");
  console.log(0);
  console.log("");
  console.log("REMOVED BECAUSE OF OLD 380:");
  console.log(0);
  console.log("");
  console.log("REMOVED BECAUSE OF FINAL PYQ:");
  console.log(0);
  console.log("");
  console.log("CONVEX OPERATIONS:");
  console.log(0);
  console.log("==================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR in prepare-ddd-pool:", err);
  process.exit(1);
});
