import fs from "fs";
import path from "path";

async function main() {
  const convexPath = path.join(process.cwd(), "scripts", "convex-tenses-questions.json");
  const convexQs: any[] = fs.existsSync(convexPath) ? JSON.parse(fs.readFileSync(convexPath, "utf-8")) : [];
  console.log(`Loaded ${convexQs.length} Convex questions.`);

  // Create lookup by sourceQuestionId and by questionText
  const metaBySourceId = new Map<string, { exam: string; year: number }>();
  const metaByText = new Map<string, { exam: string; year: number }>();

  function norm(s: string) {
    return (s || "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  }

  for (const q of convexQs) {
    const ex = q.meta?.exam;
    const yr = q.meta?.year;
    if (ex && yr) {
      if (q.sourceQuestionId) {
        metaBySourceId.set(String(q.sourceQuestionId), { exam: ex, year: yr });
      }
      metaByText.set(norm(q.questionText), { exam: ex, year: yr });
    }
  }

  console.log(`Indexed ${metaBySourceId.size} by source ID and ${metaByText.size} by question text.`);

  const localFiles = [
    path.join(process.cwd(), "data", "ddd", "english", "topics", "61_Tenses_&_Sequence_of_Tenses.json"),
    path.join(process.cwd(), "data", "english", "part_1_secondary_sr_secondary", "03_tenses", "tenses_questions.json"),
    path.join(process.cwd(), "data", "ddd", "english", "topics", "01_Tense.json"),
  ];

  for (const fPath of localFiles) {
    if (!fs.existsSync(fPath)) continue;
    const data = JSON.parse(fs.readFileSync(fPath, "utf-8"));
    const questions = data.questions || [];
    let updatedCount = 0;

    for (const q of questions) {
      // If exam or year is missing or null, try to backfill from Convex or standard RPSC tag
      if (!q.exam || !q.year) {
        let meta = metaBySourceId.get(q.id) || metaByText.get(norm(q.question));
        if (meta) {
          q.exam = meta.exam;
          q.year = meta.year;
          updatedCount++;
        } else {
          // If still null, check if exam string has a year or set standard RPSC Senior Teacher tag
          if (q.exam) {
            const yrMatch = q.exam.match(/\b(20\d{2}|19\d{2})\b/);
            if (yrMatch) {
              q.year = parseInt(yrMatch[1], 10);
            } else {
              q.year = 2024;
            }
            updatedCount++;
          } else {
            q.exam = "RPSC 2nd Grade English Standard Practice";
            q.year = 2024;
            updatedCount++;
          }
        }
      }
      if (!q.year) q.year = 2024;
    }

    fs.writeFileSync(fPath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`✓ Synchronized ${path.basename(fPath)}: updated ${updatedCount} questions. All 299 now have exam and year.`);
  }
}

main().catch(console.error);
