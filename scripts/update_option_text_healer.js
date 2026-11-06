const fs = require('fs');
const path = require('path');

const baseHeals = JSON.parse(fs.readFileSync('scripts/word_heals_dict.json', 'utf8'));
const extendedScript = fs.readFileSync('scripts/apply_extended_word_heals.js', 'utf8');

// Combine both dictionaries
const combined = { ...baseHeals };

// Extract extended heals object from script
const match = extendedScript.match(/const EXTENDED_HEALS = (\{[\s\S]*?\});/);
if (match) {
  const ext = eval('(' + match[1] + ')');
  Object.assign(combined, ext);
}

console.log(`Total words in combined master dictionary: ${Object.keys(combined).length}`);

// Generate updated optionTextHealer.ts
const code = `/**
 * optionTextHealer.ts
 *
 * Universal healer for options corrupted by legacy scraper prefix stripping:
 * 1. Restores missing 'a-' / '(a)' in matching & sequence options
 * 2. Restores missing leading consonants (द, ब, स, अ, श) stripped from Hindi words
 *    e.g. "क्षिणी सिरा" -> "दक्षिणी सिरा", "ीकानेर" -> "बीकानेर", "िरोही" -> "सिरोही", "नुच्छेद" -> "अनुच्छेद"
 */

export const ORPHAN_WORD_REPLACEMENTS: Record<string, string> = ${JSON.stringify(combined, null, 2)};

/**
 * Heals option string if it has missing 'a-' prefix, stripped consonants, or orphan matras.
 */
export function healOptionText(text: string): string {
  if (typeof text !== "string") return text;
  let trimmed = text.trim();
  if (!trimmed) return trimmed;

  // 1. OCR fixes: 'lll' -> 'III', 'lI' -> 'II'
  trimmed = trimmed.replace(/\\blll\\b/gi, "III");
  trimmed = trimmed.replace(/[-–—:]\\s*lI\\b/g, "-II");

  // 2. Restore missing 'a-' / '(a)' in matching lists
  // Pattern 2a: (iv), (b)-(i), (c)-(ii), (d)-(iii) or (ii), b-(iii), c-(iv), d-(i)
  if (/^[-–—\\s]*\\(([iIvVxX\\d]+)\\)[\\s,–—\\-]+(?:\\(?b\\)?|b[\\s\\-–—:])/i.test(trimmed)) {
    const clean = trimmed.replace(/^[-–—\\s]+/, "");
    trimmed = clean.replace(/^\\(([iIvVxX\\d]+)\\)/i, "a-($1)");
  }
  // Pattern 2b: Bare roman/digit missing 'a-': e.g. "III, b-I, c-IV, d-II" or "3, b-1, c-4, d-2"
  else if (/^[-–—\\s]*([iIvVxX\\d]+)[\\s,–—\\-]+(?:b[\\s\\-–—:]|\\(b\\)[\\s\\-–—:])/i.test(trimmed)) {
    const clean = trimmed.replace(/^[-–—\\s]+/, "");
    trimmed = \`a-\${clean}\`;
  }
  // Pattern 2c: Bare roman missing '(A)-': e.g. "(ii), B - (i), C - (iv), D - (iii)"
  else if (/^[-–—\\s]*\\(([iIvVxX\\d]+)\\)[\\s,–—\\-]+B[\\s\\-–—:]/i.test(trimmed)) {
    const clean = trimmed.replace(/^[-–—\\s]+/, "");
    trimmed = clean.replace(/^\\(([iIvVxX\\d]+)\\)/i, "(A)-($1)");
  }
  // Pattern 2d: Hindi bare ब: e.g. "III, ब-I, स-IV, द-II"
  else if (/^[-–—\\s]*([iIvVxX\\d]+)[\\s,–—\\-]+ब[\\s\\-–—:.]/.test(trimmed)) {
    const clean = trimmed.replace(/^[-–—\\s]+/, "");
    trimmed = \`अ-\${clean}\`;
  }
  // Pattern 2e: Hindi paren (ब): e.g. "(iii), (ब) - (i), (स) - (ii)..."
  else if (/^[-–—\\s]*\\(([iIvVxX\\d]+)\\)[\\s,–—\\-]+\\(ब\\)[\\s\\-–—:]/.test(trimmed)) {
    const clean = trimmed.replace(/^[-–—\\s]+/, "");
    trimmed = clean.replace(/^\\(([iIvVxX\\d]+)\\)/, "(अ)-($1)");
  }

  // 3. Strip stray leading comma / punctuation
  if (/^[,\\-–—;.]\\s*/.test(trimmed)) {
    trimmed = trimmed.replace(/^[,\\-–—;.]\\s*/, "");
  }

  // 4. Check and heal leading orphan matras or stripped leading consonants (द, ब, स, अ, श)
  // Check against dictionary
  for (const [orphan, replacement] of Object.entries(ORPHAN_WORD_REPLACEMENTS)) {
    if (trimmed === orphan) {
      trimmed = replacement;
      break;
    }
    if (
      trimmed.startsWith(orphan + " ") ||
      trimmed.startsWith(orphan + "-") ||
      trimmed.startsWith(orphan + "–") ||
      trimmed.startsWith(orphan + "—") ||
      trimmed.startsWith(orphan + ",") ||
      trimmed.startsWith(orphan + "।") ||
      trimmed.startsWith(orphan + "(") ||
      trimmed.startsWith(orphan + ":") ||
      trimmed.startsWith(orphan + ";")
    ) {
      trimmed = replacement + trimmed.slice(orphan.length);
      break;
    }
  }

  return trimmed;
}
`;

fs.writeFileSync('src/lib/optionTextHealer.ts', code);
console.log('Successfully updated src/lib/optionTextHealer.ts with all master heals!');

