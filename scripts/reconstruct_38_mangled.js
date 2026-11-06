const fs = require('fs');
const path = require('path');

const mangled = JSON.parse(fs.readFileSync('scripts/mangled_38_details.json', 'utf8'));

// Function to convert permutation string to standard option
// e.g. "b a c d" or "2 1 4 3" or "(c) (b) (a) (d)" or "A B C D 2 1 3 4"
function parsePermutationToStandard(optStr, leftCount = 4) {
  let s = optStr.trim();
  // Remove "A B C D" header prefix if present
  s = s.replace(/^[A-D\s\-–—:]+/i, '').trim();

  // If already standard e.g. "a-II, b-I..."
  if (/^[a-d]-[IVX\d]+/i.test(s)) {
    return s;
  }

  // Check if it's tokens like ['b', 'a', 'c', 'd'] or ['2', '1', '4', '3'] or ['(c)', '(b)', '(a)', '(d)']
  // Clean parentheses
  s = s.replace(/[()]/g, ' ');
  const tokens = s.split(/\s+/).filter(Boolean);

  if (tokens.length === leftCount) {
    // Check if tokens are letters (a, b, c, d) or digits (1, 2, 3, 4) or roman (i, ii, iii, iv)
    const isDigits = tokens.every(t => /^\d+$/.test(t));
    const isLetters = tokens.every(t => /^[a-zA-Z]$/.test(t));
    const isRoman = tokens.every(t => /^[IVXLCDMivxlcdm]+$/.test(t));

    const leftKeys = ['a', 'b', 'c', 'd', 'e'].slice(0, leftCount);
    const romanMap = ['I', 'II', 'III', 'IV', 'V'];

    if (isDigits) {
      // e.g. ['2', '1', '3', '4'] -> a-II, b-I, c-III, d-IV
      return leftKeys.map((k, i) => {
        const val = parseInt(tokens[i], 10);
        return `${k}-${romanMap[val - 1] || val}`;
      }).join(', ');
    } else if (isRoman) {
      return leftKeys.map((k, i) => `${k}-${tokens[i].toUpperCase()}`).join(', ');
    } else if (isLetters) {
      // e.g. ['c', 'd', 'a', 'b'] -> means left item i corresponds to letter tokens[i]
      // Where 'a' -> I, 'b' -> II, 'c' -> III, 'd' -> IV
      const letterToRoman = {
        a: 'I', b: 'II', c: 'III', d: 'IV', e: 'V',
        A: 'I', B: 'II', C: 'III', D: 'IV', E: 'V'
      };
      return leftKeys.map((k, i) => `${k}-${letterToRoman[tokens[i]] || tokens[i]}`).join(', ');
    }
  }

  return null;
}

console.log('Testing reconstruction on the 38 mangled questions:');
let successCount = 0;
const results = [];

mangled.forEach((m, idx) => {
  const oldOpts = m.oldOpts || [];
  const reconstructed = oldOpts.map(opt => parsePermutationToStandard(opt, m.currentMeta?.left?.length || 4));
  const allValid = reconstructed.length === 4 && reconstructed.every(r => r && /^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?$/i.test(r));

  if (allValid) {
    successCount++;
  }

  results.push({
    id: m.id,
    file: m.file,
    oldAns: m.oldAns,
    currentAns: m.currentAns,
    oldOpts,
    reconstructed,
    allValid,
    explanation: m.explanation
  });
});

console.log(`Successfully reconstructed ${successCount} out of ${mangled.length}`);

fs.writeFileSync('scripts/reconstruction_test_results.json', JSON.stringify(results, null, 2));

// Show any that failed
const failed = results.filter(r => !r.allValid);
if (failed.length > 0) {
  console.log('Failed reconstructions:', failed.map(f => ({ id: f.id, oldOpts: f.oldOpts })));
}

