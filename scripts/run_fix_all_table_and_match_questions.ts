import fs from 'fs';
import path from 'path';
import { enrichQuestionStructure } from '../src/lib/matchQuestionParser';

async function fixAllQuestions() {
  console.log('=== FIXING ALL MATCH & TABLE QUESTIONS ACROSS DATABASE FILES ===');
  const cwd = process.cwd();

  // 1. Fix published-sets.json
  const publishedSetsPath = path.join(cwd, 'data', 'master-pool', 'published-sets.json');
  if (fs.existsSync(publishedSetsPath)) {
    console.log('\n[1/3] Processing published-sets.json...');
    const sets: any[] = JSON.parse(fs.readFileSync(publishedSetsPath, 'utf-8'));
    let setsMatchFixed = 0;
    let setsTableFixed = 0;
    let setsSeqFixed = 0;

    for (const s of sets) {
      if (Array.isArray(s.questions)) {
        s.questions = s.questions.map((q: any) => {
          const origType = q.type;
          const origHasLeft = Boolean(q.meta?.left && q.meta.left.length > 0);
          const origHasHeaders = Boolean(q.meta?.headers && q.meta.headers.length > 0);
          const origHasItems = Boolean(q.meta?.items && q.meta.items.length > 0);

          const enriched = enrichQuestionStructure(q);

          if (!origHasLeft && enriched.meta?.left && enriched.meta.left.length > 0) {
            setsMatchFixed++;
          }
          if (!origHasHeaders && enriched.meta?.headers && enriched.meta.headers.length > 0) {
            setsTableFixed++;
          }
          if (!origHasItems && enriched.meta?.items && enriched.meta.items.length > 0) {
            setsSeqFixed++;
          }

          return enriched;
        });
      }
    }

    fs.writeFileSync(publishedSetsPath, JSON.stringify(sets, null, 2), 'utf-8');
    console.log(`✓ published-sets.json updated:`);
    console.log(`  - Match questions populated: ${setsMatchFixed}`);
    console.log(`  - Table questions populated: ${setsTableFixed}`);
    console.log(`  - Sequence questions populated: ${setsSeqFixed}`);
  }

  // 2. Fix data/ddd/topics/*.json
  const topicsDir = path.join(cwd, 'data', 'ddd', 'topics');
  if (fs.existsSync(topicsDir)) {
    console.log('\n[2/3] Processing data/ddd/topics/*.json...');
    const topicFiles = fs.readdirSync(topicsDir).filter(f => f.endsWith('.json'));
    let topicsMatchFixed = 0;
    let topicsTableFixed = 0;
    let topicsSeqFixed = 0;

    for (const tf of topicFiles) {
      const tp = path.join(topicsDir, tf);
      const data = JSON.parse(fs.readFileSync(tp, 'utf-8'));

      if (Array.isArray(data.questions)) {
        data.questions = data.questions.map((q: any) => {
          const origHasLeft = Boolean(q.meta?.left && q.meta.left.length > 0);
          const origHasHeaders = Boolean(q.meta?.headers && q.meta.headers.length > 0);
          const origHasItems = Boolean(q.meta?.items && q.meta.items.length > 0);

          const enriched = enrichQuestionStructure(q);

          if (!origHasLeft && enriched.meta?.left && enriched.meta.left.length > 0) {
            topicsMatchFixed++;
          }
          if (!origHasHeaders && enriched.meta?.headers && enriched.meta.headers.length > 0) {
            topicsTableFixed++;
          }
          if (!origHasItems && enriched.meta?.items && enriched.meta.items.length > 0) {
            topicsSeqFixed++;
          }

          return enriched;
        });

        fs.writeFileSync(tp, JSON.stringify(data, null, 2), 'utf-8');
      }
    }

    console.log(`✓ data/ddd/topics/*.json updated:`);
    console.log(`  - Match questions populated: ${topicsMatchFixed}`);
    console.log(`  - Table questions populated: ${topicsTableFixed}`);
    console.log(`  - Sequence questions populated: ${topicsSeqFixed}`);
  }

  // 3. Fix master-pool.json
  const masterPoolPath = path.join(cwd, 'data', 'master-pool', 'master-pool.json');
  if (fs.existsSync(masterPoolPath)) {
    console.log('\n[3/3] Processing master-pool.json...');
    const pool: any[] = JSON.parse(fs.readFileSync(masterPoolPath, 'utf-8'));
    let poolMatchFixed = 0;
    let poolTableFixed = 0;
    let poolSeqFixed = 0;

    const updatedPool = pool.map((p: any) => {
      const origHasLeft = Boolean(p.meta?.left && p.meta.left.length > 0);
      const origHasHeaders = Boolean(p.meta?.headers && p.meta.headers.length > 0);
      const origHasItems = Boolean(p.meta?.items && p.meta.items.length > 0);

      const enriched = enrichQuestionStructure(p);

      if (!origHasLeft && enriched.meta?.left && enriched.meta.left.length > 0) {
        poolMatchFixed++;
      }
      if (!origHasHeaders && enriched.meta?.headers && enriched.meta.headers.length > 0) {
        poolTableFixed++;
      }
      if (!origHasItems && enriched.meta?.items && enriched.meta.items.length > 0) {
        poolSeqFixed++;
      }

      return enriched;
    });

    fs.writeFileSync(masterPoolPath, JSON.stringify(updatedPool, null, 2), 'utf-8');
    console.log(`✓ master-pool.json updated:`);
    console.log(`  - Match questions populated: ${poolMatchFixed}`);
    console.log(`  - Table questions populated: ${poolTableFixed}`);
    console.log(`  - Sequence questions populated: ${poolSeqFixed}`);
  }

  console.log('\n✅ ALL QUESTIONS SUCCESSFULLY PROCESSED AND SAVED!');
}

fixAllQuestions().catch(err => {
  console.error('Fatal error during fix:', err);
  process.exit(1);
});

