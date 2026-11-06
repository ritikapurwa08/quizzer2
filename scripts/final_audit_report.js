const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');

function auditDirectory(dir, label) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  let total = 0;
  const typeCounts = {};
  const answerDist = { A: 0, B: 0, C: 0, D: 0, other: 0 };
  let matchNonStd = 0;
  let tableNonStd = 0;
  let sequenceNonStd = 0;

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const questions = Array.isArray(data) ? data : data.questions || [];
    total += questions.length;

    questions.forEach(q => {
      const t = q.type || 'undefined';
      typeCounts[t] = (typeCounts[t] || 0) + 1;

      const ans = String(q.answer || '').toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(ans)) {
        answerDist[ans]++;
      } else {
        answerDist.other++;
      }

      if (q.type === 'match_following') {
        const opts = q.options || [];
        if (opts.some(o => !/^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?(?:,\s*e-[IVX]+)?$/i.test(o.trim()))) {
          matchNonStd++;
        }
      }

      if (q.type === 'table') {
        const opts = q.options || [];
        if (opts.some(o => !/^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?(?:,\s*e-[IVX]+)?$/i.test(o.trim()))) {
          tableNonStd++;
        }
      }

      if (q.type === 'sequence') {
        const opts = q.options || [];
        if (opts.some(o => !/^[a-eivx\d(),\s\-–—]+$/i.test(o.trim()))) {
          sequenceNonStd++;
        }
      }
    });
  });

  return {
    label,
    total,
    typeCounts,
    answerDist,
    matchNonStd,
    tableNonStd,
    sequenceNonStd
  };
}

const gkReport = auditDirectory(gkDir, 'Rajasthan GK (55 Topics)');
const engReport = auditDirectory(engDir, 'English Pool (All Topics)');

console.log('====================================================');
console.log('          FINAL COMPREHENSIVE AUDIT REPORT          ');
console.log('====================================================\n');

[gkReport, engReport].forEach(r => {
  console.log(`=== ${r.label} ===`);
  console.log(`Total questions: ${r.total}`);
  console.log('Type breakdown:', r.typeCounts);
  console.log('Answer distribution:', r.answerDist);
  console.log(`Non-standard match options: ${r.matchNonStd}`);
  console.log(`Non-standard table options: ${r.tableNonStd}`);
  console.log(`Non-standard sequence options: ${r.sequenceNonStd}`);
  console.log('----------------------------------------------------\n');
});

