const fs = require('fs');
const report = JSON.parse(fs.readFileSync('scripts/corrupted_options_report.json', 'utf8'));

console.log('Total orphan matra options:', report.orphanMatraCount);
console.log('Total stripped consonant options:', report.strippedConsonantCount);

// Group orphan matras by initial letter/matra sequence
const matraGroups = {};
report.orphanMatraOptions.forEach(item => {
  const firstWord = item.opt.split(/[\s,–—\-.]/)[0];
  matraGroups[firstWord] = (matraGroups[firstWord] || 0) + 1;
});

const sortedWords = Object.entries(matraGroups).sort((a, b) => b[1] - a[1]);
console.log('\nTop 40 orphan matra words across Rajasthan GK:');
sortedWords.slice(0, 40).forEach(([word, count]) => {
  console.log(`${word}: ${count}`);
});

fs.writeFileSync('scripts/orphan_words_frequency.json', JSON.stringify(sortedWords, null, 2));

