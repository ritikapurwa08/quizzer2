const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const treeHash = 'a0d88402740e1b0ab8983b74140c49b19ac86ae0';
const filesOutput = execSync(`git ls-tree ${treeHash}`).toString();
const lines = filesOutput.split('\n').filter(Boolean);

console.log(`Processing ${lines.length} files from git commit c69617e...`);

// Load all old questions into map
const oldQuestionsMap = new Map();

lines.forEach((line, fIdx) => {
  const parts = line.split(/\s+/);
  const blobHash = parts[2];
  const fileName = parts.slice(3).join(' ');

  const content = execSync(`git cat-file -p ${blobHash}`, { maxBuffer: 30 * 1024 * 1024 }).toString();
  const data = JSON.parse(content);
  const qList = Array.isArray(data) ? data : data.questions || [];

  qList.forEach(q => {
    oldQuestionsMap.set(q.id, {
      fileName,
      id: q.id,
      answer: q.answer,
      options: q.options,
      question: q.question || q.questionText,
      explanation: q.explanation
    });
  });
});

console.log(`Loaded ${oldQuestionsMap.size} questions from old master tree.`);

// Now inspect current match questions
const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const currentFiles = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalCurrentMatch = 0;
const comparisons = [];

currentFiles.forEach(file => {
  const p = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  questions.forEach(q => {
    if (q.type !== 'match_following') return;
    totalCurrentMatch++;

    const old = oldQuestionsMap.get(q.id);
    if (!old) {
      comparisons.push({
        id: q.id,
        status: 'not_in_old',
        file,
        current: q
      });
    } else {
      comparisons.push({
        id: q.id,
        status: 'found_in_old',
        file,
        currentAns: q.answer,
        oldAns: old.answer,
        currentOpts: q.options,
        oldOpts: old.options,
        currentMeta: q.meta,
        explanation: q.explanation || old.explanation,
        rawQuestionText: q.meta?.rawQuestionText || q.questionText || q.question
      });
    }
  });
});

console.log(`Total current match questions: ${totalCurrentMatch}`);
fs.writeFileSync(path.join(__dirname, 'match_old_comparisons.json'), JSON.stringify(comparisons, null, 2));

// Summary of comparison
let optionsDifferCount = 0;
let answerDifferCount = 0;
let mangledCurrentOptionsCount = 0;

comparisons.forEach(c => {
  if (c.status !== 'found_in_old') return;
  if (c.currentAns !== c.oldAns) answerDifferCount++;
  
  // check if current options are mangled (e.g. have only 2 pairs when 4 items exist)
  const isMangled = (c.currentOpts || []).some(opt => {
    const pairs = opt.split(',').length;
    return pairs < 3 && c.currentMeta?.left?.length >= 4;
  });
  if (isMangled) mangledCurrentOptionsCount++;
});

console.log(`Answer differs from old: ${answerDifferCount}`);
console.log(`Current options mangled (< 3 pairs for 4 items): ${mangledCurrentOptionsCount}`);

