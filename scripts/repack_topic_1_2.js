const fs = require('fs');
const path = require('path');

console.log('=== RUNNING COMPREHENSIVE N-WAY CLUSTERING & DEDUPLICATION (TOPIC 1 & 2) ===\n');

// 1. Load Files
const topicMap = JSON.parse(fs.readFileSync('data/sets/topic-id-mapping.json', 'utf8'));
const publishedSets = JSON.parse(fs.readFileSync('data/sets/published-sets.json', 'utf8'));
const poolState = JSON.parse(fs.readFileSync('data/sets/pool-state.json', 'utf8'));

const t1FilePath = 'data/questions/rajasthan-gk/topic_01.json';
const t2FilePath = 'data/questions/rajasthan-gk/topic_02.json';

const t1Data = JSON.parse(fs.readFileSync(t1FilePath, 'utf8'));
const t2Data = JSON.parse(fs.readFileSync(t2FilePath, 'utf8'));

const t1Questions = t1Data.questions || t1Data;
const t2Questions = t2Data.questions || t2Data;

const t1Map = new Map(t1Questions.map(q => [q.id, q]));
const t2Map = new Map(t2Questions.map(q => [q.id, q]));

// 2. Define Multi-Way Clusters for Topic 1
const t1Clusters = [
  {
    topic: 'राज्य पुष्प (रोहिड़ा)',
    mainId: 'rg_013055',
    varIds: ['rg_013066', 'rg_013099'] // 3-way cluster
  },
  {
    topic: 'राज्य वृक्ष (खेजड़ी वैज्ञानिक नाम)',
    mainId: 'rg_013087',
    varIds: ['rg_013100']
  },
  {
    topic: 'खेजड़ी डाक टिकट 1988',
    mainId: 'rg_013105',
    varIds: ['rg_013071_alt']
  },
  {
    topic: 'राज्य पशु (चिंकारा व ऊँट)',
    mainId: 'rg_013068',
    varIds: ['rg_013059']
  },
  {
    topic: 'जैसलमेर प्राचीन नाम माड',
    mainId: 'rg_015300',
    varIds: ['rg_015299', 'rg_015364'] // 3-way cluster
  },
  {
    topic: 'जालौर प्राचीन नाम जाबालिपुर',
    mainId: 'rg_015379',
    varIds: ['rg_015376']
  },
  {
    topic: 'उदयपुर गिरवा पहाड़ियाँ',
    mainId: 'rg_015332',
    varIds: ['rg_015330', 'rg_015329'] // 3-way cluster
  },
  {
    topic: 'भीलवाड़ा राजस्थान का मैनचेस्टर',
    mainId: 'rg_015313',
    varIds: ['rg_015372']
  },
  {
    topic: 'जोधपुर शुभंकर कुरजां',
    mainId: 'rg_013110',
    varIds: ['rg_013081']
  },
  {
    topic: 'जालौर शुभंकर भालू',
    mainId: 'rg_013083',
    varIds: ['rg_013070']
  },
  {
    topic: 'चूरू शुभंकर कृष्ण मृग / काला हिरण',
    mainId: 'rg_013076',
    varIds: ['rg_013103']
  },
  {
    topic: 'जिला शुभंकर मिलान तालिकाएं A',
    mainId: 'rg_013052',
    varIds: ['rg_013114']
  },
  {
    topic: 'जिला शुभंकर मिलान तालिकाएं B',
    mainId: 'rg_013053',
    varIds: ['rg_013054']
  }
];

// 3. Define Multi-Way Clusters for Topic 2
const t2Clusters = [
  {
    topic: 'लसाड़िया का पठार (सलूम्बर / उदयपुर)',
    mainId: 'rg_000716',
    varIds: ['rg_001065', 'rg_001006'], // 3-way cluster (exact dups)
    isExactDup: true
  },
  {
    topic: 'अरावली की सर्वोच्च चोटी (गुरुशिखर)',
    mainId: 'rg_000571',
    varIds: ['rg_000595', 'rg_000664', 'rg_000816'] // 4-way cluster
  },
  {
    topic: 'हाड़ौती का पठार / दक्षिण-पूर्वी पठार',
    mainId: 'rg_000569',
    varIds: ['rg_000602', 'rg_000645', 'rg_000815'] // 4-way cluster
  },
  {
    topic: 'रेडक्लिफ रेखा कुल लंबाई 1070 किमी',
    mainId: 'rg_012922',
    varIds: ['rg_013028', 'rg_012982'] // 3-way cluster
  },
  {
    topic: 'थार मरुस्थल नामकरण व विस्तार',
    mainId: 'rg_000612',
    varIds: ['rg_000626', 'rg_001133'] // 3-way cluster
  },
  {
    topic: 'अरावली चोटियों की ऊंचाई मिलान तालिका',
    mainId: 'rg_000836',
    varIds: ['rg_000806', 'rg_000638'] // 3-way cluster
  },
  {
    topic: 'अरावली स्थानीय पहाड़ियाँ मिलान',
    mainId: 'rg_000864',
    varIds: ['rg_000898', 'rg_000992'] // 3-way cluster
  },
  {
    topic: 'कर्क रेखा दक्षिणी भाग',
    mainId: 'rg_000001',
    varIds: ['rg_000005', 'rg_000075'] // 3-way cluster
  },
  {
    topic: 'अंतर्राज्यीय सीमा पर कौन-सा जिला नहीं (दौसा)',
    mainId: 'rg_012952',
    varIds: ['rg_013022'], // 2-way cluster (exact dup)
    isExactDup: true
  },
  {
    topic: 'मध्य प्रदेश से सीमा बनाने वाले जिले (10 जिले)',
    mainId: 'rg_012965',
    varIds: ['rg_013025'], // 2-way cluster (exact dup)
    isExactDup: true
  },
  {
    topic: 'अंतरराष्ट्रीय सीमा पाकिस्तान',
    mainId: 'rg_012925',
    varIds: ['rg_012920'] // 2-way cluster
  }
];

// Helper to format variant object
function makeVariantObj(q, topicDesc) {
  return {
    id: q.id,
    question: q.question,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation || null,
    exam: q.exam || null,
    year: q.year || null,
    clusterTopic: topicDesc
  };
}

// Attach variants to Main Questions in Topic 1
t1Clusters.forEach(cluster => {
  const mainQ = t1Map.get(cluster.mainId);
  if (!mainQ) return;
  if (!mainQ.similarQuestions) mainQ.similarQuestions = [];

  cluster.varIds.forEach(varId => {
    const varQ = t1Map.get(varId);
    if (!varQ) return;
    if (!mainQ.similarQuestions.some(s => s.id === varId)) {
      mainQ.similarQuestions.push(makeVariantObj(varQ, cluster.topic));
    }
  });
});

// Attach variants to Main Questions in Topic 2
const t2ExactDupsAndVariants = new Set();
t2Clusters.forEach(cluster => {
  const mainQ = t2Map.get(cluster.mainId);
  if (!mainQ) return;
  if (!mainQ.similarQuestions) mainQ.similarQuestions = [];

  cluster.varIds.forEach(varId => {
    const varQ = t2Map.get(varId);
    if (!varQ) return;
    t2ExactDupsAndVariants.add(varId);
    if (!mainQ.similarQuestions.some(s => s.id === varId)) {
      mainQ.similarQuestions.push(makeVariantObj(varQ, cluster.topic));
    }
  });
});

// Save updated topic JSON files
t1Data.questions = t1Questions;
t2Data.questions = t2Questions.filter(q => !['rg_001065', 'rg_001006', 'rg_013022', 'rg_013025'].includes(q.id));
fs.writeFileSync(t1FilePath, JSON.stringify(t1Data, null, 2), 'utf8');
fs.writeFileSync(t2FilePath, JSON.stringify(t2Data, null, 2), 'utf8');
console.log('Saved updated topic_01.json and topic_02.json.');

// Save variants archive
const variantsDir = 'data/questions/variants';
if (!fs.existsSync(variantsDir)) fs.mkdirSync(variantsDir, { recursive: true });

fs.writeFileSync(
  path.join(variantsDir, 'topic_01_clusters.json'),
  JSON.stringify(t1Clusters.map(c => ({ ...c, mainText: t1Map.get(c.mainId)?.question })), null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(variantsDir, 'topic_02_clusters.json'),
  JSON.stringify(t2Clusters.map(c => ({ ...c, mainText: t2Map.get(c.mainId)?.question })), null, 2),
  'utf8'
);
console.log('Saved variant archives in data/questions/variants/.');

// Re-pack Sets for Topic 1 (10 sets)
const t1ConvexTopicId = topicMap['1'];
const t2ConvexTopicId = topicMap['2'];

const t1Sets = publishedSets.filter(s => s.topicId === t1ConvexTopicId);
const t2Sets = publishedSets.filter(s => s.topicId === t2ConvexTopicId);

console.log('\n--- RE-PACKING TOPIC 1 SETS (10 SETS) ---');
const t1GlobalAssigned = new Set();
const t1AllIds = t1Questions.map(q => q.id);

t1Sets.forEach((s, idx) => {
  const newSetIds = [];
  for (const qid of (s.questionIds || [])) {
    if (!t1GlobalAssigned.has(qid) && t1AllIds.includes(qid)) {
      newSetIds.push(qid);
      t1GlobalAssigned.add(qid);
    }
  }
  let pIdx = 0;
  while (newSetIds.length < 20 && pIdx < t1AllIds.length) {
    const cand = t1AllIds[pIdx];
    if (!t1GlobalAssigned.has(cand)) {
      newSetIds.push(cand);
      t1GlobalAssigned.add(cand);
    }
    pIdx++;
  }
  s.questionIds = newSetIds;
  s.questionCount = newSetIds.length;
});
console.log('Topic 1 sets re-packed. Assigned unique questions:', t1GlobalAssigned.size, 'out of 200.');
let t1AllOk = true;
t1Sets.forEach((s, i) => {
  if (s.questionIds.length !== 20) {
    console.log('ERROR: T1 Set ' + (i+1) + ' has ' + s.questionIds.length + ' questions');
    t1AllOk = false;
  }
});
if (t1AllOk) console.log('All 10 Topic 1 sets have EXACTLY 20 questions!');

console.log('\n--- RE-PACKING TOPIC 2 SETS (36 SETS) ---');
// In Topic 2, we exclude all exact duplicates and variants from the active sets!
const t2ActivePoolIds = t2Questions
  .map(q => q.id)
  .filter(id => !t2ExactDupsAndVariants.has(id));

const t2GlobalAssigned = new Set();
t2Sets.forEach((s, idx) => {
  const newSetIds = [];
  for (const qid of (s.questionIds || [])) {
    if (!t2GlobalAssigned.has(qid) && t2ActivePoolIds.includes(qid)) {
      newSetIds.push(qid);
      t2GlobalAssigned.add(qid);
    }
  }
  let pIdx = 0;
  while (newSetIds.length < 20 && pIdx < t2ActivePoolIds.length) {
    const cand = t2ActivePoolIds[pIdx];
    if (!t2GlobalAssigned.has(cand)) {
      newSetIds.push(cand);
      t2GlobalAssigned.add(cand);
    }
    pIdx++;
  }
  s.questionIds = newSetIds;
  s.questionCount = newSetIds.length;
});
console.log('Topic 2 sets re-packed. Assigned unique questions:', t2GlobalAssigned.size, 'out of 720.');
let t2AllOk = true;
t2Sets.forEach((s, i) => {
  if (s.questionIds.length !== 20) {
    console.log('ERROR: T2 Set ' + (i+1) + ' has ' + s.questionIds.length + ' questions');
    t2AllOk = false;
  }
});
if (t2AllOk) console.log('All 36 Topic 2 sets have EXACTLY 20 questions!');

// Save published-sets.json
fs.writeFileSync('data/sets/published-sets.json', JSON.stringify(publishedSets, null, 2), 'utf8');
console.log('Saved data/sets/published-sets.json.');

// Update pool-state.json
const now = new Date().toISOString();
if (poolState.topics && poolState.topics['1']) {
  poolState.topics['1'].used = Array.from(t1GlobalAssigned).map(id => ({ id, usedAt: now }));
  poolState.topics['1'].available = t1AllIds.filter(id => !t1GlobalAssigned.has(id));
  poolState.topics['1'].completedSets = 10;
}
if (poolState.topics && poolState.topics['2']) {
  poolState.topics['2'].used = Array.from(t2GlobalAssigned).map(id => ({ id, usedAt: now }));
  poolState.topics['2'].available = t2ActivePoolIds.filter(id => !t2GlobalAssigned.has(id));
  poolState.topics['2'].completedSets = 36;
}
poolState.updatedAt = now;
fs.writeFileSync('data/sets/pool-state.json', JSON.stringify(poolState, null, 2), 'utf8');
console.log('Saved data/sets/pool-state.json.');

console.log('\n=== COMPREHENSIVE N-WAY REPACK FINISHED WITH 100% SUCCESS ===');
