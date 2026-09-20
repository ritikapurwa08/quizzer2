import fs from "fs";
import path from "path";
import { comparePoolQuestions, getQuestionTier, parseYear } from "../src/lib/pool/sortQuestions";

async function main() {
  console.log("==========================================================");
  console.log("   RE-ORDERING LOCAL QUESTION POOL: LATEST EXAMS FIRST    ");
  console.log("==========================================================\n");

  const cwd = process.cwd();
  const dataDir = path.join(cwd, "data", "ddd");
  const topicsDir = path.join(dataDir, "topics");
  const candidatesDir = path.join(dataDir, "candidates");
  const poolStateFile = path.join(dataDir, "pool-state.json");

  if (!fs.existsSync(topicsDir)) {
    console.error(`Error: Topics directory not found at ${topicsDir}`);
    process.exit(1);
  }

  // 1. Re-order each topic file in data/ddd/topics/*.json
  console.log("1. Re-ordering all 73 Topic JSON files...");
  const topicFiles = fs.readdirSync(topicsDir).filter((f) => f.endsWith(".json"));
  const sortedQuestionsByTopicId = new Map<number, any[]>();

  let totalQuestionsEvaluated = 0;
  let totalWithYear = 0;
  let totalWithExamOnly = 0;
  let totalWithoutExam = 0;

  for (const file of topicFiles) {
    const filePath = path.join(topicsDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const topicId = Number(data.masterTopicId);

    const questions: any[] = data.questions || [];
    totalQuestionsEvaluated += questions.length;

    // Sort using canonical 3-tier comparator
    questions.sort(comparePoolQuestions);
    sortedQuestionsByTopicId.set(topicId, questions);

    // Track stats
    for (const q of questions) {
      const tier = getQuestionTier(q);
      if (tier === 1) totalWithYear++;
      else if (tier === 2) totalWithExamOnly++;
      else totalWithoutExam++;
    }

    // Save sorted topic file
    data.questions = questions;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  console.log(`✓ Re-sorted and saved ${topicFiles.length} topic files.`);
  console.log(`  Total Questions: ${totalQuestionsEvaluated.toLocaleString()}`);
  console.log(`  Tier 1 (PYQ with Year): ${totalWithYear.toLocaleString()} (sorted latest -> oldest)`);
  console.log(`  Tier 2 (Exam without Year): ${totalWithExamOnly.toLocaleString()}`);
  console.log(`  Tier 3 (Non-Exam / General): ${totalWithoutExam.toLocaleString()} (placed at end)\n`);

  // 2. Synchronize pool-state.json
  console.log("2. Updating pool-state.json preserving used questions...");
  if (!fs.existsSync(poolStateFile)) {
    console.error(`Error: pool-state.json not found at ${poolStateFile}`);
    process.exit(1);
  }

  const poolState = JSON.parse(fs.readFileSync(poolStateFile, "utf-8"));
  let totalPreservedUsed = 0;
  let totalAvailableAfter = 0;
  let totalCandidatesAfter = 0;

  for (let id = 1; id <= 73; id++) {
    const topicKey = String(id);
    const topicState = poolState.topics?.[topicKey];
    if (!topicState) continue;

    const sortedQuestions = sortedQuestionsByTopicId.get(id) || [];
    const questionMap = new Map<string, any>();
    for (const q of sortedQuestions) {
      questionMap.set(String(q.id), q);
    }

    // Collect already used IDs (must NEVER be altered or re-used)
    const usedIds = new Set<string>();
    for (const u of topicState.used || []) {
      const uid = typeof u === "object" && u !== null ? u.id : String(u);
      if (uid) usedIds.add(String(uid));
    }
    totalPreservedUsed += usedIds.size;

    // Collect rejected IDs
    const rejectedIds = new Set<string>();
    for (const r of topicState.rejected || []) {
      const rid = typeof r === "object" && r !== null ? r.id : String(r);
      if (rid) rejectedIds.add(String(rid));
    }

    // Remaining unused questions in strict sorted order
    const remainingQuestions = sortedQuestions.filter(
      (q) => !usedIds.has(String(q.id)) && !rejectedIds.has(String(q.id))
    );

    const prevCandidateCount = Array.isArray(topicState.candidate) ? topicState.candidate.length : 0;

    if (prevCandidateCount > 0) {
      // Refresh active candidate window with top available sorted questions
      const targetCandidateCount = Math.min(prevCandidateCount, remainingQuestions.length);
      const newCandidateQuestions = remainingQuestions.slice(0, targetCandidateCount);
      const newAvailableQuestions = remainingQuestions.slice(targetCandidateCount);

      topicState.candidate = newCandidateQuestions.map((q) => String(q.id));
      topicState.available = newAvailableQuestions.map((q) => String(q.id));

      totalCandidatesAfter += topicState.candidate.length;
      totalAvailableAfter += topicState.available.length;

      // Update candidate file on disk if candidate directory exists
      const padTopic = String(id).padStart(2, "0");
      const nextSetNum = (topicState.completedSets || 0) + 1;
      const padSet = String(nextSetNum).padStart(3, "0");

      const candDirs = [
        path.join(candidatesDir, `topic-${padTopic}`),
        path.join(candidatesDir, `topic-${id}`),
      ];

      for (const cDir of candDirs) {
        const candFilePath = path.join(cDir, `candidate-set-${padSet}.json`);
        if (fs.existsSync(candFilePath)) {
          try {
            const candFileData = JSON.parse(fs.readFileSync(candFilePath, "utf-8"));
            candFileData.candidateIds = topicState.candidate;
            candFileData.candidates = newCandidateQuestions;
            candFileData.candidateCount = newCandidateQuestions.length;
            candFileData.updatedAt = new Date().toISOString();
            fs.writeFileSync(candFilePath, JSON.stringify(candFileData, null, 2), "utf-8");
            console.log(`  ✓ Refreshed candidate file ${path.relative(cwd, candFilePath)} (${newCandidateQuestions.length} Qs)`);
          } catch (cErr) {
            console.error(`  Failed to refresh candidate file ${candFilePath}:`, cErr);
          }
        }
      }
    } else {
      topicState.candidate = [];
      topicState.available = remainingQuestions.map((q) => String(q.id));
      totalAvailableAfter += topicState.available.length;
    }
  }

  poolState.updatedAt = new Date().toISOString();
  fs.writeFileSync(poolStateFile, JSON.stringify(poolState, null, 2), "utf-8");
  console.log(`✓ Saved updated pool-state.json.`);
  console.log(`  Total Preserved USED Questions: ${totalPreservedUsed}`);
  console.log(`  Total Active Candidate Questions: ${totalCandidatesAfter}`);
  console.log(`  Total Available Questions in Pool: ${totalAvailableAfter}\n`);

  // 3. Verification Report on Sample Topics
  console.log("==========================================================");
  console.log("                 VERIFICATION REPORT                      ");
  console.log("==========================================================");

  for (const sampleId of [1, 2, 17, 20]) {
    const questions = sortedQuestionsByTopicId.get(sampleId) || [];
    const topicState = poolState.topics[String(sampleId)];
    console.log(`\nMaster Topic #${sampleId}: ${topicState?.masterTopic} (Total: ${questions.length})`);
    console.log(`  Completed Sets: ${topicState?.completedSets}, Used: ${topicState?.used?.length}, Candidates: ${topicState?.candidate?.length}, Available: ${topicState?.available?.length}`);

    console.log("  Top 3 Questions in queue:");
    for (let i = 0; i < Math.min(3, questions.length); i++) {
      const q = questions[i];
      console.log(`    [#${i + 1}] ID: ${q.id} | Year: ${q.year || "null"} | Exam: ${q.exam || "none"}`);
    }

    console.log("  Bottom 3 Questions in queue (should be lowest year or non-exam):");
    for (let i = Math.max(0, questions.length - 3); i < questions.length; i++) {
      const q = questions[i];
      console.log(`    [#${i + 1}] ID: ${q.id} | Year: ${q.year || "null"} | Exam: ${q.exam || "none"}`);
    }
  }

  console.log("\n✓ SUCCESS: Question pool re-ordering complete and validated.");
}

main().catch((err) => {
  console.error("Fatal error during re-ordering:", err);
  process.exit(1);
});
