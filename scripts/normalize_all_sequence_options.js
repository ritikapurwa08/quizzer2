const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalHealed = 0;

function normalizeSeqOption(opt, itemIds) {
  if (typeof opt !== 'string') return opt;
  let s = opt.trim();

  // Strip stray leading comma or danda
  s = s.replace(/^[,\s।\-–—:]+/, '').trim();
  // Strip trailing periods or commas
  s = s.replace(/[,\s.।\-–—:]+$/, '').trim();

  // Replace connectors like "एवं", "व", "तथा", "और", "and" with comma
  s = s.replace(/\s+(?:एवं|व|तथा|और|and)\s+/gi, ', ');

  // Replace Devanagari letters:
  // अ -> a or I (depending on itemIds)
  // ब -> b or II
  // स -> c or III
  // द -> d or IV
  // य -> e or V
  const useRoman = itemIds.some(id => /^[ivx]+$/i.test(id));
  const devToLetter = {
    'अ': 'a', 'ब': 'b', 'स': 'c', 'द': 'd', 'य': 'e',
    '(अ)': '(a)', '(ब)': '(b)', '(स)': '(c)', '(द)': '(d)', '(य)': '(e)'
  };
  const devToRoman = {
    'अ': 'I', 'ब': 'II', 'स': 'III', 'द': 'IV', 'य': 'V',
    '(अ)': 'I', '(ब)': 'II', '(स)': 'III', '(द)': 'IV', '(य)': 'V'
  };

  for (const [k, v] of Object.entries(useRoman ? devToRoman : devToLetter)) {
    s = s.split(k).join(v);
  }

  // Normalize spaces between items: e.g. "(a) (b) (c) (d)" -> "a, b, c, d"
  // Remove enclosing parentheses from individual tokens if uniform
  // e.g. "(a), (b), (c), (d)" -> "a, b, c, d"
  // or "(i), (ii), (iii), (iv)" -> "I, II, III, IV"
  const tokens = s.replace(/[()]/g, ' ').split(/[,\s]+/).filter(Boolean);
  if (tokens.length >= 3 && tokens.length <= 6) {
    if (useRoman || tokens.some(t => /^[ivx]+$/i.test(t))) {
      s = tokens.map(t => t.toUpperCase()).join(', ');
    } else {
      s = tokens.map(t => t.toLowerCase()).join(', ');
    }
  }

  return s;
}

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  let fileChanged = false;

  questions.forEach(q => {
    if (q.type !== 'sequence') return;

    const items = q.meta?.items || [];
    const itemIds = items.map(it => it.id || '');

    if (Array.isArray(q.options)) {
      const origOpts = JSON.stringify(q.options);
      q.options = q.options.map(opt => normalizeSeqOption(opt, itemIds));
      if (JSON.stringify(q.options) !== origOpts) {
        fileChanged = true;
        totalHealed++;
      }
    }
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Normalized sequence options in ${totalHealed} questions.`);

