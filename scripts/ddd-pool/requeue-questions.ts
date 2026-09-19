import { loadPoolState, savePoolState } from "./utils";
import { RequeuedEntry } from "./types";

function parseArgs() {
  const args = process.argv.slice(2);
  let topicId: number | null = null;
  let releaseCandidates: boolean = false;
  let idsToRequeue: string[] = [];
  let reason: string = "Manual requeue";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" && args[i + 1]) {
      topicId = parseInt(args[++i], 10);
    } else if (arg.startsWith("--topic=")) {
      topicId = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--release-candidates") {
      releaseCandidates = true;
    } else if (arg === "--ids" && args[i + 1]) {
      idsToRequeue = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg.startsWith("--ids=")) {
      idsToRequeue = arg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--reason" && args[i + 1]) {
      reason = args[++i];
    }
  }

  return { topicId, releaseCandidates, idsToRequeue, reason };
}

async function main() {
  const { topicId, releaseCandidates, idsToRequeue, reason } = parseArgs();

  if (!topicId || isNaN(topicId) || topicId < 1 || topicId > 73) {
    console.error("Error: Please specify a valid Master Topic ID (1-73) using --topic <id>");
    process.exit(1);
  }

  const state = loadPoolState();
  const topicState = state.topics[String(topicId)];

  if (!topicState) {
    console.error(`Error: Topic ID ${topicId} not found in pool-state.json`);
    process.exit(1);
  }

  console.log(`=== REQUEUE UTILITY (TOPIC ${topicId}: ${topicState.masterTopic}) ===`);

  if (releaseCandidates) {
    const count = topicState.candidate?.length || 0;
    if (count === 0) {
      console.log("No questions currently in CANDIDATE state.");
      return;
    }

    console.log(`Releasing ${count} candidate questions back to the front of AVAILABLE queue...`);
    topicState.available = [...(topicState.candidate || []), ...(topicState.available || [])];
    topicState.candidate = [];
    savePoolState(state);
    console.log(`✓ Restored ${count} questions to AVAILABLE. Available count is now ${topicState.available.length}`);
    return;
  }

  if (idsToRequeue.length > 0) {
    console.log(`Requeuing ${idsToRequeue.length} questions to the END of the topic queue...`);
    const availableSet = new Set(topicState.available);
    const candidateSet = new Set(topicState.candidate);

    for (const qid of idsToRequeue) {
      // Remove from candidate if there
      topicState.candidate = (topicState.candidate || []).filter((id) => id !== qid);
      // Remove from existing position in available
      topicState.available = (topicState.available || []).filter((id) => id !== qid);
      // Append to the end of available queue
      topicState.available.push(qid);

      // Record in requeued list
      const prevEntry = topicState.requeued.find((r) => (typeof r === "string" ? r === qid : r.id === qid));
      const newCount = prevEntry && typeof prevEntry === "object" ? prevEntry.requeueCount + 1 : 1;
      topicState.requeued = (topicState.requeued || []).filter((r) => (typeof r === "string" ? r !== qid : r.id !== qid));
      topicState.requeued.push({
        id: qid,
        requeueCount: newCount,
        lastRejectedFromSet: "manual-requeue",
        reason,
      });
    }

    savePoolState(state);
    console.log(`✓ Appended ${idsToRequeue.length} questions to end of queue.`);
    console.log(`✓ Updated pool-state.json.`);
    return;
  }

  console.log("No action specified. Use --release-candidates or --ids <id1,id2,...>");
}

main().catch((err) => {
  console.error("Requeue operation failed:", err);
  process.exit(1);
});
