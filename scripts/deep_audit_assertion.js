const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalAssert = 0;
let answerDistribution = { A: 0, B: 0, C: 0, D: 0, other: 0 };
const samples = [];

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (q.type !== 'assertion_reason') return;
    totalAssert++;

    const ans = String(q.answer).toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(ans)) {
      answerDistribution[ans]++;
    } else {
      answerDistribution.other++;
    }

    if (samples.length < 5) {
      samples.push({
        id: q.id,
        file,
        ans,
        text: q.questionText,
        options: q.options
      });
    }
  });
});

console.log(`=== Assertion-Reason Audit ===`);
console.log(`Total assertion_reason questions: ${totalAssert}`);
console.log('Answer distribution:', answerDistribution);
console.log('Sample assertion question:', samples[0]);

