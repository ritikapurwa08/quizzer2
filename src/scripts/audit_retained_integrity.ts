import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const RG_GOV_PATH = path.join(ROOT_DIR, "src/xdata/topics/rajasthan_gyan/46_राज्यपाल.json");
const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

const retainedIds = [
  12485, 12486, 12487, 12488, 12489, 12490, 12491, 12492, 12493, 12496,
  12497, 12498, 12499, 12502, 12504, 12505, 12507, 12510, 12511, 12512,
  12513, 12516, 12520, 12522, 12523, 12524, 12525, 12526, 12527, 12533,
  12534, 12536, 12537, 12538, 12540, 12542, 12543, 12544, 12545, 12546,
  12549, 12552, 12553, 12557, 12559, 12562, 12563, 12564, 12565, 12566,
  12567, 12568, 12569, 12572, 12573, 12582, 12584, 12585, 12586, 12588,
  12590, 12591, 12596, 12597, 12599, 12601, 12604, 12606, 12607, 12609,
  12610, 12612, 12613, 12614, 12616, 12617, 12618, 12620, 12623, 12626,
  12627, 12629, 12630, 12635, 12637, 12639, 12641, 12642, 12644, 12645,
  12647
];

const retainedQs = data.filter((q: any) => retainedIds.includes(q.id));

function cleanOptionText(opt: string): string {
  if (!opt) return "";
  return opt
    // Case 1: wrapped in parens/brackets, e.g. (अ) or [A] or (1)
    .replace(/^[\s(\[]*([अबसदa-dA-D1-4]|[ivxIVX]+)[\)\]]\s*/, "")
    // Case 2: followed by punctuation delimiter, e.g. 1. or A. or अ-
    .replace(/^[\s]*([अबसदa-dA-D1-4]|[ivxIVX]+)[)\]:.-]\s*/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

console.log(`Auditing all ${retainedQs.length} retained questions:`);

let issuesCount = 0;
retainedQs.forEach((q: any) => {
  // 1. Stem length
  if (!q.question || q.question.trim().length < 15) {
    console.log(`[ISSUE] ID ${q.id}: Question stem too short`);
    issuesCount++;
  }
  // 2. Options count & uniqueness
  const cleanOpts = q.options.map(cleanOptionText);
  if (cleanOpts.length !== 4) {
    console.log(`[ISSUE] ID ${q.id}: Options count is ${cleanOpts.length}`);
    issuesCount++;
  }
  const optSet = new Set(cleanOpts.map((o: string) => o.toLowerCase()));
  if (optSet.size !== 4) {
    console.log(`[ISSUE] ID ${q.id}: Duplicate options:`, cleanOpts);
    issuesCount++;
  }
  // 3. Answer presence
  const rawAns = q.answer.trim();
  const cleanAns = cleanOptionText(rawAns);
  const inOpts = cleanOpts.some((o: string) => 
    o.toLowerCase() === rawAns.toLowerCase() ||
    o.toLowerCase() === cleanAns.toLowerCase()
  );
  if (!inOpts) {
    console.log(`[ISSUE] ID ${q.id}: Answer "${q.answer}" not found in clean options:`, cleanOpts);
    issuesCount++;
  }
  // 4. Deleted *
  if (q.answer === "*" || q.answer === "X") {
    console.log(`[ISSUE] ID ${q.id}: Deleted * answer`);
    issuesCount++;
  }
});

console.log(`Audit complete. Issues found: ${issuesCount}`);
