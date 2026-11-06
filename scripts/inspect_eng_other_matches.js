const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const MATCH_REGEX = /(?:सूची\s*[-–—:]*\s*[1I]\s*को\s*सूची\s*[-–—:]*\s*[2II]|सुमेलित\s*(?:कीजिए|कीजिये|करें)|स्तंभ\s*[-–—:]*\s*[1I]\s*को\s*स्तंभ|list\s*[-–—:]*\s*[1I]\s*with\s*list\s*[-–—:]*\s*[2II]|match\s*list)/iu;
const TABLE_REGEX = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|/u;

const otherMatches = [];

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(engDir, file), 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = q.questionText || q.question || q.prompt || '';
    if (MATCH_REGEX.test(text) && !TABLE_REGEX.test(text)) {
      otherMatches.push({
        file,
        id: q.id,
        text,
        options: q.options,
        answer: q.answer
      });
    }
  }
}

console.log(`Found ${otherMatches.length} non-table match questions in English:`);
otherMatches.forEach(q => {
  console.log(`\nID: ${q.id} (${q.file}) Ans: ${q.answer}`);
  console.log('Text:\n' + q.text);
  console.log('Options:', q.options);
});

