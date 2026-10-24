import fs from "fs";
import path from "path";

const local61 = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8"));
const q3 = local61.questions.find((q: any) => q.id === "rg_eng_000003");
console.log("Local q3:", q3);

const incoming = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-raw.json"), "utf-8"));
const q180 = incoming.find((q: any) => q.question_number === 180);
console.log("Incoming q180:", q180);

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/["'“”‘’]/g, "")
    .replace(/[._\-–—,;:?!/\\()[\]{}*#~`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

console.log("Norm q3:  ", normalizeText(q3.question));
console.log("Norm q180:", normalizeText(q180.question));
console.log("Equal?", normalizeText(q3.question) === normalizeText(q180.question));
