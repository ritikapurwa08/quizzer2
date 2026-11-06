const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');

const ASSERTION_REGEX = /(?:अभिकथन\s*\(?[aA1]\)?|कथन\s*\(?[aA]\)?\s*और\s*कारण|कथन\s*\(?[aA]\)?[\s\S]{1,200}कारण\s*\(?[rR]\)?|assertion\s*\(?[aA]\)?[\s\S]{1,200}reason\s*\(?[rR]\)?)/iu;

const MULTI_STATEMENT_REGEX = /(?:निम्नलिखित\s*(?:कथनों|पर)\s*विचार|कथनों\s*पर\s*विचार|नीचे\s*दिए\s*गए\s*कथनों|कथन\s*\(?[1-4I-IVa-dA-D]\)?[\s\S]{1,150}कथन\s*\(?[2-4I-IVb-dB-D]\)?|consider the following statements|statement\s*\(?[1-4I-IVa-dA-D]\)?[\s\S]{1,150}statement\s*\(?[2-4I-IVb-dB-D]\)?)/iu;

const SEQUENCE_REGEX = /(?:कालक्रमानुसार|कालानुक्रम|कालक्रम|व्यवस्थित\s*(?:कीजिए|कीजिये|किजीए|करें)|अवरोही\s*क्रम|आरोही\s*क्रम|सही\s*(?:भौगोलिक\s*)?क्रम|बढ़ते\s*क्रम|घटते\s*क्रम|chronological|arrange\s*(?:in|the)\s*(?:correct\s*)?order|correct\s*sequence)/iu;

const TABLE_REGEX = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|/u;

const MATCH_REGEX = /(?:सूची\s*[-–—:]*\s*[1I]\s*को\s*सूची\s*[-–—:]*\s*[2II]|सुमेलित\s*(?:कीजिए|कीजिये|करें)|स्तंभ\s*[-–—:]*\s*[1I]\s*को\s*स्तंभ|list\s*[-–—:]*\s*[1I]\s*with\s*list\s*[-–—:]*\s*[2II]|match\s*list)/iu;

function analyzeDir(dir, name) {
  let total = 0;
  let assertionCount = 0;
  let multiStatementCount = 0;
  let sequenceCount = 0;
  let tableCount = 0;
  let matchCount = 0;
  let currentTypes = {};

  const samples = {
    assertion: [],
    multiStatement: [],
    sequence: [],
    table: [],
    match: []
  };

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const list = Array.isArray(data) ? data : data.questions || [];

    for (const q of list) {
      total++;
      currentTypes[q.type] = (currentTypes[q.type] || 0) + 1;
      const text = `${q.questionText || q.question || q.prompt || ''}\n${q.explanation || ''}`;

      if (ASSERTION_REGEX.test(text)) {
        assertionCount++;
        if (samples.assertion.length < 3) samples.assertion.push({ id: q.id, type: q.type, text: (q.questionText || q.question || '').slice(0, 140) });
      } else if (TABLE_REGEX.test(text)) {
        tableCount++;
        if (samples.table.length < 3) samples.table.push({ id: q.id, type: q.type, text: (q.questionText || q.question || '').slice(0, 140) });
      } else if (SEQUENCE_REGEX.test(text)) {
        sequenceCount++;
        if (samples.sequence.length < 3) samples.sequence.push({ id: q.id, type: q.type, text: (q.questionText || q.question || '').slice(0, 140) });
      } else if (MATCH_REGEX.test(text)) {
        matchCount++;
        if (samples.match.length < 3) samples.match.push({ id: q.id, type: q.type, text: (q.questionText || q.question || '').slice(0, 140) });
      } else if (MULTI_STATEMENT_REGEX.test(text)) {
        multiStatementCount++;
        if (samples.multiStatement.length < 3) samples.multiStatement.push({ id: q.id, type: q.type, text: (q.questionText || q.question || '').slice(0, 140) });
      }
    }
  }

  console.log(`=== ${name} (${total} questions) ===`);
  console.log('Current types:', currentTypes);
  console.log(`Assertion-Reason: ${assertionCount}`);
  console.log(`Multi-Statement / Statement-Reason: ${multiStatementCount}`);
  console.log(`Sequence / Chronology: ${sequenceCount}`);
  console.log(`Table (Markdown pipe): ${tableCount}`);
  console.log(`Match Following: ${matchCount}`);
  console.log('\nSamples:');
  console.log('Assertion samples:', samples.assertion);
  console.log('Multi-statement samples:', samples.multiStatement);
  console.log('Sequence samples:', samples.sequence);
  console.log('Table samples:', samples.table);
  console.log('Match samples:', samples.match);
  console.log('\n');
}

analyzeDir(gkDir, 'Rajasthan GK');
analyzeDir(engDir, 'English Pool');

