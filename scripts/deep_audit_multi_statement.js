const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalStmt = 0;
let answerDistribution = { A: 0, B: 0, C: 0, D: 0, other: 0 };
const discrepancies = [];

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (q.type !== 'statement_reason') return;
    totalStmt++;

    const ans = String(q.answer).toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(ans)) {
      answerDistribution[ans]++;
    } else {
      answerDistribution.other++;
    }

    // Check explanation consistency against option text
    const expl = q.explanation || '';
    const opts = q.options || [];
    const ansIdx = ['A', 'B', 'C', 'D'].indexOf(ans);
    const chosenOpt = opts[ansIdx] || '';

    // Check if explanation says statement X is false/galat or only statement Y is true
    // e.g. "कथन 1 गलत है" or "कथन 2 असत्य है"
    const falseMatches = expl.match(/कथन\s*\(?([1-4a-d])\)?\s*(?:गलत|असत्य|सही\s*नहीं)/i);
    if (falseMatches && ans === 'A') {
      const falseNum = falseMatches[1];
      // Check if chosenOpt includes that false statement
      if (chosenOpt.includes(falseNum)) {
        discrepancies.push({
          file,
          id: q.id,
          ans,
          chosenOpt,
          falseNum,
          options: opts,
          explSnippet: expl.slice(0, 150)
        });
      }
    }
  });
});

console.log(`=== Multi-Statement Questions Audit ===`);
console.log(`Total statement_reason questions: ${totalStmt}`);
console.log('Answer distribution:', answerDistribution);
console.log(`Potential discrepancies where Option A includes a statement stated false in explanation: ${discrepancies.length}`);
if (discrepancies.length > 0) {
  console.log('Discrepancies:', JSON.stringify(discrepancies, null, 2));
}

fs.writeFileSync('scripts/stmt_audit_results.json', JSON.stringify({
  totalStmt,
  answerDistribution,
  discrepancies
}, null, 2));

