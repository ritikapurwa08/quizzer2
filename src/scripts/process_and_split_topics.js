const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const XDATA_DIR = path.join(ROOT_DIR, 'xdata');
const CACHE_FILE = path.join(XDATA_DIR, '.cache_rajasthangyan_scraped.json');
const MERGED_26K_FILE = path.join(XDATA_DIR, 'rajasthan_pyq_merged_26151.json');
const SELECTED_15K_FILE = path.join(XDATA_DIR, 'rajasthan_selected_topics_question_15000.json');

const TOPICS_DIR = path.join(XDATA_DIR, 'topics');
const RG_DIR = path.join(TOPICS_DIR, 'rajasthan_gyan');
const BOOK_DIR = path.join(TOPICS_DIR, 'book');

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid Windows chars
    .replace(/\s+/g, '_')          // Collapse whitespace to underscore
    .replace(/_+/g, '_')          // Collapse duplicate underscores
    .replace(/^_+|_+$/g, '')      // Trim leading/trailing underscores
    .slice(0, 100);               // Prevent path too long
}

function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAlphanumeric(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\u0900-\u097Fa-z0-9]/g, '')
    .trim();
}

function tokenizeText(text) {
  if (!text) return new Set();
  const words = text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^\u0900-\u097Fa-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
  return new Set(words);
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

async function main() {
  console.log('=== Step 1: Loading Datasets ===');
  if (!fs.existsSync(CACHE_FILE)) {
    throw new Error(`Scrape cache file not found at: ${CACHE_FILE}`);
  }
  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  console.log(`Loaded scraped cache with ${Object.keys(cache).length} topics.`);

  const data15k = JSON.parse(fs.readFileSync(SELECTED_15K_FILE, 'utf8'));
  console.log(`Loaded 15k/17k dataset with ${data15k.length} questions.`);

  const data26k = JSON.parse(fs.readFileSync(MERGED_26K_FILE, 'utf8'));
  console.log(`Loaded merged dataset with ${data26k.length} questions.`);

  console.log('\n=== Step 2: Indexing Scraped Rajasthan Gyan Data ===');
  const scrapedByTopic = new Map();
  const allScrapedExactQ = new Map();
  const allScrapedList = [];

  let totalScrapedQ = 0;
  let totalScrapedWithExam = 0;

  for (const tid of Object.keys(cache)) {
    const topicData = cache[tid];
    const normTopicName = cleanAlphanumeric(topicData.name);
    if (!scrapedByTopic.has(normTopicName)) scrapedByTopic.set(normTopicName, []);

    topicData.questions.forEach((sq) => {
      totalScrapedQ++;
      if (!sq.exam || sq.exam.trim() === '') return;

      totalScrapedWithExam++;
      const item = {
        qOriginal: sq.question,
        qClean: cleanAlphanumeric(sq.question),
        qTokens: tokenizeText(sq.question),
        ansClean: cleanAlphanumeric(sq.answer),
        exam: sq.exam.trim()
      };

      scrapedByTopic.get(normTopicName).push(item);

      if (!allScrapedExactQ.has(item.qClean)) {
        allScrapedExactQ.set(item.qClean, item);
      }
      allScrapedList.push(item);
    });
  }
  console.log(`Indexed ${totalScrapedQ} scraped questions (${totalScrapedWithExam} with exam badges).`);

  console.log('\n=== Step 3: Reconciling & Enriching Missing Exam Fields ===');
  let alreadyHadExam = 0;
  let newlyFilledFromExact = 0;
  let newlyFilledFromTopicFuzzy = 0;
  let stillEmpty15k = 0;

  for (let i = 0; i < data15k.length; i++) {
    const q = data15k[i];

    if (q.exam && q.exam.trim() !== '') {
      alreadyHadExam++;
      continue;
    }

    const qClean = cleanAlphanumeric(q.question);
    const qAnsClean = cleanAlphanumeric(q.answer);
    const normTopic = cleanAlphanumeric(q.topic);

    // Strategy A: Exact cleaned question match across whole website
    if (allScrapedExactQ.has(qClean)) {
      const match = allScrapedExactQ.get(qClean);
      q.exam = match.exam;
      newlyFilledFromExact++;
      continue;
    }

    // Strategy B: Same topic candidate with verified answer and high token similarity
    const topicCandidates = scrapedByTopic.get(normTopic) || [];
    const qTokens = tokenizeText(q.question);
    let best = null;
    let bestScore = 0;

    for (const cand of topicCandidates) {
      if (qAnsClean && cand.ansClean && qAnsClean === cand.ansClean) {
        const score = jaccardSimilarity(qTokens, cand.qTokens);
        if (score >= 0.75 && score > bestScore) {
          bestScore = score;
          best = cand;
        }
      }
    }

    if (best) {
      q.exam = best.exam;
      newlyFilledFromTopicFuzzy++;
      continue;
    }

    stillEmpty15k++;
  }

  console.log(`15k Reconciliation Results:`);
  console.log(`- Already had exam: ${alreadyHadExam}`);
  console.log(`- Newly filled via exact match: ${newlyFilledFromExact}`);
  console.log(`- Newly filled via verified topic similarity: ${newlyFilledFromTopicFuzzy}`);
  console.log(`- Total newly recovered: ${newlyFilledFromExact + newlyFilledFromTopicFuzzy}`);
  console.log(`- General practice questions (no exam on Rajasthan Gyan): ${stillEmpty15k}`);

  // Apply updates to first 17,143 questions in 26k dataset
  for (let i = 0; i < data15k.length; i++) {
    data26k[i].exam = data15k[i].exam;
  }

  // Check the book portion (17,144 to 26,151) and recover any matching exams
  let bookFilledExam = 0;
  let bookRecovered = 0;
  let bookEmptyExam = 0;

  for (let i = data15k.length; i < data26k.length; i++) {
    const q = data26k[i];
    if (q.exam && q.exam.trim() !== '') {
      q.exam = q.exam.trim();
      bookFilledExam++;
      continue;
    }

    // Attempt recovery from Rajasthan Gyan cache
    const qClean = cleanAlphanumeric(q.question);
    const qAnsClean = cleanAlphanumeric(q.answer);

    if (allScrapedExactQ.has(qClean)) {
      const match = allScrapedExactQ.get(qClean);
      q.exam = match.exam;
      bookRecovered++;
      bookFilledExam++;
      continue;
    }

    const qTokens = tokenizeText(q.question);
    let best = null;
    let bestScore = 0;
    for (const sq of allScrapedList) {
      if (qAnsClean && sq.ansClean && qAnsClean === sq.ansClean) {
        const score = jaccardSimilarity(qTokens, sq.qTokens);
        if (score >= 0.8 && score > bestScore) {
          bestScore = score;
          best = sq;
        }
      }
    }

    if (best) {
      q.exam = best.exam;
      bookRecovered++;
      bookFilledExam++;
      continue;
    }

    bookEmptyExam++;
  }

  console.log(`Book Portion (9,008 questions):`);
  console.log(`- Initially filled exam: ${bookFilledExam - bookRecovered}`);
  console.log(`- Newly recovered from Rajasthan Gyan: ${bookRecovered}`);
  console.log(`- Total filled exam: ${bookFilledExam}`);
  console.log(`- Remaining without exam: ${bookEmptyExam}`);

  console.log('\n=== Step 4: Saving Updated Master Files ===');
  fs.writeFileSync(SELECTED_15K_FILE, JSON.stringify(data15k, null, 2), 'utf8');
  console.log(`Updated ${SELECTED_15K_FILE}`);

  fs.writeFileSync(MERGED_26K_FILE, JSON.stringify(data26k, null, 2), 'utf8');
  console.log(`Updated ${MERGED_26K_FILE}`);

  console.log('\n=== Step 5: Separating Questions Into Topic JSON Files ===');
  fs.mkdirSync(RG_DIR, { recursive: true });
  fs.mkdirSync(BOOK_DIR, { recursive: true });

  // Group 1: Rajasthan Gyan questions by topic (first 17,143)
  const rgGroups = new Map();
  for (let i = 0; i < data15k.length; i++) {
    const q = data15k[i];
    const t = q.topic ? q.topic.trim() : 'Unknown';
    if (!rgGroups.has(t)) rgGroups.set(t, []);
    rgGroups.get(t).push(q);
  }

  // Group 2: Book questions by topic (remaining 9,008)
  const bookGroups = new Map();
  for (let i = data15k.length; i < data26k.length; i++) {
    const q = data26k[i];
    const t = q.topic ? q.topic.trim() : 'Unknown';
    if (!bookGroups.has(t)) bookGroups.set(t, []);
    bookGroups.get(t).push(q);
  }

  const indexCatalog = {
    generatedAt: new Date().toISOString(),
    totalQuestions: data26k.length,
    sources: {
      rajasthan_gyan: {
        totalTopics: rgGroups.size,
        totalQuestions: data15k.length,
        directory: 'topics/rajasthan_gyan'
      },
      book: {
        totalTopics: bookGroups.size,
        totalQuestions: data26k.length - data15k.length,
        directory: 'topics/book'
      }
    },
    topics: []
  };

  // Write Rajasthan Gyan topic files
  let rgIndex = 1;
  for (const [topicName, qList] of rgGroups.entries()) {
    const paddedIdx = String(rgIndex).padStart(2, '0');
    const safeName = sanitizeFilename(topicName);
    const filename = `${paddedIdx}_${safeName}.json`;
    const relPath = `topics/rajasthan_gyan/${filename}`;
    const fullPath = path.join(RG_DIR, filename);

    fs.writeFileSync(fullPath, JSON.stringify(qList, null, 2), 'utf8');

    const withExam = qList.filter(q => q.exam && q.exam.trim() !== '').length;
    indexCatalog.topics.push({
      id: rgIndex,
      topic: topicName,
      source: 'rajasthan_gyan',
      file: relPath,
      questionCount: qList.length,
      examCount: withExam,
      examCoveragePercent: Number(((withExam / qList.length) * 100).toFixed(1))
    });

    rgIndex++;
  }
  console.log(`Created ${rgGroups.size} topic JSON files in ${RG_DIR}`);

  // Write Book topic files
  let bookIndex = 1;
  for (const [topicName, qList] of bookGroups.entries()) {
    const paddedIdx = String(bookIndex).padStart(2, '0');
    const safeName = sanitizeFilename(topicName);
    const filename = `book_${paddedIdx}_${safeName}.json`;
    const relPath = `topics/book/${filename}`;
    const fullPath = path.join(BOOK_DIR, filename);

    fs.writeFileSync(fullPath, JSON.stringify(qList, null, 2), 'utf8');

    const withExam = qList.filter(q => q.exam && q.exam.trim() !== '').length;
    indexCatalog.topics.push({
      id: rgIndex + bookIndex - 1,
      topic: topicName,
      source: 'book',
      file: relPath,
      questionCount: qList.length,
      examCount: withExam,
      examCoveragePercent: Number(((withExam / qList.length) * 100).toFixed(1))
    });

    bookIndex++;
  }
  console.log(`Created ${bookGroups.size} topic JSON files in ${BOOK_DIR}`);

  // Write master index catalog
  const INDEX_FILE = path.join(TOPICS_DIR, 'index.json');
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexCatalog, null, 2), 'utf8');
  console.log(`Created master index catalog at ${INDEX_FILE}`);

  console.log('\n=== All operations completed successfully! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
