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

function bigrams(str: string): Set<string> {
  const s = cleanText(str);
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    set.add(s.slice(i, i + 2));
  }
  return set;
}

function similarity(s1: string, s2: string): number {
  const b1 = bigrams(s1);
  const b2 = bigrams(s2);
  if (b1.size === 0 || b2.size === 0) return 0;
  let inter = 0;
  b1.forEach((x) => {
    if (b2.has(x)) inter++;
  });
  return (2 * inter) / (b1.size + b2.size);
}

const pairs: any[] = [];
for (let i = 0; i < data.length; i++) {
  for (let j = i + 1; j < data.length; j++) {
    const sim = similarity(data[i].question, data[j].question);
    if (sim >= 0.90) {
      pairs.push({
        id1: data[i].id,
        id2: data[j].id,
        sim: sim.toFixed(3),
        q1: data[i].question,
        q2: data[j].question,
        ans1: data[i].answer,
        ans2: data[j].answer,
        exam1: data[i].exam,
        exam2: data[j].exam,
      });
    }
  }
}

console.log("Total near/exact duplicate pairs with similarity >= 0.70:", pairs.length);
pairs
  .sort((a, b) => parseFloat(b.sim) - parseFloat(a.sim))
  .forEach((p) => {
    console.log(`\n[Sim: ${p.sim}] IDs: ${p.id1} vs ${p.id2}`);
    console.log(`  Q1 (${p.id1} | ${p.exam1 || "NoExam"}): "${p.q1}"`);
    console.log(`  Q2 (${p.id2} | ${p.exam2 || "NoExam"}): "${p.q2}"`);
    console.log(`  Ans1: "${p.ans1}" | Ans2: "${p.ans2}"`);
  });
