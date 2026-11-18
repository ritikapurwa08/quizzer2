import fs from "fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud");

const publishedSets = JSON.parse(fs.readFileSync("data/sets/published-sets.json", "utf8"));
const mapPath = "data/sets/topic-id-mapping.json";
const topicMap = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, "utf8")) : {};

const archivedTopicIds = [
  "kh7d6xfk4zn9a18qtqdhdqdp2d8ek37a",
  "kh71ef1wnk4yknpeptvgkf4ghd8fw5hs",
  "kh7bp549saeb6wmnvsk92dy6kx8ej315",
  "kh72310dhm2v1ns31deqt3r1bd8ejrfr",
  "kh74jb6eb0nf0yh4mct6zeyk0s8ejm02",
  "kh7bbc8xrc4zka6q2w289m3zk98fx1zm",
  "kh78dpg7ce485z8ynfpc574mg98fwckk",
  "kh753eq9qzk1k7qw6m1z2nw0b98fxqhj",
];

const formattedSets = publishedSets.map((s: any) => ({
  id: s.id,
  topicId: s.topicId,
  name: s.name,
  order: s.order,
  questionCount: s.questionCount,
  subTopicId: s.subTopicId || undefined,
  subTopic: s.subTopic || undefined,
}));

async function run() {
  console.log(`Syncing ${formattedSets.length} sets to perceptive-orca-161...`);
  const result = await client.mutation(api.migrations.syncCanonicalTopicsAndSets, {
    activeTopics: [],
    archivedTopicIds: archivedTopicIds as any,
    sets: formattedSets,
  });
  console.log("Sync result:", result);
}

run().catch((e) => console.error(e));
