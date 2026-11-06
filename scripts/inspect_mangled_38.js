const fs = require('fs');
const comparisons = JSON.parse(fs.readFileSync('scripts/match_old_comparisons.json', 'utf8'));

const mangled = comparisons.filter(c => {
  if (c.status !== 'found_in_old') return false;
  const isMangled = (c.currentOpts || []).some(opt => {
    const pairs = opt.split(',').length;
    return pairs < 3 && c.currentMeta?.left?.length >= 4;
  });
  return isMangled;
});

console.log(`Found ${mangled.length} mangled questions.`);
mangled.slice(0, 10).forEach((m, idx) => {
  console.log(`\n[${idx + 1}] ID: ${m.id} (${m.file}) Current Ans: ${m.currentAns}, Old Ans: ${m.oldAns}`);
  console.log('Old Options:', m.oldOpts);
  console.log('Current Options:', m.currentOpts);
  console.log('Left:', m.currentMeta?.left);
  console.log('Right:', m.currentMeta?.right);
  console.log('Raw Question Text Snippet:', (m.rawQuestionText || '').slice(0, 120));
  console.log('Explanation Snippet:', (m.explanation || '').slice(0, 100));
});

fs.writeFileSync('scripts/mangled_38_details.json', JSON.stringify(mangled, null, 2));

