const fs = require('fs');
const file = process.argv[2] || 'scripts/batch1_raw.json';
const b = JSON.parse(fs.readFileSync(file, 'utf8'));
b.forEach(q => {
  console.log(`[${q.idx}] ${q.id} Ans: ${q.ans}`);
  console.log(`  Q: ${q.q}`);
  console.log(`  Opts: ${q.opts.map((o, i) => String.fromCharCode(65 + i) + ': ' + o).join(' | ')}`);
  console.log(`  Exp: ${q.currExp}`);
  console.log('');
});
