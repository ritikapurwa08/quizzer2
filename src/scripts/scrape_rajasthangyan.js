const fs = require('fs');
const path = require('path');

const WEB_TOPICS_PATH = path.join(__dirname, '../../C:/Users/ritik/.gemini/antigravity-ide/brain/da6f6fac-d7f0-4988-8679-c5aed7114738/scratch/web_topics.json');
const CACHE_FILE = path.join(__dirname, '../xdata/.cache_rajasthangyan_scraped.json');

// Ensure directory exists
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

async function fetchWithRetry(url, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs * attempt));
    }
  }
}

function parseQuestionsFromHtml(html) {
  const qContainers = html.split('<div class="question-container">').slice(1);
  const questions = [];

  for (const cont of qContainers) {
    // Extract <dt> ... </dt>
    const dtMatch = cont.match(/<dt>([\s\S]*?)<\/dt>/i);
    if (!dtMatch) continue;
    const dtContent = dtMatch[1];

    // Extract Exam badge: <span style="...color:#86a1ae;...">EXAM</span>
    let exam = '';
    const examMatch = dtContent.match(/color:#86a1ae;[^"]*">([^<]+)<\/span>/i);
    if (examMatch) {
      exam = examMatch[1].trim();
    }

    // Extract Question text: inside <strong>प्रश्न \d+ ... </strong>
    const qMatch = dtContent.match(/<strong>\s*प्रश्न\s*\d+\s*([\s\S]*?)<\/strong>/i);
    let question = '';
    if (qMatch) {
      question = qMatch[1]
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      // Fallback
      question = dtContent
        .replace(/<span[\s\S]*?<\/span>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/प्रश्न\s*\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract Options: <li>...</li>
    const options = [];
    const liRegex = /<li>([\s\S]*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(cont)) !== null) {
      options.push(liMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    // Extract Answer & Explanation: inside class="rg-c-content"
    let answer = '';
    let explanation = '';
    const ansBlockMatch = cont.match(/<div class=["']rg-c-content["']\s*>([\s\S]*?)<\/div>/i);
    if (ansBlockMatch) {
      const block = ansBlockMatch[1];
      const ansMatch = block.match(/<strong>\s*उत्तर\s*:\s*([\s\S]*?)<\/strong>/i);
      if (ansMatch) {
        answer = ansMatch[1].replace(/<[^>]+>/g, '').trim();
      }
      const expMatch = block.match(/<strong>\s*व्याख्या\s*:\s*<\/strong>([\s\S]*)/i);
      if (expMatch) {
        explanation = expMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
    }

    questions.push({
      question,
      options,
      answer,
      exam,
      explanation
    });
  }

  return questions;
}

async function scrapeTopic(tid, name) {
  const firstUrl = `https://www.rajasthangyan.com/question?tid=${tid}&start=0&sort=n`;
  const firstHtml = await fetchWithRetry(firstUrl);
  
  const pageMatch = firstHtml.match(/page no\.\((\d+)\/(\d+)\)/i);
  const totalPages = pageMatch ? parseInt(pageMatch[2], 10) : 1;

  let allQuestions = parseQuestionsFromHtml(firstHtml);

  // Remaining pages
  for (let page = 2; page <= totalPages; page++) {
    const start = (page - 1) * 10;
    const pageUrl = `https://www.rajasthangyan.com/question?tid=${tid}&start=${start}&sort=n`;
    try {
      const pageHtml = await fetchWithRetry(pageUrl);
      const pageQuestions = parseQuestionsFromHtml(pageHtml);
      allQuestions = allQuestions.concat(pageQuestions);
    } catch (e) {
      console.error(`Error fetching tid ${tid} page ${page}:`, e.message);
    }
  }

  return allQuestions;
}

// Concurrency pool
async function asyncPool(limit, items, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (limit <= items.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

async function main() {
  console.log('Reading web topics list...');
  const webTopics = JSON.parse(fs.readFileSync('C:/Users/ritik/.gemini/antigravity-ide/brain/da6f6fac-d7f0-4988-8679-c5aed7114738/scratch/web_topics.json', 'utf8'));
  console.log(`Found ${webTopics.length} topics on RajasthanGyan.`);

  // Load cache if exists
  let cache = {};
  if (fs.existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      console.log(`Loaded existing cache with ${Object.keys(cache).length} topics.`);
    } catch (e) {
      console.log('Could not read existing cache, starting fresh.');
    }
  }

  // Determine topics to scrape
  const toScrape = webTopics.filter(t => !cache[t.tid]);
  console.log(`Topics to scrape: ${toScrape.length} (already cached: ${webTopics.length - toScrape.length})`);

  let completed = 0;
  await asyncPool(5, toScrape, async (t) => {
    try {
      const qList = await scrapeTopic(t.tid, t.name);
      cache[t.tid] = {
        tid: t.tid,
        name: t.name,
        questions: qList
      };
      completed++;
      if (completed % 5 === 0 || completed === toScrape.length) {
        console.log(`Scraped ${completed}/${toScrape.length} topics. Total questions in cache so far: ${Object.values(cache).reduce((acc, c) => acc + c.questions.length, 0)}`);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
      }
    } catch (err) {
      console.error(`Failed to scrape topic tid ${t.tid} (${t.name}):`, err.message);
    }
  });

  // Final cache save
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
  const totalCachedQ = Object.values(cache).reduce((acc, c) => acc + c.questions.length, 0);
  console.log(`Scraping complete! Total topics cached: ${Object.keys(cache).length}, Total questions: ${totalCachedQ}`);
}

main().catch(err => {
  console.error('Fatal error in scraper:', err);
  process.exit(1);
});
