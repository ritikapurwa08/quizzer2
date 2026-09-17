import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const RG_GOV_PATH = path.join(ROOT_DIR, "src/xdata/topics/rajasthan_gyan/46_राज्यपाल.json");
const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

// We will inspect each cluster generated in governor_re_audit.ts
// to ensure every cluster contains ONLY questions asking the exact same fact!
