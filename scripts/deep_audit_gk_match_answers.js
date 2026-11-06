const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalMatch = 0;
let nonStandardOptions = [];
let answerDiscrepancies = [];
let answerDistribution = { A: 0, B: 0, C: 0, D: 0, other: 0 };

// Helper to normalize Roman numerals
function romanToInt(r) {
  const map = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };
  return map[r.toUpperCase()] || 0;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Check each question
for (const file of files) {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  for (const q of questions) {
    if (q.type !== 'match_following') continue;
    totalMatch++;

    // Check answer distribution
    const ans = String(q.answer).toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(ans)) {
      answerDistribution[ans]++;
    } else {
      answerDistribution.other++;
    }

    // 1. Check option format
    const opts = q.options || [];
    const standardPattern = /^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?(?:,\s*e-[IVX]+)?$/i;
    opts.forEach((opt, idx) => {
      if (!standardPattern.test(opt.trim())) {
        nonStandardOptions.push({
          file,
          id: q.id,
          idx,
          opt
        });
      }
    });

    // 2. Check explanation consistency
    const expl = q.explanation || '';
    if (expl && expl.includes('→')) {
      // Find pairs in explanation, e.g. "Item → Value"
      // Check if explanation has items from meta.left or text
      const meta = q.meta || {};
      const left = meta.left || [];
      const right = meta.right || [];

      if (left.length > 0 && right.length > 0) {
        // Build map of left item to right index (1-based)
        const deducedCode = {};
        left.forEach((lItem, lIdx) => {
          const lKey = String.fromCharCode(97 + lIdx); // 'a', 'b', 'c', 'd'
          const lText = typeof lItem === 'string' ? lItem : lItem.text || '';
          
          // Look for lText in explanation followed by arrow
          right.forEach((rItem, rIdx) => {
            const rRoman = ['I', 'II', 'III', 'IV', 'V', 'VI'][rIdx];
            const rText = typeof rItem === 'string' ? rItem : rItem.text || '';
            // If explanation mentions lText and rText linked with arrow or close proximity
            if (lText.length > 2 && rText.length > 2) {
              const lClean = escapeRegex(lText.slice(0, 8));
              const rClean = escapeRegex(rText.slice(0, 8));
              const regex = new RegExp(`${lClean}[\\s\\S]{0,30}→[\\s\\S]{0,30}${rClean}`, 'i');
              if (regex.test(expl)) {
                deducedCode[lKey] = rRoman;
              }
            }
          });
        });

        // If we deduced at least 3 pairs, check which option matches
        const deducedKeys = Object.keys(deducedCode);
        if (deducedKeys.length >= Math.min(3, left.length)) {
          const matchingOpts = [];
          opts.forEach((opt, optIdx) => {
            const optLetter = ['A', 'B', 'C', 'D'][optIdx];
            let allMatch = true;
            for (const [k, v] of Object.entries(deducedCode)) {
              if (!new RegExp(`${k}-${v}\\b`, 'i').test(opt)) {
                allMatch = false;
                break;
              }
            }
            if (allMatch) matchingOpts.push(optLetter);
          });

          if (matchingOpts.length === 1 && matchingOpts[0] !== ans) {
            answerDiscrepancies.push({
              file,
              id: q.id,
              currentAnswer: ans,
              deducedAnswer: matchingOpts[0],
              deducedCode,
              options: opts,
              explSnippet: expl.slice(0, 150)
            });
          }
        }
      }
    }
  }
}

console.log(`=== Rajasthan GK Match Questions Audit ===`);
console.log(`Total match questions: ${totalMatch}`);
console.log('Answer distribution:', answerDistribution);
console.log(`Non-standard options: ${nonStandardOptions.length}`);
if (nonStandardOptions.length > 0) {
  console.log('Sample non-standard options:', nonStandardOptions.slice(0, 5));
}
console.log(`Answer discrepancies detected via explanation: ${answerDiscrepancies.length}`);
if (answerDiscrepancies.length > 0) {
  console.log('Sample discrepancies:', JSON.stringify(answerDiscrepancies.slice(0, 10), null, 2));
}

fs.writeFileSync(path.join(__dirname, 'gk_match_audit_results.json'), JSON.stringify({
  totalMatch,
  answerDistribution,
  nonStandardOptions,
  answerDiscrepancies
}, null, 2));
