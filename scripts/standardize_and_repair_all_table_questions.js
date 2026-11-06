const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const DEV_ALPHA = ['अ', 'ब', 'स', 'द', 'य', 'र'];
const ENG_ALPHA = ['a', 'b', 'c', 'd', 'e', 'f'];

const ORPHAN_WORD_REPLACEMENTS = {
  "िरोही": "सिरोही", "ौसा": "दौसा", "ीकर": "सीकर", "ूंदी": "बूंदी", "ूँदी": "बूंदी",
  "ून्दी": "बूंदी", "ीकानेर": "बीकानेर", "ंत": "संत", "ाड़मेर": "बाड़मेर", "ाड़मेर": "बाड़मेर",
  "ाडमेर": "बाड़मेर", "ादू": "दादू", "ादूदयाल": "दादूदयाल", "ांभर": "सांभर", "ाम्भर": "सांभर",
  "िल्ली": "दिल्ली", "ोम": "सोम", "ैराठ": "बैराठ", "ांसवाड़ा": "बांसवाड़ा", "ांसवाड़ा": "बांसवाड़ा",
  "ारां": "बारां", "िर": "सिर", "ीसा": "सीसा", "ाबरमती": "साबरमती", "ोनों": "दोनों",
  "ांगानेर": "सांगानेर", "ूर्यमल्ल": "सूर्यमल्ल", "ागोर": "बागोर", "िजौलिया": "बिजौलिया",
  "ूरतगढ़": "सूरतगढ़", "ीतामाता": "सीतामाता", "ीतापुरा": "सीतापुरा", "ेवगढ़": "देवगढ़",
  "ाबी": "साबी", "िसोदिया": "सिसोदिया", "िवाणा": "सिवाना", "ेलवाड़ा": "देलवाड़ा", "िवेर": "दिवेर",
  "ागरमल": "सागरमल", "ूसरे": "दूसरे", "ूसरी": "दूसरी", "ूर्य": "सूर्य", "ात": "सात",
  "ालाथल": "बालाथल", "ुर्गा": "दुर्गा", "ुर्गादास": "दुर्गादास", "ेर": "बेर", "ेगूं": "बेगूं",
  "ुल्ता": "सुल्तान", "ुल्तान": "सुल्तान", "ेड़च": "बेड़च", "िलवाड़ा": "भीलवाड़ा", "िवाली": "दिवाली",
  "ांगा": "सांगा", "ेशनोक": "देशनोक", "ाबर": "बाबर", "ंगाल": "बंगाल", "ूरजसिंह": "सूरजसिंह",
  "ूध": "दूध", "ावन": "सावन", "ूखा": "सूखा", "ीमेंट": "सीमेंट", "ीमेन्ट": "सीमेंट",
  "ायरा": "सायरा", "ंसद": "संसद", "ंगीत": "संगीत", "ारंगपुर": "सारंगपुर", "ाल मिलें": "दाल मिलें",
  "ूती वस्त्र": "सूती वस्त्र", "ूदू": "दूदू", "िडला": "बिड़ला", "ोरानाड़ा": "बोरानाडा",
  "िलोरा": "सिलोरा", "ार्वजनिक": "सार्वजनिक", "ॉफ्टवेयर": "सॉफ्टवेयर", "ांस्कृतिक": "सांस्कृतिक",
  "ोडियम": "सोडियम", "ाजार": "बाजार", "ाल": "दाल", "ांसी": "झांसी", "ालासर": "सालासर",
  "िंचाई": "सिंचाई", "ीरा": "हीरा", "ूची": "सूची", "ोलंकी": "सोलंकी", "ेवड़ा": "देवड़ा",
  "ंयोगिता": "संयोगिता", "ीसलदेव": "बीसलदेव", "ैरीसाल": "बैरीसाल", "ुल्तानपुर": "सुल्तानपुर",
  "ानगुरू": "दानगुरू", "ितंबर": "सितंबर", "ुधा": "सुधा", "ंग्रामसिंह": "संग्रामसिंह",
  "ेवलिया": "देवलिया", "ूरत": "सूरत", "ीहा": "सीहा"
};

const STOP_WORDS = new Set([
  'राजस्थान', 'प्रमुख', 'जिला', 'जिले', 'क्षेत्र', 'स्थान', 'निम्न', 'निम्नलिखित',
  'सूची', 'तालिका', 'उत्तर', 'चयन', 'सही', 'गलत', 'कथन', 'वर्ष', 'है', 'हैं',
  'था', 'थे', 'थी', 'का', 'के', 'की', 'को', 'में', 'से', 'पर', 'और', 'तथा',
  'एवं', 'द्वारा', 'रूप', 'नाम', 'लिए', 'गया', 'गए', 'गई', 'जाता', 'जाती'
]);

function toRoman(val) {
  if (!val) return 'I';
  const v = String(val).trim().toUpperCase();
  if (['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].includes(v)) return v;
  const num = parseInt(v, 10);
  if (!isNaN(num) && num >= 1 && num <= 8) return ROMAN_NUMERALS[num - 1];
  if (DEV_ALPHA.includes(val)) return ROMAN_NUMERALS[DEV_ALPHA.indexOf(val)] || 'I';
  if (/^[A-D]$/i.test(v)) return ROMAN_NUMERALS[ENG_ALPHA.indexOf(v.toLowerCase())] || 'I';
  return v;
}

function cleanMetaItemText(text) {
  if (!text || typeof text !== 'string') return text;
  let t = text.trim();
  t = t.replace(/\s*(?:सही\s*)?कूट\s*(?:है\s*)?[-–—:]*$/gu, '').trim();
  t = t.replace(/\s*लिंग\s*अनुपात\s*$/gu, '').trim();
  t = t.replace(/\s*सूची\s*[-–—:]*\s*[12I]{1,2}\s*\(?[a-dA-Divx1-4]?\)?\s*$/giu, '').trim();
  const idx = t.indexOf('सूची-');
  if (idx !== -1 && idx > 2) t = t.slice(0, idx).trim();
  const idxCol = t.indexOf('कॉलम');
  if (idxCol !== -1 && idxCol > 2) t = t.slice(0, idxCol).trim();
  return t;
}

function healRawOptionString(text, allOptions) {
  if (typeof text !== 'string') return text;
  let trimmed = text.trim();
  if (!trimmed) return trimmed;

  // OCR typos
  trimmed = trimmed.replace(/\blll\b/gi, 'III');
  trimmed = trimmed.replace(/[-–—:]\s*lI\b/g, '-II');

  // Recover missing 'a-' or '(a)-'
  if (/^\(([iIvVxX\d]+)\)[\s,–—\-]+(?:\(?b\)?|b[\s\-–—:])/i.test(trimmed)) {
    trimmed = trimmed.replace(/^\(([iIvVxX\d]+)\)/i, 'a-($1)');
  } else if (/^\(([iIvVxX\d]+)\)[\s,–—\-]+b[\s\-–—:]/i.test(trimmed)) {
    trimmed = trimmed.replace(/^\(([iIvVxX\d]+)\)/i, 'a-($1)');
  } else if (/^([iIvVxX\d]+)[\s,–—\-]+(?:b[\s\-–—:]|\(b\)[\s\-–—:])/i.test(trimmed)) {
    trimmed = trimmed.replace(/^([iIvVxX\d]+)/i, 'a-$1');
  } else if (/^\(([iIvVxX\d]+)\)[\s,–—\-]+B[\s\-–—:]/i.test(trimmed)) {
    trimmed = trimmed.replace(/^\(([iIvVxX\d]+)\)/i, 'a-($1)');
  } else if (/^([iIvVxX\d]+)[\s,–—\-]+ब[\s\-–—:]/.test(trimmed)) {
    trimmed = trimmed.replace(/^([iIvVxX\d]+)/, 'अ-$1');
  } else if (/^\(([iIvVxX\d]+)\)[\s,–—\-]+\(ब\)[\s\-–—:]/.test(trimmed)) {
    trimmed = trimmed.replace(/^\(([iIvVxX\d]+)\)/, 'अ-($1)');
  }

  // Leading comma recovery
  if (/^[,\-–—;.]\s*/.test(trimmed)) {
    trimmed = trimmed.replace(/^[,\-–—;.]\s*/, '');
    if (allOptions && allOptions.length === 4) {
      const tokensInThis = trimmed.split(/[\s,–—\-]+/).filter(Boolean);
      if (tokensInThis.length === 3) {
        const allTokens = new Set();
        for (const o of allOptions) {
          const toks = String(o).replace(/^[,\-–—;.]\s*/, '').split(/[\s,–—\-]+/).filter(Boolean);
          toks.forEach(t => allTokens.add(t));
        }
        if (allTokens.size === 4) {
          const missing = Array.from(allTokens).find(t => !tokensInThis.includes(t));
          if (missing) {
            trimmed = missing + ', ' + trimmed;
          }
        }
      }
    }
  }

  // Orphan matra healing
  if (/^[\u093e-\u094c\u0902]/.test(trimmed)) {
    for (const [orphan, replacement] of Object.entries(ORPHAN_WORD_REPLACEMENTS)) {
      if (trimmed === orphan || trimmed.startsWith(orphan + ' ') || trimmed.startsWith(orphan + '-') || trimmed.startsWith(orphan + '–') || trimmed.startsWith(orphan + ',') || trimmed.startsWith(orphan + '।')) {
        trimmed = replacement + trimmed.slice(orphan.length);
        break;
      }
    }
  }

  return trimmed;
}

function standardizeOptionToABCD(opt, allOptions) {
  if (!opt || typeof opt !== 'string') return opt;
  const healed = healRawOptionString(opt, allOptions);

  // 1. Explicit pair matches: e.g. "a-III, b-I, c-IV, d-II" or "(a)-(ii)..." or "अ-3, ब-4..."
  const pairMatches = Array.from(healed.matchAll(/(?:\(?([a-dA-D\u0905\u092c\u0938\u09261-4])\)?[\s\-–—:]+\(?([ivxlcIVXLC\d\u0905\u092c\u0938\u0926a-dA-D]+)\)?)/g));
  if (pairMatches.length >= 2) {
    const pairsMap = {};
    for (let i = 0; i < pairMatches.length; i++) {
      const rawL = pairMatches[i][1];
      const rawR = pairMatches[i][2];

      let leftChar = ENG_ALPHA[i];
      if (/^[a-dA-D]$/i.test(rawL)) leftChar = rawL.toLowerCase();
      else if (/^[1-4]$/.test(rawL)) leftChar = ENG_ALPHA[parseInt(rawL, 10) - 1] || leftChar;
      else if (DEV_ALPHA.includes(rawL)) leftChar = ENG_ALPHA[DEV_ALPHA.indexOf(rawL)] || leftChar;

      const rightRoman = toRoman(rawR);
      pairsMap[leftChar] = rightRoman;
    }

    const sortedChars = Object.keys(pairsMap).sort();
    return sortedChars.map(c => `${c}-${pairsMap[c]}`).join(', ');
  }

  // 2. Positional options: e.g. "3, 4, 2, 1" or "(iii) (iv) (i) (ii)" or "स, ब, अ, द" or "c a d b"
  let cleanStr = healed.replace(/[()]/g, ' ').trim();
  const rawTokens = cleanStr.split(/[\s,–—\-]+/).filter(Boolean);

  if (rawTokens.length >= 2 && rawTokens.length <= 6) {
    const pairs = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const leftChar = ENG_ALPHA[i] || `x${i + 1}`;
      const rightRoman = toRoman(rawTokens[i]);
      pairs.push(`${leftChar}-${rightRoman}`);
    }
    return pairs.join(', ');
  }

  return healed;
}

function getDistinctiveTokens(text) {
  if (!text) return [];
  return text
    .replace(/[^\u0900-\u097Fa-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

function extractPairsFromExplanation(q) {
  if (!q.explanation || !q.meta?.left || !q.meta?.right) return null;
  const expl = q.explanation;
  const left = q.meta.left;
  const right = q.meta.right;

  let mapping = {}; // leftChar (a,b,c,d) -> rightRoman (I,II,III,IV)

  // Strategy 1: Immediate concatenation (e.g. "कबीरदादू दयाल")
  for (let lIdx = 0; lIdx < left.length; lIdx++) {
    const lItem = left[lIdx];
    for (let rIdx = 0; rIdx < right.length; rIdx++) {
      const rItem = right[rIdx];
      if (expl.includes(lItem.text + rItem.text) || expl.includes(lItem.text + ' ' + rItem.text)) {
        mapping[ENG_ALPHA[lIdx]] = ROMAN_NUMERALS[rIdx];
      }
    }
  }

  // Strategy 2: Arrow separation '→' or '->'
  if (expl.includes('→') || expl.includes('->')) {
    const arrowParts = expl.split(/(?:→|->)/);
    if (arrowParts.length >= 2) {
      for (let i = 0; i < arrowParts.length - 1; i++) {
        const segLeft = arrowParts[i].toLowerCase();
        const segRight = arrowParts[i + 1].toLowerCase();

        for (let lIdx = 0; lIdx < left.length; lIdx++) {
          const lChar = ENG_ALPHA[lIdx];
          if (mapping[lChar]) continue;
          const lTokens = getDistinctiveTokens(left[lIdx].text);
          if (lTokens.some(w => segLeft.includes(w))) {
            for (let rIdx = 0; rIdx < right.length; rIdx++) {
              const rRoman = ROMAN_NUMERALS[rIdx];
              if (Object.values(mapping).includes(rRoman)) continue;
              const rTokens = getDistinctiveTokens(right[rIdx].text);
              if (rTokens.some(w => segRight.includes(w))) {
                mapping[lChar] = rRoman;
                break;
              }
            }
          }
        }
      }
    }
  }

  // Strategy 3: Segmentation by sentences, newlines, colons, danda, commas
  const chunks = expl
    .split(/(?:[।\n\r;]|[,]\s+|\b(?:सूची-I|सूची-II|सूची 1|सूची 2|कॉलम I|कॉलम II)\b)/)
    .map(c => c.trim())
    .filter(c => c.length >= 3);

  for (const chunk of chunks) {
    const chunkLower = chunk.toLowerCase();

    const matchedLeft = [];
    for (let lIdx = 0; lIdx < left.length; lIdx++) {
      const lChar = ENG_ALPHA[lIdx];
      if (mapping[lChar]) continue;
      const lTokens = getDistinctiveTokens(left[lIdx].text);
      if (lTokens.length > 0) {
        if (chunkLower.includes(left[lIdx].text.trim().toLowerCase())) {
          matchedLeft.push({ lChar, priority: 3 });
        } else if (lTokens.some(w => chunkLower.includes(w))) {
          matchedLeft.push({ lChar, priority: 2 });
        }
      }
    }

    const matchedRight = [];
    for (let rIdx = 0; rIdx < right.length; rIdx++) {
      const rRoman = ROMAN_NUMERALS[rIdx];
      if (Object.values(mapping).includes(rRoman)) continue;
      const rTokens = getDistinctiveTokens(right[rIdx].text);
      if (rTokens.length > 0) {
        if (chunkLower.includes(right[rIdx].text.trim().toLowerCase())) {
          matchedRight.push({ rRoman, priority: 3 });
        } else if (rTokens.some(w => chunkLower.includes(w))) {
          matchedRight.push({ rRoman, priority: 2 });
        }
      }
    }

    if (matchedLeft.length === 1 && matchedRight.length === 1) {
      mapping[matchedLeft[0].lChar] = matchedRight[0].rRoman;
    } else if (matchedLeft.length > 0 && matchedRight.length > 0) {
      matchedLeft.sort((a, b) => b.priority - a.priority);
      matchedRight.sort((a, b) => b.priority - a.priority);
      if (!mapping[matchedLeft[0].lChar]) {
        mapping[matchedLeft[0].lChar] = matchedRight[0].rRoman;
      }
    }
  }

  // Strategy 4: Proximity scoring
  for (let lIdx = 0; lIdx < left.length; lIdx++) {
    const lChar = ENG_ALPHA[lIdx];
    if (mapping[lChar]) continue;
    const lTokens = getDistinctiveTokens(left[lIdx].text);
    if (lTokens.length === 0) continue;

    let bestRoman = null;
    let minDistance = Infinity;

    for (let rIdx = 0; rIdx < right.length; rIdx++) {
      const rRoman = ROMAN_NUMERALS[rIdx];
      if (Object.values(mapping).includes(rRoman)) continue;
      const rTokens = getDistinctiveTokens(right[rIdx].text);
      if (rTokens.length === 0) continue;

      for (const lt of lTokens) {
        let pos = 0;
        while (true) {
          const idxL = expl.toLowerCase().indexOf(lt, pos);
          if (idxL === -1) break;

          for (const rt of rTokens) {
            const idxR = expl.toLowerCase().indexOf(rt, Math.max(0, idxL - 150));
            if (idxR !== -1 && Math.abs(idxL - idxR) < 150) {
              const dist = Math.abs(idxL - idxR);
              if (dist < minDistance) {
                minDistance = dist;
                bestRoman = rRoman;
              }
            }
          }
          pos = idxL + lt.length;
        }
      }
    }

    if (bestRoman && minDistance < 120) {
      mapping[lChar] = bestRoman;
    }
  }

  return mapping;
}

function countMatches(standardizedOpt, derivedPairs) {
  if (!standardizedOpt || !derivedPairs) return 0;
  let matches = 0;
  for (const [lChar, rRoman] of Object.entries(derivedPairs)) {
    const pat = new RegExp(`\\b${lChar}-${rRoman}\\b`, 'i');
    if (pat.test(standardizedOpt)) {
      matches++;
    }
  }
  return matches;
}

// EXECUTION: PROCESS AND UPDATE ALL GK TOPICS AND ENGLISH TOPICS
function processAndRepairAll() {
  console.log('=== STANDARDIZING AND REPAIRING ALL TABLE QUESTIONS ACROSS POOLS ===\n');

  // 1. Process GK topics
  const gkFiles = fs.readdirSync(gkDir).filter(f => f.endsWith('.json'));
  let totalGKProcessed = 0;
  let totalGKOptionsStandardized = 0;
  let totalGKAnswersCorrected = 0;
  let gkCorrectionsLog = [];

  for (const file of gkFiles) {
    const fullPath = path.join(gkDir, file);
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const questions = Array.isArray(content) ? content : (content.questions || []);
    let fileModified = false;

    for (const q of questions) {
      const isMatch = q.type === 'match_following' || (q.meta?.left && q.meta?.right);
      if (!isMatch) continue;

      totalGKProcessed++;

      // Standardize meta.left IDs to a, b, c, d and clean text
      if (Array.isArray(q.meta?.left)) {
        q.meta.left = q.meta.left.map((item, idx) => ({
          id: ENG_ALPHA[idx] || String.fromCharCode(97 + idx),
          text: cleanMetaItemText(item.text)
        }));
      }

      // Standardize meta.right IDs to I, II, III, IV and clean text
      if (Array.isArray(q.meta?.right)) {
        q.meta.right = q.meta.right.map((item, idx) => ({
          id: ROMAN_NUMERALS[idx] || String(idx + 1),
          text: cleanMetaItemText(item.text)
        }));
      }

      // Standardize options to 'a-I, b-II, c-III, d-IV'
      const origOpts = [...(q.options || [])];
      const stdOpts = origOpts.map(opt => standardizeOptionToABCD(opt, origOpts));

      let optsChanged = false;
      for (let i = 0; i < origOpts.length; i++) {
        if (origOpts[i] !== stdOpts[i]) optsChanged = true;
      }
      if (optsChanged) {
        q.options = stdOpts;
        fileModified = true;
        totalGKOptionsStandardized++;
      }

      // Extract pairs and determine answer
      const derivedPairs = extractPairsFromExplanation(q);
      const pairCount = derivedPairs ? Object.keys(derivedPairs).length : 0;

      if (pairCount >= 2) {
        let bestIdx = -1;
        let maxMatches = 0;

        for (let i = 0; i < stdOpts.length; i++) {
          const m = countMatches(stdOpts[i], derivedPairs);
          if (m > maxMatches) {
            maxMatches = m;
            bestIdx = i;
          }
        }

        if (bestIdx !== -1 && maxMatches >= Math.min(3, pairCount) && maxMatches >= 2) {
          const newAns = ['A', 'B', 'C', 'D'][bestIdx];
          if (newAns && newAns !== q.answer) {
            gkCorrectionsLog.push({
              file,
              id: q.id,
              oldAnswer: q.answer,
              newAnswer: newAns,
              matchedPairs: `${maxMatches}/${pairCount}`,
              chosenOption: stdOpts[bestIdx],
              derivedPairs
            });
            q.answer = newAns;
            fileModified = true;
            totalGKAnswersCorrected++;
          }
        }
      }
    }

    if (fileModified) {
      fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8');
    }
  }

  // 2. Process English topics
  const engFiles = fs.readdirSync(engDir).filter(f => f.endsWith('.json'));
  let totalEngProcessed = 0;
  let totalEngOptionsStandardized = 0;
  let totalEngAnswersCorrected = 0;
  let engCorrectionsLog = [];

  for (const file of engFiles) {
    const fullPath = path.join(engDir, file);
    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const questions = Array.isArray(content) ? content : (content.questions || []);
    let fileModified = false;

    for (const q of questions) {
      const qText = q.questionText || q.question || '';
      const hasMatchOpts = (q.options || []).some(o => /[-–—:]\s*[ivxlc\d]/i.test(o) || /^[1-4][\s,]+[1-4]/.test(o));
      const isTableOrMatch = q.type === 'match_following' || qText.includes('|') || hasMatchOpts;
      if (!isTableOrMatch) continue;

      totalEngProcessed++;

      // Standardize options
      const origOpts = [...(q.options || [])];
      const stdOpts = origOpts.map(opt => standardizeOptionToABCD(opt, origOpts));

      let optsChanged = false;
      for (let i = 0; i < origOpts.length; i++) {
        if (origOpts[i] !== stdOpts[i]) optsChanged = true;
      }
      if (optsChanged) {
        q.options = stdOpts;
        fileModified = true;
        totalEngOptionsStandardized++;
      }
    }

    if (fileModified) {
      fs.writeFileSync(fullPath, JSON.stringify(content, null, 2), 'utf8');
    }
  }

  console.log('=== SUMMARY OF UPDATES ===');
  console.log(`GK Match Questions processed: ${totalGKProcessed}`);
  console.log(`GK Questions options standardized to 'a-I, b-II, c-III, d-IV': ${totalGKOptionsStandardized}`);
  console.log(`GK Answers corrected based on verified factual explanation: ${totalGKAnswersCorrected}`);
  console.log(`English Match Questions processed: ${totalEngProcessed}`);
  console.log(`English Questions options standardized: ${totalEngOptionsStandardized}`);

  console.log('\nTop 20 GK Answer Corrections applied:');
  for (let i = 0; i < Math.min(20, gkCorrectionsLog.length); i++) {
    const c = gkCorrectionsLog[i];
    console.log(`[${i + 1}] ID: ${c.id} (${c.file}) | Old Ans: ${c.oldAnswer} -> Correct Ans: ${c.newAnswer}`);
    console.log(`    Selected Option: "${c.chosenOption}" (Matched ${c.matchedPairs} pairs)`);
  }

  // Save log of all applied corrections
  fs.writeFileSync('scripts/applied_table_corrections.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    gkTotal: totalGKProcessed,
    gkOptionsStandardized: totalGKOptionsStandardized,
    gkAnswersCorrected: totalGKAnswersCorrected,
    engTotal: totalEngProcessed,
    engOptionsStandardized: totalEngOptionsStandardized,
    gkCorrections: gkCorrectionsLog
  }, null, 2));

  console.log('\nFull log saved to scripts/applied_table_corrections.json');
}

processAndRepairAll();

