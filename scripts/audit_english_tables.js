const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const TABLE_REGEX = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|/u;
const MATCH_REGEX = /(?:सूची\s*[-–—:]*\s*[1I]\s*को\s*सूची\s*[-–—:]*\s*[2II]|सुमेलित\s*(?:कीजिए|कीजिये|करें)|स्तंभ\s*[-–—:]*\s*[1I]\s*को\s*स्तंभ|list\s*[-–—:]*\s*[1I]\s*with\s*list\s*[-–—:]*\s*[2II]|match\s*list|match\s*column)/iu;

const standardPattern = /^a-[IVX]+,\s*b-[IVX]+,\s*c-[IVX]+(?:,\s*d-[IVX]+)?(?:,\s*e-[IVX]+)?$/i;

const engQuestions = [];
const nonStandard = [];

for (const file of fs.readdirSync(engDir).filter(f => f.endsWith('.json'))) {
  const p = path.join(engDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const list = Array.isArray(data) ? data : data.questions || [];

  for (const q of list) {
    const text = q.questionText || q.question || q.prompt || '';
    if (TABLE_REGEX.test(text) || q.type === 'table' || (MATCH_REGEX.test(text) && q.options?.some(o => /^[a-d\d(i]/i.test(o)))) {
      const opts = q.options || [];
      const hasNonStandard = opts.some(opt => !standardPattern.test(opt.trim()));
      
      engQuestions.push({
        file,
        id: q.id,
        type: q.type,
        answer: q.answer,
        options: opts,
        text,
        explanation: q.explanation || '',
        hasNonStandard
      });

      if (hasNonStandard) {
        nonStandard.push({
          file,
          id: q.id,
          answer: q.answer,
          options: opts,
          textSnippet: text.slice(0, 150)
        });
      }
    }
  }
}

console.log(`=== English Table/Match Audit ===`);
console.log(`Total questions found: ${engQuestions.length}`);
console.log(`Questions with non-standard options: ${nonStandard.length}`);
if (nonStandard.length > 0) {
  console.log('Sample non-standard English questions:', JSON.stringify(nonStandard.slice(0, 5), null, 2));
}

fs.writeFileSync(path.join(__dirname, 'eng_table_audit_results.json'), JSON.stringify({
  total: engQuestions.length,
  nonStandardCount: nonStandard.length,
  nonStandard,
  all: engQuestions
}, null, 2));

