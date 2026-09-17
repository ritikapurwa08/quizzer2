import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const RG_GOV_PATH = path.join(ROOT_DIR, "src/xdata/topics/rajasthan_gyan/46_राज्यपाल.json");
const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

const retainedIds = [
  12485, 12486, 12487, 12488, 12489, 12490, 12491, 12492, 12493, 12496,
  12497, 12498, 12499, 12501, 12502, 12504, 12505, 12507, 12510, 12511,
  12512, 12513, 12516, 12517, 12520, 12522, 12523, 12525, 12526, 12527,
  12533, 12534, 12536, 12537, 12538, 12540, 12542, 12543, 12544, 12545,
  12546, 12549, 12552, 12553, 12554, 12557, 12559, 12562, 12563, 12564,
  12565, 12566, 12567, 12568, 12569, 12572, 12573, 12582, 12584, 12585,
  12586, 12590, 12591, 12596, 12597, 12599, 12601, 12604, 12606, 12607,
  12609, 12610, 12612, 12613, 12614, 12616, 12617, 12618, 12620, 12623,
  12626, 12627, 12629, 12630, 12632, 12635, 12637, 12639, 12642, 12644,
  12645, 12647,
];

const retainedQs = data.filter((q: any) => retainedIds.includes(q.id));

function cleanText(text: string): string {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s\-_।,?!;:""''()[\]{}|/\\~`@#$%^&*+=<>]+/g, "")
    .toLowerCase();
}

function bigrams(str: string): Set<string> {
  const s = cleanText(str);
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
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

const simPairs: any[] = [];
for (let i = 0; i < retainedQs.length; i++) {
  for (let j = i + 1; j < retainedQs.length; j++) {
    const sim = similarity(retainedQs[i].question, retainedQs[j].question);
    if (sim >= 0.65) {
      simPairs.push({
        id1: retainedQs[i].id,
        id2: retainedQs[j].id,
        sim: sim.toFixed(3),
        q1: retainedQs[i].question,
        q2: retainedQs[j].question,
        ans1: retainedQs[i].answer,
        ans2: retainedQs[j].answer,
      });
    }
  }
}

console.log("Similar pairs among retained questions (sim >= 0.70):", simPairs.length);
simPairs
  .sort((a, b) => parseFloat(b.sim) - parseFloat(a.sim))
  .forEach((p) => {
    console.log(`\n[Sim: ${p.sim}] ${p.id1} vs ${p.id2}`);
    console.log(`  Q1: "${p.q1}"`);
    console.log(`  Q2: "${p.q2}"`);
    console.log(`  Ans1: "${p.ans1}" | Ans2: "${p.ans2}"`);
  });
