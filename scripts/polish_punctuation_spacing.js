const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');

let polished = 0;

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const fullPath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const isArr = Array.isArray(data);
  const list = isArr ? data : data.questions || [];

  let fileChanged = false;

  for (const q of list) {
    if (q.type === 'statement_reason') {
      let t = q.questionText || '';

      // Fix detached danda or colon: e.g. "विचार करें\n\n। सही" -> "विचार करें।\n\nसही"
      t = t.replace(/\n+\s*([।:;])/g, '$1\n\n');
      t = t.replace(/\n{3,}/g, '\n\n').trim();

      if (t !== q.questionText) {
        q.questionText = t;
        q.question = t;
        fileChanged = true;
        polished++;
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log(`Polished punctuation spacing in ${polished} questions!`);

