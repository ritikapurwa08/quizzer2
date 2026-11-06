const fs = require('fs');
const nonStd = JSON.parse(fs.readFileSync('scripts/nonstandard_match_questions.json', 'utf8'));
const mangledIds = new Set(JSON.parse(fs.readFileSync('scripts/mangled_38_details.json', 'utf8')).map(x => x.id));

const other16 = nonStd.filter(q => !mangledIds.has(q.id));

console.log(`Found ${other16.length} other non-standard match questions:`);
other16.forEach((q, idx) => {
  console.log(`\n[${idx + 1}] ID: ${q.id} (${q.file}) Ans: ${q.answer}`);
  console.log('Options:', q.options);
  console.log('Left:', q.meta?.left);
  console.log('Right:', q.meta?.right);
  console.log('Raw text:', q.rawQuestionText.slice(0, 100));
});

fs.writeFileSync('scripts/other_16_details.json', JSON.stringify(other16, null, 2));

