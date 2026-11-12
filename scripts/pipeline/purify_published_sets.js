const fs = require('fs');
const path = require('path');

const qDir = 'data/questions/rajasthan-gk';
const vDir = 'data/questions/variants';
const pubPath = 'data/sets/published-sets.json';
const mapping = JSON.parse(fs.readFileSync('data/sets/topic-id-mapping.json', 'utf8'));
const published = JSON.parse(fs.readFileSync(pubPath, 'utf8'));

// 1. Gather all variant question IDs across all 55 topics
const allVariantQids = new Set();
for (let i = 1; i <= 55; i++) {
  const tStr = String(i).padStart(2, '0');
  const cFile = path.join(vDir, `topic_${tStr}_clusters.json`);
  if (fs.existsSync(cFile)) {
    try {
      const clusters = JSON.parse(fs.readFileSync(cFile, 'utf8'));
      if (Array.isArray(clusters)) {
        clusters.forEach(c => {
          if (Array.isArray(c.variants)) {
            c.variants.forEach(v => {
              if (v && !v.is_anchor && v.id) {
                allVariantQids.add(v.id);
              }
            });
          }
        });
      }
    } catch {}
  }
}
console.log('Total Variant QIDs to exclude across all topics:', allVariantQids.size);

// 2. Group published sets by topicId
const byTopic = new Map();
const nonGkSets = [];

published.forEach(s => {
  const tid = s.topicId;
  // If english or non-gk
  if (!Object.values(mapping).includes(tid)) {
    nonGkSets.push({ ...s, status: "active" });
  } else {
    if (!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid).push(s);
  }
});

let totalActiveSets = 0;
let totalArchivedSets = 0;
let totalCleanQuestionsInActiveSets = 0;
const newPublishedList = [];

for (const [topicId, sets] of byTopic.entries()) {
  sets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Collect all unique non-variant question IDs present in this topic's current published sets
  const topicPubUniqueQids = [];
  const seenInTopic = new Set();

  sets.forEach(s => {
    (s.questionIds || []).forEach(qid => {
      if (!allVariantQids.has(qid) && !seenInTopic.has(qid)) {
        seenInTopic.add(qid);
        topicPubUniqueQids.push(qid);
      }
    });
  });

  // Calculate how many full 20-Q sets we can form
  const numFull20Sets = Math.floor(topicPubUniqueQids.length / 20);

  // Pack the sets:
  sets.forEach((set, idx) => {
    if (idx < numFull20Sets) {
      // ACTIVE SET: gets exactly 20 clean unique questions
      const setQids = topicPubUniqueQids.slice(idx * 20, (idx + 1) * 20);
      newPublishedList.push({
        ...set,
        status: "active",
        questionCount: 20,
        questionIds: setQids
      });
      totalActiveSets++;
      totalCleanQuestionsInActiveSets += 20;
    } else {
      // ARCHIVED SET: preserved for past user history review, marked archived
      newPublishedList.push({
        ...set,
        status: "archived",
        isArchived: true
      });
      totalArchivedSets++;
    }
  });
}

// Add non-GK sets (e.g. English Paper-II)
nonGkSets.forEach(s => {
  newPublishedList.push(s);
  totalActiveSets++;
  totalCleanQuestionsInActiveSets += (s.questionCount || s.questionIds?.length || 20);
});

console.log('--- PURIFIED PUBLISHED SETS SUMMARY ---');
console.log('Total sets in new published-sets.json:', newPublishedList.length);
console.log('Active Sets (Pure 20-Q Unique):', totalActiveSets);
console.log('Archived Sets (Grandfathered for past history):', totalArchivedSets);
console.log('Total Questions in Active Sets:', totalCleanQuestionsInActiveSets);

// Write backup and new file
fs.writeFileSync('data/sets/published-sets.backup.json', JSON.stringify(published, null, 2), 'utf8');
fs.writeFileSync(pubPath, JSON.stringify(newPublishedList, null, 2), 'utf8');
console.log('[OK] Successfully updated published-sets.json (backup saved to published-sets.backup.json)!');

