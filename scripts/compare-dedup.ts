import fs from "fs";
import path from "path";

const first = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "incoming-tenses-duplicates.json"), "utf-8"));
const second = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "dedup-report-duplicates.json"), "utf-8"));

const firstNums = new Set(first.map((d: any) => d.incomingNum));
const secondNums = new Set(second.map((d: any) => d.incNum));

console.log("In first but not second (5 items):");
for (const n of firstNums) {
  if (!secondNums.has(n)) {
    const item = first.find((d: any) => d.incomingNum === n);
    console.log(`Q#${n}:`);
    console.log(`  Incoming: "${item.incomingText}"`);
    console.log(`  Matched : "${item.matchedWith.text}" [${item.matchedWith.source}]\n`);
  }
}

console.log("In second but not first:");
for (const n of secondNums) {
  if (!firstNums.has(n)) {
    console.log(n);
  }
}
