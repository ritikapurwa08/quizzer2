import fs from "fs";
import path from "path";

const dups: any[] = JSON.parse(fs.readFileSync(path.join(process.cwd(), "scripts", "final-verified-duplicates.json"), "utf-8"));

console.log("Checking all matches that aren't exact normalized matches:");
dups.forEach(d => {
  if (d.matchType.includes("Identical Options") || d.matchType.includes("Substring")) {
    console.log(`Q#${d.question_number} [${d.matchType}]:`);
    console.log(`  INCOMING: "${d.incomingText}"`);
    console.log(`  MATCHED : "${d.matchedWith}"\n`);
  }
});
