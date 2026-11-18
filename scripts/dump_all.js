const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data/staging_topic_02_part2.json', 'utf8'));
const lines = [];
d.questions.forEach((q, idx) => {
  lines.push(`=== [${idx}] ${q.id} (Ans: ${q.answer}) ===`);
  lines.push(`Q: ${q.question}`);
  lines.push(`A: ${q.options[0]}`);
  lines.push(`B: ${q.options[1]}`);
  lines.push(`C: ${q.options[2]}`);
  lines.push(`D: ${q.options[3]}`);
  lines.push(`CurExp: ${q.explanation || ''}`);
  lines.push('');
});
fs.writeFileSync('scripts/all_260_questions.txt', lines.join('\n'), 'utf8');
console.log('Saved all 260 questions to scripts/all_260_questions.txt');
