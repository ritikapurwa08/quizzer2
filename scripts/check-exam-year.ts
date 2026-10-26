import fs from "fs";
import path from "path";

async function main() {
  const convexUrl = "https://shiny-wildcat-270.convex.cloud";
  console.log("Checking Convex PROD questions for exam and year...");

  // Find English subject and Tenses topic
  const subRes = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "subjects:getBySlug", args: { slug: "english" } }),
  });
  const subject = ((await subRes.json()) as any).value;

  const topRes = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "topics:listBySubject", args: { subjectId: subject._id } }),
  });
  const topics: any[] = ((await topRes.json()) as any).value || [];
  const tenseTopic = topics.find((t) => t.name.toLowerCase().includes("tense"));

  const setsRes = await fetch(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: "testSets:listByTopic", args: { topicId: tenseTopic._id } }),
  });
  const sets: any[] = ((await setsRes.json()) as any).value || [];

  console.log(`Found ${sets.length} sets in Convex PROD:`);

  let nullExamsInConvex = 0;
  let nullYearsInConvex = 0;
  let totalConvexQuestions = 0;

  for (const s of sets) {
    const qRes = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: "questions:listByTestSet", args: { testSetId: s._id } }),
    });
    const qList: any[] = ((await qRes.json()) as any).value || [];
    totalConvexQuestions += qList.length;

    let setNullExam = 0;
    let setNullYear = 0;
    const sampleExams: string[] = [];

    for (const q of qList) {
      const ex = q.meta?.exam;
      const yr = q.meta?.year;
      if (!ex) setNullExam++;
      if (!yr) setNullYear++;
      if (sampleExams.length < 2 && ex) {
        sampleExams.push(`${ex} (${yr || "N/A"}) [Ref: ${q.reference || 'N/A'}]`);
      }
    }

    nullExamsInConvex += setNullExam;
    nullYearsInConvex += setNullYear;

    console.log(`- ${s.name} (${qList.length} Qs):`);
    console.log(`   Sample: ${sampleExams.join(" | ")}`);
    if (setNullExam > 0 || setNullYear > 0) {
      console.log(`   ⚠️ Null Exam: ${setNullExam}, Null Year: ${setNullYear}`);
    }
  }

  console.log(`\nConvex PROD Total Questions: ${totalConvexQuestions}`);
  console.log(`Convex PROD Null Exams:     ${nullExamsInConvex}`);
  console.log(`Convex PROD Null Years:     ${nullYearsInConvex}`);

  // Now check local pool files
  console.log("\n==========================================");
  console.log("Checking Local files...");
  const localFiles = [
    { name: "03_tenses/tenses_questions.json", path: "data/english/part_1_secondary_sr_secondary/03_tenses/tenses_questions.json" },
    { name: "61_Tenses_&_Sequence_of_Tenses.json", path: "data/ddd/english/topics/61_Tenses_&_Sequence_of_Tenses.json" },
    { name: "01_Tense.json", path: "data/ddd/english/topics/01_Tense.json" }
  ];

  for (const f of localFiles) {
    const fPath = path.join(process.cwd(), f.path);
    if (!fs.existsSync(fPath)) continue;
    const data = JSON.parse(fs.readFileSync(fPath, "utf-8"));
    const questions = data.questions || [];
    let nullExam = 0;
    let nullYear = 0;
    const examCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};

    questions.forEach((q: any) => {
      if (!q.exam) nullExam++;
      else examCounts[q.exam] = (examCounts[q.exam] || 0) + 1;

      if (!q.year) nullYear++;
      else yearCounts[String(q.year)] = (yearCounts[String(q.year)] || 0) + 1;
    });

    console.log(`\nFile: ${f.name} (Total: ${questions.length} Qs)`);
    console.log(`- Questions with Valid Exam Tag: ${questions.length - nullExam} (${(((questions.length - nullExam)/questions.length)*100).toFixed(1)}%)`);
    console.log(`- Questions with Valid Year:     ${questions.length - nullYear} (${(((questions.length - nullYear)/questions.length)*100).toFixed(1)}%)`);
    console.log(`- Questions with Null Exam:      ${nullExam}`);
    console.log(`- Questions with Null Year:      ${nullYear}`);

    // Show breakdown between old questions (first 155) and new questions (156 to end)
    const oldQs = questions.slice(0, 155);
    const newQs = questions.slice(155);
    const oldNullExam = oldQs.filter((q: any) => !q.exam).length;
    const newNullExam = newQs.filter((q: any) => !q.exam).length;
    const oldNullYear = oldQs.filter((q: any) => !q.year).length;
    const newNullYear = newQs.filter((q: any) => !q.year).length;

    console.log(`   -> Old 155 questions: ${oldQs.length - oldNullExam} with exam, ${oldNullExam} null exams`);
    console.log(`   -> New 144 questions: ${newQs.length - newNullExam} with exam, ${newNullExam} null exams`);
  }
}

main().catch(console.error);
