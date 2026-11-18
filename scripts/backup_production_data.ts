import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const backupDir = path.join(process.cwd(), "data", "backups", "production_backup_2026_11_18");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const tables = [
  "users",
  "attempts",
  "bookmarks",
  "wrongQuestions",
  "testSets",
  "topics",
  "subjects",
  "topicNotes",
  "flaggedQuestions",
];

console.log(`Starting complete Production Convex backup into: ${backupDir}...`);

for (const table of tables) {
  try {
    console.log(`Fetching table: ${table}...`);
    const cmd = `npx convex run --prod --inline-query "await ctx.db.query('${table}').collect()"`;
    const raw = execSync(cmd, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]") + 1;
    if (jsonStart === -1 || jsonEnd === -1) {
      console.warn(`Could not parse JSON for ${table}`);
      continue;
    }
    const data = JSON.parse(raw.slice(jsonStart, jsonEnd));
    const outPath = path.join(backupDir, `${table}.json`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✓ Saved ${table}: ${data.length} records (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
  } catch (err: any) {
    console.error(`Error backing up ${table}:`, err.message);
  }
}

console.log("COMPLETE: All production tables backed up safely!");
