/**
 * Set numbering utility functions for Quizzer.
 * Guarantees automatic calculation of "भाग X" from existing Convex test sets,
 * ensuring no duplicate set names and maintaining continuous sequence.
 */

export function extractPartNumber(name: string): number | null {
  if (!name) return null;
  // Match "भाग X", "Part X", "सेट X", "Set X", "भाग-X", etc.
  const match = name.match(/(?:भाग|Part|सेट|Set)[\s\-–—:]*(\d+)/i) || name.match(/(\d+)(?:\s*$|\))/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function extractBaseTopicName(name: string): string {
  if (!name) return "";
  // Strip trailing "भाग X" / "Part X" / "Set X" and trailing punctuation/spaces
  return name.replace(/\s*[-–—:]*\s*(?:भाग|Part|सेट|Set)[\s\-–—:]*\d+.*$/i, "").trim();
}

/**
 * Calculates the next part number based on existing sets in Convex.
 * If existing sets contain "भाग 1", next is 2.
 * If existing sets contain "भाग 1", "भाग 4", next is 5 (highest + 1).
 * If no sets exist, returns 1.
 */
export function getNextPartNumber(existingTestSets: Array<{ name: string }>): number {
  if (!existingTestSets || existingTestSets.length === 0) return 1;

  let maxPart = 0;
  for (const set of existingTestSets) {
    const part = extractPartNumber(set.name);
    if (part !== null && part > maxPart) {
      maxPart = part;
    }
  }

  // Next part is highest part + 1, or if no parts parsed, existing count + 1
  return Math.max(maxPart, existingTestSets.length) + 1;
}

/**
 * Generates the automatic set name in Hindi "भाग X" format.
 * If existing sets exist, uses their base name (e.g. "राजस्थान मेरे लिए")
 * otherwise falls back to fallbackTopicName.
 */
export function calculateNextSetName(
  existingTestSets: Array<{ name: string }>,
  fallbackTopicName: string
): { nextPart: number; baseName: string; fullName: string } {
  const nextPart = getNextPartNumber(existingTestSets);

  // Find the base name from the highest existing set or recent set
  let baseName = "";
  if (existingTestSets && existingTestSets.length > 0) {
    let latestPart = -1;
    for (const set of existingTestSets) {
      const p = extractPartNumber(set.name);
      const effectivePart = p !== null ? p : 0;
      if (effectivePart >= latestPart) {
        latestPart = effectivePart;
        const b = extractBaseTopicName(set.name);
        if (b) baseName = b;
      }
    }
    if (!baseName) {
      baseName = extractBaseTopicName(existingTestSets[existingTestSets.length - 1].name);
    }
  }

  if (!baseName) {
    baseName = fallbackTopicName.trim();
  }

  return {
    nextPart,
    baseName,
    fullName: `${baseName} भाग ${nextPart}`,
  };
}

/**
 * For multi-set imports (e.g. 60 questions -> 3 sets of 20),
 * calculates the names for each set starting from startPartNumber.
 */
export function calculateBatchSetNames(
  baseName: string,
  startPartNumber: number,
  setCount: number
): string[] {
  const names: string[] = [];
  for (let i = 0; i < setCount; i++) {
    names.push(`${baseName} भाग ${startPartNumber + i}`);
  }
  return names;
}
