const fs = require('fs');
const path = require('path');

const qDir = 'data/questions/rajasthan-gk';
const vDir = 'data/questions/variants';
const mappingFile = 'data/sets/topic-id-mapping.json';
const pubFile = 'data/sets/published-sets.json';

const mapping = JSON.parse(fs.readFileSync(mappingFile, 'utf8'));
const published = JSON.parse(fs.readFileSync(pubFile, 'utf8'));

// Topic Convex ID -> published sets
const pubByConvexId = {};
published.forEach(s => {
  const cid = s.topicId;
  if (!pubByConvexId[cid]) pubByConvexId[cid] = [];
  pubByConvexId[cid].push(s);
});

// All published question IDs
const allPubQids = new Set();
published.forEach(s => {
  (s.questionIds || []).forEach(id => allPubQids.add(id));
});

let grandRawTotal = 0;
let grandTotalVariants = 0;
let grandCleanUniqueTotal = 0;

let grandPubRawTotal = 0;
let grandPubVariants = 0;
let grandPubCleanUnique = 0;

let grandUnusedRawTotal = 0;
let grandUnusedVariants = 0;
let grandUnusedCleanUnique = 0;

let totalClean20Sets = 0;
let totalCleanRemainder = 0;

const topicReports = [];

for (let i = 1; i <= 55; i++) {
  const tStr = String(i).padStart(2, '0');
  const qFile = path.join(qDir, 'topic_' + tStr + '.json');
  const cFile = path.join(vDir, 'topic_' + tStr + '_clusters.json');
  const convexTid = mapping[String(i)];

  let rawQs = [];
  let topicTitle = '';
  if (fs.existsSync(qFile)) {
    const raw = JSON.parse(fs.readFileSync(qFile, 'utf8'));
    if (Array.isArray(raw)) {
      rawQs = raw;
    } else {
      rawQs = raw.questions || [];
      topicTitle = raw.topicName || raw.topic || '';
    }
  }

  let clusters = [];
  if (fs.existsSync(cFile)) {
    try {
      clusters = JSON.parse(fs.readFileSync(cFile, 'utf8'));
      if (!Array.isArray(clusters)) clusters = [];
    } catch {}
  }

  // Set of all variant question IDs in this topic (NOT anchors)
  const variantQids = new Set();
  const anchorQids = new Set();
  for (const c of clusters) {
    if (!c || typeof c !== 'object') continue;
    if (c.anchor_id) anchorQids.add(c.anchor_id);
    if (Array.isArray(c.variants)) {
      for (const v of c.variants) {
        if (v && typeof v === 'object' && !v.is_anchor && v.id) {
          variantQids.add(v.id);
        }
      }
    }
  }

  // Published sets for this topic
  const tPubSets = pubByConvexId[convexTid] || [];
  const tPubQids = new Set();
  tPubSets.forEach(s => {
    (s.questionIds || []).forEach(id => tPubQids.add(id));
  });

  const rawCount = rawQs.length;
  let topicPubRaw = 0;
  let topicPubVar = 0;
  let topicPubClean = 0;

  let topicUnusedRaw = 0;
  let topicUnusedVar = 0;
  let topicUnusedClean = 0;

  for (const q of rawQs) {
    const isPub = tPubQids.has(q.id);
    const isVar = variantQids.has(q.id);

    if (isPub) {
      topicPubRaw++;
      if (isVar) topicPubVar++;
      else topicPubClean++;
    } else {
      topicUnusedRaw++;
      if (isVar) topicUnusedVar++;
      else topicUnusedClean++;
    }
  }

  const topicTotalVariants = topicPubVar + topicUnusedVar;
  const topicCleanUnique = rawCount - topicTotalVariants;

  // Clean 20-Q sets possible from clean published questions
  const cleanPubSets = Math.floor(topicPubClean / 20);
  const cleanPubRemainder = topicPubClean % 20;

  // Total clean 20-Q sets possible from all clean unique questions (published + unused)
  const totalTopic20Sets = Math.floor(topicCleanUnique / 20);

  grandRawTotal += rawCount;
  grandTotalVariants += topicTotalVariants;
  grandCleanUniqueTotal += topicCleanUnique;

  grandPubRawTotal += topicPubRaw;
  grandPubVariants += topicPubVar;
  grandPubCleanUnique += topicPubClean;

  grandUnusedRawTotal += topicUnusedRaw;
  grandUnusedVariants += topicUnusedVar;
  grandUnusedCleanUnique += topicUnusedClean;

  totalClean20Sets += cleanPubSets;
  totalCleanRemainder += cleanPubRemainder;

  topicReports.push({
    topicNum: i,
    title: topicTitle || `Topic ${i}`,
    raw: rawCount,
    clusters: clusters.length,
    variants: topicTotalVariants,
    cleanUnique: topicCleanUnique,
    currentSets: tPubSets.length,
    cleanPubQuestions: topicPubClean,
    cleanPubSets: cleanPubSets,
    cleanPubRemainder: cleanPubRemainder,
    unusedRaw: topicUnusedRaw,
    unusedVariants: topicUnusedVar,
    unusedClean: topicUnusedClean
  });
}

console.log('================================================================');
console.log('          AUTHORITATIVE DEDUPLICATION & POOL AUDIT REPORT       ');
console.log('================================================================');

console.log('\n1. OVERALL MASTER POOL (कुल प्रश्न कितने कम हुए?):');
console.log(`   - पहले कुल Raw Questions:           ${grandRawTotal.toLocaleString()}`);
console.log(`   - हटाए गए कुल Duplicate / Variants:  ${grandTotalVariants.toLocaleString()}`);
console.log(`   - अब शुद्ध Clean Unique Questions:  ${grandCleanUniqueTotal.toLocaleString()}`);
console.log(`   - कुल कमी (Overall Reduction):       ${grandTotalVariants.toLocaleString()} प्रश्न कम हुए (-${((grandTotalVariants / grandRawTotal) * 100).toFixed(1)}%)`);

console.log('\n2. UNUSED POOL AUDIT (Unused प्रश्न कितने कम हुए?):');
console.log(`   - पहले Unused Questions (In Pool):   ${grandUnusedRawTotal.toLocaleString()}`);
console.log(`   - Unused में से हटाए गए Variants:   ${grandUnusedVariants.toLocaleString()}`);
console.log(`   - अब शुद्ध Clean Unused Questions:   ${grandUnusedCleanUnique.toLocaleString()}`);
console.log(`   - Unused में कमी:                   ${grandUnusedVariants.toLocaleString()} प्रश्न कम हुए (-${((grandUnusedVariants / grandUnusedRawTotal) * 100).toFixed(1)}%)`);

console.log('\n3. PUBLISHED SETS AUDIT (Published Sets में क्या स्थिति है?):');
console.log(`   - वर्तमान Published Questions:       ${grandPubRawTotal.toLocaleString()} (across ${published.length} sets)`);
console.log(`   - Published में मिले Variants:       ${grandPubVariants.toLocaleString()}`);
console.log(`   - Published में शुद्ध Unique प्रश्न: ${grandPubCleanUnique.toLocaleString()}`);
console.log(`   - अगर बिना Unused मिलाए केवल शुद्ध 20Q सेट्स रखें:`);
console.log(`     * कुल पूर्ण 20-Q Sets:             ${totalClean20Sets} Sets`);
console.log(`     * कुल Remainder प्रश्न:            ${totalCleanRemainder} प्रश्न`);

console.log('\n4. SUBJECT-WISE BREAKDOWN:');
const subjects = [
  { name: 'A. राजस्थान भूगोल एवं सामान्य ज्ञान (Topics 1-15)', range: [1, 15] },
  { name: 'B. राजस्थान का इतिहास (Topics 16-25)', range: [16, 25] },
  { name: 'C. राजस्थान कला एवं संस्कृति (Topics 26-40)', range: [26, 40] },
  { name: 'D. राजस्थान राजव्यवस्था एवं प्रशासन (Topics 41-55)', range: [41, 55] },
];

subjects.forEach(sub => {
  const subTopics = topicReports.filter(t => t.topicNum >= sub.range[0] && t.topicNum <= sub.range[1]);
  const raw = subTopics.reduce((s, t) => s + t.raw, 0);
  const vars = subTopics.reduce((s, t) => s + t.variants, 0);
  const clean = subTopics.reduce((s, t) => s + t.cleanUnique, 0);
  const curSets = subTopics.reduce((s, t) => s + t.currentSets, 0);
  const cleanSets = subTopics.reduce((s, t) => s + t.cleanPubSets, 0);
  const unClean = subTopics.reduce((s, t) => s + t.unusedClean, 0);

  console.log(`\n${sub.name}:`);
  console.log(`   Raw: ${raw.toLocaleString()} | Variants: ${vars.toLocaleString()} | Clean Unique: ${clean.toLocaleString()}`);
  console.log(`   Published Sets: ${curSets} → शुद्ध Unique 20Q Sets: ${cleanSets}`);
  console.log(`   शुद्ध Unused प्रश्न उपलब्ध: ${unClean.toLocaleString()}`);
});

// Save detailed JSON report
fs.writeFileSync('data/questions/variants/master_dedup_report.json', JSON.stringify({
  summary: {
    grandRawTotal,
    grandTotalVariants,
    grandCleanUniqueTotal,
    grandUnusedRawTotal,
    grandUnusedVariants,
    grandUnusedCleanUnique,
    grandPubRawTotal,
    grandPubVariants,
    grandPubCleanUnique,
    totalClean20Sets,
    totalCleanRemainder
  },
  topics: topicReports
}, null, 2), 'utf8');

console.log('\n[OK] Detailed report saved to data/questions/variants/master_dedup_report.json');

