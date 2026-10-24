import fs from "fs";
import path from "path";

const local = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"), "utf-8")).questions;
const convex = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "convex-tenses-questions.json"), "utf-8"));
const convexIds = new Set(convex.map((q: any) => q.sourceQuestionId));
const unseeded = local.filter((q: any) => !convexIds.has(q.id));
console.log("Unseeded questions in local pool (out of 155):", unseeded.length);
unseeded.forEach((q: any) => console.log(q.id, q.question.replace(/\n/g, " ").slice(0, 70)));
