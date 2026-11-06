const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalQuestions = 0;
const orphanMatraOptions = [];
const strippedConsonantOptions = [];
const rawPrefixOptions = [];

// Known words that lost their initial consonant:
// e.g. "क्षिणी" -> "दक्षिणी", "स" lost, "द" lost, "ब" lost, "अ" lost
const suspiciousStarts = [
  { regex: /^क्षिणी/i, fix: 'दक्षिणी' },
  { regex: /^क्षणी/i, fix: 'दक्षिणी' },
  { regex: /^क्षिण/i, fix: 'दक्षिण' },
  { regex: /^मस्त\b/i, fix: 'समस्त' },
  { regex: /^भी\b/i, fix: 'सभी' },
  { regex: /^परोक्त/i, fix: 'उपरोक्त' },
  { regex: /^नुच्छेद/i, fix: 'अनुच्छेद' },
  { regex: /^धिनियम/i, fix: 'अधिनियम' },
  { regex: /^ध्यक्ष/i, fix: 'अध्यक्ष' },
  { regex: /^नुसूची/i, fix: 'अनुसूची' }
];

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  totalQuestions += questions.length;

  questions.forEach(q => {
    const opts = q.options || [];
    opts.forEach((opt, optIdx) => {
      if (typeof opt !== 'string') return;
      const trimmed = opt.trim();

      // 1. Orphan matras: starts with vowel sign
      if (/^[\u093e-\u094c\u0902]/.test(trimmed)) {
        orphanMatraOptions.push({
          file,
          id: q.id,
          optIdx,
          opt: trimmed,
          qText: (q.questionText || q.question || '').slice(0, 80)
        });
      }

      // 2. Suspicious stripped consonants
      for (const s of suspiciousStarts) {
        if (s.regex.test(trimmed)) {
          strippedConsonantOptions.push({
            file,
            id: q.id,
            optIdx,
            opt: trimmed,
            suggestedFix: s.fix,
            qText: (q.questionText || q.question || '').slice(0, 80)
          });
          break;
        }
      }

      // 3. Raw prefixes still present in options: e.g. "अ.", "ब.", "(अ)", "(ब)", "A.", "1.", "1)"
      if (/^(?:\(?[अबसद1-4a-dA-D]\)?[\s.\-–—:)]+)/.test(trimmed) && q.type !== 'match_following' && q.type !== 'sequence') {
        rawPrefixOptions.push({
          file,
          id: q.id,
          optIdx,
          opt: trimmed
        });
      }
    });
  });
});

console.log(`=== Scan Across All ${totalQuestions} Questions in Rajasthan GK ===`);
console.log(`Options starting with orphan matra (ी, ू, े, ै, ो, ौ, ा): ${orphanMatraOptions.length}`);
console.log(`Options with stripped leading consonants (e.g. क्षिणी): ${strippedConsonantOptions.length}`);
console.log(`Options still containing raw prefixes (अ., ब., etc.): ${rawPrefixOptions.length}`);

if (strippedConsonantOptions.length > 0) {
  console.log('\nSample stripped consonant options:', strippedConsonantOptions.slice(0, 10));
}

if (orphanMatraOptions.length > 0) {
  console.log('\nSample orphan matra options:', orphanMatraOptions.slice(0, 10));
}

if (rawPrefixOptions.length > 0) {
  console.log('\nSample raw prefix options:', rawPrefixOptions.slice(0, 10));
}

fs.writeFileSync('scripts/corrupted_options_report.json', JSON.stringify({
  orphanMatraCount: orphanMatraOptions.length,
  orphanMatraOptions,
  strippedConsonantCount: strippedConsonantOptions.length,
  strippedConsonantOptions,
  rawPrefixCount: rawPrefixOptions.length,
  rawPrefixOptions
}, null, 2));
