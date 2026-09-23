/**
 * Quizzer — Authoritative Gemini Educational Content Generation Contract
 * 
 * Generates structured JSON notes strictly conforming to Quizzer's typed Block Schema.
 * Ensures factual accuracy for Rajasthan GK competitive examinations (RPSC RAS, REET, Patwar, Police SI, VDO).
 */

export interface NotesPromptOptions {
  subjectName: string;
  topicName: string;
  topicNameHindi?: string;
  availableImages?: Array<{ src: string; alt: string; caption?: string }>;
  customInstructions?: string;
}

export function generateGeminiNotesPrompt(options: NotesPromptOptions): string {
  const {
    subjectName,
    topicName,
    topicNameHindi = "",
    availableImages = [],
    customInstructions = "",
  } = options;

  const imageClause =
    availableImages.length > 0
      ? `
==================================================
AVAILABLE STATIC ASSET IMAGES FOR THIS TOPIC
==================================================
You may reference ONLY the following pre-existing image assets where relevant:
${JSON.stringify(availableImages, null, 2)}
DO NOT invent or guess any other image paths.
`
      : `
==================================================
IMAGE USAGE RULE
==================================================
No local static images are currently uploaded for this topic.
DO NOT create any "image" blocks.
`;

  return `
You are the Master Rajasthan GK Subject Expert and Chief Content Architect for "Quizzer".
Generate a high-yield, comprehensive, and exam-oriented STUDY NOTE in valid structured JSON for:

SUBJECT: ${subjectName}
TOPIC: ${topicName} ${topicNameHindi ? `(${topicNameHindi})` : ""}

${imageClause}

${customInstructions ? `SPECIAL FOCUS / USER INSTRUCTIONS:\n${customInstructions}\n` : ""}

==================================================
MANDATORY ARCHITECTURAL RULES
==================================================
1. PURE STRUCTURED JSON ONLY: Return ONLY valid JSON matching the exact schema below.
   - Do NOT wrap with commentary.
   - Do NOT include raw HTML tags (<p>, <div>, <b>, <span>, <table>, etc.). The frontend application controls all typography and rendering.
2. LANGUAGE: Use natural, exam-oriented Hindi (Devanagari script) as the primary language, with standard English terms/names in parentheses where beneficial.
3. RPSC/RSMSSB EXAM ORIENTATION: Cover core historical facts, geographical classifications, census/economic data, legal provisions, treaties, cultural significance, and previous year recurring themes.
4. COMPOSABLE VARIETY: Do not create a monotonous wall of text. Use a rich combination of blocks:
   - "facts": for high-yield, quick-to-revise factual bullets.
   - "table" or "comparison_table": whenever comparing regions, rulers, soil types, districts, or categories.
   - "trick" / "mnemonic": at least one clever, memorable trick in Hindi for complex lists (e.g. order of rivers, treaty dates, dynasties, folk dances).
   - "exam_trap": highlight 1-2 common confusion points where students usually make mistakes in RPSC exams.
   - "timeline": if there is a chronological progression (revolts, treaties, dynasty rulers).
   - "quick_revision": concluding high-impact bullet summary.
5. NO UNSUPPORTED FIELDS: Only use the exact block structures defined below.

==================================================
SUPPORTED JSON BLOCK CONTRACT
==================================================
{
  "version": "1.0",
  "title": "${topicNameHindi || topicName}",
  "subtitle": "${topicName}",
  "overview": "2-3 sentences concise overview of this topic in Hindi.",
  "tags": ["राजस्थान GK", "${subjectName}"],
  "blocks": [
    {
      "type": "heading",
      "level": 2,
      "text": "शीर्षक",
      "subtitle": "Optional English or descriptive subtitle"
    },
    {
      "type": "paragraph",
      "content": "विस्तृत व्याख्या..."
    },
    {
      "type": "facts",
      "title": "महत्वपूर्ण परीक्षा उपयोगी तथ्य",
      "items": [
        "तथ्य 1",
        "तथ्य 2"
      ]
    },
    {
      "type": "table",
      "title": "तालिका शीर्षक",
      "columns": ["स्तंभ 1", "स्तंभ 2", "स्तंभ 3"],
      "rows": [
        ["पंक्ति 1-मान 1", "पंक्ति 1-मान 2", "पंक्ति 1-मान 3"]
      ]
    },
    {
      "type": "comparison_table",
      "title": "तुलनात्मक अध्ययन",
      "headers": ["विषय A", "विषय B"],
      "rows": [
        { "feature": "पहलू 1", "col1": "विवरण A", "col2": "विवरण B" }
      ]
    },
    {
      "type": "timeline",
      "title": "कालक्रम / महत्वपूर्ण वर्ष",
      "events": [
        { "dateOrEra": "1857", "title": "घटना", "description": "विवरण..." }
      ]
    },
    {
      "type": "trick",
      "title": "याद रखने की शॉर्टकट ट्रिक",
      "mnemonic": "ट्रिक का सूत्र / वाक्य",
      "explanation": "ट्रिक का स्पष्टीकरण",
      "examContext": "यह ट्रिक किस परीक्षा प्रश्न में काम आती है"
    },
    {
      "type": "exam_trap",
      "title": "सावधानी / सामान्य भ्रम (Exam Trap)",
      "confusion": "परीक्षार्थी अक्सर क्या गलत समझ लेते हैं",
      "clarification": "वास्तविक सही तथ्य और दोनों में अंतर"
    },
    {
      "type": "callout",
      "calloutType": "tip",
      "title": "विशेष टिप्पणी",
      "content": "महत्वपूर्ण नोट..."
    },
    {
      "type": "quick_revision",
      "title": "त्वरित पुनरावलोकन (Quick Revision)",
      "summaryPoints": [
        "प्रमुख बिंदु 1",
        "प्रमुख बिंदु 2"
      ]
    },
    {
      "type": "pyq_connection",
      "examName": "RAS / REET / Patwar",
      "year": "Previous Years",
      "questionSnippet": "इस विषय से पूछा गया प्रश्न प्रारूप",
      "insight": "RPSC की प्रश्न पूछने की प्रवृत्ति और मुख्य पहलू"
    }
  ]
}

Now generate the complete, high-quality structured JSON document for "${topicName}". Output ONLY valid JSON:
`.trim();
}
