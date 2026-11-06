const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let matchesCount = 0;
const samples = [];

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    const opts = q.options || [];
    opts.forEach((opt, optIdx) => {
      if (typeof opt !== 'string') return;
      const trimmed = opt.trim();

      if (/^[\u093e-\u094c\u0902]/.test(trimmed)) {
        let restored = trimmed;
        if (optIdx === 1) restored = 'ब' + trimmed;
        else if (optIdx === 2) restored = 'स' + trimmed;
        else if (optIdx === 3) restored = 'द' + trimmed;

        matchesCount++;
        if (samples.length < 30) {
          samples.push({
            id: q.id,
            optIdx,
            original: trimmed,
            restored,
            file
          });
        }
      }
    });
  });
});

console.log(`Total orphan matra occurrences: ${matchesCount}`);
console.log('Sample restorations based on optIdx (1->ब, 2->स, 3->द):');
samples.slice(0, 25).forEach(s => {
  console.log(`[optIdx ${s.optIdx}] "${s.original}" -> "${s.restored}" (${s.id})`);
});

