const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('scripts/eng_table_detailed.json', 'utf8'));

console.log('Sample questions from eng_table_detailed.json:');
questions.slice(0, 10).forEach((q, idx) => {
  console.log(`\n[${idx + 1}] ID: ${q.id} (File: ${q.file}) Ans: ${q.answer}`);
  console.log('Prompt/Text:\n' + q.text);
  console.log('Options:', q.options);
  if (q.explanation) console.log('Explanation:', q.explanation);
});

