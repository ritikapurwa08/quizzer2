const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const MULTI_STATEMENT_REGEX = /(?:निम्नलिखित\s*(?:कथनों|पर)\s*विचार|कथनों\s*पर\s*विचार|नीचे\s*दिए\s*गए\s*कथनों|कथन\s*\(?[1-4I-IVa-dA-D]\)?[\s\S]{1,150}कथन\s*\(?[2-4I-IVb-dB-D]\)?)/iu;

const found = [];
const ansCounts = { A: 0, B: 0, C: 0, D: 0 };

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(gkDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    if (q.type === 'assertion_reason' || q.type === 'match_following' || q.type === 'sequence') continue;
    const text = q.questionText || q.question || '';
    if (MULTI_STATEMENT_REGEX.test(text)) {
      ansCounts[q.answer] = (ansCounts[q.answer] || 0) + 1;
      found.push({
        file,
        id: q.id,
        currentType: q.type,
        answer: q.answer,
        questionText: text,
        options: q.options,
        explanation: q.explanation || ''
      });
    }
  }
}

console.log(`Found ${found.length} Multi-Statement questions in Rajasthan GK.`);
console.log('Answer distribution:', ansCounts);

fs.writeFileSync(path.join(__dirname, 'all_multi_statement.json'), JSON.stringify(found, null, 2));

console.log('\n--- Sample 5 Questions ---');
for (let i = 0; i < Math.min(5, found.length); i++) {
  const q = found[i];
  console.log(`\n========================================`);
  console.log(`[${i+1}] ID: ${q.id} (${q.file}) Answer: ${q.answer}`);
  console.log(`Question:\n${q.questionText}`);
  console.log(`Options:`, q.options);
}

