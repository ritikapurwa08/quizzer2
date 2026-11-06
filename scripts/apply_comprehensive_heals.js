const fs = require('fs');
const path = require('path');

const WORD_HEALS = JSON.parse(fs.readFileSync('scripts/word_heals_dict.json', 'utf8'));
const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

function healOptionText(str) {
  if (typeof str !== 'string') return str;
  let trimmed = str.trim();
  if (!trimmed) return trimmed;

  // 1. If it's a multi-statement choice like "(A) एवं (D)" or "(1) और (2)", PRESERVE IT
  if (/^[\(]?[अबसद1-4a-dA-D][\)]?\s*(?:एवं|और|तथा|व|,|and|&)/i.test(trimmed)) {
    // Do not touch statement combinations!
    return trimmed;
  }

  // 2. Safely strip stray label prefix ONLY if followed by regular text (e.g. "अ. जयपुर" -> "जयपुर")
  // Must NOT match words like "1 अक्टूबर" or "1956"
  if (/^(?:\([अबसदA-D]\)|[अबसदA-D][.)\-–—:])\s+[\u0900-\u097f]/i.test(trimmed)) {
    trimmed = trimmed.replace(/^(?:\([अबसदA-D]\)|[अबसदA-D][.)\-–—:])\s+/i, '');
  }

  // 3. Exact or leading match with WORD_HEALS dictionary
  for (const [corrupted, replacement] of Object.entries(WORD_HEALS)) {
    if (trimmed === corrupted) {
      trimmed = replacement;
      break;
    }
    if (trimmed.startsWith(corrupted + " ") ||
        trimmed.startsWith(corrupted + "-") ||
        trimmed.startsWith(corrupted + "–") ||
        trimmed.startsWith(corrupted + "—") ||
        trimmed.startsWith(corrupted + ",") ||
        trimmed.startsWith(corrupted + "।") ||
        trimmed.startsWith(corrupted + "(") ||
        trimmed.startsWith(corrupted + ":")) {
      trimmed = replacement + trimmed.slice(corrupted.length);
      break;
    }
  }

  return trimmed;
}

let totalOptionsHealed = 0;
let totalQuestionsHealed = 0;
const healedSamples = [];

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  let fileChanged = false;

  questions.forEach(q => {
    let qChanged = false;

    // Special fix for the screenshot question
    if (q.id === 'rg_000005') {
      q.options[1] = 'दक्षिणी सिरा';
      q.answer = 'B';
      qChanged = true;
    }

    const opts = q.options || [];
    const newOpts = opts.map((opt, optIdx) => {
      const healed = healOptionText(opt);
      if (healed !== opt) {
        qChanged = true;
        totalOptionsHealed++;
        if (healedSamples.length < 50) {
          healedSamples.push({
            id: q.id,
            file,
            optIdx,
            before: opt,
            after: healed
          });
        }
      }
      return healed;
    });

    if (qChanged) {
      q.options = newOpts;
      fileChanged = true;
      totalQuestionsHealed++;
    }
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`=== Complete Database Healing Results ===`);
console.log(`Total questions healed: ${totalQuestionsHealed}`);
console.log(`Total options healed: ${totalOptionsHealed}`);
console.log('\nSample Heals:');
healedSamples.slice(0, 30).forEach(s => {
  console.log(`[${s.id} in ${s.file}] "${s.before}" -> "${s.after}"`);
});
