const fs = require('fs');
const seedContent = fs.readFileSync('convex/seed.ts', 'utf8');
const match = seedContent.match(/export const SYLLABUS_DATA = (\[[\s\S]*?\]);\s*export const seedFixedSyllabus/);
const syllabus = eval(match[1]);
const data26 = JSON.parse(fs.readFileSync('src/xdata/rajasthan_pyq_merged_26151.json', 'utf8'));

const corpusTopics = new Map();
for (const q of data26) {
  const t = q.topic || 'UNKNOWN';
  corpusTopics.set(t, (corpusTopics.get(t) || 0) + 1);
}

console.log('=== CHECKING MAPPINGS ===');
for (const subj of syllabus) {
  console.log('\nSUBJECT: ' + (subj.nameHindi || subj.name));
  for (const top of subj.topics) {
    const tName = typeof top === 'string' ? top : top.name;
    const tHindi = typeof top === 'string' ? '' : top.nameHindi;
    const matched = [];
    for (const [ct, count] of corpusTopics.entries()) {
      if (tHindi && (ct.includes(tHindi) || tHindi.includes(ct))) {
        matched.push(`${ct} (${count})`);
      }
    }
    console.log(`  Canonical Topic: "${tHindi}" (${tName}) => Corpus: [${matched.join(', ')}]`);
  }
}
