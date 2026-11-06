const fs = require('fs');
const path = require('path');

const ids = ['rg_001017', 'rg_000183', 'rg_000430'];
const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(gkDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];
  list.forEach(q => {
    if (ids.includes(q.id)) {
      console.log(`\n=== ID: ${q.id} (${file}) Type: ${q.type} Answer: ${q.answer} ===`);
      console.log('Text:\n' + q.text);
      console.log('Meta:', JSON.stringify(q.meta, null, 2));
      console.log('Options:', q.options);
      console.log('Explanation:', q.explanation);
    }
  });
}

