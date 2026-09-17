import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const RG_GOV_PATH = path.join(ROOT_DIR, "src/xdata/topics/rajasthan_gyan/46_राज्यपाल.json");
const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

// We will require governor_re_audit's functions or run them directly
import { execSync } from "child_process";
const out = execSync("bun run src/scripts/governor_re_audit.ts", { encoding: "utf8" });

// Print all clusters
const clusterSection = out.slice(out.indexOf("--- SEMANTIC DUPLICATE / FACT CLUSTERS ---"));
console.log(clusterSection);

