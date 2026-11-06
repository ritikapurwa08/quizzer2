const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const seqQuestions = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_sequence_questions.json'), 'utf8'));

console.log(`Auditing ${seqQuestions.length} sequence questions...`);

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const ENG_ALPHA = ['a', 'b', 'c', 'd', 'e', 'f'];

let fixedPromptCount = 0;
let fixedMetaIdCount = 0;
let answerChanges = [];

for (const q of seqQuestions) {
  let fileChanged = false;

  // 1. Check if prompt says "सुमेलित कीजिए" but rawQuestionText or question is sequence
  if (q.questionText.includes('सुमेलित') && q.meta?.rawQuestionText) {
    const rawMatch = q.meta.rawQuestionText.match(/([^:\n]+(?:व्यवस्थित\s*(?:कीजिए|कीजिये|किजीए|करें)|कालक्रमानुसार|आरोही\s*क्रम|अवरोही\s*क्रम|बढ़ते\s*क्रम|घटते\s*क्रम)[^:\n]*:?)/u);
    if (rawMatch) {
      q.questionText = rawMatch[1].trim();
      fixedPromptCount++;
    }
  }

  // 2. Fix duplicate meta item IDs
  if (q.meta && Array.isArray(q.meta.items)) {
    for (let i = 0; i < q.meta.items.length; i++) {
      const expectedId = ENG_ALPHA[i];
      if (q.meta.items[i].id !== expectedId) {
        q.meta.items[i].id = expectedId;
        fixedMetaIdCount++;
      }
    }
  }

  // 3. Check answer key against explanation for Answer A questions
  if (q.answer === 'A' && q.explanation) {
    // Check specific known sequence questions like rg_000572
    if (q.id === 'rg_000572') {
      // South-East to North-West: Hadoti (a) -> Banas (b) -> Aravalli (c) -> Desert (d) -> Option B
      answerChanges.push({ id: q.id, from: 'A', to: 'B', reason: 'SE to NW physical division order is a,b,c,d' });
    }
  }
}

console.log(`Fixed misleading prompts in ${fixedPromptCount} sequence questions.`);
console.log(`Fixed meta item IDs in ${fixedMetaIdCount} items.`);

// Apply to disk
for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const fullPath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const isArr = Array.isArray(data);
  const list = isArr ? data : data.questions || [];

  let changed = false;

  for (const q of list) {
    const match = seqQuestions.find(x => x.id === q.id);
    if (match) {
      if (q.type !== 'sequence') {
        q.type = 'sequence';
        changed = true;
      }
      if (match.questionText !== q.questionText) {
        q.questionText = match.questionText;
        q.question = match.questionText;
        changed = true;
      }
      if (match.meta?.items && JSON.stringify(q.meta?.items) !== JSON.stringify(match.meta.items)) {
        q.meta = q.meta || {};
        q.meta.items = match.meta.items;
        changed = true;
      }
      const ansChange = answerChanges.find(x => x.id === q.id);
      if (ansChange && q.answer !== ansChange.to) {
        q.answer = ansChange.to;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log(`Saved sequence question updates to disk!`);

