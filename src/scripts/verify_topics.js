const fs = require('fs');
const path = require('path');

const XDATA_DIR = path.join(__dirname, '../xdata');
const TOPICS_DIR = path.join(XDATA_DIR, 'topics');
const RG_DIR = path.join(TOPICS_DIR, 'rajasthan_gyan');
const BOOK_DIR = path.join(TOPICS_DIR, 'book');
const INDEX_FILE = path.join(TOPICS_DIR, 'index.json');

const MERGED_26K_FILE = path.join(XDATA_DIR, 'rajasthan_pyq_merged_26151.json');
const SELECTED_15K_FILE = path.join(XDATA_DIR, 'rajasthan_selected_topics_question_15000.json');

async function main() {
  console.log('=== VERIFYING TOPIC DATASETS & INTEGRITY ===\n');

  // 1. Check master files
  const data15k = JSON.parse(fs.readFileSync(SELECTED_15K_FILE, 'utf8'));
  const data26k = JSON.parse(fs.readFileSync(MERGED_26K_FILE, 'utf8'));
  console.log(`Master files:`);
  console.log(`- rajasthan_selected_topics_question_15000.json: ${data15k.length} questions`);
  console.log(`- rajasthan_pyq_merged_26151.json: ${data26k.length} questions`);

  // 2. Check index.json
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  console.log(`\nIndex catalog:`);
  console.log(`- Total topics in index: ${index.topics.length}`);
  console.log(`- Total questions reported: ${index.totalQuestions}`);
  console.log(`- Rajasthan Gyan topics: ${index.sources.rajasthan_gyan.totalTopics} (${index.sources.rajasthan_gyan.totalQuestions} questions)`);
  console.log(`- Book topics: ${index.sources.book.totalTopics} (${index.sources.book.totalQuestions} questions)`);

  // 3. Check individual files in RG_DIR
  const rgFiles = fs.readdirSync(RG_DIR).filter(f => f.endsWith('.json'));
  let rgTotalQ = 0;
  let rgExamCount = 0;
  for (const f of rgFiles) {
    const questions = JSON.parse(fs.readFileSync(path.join(RG_DIR, f), 'utf8'));
    rgTotalQ += questions.length;
    rgExamCount += questions.filter(q => q.exam && q.exam.trim() !== '').length;
  }
  console.log(`\nRajasthan Gyan individual files (${rgFiles.length} files):`);
  console.log(`- Total questions summed from files: ${rgTotalQ} (expected: 17,143)`);
  console.log(`- Total questions with exam filled: ${rgExamCount}`);
  console.log(`- Status: ${rgTotalQ === 17143 ? 'PASSED (100% matched)' : 'MISMATCH'}`);

  // 4. Check individual files in BOOK_DIR
  const bookFiles = fs.readdirSync(BOOK_DIR).filter(f => f.endsWith('.json'));
  let bookTotalQ = 0;
  let bookExamCount = 0;
  for (const f of bookFiles) {
    const questions = JSON.parse(fs.readFileSync(path.join(BOOK_DIR, f), 'utf8'));
    bookTotalQ += questions.length;
    bookExamCount += questions.filter(q => q.exam && q.exam.trim() !== '').length;
  }
  console.log(`\nBook individual files (${bookFiles.length} files):`);
  console.log(`- Total questions summed from files: ${bookTotalQ} (expected: 9,008)`);
  console.log(`- Total questions with exam filled: ${bookExamCount}`);
  console.log(`- Status: ${bookTotalQ === 9008 ? 'PASSED (100% matched)' : 'MISMATCH'}`);

  // 5. Total verification
  const grandTotal = rgTotalQ + bookTotalQ;
  console.log(`\nGrand Total Questions across all topic files: ${grandTotal} (expected: 26,151)`);
  console.log(`- Status: ${grandTotal === 26151 ? 'PASSED (100% MATCH)' : 'MISMATCH'}`);

  // 6. Check sample question schema
  const sampleRG = JSON.parse(fs.readFileSync(path.join(RG_DIR, rgFiles[0]), 'utf8'))[0];
  console.log(`\nSample question structure (${rgFiles[0]}):`, {
    id: sampleRG.id,
    topic: sampleRG.topic,
    question: sampleRG.question.slice(0, 40) + '...',
    optionsCount: sampleRG.options.length,
    answer: sampleRG.answer,
    exam: sampleRG.exam,
    hasExplanation: Boolean(sampleRG.explanation)
  });
}

main().catch(console.error);
