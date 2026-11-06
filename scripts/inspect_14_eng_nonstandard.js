const fs = require('fs');
const results = JSON.parse(fs.readFileSync('scripts/eng_table_audit_results.json', 'utf8'));

results.nonStandard.forEach((q, idx) => {
  console.log(`\n=== [${idx + 1}] ID: ${q.id} (${q.file}) Ans: ${q.answer} ===`);
  console.log('Options:', q.options);
  console.log('Text:\n' + q.textSnippet);
});

