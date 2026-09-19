import { loadPoolState, loadTopicQuestions, MASTER_TOPICS } from "./utils";

function parseArgs() {
  const args = process.argv.slice(2);
  let topicId: number | null = null;
  let showAll: boolean = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--topic" && args[i + 1]) {
      topicId = parseInt(args[++i], 10);
    } else if (arg.startsWith("--topic=")) {
      topicId = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--all") {
      showAll = true;
    }
  }

  return { topicId, showAll };
}

async function main() {
  const { topicId, showAll } = parseArgs();
  const state = loadPoolState();

  if (topicId) {
    const topicState = state.topics[String(topicId)];
    if (!topicState) {
      console.error(`Error: Topic ID ${topicId} not found in pool-state.json`);
      process.exit(1);
    }

    let rawTotal = 0;
    try {
      const topicData = loadTopicQuestions(topicId);
      rawTotal = topicData.questions.length;
    } catch {
      rawTotal =
        (topicState.available?.length || 0) +
        (topicState.candidate?.length || 0) +
        (topicState.used?.length || 0) +
        (topicState.rejected?.length || 0);
    }

    const available = topicState.available?.length || 0;
    const candidate = topicState.candidate?.length || 0;
    const used = topicState.used?.length || 0;
    const requeued = topicState.requeued?.length || 0;
    const rejected = topicState.rejected?.length || 0;
    const completedSets = topicState.completedSets || 0;
    const nextWindow = Math.min(25, available);

    console.log(`Topic ${topicId} — ${topicState.masterTopic}\n`);
    console.log("Total:");
    console.log(rawTotal);
    console.log("\nAvailable:");
    console.log(available);
    console.log("\nCandidate:");
    console.log(candidate);
    console.log("\nUsed:");
    console.log(used);
    console.log("\nRequeued:");
    console.log(requeued);
    console.log("\nRejected:");
    console.log(rejected);
    console.log("\nCompleted Sets:");
    console.log(completedSets);
    console.log("\nNext Candidate Window:");
    console.log(nextWindow);
    return;
  }

  // If no topic specified, show overview of all 73 topics
  console.log("=========================================================================================");
  console.log("                      LOCAL DDD MASTER POOL STATUS OVERVIEW                              ");
  console.log("=========================================================================================");
  console.log(
    `${"ID".padEnd(4)} | ${"Master Topic".padEnd(36)} | ${"Total".padEnd(6)} | ${"Avail".padEnd(6)} | ${"Cand".padEnd(5)} | ${"Used".padEnd(5)} | ${"Req".padEnd(5)} | ${"Rej".padEnd(5)} | Sets`
  );
  console.log("-----------------------------------------------------------------------------------------");

  let grandTotal = 0;
  let grandAvail = 0;
  let grandCand = 0;
  let grandUsed = 0;
  let grandReq = 0;
  let grandRej = 0;
  let grandSets = 0;

  for (let id = 1; id <= 73; id++) {
    const topicState = state.topics[String(id)];
    const info = MASTER_TOPICS.get(id);
    const nameHindi = topicState?.masterTopic || info?.nameHindi || `Topic ${id}`;

    let total = 0;
    try {
      const topicData = loadTopicQuestions(id);
      total = topicData.questions.length;
    } catch {
      total = 0;
    }

    const available = topicState?.available?.length || 0;
    const candidate = topicState?.candidate?.length || 0;
    const used = topicState?.used?.length || 0;
    const requeued = topicState?.requeued?.length || 0;
    const rejected = topicState?.rejected?.length || 0;
    const sets = topicState?.completedSets || 0;

    grandTotal += total;
    grandAvail += available;
    grandCand += candidate;
    grandUsed += used;
    grandReq += requeued;
    grandRej += rejected;
    grandSets += sets;

    console.log(
      `${String(id).padStart(3)} | ${nameHindi.slice(0, 34).padEnd(36)} | ${String(total).padStart(5)} | ${String(available).padStart(5)} | ${String(candidate).padStart(4)} | ${String(used).padStart(4)} | ${String(requeued).padStart(4)} | ${String(rejected).padStart(4)} | ${sets}`
    );
  }

  console.log("-----------------------------------------------------------------------------------------");
  console.log(
    `TOTAL| ${"All 73 Master Topics".padEnd(36)} | ${String(grandTotal).padStart(5)} | ${String(grandAvail).padStart(5)} | ${String(grandCand).padStart(4)} | ${String(grandUsed).padStart(4)} | ${String(grandReq).padStart(4)} | ${String(grandRej).padStart(4)} | ${grandSets}`
  );
  console.log("=========================================================================================\n");
}

main().catch((err) => {
  console.error("Failed to show topic status:", err);
  process.exit(1);
});
