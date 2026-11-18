const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, '..', 'data', 'staging_topic_02_part1.json');

function applyEnrichmentBatch(batchUpdates) {
  const data = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  let updatedCount = 0;
  const errors = [];

  for (const [id, explanation] of Object.entries(batchUpdates)) {
    const q = data.questions.find(item => item.id === id);
    if (!q) {
      errors.push(`Question ID ${id} not found in questions array!`);
      continue;
    }

    // Validation checks
    if (!explanation.startsWith('सही उत्तर: (')) {
      errors.push(`ID ${id}: Explanation does not start with 'सही उत्तर: ('`);
    }
    if (!explanation.includes('अन्य विकल्पों का विश्लेषण:')) {
      errors.push(`ID ${id}: Explanation missing 'अन्य विकल्पों का विश्लेषण:'`);
    }

    q.explanation = explanation;
    updatedCount++;
  }

  if (errors.length > 0) {
    console.error('Validation errors found:');
    errors.forEach(e => console.error(' -', e));
    throw new Error('Batch validation failed! File not saved.');
  }

  fs.writeFileSync(TARGET_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Successfully updated ${updatedCount} questions. File cleanly saved.`);
  
  // Total enriched count
  const totalEnriched = data.questions.filter(q => q.explanation && q.explanation.startsWith('सही उत्तर: (')).length;
  console.log(`Progress: ${totalEnriched} / ${data.questions.length} questions enriched.`);
}

module.exports = { applyEnrichmentBatch, TARGET_FILE };
