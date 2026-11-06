const fs = require('fs');
const path = require('path');

const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_multi_statement.json'), 'utf8'));

console.log(`Analyzing ${list.length} multi-statement questions...`);

let successfulSplits = 0;
const samples = [];

for (const q of list) {
  const text = q.questionText || '';

  // Pattern A: Labeled with (a), (b), (c), (d) or (A), (B), (C), (D)
  const alphaStatements = Array.from(text.matchAll(/(?:^|\n|\s|\.)(?:\(([a-dA-D1-4])\)|([a-dA-D1-4])\.)\s*([^\n\r]+?)(?=(?:\([a-dA-D1-4]\)|[a-dA-D1-4]\.|\b(?:नीचे|सही|उपरो|उपर्युक्त|उपरोक्त)\b|$))/gu));

  // Pattern B: Labeled with 1., 2., 3., 4.
  const digitStatements = Array.from(text.matchAll(/(?:^|\n|\s|\.)(?:(\d+)\.|\((\d+)\))\s*([^\n\r]+?)(?=(?:\d+\.|\(\d+\)|\b(?:नीचे|सही|उपरो|उपर्युक्त|उपरोक्त)\b|$))/gu));

  // Pattern C: Labeled with कथन 1, कथन 2...
  const kathanStatements = Array.from(text.matchAll(/(?:कथन\s*\(?([1-4a-dA-D])\)?[:\-–—]?\s*)([^\n\r]+?)(?=(?:कथन\s*\(?[1-4a-dA-D]\)?|\b(?:नीचे|सही|उपरो|उपर्युक्त|उपरोक्त)\b|$))/gu));

  let items = [];
  if (alphaStatements.length >= 2) {
    items = alphaStatements.map(m => ({ label: m[1] || m[2], text: m[3].trim() }));
  } else if (digitStatements.length >= 2) {
    items = digitStatements.map(m => ({ label: m[1] || m[2], text: m[3].trim() }));
  } else if (kathanStatements.length >= 2) {
    items = kathanStatements.map(m => ({ label: m[1], text: m[2].trim() }));
  }

  if (items.length >= 2) {
    successfulSplits++;
    if (samples.length < 5) {
      samples.push({
        id: q.id,
        itemCount: items.length,
        items,
        original: text.slice(0, 150)
      });
    }
  }
}

console.log(`Successfully split statements in ${successfulSplits}/${list.length} questions!`);
console.log('\nSample parsed questions:');
for (const s of samples) {
  console.log(`\nID: ${s.id} (${s.itemCount} statements)`);
  s.items.forEach(it => console.log(`  ${it.label}. ${it.text}`));
}

