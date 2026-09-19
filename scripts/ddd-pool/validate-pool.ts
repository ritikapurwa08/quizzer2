import fs from "fs";
import path from "path";
import {
  DATA_DIR,
  TOPICS_DIR,
  SETS_DIR,
  loadPoolState,
  loadTopicQuestions,
  MASTER_TOPICS,
  getId,
} from "./utils";
import { DDDQuestion } from "./types";

interface ValidationIssue {
  type: "ERROR" | "WARNING";
  code: string;
  topicId?: number;
  questionId?: string;
  setId?: string;
  message: string;
}

async function main() {
  console.log("==================================================");
  console.log("       LOCAL DDD MASTER POOL AUDIT & VALIDATION   ");
  console.log("==================================================\n");

  const issues: ValidationIssue[] = [];

  // 1. Validate Master Topic IDs & Load all canonical DDD questions
  const allCanonicalQuestions = new Map<string, { topicId: number; q: DDDQuestion }>();
  let totalCanonicalCount = 0;

  for (let id = 1; id <= 73; id++) {
    if (!MASTER_TOPICS.has(id)) {
      issues.push({
        type: "ERROR",
        code: "UNKNOWN_MASTER_TOPIC_ID",
        topicId: id,
        message: `Topic ID ${id} is not in authoritative Master Topics (1-73)`,
      });
    }

    try {
      const topicData = loadTopicQuestions(id);
      if (topicData.masterTopicId !== id) {
        issues.push({
          type: "ERROR",
          code: "MISMATCHED_TOPIC_FILE_ID",
          topicId: id,
          message: `Topic file has masterTopicId ${topicData.masterTopicId} but expected ${id}`,
        });
      }

      for (const q of topicData.questions) {
        totalCanonicalCount++;
        if (allCanonicalQuestions.has(q.id)) {
          const prev = allCanonicalQuestions.get(q.id)!;
          issues.push({
            type: "ERROR",
            code: "DUPLICATE_DDD_ID_ACROSS_TOPICS",
            questionId: q.id,
            message: `Question ID ${q.id} appears in both Topic ${prev.topicId} and Topic ${id}`,
          });
        } else {
          allCanonicalQuestions.set(q.id, { topicId: id, q });
        }
      }
    } catch {
      // Empty topic file or missing
    }
  }

  // 2. Validate Question-Level Split unassigned file
  const splitPath = path.join(DATA_DIR, "prepared", "_question_level_split_unassigned.json");
  let splitCount = 0;
  if (fs.existsSync(splitPath)) {
    try {
      const splitList: DDDQuestion[] = JSON.parse(fs.readFileSync(splitPath, "utf-8"));
      splitCount = splitList.length;
      for (const sq of splitList) {
        if (allCanonicalQuestions.has(sq.id)) {
          issues.push({
            type: "ERROR",
            code: "SPLIT_QUESTION_EXISTS_IN_TOPIC",
            questionId: sq.id,
            message: `Split question ${sq.id} also exists in topic queues!`,
          });
        }
      }
    } catch (err: any) {
      issues.push({
        type: "ERROR",
        code: "CORRUPT_SPLIT_FILE",
        message: `Failed to parse _question_level_split_unassigned.json: ${err.message}`,
      });
    }
  } else {
    issues.push({
      type: "WARNING",
      code: "MISSING_SPLIT_FILE",
      message: `_question_level_split_unassigned.json not found in prepared/`,
    });
  }

  // 3. Validate pool-state.json consistency
  let poolState: any = null;
  try {
    poolState = loadPoolState();
  } catch (err: any) {
    issues.push({
      type: "ERROR",
      code: "CORRUPT_POOL_STATE",
      message: `Failed to load pool-state.json: ${err.message}`,
    });
  }

  if (poolState) {
    for (let id = 1; id <= 73; id++) {
      const ts = poolState.topics?.[String(id)];
      if (!ts) {
        issues.push({
          type: "ERROR",
          code: "MISSING_TOPIC_IN_STATE",
          topicId: id,
          message: `Topic ${id} is missing from pool-state.json`,
        });
        continue;
      }

      const availableSet = new Set<string>();
      for (const qid of ts.available || []) {
        if (!allCanonicalQuestions.has(qid)) {
          issues.push({
            type: "ERROR",
            code: "UNKNOWN_QUESTION_ID_IN_AVAILABLE",
            topicId: id,
            questionId: qid,
            message: `Unknown question ID ${qid} found in Topic ${id} AVAILABLE list`,
          });
        }
        if (availableSet.has(qid)) {
          issues.push({
            type: "ERROR",
            code: "DUPLICATE_ID_IN_AVAILABLE_QUEUE",
            topicId: id,
            questionId: qid,
            message: `Question ID ${qid} appears multiple times in Topic ${id} AVAILABLE queue`,
          });
        }
        availableSet.add(qid);
      }

      const candidateSet = new Set<string>();
      for (const qid of ts.candidate || []) {
        if (!allCanonicalQuestions.has(qid)) {
          issues.push({
            type: "ERROR",
            code: "UNKNOWN_QUESTION_ID_IN_CANDIDATE",
            topicId: id,
            questionId: qid,
            message: `Unknown question ID ${qid} found in Topic ${id} CANDIDATE list`,
          });
        }
        candidateSet.add(qid);
      }

      const usedSet = new Set<string>();
      for (const u of ts.used || []) {
        const uid = getId(u);
        if (!allCanonicalQuestions.has(uid)) {
          issues.push({
            type: "ERROR",
            code: "UNKNOWN_QUESTION_ID_IN_USED",
            topicId: id,
            questionId: uid,
            message: `Unknown question ID ${uid} found in Topic ${id} USED list`,
          });
        }
        usedSet.add(uid);
      }

      const rejectedSet = new Set<string>();
      for (const r of ts.rejected || []) {
        const rid = getId(r);
        if (!allCanonicalQuestions.has(rid)) {
          issues.push({
            type: "ERROR",
            code: "UNKNOWN_QUESTION_ID_IN_REJECTED",
            topicId: id,
            questionId: rid,
            message: `Unknown question ID ${rid} found in Topic ${id} REJECTED list`,
          });
        }
        rejectedSet.add(rid);
      }

      // Mutual exclusivity checks
      for (const uid of usedSet) {
        if (availableSet.has(uid)) {
          issues.push({
            type: "ERROR",
            code: "USED_QUESTION_IN_AVAILABLE",
            topicId: id,
            questionId: uid,
            message: `Question ${uid} is marked USED but also appears in AVAILABLE queue!`,
          });
        }
        if (candidateSet.has(uid)) {
          issues.push({
            type: "ERROR",
            code: "USED_QUESTION_IN_CANDIDATE",
            topicId: id,
            questionId: uid,
            message: `Question ${uid} is marked USED but also appears in CANDIDATE queue!`,
          });
        }
      }

      for (const rid of rejectedSet) {
        if (availableSet.has(rid)) {
          issues.push({
            type: "ERROR",
            code: "REJECTED_QUESTION_IN_AVAILABLE",
            topicId: id,
            questionId: rid,
            message: `Question ${rid} is marked REJECTED but also appears in AVAILABLE queue!`,
          });
        }
      }
    }
  }

  // 4. Validate Final Sets directory
  const seenSetIds = new Set<string>();
  const questionUsedAcrossSets = new Map<string, string>();

  if (fs.existsSync(SETS_DIR)) {
    const topicDirs = fs.readdirSync(SETS_DIR);
    for (const td of topicDirs) {
      const fullTd = path.join(SETS_DIR, td);
      if (!fs.statSync(fullTd).isDirectory()) continue;
      const setFiles = fs.readdirSync(fullTd).filter((f) => f.endsWith(".json"));

      for (const sf of setFiles) {
        try {
          const setData = JSON.parse(fs.readFileSync(path.join(fullTd, sf), "utf-8"));
          const setId = setData.setId || `${td}_${sf}`;

          if (seenSetIds.has(setId)) {
            issues.push({
              type: "ERROR",
              code: "DUPLICATE_FINAL_SET_ID",
              setId,
              message: `Duplicate set ID ${setId} encountered in sets directory`,
            });
          }
          seenSetIds.add(setId);

          // Verify questions in set
          for (const q of setData.questions || []) {
            const qid = q.id;
            if (questionUsedAcrossSets.has(qid)) {
              issues.push({
                type: "ERROR",
                code: "QUESTION_IN_MULTIPLE_SETS",
                questionId: qid,
                setId,
                message: `Question ${qid} is used in both ${questionUsedAcrossSets.get(qid)} and ${setId}`,
              });
            } else {
              questionUsedAcrossSets.set(qid, setId);
            }
          }
        } catch (err: any) {
          issues.push({
            type: "ERROR",
            code: "CORRUPT_SET_FILE",
            setId: `${td}/${sf}`,
            message: `Failed to parse set file ${td}/${sf}: ${err.message}`,
          });
        }
      }
    }
  }

  // Summary Report
  const errors = issues.filter((i) => i.type === "ERROR");
  const warnings = issues.filter((i) => i.type === "WARNING");

  console.log("=== VALIDATION AUDIT RESULTS ===");
  console.log(`Canonical Questions in 73 Topics: ${totalCanonicalCount.toLocaleString()}`);
  console.log(`Question-Level Split Unassigned: ${splitCount.toLocaleString()}`);
  console.log(`Total Master Questions Accounted: ${(totalCanonicalCount + splitCount).toLocaleString()}`);
  console.log(`Total Final Sets Inspected: ${seenSetIds.size}`);
  console.log(`Errors Found: ${errors.length}`);
  console.log(`Warnings Found: ${warnings.length}`);

  if (errors.length > 0) {
    console.log("\n[ERRORS]");
    for (const e of errors) {
      console.error(`  ✖ [${e.code}] ${e.message}`);
    }
  }

  if (warnings.length > 0) {
    console.log("\n[WARNINGS]");
    for (const w of warnings) {
      console.warn(`  ▲ [${w.code}] ${w.message}`);
    }
  }

  if (errors.length === 0) {
    console.log("\n✓ POOL VALIDATION PASSED: 0 errors detected. Local pool state is 100% healthy!");
  } else {
    console.error(`\n✖ POOL VALIDATION FAILED: ${errors.length} critical errors detected.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Validation failed with runtime exception:", err);
  process.exit(1);
});
