const fs = require('fs');
const results = JSON.parse(fs.readFileSync('scripts/sequence_audit_results.json', 'utf8'));

console.log('Sample sequence options:');
results.nonStandardSeqOptions.slice(0, 15).forEach(o => {
  console.log(`${o.id} (${o.file}): "${o.opt}"`);
});

