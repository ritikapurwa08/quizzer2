const fs = require('fs');
const path = require('path');

const engDir = path.join(__dirname, '..', 'data', 'questions', 'english', 'topics');
const files = fs.readdirSync(engDir).filter(f => f.endsWith('.json')).sort();

let totalUpdated = 0;

files.forEach(file => {
  const filePath = path.join(engDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  let fileChanged = false;

  questions.forEach(q => {
    // 1. Special case: Error Spotting questions with corrupted pipe tables
    if (q.id === 'rg_eng_002121') {
      q.type = 'mcq';
      q.questionText = 'Select the most appropriate option to identify the incorrect segment in the following sentence:\n\nThe judge concluded that (a) / either the maid or the driver were (b) / responsible for the murder (c).';
      q.options = ['(b) only', '(a) only', '(c) only', 'No error'];
      q.answer = 'A';
      q.explanation = 'Subject-verb agreement error: When two singular subjects ("the maid", "the driver") are connected by "either... or", the verb must be singular ("was", not "were"). Therefore, segment (b) is incorrect.';
      delete q.meta;
      fileChanged = true;
      totalUpdated++;
      return;
    }

    if (q.id === 'rg_eng_002122') {
      q.type = 'mcq';
      q.questionText = 'Select the most appropriate option to identify the incorrect segment in the following sentence:\n\nThe dazzle and glamour (a) / of money and success (b) / have gone to her head (c).';
      q.options = ['(c) only', '(a) only', '(b) only', 'No error'];
      q.answer = 'A';
      q.explanation = 'Subject-verb agreement error: "The dazzle and glamour" is treated as a single unified concept/idea, which requires a singular verb ("has gone", not "have gone"). Therefore, segment (c) is incorrect.';
      delete q.meta;
      fileChanged = true;
      totalUpdated++;
      return;
    }

    // 2. Special case: rg_eng_000651
    if (q.id === 'rg_eng_000651') {
      q.type = 'table';
      q.options = [
        'a-IV, b-III, c-I, d-II',
        'a-IV, b-I, c-II, d-III',
        'a-III, b-IV, c-I, d-II',
        'a-II, b-III, c-IV, d-I'
      ];
      q.answer = 'A';
      fileChanged = true;
      totalUpdated++;
    }

    // 3. Special case: rg_eng_000976
    if (q.id === 'rg_eng_000976') {
      q.type = 'table';
      q.options = [
        'a-IV, b-III, c-II, d-I',
        'a-IV, b-I, c-II, d-III',
        'a-II, b-III, c-IV, d-I',
        'a-I, b-III, c-IV, d-II'
      ];
      q.answer = 'B';
      fileChanged = true;
      totalUpdated++;
    }

    // 4. Special case: rg_eng_001296
    if (q.id === 'rg_eng_001296') {
      q.type = 'table';
      q.options = [
        'a-II, b-I, c-III, d-IV',
        'a-I, b-II, c-IV, d-III',
        'a-III, b-IV, c-II, d-I',
        'a-IV, b-III, c-I, d-II'
      ];
      q.answer = 'C';
      fileChanged = true;
      totalUpdated++;
    }

    // 5. Special case: rg_eng_001884
    if (q.id === 'rg_eng_001884') {
      q.type = 'table';
      q.options = [
        'a-III, b-IV, c-II, d-I',
        'a-IV, b-III, c-II, d-I',
        'a-I, b-III, c-II, d-IV',
        'a-IV, b-III, c-I, d-II'
      ];
      q.answer = 'B';
      fileChanged = true;
      totalUpdated++;
    }

    // 6. Special case: rg_eng_002038
    if (q.id === 'rg_eng_002038') {
      q.type = 'table';
      q.options = [
        'a-II, b-III, c-IV, d-I',
        'a-II, b-IV, c-III, d-I',
        'a-III, b-IV, c-II, d-I',
        'a-IV, b-III, c-II, d-I'
      ];
      q.answer = 'B';
      fileChanged = true;
      totalUpdated++;
    }

    // General table question processing
    const text = q.questionText || q.question || '';
    if (text.includes('|') && text.includes('---')) {
      q.type = 'table';
      
      // Extract headers and rows
      const tableMatch = text.match(/\|\s*([^|\n\r]+)\s*\|\s*([^|\n\r]+)\s*\|\r?\n\|\s*[-:\s]+\|\s*[-:\s]+\|\r?\n([\s\S]*?)(?:\r?\n\r?\n|Choose|Select|Code|$)/i);
      if (tableMatch) {
        const headers = [tableMatch[1].trim(), tableMatch[2].trim()];
        const rowLines = tableMatch[3].split(/\r?\n/).filter(line => line.includes('|'));
        const rows = rowLines.map(line => {
          const cells = line.split('|').map(c => c.trim()).filter(Boolean);
          return cells;
        }).filter(r => r.length >= 2);

        if (rows.length > 0) {
          q.meta = q.meta || {};
          q.meta.headers = headers;
          q.meta.rows = rows;
          q.meta.rawQuestionText = text;
        }
      }

      // Standardize options formatting to lowercase letters and uppercase Roman: e.g. a-I, b-II, c-III, d-IV
      if (Array.isArray(q.options)) {
        q.options = q.options.map(opt => {
          let s = opt.trim();
          // replace (i)-(d) etc
          s = s.replace(/^[(\s]*[1iaA][)\s]*[-–—:]\s*([ivxIVX\d]+|[a-dA-D])[)\s]*/gi, 'a-$1, ');
          s = s.replace(/^[(\s]*[2ibB][)\s]*[-–—:]\s*([ivxIVX\d]+|[a-dA-D])[)\s]*/gi, 'b-$1, ');
          s = s.replace(/[,\s]+[2ibB][)\s]*[-–—:]\s*([ivxIVX\d]+|[a-dA-D])[)\s]*/gi, ', b-$1, ');
          s = s.replace(/[,\s]+[3icC][)\s]*[-–—:]\s*([ivxIVX\d]+|[a-dA-D])[)\s]*/gi, ', c-$1, ');
          s = s.replace(/[,\s]+[4idD][)\s]*[-–—:]\s*([ivxIVX\d]+|[a-dA-D])[)\s]*/gi, ', d-$1, ');
          s = s.replace(/,\s*$/, '');

          // Normalize Roman to uppercase
          s = s.replace(/-([ivx]+)\b/gi, (m, r) => `-${r.toUpperCase()}`);
          return s;
        });
      }

      fileChanged = true;
      totalUpdated++;
    }
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Updated ${totalUpdated} questions across English topics.`);

