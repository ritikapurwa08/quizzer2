const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud";

async function main() {
  const targetTopicId = "kh77jdbnv03qm5qj2vm31fk8818grqrb"; // Parts of Speech – Verbs

  const setsRes = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: "testSets:listByTopic",
      args: { topicId: targetTopicId },
    }),
  });

  const sets = (await setsRes.json()).value;
  console.log(`\nFound ${sets.length} Test Sets in Convex for topic 'Parts of Speech – Verbs':`);
  for (const s of sets) {
    console.log(`- ${s.name} (ID: ${s._id}) | Questions: ${s.questionCount} | Negative Marking: ${s.negativeMarking}`);

    // Fetch sample question from each set
    const qRes = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "questions:listByTestSet",
        args: { testSetId: s._id },
      }),
    });
    const qList = (await qRes.json()).value || [];
    console.log(`   Total questions loaded: ${qList.length}`);
    if (qList.length > 0) {
      const q = qList[0];
      console.log(`   Sample Q1: "${q.questionText.slice(0, 60)}..."`);
      console.log(`   Options (${q.options.length}):`, q.options.map((o: any) => `${o.id}: ${o.text}`));
      console.log(`   Correct Answer: ${q.correctAnswer}`);
      console.log(`   Exam: ${q.meta?.exam || 'N/A'}`);
      console.log(`   Explanation snippet: ${q.explanation?.slice(0, 80)}...`);
    }
  }
}

main().catch(console.error);
