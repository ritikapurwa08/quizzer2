const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const TABLE_REGEX = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|/u;

const tableQuestions = [];

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(engDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = q.questionText || q.question || q.prompt || '';
    if (TABLE_REGEX.test(text) || q.type === 'table') {
      tableQuestions.push({
        file,
        id: q.id,
        type: q.type,
        answer: q.answer,
        options: q.options,
        text,
        explanation: q.explanation || ''
      });
    }
  }
}

console.log(`Found ${tableQuestions.length} table questions in English.`);
fs.writeFileSync(path.join(__dirname, 'english_table_questions.json'), JSON.stringify(tableQuestions, null, 2));

// Summary of answers
const answerCounts = {};
tableQuestions.forEach(q => {
  const ans = String(q.answer);
  answerCounts[ans] = (answerCounts[ans] || 0) + 1;
});
console.log('Answer distribution:', answerCounts);

// Look at first 5
console.log('\n--- Sample 1 ---');
console.log(tableQuestions[0].text);
console.log('Options:', tableQuestions[0].options);
console.log('Answer:', tableQuestions[0].answer);
console.log('Explanation:', tableQuestions[0].explanation);

