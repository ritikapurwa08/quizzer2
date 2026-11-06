const fs = require('fs');
const results = JSON.parse(fs.readFileSync('scripts/sequence_audit_results.json', 'utf8'));

const patterns = new Set();
results.nonStandardSeqOptions.forEach(o => {
  const pat = o.opt.replace(/[a-zA-Z]/g, 'a').replace(/\d/g, '1');
  patterns.add(pat);
});

console.log('Unique patterns in sequence options:', Array.from(patterns));
console.log('Sample options:', results.nonStandardSeqOptions.slice(0, 5).map(x => x.opt));

