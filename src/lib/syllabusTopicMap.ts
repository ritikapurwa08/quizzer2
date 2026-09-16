/**
 * Syllabus-to-Corpus Topic Mapping Dictionary
 *
 * Enforces a STRICT CANONICAL BOUNDARY between the user's canonical syllabus
 * (subjects and topics from convex/seed.ts) and the production PYQ corpus
 * (from src/xdata/rajasthan_gk_india_gk_clean_sorted.json).
 *
 * ZERO cross-subject or cross-topic leakage is allowed:
 * - Rajasthan GK topics NEVER match India GK or World GK topics.
 * - Hard subject guard is applied in pyqRetrieval.ts via newCorpusSubject.
 * - No artificial topic names are created.
 */

export interface CanonicalTopicDefinition {
  subjectSlug: string;
  subjectName: string;
  subjectNameHindi: string;
  topicSlug: string;
  topicName: string;
  topicNameHindi: string;
  /**
   * Authoritative subject string in rajasthan_gk_india_gk_clean_sorted.json.
   * "राजस्थान GK" | "India GK" | undefined (for subjects not in new corpus)
   */
  newCorpusSubject?: string;
  /**
   * Exact corpus topic names in rajasthan_gk_india_gk_clean_sorted.json
   * genuinely belonging to this canonical topic.
   * Empty array means no questions in the new corpus for this topic.
   */
  corpusTopics: string[];
}

export const CANONICAL_TOPIC_MAPPINGS: CanonicalTopicDefinition[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Rajasthan Geography & Economy (राजस्थान का भूगोल एवं अर्थव्यवस्था)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "physical-features",
    topicName: "Physical Features",
    topicNameHindi: "भौतिक स्वरूप",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "प्रमुख भू-आकृतिक प्रदेश एवं उनकी विशेषताएं",
      "राजस्थान सामान्य परिचय",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "climate",
    topicName: "Climate",
    topicNameHindi: "जलवायु",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["जलवायु"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "drainage-system",
    topicName: "Drainage System",
    topicNameHindi: "अपवाह तंत्र",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "जल संसाधन",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "natural-vegetation",
    topicName: "Natural Vegetation",
    topicNameHindi: "प्राकृतिक वनस्पति",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "वन एवं प्राकृतिक संसाधन",
      "वन्यजीव एवं जैव-विविधता",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "soils-of-rajasthan",
    topicName: "Soils of Rajasthan",
    topicNameHindi: "राजस्थान की मृदा",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान की मिट्टियाँ",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "agriculture",
    topicName: "Agriculture",
    topicNameHindi: "कृषि",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "कृषि एवं पशुपालन",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "animal-husbandry",
    topicName: "Animal Husbandry",
    topicNameHindi: "पशुपालन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["कृषि एवं पशुपालन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "dairy-development",
    topicName: "Dairy Development",
    topicNameHindi: "डेयरी विकास",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["कृषि एवं पशुपालन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "demographic-characteristics",
    topicName: "Demographic Characteristics",
    topicNameHindi: "जनसांख्यिकी विशेषताएं",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "जनसंख्या एवं जनगणना",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "tribes",
    topicName: "Tribes",
    topicNameHindi: "जनजातियां",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान की जनजातियां"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "industries",
    topicName: "Industries",
    topicNameHindi: "उद्योग",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["उद्योग", "अर्थव्यवस्था एवं उद्योग"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "tourism",
    topicName: "Tourism",
    topicNameHindi: "पर्यटन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["पर्यटन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "major-tourist-places",
    topicName: "Major Tourist Places",
    topicNameHindi: "प्रमुख पर्यटन स्थल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["पर्यटन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "boundaries-of-rajasthan",
    topicName: "Boundaries of Rajasthan",
    topicNameHindi: "राजस्थान की सीमा",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सामान्य परिचय", "प्रमुख भू-आकृतिक प्रदेश एवं उनकी विशेषताएं"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "desertification",
    topicName: "Desertification",
    topicNameHindi: "मरुस्थलीकरण",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "पर्यावरणीय एवं पारिस्थितिकीय परिवर्तन एवं इनके प्रभाव",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "traditional-water-management",
    topicName: "Traditional Water Management",
    topicNameHindi: "राजस्थान में परंपरागत जल प्रबंधन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["परंपरागत जल प्रबंधन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "cooperatives-in-rajasthan",
    topicName: "Cooperatives in Rajasthan",
    topicNameHindi: "राजस्थान में सहकारिता",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान में सहकारिता"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Rajasthan History (राजस्थान का इतिहास)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "sources-of-rajasthan-history",
    topicName: "Sources of Rajasthan History",
    topicNameHindi: "राजस्थान का इतिहास जानने के स्त्रोत",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान का इतिहास जानने के स्त्रोत"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "ancient-culture-civilization",
    topicName: "Ancient Culture & Civilization",
    topicNameHindi: "प्राचीन संस्कृति एवं सभ्यता",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान की प्राचीन सभ्यताएँ",
      "राजस्थान के प्रागैतिहासिक स्थल-पुरापाषाण से ताम्र पाषाण एवं कांस्य युग तक",
      "ऐतिहासिक राजस्थान:-प्रारम्भिक ईस्वी काल के महत्वपूर्ण ऐतिहासिक केन्द्र। प्राचीन राजस्थान में समाज, धर्म एवं संस्कृति।",
      "महाजनपद काल में राजस्थान",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "archaeological-sites-and-their-importance",
    topicName: "Archaeological Sites and Their Importance",
    topicNameHindi: "पुरातात्विक स्थल एवं उनका महत्व",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान की प्राचीन सभ्यताएँ",
      "राजस्थान के प्रागैतिहासिक स्थल-पुरापाषाण से ताम्र पाषाण एवं कांस्य युग तक",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "history-of-rajasthan-up-to-the-18th-century",
    topicName: "History of Rajasthan up to the 18th Century",
    topicNameHindi: "18वीं शताब्दी तक राजस्थान का इतिहास",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान के राजवंश एवं इतिहास",
      "राजपूत युग",
      "राजस्थान का इतिहास जानने के स्त्रोत",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rajput-states",
    topicName: "Rajput States",
    topicNameHindi: "राजपूत राज्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजपूत युग",
      "राजस्थान के राजवंश एवं इतिहास",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "relations-with-delhi-sultanate",
    topicName: "Relations with Delhi Sultanate",
    topicNameHindi: "दिल्ली सल्तनत के साथ संबंध",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "रियासतें एवं ब्रिटिश काल"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "mewar",
    topicName: "Mewar",
    topicNameHindi: "मेवाड़",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "ranthambore",
    topicName: "Ranthambore",
    topicNameHindi: "रणथंभौर",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "jalore",
    topicName: "Jalore",
    topicNameHindi: "जालौर",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rajasthan-and-the-mughals",
    topicName: "Rajasthan and the Mughals",
    topicNameHindi: "राजस्थान एवं मुगल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "रियासतें एवं ब्रिटिश काल"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "maharana-sanga",
    topicName: "Maharana Sanga",
    topicNameHindi: "महाराणा सांगा",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "maharana-pratap",
    topicName: "Maharana Pratap",
    topicNameHindi: "महाराणा प्रताप",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "raja-man-singh",
    topicName: "Raja Man Singh",
    topicNameHindi: "राजा मानसिंह",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "chandrasen-rathore",
    topicName: "Chandrasen Rathore",
    topicNameHindi: "राव चंद्रसेन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rai-singh",
    topicName: "Rai Singh",
    topicNameHindi: "रायसिंह",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "raj-singh",
    topicName: "Raj Singh",
    topicNameHindi: "राजसिंह",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के राजवंश एवं इतिहास", "राजपूत युग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "freedom-struggle-in-rajasthan",
    topicName: "Freedom Struggle in Rajasthan",
    topicNameHindi: "राजस्थान में स्वतंत्रता संग्राम",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान का स्वतंत्रता आंदोलन",
      "आधुनिक राजस्थान एवं एकीकरण",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "revolt-of-1857",
    topicName: "Revolt of 1857",
    topicNameHindi: "1857 की क्रांति",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान का स्वतंत्रता आंदोलन", "रियासतें एवं ब्रिटिश काल"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "political-awakening",
    topicName: "Political Awakening",
    topicNameHindi: "राजनीतिक चेतना",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान का स्वतंत्रता आंदोलन",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "prajamandal-movement",
    topicName: "Prajamandal Movement",
    topicNameHindi: "प्रजामण्डल आंदोलन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान में प्रजामंडल आंदोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "peasant-movements",
    topicName: "Peasant Movements",
    topicNameHindi: "किसान आंदोलन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान का स्वतंत्रता आंदोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "tribal-movements",
    topicName: "Tribal Movements",
    topicNameHindi: "जनजातीय आंदोलन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान का स्वतंत्रता आंदोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "integration-of-rajasthan",
    topicName: "Integration of Rajasthan",
    topicNameHindi: "राजस्थान का एकीकरण",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["आधुनिक राजस्थान एवं एकीकरण"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "important-personalities-of-rajasthan",
    topicName: "Important Personalities of Rajasthan",
    topicNameHindi: "राजस्थान के प्रमुख व्यक्तित्व",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के व्यक्तित्व"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Rajasthan Art, Culture & Society (राजस्थान की कला, संस्कृति एवं समाज)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-deities",
    topicName: "Folk Deities",
    topicNameHindi: "लोक देवता एवं देवियां",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["धर्म, संत एवं लोक देवता"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "saints-of-rajasthan",
    topicName: "Saints of Rajasthan",
    topicNameHindi: "राजस्थान के संत",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["धर्म, संत एवं लोक देवता"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "temple-architecture",
    topicName: "Temple Architecture",
    topicNameHindi: "मंदिर स्थापत्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["स्थापत्य कला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "architecture",
    topicName: "Architecture",
    topicNameHindi: "स्थापत्य कला",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["स्थापत्य कला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "painting-schools",
    topicName: "Painting Schools",
    topicNameHindi: "चित्रकला शैलियां",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["चित्रकला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "fairs",
    topicName: "Fairs",
    topicNameHindi: "मेले",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के मेले"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "festivals",
    topicName: "Festivals",
    topicNameHindi: "त्योहार",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान में त्यौहार"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "customs-traditions",
    topicName: "Customs & Traditions",
    topicNameHindi: "रीति-रिवाज एवं परंपराएं",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान में रीति -रिवाज एवं प्रथाएं",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "dresses",
    topicName: "Dresses",
    topicNameHindi: "वेशभूषा",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "हस्तशिल्प, वेशभूषा एवं आभूषण",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "ornaments",
    topicName: "Ornaments",
    topicNameHindi: "आभूषण",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["हस्तशिल्प, वेशभूषा एवं आभूषण"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "handicrafts",
    topicName: "Handicrafts",
    topicNameHindi: "हस्तशिल्प",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["हस्तशिल्प, वेशभूषा एवं आभूषण"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-music",
    topicName: "Folk Music",
    topicNameHindi: "लोक संगीत",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["लोक कला एवं संगीत"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-dance",
    topicName: "Folk Dance",
    topicNameHindi: "लोक नृत्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["लोक कला एवं संगीत"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-theatre",
    topicName: "Folk Theatre",
    topicNameHindi: "लोक नाट्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["लोक कला एवं संगीत"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "language",
    topicName: "Language",
    topicNameHindi: "बोली एवं भाषा",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "भाषा एवं साहित्य",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "literature",
    topicName: "Literature",
    topicNameHindi: "साहित्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "भाषा एवं साहित्य",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "major-cultural-event-venues",
    topicName: "Major Cultural Event Venues",
    topicNameHindi: "राजस्थान के प्रमुख सांस्कृतिक कार्यक्रम स्थल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के प्रमुख सांस्कृतिक कार्यक्रम स्थल"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Rajasthan Polity & Administration (राजस्थान की राजव्यवस्था)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "governor",
    topicName: "Governor",
    topicNameHindi: "राज्यपाल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य शासन एवं प्रशासन"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "chief-minister-council-of-ministers",
    topicName: "Chief Minister & Council of Ministers",
    topicNameHindi: "मुख्यमंत्री एवं मंत्रिपरिषद",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान मंत्रिमंडल",
      "राज्य शासन एवं प्रशासन",
    ],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "state-legislature",
    topicName: "State Legislature",
    topicNameHindi: "राज्य विधानमंडल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य विधान मंडल"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-high-court-subordinate-courts",
    topicName: "Rajasthan High Court & Subordinate Courts",
    topicNameHindi: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायालय",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राज्य शासन एवं प्रशासन",
    ],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "panchayati-raj",
    topicName: "Panchayati Raj",
    topicNameHindi: "पंचायती राज",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["स्थानीय शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "urban-local-government",
    topicName: "Urban Local Government",
    topicNameHindi: "नगरीय निकाय",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["स्थानीय शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "state-secretariat",
    topicName: "State Secretariat",
    topicNameHindi: "राज्य सचिवालय",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य शासन एवं प्रशासन"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "divisional-commissioner",
    topicName: "Divisional Commissioner",
    topicNameHindi: "संभाग आयुक्त",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य शासन एवं प्रशासन", "राजस्थान सामान्य परिचय"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "district-administration",
    topicName: "District Administration",
    topicNameHindi: "जिला प्रशासन",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य शासन एवं प्रशासन"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-public-service-commission-rpsc",
    topicName: "Rajasthan Public Service Commission (RPSC)",
    topicNameHindi: "राजस्थान लोक सेवा आयोग (RPSC)",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य आयोग एवं संस्थाएँ"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-state-womens-commission",
    topicName: "Rajasthan State Women's Commission",
    topicNameHindi: "राज्य महिला आयोग",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान राज्य महिला आयोग", "राज्य आयोग एवं संस्थाएँ"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-state-finance-commission",
    topicName: "Rajasthan State Finance Commission",
    topicNameHindi: "राज्य वित्त आयोग",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य आयोग एवं संस्थाएँ", "स्थानीय शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-state-election-commission",
    topicName: "Rajasthan State Election Commission",
    topicNameHindi: "राज्य निर्वाचन आयोग",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य आयोग एवं संस्थाएँ"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "lokayukta",
    topicName: "Lokayukta",
    topicNameHindi: "लोकायुक्त",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य आयोग एवं संस्थाएँ"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-state-legal-services-authority",
    topicName: "Rajasthan State Legal Services Authority",
    topicNameHindi: "राज्य विधिक सेवा प्राधिकरण",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["लोक नीति, विधिक अधिकार एवं नागरिक अधिकार–पत्र"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "local-self-government-panchayati-raj",
    topicName: "Local Self Government & Panchayati Raj",
    topicNameHindi: "स्थानीय स्वायत्त शासन एवं पंचायती राज",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["स्थानीय शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-public-service-guarantee-act-2011",
    topicName: "Rajasthan Public Service Guarantee Act 2011",
    topicNameHindi: "राजस्थान लोक सेवा गारंटी अधिनियम 2011",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राज्य शासन एवं प्रशासन"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "board-of-revenue-rajasthan",
    topicName: "Board of Revenue Rajasthan",
    topicNameHindi: "राजस्‍व मण्‍डल राजस्‍थान",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्‍व मण्‍डल राजस्‍थान"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था",
    topicSlug: "rajasthan-contribution-to-constitution-making",
    topicName: "Rajasthan Contribution to Constitution Making",
    topicNameHindi: "संविधान निर्माण में राजस्थान का योगदान",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सामान्य ज्ञान"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Rajasthan Current Affairs (राजस्थान समसामयिकी)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "important-personalities",
    topicName: "Important Personalities",
    topicNameHindi: "प्रमुख व्यक्तित्व",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान के व्यक्तित्व"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "important-places",
    topicName: "Important Places",
    topicNameHindi: "प्रमुख स्थान",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सामान्य परिचय", "राजस्थान सामान्य ज्ञान"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "current-issues",
    topicName: "Current Issues",
    topicNameHindi: "समसामयिक मुद्दे",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "welfare-schemes",
    topicName: "Welfare Schemes",
    topicNameHindi: "कल्याणकारी योजनाएं",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: [
      "राजस्थान सरकार, योजनाएँ एवं बजट",
      "एक जिला एक उत्पाद योजना राजस्थान",
    ],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "development-schemes",
    topicName: "Development Schemes",
    topicNameHindi: "विकास योजनाएं",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["प्रमुख विकास परियोजनाएँ", "राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "government-initiatives",
    topicName: "Government Initiatives",
    topicNameHindi: "शासकीय पहल",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-scenario",
    topicName: "Economic Scenario",
    topicNameHindi: "आर्थिक परिदृश्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["अर्थव्यवस्था एवं उद्योग", "राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "political-scenario",
    topicName: "Political Scenario",
    topicNameHindi: "राजनीतिक परिदृश्य",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "sports",
    topicName: "Sports",
    topicNameHindi: "खेलकूद",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान खेल"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "awards",
    topicName: "Awards",
    topicNameHindi: "पुरस्कार एवं सम्मान",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "books",
    topicName: "Books",
    topicNameHindi: "प्रमुख पुस्तकें",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["भाषा एवं साहित्य"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "authors",
    topicName: "Authors",
    topicNameHindi: "लेखक",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["भाषा एवं साहित्य"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "sports-and-players-of-rajasthan",
    topicName: "Sports and Players of Rajasthan",
    topicNameHindi: "राजस्थान के खेल व खिलाड़ी",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान खेल"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "development-of-science-technology",
    topicName: "Development of Science & Technology",
    topicNameHindi: "राजस्थान में विज्ञान और प्रौद्योगिकी का विकास",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान विज्ञान एवं प्रौद्योगिकी"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "one-district-one-product-scheme",
    topicName: "One District One Product Scheme",
    topicNameHindi: "एक जिला एक उत्पाद योजना राजस्थान",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["एक जिला एक उत्पाद योजना राजस्थान"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "regional-programs-in-rajasthan",
    topicName: "Regional Programs in Rajasthan",
    topicNameHindi: "राजस्थान में क्षेत्रीय कार्यक्रम",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान में क्षेत्रीय कार्यक्रम"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "rajasthan-budget-2025-26",
    topicName: "Rajasthan Budget 2025-26",
    topicNameHindi: "राजस्थान बजट 2025-26",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-review-2024-25",
    topicName: "Economic Review 2024-25",
    topicNameHindi: "आर्थिक समीक्षा 2024-25",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "rajasthan-budget-2026-27",
    topicName: "Rajasthan Budget 2026-27",
    topicNameHindi: "राजस्थान बजट 2026-27",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-review-2025-26",
    topicName: "Economic Review 2025-26",
    topicNameHindi: "आर्थिक समीक्षा 2025-26",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "major-policies-of-rajasthan-government",
    topicName: "Major Policies of Rajasthan Government",
    topicNameHindi: "राजस्थान सरकार की प्रमुख नीतियां",
    newCorpusSubject: "राजस्थान GK",
    corpusTopics: ["राजस्थान सरकार, योजनाएँ एवं बजट"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. World General Knowledge (विश्व का सामान्य ज्ञान)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "world-gk",
    subjectName: "World General Knowledge",
    subjectNameHindi: "विश्व का सामान्य ज्ञान",
    topicSlug: "world-geography-continents",
    topicName: "World Geography - Continents",
    topicNameHindi: "विश्व भूगोल - महाद्वीप",
    // World GK is not in the new production corpus — retrieval returns 0 results
    corpusTopics: [],
  },
  {
    subjectSlug: "world-gk",
    subjectName: "World General Knowledge",
    subjectNameHindi: "विश्व का सामान्य ज्ञान",
    topicSlug: "world-geography-oceans",
    topicName: "World Geography - Oceans",
    topicNameHindi: "विश्व भूगोल - महासागर",
    corpusTopics: [],
  },
  {
    subjectSlug: "world-gk",
    subjectName: "World General Knowledge",
    subjectNameHindi: "विश्व का सामान्य ज्ञान",
    topicSlug: "world-geography-global-wind-system",
    topicName: "World Geography - Global Wind System",
    topicNameHindi: "विश्व भूगोल - पवन तंत्र",
    corpusTopics: [],
  },
  {
    subjectSlug: "world-gk",
    subjectName: "World General Knowledge",
    subjectNameHindi: "विश्व का सामान्य ज्ञान",
    topicSlug: "world-geography-environmental-problems",
    topicName: "World Geography - Environmental Problems",
    topicNameHindi: "विश्व भूगोल - पर्यावरणीय समस्याएं",
    corpusTopics: [],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. India General Knowledge (भारत का सामान्य ज्ञान)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "india-gk",
    subjectName: "India General Knowledge",
    subjectNameHindi: "भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-physical-features",
    topicName: "India Geography - Physical Features",
    topicNameHindi: "भारत भूगोल - भौतिक स्वरूप",
    newCorpusSubject: "India GK",
    corpusTopics: [
      "भौतिक भूगोल",
      "प्रमुख भू-आकृतिक प्रदेश एवं उनकी विशेषताएं",
    ],
  },
  {
    subjectSlug: "india-gk",
    subjectName: "India General Knowledge",
    subjectNameHindi: "भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-climate",
    topicName: "India Geography - Climate",
    topicNameHindi: "भारत भूगोल - जलवायु",
    newCorpusSubject: "India GK",
    corpusTopics: ["जलवायु"],
  },
  {
    subjectSlug: "india-gk",
    subjectName: "India General Knowledge",
    subjectNameHindi: "भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-monsoon-system",
    topicName: "India Geography - Monsoon System",
    topicNameHindi: "भारत भूगोल - मानसून तंत्र",
    newCorpusSubject: "India GK",
    corpusTopics: ["जलवायु"],
  },
  {
    subjectSlug: "india-gk",
    subjectName: "India General Knowledge",
    subjectNameHindi: "भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-drainage-system",
    topicName: "India Geography - Drainage System",
    topicNameHindi: "भारत भूगोल - अपवाह तंत्र",
    newCorpusSubject: "India GK",
    corpusTopics: ["जल संसाधन"],
  },
  {
    subjectSlug: "india-gk",
    subjectName: "India General Knowledge",
    subjectNameHindi: "भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-natural-vegetation",
    topicName: "India Geography - Natural Vegetation",
    topicNameHindi: "भारत भूगोल - प्राकृतिक वनस्पति",
    newCorpusSubject: "India GK",
    corpusTopics: ["वन एवं प्राकृतिक संसाधन", "वन्यजीव एवं जैव-विविधता"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Indian Polity & Foreign Policy (भारतीय राजव्यवस्था एवं विदेश नीति)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "constituent-assembly",
    topicName: "Constituent Assembly",
    topicNameHindi: "संविधान सभा",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "president",
    topicName: "President",
    topicNameHindi: "राष्ट्रपति",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "prime-minister",
    topicName: "Prime Minister",
    topicNameHindi: "प्रधानमंत्री",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "parliament",
    topicName: "Parliament",
    topicNameHindi: "संसद",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "supreme-court",
    topicName: "Supreme Court",
    topicNameHindi: "उच्चतम न्यायालय",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "election-commission",
    topicName: "Election Commission",
    topicNameHindi: "भारत निर्वाचन आयोग",
    newCorpusSubject: "India GK",
    corpusTopics: ["भारतीय संविधान एवं राजव्यवस्था", "भारतीय राजव्यवस्था एवं संस्थाएँ"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Educational Psychology (शिक्षा मनोविज्ञान)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "educational-psychology",
    subjectName: "Educational Psychology",
    subjectNameHindi: "शिक्षा मनोविज्ञान",
    topicSlug: "educational-psychology-meaning-scope",
    topicName: "Educational Psychology - Meaning & Scope",
    topicNameHindi: "शिक्षा मनोविज्ञान - अर्थ एवं क्षेत्र",
    // Educational Psychology is not in the new production corpus — retrieval returns 0 results
    corpusTopics: [],
  },
];

/**
 * Normalizes query string for slug or match checking
 */
export function normalizeKey(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "");
}

function checkSubjectMatch(def: CanonicalTopicDefinition, normSubj: string): boolean {
  if (!normSubj) return true;
  const slugNorm = normalizeKey(def.subjectSlug);
  const engNorm = normalizeKey(def.subjectName);
  const hindiNorm = normalizeKey(def.subjectNameHindi);

  if (slugNorm === normSubj || engNorm === normSubj || hindiNorm === normSubj) {
    return true;
  }

  if (normSubj.length >= 4) {
    if (hindiNorm.includes(normSubj) || normSubj.includes(hindiNorm)) return true;
    if (engNorm.includes(normSubj) || normSubj.includes(engNorm)) return true;
    if (slugNorm.includes(normSubj) || normSubj.includes(slugNorm)) return true;
  }

  return false;
}

/**
 * Finds the canonical topic definition that matches the selected subject & topic.
 */
export function resolveCanonicalTopic(
  subjectNameOrSlug: string,
  topicNameOrSlug: string
): CanonicalTopicDefinition | null {
  const normSubj = normalizeKey(subjectNameOrSlug);
  const normTopic = normalizeKey(topicNameOrSlug);

  if (!normTopic) return null;

  // 1. Direct exact match (within matching subject)
  for (const def of CANONICAL_TOPIC_MAPPINGS) {
    if (!checkSubjectMatch(def, normSubj)) continue;

    const slugNorm = normalizeKey(def.topicSlug);
    const engNorm = normalizeKey(def.topicName);
    const hindiNorm = normalizeKey(def.topicNameHindi);

    if (slugNorm === normTopic || engNorm === normTopic || hindiNorm === normTopic) {
      return def;
    }
  }

  // 2. Partial / containment match (within matching subject)
  for (const def of CANONICAL_TOPIC_MAPPINGS) {
    if (!checkSubjectMatch(def, normSubj)) continue;

    const defTopicHindiNorm = normalizeKey(def.topicNameHindi);
    const defTopicEngNorm = normalizeKey(def.topicName);

    if (
      (normTopic.length >= 3 && defTopicHindiNorm.includes(normTopic)) ||
      (defTopicHindiNorm.length >= 3 && normTopic.includes(defTopicHindiNorm)) ||
      (normTopic.length >= 3 && defTopicEngNorm.includes(normTopic)) ||
      (defTopicEngNorm.length >= 3 && normTopic.includes(defTopicEngNorm))
    ) {
      return def;
    }
  }

  return null;
}

/**
 * Returns the list of authorized corpus topics for a given canonical subject and topic.
 */
export function getCorpusTopicsForCanonical(
  subjectNameOrSlug: string,
  topicNameOrSlug: string
): string[] {
  const resolved = resolveCanonicalTopic(subjectNameOrSlug, topicNameOrSlug);
  return resolved ? resolved.corpusTopics : [];
}

