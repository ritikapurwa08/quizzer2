const fs = require('fs');
const other16 = JSON.parse(fs.readFileSync('scripts/other_16_details.json', 'utf8'));
const comparisons = JSON.parse(fs.readFileSync('scripts/match_old_comparisons.json', 'utf8'));

other16.forEach(item => {
  const comp = comparisons.find(c => c.id === item.id);
  console.log(`\n=== ID: ${item.id} (${item.file}) ===`);
  console.log('Current options:', item.options);
  console.log('Old options:', comp?.oldOpts);
  console.log('Current ans:', item.answer, 'Old ans:', comp?.oldAns);
  console.log('Expl:', (item.explanation || '').slice(0, 100));
});

