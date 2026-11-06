const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

const seqList = [];
const misclassifiedMatch = [];
const duplicateItemIds = [];
const nonStandardSeqOptions = [];

files.forEach(file => {
  const p = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (q.type === 'sequence') {
      seqList.push({ file, q });

      // Check if it's actually match_following (options like a-I, b-II...)
      const isMatchOptions = (q.options || []).some(opt => /^[a-d]-[IVX\d]+/i.test(opt));
      if (isMatchOptions) {
        misclassifiedMatch.push({ file, id: q.id, options: q.options, text: (q.questionText || q.question).slice(0, 100) });
      }

      // Check duplicate item IDs in meta.items
      const items = q.meta?.items || [];
      const ids = items.map(it => it.id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        duplicateItemIds.push({ file, id: q.id, ids });
      }

      // Check option formatting (standard sequence options should be e.g. "a, b, c, d" or "1, 2, 3, 4" or "(a), (b), (c), (d)")
      (q.options || []).forEach(opt => {
        // Look for weird formats
        if (!/^[a-e\d(),\s\-–—]+$/i.test(opt)) {
          nonStandardSeqOptions.push({ file, id: q.id, opt });
        }
      });
    }
  });
});

console.log(`=== Sequence Audit ===`);
console.log(`Total sequence questions: ${seqList.length}`);
console.log(`Misclassified match questions: ${misclassifiedMatch.length}`);
if (misclassifiedMatch.length > 0) {
  console.log('Misclassified samples:', misclassifiedMatch);
}
console.log(`Questions with duplicate item IDs: ${duplicateItemIds.length}`);
if (duplicateItemIds.length > 0) {
  console.log('Duplicate ID samples:', duplicateItemIds);
}
console.log(`Non-standard sequence options: ${nonStandardSeqOptions.length}`);

fs.writeFileSync('scripts/sequence_audit_results.json', JSON.stringify({
  total: seqList.length,
  misclassifiedMatch,
  duplicateItemIds,
  nonStandardSeqOptions
}, null, 2));

