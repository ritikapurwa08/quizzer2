import fs from "fs";
import path from "path";

const incoming = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-raw.json"), "utf-8"));
const local61 = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8")).questions;

function checkQ(qNum: number) {
  const inc = incoming.find((q: any) => q.question_number === qNum);
  console.log(`\n=== INCOMING Q#${qNum} ===`);
  console.log(JSON.stringify(inc, null, 2));

  // Find matches in local61
  const matches = local61.filter((l: any) => {
    const lText = l.question.toLowerCase();
    const words = Object.values(inc.options).map((o: any) => String(o).toLowerCase().trim());
    return words.filter((w: string) => w.length > 3 && lText.includes(w)).length >= 2;
  });

  if (matches.length > 0) {
    console.log(`Found ${matches.length} possible matching questions in local61:`);
    matches.slice(0, 3).forEach((m: any) => {
      console.log(`- [${m.id}] ${m.question}`);
      console.log(`  Options:`, m.options);
      console.log(`  Answer: ${m.answer}`);
    });
  } else {
    console.log("No option-based match in local61");
  }
}

[32, 35, 62, 79, 119, 143, 176, 180, 181, 182, 183].forEach(checkQ);
