import fs from "fs";
import path from "path";

const incoming: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-raw.json"), "utf-8"));
const local61: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8")).questions;
const convexQs: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "convex-tenses-questions.json"), "utf-8"));

console.log("Checking all 197 incoming questions for any table or option matches with local61...");

for (const inc of incoming) {
  const incOpts = Object.entries(inc.options)
    .filter(([k]) => k.toUpperCase() !== "E")
    .map(([, v]) => String(v).trim().toLowerCase());

  for (const l of local61) {
    const lOpts = (l.options || []).map((o: string) => String(o).trim().toLowerCase());
    
    // Check if all 4 options are identical
    let optMatches = 0;
    for (const io of incOpts) {
      if (lOpts.includes(io)) optMatches++;
    }

    if (optMatches === 4) {
      console.log(`Q#${inc.question_number} matched Local61 [${l.id}]:`);
      console.log(`  Incoming: "${inc.question.replace(/\n/g, " ").slice(0, 80)}"`);
      console.log(`  Local61 : "${l.question.replace(/\n/g, " ").slice(0, 80)}"`);
      console.log(`  Options :`, incOpts, "\n");
    }
  }
}
