const fs = require('fs');
const path = require('path');

function scanDir(dir, label) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  let totalQuestions = 0;
  const tableQuestions = [];

  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);
    totalQuestions += questions.length;

    questions.forEach(q => {
      const hasPipeTable = q.text && q.text.includes('|') && q.text.includes('---');
      const isTableType = q.type === 'table';
      const hasTableMeta = q.meta && (q.meta.headers || q.meta.rows);
      
      if (hasPipeTable || isTableType || hasTableMeta) {
        tableQuestions.push({
          file,
          id: q.id,
          type: q.type,
          hasPipeTable,
          isTableType,
          hasTableMeta,
          answer: q.answer,
          textSnippet: q.text.replace(/\n/g, ' ').substring(0, 80),
          options: q.options,
          explanation: q.explanation ? q.explanation.substring(0, 120) : null
        });
      }
    });
  });

  console.log(`=== ${label} ===`);
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Table questions found: ${tableQuestions.length}`);
  return tableQuestions;
}

const gkTables = scanDir(path.join(__dirname, '../data/questions/rajasthan-gk'), 'Rajasthan GK');
const engTables = scanDir(path.join(__dirname, '../data/questions/english/topics'), 'English');

fs.writeFileSync(path.join(__dirname, 'found_table_questions.json'), JSON.stringify({ gkTables, engTables }, null, 2));

