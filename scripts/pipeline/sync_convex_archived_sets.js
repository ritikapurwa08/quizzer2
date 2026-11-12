const fs = require('fs');
const { execSync } = require('child_process');

const published = JSON.parse(fs.readFileSync('data/sets/published-sets.json', 'utf8'));

const archivedIds = published.filter(s => s.status === 'archived' || s.isArchived).map(s => s.id);
const activeUpdates = published
  .filter(s => s.status === 'active')
  .map(s => ({
    id: s.id,
    questionCount: s.questionCount || (s.questionIds ? s.questionIds.length : 20)
  }));

console.log(`Found ${archivedIds.length} sets to mark as archived in Convex.`);
console.log(`Found ${activeUpdates.length} active sets to ensure active in Convex.`);

// We can execute this via npx convex run in batches if needed or in a single call
// Save payload to a temp file
const payload = {
  archivedIds,
  activeUpdates,
  adminSecret: "quizzer_admin_pool_init_2026"
};

fs.writeFileSync('scripts/pipeline/convex_sync_payload.json', JSON.stringify(payload), 'utf8');

console.log('Running npx convex run testSets:archiveSetsBatch...');
try {
  // Pass arguments JSON
  const output = execSync('npx convex run testSets:archiveSetsBatch "$(cat scripts/pipeline/convex_sync_payload.json)"', {
    shell: 'pwsh',
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('Result:', output);
} catch (e) {
  // On windows pwsh, let's try with node reading the file or inline
  console.error('Error running command directly:', e.message);
  if (e.stdout) console.log('Stdout:', e.stdout);
  if (e.stderr) console.error('Stderr:', e.stderr);
}

