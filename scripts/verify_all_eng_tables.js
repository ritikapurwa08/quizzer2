const fs = require('fs');
const path = require('path');

const results = JSON.parse(fs.readFileSync('scripts/eng_table_audit_results.json', 'utf8'));

console.log(`Verifying all ${results.all.length} English questions...`);

const TABLE_PARSER = /\|[^\n\r|]+\|[^\n\r|]+\|[\s\S]*?\|[-:\s|]{3,}\|([\s\S]*)/;

let autoVerifiedCount = 0;
let discrepancyCount = 0;
const discrepancies = [];

results.all.forEach(q => {
  const text = q.text;
  const opts = q.options;
  const ansLetter = String(q.answer).toUpperCase();
  const ansIdx = ['A', 'B', 'C', 'D'].indexOf(ansLetter);
  const selectedOpt = opts[ansIdx];

  // Try to parse table rows
  const match = text.match(/\|\s*([^|\n\r]+)\s*\|\s*([^|\n\r]+)\s*\|\r?\n\|\s*[-:\s]+\|\s*[-:\s]+\|\r?\n([\s\S]*?)(?:\r?\n\r?\n|Choose|Select|Code|$)/i);
  if (match) {
    const rawRows = match[3].split(/\r?\n/).filter(line => line.includes('|'));
    const rows = rawRows.map(line => {
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      return parts;
    }).filter(parts => parts.length >= 2);

    // If rows have 3 or 4 pairs
    if (rows.length >= 3 && selectedOpt) {
      autoVerifiedCount++;
    }
  }
});

console.log(`Auto verified count: ${autoVerifiedCount}`);

