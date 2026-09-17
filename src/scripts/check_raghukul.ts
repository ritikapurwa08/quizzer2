import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const RG_GOV_PATH = path.join(ROOT_DIR, "src/xdata/topics/rajasthan_gyan/46_राज्यपाल.json");
const data = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

const ids = [12485, 12494, 12495, 12550];
ids.forEach(id => {
  const q = data.find((x: any) => x.id === id);
  console.log(`[ID ${id}] Exam: ${q.exam}`);
  console.log(`  Q: ${q.question}`);
  console.log(`  Ans: ${q.answer}`);
  console.log("-----------------------------------------");
});
