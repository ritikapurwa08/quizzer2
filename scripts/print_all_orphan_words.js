const fs = require('fs');

const words = JSON.parse(fs.readFileSync('scripts/orphan_words_frequency.json', 'utf8'));
console.log(`Total unique orphan words: ${words.length}`);

// Print all words
words.forEach(([w, count], i) => {
  console.log(`[${i + 1}] "${w}": ${count}`);
});

