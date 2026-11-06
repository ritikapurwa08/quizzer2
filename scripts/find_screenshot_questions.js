const fs = require('fs');
const path = require('path');

const targetIds = ['rg_013052', 'rg_004955', 'rg_004956'];
const keywords = ['सोनियाना', 'फिनटेक', 'गोडावण', 'स्टोन पार्क'];

const dir = path.join(__dirname, '../data/questions/rajasthan-gk');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  const questions = Array.isArray(data) ? data : (data.questions || []);
  questions.forEach(q => {
    const hasTargetId = targetIds.includes(q.id);
    const hasKeyword = keywords.some(k => (q.text && q.text.includes(k)) || (q.explanation && q.explanation.includes(k)));
    if (hasTargetId || (hasKeyword && q.type === 'match_following')) {
      console.log(`Found in ${file}: ID=${q.id}, Type=${q.type}, Answer=${q.answer}`);
      console.log('Options:', q.options);
      console.log('Explanation snippet:', q.explanation ? q.explanation.substring(0, 100) : 'none');
      console.log('---');
    }
  });
});

