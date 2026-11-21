import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient("https://perceptive-orca-161.convex.cloud");
const topicId = "kh7b51w8xzbz3s6wx6437zzhg18gs4zm";
const subjectId = "k97dhqwj29j3cgm6wj9ngkyg3x8gr3yg";

const publishedSetsPath = path.join(process.cwd(), "data", "sets", "published-sets.json");
const existingPublished = JSON.parse(fs.readFileSync(publishedSetsPath, "utf8"));

const marathonDir = path.join(process.cwd(), "data", "questions", "english", "marathon_sets");
const marathonFiles = fs.readdirSync(marathonDir).filter((f) => f.endsWith(".json"));
marathonFiles.sort();

console.log(`Found ${marathonFiles.length} marathon set files.`);
console.log(`Current published-sets.json has ${existingPublished.length} sets.`);

// 1. Prepare formatted sets for Convex sync
const formattedExisting = existingPublished.map((s: any) => ({
  id: s.id,
  topicId: s.topicId,
  name: s.name,
  order: s.order,
  questionCount: s.questionCount,
  subTopicId: s.subTopicId || undefined,
  subTopic: s.subTopic || undefined,
}));

const newSetsToInsert = marathonFiles.map((file, idx) => {
  const content = JSON.parse(fs.readFileSync(path.join(marathonDir, file), "utf8"));
  return {
    id: `new_marathon_${idx + 1}`,
    topicId: topicId as any,
    name: content.title || `Set ${String(idx + 1).padStart(2, "0")} — ${content.topic}`,
    order: idx + 1,
    questionCount: content.questions.length,
    subTopicId: undefined,
    subTopic: undefined,
  };
});

const allSetsToSync = [...formattedExisting, ...newSetsToInsert];

console.log(`Syncing ${allSetsToSync.length} sets to Convex (${formattedExisting.length} existing + ${newSetsToInsert.length} new)...`);

async function run() {
  const syncResult = await client.mutation(api.migrations.syncCanonicalTopicsAndSets, {
    activeTopics: [
      {
        _id: topicId as any,
        subjectId: subjectId as any,
        name: "CET 2026 English Marathon (500 MCQs)",
        nameHindi: "सीईटी 2026 अंग्रेजी मैराथन",
        slug: "cet-english-marathon",
        order: 34,
        masterTopicId: 89,
      },
    ],
    archivedTopicIds: [],
    sets: allSetsToSync,
  });

  console.log("Convex sync result:", syncResult);

  // 2. Fetch the newly inserted sets from Convex to get their real Convex IDs
  const createdSets = await client.query(api.testSets.listByTopic, { topicId });
  console.log(`Retrieved ${createdSets.length} sets from Convex under topic ${topicId}.`);

  // Map each set by order to create published manifests
  const newManifests: any[] = [];
  createdSets.sort((a, b) => a.order - b.order);

  for (let i = 0; i < createdSets.length; i++) {
    const convexSet = createdSets[i];
    const file = marathonFiles[i];
    const content = JSON.parse(fs.readFileSync(path.join(marathonDir, file), "utf8"));
    const questionIds = content.questions.map((q: any) => q.id);

    newManifests.push({
      id: convexSet._id,
      name: convexSet.name,
      topicId: topicId,
      masterTopicId: 0,
      subTopicId: null,
      subTopic: null,
      negativeMarking: true,
      order: convexSet.order,
      questionCount: content.questions.length,
      questionIds,
      status: "active",
    });

    // Also update the local set file with convexId
    content.convexId = convexSet._id;
    fs.writeFileSync(path.join(marathonDir, file), JSON.stringify(content, null, 2), "utf8");
  }

  // 3. Update published-sets.json
  const updatedPublished = [...existingPublished, ...newManifests];
  fs.writeFileSync(publishedSetsPath, JSON.stringify(updatedPublished, null, 2), "utf8");
  console.log(`Updated published-sets.json with ${newManifests.length} new sets. Total: ${updatedPublished.length}`);

  // 4. Output the direct test links
  console.log("\n========================================");
  console.log("ALL 25 MARATHON SETS REGISTERED IN CONVEX!");
  console.log("Topic: CET 2026 English Marathon (500 MCQs)");
  console.log("========================================");
  newManifests.forEach((m, idx) => {
    console.log(`Set ${String(idx + 1).padStart(2, "0")}: /quiz/${m.id}  (${m.name})`);
  });
}

run().catch((err) => {
  console.error("Error during registration:", err);
});
