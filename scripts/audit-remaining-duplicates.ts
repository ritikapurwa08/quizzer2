import fs from "fs";
import path from "path";

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const uniqueQs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-unique.json"), "utf-8"));
const convexQs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "convex-tenses-questions.json"), "utf-8"));
const local61Qs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8")).questions || [];

const existingPool = [
  ...convexQs.map((q) => ({
    source: `Convex (${q.setName})`,
    id: q._id,
    question: q.questionText,
    options: q.options.map((o: any) => o.text),
  })),
  ...local61Qs.map((q) => ({
    source: "Local 61",
    id: q.id,
    question: q.question,
    options: q.options || [],
  })),
];

console.log(`Auditing ${uniqueQs.length} unique candidates against ${existingPool.length} existing questions...`);

const definiteDuplicates: { incQ: any; match: any; reason: string }[] = [];

for (const inc of uniqueQs) {
  const incOptVals = Object.entries(inc.options)
    .filter(([k]) => k.toUpperCase() !== "E")
    .map(([, v]) => norm(v as string))
    .filter(Boolean);

  const incNormQ = norm(inc.question);

  for (const ex of existingPool) {
    const exNormQ = norm(ex.question);
    const exOptVals = (ex.options || []).map((o: string) => norm(o)).filter(Boolean);

    // 1. Core question match (one ends with the other or contains the core sentence)
    // Strip common filler instructions
    const cleanInc = incNormQ
      .replace(/^(fill in the blank[s]? with [a-z ]+|choose the [a-z ]+|select the [a-z ]+|complete the [a-z ]+|pick the [a-z ]+|identify the [a-z ]+)\s*/, "");
    const cleanEx = exNormQ
      .replace(/^(fill in the blank[s]? with [a-z ]+|choose the [a-z ]+|select the [a-z ]+|complete the [a-z ]+|pick the [a-z ]+|identify the [a-z ]+)\s*/, "");

    const isQMatch = cleanInc.length > 15 && cleanEx.length > 15 && (cleanInc === cleanEx || cleanInc.includes(cleanEx) || cleanEx.includes(cleanInc));

    // 2. Options match: at least 3 identical options
    let commonOpts = 0;
    for (const opt of incOptVals) {
      if (exOptVals.includes(opt)) commonOpts++;
    }

    if (isQMatch && commonOpts >= 2) {
      definiteDuplicates.push({
        incQ: inc,
        match: ex,
        reason: `Question core matched (${cleanInc.slice(0, 40)}...) & ${commonOpts} common options`,
      });
      break;
    } else if (commonOpts === 4 && cleanInc.length > 10 && cleanEx.length > 10) {
      // 4 identical options and similar question
      definiteDuplicates.push({
        incQ: inc,
        match: ex,
        reason: `4 identical options & related question text`,
      });
      break;
    }
  }
}

console.log(`\nFound ${definiteDuplicates.length} additional duplicates:`);
definiteDuplicates.forEach((d) => {
  console.log(`- Q#${d.incQ.question_number}: "${d.incQ.question.replace(/\n/g, " ").slice(0, 60)}..."`);
  console.log(`  -> Matched [${d.match.source}]: "${d.match.question.replace(/\n/g, " ").slice(0, 60)}..."`);
  console.log(`     Reason: ${d.reason}\n`);
});
