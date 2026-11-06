const fs = require('fs');
const path = require('path');

const parsed = JSON.parse(fs.readFileSync(path.join(__dirname, 'parsed_assertions.json'), 'utf8'));

const changes = [];
const verifiedA = [];

for (const q of parsed) {
  const expl = (q.explanation || '').toLowerCase();
  const explRaw = q.explanation || '';
  const aText = (q.assertionText || '').toLowerCase();
  const rText = (q.reasonText || '').toLowerCase();
  const options = q.options || [];

  // Determine true correct answer from explanation
  let deducedAnswer = null;
  let reason = '';

  // Check 1: Explanation says A is false / incorrect
  // E.g. "नक्की झील सिरोही में है, बूंदी में नहीं" -> A is false
  const aIsFalse = /अभिकथन\s*\(?[aA]\)?\s*(?:गलत|असत्य|सही\s*नहीं)|कथन\s*\(?[aA]\)?\s*(?:गलत|असत्य|सही\s*नहीं)|(?:'|‘|\")?A(?:'|’|\")?\s*(?:गलत|असत्य|सही\s*नहीं)|नहीं\s*है.*बूंदी/i.test(explRaw);

  // Check 2: Explanation says R is false / incorrect
  // E.g. "कारण (R) गलत है" or "यह 1954 में शुरू हुई थी न कि 1965 में" or "कपास के लिए नहीं"
  const rIsFalse = /कारण\s*\(?[rR]\)?\s*(?:गलत|असत्य|सही\s*नहीं)|(?:'|‘|\")?R(?:'|’|\")?\s*(?:गलत|असत्य|सही\s*नहीं)|1954\s*में\s*शुरू|कपास\s*के\s*लिए\s*नहीं/i.test(explRaw);

  // Check 3: Explanation says R is NOT correct explanation
  const rNotExplanation = /(?:सही\s*व्याख्या|स्पष्टीकरण)\s*नहीं|व्याख्या\s*नहीं\s*करता/i.test(explRaw);

  // Check 4: Explanation says R is correct explanation
  const rIsExplanation = /(?:सही\s*व्याख्या|स्पष्टीकरण)\s*(?:है|करता)/i.test(explRaw);

  // Check which option corresponds to what
  // Let's find index of "A सही... R गलत"
  const idxC = options.findIndex(o => /A\s*सही.*R\s*(?:गलत|सही\s*नहीं|असत्य)|‘A’\s*सत्य.*‘R’\s*असत्य/iu.test(o));
  const idxD = options.findIndex(o => /A\s*(?:गलत|सही\s*नहीं|असत्य).*R\s*सही|‘A’\s*असत्य.*‘R’\s*सत्य/iu.test(o));
  const idxB = options.findIndex(o => /(?:व्याख्या|स्पष्टीकरण)\s*नहीं/iu.test(o));
  const idxA = options.findIndex(o => /(?:व्याख्या|स्पष्टीकरण)\s*(?:है|करता)/iu.test(o) && !/(?:व्याख्या|स्पष्टीकरण)\s*नहीं/iu.test(o));

  if (aIsFalse && idxD !== -1) {
    deducedAnswer = ['A', 'B', 'C', 'D'][idxD];
    reason = 'Explanation proves Assertion (A) is false';
  } else if (rIsFalse && idxC !== -1) {
    deducedAnswer = ['A', 'B', 'C', 'D'][idxC];
    reason = 'Explanation proves Reason (R) is false';
  } else if (rNotExplanation && idxB !== -1) {
    deducedAnswer = ['A', 'B', 'C', 'D'][idxB];
    reason = 'Explanation proves R is NOT correct explanation';
  } else if (rIsExplanation && idxA !== -1) {
    deducedAnswer = ['A', 'B', 'C', 'D'][idxA];
    reason = 'Explanation proves both true and R explains A';
  }

  if (deducedAnswer && deducedAnswer !== q.currentAnswer) {
    changes.push({
      id: q.id,
      file: q.file,
      currentAnswer: q.currentAnswer,
      deducedAnswer,
      reason,
      oldOption: q.options[['A', 'B', 'C', 'D'].indexOf(q.currentAnswer)],
      newOption: q.options[['A', 'B', 'C', 'D'].indexOf(deducedAnswer)],
      explanation: q.explanation.slice(0, 160)
    });
  } else if (deducedAnswer === q.currentAnswer) {
    verifiedA.push(q.id);
  }
}

console.log(`Verified correct answers: ${verifiedA.length}`);
console.log(`Identified answer changes: ${changes.length}`);

for (const c of changes) {
  console.log(`\n[CHANGE] ID: ${c.id} (${c.file}): ${c.currentAnswer} -> ${c.deducedAnswer} (${c.reason})`);
  console.log(`  Old (${c.currentAnswer}): ${c.oldOption}`);
  console.log(`  New (${c.deducedAnswer}): ${c.newOption}`);
  console.log(`  Expl: ${c.explanation}`);
}

