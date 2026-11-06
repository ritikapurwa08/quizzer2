const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

const standardPattern = /^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?(?:,\s*e-[IVX]+)?$/i;

const flaggedQuestions = [];

for (const file of files) {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];

  for (const q of questions) {
    if (q.type !== 'match_following') continue;

    const nonStdOpts = (q.options || []).filter(opt => !standardPattern.test(opt.trim()));
    if (nonStdOpts.length > 0) {
      flaggedQuestions.push({
        file,
        id: q.id,
        answer: q.answer,
        options: q.options,
        rawQuestionText: q.meta?.rawQuestionText || q.questionText || q.question || '',
        meta: q.meta,
        explanation: q.explanation || ''
      });
    }
  }
}

console.log(`Found ${flaggedQuestions.length} match questions with non-standard options.`);
fs.writeFileSync(path.join(__dirname, 'nonstandard_match_questions.json'), JSON.stringify(flaggedQuestions, null, 2));

// Group by category:
let misclassifiedMultiStatement = [];
let truncated4Pair = [];
let legitimate2or3Pair = [];

flaggedQuestions.forEach(q => {
  const raw = q.rawQuestionText;
  const isMultiStatement = /निम्न\s*में\s*से\s*कौन\s*(?:सा|से)\s*(?:सही\s*)?सुमेलित\s*(?:है|हैं|नहीं\s*है)/i.test(raw) ||
                           /निम्नलिखित\s*में\s*से\s*कौन\s*सा\s*(?:युग्म|जोड़ा|कथन)\s*(?:सही\s*)?सुमेलित/i.test(raw);
  if (isMultiStatement) {
    misclassifiedMultiStatement.push(q);
  } else if (q.meta?.left?.length === 4 && q.meta?.right?.length === 4) {
    truncated4Pair.push(q);
  } else {
    legitimate2or3Pair.push(q);
  }
});

console.log(`Misclassified multi-statement / which-is-correct: ${misclassifiedMultiStatement.length}`);
console.log(`4-pair match with truncated options: ${truncated4Pair.length}`);
console.log(`Legitimate 2 or 3 pair / other matches: ${legitimate2or3Pair.length}`);

