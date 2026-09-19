import fs from "fs";
import {
  ensurePoolDirectories,
  loadPoolState,
  savePoolState,
  loadTopicQuestions,
  MASTER_TOPICS,
  POOL_STATE_PATH,
} from "./utils";
import { PoolState, TopicQueueState } from "./types";

async function main() {
  console.log("=== INITIALIZING LOCAL DDD POOL STATE ===");
  ensurePoolDirectories();

  let existingState: PoolState | null = null;
  if (fs.existsSync(POOL_STATE_PATH)) {
    try {
      existingState = loadPoolState();
      console.log("Found existing pool-state.json. Preserving existing progress...");
    } catch {
      existingState = null;
    }
  }

  const newTopics: Record<string, TopicQueueState> = {};
  let totalAssigned = 0;

  for (let id = 1; id <= 73; id++) {
    const info = MASTER_TOPICS.get(id);
    const nameHindi = info?.nameHindi || `Topic ${id}`;
    let qData: any = { questions: [] };
    try {
      qData = loadTopicQuestions(id);
    } catch {
      qData = { questions: [] };
    }

    const allTopicQIds = (qData.questions || []).map((q: any) => String(q.id));
    totalAssigned += allTopicQIds.length;

    const prev = existingState?.topics?.[String(id)];

    if (prev) {
      // Preserve existing used, requeued, rejected, completedSets
      const usedIds = new Set(prev.used.map((u) => (typeof u === "string" ? u : u.id)));
      const rejectedIds = new Set(prev.rejected.map((r) => (typeof r === "string" ? r : r.id)));
      const candidateIds = new Set(prev.candidate || []);

      // If available list exists in prev, keep it, but ensure no used/rejected are in it
      const available = Array.isArray(prev.available)
        ? prev.available.filter((qid: string | { id: string }) => {
            const idStr = typeof qid === "string" ? qid : qid.id;
            return !usedIds.has(idStr) && !rejectedIds.has(idStr);
          })
        : (prev as any).queue
        ? (prev as any).queue.filter((qid: string) => !usedIds.has(qid) && !rejectedIds.has(qid))
        : allTopicQIds.filter((qid: string) => !usedIds.has(qid) && !rejectedIds.has(qid));

      newTopics[String(id)] = {
        masterTopicId: id,
        masterTopic: nameHindi,
        available,
        candidate: prev.candidate || [],
        used: prev.used || [],
        requeued: prev.requeued || [],
        rejected: prev.rejected || [],
        completedSets: prev.completedSets || 0,
      };
    } else {
      // Fresh queue from topic file
      newTopics[String(id)] = {
        masterTopicId: id,
        masterTopic: nameHindi,
        available: allTopicQIds,
        candidate: [],
        used: [],
        requeued: [],
        rejected: [],
        completedSets: 0,
      };
    }
  }

  const poolState: PoolState = {
    generatedAt: existingState?.generatedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    architecture: "LOCAL_MASTER_POOL",
    totalMasterPoolQuestions: 16032,
    totalTopicAssignedQuestions: totalAssigned,
    totalQuestionLevelSplit: 195,
    topics: newTopics,
  };

  savePoolState(poolState);
  console.log(`✓ pool-state.json successfully synchronized across 73 topics.`);
  console.log(`  Total Master Topic Assigned: ${totalAssigned}`);
  console.log(`  Question-Level Split: 195`);
  console.log(`  Total Master Pool: 16,032`);
}

main().catch((err) => {
  console.error("Initialization failed:", err);
  process.exit(1);
});
