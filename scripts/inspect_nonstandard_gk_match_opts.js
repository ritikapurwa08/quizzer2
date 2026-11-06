const fs = require('fs');
const results = JSON.parse(fs.readFileSync('scripts/gk_match_audit_results.json', 'utf8'));

console.log('Total non-standard options:', results.nonStandardOptions.length);

const groupedByPattern = {};
results.nonStandardOptions.forEach(item => {
  const simplified = item.opt.replace(/[a-z]/gi, 'x').replace(/[0-9IVX]/gi, 'n');
  groupedByPattern[simplified] = (groupedByPattern[simplified] || 0) + 1;
});

console.log('Grouped by pattern:', groupedByPattern);

// Sample 10 items
console.log('\nSample items:');
results.nonStandardOptions.slice(0, 10).forEach(item => {
  console.log(`${item.id} (${item.file}) [opt ${item.idx}]: "${item.opt}"`);
});

