const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const MULTI_STATEMENT_REGEX = /(?:निम्नलिखित\s*(?:कथनों|पर)\s*विचार|कथनों\s*पर\s*विचार|नीचे\s*दिए\s*गए\s*कथनों|कथन\s*\(?[1-4I-IVa-dA-D]\)?[\s\S]{1,150}कथन\s*\(?[2-4I-IVb-dB-D]\)?)/iu;

const FOOTER_REGEX = /(?:(?:\n|\s*)(?:उपर्युक्त\s*(?:कथनों\s*)?में\s*से|उपरोक्त\s*में\s*से|नीचे\s*दिए\s*गए\s*विकल्पों|सही\s*उत्तर\s*चुनिए|सही\s*विकल्प\s*का\s*चयन|सही\s*कूट\s*(?:है|का|चुनिए)|सत्य\s*कथन\s*है|इनमें\s*से\s*कौन)[\s\S]*$)/iu;

let totalCount = 0;
let formattedCount = 0;
const samples = [];

for (const file of fs.readdirSync(gkDir).filter(f => f.endsWith('.json'))) {
  const fullPath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const isArr = Array.isArray(data);
  const list = isArr ? data : data.questions || [];

  let fileChanged = false;

  for (const q of list) {
    if (q.type === 'assertion_reason' || q.type === 'match_following' || q.type === 'sequence') continue;
    const text = q.questionText || q.question || '';

    if (MULTI_STATEMENT_REGEX.test(text)) {
      totalCount++;

      // Check for detached footer
      let mainText = text;
      let footerText = '';
      const footerMatch = text.match(FOOTER_REGEX);
      if (footerMatch && footerMatch.index && footerMatch.index > 30) {
        footerText = footerMatch[0].trim();
        mainText = text.slice(0, footerMatch.index).trim();
      }

      // Format line breaks before numbered or lettered statements
      let cleaned = mainText
        // Ensure newline before (a), (b), (c), (d)
        .replace(/([^\n])\s*\(([a-dA-D1-5])\)\s*/g, '$1\n($2) ')
        // Ensure newline before 1., 2., 3., 4.
        .replace(/([।!?\.])\s*([1-5])\.\s*/g, '$1\n$2. ')
        // Ensure newline before कथन 1, कथन 2
        .replace(/([^\n])\s*(कथन\s*\(?[1-5a-dA-D]\)?[:\-–—]?)/g, '$1\n$2');

      // Ensure double newline after introductory clause
      cleaned = cleaned.replace(/((?:विचार\s*(?:कीजिए|कीजिये|करें|करते\s*हुए)|सही\s*कथनों?\s*का\s*चयन\s*करें)[:\-–—]?)\s*\n?/gu, '$1\n\n');

      // Re-attach footer with clean double newline
      if (footerText) {
        cleaned = `${cleaned.trim()}\n\n${footerText}`;
      }

      // Normalize consecutive newlines to maximum 2
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

      if (q.type !== 'statement_reason' || q.questionText !== cleaned) {
        q.type = 'statement_reason';
        q.questionText = cleaned;
        q.question = cleaned;
        fileChanged = true;
        formattedCount++;

        if (samples.length < 5) {
          samples.push({ id: q.id, original: text, cleaned });
        }
      }
    }
  }

  if (fileChanged) {
    fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf8');
  }
}

console.log(`Found ${totalCount} statement questions.`);
console.log(`Updated ${formattedCount} statement questions with type="statement_reason" and clean \\n\\n spacing!`);

console.log('\n--- Before & After Samples ---');
for (const s of samples) {
  console.log(`\n========================================`);
  console.log(`ID: ${s.id}`);
  console.log(`ORIGINAL:\n${JSON.stringify(s.original)}`);
  console.log(`CLEANED:\n${JSON.stringify(s.cleaned)}`);
}

