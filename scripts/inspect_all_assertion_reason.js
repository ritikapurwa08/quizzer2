const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const ASSERTION_REGEX = /(?:अभिकथन\s*\(?[aA1]\)?|कथन\s*\(?[aA]\)?\s*और\s*कारण|कथन\s*\(?[aA]\)?[\s\S]{1,200}कारण\s*\(?[rR]\)?|assertion\s*\(?[aA]\)?[\s\S]{1,200}reason\s*\(?[rR]\)?)/iu;

const found = [];

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(gkDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = `${q.questionText || q.question || q.prompt || ''}\n${q.explanation || ''}`;
    if (ASSERTION_REGEX.test(text) || q.type === 'assertion_reason') {
      found.push({
        file,
        id: q.id,
        currentType: q.type,
        answer: q.answer,
        questionText: q.questionText || q.question || '',
        options: q.options,
        explanation: q.explanation || ''
      });
    }
  }
}

console.log(`Found ${found.length} Assertion-Reason questions in Rajasthan GK.`);
fs.writeFileSync(path.join(__dirname, 'all_assertion_questions.json'), JSON.stringify(found, null, 2));

for (let i = 0; i < Math.min(5, found.length); i++) {
  const q = found[i];
  console.log(`\n========================================`);
  console.log(`[${i+1}] ID: ${q.id} (${q.file}) Type: ${q.currentType} Answer: ${q.answer}`);
  console.log(`Question:\n${q.questionText}`);
  console.log(`Options:`, q.options);
  console.log(`Explanation:`, q.explanation.slice(0, 150));
}

