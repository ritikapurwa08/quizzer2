const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'parsed_assertions.json'), 'utf8'));

// Build answer corrections map
const answerChangesMap = {
  'rg_013135': 'C',
  'rg_013384': 'D',
  'rg_003566': 'C',
  'rg_007949': 'B',
  'rg_011680': 'B',
  'rg_004958': 'B',
  'rg_004961': 'B',
  'rg_003995': 'B',
  'rg_009614': 'B',
  'rg_008710': 'B',
  'rg_010285': 'B',
  'rg_010289': 'B',
  'rg_002747': 'B',
  'rg_007711': 'B',
  'rg_012136': 'B'
};

const fileMap = new Map();

for (const item of parsed) {
  if (!fileMap.has(item.file)) fileMap.set(item.file, []);
  fileMap.get(item.file).push(item);
}

let totalFormatted = 0;
let totalAnswersCorrected = 0;

for (const [file, items] of fileMap.entries()) {
  const fullPath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const isArr = Array.isArray(data);
  const list = isArr ? data : data.questions || [];

  let fileChanged = false;

  for (const item of items) {
    const q = list.find(x => x.id === item.id);
    if (!q) continue;

    // 1. Set canonical type
    if (q.type !== 'assertion_reason') {
      q.type = 'assertion_reason';
      fileChanged = true;
    }

    // 2. Format with clean \n\n spacing
    if (item.assertionText && item.reasonText) {
      const cleanA = item.assertionText.replace(/^[\s\-–—:]+/, '').trim();
      const cleanR = item.reasonText.replace(/^[\s\-–—:]+/, '').trim();

      const formatted = `नीचे दो कथन दिए गए हैं, एक को अभिकथन (A) और दूसरे को कारण (R) कहा गया है:\n\nअभिकथन (A): ${cleanA}\n\nकारण (R): ${cleanR}\n\nउपर्युक्त कथनों के आलोक में सही विकल्प चुनिए:`;

      if (q.questionText !== formatted) {
        q.questionText = formatted;
        q.question = formatted;
        fileChanged = true;
        totalFormatted++;
      }
    }

    // 3. Apply answer correction if mapped
    if (answerChangesMap[q.id]) {
      const targetAns = answerChangesMap[q.id];
      if (q.answer !== targetAns) {
        q.answer = targetAns;
        fileChanged = true;
        totalAnswersCorrected++;
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log(`Successfully formatted ${totalFormatted} assertion questions with clean double line breaks!`);
console.log(`Successfully corrected ${totalAnswersCorrected} assertion answers!`);

