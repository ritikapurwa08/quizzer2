import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const RG_GOV_PATH = path.join(XDATA_DIR, "topics/rajasthan_gyan/46_राज्यपाल.json");

const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

function cleanText(text: string): string {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s\-_।,?!;:""''()[\]{}|/\\~`@#$%^&*+=<>]+/g, "")
    .toLowerCase();
}

const map = new Map<string, any[]>();
data.forEach((q: any) => {
  const k = cleanText(q.question);
  if (!map.has(k)) map.set(k, []);
  map.get(k)!.push(q);
});

console.log("Total questions:", data.length);
console.log("Unique cleanText keys:", map.size);

let dupCount = 0;
map.forEach((list, key) => {
  if (list.length > 1) {
    dupCount += (list.length - 1);
    console.log(`\nDuplicate cluster (${list.length} questions): IDs = ${list.map((x: any) => x.id).join(", ")}`);
    list.forEach((x: any) => {
      console.log(`  [ID ${x.id}] Exam: "${x.exam || 'None'}" Q: "${x.question}"`);
    });
  }
});
console.log("\nTotal exact duplicate instances (surplus):", dupCount);
