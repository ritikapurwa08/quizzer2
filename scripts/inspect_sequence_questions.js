const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');

const SEQUENCE_REGEX = /(?:कालक्रमानुसार|कालानुक्रम|कालक्रम|व्यवस्थित\s*(?:कीजिए|कीजिये|किजीए|करें)|अवरोही\s*क्रम|आरोही\s*क्रम|सही\s*(?:भौगोलिक\s*)?क्रम|बढ़ते\s*क्रम|घटते\s*क्रम)/iu;

const found = [];

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(gkDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = `${q.questionText || q.question || ''}\n${q.explanation || ''}`;
    if (q.type === 'sequence' || SEQUENCE_REGEX.test(text)) {
      found.push({
        file,
        id: q.id,
        type: q.type,
        answer: q.answer,
        questionText: q.questionText || q.question || '',
        meta: q.meta,
        options: q.options,
        explanation: q.explanation || ''
      });
    }
  }
}

console.log(`Found ${found.length} sequence questions in Rajasthan GK.`);
fs.writeFileSync(path.join(__dirname, 'all_sequence_questions.json'), JSON.stringify(found, null, 2));

console.log('\n--- Sample 5 Sequence Questions ---');
for (let i = 0; i < Math.min(5, found.length); i++) {
  const q = found[i];
  console.log(`\n========================================`);
  console.log(`[${i+1}] ID: ${q.id} (${q.file}) Type: ${q.type} Answer: ${q.answer}`);
  console.log(`Question:\n${q.questionText}`);
  console.log(`Meta:`, q.meta);
  console.log(`Options:`, q.options);
}

