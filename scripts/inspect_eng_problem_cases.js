const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const ids = ['rg_eng_000976', 'rg_eng_001296', 'rg_eng_001884', 'rg_eng_002038', 'rg_eng_002121', 'rg_eng_002122'];

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(engDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];
  list.forEach(q => {
    if (ids.includes(q.id)) {
      console.log(`\n=== ID: ${q.id} (${file}) Ans: ${q.answer} ===`);
      console.log('Text:\n' + (q.questionText || q.question));
      console.log('Options:', q.options);
      console.log('Explanation:', q.explanation);
    }
  });
}

