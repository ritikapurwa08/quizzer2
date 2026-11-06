const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');

const specialTypes = ["match_following", "assertion_reason", "statement_reason", "sequence", "table"];

const gkCounts = { mcq: 0 };
specialTypes.forEach(t => gkCounts[t] = 0);
gkCounts.other = 0;

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(gkDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];
  for (const q of list) {
    const t = q.type || 'mcq';
    if (gkCounts[t] !== undefined) gkCounts[t]++;
    else gkCounts.other++;
  }
}

const engCounts = { mcq: 0 };
specialTypes.forEach(t => engCounts[t] = 0);
engCounts.other = 0;

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(engDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];
  for (const q of list) {
    const t = q.type || 'mcq';
    if (engCounts[t] !== undefined) engCounts[t]++;
    else engCounts.other++;
  }
}

console.log('--- Rajasthan GK Types ---');
console.log(gkCounts);

console.log('\n--- English Pool Types ---');
console.log(engCounts);

