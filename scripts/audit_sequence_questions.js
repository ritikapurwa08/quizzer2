const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

const seqQuestions = [];

files.forEach(file => {
  const p = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (q.type === 'sequence') {
      seqQuestions.push({
        file,
        id: q.id,
        answer: q.answer,
        text: q.questionText || q.question || '',
        options: q.options,
        meta: q.meta,
        explanation: q.explanation
      });
    }
  });
});

console.log(`Found ${seqQuestions.length} sequence questions in Rajasthan GK.`);

// Inspect samples
console.log('\n--- Sequence Samples ---');
seqQuestions.slice(0, 5).forEach(q => {
  console.log(`ID: ${q.id} (${q.file}) Ans: ${q.answer}`);
  console.log('Text:\n' + q.text);
  console.log('Meta.items:', q.meta?.items);
  console.log('Options:', q.options);
  console.log('---');
});

fs.writeFileSync('scripts/all_sequence_questions_audit.json', JSON.stringify(seqQuestions, null, 2));

