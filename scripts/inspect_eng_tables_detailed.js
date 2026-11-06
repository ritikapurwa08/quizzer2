const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const TABLE_REGEX = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|/u;

const questions = [];

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(engDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = q.questionText || q.question || q.prompt || '';
    if (TABLE_REGEX.test(text) || q.type === 'table') {
      questions.push({
        file,
        id: q.id,
        text,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation || '',
        meta: q.meta
      });
    }
  }
}

console.log(`Loaded ${questions.length} table questions from English.`);

// Check option formats
const optionFormatSamples = new Set();
questions.forEach(q => {
  if (Array.isArray(q.options)) {
    q.options.forEach(opt => {
      // replace letters and numbers with placeholders to see pattern
      const pattern = opt.replace(/[a-dA-D]/g, 'x').replace(/[iIvVxX0-9]/g, 'n');
      optionFormatSamples.add(pattern);
    });
  }
});

console.log('Unique option patterns (sample 15):', Array.from(optionFormatSamples).slice(0, 15));

// Check if any answer is invalid (not A, B, C, D or 0, 1, 2, 3)
const invalidAnswers = questions.filter(q => !['A', 'B', 'C', 'D', '0', '1', '2', '3', 0, 1, 2, 3].includes(q.answer));
console.log('Invalid answer values:', invalidAnswers.length);

fs.writeFileSync(path.join(__dirname, 'eng_table_detailed.json'), JSON.stringify(questions, null, 2));

