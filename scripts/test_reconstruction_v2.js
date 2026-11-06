const fs = require('fs');

function parsePermutationToStandard(optStr, leftCount = 4) {
  if (typeof optStr !== 'string') return null;
  let s = optStr.trim();

  // If it already has standard letters with hyphens:
  // e.g. "(अ)-(ii), (ब)-(i), (स)-(iii), (द)-(iv)"
  if (/^[(\s]*[अ-हa-dA-D\d]+[)\s]*[-–—:]\s*[ivxIVX\d]/i.test(s)) {
    // Replace Devanagari letters with a, b, c, d
    let converted = s
      .replace(/[(\s]*[अaA][)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'a-$1, ')
      .replace(/[(\s]*[बbB][)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'b-$1, ')
      .replace(/[(\s]*[सcC][)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'c-$1, ')
      .replace(/[(\s]*[दdD][)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'd-$1, ')
      .replace(/[(\s]*[यeE][)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'e-$1, ')
      .replace(/,\s*$/, '');
    
    // Also handle (1), (II)... e.g. (1)-5, (II)-4
    if (/^[(\s]*[1I][)\s]*[-–—:]/i.test(s)) {
      converted = s
        .replace(/[(\s]*(?:1|I)[)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'a-$1, ')
        .replace(/[(\s]*(?:2|II|11)[)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'b-$1, ')
        .replace(/[(\s]*(?:3|III)[)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'c-$1, ')
        .replace(/[(\s]*(?:4|IV)[)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'd-$1, ')
        .replace(/[(\s]*(?:5|V)[)\s]*[-–—:]\s*([ivxIVX\d]+)[)\s]*/gi, 'e-$1, ')
        .replace(/,\s*$/, '');
    }

    // Convert digits to Roman uppercase
    const romanMap = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' };
    converted = converted.replace(/-(1|2|3|4|5)\b/g, (m, d) => `-${romanMap[d]}`);
    converted = converted.replace(/-([ivx]+)\b/g, (m, r) => `-${r.toUpperCase()}`);
    return converted;
  }

  // Remove header prefix e.g. "A B C D" or "क ख ग घ" only when followed by digits or roman
  s = s.replace(/^[A-Da-d\u0905-\u0926\s\-–—:]+(?=\d|[ivxIVX])/i, '').trim();

  // Clean parentheses and commas
  s = s.replace(/[(),]/g, ' ');
  const tokens = s.split(/\s+/).filter(Boolean);

  if (tokens.length === leftCount) {
    const isDigits = tokens.every(t => /^\d+$/.test(t));
    const isLetters = tokens.every(t => /^[a-zA-Z\u0905-\u0926]$/.test(t));
    const isRoman = tokens.every(t => /^[IVXLCDMivxlcdm]+$/.test(t));

    const leftKeys = ['a', 'b', 'c', 'd', 'e'].slice(0, leftCount);
    const romanMap = ['I', 'II', 'III', 'IV', 'V'];

    if (isDigits) {
      return leftKeys.map((k, i) => {
        const val = parseInt(tokens[i], 10);
        return `${k}-${romanMap[val - 1] || val}`;
      }).join(', ');
    } else if (isRoman) {
      return leftKeys.map((k, i) => `${k}-${tokens[i].toUpperCase()}`).join(', ');
    } else if (isLetters) {
      const letterToRoman = {
        a: 'I', b: 'II', c: 'III', d: 'IV', e: 'V',
        A: 'I', B: 'II', C: 'III', D: 'IV', E: 'V',
        'अ': 'I', 'ब': 'II', 'स': 'III', 'द': 'IV', 'य': 'V'
      };
      return leftKeys.map((k, i) => `${k}-${letterToRoman[tokens[i]] || tokens[i]}`).join(', ');
    }
  }

  return null;
}

const mangled = JSON.parse(fs.readFileSync('scripts/mangled_38_details.json', 'utf8'));
let successCount = 0;
const results = [];

mangled.forEach((m, idx) => {
  const leftLen = m.currentMeta?.left?.length || 4;
  const oldOpts = m.oldOpts || [];
  const reconstructed = oldOpts.map(opt => parsePermutationToStandard(opt, leftLen));
  const allValid = reconstructed.length === 4 && reconstructed.every(r => r && /^[a-e]-[IVX]+(?:,\s*[a-e]-[IVX]+)+$/i.test(r));

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

const failed = results.filter(r => !r.allValid);
if (failed.length > 0) {
  console.log('Failed reconstructions:', failed.map(f => ({ id: f.id, oldOpts: f.oldOpts, recon: f.reconstructed })));
}

fs.writeFileSync('scripts/reconstruction_results_v2.json', JSON.stringify(results, null, 2));

