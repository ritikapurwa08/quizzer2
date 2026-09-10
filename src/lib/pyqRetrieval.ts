/**
 * PYQ Retrieval Engine — Multi-Stage Intelligent Retrieval
 *
 * Given a topic (and optional subject/subtopic), retrieves the most relevant
 * questions from the 17,143-question Rajasthan exam corpus and returns them
 * for inclusion in the AI generation prompt.
 *
 * Multi-Stage Pipeline:
 *  1. Query Normalization (Hindi orthography, compounding, spacing, inflections)
 *  2. Query Expansion (Domain ontology, topic synonyms, aliases, parent/child)
 *  3. In-Memory Candidate Retrieval (Topic, question, options, explanation)
 *  4. Multi-Signal Scoring (Topic, keywords, exact phrase, quality bonuses)
 *  5. 5-Level High-Recall Fallback Hierarchy (Levels 1 to 5)
 *  6. Deduplication & Conceptual Diversity Selection
 */

// ─── Raw corpus type (as stored in the JSON file) ────────────────────────────

export interface RawCorpusQuestion {
  id: number;
  topic: string;
  question: string;
  /** Options with Devanagari prefix markers: ["(अ) ...", "(ब) ...", "(स) ...", "(द) ..."] */
  options: string[];
  /** Text string matching the content of one option */
  answer: string;
  exam: string;
  explanation: string;
}

// ─── Enriched question returned to prompt builder ─────────────────────────────

export interface PyqQuestion {
  /** Original corpus ID — preserved for sourceQuestionId provenance */
  id: number;
  topic: string;
  question: string;
  /** Clean options without Devanagari prefix markers */
  options: string[];
  /** 0-based answer index derived from answer text matching */
  answerIndex: number;
  /** Original answer text (for double-checking) */
  answerText: string;
  /** Exam name — empty string if not available */
  exam: string;
  /** Explanation — empty string if not available */
  explanation: string;
  /** Relevance score (internal, not exposed to AI) */
  _score: number;
  /** Conceptual aspect category for diversity */
  _aspect?: string;
}

// ─── Retrieval Query & Options ───────────────────────────────────────────────

export interface PyqRetrievalQuery {
  topic: string;
  subject?: string;
  subtopic?: string;
}

export interface ScoringWeights {
  exactTopicMatch: number;
  normalizedTopicMatch: number;
  aliasTopicMatch: number;
  topicSubstringMatch: number;
  relatedClusterTopicMatch: number;
  questionPhraseMatch: number;
  questionQueryKeywordMatch: number;
  questionExpandedKeywordMatch: number;
  optionKeywordMatch: number;
  explanationKeywordMatch: number;
  examQualityBonus: number;
  explanationQualityBonus: number;
  fourOptionsBonus: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  exactTopicMatch: 100,
  normalizedTopicMatch: 90,
  aliasTopicMatch: 80,
  topicSubstringMatch: 65,
  relatedClusterTopicMatch: 50,
  questionPhraseMatch: 30,
  questionQueryKeywordMatch: 25,
  questionExpandedKeywordMatch: 12,
  optionKeywordMatch: 8,
  explanationKeywordMatch: 6,
  examQualityBonus: 5,
  explanationQualityBonus: 3,
  fourOptionsBonus: 2,
};

export interface PyqRetrievalOptions {
  /** Maximum number of questions to return. Default: 100 */
  maxResults?: number;
  /** Minimum relevance score to include. Default: 20 */
  minScore?: number;
  /** Custom scoring weights */
  weights?: Partial<ScoringWeights>;
}

export interface PyqRetrievalResult {
  questions: PyqQuestion[];
  /** Total questions found before limiting to maxResults */
  totalFound: number;
  /** Number of questions sent (after maxResults cap) */
  sent: number;
  /** Exact and near-duplicate questions removed during deduplication */
  duplicatesRemoved: number;
  /** Fallback level utilized (1: Exact, 2: Normalized/Alias, 3: Related, 4: Question Text, 5: Broader Subject) */
  levelUsed: number;
  /** Retrieval telemetry for prompt header and debugging */
  retrievalStats: {
    exactTopicMatches: number;
    aliasMatches: number;
    relatedMatches: number;
    questionTextMatches: number;
    candidatePoolSize: number;
  };
}

// ─── Lazy-loaded corpus & in-memory index ─────────────────────────────────────

let _corpus: RawCorpusQuestion[] | null = null;
let _normalizedTopicIndex: Map<string, number[]> | null = null;
let _keywordIndex: Map<string, Set<number>> | null = null;

function getCorpus(): RawCorpusQuestion[] {
  if (!_corpus) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _corpus = require("@/xdata/rajasthan_selected_topics_question_15000.json") as RawCorpusQuestion[];
  }
  return _corpus;
}

// ─── STAGE 1: Devanagari & English Normalization ──────────────────────────────

/**
 * Normalizes Devanagari and English text:
 * - Collapses whitespace and removes punctuation
 * - Strips zero-width non-joiners/joiners
 * - Normalizes nukta
 * - Maps chandrabindu to anusvara
 * - Resolves panchama varna to anusvara (ण्ड->ंड, न्द->ंद, म्ब->ंब, ङ्ग->ंग, ञ्->ं)
 * - Harmonizes common spelling variations (त्यौहार->त्योहार, आन्दोलन->आंदोलन, etc.)
 * - Normalizes common compound spacing (विधान मंडल <-> विधानमंडल, etc.)
 */
export function normalizeDevanagari(text: string): string {
  if (!text) return "";
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u093C/g, "") // strip nukta
    .replace(/ँ/g, "ं")
    .replace(/ण्ड/g, "ंड")
    .replace(/न्द/g, "ंद")
    .replace(/म्ब/g, "ंब")
    .replace(/ङ्ग/g, "ंग")
    .replace(/ञ्/g, "ं")
    .replace(/त्यौहार/g, "त्योहार")
    .replace(/आन्दोलन/g, "आंदोलन")
    .replace(/प्रजामण्डल/g, "प्रजामंडल")
    .replace(/सम्प्रदाय/g, "संप्रदाय")
    .replace(/मण्‍डल|मण्डल/g, "मंडल")
    .replace(/विधान\s+मंडल|विधान-मंडल/g, "विधानमंडल")
    .replace(/मंत्रि\s+परिषद|मंत्रि-परिषद|मन्त्रि\s+परिषद|मन्त्रिपरिषद/g, "मंत्रिपरिषद")
    .replace(/मंत्रि\s+मंडल|मंत्रि-मंडल|मंत्रिमण्डल/g, "मंत्रिमंडल")
    .replace(/राज्य\s+पाल/g, "राज्यपाल")
    .replace(/लोक\s+देवता/g, "लोकदेवता")
    .replace(/लोक\s+देवियां/g, "लोकदेवियां")
    .replace(/लोक\s+नृत्य/g, "लोकनृत्य")
    .replace(/लोक\s+गीत/g, "लोकगीत")
    .replace(/हस्त\s+शिल्प/g, "हस्तशिल्प")
    .replace(/हस्त\s+कला/g, "हस्तकला")
    .replace(/स्थापत्य\s+कला/g, "स्थापत्यकला")
    .replace(/पंचायती\s+राज/g, "पंचायतीराज")
    .replace(/[।,?!;:""''()\[\]{}|\/\\_~`@#$%^&*+=<>।]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns variants of a query string:
 * - norm: standard normalized form
 * - noSpace: completely stripped of whitespace
 * - head: stripped of leading generic qualifiers (e.g. "राजस्थान में ...")
 */
export function getNormalizedVariants(text: string): { norm: string; noSpace: string; head: string } {
  const norm = normalizeDevanagari(text);
  const noSpace = norm.replace(/\s+/g, "");
  const head = norm
    .replace(/^(?:राजस्थान\s+(?:में|के|की|का|सरकार\s+की)\s+)+/, "")
    .replace(/^(?:प्रमुख|महत्वपूर्ण|विशेष)\s+/, "")
    .trim();
  return { norm, noSpace, head: head || norm };
}

/** High-frequency stop words and procedural filler words */
const STOP_WORDS = new Set([
  // Hindi pronouns and particles
  "का", "की", "के", "में", "है", "हैं", "से", "को", "और", "या",
  "पर", "यह", "वह", "इस", "उस", "एक", "था", "थी", "थे", "हो",
  "कि", "जो", "तो", "भी", "ने", "द्वारा", "तथा", "व", "एवं",
  "लिए", "बारे", "शामिल", "अनुसार", "कारण", "तहत", "अधीन",
  // English common words
  "at", "the", "of", "in", "is", "to", "and", "or", "a", "an", "by", "for",
  // Question filler words
  "कथन", "कौन", "निम्न", "निम्नलिखित", "उपर्युक्त", "सही", "गलत", "सुमेलित", "युग्म", "उत्तर",
  // Geographic generic words
  "राजस्थान", "राजस्थानी", "rajasthan"
]);

/** Extract meaningful keyword tokens (length >= 2, non-stop-word) */
export function extractKeywords(text: string): Set<string> {
  const norm = normalizeDevanagari(text);
  const words = norm.split(" ");
  const keywords = new Set<string>();
  for (const w of words) {
    if (w.length >= 2 && !STOP_WORDS.has(w)) {
      keywords.add(w);
    }
  }
  return keywords;
}

/** Strip option prefix markers like "(अ)", "(ब)", "(स)", "(द)", "(1)", "(A)" */
export function stripOptionPrefix(option: string): string {
  return option
    .replace(/^\s*[\(\（][अबसदabcd12345]\s*[\)\）]\s*/i, "")
    .replace(/^\s*[अबसदabcd12345]\s*[\.\)]\s*/i, "")
    .trim();
}

/** Derive the 0-based answer index from answer text matching against options */
export function resolveAnswerIndex(answerText: string, options: string[]): number {
  const normAnswer = normalizeDevanagari(answerText);

  // Pass 1: exact normalized match against stripped option text
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeDevanagari(stripOptionPrefix(options[i]));
    if (stripped === normAnswer) return i;
  }

  // Pass 2: answer contained in option (or option contained in answer)
  for (let i = 0; i < options.length; i++) {
    const stripped = normalizeDevanagari(stripOptionPrefix(options[i]));
    if (stripped && normAnswer && (stripped.includes(normAnswer) || normAnswer.includes(stripped))) {
      return i;
    }
  }

  // Pass 3: raw option text contains answer text
  for (let i = 0; i < options.length; i++) {
    const normOpt = normalizeDevanagari(options[i]);
    if (normOpt.includes(normAnswer)) return i;
  }

  return 0;
}

// ─── STAGE 2: Rajasthan GK Domain Ontology & Query Expansion ──────────────────

export interface OntologyCluster {
  cluster: string;
  aliases: string[];
  corpusTopics: string[];
  relatedCorpusTopics: string[];
  keywords: string[];
}

export const TOPIC_ONTOLOGY: OntologyCluster[] = [
  {
    cluster: "polity_legislature",
    aliases: [
      "राज्य विधान मंडल", "राज्य विधानमंडल", "विधानसभा", "राज्य विधानसभा",
      "राजस्थान विधानसभा", "राज्य विधायिका", "विधान परिषद", "विधानपरिषद"
    ],
    corpusTopics: ["राज्य विधान मंडल"],
    relatedCorpusTopics: ["राज्यपाल", "मुख्यमंत्री", "राज्य मंत्रिपरिषद", "राजस्थान मंत्रिमंडल", "राज्य प्रशासन"],
    keywords: [
      "विधानसभा", "विधान सभा", "विधानमंडल", "विधान मंडल", "विधायिका",
      "अध्यक्ष", "स्पीकर", "उपाध्यक्ष", "प्रोटेम स्पीकर", "सदन", "सत्र",
      "कार्यकाल", "सचेतक", "विधायक", "एमएलए", "विपक्ष के नेता", "संसदीय"
    ]
  },
  {
    cluster: "polity_executive",
    aliases: [
      "मंत्रिपरिषद", "मन्त्रिपरिषद", "मंत्रिमंडल", "मंत्रिमण्डल",
      "राज्य मंत्रिपरिषद", "राजस्थान मंत्रिमंडल", "काउंसिल ऑफ मिनिस्टर्स"
    ],
    corpusTopics: ["राज्य मंत्रिपरिषद", "राजस्थान मंत्रिमंडल"],
    relatedCorpusTopics: ["मुख्यमंत्री", "राज्यपाल", "राज्य प्रशासन", "राज्य विधान मंडल"],
    keywords: [
      "मंत्रिपरिषद", "मंत्रिमंडल", "कैबिनेट", "राज्यमंत्री", "उपमुख्यमंत्री",
      "सामूहिक उत्तरदायित्व", "विभाग", "पोर्टफोलियो", "मंत्रियों", "मंत्रिमंडल सचिवालय"
    ]
  },
  {
    cluster: "polity_governor",
    aliases: ["राज्यपाल", "गवर्नर", "राज्य प्रमुख"],
    corpusTopics: ["राज्यपाल"],
    relatedCorpusTopics: ["राज्य प्रशासन", "राज्य विधान मंडल", "राज्य मंत्रिपरिषद", "मुख्यमंत्री"],
    keywords: [
      "राज्यपाल", "अध्यादेश", "अनुच्छेद 153", "अनुच्छेद 154", "अनुच्छेद 155",
      "अनुच्छेद 156", "अनुच्छेद 161", "अनुच्छेद 163", "अनुच्छेद 213",
      "स्वविवेक", "कार्यकाल", "नियुक्ति", "हस्ताक्षर", "संबोधन", "अभिभाषण"
    ]
  },
  {
    cluster: "polity_cm",
    aliases: ["मुख्यमंत्री", "चीफ मिनिस्टर", "सीएम"],
    corpusTopics: ["मुख्यमंत्री"],
    relatedCorpusTopics: ["राज्य मंत्रिपरिषद", "राजस्थान मंत्रिमंडल", "राज्यपाल", "राज्य प्रशासन"],
    keywords: [
      "मुख्यमंत्री", "कार्यकाल", "नियुक्ति", "प्रथम मुख्यमंत्री",
      "कार्यकारी प्रमुख", "मंत्रिमंडल का प्रमुख"
    ]
  },
  {
    cluster: "polity_panchayati_raj",
    aliases: [
      "पंचायती राज", "पंचायतीराज", "स्थानीय स्वशासन", "स्थानीय स्वायत्त शासन",
      "स्थानीय स्वायत्त शासन एवं पंचायती राज", "नगरीय निकाय", "शहरी निकाय"
    ],
    corpusTopics: ["स्थानीय स्वायत्त शासन एवं पंचायती राज"],
    relatedCorpusTopics: ["जिला प्रशासन"],
    keywords: [
      "पंचायतीराज", "पंचायती राज", "स्थानीय स्वायत्त", "ग्राम पंचायत",
      "पंचायत समिति", "जिला परिषद", "सरपंच", "प्रधान", "जिला प्रमुख",
      "73वां", "74वां", "नगर पालिका", "नगर निगम", "नगर परिषद", "वार्ड पंच"
    ]
  },
  {
    cluster: "polity_judiciary",
    aliases: ["उच्च न्यायालय", "राजस्थान उच्च न्यायालय", "हाई कोर्ट", "अधीनस्थ न्यायालय", "न्यायपालिका"],
    corpusTopics: ["उच्च न्यायालय"],
    relatedCorpusTopics: ["राजस्थान में लोकायुक्त", "राज्य विधिक सेवा प्राधिकरण"],
    keywords: [
      "उच्च न्यायालय", "हाईकोर्ट", "मुख्य न्यायाधीश", "अधीनस्थ न्यायालय",
      "जोधपुर पीठ", "जयपुर पीठ", "न्यायाधीश", "अधिवक्ता", "न्यायिक"
    ]
  },
  {
    cluster: "polity_rpsc",
    aliases: ["राजस्थान लोक सेवा आयोग", "RPSC", "आरपीएससी", "लोक सेवा आयोग"],
    corpusTopics: ["राजस्थान लोक सेवा आयोग"],
    relatedCorpusTopics: ["संवैधानिक आयोग", "राजस्थान राज्य मानवाधिकार आयोग"],
    keywords: ["rpsc", "आरपीएससी", "लोक सेवा आयोग", "अध्यक्ष", "सदस्य", "अनुच्छेद 315"]
  },
  {
    cluster: "polity_commissions",
    aliases: [
      "लोकायुक्त", "राजस्थान में लोकायुक्त", "मानवाधिकार आयोग", "राज्य मानवाधिकार आयोग",
      "राजस्थान राज्य मानवाधिकार आयोग", "राज्य निर्वाचन आयोग", "राजस्थान राज्य निर्वाचन आयोग",
      "सूचना आयोग", "राजस्थान सूचना आयोग", "महिला आयोग", "राजस्थान राज्य महिला आयोग",
      "संवैधानिक आयोग", "राज्य वित्त आयोग"
    ],
    corpusTopics: [
      "राजस्थान में लोकायुक्त", "राजस्थान राज्य मानवाधिकार आयोग",
      "राजस्थान राज्य निर्वाचन आयोग", "राजस्थान सूचना आयोग",
      "राजस्थान राज्य महिला आयोग", "संवैधानिक आयोग"
    ],
    relatedCorpusTopics: ["राज्य प्रशासन"],
    keywords: [
      "लोकायुक्त", "मानवाधिकार आयोग", "निर्वाचन आयोग", "सूचना आयोग",
      "महिला आयोग", "वित्त आयोग", "कार्यकाल", "अध्यक्ष", "सदस्य"
    ]
  },
  {
    cluster: "polity_admin",
    aliases: [
      "राज्य प्रशासन", "जिला प्रशासन", "संभाग", "संभागीय आयुक्त",
      "सचिवालय", "मुख्य सचिव", "राजस्थान के जिले व संभाग"
    ],
    corpusTopics: [
      "राज्य प्रशासन", "जिला प्रशासन", "राजस्थान के जिले व संभाग",
      "राजस्थान लोक सेवा गारंटी अधिनियम 2011", "राजस्‍व मण्‍डल राजस्‍थान"
    ],
    relatedCorpusTopics: ["स्थानीय स्वायत्त शासन एवं पंचायती राज"],
    keywords: [
      "सचिवालय", "मुख्य सचिव", "संभागीय आयुक्त", "संभाग", "जिला कलेक्टर",
      "डीएम", "उपखंड", "तहसील", "पटवारी", "प्रशासनिक"
    ]
  },
  {
    cluster: "geo_drainage",
    aliases: [
      "नदियां", "नदियाँ", "राजस्थान की नदियां", "अपवाह तंत्र", "झीलें",
      "राजस्थान की झीलें", "सिंचाई परियोजनाएं", "राजस्थान की सिंचाई परियोजनाएँ",
      "जल प्रबंधन", "राजस्थान में परंपरागत जल प्रबंधन"
    ],
    corpusTopics: [
      "राजस्थान की नदियां", "राजस्थान की झीलें",
      "राजस्थान की सिंचाई परियोजनाएँ", "राजस्थान में परंपरागत जल प्रबंधन"
    ],
    relatedCorpusTopics: ["राजस्थान का भौतिक स्वरूप"],
    keywords: [
      "अपवाह तंत्र", "नदी", "नदियां", "नदियाँ", "झील", "झीलें", "बांध",
      "सिंचाई", "नहर", "इंदिरा गांधी नहर", "चंबल", "बनास", "लूनी",
      "माही", "बावड़ी", "टांका", "जोहड़", "उद्गम", "सहायक नदी"
    ]
  },
  {
    cluster: "geo_climate",
    aliases: ["जलवायु", "राजस्थान की जलवायु", "मौसम", "वर्षा", "मानसून"],
    corpusTopics: ["राजस्थान की जलवायु"],
    relatedCorpusTopics: ["राजस्थान का भौतिक स्वरूप", "मरुस्थलीकरण"],
    keywords: [
      "जलवायु", "मौसम", "वर्षा", "तापमान", "कोपेन", "थार्नवेट",
      "त्रिवार्था", "आर्द्र", "शुष्क", "अर्धशुष्क", "लू", "मावठ"
    ]
  },
  {
    cluster: "geo_physical",
    aliases: [
      "भौतिक स्वरूप", "राजस्थान का भौतिक स्वरूप", "भौतिक विशेषताएं",
      "राजस्थान की सीमा", "मरुस्थलीकरण"
    ],
    corpusTopics: [
      "राजस्थान का भौतिक स्वरूप", "भौतिक विशेषताएं",
      "राजस्थान की सीमा", "मरुस्थलीकरण"
    ],
    relatedCorpusTopics: ["राजस्थान की जलवायु"],
    keywords: [
      "भौतिक स्वरूप", "अरावली", "थार मरुस्थल", "हाड़ौती", "पूर्वी मैदान",
      "भौतिक प्रदेश", "चोटियां", "दर्रे", "गुरुशिखर", "शेर", "जरगा"
    ]
  },
  {
    cluster: "geo_environment",
    aliases: [
      "वन", "राजस्थान में वन", "प्राकृतिक वनस्पति", "वन्यजीव",
      "राजस्थान में वन्यजीव", "राष्ट्रीय उद्यान", "अभयारण्य"
    ],
    corpusTopics: ["राजस्थान में वन", "राजस्थान में वन्यजीव"],
    relatedCorpusTopics: ["राजस्थान का भौतिक स्वरूप"],
    keywords: [
      "वन", "प्राकृतिक वनस्पति", "वन्यजीव", "राष्ट्रीय उद्यान", "अभयारण्य",
      "रणथंभौर", "सरिस्का", "केवलादेव", "मुकुंदरा", "टाइगर रिजर्व", "खेजड़ी"
    ]
  },
  {
    cluster: "geo_resources",
    aliases: [
      "खनिज", "राजस्थान में खनिज संसाधन", "ऊर्जा संसाधन",
      "राजस्थान के ऊर्जा संसाधन", "उद्योग", "राजस्थान के उद्योग"
    ],
    corpusTopics: ["राजस्थान में खनिज संसाधन", "राजस्थान के ऊर्जा संसाधन", "राजस्थान के उद्योग"],
    relatedCorpusTopics: ["राजस्थान का भौतिक स्वरूप"],
    keywords: [
      "खनिज", "धात्विक", "अधात्विक", "संगमरमर", "तांबा", "सीसा", "जस्ता",
      "ऊर्जा", "सौर ऊर्जा", "पवन ऊर्जा", "थर्मल", "उद्योग", "रीको", "RIICO"
    ]
  },
  {
    cluster: "history_ancient",
    aliases: [
      "प्राचीन सभ्यताएं", "राजस्थान की प्राचीन सभ्यताएँ", "पुरातात्विक स्थल",
      "सभ्यता", "इतिहास जानने के स्त्रोत", "राजस्थान का इतिहास जानने के स्त्रोत"
    ],
    corpusTopics: ["राजस्थान की प्राचीन सभ्यताएँ", "राजस्थान का इतिहास जानने के स्त्रोत"],
    relatedCorpusTopics: ["मेवाड़ का गुहिल वंश"],
    keywords: [
      "सभ्यता", "कालीबंगा", "आहड़", "बैराठ", "गणेश्वर", "गिलूण्ड",
      "बागोर", "उत्खनन", "शिलालेख", "सिक्के", "अभिलेख"
    ]
  },
  {
    cluster: "history_dynasties",
    aliases: [
      "राजवंश", "मेवाड़", "मेवाड़ का गुहिल वंश", "राठौड़ वंश", "मारवाड़",
      "बीकानेर", "चौहान वंश", "आमेर का कछवाहा वंश", "गुर्जर प्रतिहार वंश", "कछवाहा वंश"
    ],
    corpusTopics: [
      "मेवाड़ का गुहिल वंश", "राठौड़ वंश", "चौहान वंश",
      "आमेर का कछवाहा वंश", "गुर्जर प्रतिहार वंश", "राजस्थान के अन्य राजवंश"
    ],
    relatedCorpusTopics: ["राजस्थान का एकीकरण", "राजस्थान के प्रमुख व्यक्तित्व"],
    keywords: [
      "महाराणा प्रताप", "कुंभा", "सांगा", "हल्दीघाटी", "राणा हम्मीर",
      "पृथ्वीराज चौहान", "मानसिंह", "सवाई जयसिंह", "राव जोधा", "राव मालदेव", "चंद्रसेन"
    ]
  },
  {
    cluster: "history_movements",
    aliases: [
      "1857 की क्रांति", "राजस्थान में 1857 की क्रांति", "प्रजामंडल", "प्रजामण्डल",
      "प्रजामंडल आंदोलन", "राजस्थान में प्रजामंडल आंदोलन", "किसान आंदोलन",
      "जनजातीय आंदोलन", "आदिवासी आंदोलन", "राजस्थान में किसान तथा आदिवासी आन्दोलन",
      "स्वतंत्रता संग्राम"
    ],
    corpusTopics: [
      "राजस्थान में 1857 की क्रांति", "राजस्थान में प्रजामंडल आंदोलन",
      "राजस्थान में किसान तथा आदिवासी आन्दोलन", "राजस्थान में स्वतंत्रता आंदोलन के दौरान गठित संगठन"
    ],
    relatedCorpusTopics: ["राजस्थान का एकीकरण", "राजस्थान के प्रमुख व्यक्तित्व"],
    keywords: [
      "1857", "नसीराबाद", "नीमच", "आउवा", "प्रजामंडल", "किसान आंदोलन",
      "बिजोलिया", "बेगू", "गोविंद गिरि", "मोतीलाल तेजावत", "भगत आंदोलन",
      "माणिक्य लाल वर्मा", "विजय सिंह पथिक"
    ]
  },
  {
    cluster: "history_integration",
    aliases: ["एकीकरण", "राजस्थान का एकीकरण"],
    corpusTopics: ["राजस्थान का एकीकरण"],
    relatedCorpusTopics: ["राजस्थान में प्रजामंडल आंदोलन", "राजस्थान के प्रमुख व्यक्तित्व"],
    keywords: [
      "एकीकरण", "मत्स्य संघ", "राजस्थान संघ", "संयुक्त राजस्थान",
      "वृहत् राजस्थान", "चरण", "विलय", "रियासत", "वल्लभभाई पटेल"
    ]
  },
  {
    cluster: "culture_deities",
    aliases: [
      "लोक देवता", "लोक देवियां", "लोक देवता एवं देवियां",
      "राजस्थान में लोक देवता व देवियाँ", "संत", "राजस्थान के प्रमुख संत एवं सम्प्रदाय"
    ],
    corpusTopics: ["राजस्थान में लोक देवता व देवियाँ", "राजस्थान के प्रमुख संत एवं सम्प्रदाय"],
    relatedCorpusTopics: ["राजस्थान के मेले", "राजस्थान में त्यौहार"],
    keywords: [
      "लोकदेवता", "लोक देवता", "रामदेवजी", "तेजाजी", "पाबूजी", "गोगाजी",
      "हड़बूजी", "मेहाजी", "करणी माता", "जीण माता", "संत", "दादू दयाल",
      "जम्भोजी", "जसनाथजी", "मीराबाई", "बिश्नोई", "सम्प्रदाय"
    ]
  },
  {
    cluster: "culture_art_architecture",
    aliases: [
      "स्थापत्य कला", "राजस्थान में स्थापत्य कला", "दुर्ग", "किले", "दुर्ग एवं किले",
      "महल", "हवेलियां", "मंदिर स्थापत्य", "चित्रकला", "चित्र शैलियां",
      "राजस्थान की चित्र शैलियां", "हस्तकला", "हस्तशिल्प", "राजस्थान की हस्तकला / हस्तशिल्प",
      "आभूषण", "वेशभूषा", "राजस्थान के आभूषण एवं वेशभूषा"
    ],
    corpusTopics: [
      "राजस्थान में स्थापत्य कला", "राजस्थान की चित्र शैलियां",
      "राजस्थान की हस्तकला / हस्तशिल्प", "राजस्थान के आभूषण एवं वेशभूषा"
    ],
    relatedCorpusTopics: ["राजस्थान के प्रमुख पर्यटन स्थल", "राजस्थान में पर्यटन स्थल"],
    keywords: [
      "स्थापत्य", "दुर्ग", "किला", "किले", "चित्तौड़गढ़", "कुंभलगढ़", "मेहरानगढ़",
      "महल", "हवेली", "छतरी", "चित्रकला", "मेवाड़ शैली", "मारवाड़ शैली",
      "किशनगढ़", "बणी ठणी", "हस्तशिल्प", "मीनाकारी", "थेवा कला", "ब्लू पॉटरी", "आभूषण"
    ]
  },
  {
    cluster: "culture_music_dance",
    aliases: [
      "नृत्य", "लोकनृत्य", "राजस्थान में नृत्य", "संगीत", "लोकगीत",
      "राजस्थान में संगीत एवं लोकगीत", "मेले", "राजस्थान के मेले",
      "त्योहार", "त्यौहार", "राजस्थान में त्यौहार"
    ],
    corpusTopics: [
      "राजस्थान में नृत्य", "राजस्थान में संगीत एवं लोकगीत",
      "राजस्थान के मेले", "राजस्थान में त्यौहार", "राजस्थान में रीति -रिवाज एवं प्रथाएं"
    ],
    relatedCorpusTopics: [],
    keywords: [
      "नृत्य", "लोकनृत्य", "घूमर", "कालबेलिया", "गैर", "चरी", "अग्नि नृत्य",
      "कच्छी घोड़ी", "संगीत", "लोकगीत", "मांड", "रावणहत्था", "कमायचा",
      "मेले", "त्योहार", "तीज", "गणगौर", "पुष्कर मेला"
    ]
  },
  {
    cluster: "culture_language_lit",
    aliases: [
      "भाषा", "बोली", "राजस्थानी भाषा", "राजस्थानी भाषा एवं बोलियां",
      "साहित्य", "राजस्थानी साहित्य", "मुहावरे", "राजस्थानी मुहावरे,कहावतें और लोकोक्तियाँ",
      "शब्दावली", "राजस्थानी शब्दावली"
    ],
    corpusTopics: [
      "राजस्थानी भाषा एवं बोलियां", "राजस्थानी साहित्य",
      "राजस्थानी मुहावरे,कहावतें और लोकोक्तियाँ", "राजस्थानी शब्दावली"
    ],
    relatedCorpusTopics: [],
    keywords: [
      "भाषा", "बोली", "मारवाड़ी", "मेवाड़ी", "ढूंढाड़ी", "हाड़ौती", "मेवाती",
      "वागड़ी", "साहित्य", "डिंगल", "पिंगल", "रासो", "ख्यात", "बात", "ग्रंथ"
    ]
  }
];

// ─── STAGE 3: Fast In-Memory Index Construction ───────────────────────────────

function ensureIndexesBuilt(): {
  corpus: RawCorpusQuestion[];
  topicIndex: Map<string, number[]>;
  keywordIndex: Map<string, Set<number>>;
} {
  const corpus = getCorpus();
  if (!_normalizedTopicIndex || !_keywordIndex) {
    _normalizedTopicIndex = new Map<string, number[]>();
    _keywordIndex = new Map<string, Set<number>>();

    for (let idx = 0; idx < corpus.length; idx++) {
      const q = corpus[idx];
      const normTopic = normalizeDevanagari(q.topic);
      let tList = _normalizedTopicIndex.get(normTopic);
      if (!tList) {
        tList = [];
        _normalizedTopicIndex.set(normTopic, tList);
      }
      tList.push(idx);

      // Index keywords from topic and question text
      const topicKws = extractKeywords(q.topic);
      const questionKws = extractKeywords(q.question);

      for (const kw of topicKws) {
        let kwSet = _keywordIndex.get(kw);
        if (!kwSet) {
          kwSet = new Set<number>();
          _keywordIndex.set(kw, kwSet);
        }
        kwSet.add(idx);
      }

      for (const kw of questionKws) {
        let kwSet = _keywordIndex.get(kw);
        if (!kwSet) {
          kwSet = new Set<number>();
          _keywordIndex.set(kw, kwSet);
        }
        kwSet.add(idx);
      }
    }
  }

  return {
    corpus,
    topicIndex: _normalizedTopicIndex,
    keywordIndex: _keywordIndex,
  };
}

// ─── STAGE 4: Multi-Signal Scoring Engine ──────────────────────────────────────

interface CandidateScoringContext {
  normQuery: string;
  noSpaceQuery: string;
  headQuery: string;
  queryKeywords: Set<string>;
  targetCorpusTopics: Set<string>;
  relatedCorpusTopics: Set<string>;
  expandedKeywords: Set<string>;
  weights: ScoringWeights;
}

function scoreCandidateQuestion(
  q: RawCorpusQuestion,
  ctx: CandidateScoringContext
): number {
  const normT = normalizeDevanagari(q.topic);
  const normQ = normalizeDevanagari(q.question);
  const { weights } = ctx;

  let topicScore = 0;

  // Exact or normalized topic equality
  if (normT === ctx.normQuery || normT.replace(/\s+/g, "") === ctx.noSpaceQuery) {
    topicScore = weights.exactTopicMatch;
  } else if (ctx.targetCorpusTopics.has(normT)) {
    topicScore = weights.aliasTopicMatch;
  } else if (
    ctx.headQuery.length >= 3 &&
    (normT.includes(ctx.headQuery) || ctx.headQuery.includes(normT))
  ) {
    topicScore = weights.topicSubstringMatch;
  } else if (ctx.relatedCorpusTopics.has(normT)) {
    topicScore = weights.relatedClusterTopicMatch;
  }

  // Question-text relevance
  let questionScore = 0;
  let matchedQueryKws = 0;
  for (const kw of ctx.queryKeywords) {
    if (normQ.includes(kw)) matchedQueryKws++;
  }
  if (matchedQueryKws > 0) {
    questionScore += Math.min(matchedQueryKws * weights.questionQueryKeywordMatch, 60);
  }

  // Exact phrase match in question text
  if (ctx.headQuery.length >= 4 && normQ.includes(ctx.headQuery)) {
    questionScore += weights.questionPhraseMatch;
  }

  // Expanded keywords in question text
  let matchedExpKws = 0;
  for (const kw of ctx.expandedKeywords) {
    if (normQ.includes(kw)) matchedExpKws++;
  }
  if (matchedExpKws > 0) {
    questionScore += Math.min(matchedExpKws * weights.questionExpandedKeywordMatch, 30);
  }

  // Options & explanation keyword signals
  let optScore = 0;
  if (q.options && q.options.length > 0) {
    const optText = normalizeDevanagari(q.options.join(" "));
    for (const kw of ctx.queryKeywords) {
      if (optText.includes(kw)) {
        optScore += weights.optionKeywordMatch;
        break;
      }
    }
  }

  let expScore = 0;
  if (q.explanation) {
    const expText = normalizeDevanagari(q.explanation);
    for (const kw of ctx.queryKeywords) {
      if (expText.includes(kw)) {
        expScore += weights.explanationKeywordMatch;
        break;
      }
    }
  }

  // Quality bonuses
  let qualityBonus = 0;
  if (q.exam && q.exam.trim()) qualityBonus += weights.examQualityBonus;
  if (q.explanation && q.explanation.trim()) qualityBonus += weights.explanationQualityBonus;
  if (q.options && q.options.length === 4) qualityBonus += weights.fourOptionsBonus;

  // Out-of-domain guard:
  // If there is NO topic/alias match (topicScore === 0), require either:
  // (a) an exact phrase match, OR
  // (b) at least 2 distinct query keywords in the question stem.
  // This prevents an accidental single stop/generic word from dragging in noise.
  if (topicScore === 0) {
    const hasPhrase = ctx.headQuery.length >= 4 && normQ.includes(ctx.headQuery);
    if (!hasPhrase && matchedQueryKws < 2) {
      return 0;
    }
  }

  const baseScore = topicScore + questionScore + optScore + expScore;
  return baseScore > 0 ? baseScore + qualityBonus : 0;
}

// ─── STAGE 5: Conceptual Diversity Classifier ─────────────────────────────────

function classifyConceptualAspect(questionText: string): string {
  const norm = normalizeDevanagari(questionText);

  if (/अनुच्छेद|धारा|संविधान|भाग|संशोधन|संवैधानिक|अधिनियम|अध्यादेश|नियम/.test(norm)) {
    return "constitutional_provision";
  }
  if (/नियुक्त|नियुक्ति|चयन|मनोनीत|योग्यता|पात्रता|आयु|शपथ|प्रतिज्ञान|वारंट/.test(norm)) {
    return "appointment_eligibility";
  }
  if (/कार्यकाल|पदावधि|अवधि|त्यागपत्र|इस्तीफा|हटाने|हटाया|पदच्युत|महाभियोग/.test(norm)) {
    return "tenure_removal";
  }
  if (/शक्ति|शक्तियां|शक्तियों|अधिकार|कार्य|कर्तव्य|विशेषाधिकार|स्वविवेक|वीटो|क्षमादान/.test(norm)) {
    return "powers_functions";
  }
  if (/प्रथम|पहला|पहली|वर्तमान|अध्यक्ष|उपाध्यक्ष|स्पीकर|नेता|विपक्ष|प्रोटेम|सचेतक|मुख्य|सचिव/.test(norm)) {
    return "personnel_leadership";
  }
  if (/विधानसभा|परिषद|मंत्रिपरिषद|मंत्रिमंडल|मुख्यमंत्री|राज्यपाल|सचिवालय|हाईकोर्ट|आयोग/.test(norm)) {
    return "institutional_relation";
  }
  if (/कथन|विचार|सत्य|असत्य|सुमेलित|युग्म|कूट|कालक्रम|क्रम/.test(norm)) {
    return "analytical_statements";
  }
  return "general";
}

// ─── STAGE 6: Deduplication & Diversity Selection ─────────────────────────────

function deduplicateAndDiversify(
  candidates: (RawCorpusQuestion & { _score: number })[],
  maxResults: number
): { selected: (RawCorpusQuestion & { _score: number; _aspect: string })[]; duplicatesRemoved: number } {
  const seenStems = new Set<string>();
  const deduped: (RawCorpusQuestion & { _score: number; _aspect: string })[] = [];
  let duplicatesRemoved = 0;

  for (const q of candidates) {
    // Stem normalization for deduplication: strip common prefix phrases
    const stem = normalizeDevanagari(q.question)
      .replace(/^(?:निम्न(?:नलिखित)?\s+(?:में\s+से\s+)?)+/, "")
      .replace(/^(?:राजस्थान\s+(?:में|के|की|का)\s+)+/, "")
      .slice(0, 70);

    if (seenStems.has(stem)) {
      duplicatesRemoved++;
      continue;
    }

    seenStems.add(stem);
    deduped.push({
      ...q,
      _aspect: classifyConceptualAspect(q.question),
    });
  }

  // If results fit in maxResults, return all deduped
  if (deduped.length <= maxResults) {
    return { selected: deduped, duplicatesRemoved };
  }

  // Bucket by conceptual aspect for diversity interleaving
  const aspectBuckets = new Map<string, (RawCorpusQuestion & { _score: number; _aspect: string })[]>();
  for (const q of deduped) {
    let bucket = aspectBuckets.get(q._aspect);
    if (!bucket) {
      bucket = [];
      aspectBuckets.set(q._aspect, bucket);
    }
    bucket.push(q);
  }

  // Select proportionally / round-robin from each aspect to ensure high conceptual diversity
  const diversified: (RawCorpusQuestion & { _score: number; _aspect: string })[] = [];
  const activeAspects = Array.from(aspectBuckets.keys());
  let index = 0;

  while (diversified.length < maxResults && diversified.length < deduped.length) {
    let addedAny = false;
    for (const asp of activeAspects) {
      const bucket = aspectBuckets.get(asp)!;
      if (index < bucket.length) {
        diversified.push(bucket[index]);
        addedAny = true;
        if (diversified.length >= maxResults) break;
      }
    }
    if (!addedAny) break;
    index++;
  }

  return { selected: diversified, duplicatesRemoved };
}

// ─── Main Retrieval Function ──────────────────────────────────────────────────

/**
 * Retrieves the most relevant PYQs from the 17K corpus.
 *
 * Supports passing either:
 *  - A topic string (e.g. "राज्य विधानसभा")
 *  - A structured query object ({ topic, subject, subtopic })
 */
export function getRelevantPyqQuestions(
  query: string | PyqRetrievalQuery,
  options: PyqRetrievalOptions = {}
): PyqRetrievalResult {
  const { maxResults = 100, minScore = 20, weights: customWeights } = options;
  const weights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS, ...customWeights };

  const topicName = typeof query === "string" ? query : query.topic;
  const subtopicName = typeof query === "object" ? query.subtopic : undefined;
  const subjectName = typeof query === "object" ? query.subject : undefined;

  if (!topicName || !topicName.trim()) {
    return {
      questions: [],
      totalFound: 0,
      sent: 0,
      duplicatesRemoved: 0,
      levelUsed: 0,
      retrievalStats: {
        exactTopicMatches: 0,
        aliasMatches: 0,
        relatedMatches: 0,
        questionTextMatches: 0,
        candidatePoolSize: 0,
      },
    };
  }

  const { corpus, topicIndex, keywordIndex } = ensureIndexesBuilt();

  const { norm: normQuery, noSpace: noSpaceQuery, head: headQuery } = getNormalizedVariants(topicName);
  const queryKeywords = extractKeywords(
    `${topicName} ${subtopicName || ""} ${subjectName || ""}`
  );

  const targetCorpusTopics = new Set<string>();
  const relatedCorpusTopics = new Set<string>();
  const expandedKeywords = new Set<string>();

  // 1. Check Topic Ontology for aliases, clusters, and expansions
  for (const entry of TOPIC_ONTOLOGY) {
    let matched = false;
    for (const alias of entry.aliases) {
      const aliasNorm = normalizeDevanagari(alias);
      if (
        aliasNorm === normQuery ||
        aliasNorm.replace(/\s+/g, "") === noSpaceQuery ||
        (headQuery.length >= 3 && (aliasNorm.includes(headQuery) || headQuery.includes(aliasNorm)))
      ) {
        matched = true;
        break;
      }
    }
    if (matched) {
      entry.corpusTopics.forEach((t) => targetCorpusTopics.add(normalizeDevanagari(t)));
      entry.relatedCorpusTopics.forEach((t) => relatedCorpusTopics.add(normalizeDevanagari(t)));
      entry.keywords.forEach((k) => expandedKeywords.add(normalizeDevanagari(k)));
    }
  }

  // 2. Check direct corpus topic index for exact / substring matches
  for (const [normT] of topicIndex.entries()) {
    if (normT === normQuery || normT.replace(/\s+/g, "") === noSpaceQuery) {
      targetCorpusTopics.add(normT);
    } else if (headQuery.length >= 3 && (normT.includes(headQuery) || headQuery.includes(normT))) {
      targetCorpusTopics.add(normT);
    }
  }

  const candidateIndices = new Set<number>();
  const stats = {
    exactTopicMatches: 0,
    aliasMatches: 0,
    relatedMatches: 0,
    questionTextMatches: 0,
    candidatePoolSize: 0,
  };

  // Collect candidates from target topics (Level 1 & Level 2)
  for (const t of targetCorpusTopics) {
    const ids = topicIndex.get(t) || [];
    ids.forEach((idx) => candidateIndices.add(idx));
    stats.exactTopicMatches += ids.length;
  }

  // Collect candidates from related topics (Level 3)
  for (const t of relatedCorpusTopics) {
    const ids = topicIndex.get(t) || [];
    ids.forEach((idx) => candidateIndices.add(idx));
    stats.relatedMatches += ids.length;
  }

  // Collect candidates from question text keywords (Level 4)
  for (const kw of queryKeywords) {
    const ids = keywordIndex.get(kw);
    if (ids) {
      ids.forEach((idx) => candidateIndices.add(idx));
      stats.questionTextMatches += ids.size;
    }
  }

  // Collect candidates from expanded keywords
  for (const kw of expandedKeywords) {
    const ids = keywordIndex.get(kw);
    if (ids) {
      ids.forEach((idx) => candidateIndices.add(idx));
    }
  }

  stats.candidatePoolSize = candidateIndices.size;

  if (candidateIndices.size === 0) {
    return {
      questions: [],
      totalFound: 0,
      sent: 0,
      duplicatesRemoved: 0,
      levelUsed: 0,
      retrievalStats: stats,
    };
  }

  // Determine fallback level used
  let levelUsed = 5;
  if (stats.exactTopicMatches >= 10) levelUsed = 1;
  else if (targetCorpusTopics.size > 0 && stats.exactTopicMatches > 0) levelUsed = 2;
  else if (relatedCorpusTopics.size > 0 && stats.relatedMatches > 0) levelUsed = 3;
  else if (stats.questionTextMatches > 0) levelUsed = 4;
  else levelUsed = 5;

  // Score candidate pool
  const scoringContext: CandidateScoringContext = {
    normQuery,
    noSpaceQuery,
    headQuery,
    queryKeywords,
    targetCorpusTopics,
    relatedCorpusTopics,
    expandedKeywords,
    weights,
  };

  const scored: (RawCorpusQuestion & { _score: number })[] = [];

  for (const idx of candidateIndices) {
    const q = corpus[idx];
    const score = scoreCandidateQuestion(q, scoringContext);
    if (score >= minScore) {
      scored.push({ ...q, _score: score });
    }
  }

  // Stable sort: score desc, then id asc
  scored.sort((a, b) => b._score - a._score || a.id - b.id);

  // Deduplication & Conceptual Diversity
  const { selected, duplicatesRemoved } = deduplicateAndDiversify(scored, maxResults);

  // Enrich with clean options & resolved answer index
  const enriched: PyqQuestion[] = selected.map((q) => {
    const cleanOptions = q.options.map(stripOptionPrefix);
    const answerIndex = resolveAnswerIndex(q.answer, q.options);

    return {
      id: q.id,
      topic: q.topic,
      question: q.question,
      options: cleanOptions,
      answerIndex,
      answerText: q.answer,
      exam: q.exam || "",
      explanation: q.explanation || "",
      _score: q._score,
      _aspect: q._aspect,
    };
  });

  return {
    questions: enriched,
    totalFound: scored.length - duplicatesRemoved,
    sent: enriched.length,
    duplicatesRemoved,
    levelUsed,
    retrievalStats: stats,
  };
}

// ─── STAGE 7: Prompt-Ready Serializer ──────────────────────────────────────────

/**
 * Converts a PyqQuestion array into a concise text block for inclusion
 * in the AI generation prompt.
 */
export function formatPyqsForPrompt(questions: PyqQuestion[]): string {
  if (questions.length === 0) return "";

  const lines: string[] = [];

  questions.forEach((q, idx) => {
    lines.push(`--- PYQ #${idx + 1} (ID: ${q.id}${q.exam ? ` | परीक्षा: ${q.exam}` : ""}) ---`);
    lines.push(`प्रश्न: ${q.question}`);

    q.options.forEach((opt, i) => {
      const marker = ["(A)", "(B)", "(C)", "(D)", "(E)"][i] ?? `(${i + 1})`;
      const isCorrect = i === q.answerIndex;
      lines.push(`  ${marker} ${opt}${isCorrect ? " ✓" : ""}`);
    });

    if (q.explanation) {
      lines.push(`व्याख्या: ${q.explanation}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}
