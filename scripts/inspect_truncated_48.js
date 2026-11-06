const fs = require('fs');
const nonStd = JSON.parse(fs.readFileSync('scripts/nonstandard_match_questions.json', 'utf8'));

console.log(`Inspecting 48 questions with truncated options:`);
nonStd.slice(0, 5).forEach((q, idx) => {
  console.log(`\n--- [${idx + 1}] ID: ${q.id} (${q.file}) Ans: ${q.answer} ---`);
  console.log('Raw Question Text:', q.rawQuestionText);
  console.log('Left:', q.meta?.left);
  console.log('Right:', q.meta?.right);
  console.log('Options:', q.options);
  console.log('Explanation:', q.explanation);
});

