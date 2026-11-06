const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const ids = ['rg_000570', 'rg_000266', 'rg_007927', 'rg_011655', 'rg_014243'];

files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const p = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (ids.includes(q.id)) {
      console.log(`\n=== ID: ${q.id} (${file}) Ans: ${q.answer} ===`);
      console.log('Text:', q.questionText || q.question);
      console.log('Meta:', JSON.stringify(q.meta, null, 2));
      console.log('Options:', q.options);
      console.log('Explanation:', q.explanation);
    }
  });
});

