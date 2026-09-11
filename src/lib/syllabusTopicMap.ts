/**
 * Syllabus-to-Corpus Topic Mapping Dictionary
 *
 * Enforces a STRICT CANONICAL BOUNDARY between the user's canonical syllabus
 * (subjects and topics from convex/seed.ts) and the 26,151 question corpus
 * (from src/xdata/rajasthan_pyq_merged_26151.json).
 *
 * ZERO cross-subject or cross-topic leakage is allowed:
 * - Rajasthan Geography topics NEVER match World/India topics.
 * - Rajasthan Rivers NEVER match World Rivers or India Rivers.
 * - No artificial topic names are created.
 */

export interface CanonicalTopicDefinition {
  subjectSlug: string;
  subjectName: string;
  subjectNameHindi: string;
  topicSlug: string;
  topicName: string;
  topicNameHindi: string;
  /** Exact corpus topic names in rajasthan_pyq_merged_26151.json genuinely belonging to this topic */
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
    corpusTopics: [
      "राजस्थान का भौतिक स्वरूप",
      "भौतिक विशेषताएं",
      "राजस्थान की स्थिति एवं विस्तार",
      "राजस्थान के भौतिक प्रदेश",
      "भौतिक स्वरूप",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "climate",
    topicName: "Climate",
    topicNameHindi: "जलवायु",
    corpusTopics: ["राजस्थान की जलवायु", "जलवायु"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "drainage-system",
    topicName: "Drainage System",
    topicNameHindi: "अपवाह तंत्र",
    corpusTopics: [
      "राजस्थान की नदियां",
      "राजस्थान की झीलें",
      "राजस्थान की नदियां व झीलें",
      "अपवाह तंत्र",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "natural-vegetation",
    topicName: "Natural Vegetation",
    topicNameHindi: "प्राकृतिक वनस्पति",
    corpusTopics: [
      "राजस्थान में वन",
      "राजस्थान में वन्यजीव",
      "प्राकृतिक वनस्पति",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "agriculture",
    topicName: "Agriculture",
    topicNameHindi: "कृषि",
    corpusTopics: [
      "राजस्थान में कृषि",
      "कृषि",
      "प्रमुख फसलें –गेहूँ, मक्का, जौ, कपास, गन्ना एवं बाजरा",
      "कृषि के प्रकार",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "animal-husbandry",
    topicName: "Animal Husbandry",
    topicNameHindi: "पशुपालन",
    corpusTopics: ["राजस्थान में पशुपालन", "पशुपालन", "राजस्थान में पशु संपदा"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "dairy-development",
    topicName: "Dairy Development",
    topicNameHindi: "डेयरी विकास",
    corpusTopics: ["डेयरी विकास", "राजस्थान में पशुपालन"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "demographic-characteristics",
    topicName: "Demographic Characteristics",
    topicNameHindi: "जनसांख्यिकी विशेषताएं",
    corpusTopics: [
      "राजस्थान जनगणना व साक्षरता - 2011",
      "जनगणना",
      "जनसांख्यिकी विशेषताएं",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "tribes",
    topicName: "Tribes",
    topicNameHindi: "जनजातियां",
    corpusTopics: ["राजस्थान की जनजातियाँ", "जनजातियां"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "industries",
    topicName: "Industries",
    topicNameHindi: "उद्योग",
    corpusTopics: ["राजस्थान के उद्योग", "उद्योग", "प्रमुख औद्योगिक प्रदेश"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "tourism",
    topicName: "Tourism",
    topicNameHindi: "पर्यटन",
    corpusTopics: ["राजस्थान में पर्यटन स्थल", "पर्यटन", "पर्यटन स्थल एवं परिपथ"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "major-tourist-places",
    topicName: "Major Tourist Places",
    topicNameHindi: "प्रमुख पर्यटन स्थल",
    corpusTopics: ["राजस्थान में पर्यटन स्थल", "प्रमुख पर्यटन स्थल", "पर्यटन स्थल एवं परिपथ"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "boundaries-of-rajasthan",
    topicName: "Boundaries of Rajasthan",
    topicNameHindi: "राजस्थान की सीमा",
    corpusTopics: ["राजस्थान की सीमा", "राजस्थान की स्थिति एवं विस्तार", "राजस्थान का भौतिक स्वरूप"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "desertification",
    topicName: "Desertification",
    topicNameHindi: "मरुस्थलीकरण",
    corpusTopics: [
      "मरुस्थलीकरण",
      "पर्यावरणीय मुद्दे–मरुस्थलीयकरण, वनोन्मूलन, जलवायु परिवर्तन एवं ग्लोबल वार्मिंग (ऊष्मीकरण), ओजन अवक्षय",
      "राजस्थान का भौतिक स्वरूप",
    ],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "traditional-water-management",
    topicName: "Traditional Water Management",
    topicNameHindi: "राजस्थान में परंपरागत जल प्रबंधन",
    corpusTopics: ["राजस्थान में परंपरागत जल प्रबंधन", "राजस्थान की सिंचाई परियोजनाएँ"],
  },
  {
    subjectSlug: "rajasthan-geography-economy",
    subjectName: "Rajasthan Geography & Economy",
    subjectNameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    topicSlug: "cooperatives-in-rajasthan",
    topicName: "Cooperatives in Rajasthan",
    topicNameHindi: "राजस्थान में सहकारिता",
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
    corpusTopics: ["राजस्थान का इतिहास जानने के स्त्रोत", "राजस्थान के इतिहास के स्रोत"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "ancient-culture-civilization",
    topicName: "Ancient Culture & Civilization",
    topicNameHindi: "प्राचीन संस्कृति एवं सभ्यता",
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
    corpusTopics: [
      "प्रमुख राजवंशों के महत्वपूर्ण शासकों की राजनीतिक एवं सांस्कृतिक उपलब्धियाँ–गुहिल, प्रतिहार, चौहान, परमार, राठौड़, सिसोदिया और कच्छावा। मध्यकालीन राजस्थान में प्रशासनिक तथा राजस्व व्यवस्था।",
      "राजपूत युग",
      "राजस्थान के अन्य राजवंश",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rajput-states",
    topicName: "Rajput States",
    topicNameHindi: "राजपूत राज्य",
    corpusTopics: [
      "राजपूत युग",
      "प्रमुख राजवंशों के महत्वपूर्ण शासकों की राजनीतिक एवं सांस्कृतिक उपलब्धियाँ–गुहिल, प्रतिहार, चौहान, परमार, राठौड़, सिसोदिया और कच्छावा। मध्यकालीन राजस्थान में प्रशासनिक तथा राजस्व व्यवस्था।",
      "राजस्थान के अन्य राजवंश",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "relations-with-delhi-sultanate",
    topicName: "Relations with Delhi Sultanate",
    topicNameHindi: "दिल्ली सल्तनत के साथ संबंध",
    corpusTopics: ["सल्तनतकाल:-प्रमुख सल्तनत शासकों की उपलब्धियाँ। विजयनगर की सांस्कृतिक उपलब्धियाँ।", "मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "mewar",
    topicName: "Mewar",
    topicNameHindi: "मेवाड़",
    corpusTopics: ["मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "ranthambore",
    topicName: "Ranthambore",
    topicNameHindi: "रणथंभौर",
    corpusTopics: ["चौहान वंश", "राजस्थान के प्रमुख दुर्ग"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "jalore",
    topicName: "Jalore",
    topicNameHindi: "जालौर",
    corpusTopics: ["चौहान वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rajasthan-and-the-mughals",
    topicName: "Rajasthan and the Mughals",
    topicNameHindi: "राजस्थान एवं मुगल",
    corpusTopics: ["मुगल साम्राज्य:-राजपूत राज्यों के साथ संबंध।", "मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "maharana-sanga",
    topicName: "Maharana Sanga",
    topicNameHindi: "महाराणा सांगा",
    corpusTopics: ["मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "maharana-pratap",
    topicName: "Maharana Pratap",
    topicNameHindi: "महाराणा प्रताप",
    corpusTopics: ["मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "raja-man-singh",
    topicName: "Raja Man Singh",
    topicNameHindi: "राजा मानसिंह",
    corpusTopics: ["कच्छावा वंश", "प्रमुख राजवंशों के महत्वपूर्ण शासकों की राजनीतिक एवं सांस्कृतिक उपलब्धियाँ–गुहिल, प्रतिहार, चौहान, परमार, राठौड़, सिसोदिया और कच्छावा। मध्यकालीन राजस्थान में प्रशासनिक तथा राजस्व व्यवस्था।"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "chandrasen-rathore",
    topicName: "Chandrasen Rathore",
    topicNameHindi: "राव चंद्रसेन",
    corpusTopics: ["राठौड़ वंश", "मारवाड़ का राठौड़ वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "rai-singh",
    topicName: "Rai Singh",
    topicNameHindi: "रायसिंह",
    corpusTopics: ["राठौड़ वंश", "बीकानेर का राठौड़ वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "raj-singh",
    topicName: "Raj Singh",
    topicNameHindi: "राजसिंह",
    corpusTopics: ["मेवाड़ का गुहिल वंश"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "freedom-struggle-in-rajasthan",
    topicName: "Freedom Struggle in Rajasthan",
    topicNameHindi: "राजस्थान में स्वतंत्रता संग्राम",
    corpusTopics: [
      "राजस्थान में 1857 की क्रांति",
      "राजस्थान में स्वतंत्रता आंदोलन के दौरान गठित संगठन",
      "आधुनिक राजस्थान का उदय:-१९वीं–२०वीं शताब्दी के दौरान राजस्थान में सामाजिक जागृति के कारक। राजनीतिक जागरण:-समाचार पत्रों एवं राजनीतिक संस्थाओं की भूमिका। २०वीं शताब्दी में जनजाति तथा किसान आन्दोलन, २०वीं शताब्दी के दौरान विभिन्न देशी रियासतों में प्रजामण्डल आन्दोलन। राजस्थान का एकीकरण।",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "revolt-of-1857",
    topicName: "Revolt of 1857",
    topicNameHindi: "1857 की क्रांति",
    corpusTopics: ["राजस्थान में 1857 की क्रांति"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "political-awakening",
    topicName: "Political Awakening",
    topicNameHindi: "राजनीतिक चेतना",
    corpusTopics: [
      "राजस्थान में स्वतंत्रता आंदोलन के दौरान गठित संगठन",
      "आधुनिक राजस्थान का उदय:-१९वीं–२०वीं शताब्दी के दौरान राजस्थान में सामाजिक जागृति के कारक। राजनीतिक जागरण:-समाचार पत्रों एवं राजनीतिक संस्थाओं की भूमिका। २०वीं शताब्दी में जनजाति तथा किसान आन्दोलन, २०वीं शताब्दी के दौरान विभिन्न देशी रियासतों में प्रजामण्डल आन्दोलन। राजस्थान का एकीकरण।",
    ],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "prajamandal-movement",
    topicName: "Prajamandal Movement",
    topicNameHindi: "प्रजामण्डल आंदोलन",
    corpusTopics: ["राजस्थान में प्रजामंडल आंदोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "peasant-movements",
    topicName: "Peasant Movements",
    topicNameHindi: "किसान आंदोलन",
    corpusTopics: ["राजस्थान में किसान तथा आदिवासी आन्दोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "tribal-movements",
    topicName: "Tribal Movements",
    topicNameHindi: "जनजातीय आंदोलन",
    corpusTopics: ["राजस्थान में किसान तथा आदिवासी आन्दोलन"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "integration-of-rajasthan",
    topicName: "Integration of Rajasthan",
    topicNameHindi: "राजस्थान का एकीकरण",
    corpusTopics: ["राजस्थान का एकीकरण"],
  },
  {
    subjectSlug: "rajasthan-history",
    subjectName: "Rajasthan History",
    subjectNameHindi: "राजस्थान का इतिहास",
    topicSlug: "important-personalities-of-rajasthan",
    topicName: "Important Personalities of Rajasthan",
    topicNameHindi: "राजस्थान के प्रमुख व्यक्तित्व",
    corpusTopics: ["राजस्थान के प्रमुख व्यक्तित्व", "प्रसिद्ध महिला व्यक्तित्व"],
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
    corpusTopics: ["राजस्थान में लोक देवता व देवियाँ"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "saints-of-rajasthan",
    topicName: "Saints of Rajasthan",
    topicNameHindi: "राजस्थान के संत",
    corpusTopics: ["राजस्थान के प्रमुख संत एवं सम्प्रदाय"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "temple-architecture",
    topicName: "Temple Architecture",
    topicNameHindi: "मंदिर स्थापत्य",
    corpusTopics: ["राजस्थान में स्थापत्य कला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "forts",
    topicName: "Forts",
    topicNameHindi: "दुर्ग एवं किले",
    corpusTopics: ["राजस्थान में स्थापत्य कला", "राजस्थान के प्रमुख दुर्ग"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "palaces",
    topicName: "Palaces",
    topicNameHindi: "महल",
    corpusTopics: ["राजस्थान में स्थापत्य कला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "monuments",
    topicName: "Monuments",
    topicNameHindi: "स्मारक एवं हवेलियां",
    corpusTopics: ["राजस्थान में स्थापत्य कला"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "painting-schools",
    topicName: "Painting Schools",
    topicNameHindi: "चित्रकला शैलियां",
    corpusTopics: ["राजस्थान की चित्र शैलियां"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "fairs",
    topicName: "Fairs",
    topicNameHindi: "मेले",
    corpusTopics: ["राजस्थान के मेले"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "festivals",
    topicName: "Festivals",
    topicNameHindi: "त्योहार",
    corpusTopics: ["राजस्थान में त्यौहार"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "customs-traditions",
    topicName: "Customs & Traditions",
    topicNameHindi: "रीति-रिवाज एवं परंपराएं",
    corpusTopics: [
      "राजस्थान में रीति -रिवाज एवं प्रथाएं",
      "राजस्थान में सामाजिक जीवन:-मेले एवं त्योहार; सामाजिक रीति-रिवाज तथा परम्पराये; वेशभूषा एवं आभूषण।",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "dresses",
    topicName: "Dresses",
    topicNameHindi: "वेशभूषा",
    corpusTopics: [
      "राजस्थान के आभूषण एवं वेशभूषा",
      "राजस्थान में सामाजिक जीवन:-मेले एवं त्योहार; सामाजिक रीति-रिवाज तथा परम्पराये; वेशभूषा एवं आभूषण।",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "ornaments",
    topicName: "Ornaments",
    topicNameHindi: "आभूषण",
    corpusTopics: ["राजस्थान के आभूषण एवं वेशभूषा"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "handicrafts",
    topicName: "Handicrafts",
    topicNameHindi: "हस्तशिल्प",
    corpusTopics: ["राजस्थान की हस्तकला / हस्तशिल्प"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-music",
    topicName: "Folk Music",
    topicNameHindi: "लोक संगीत",
    corpusTopics: ["राजस्थान में संगीत एवं लोकगीत"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-dance",
    topicName: "Folk Dance",
    topicNameHindi: "लोक नृत्य",
    corpusTopics: ["राजस्थान में नृत्य"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "folk-theatre",
    topicName: "Folk Theatre",
    topicNameHindi: "लोक नाट्य",
    corpusTopics: ["राजस्थान में लोक नाट्य", "राजस्थान में नृत्य"],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "language",
    topicName: "Language",
    topicNameHindi: "बोली एवं भाषा",
    corpusTopics: [
      "राजस्थानी भाषा एवं बोलियां",
      "भाषा एवं साहित्य:-राजस्थानी भाषा की बोलियाँ। राजस्थानी भाषा का साहित्य एवं लोक साहित्य।",
      "राजस्थानी शब्दावली",
      "राजस्थानी मुहावरे,कहावतें और लोकोक्तियाँ",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "literature",
    topicName: "Literature",
    topicNameHindi: "साहित्य",
    corpusTopics: [
      "राजस्थानी साहित्य",
      "भाषा एवं साहित्य:-राजस्थानी भाषा की बोलियाँ। राजस्थानी भाषा का साहित्य एवं लोक साहित्य।",
    ],
  },
  {
    subjectSlug: "rajasthan-art-culture-society",
    subjectName: "Rajasthan Art, Culture & Society",
    subjectNameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    topicSlug: "major-cultural-event-venues",
    topicName: "Major Cultural Event Venues",
    topicNameHindi: "राजस्थान के प्रमुख सांस्कृतिक कार्यक्रम स्थल",
    corpusTopics: ["राजस्थान के प्रमुख सांस्कृतिक कार्यक्रम स्थल"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Rajasthan Polity & Administration (राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "governor",
    topicName: "Governor",
    topicNameHindi: "राज्यपाल",
    corpusTopics: ["राज्यपाल", "राज्यपाल, मुख्यमंत्री और मंत्रिपरिषद् विधानसभा, उच्च न्यायालय।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "chief-minister",
    topicName: "Chief Minister",
    topicNameHindi: "मुख्यमंत्री",
    corpusTopics: ["मुख्यमंत्री", "राज्यपाल, मुख्यमंत्री और मंत्रिपरिषद् विधानसभा, उच्च न्यायालय।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "council-of-ministers",
    topicName: "Council of Ministers",
    topicNameHindi: "मन्त्रिपरिषद",
    corpusTopics: ["राज्य मंत्रिपरिषद", "राजस्थान मंत्रिमंडल", "राज्यपाल, मुख्यमंत्री और मंत्रिपरिषद् विधानसभा, उच्च न्यायालय।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "state-legislature",
    topicName: "State Legislature",
    topicNameHindi: "राज्य विधानमंडल",
    corpusTopics: ["राज्य विधान मंडल", "राज्यपाल, मुख्यमंत्री और मंत्रिपरिषद् विधानसभा, उच्च न्यायालय।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-high-court",
    topicName: "Rajasthan High Court",
    topicNameHindi: "राजस्थान उच्च न्यायालय",
    corpusTopics: ["उच्च न्यायालय", "राज्यपाल, मुख्यमंत्री और मंत्रिपरिषद् विधानसभा, उच्च न्यायालय।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "subordinate-courts",
    topicName: "Subordinate Courts",
    topicNameHindi: "अधीनस्थ न्यायालय",
    corpusTopics: ["उच्च न्यायालय"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "panchayati-raj",
    topicName: "Panchayati Raj",
    topicNameHindi: "पंचायती राज",
    corpusTopics: ["स्थानीय स्वायत्त शासन एवं पंचायती राज", "जिला प्रशासन, स्थानीय स्वशासन एवं पंचायती राज संस्थाएँ।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "urban-local-government",
    topicName: "Urban Local Government",
    topicNameHindi: "नगरीय निकाय",
    corpusTopics: ["स्थानीय स्वायत्त शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "state-secretariat",
    topicName: "State Secretariat",
    topicNameHindi: "राज्य सचिवालय",
    corpusTopics: ["राज्य प्रशासन"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "divisional-commissioner",
    topicName: "Divisional Commissioner",
    topicNameHindi: "संभाग आयुक्त",
    corpusTopics: ["राज्य प्रशासन", "राजस्थान के जिले व संभाग"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "district-administration",
    topicName: "District Administration",
    topicNameHindi: "जिला प्रशासन",
    corpusTopics: ["जिला प्रशासन", "जिला प्रशासन, स्थानीय स्वशासन एवं पंचायती राज संस्थाएँ।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-public-service-commission-rpsc",
    topicName: "Rajasthan Public Service Commission (RPSC)",
    topicNameHindi: "राजस्थान लोक सेवा आयोग (RPSC)",
    corpusTopics: ["राजस्थान लोक सेवा आयोग", "राजस्थान लोक सेवा आयोग, राज्य मानवाधिकार आयोग, लोकायुक्त, राज्य निर्वाचन आयोग, राज्य सूचना आयोग।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-state-womens-commission",
    topicName: "Rajasthan State Women's Commission",
    topicNameHindi: "राज्य महिला आयोग",
    corpusTopics: ["राजस्थान राज्य महिला आयोग"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-state-finance-commission",
    topicName: "Rajasthan State Finance Commission",
    topicNameHindi: "राज्य वित्त आयोग",
    corpusTopics: ["संवैधानिक आयोग", "स्थानीय स्वायत्त शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-state-election-commission",
    topicName: "Rajasthan State Election Commission",
    topicNameHindi: "राज्य निर्वाचन आयोग",
    corpusTopics: ["राजस्थान राज्य निर्वाचन आयोग", "राजस्थान लोक सेवा आयोग, राज्य मानवाधिकार आयोग, लोकायुक्त, राज्य निर्वाचन आयोग, राज्य सूचना आयोग।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "lokayukta",
    topicName: "Lokayukta",
    topicNameHindi: "लोकायुक्त",
    corpusTopics: ["राजस्थान में लोकायुक्त", "राजस्थान लोक सेवा आयोग, राज्य मानवाधिकार आयोग, लोकायुक्त, राज्य निर्वाचन आयोग, राज्य सूचना आयोग।"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-state-legal-services-authority",
    topicName: "Rajasthan State Legal Services Authority",
    topicNameHindi: "राज्य विधिक सेवा प्राधिकरण",
    corpusTopics: ["लोक नीति, विधिक अधिकार एवं नागरिक अधिकार–पत्र"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "local-self-government-panchayati-raj",
    topicName: "Local Self Government & Panchayati Raj",
    topicNameHindi: "स्थानीय स्वायत्त शासन एवं पंचायती राज",
    corpusTopics: ["स्थानीय स्वायत्त शासन एवं पंचायती राज"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-public-service-guarantee-act-2011",
    topicName: "Rajasthan Public Service Guarantee Act 2011",
    topicNameHindi: "राजस्थान लोक सेवा गारंटी अधिनियम 2011",
    corpusTopics: ["राजस्थान लोक सेवा गारंटी अधिनियम 2011"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "board-of-revenue-rajasthan",
    topicName: "Board of Revenue Rajasthan",
    topicNameHindi: "राजस्‍व मण्‍डल राजस्‍थान",
    corpusTopics: ["राजस्‍व मण्‍डल राजस्‍थान"],
  },
  {
    subjectSlug: "rajasthan-polity-administration",
    subjectName: "Rajasthan Polity & Administration",
    subjectNameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    topicSlug: "rajasthan-contribution-to-constitution-making",
    topicName: "Rajasthan Contribution to Constitution Making",
    topicNameHindi: "संविधान निर्माण में राजस्थान का योगदान",
    corpusTopics: ["संविधान निर्माण में राजस्थान का योगदान"],
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
    corpusTopics: ["राजस्थान के प्रमुख व्यक्तित्व", "प्रसिद्ध महिला व्यक्तित्व", "वर्तमान में चर्चित व्यक्ति, स्थान एवं संस्थाए"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "important-places",
    topicName: "Important Places",
    topicNameHindi: "प्रमुख स्थान",
    corpusTopics: ["राजस्थान के प्रमुख स्थानों के उपनाम", "वर्तमान में चर्चित व्यक्ति, स्थान एवं संस्थाए"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "current-issues",
    topicName: "Current Issues",
    topicNameHindi: "समसामयिक मुद्दे",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे", "वर्तमान में चर्चित व्यक्ति, स्थान एवं संस्थाए"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "welfare-schemes",
    topicName: "Welfare Schemes",
    topicNameHindi: "कल्याणकारी योजनाएं",
    corpusTopics: [
      "राजस्थान सरकार की योजनाएं",
      "राज्य सरकार की प्रमुख कल्याणकारी योजनाएँ:-अनुसूचित जाति/अनुसूचित जनजाति/पिछड़ा वर्ग/ अल्पसंख्यकों, नि:शक्तजनों, निराश्रितों, महिलाओं, बच्चों, वृद्धजनों, कृषकों एवं श्रमिकों के लिए।",
    ],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "development-schemes",
    topicName: "Development Schemes",
    topicNameHindi: "विकास योजनाएं",
    corpusTopics: ["प्रमुख विकास परियोजनाएँ", "राजस्थान सरकार की योजनाएं"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "government-initiatives",
    topicName: "Government Initiatives",
    topicNameHindi: "शासकीय पहल",
    corpusTopics: ["राजस्थान सरकार की योजनाएं", "राजस्थान सरकार की प्रमुख नीतियां"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-scenario",
    topicName: "Economic Scenario",
    topicNameHindi: "आर्थिक परिदृश्य",
    corpusTopics: ["आर्थिक समीक्षा 2024-25", "आर्थिक समीक्षा 2025-26", "अर्थव्यवस्था का वृहत् परिदृश्य"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "political-scenario",
    topicName: "Political Scenario",
    topicNameHindi: "राजनीतिक परिदृश्य",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "sports",
    topicName: "Sports",
    topicNameHindi: "खेलकूद",
    corpusTopics: ["खेल एवं खेलकूद संबंधी गतिविधियाँ", "राजस्थान के खेल व खिलाड़ी"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "awards",
    topicName: "Awards",
    topicNameHindi: "पुरस्कार एवं सम्मान",
    corpusTopics: ["राजस्थान, भारतीय एवं अन्तर्राष्ट्रीय महत्व की प्रमुख समसामयिक घटनाएं एवं मुद्दे"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "books",
    topicName: "Books",
    topicNameHindi: "प्रमुख पुस्तकें",
    corpusTopics: ["राजस्थानी साहित्य"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "authors",
    topicName: "Authors",
    topicNameHindi: "लेखक",
    corpusTopics: ["राजस्थानी साहित्य"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "sports-and-players-of-rajasthan",
    topicName: "Sports and Players of Rajasthan",
    topicNameHindi: "राजस्थान के खेल व खिलाड़ी",
    corpusTopics: ["राजस्थान के खेल व खिलाड़ी", "खेल एवं खेलकूद संबंधी गतिविधियाँ"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "development-of-science-technology",
    topicName: "Development of Science & Technology",
    topicNameHindi: "राजस्थान में विज्ञान और प्रौद्योगिकी का विकास",
    corpusTopics: ["राजस्थान में विज्ञान और प्रौद्योगिकी का विकास", "विज्ञान एवं प्रौद्योगिकी विकास राजस्थान के विशेष संदर्भ में"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "one-district-one-product-scheme",
    topicName: "One District One Product Scheme",
    topicNameHindi: "एक जिला एक उत्पाद योजना राजस्थान",
    corpusTopics: ["एक जिला एक उत्पाद योजना राजस्थान"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "regional-programs-in-rajasthan",
    topicName: "Regional Programs in Rajasthan",
    topicNameHindi: "राजस्थान में क्षेत्रीय कार्यक्रम",
    corpusTopics: ["राजस्थान में क्षेत्रीय कार्यक्रम"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "rajasthan-budget-2025-26",
    topicName: "Rajasthan Budget 2025-26",
    topicNameHindi: "राजस्थान बजट 2025-26",
    corpusTopics: ["राजस्थान बजट 2025-26"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-review-2024-25",
    topicName: "Economic Review 2024-25",
    topicNameHindi: "आर्थिक समीक्षा 2024-25",
    corpusTopics: ["आर्थिक समीक्षा 2024-25"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "rajasthan-budget-2026-27",
    topicName: "Rajasthan Budget 2026-27",
    topicNameHindi: "राजस्थान बजट 2026-27",
    corpusTopics: ["राजस्थान बजट 2026-27"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "economic-review-2025-26",
    topicName: "Economic Review 2025-26",
    topicNameHindi: "आर्थिक समीक्षा 2025-26",
    corpusTopics: ["आर्थिक समीक्षा 2025-26"],
  },
  {
    subjectSlug: "rajasthan-current-affairs",
    subjectName: "Rajasthan Current Affairs",
    subjectNameHindi: "राजस्थान समसामयिकी",
    topicSlug: "major-policies-of-rajasthan-government",
    topicName: "Major Policies of Rajasthan Government",
    topicNameHindi: "राजस्थान सरकार की प्रमुख नीतियां",
    corpusTopics: ["राजस्थान सरकार की प्रमुख नीतियां"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. World & India General Knowledge (विश्व एवं भारत का सामान्य ज्ञान)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "world-geography-continents",
    topicName: "World Geography - Continents",
    topicNameHindi: "विश्व भूगोल - महाद्वीप",
    corpusTopics: ["स्थलाकृतियाँ– पर्वत, पठार, मैदान एवं मरुस्थल।", "प्रमुख भौतिक लक्षण–पर्वत, पठार, मैदान एवं झीलें"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "world-geography-oceans",
    topicName: "World Geography - Oceans",
    topicNameHindi: "विश्व भूगोल - महासागर",
    corpusTopics: ["महासागर– महासागरीय जलधाराएँ एवं जलमार्ग।", "प्रमुख भौतिक लक्षण–पर्वत, पठार, मैदान एवं झीलें"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "world-geography-global-wind-system",
    topicName: "World Geography - Global Wind System",
    topicNameHindi: "विश्व भूगोल - पवन तंत्र",
    corpusTopics: ["प्रमुख पवन तंत्र–वैश्विक पवनें, स्थानीय पवनें।"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "world-geography-environmental-problems",
    topicName: "World Geography - Environmental Problems",
    topicNameHindi: "विश्व भूगोल - पर्यावरणीय समस्याएं",
    corpusTopics: ["पर्यावरणीय मुद्दे–मरुस्थलीयकरण, वनोन्मूलन, जलवायु परिवर्तन एवं ग्लोबल वार्मिंग (ऊष्मीकरण), ओजन अवक्षय"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-physical-features",
    topicName: "India Geography - Physical Features",
    topicNameHindi: "भारत भूगोल - भौतिक स्वरूप",
    corpusTopics: ["प्रमुख भौतिक लक्षण–पर्वत, पठार, मैदान एवं झीलें", "स्थलाकृतियाँ– पर्वत, पठार, मैदान एवं मरुस्थल।"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-climate",
    topicName: "India Geography - Climate",
    topicNameHindi: "भारत भूगोल - जलवायु",
    corpusTopics: ["मानसून तंत्र व वर्षा का वितरण"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-monsoon-system",
    topicName: "India Geography - Monsoon System",
    topicNameHindi: "भारत भूगोल - मानसून तंत्र",
    corpusTopics: ["मानसून तंत्र व वर्षा का वितरण"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-drainage-system",
    topicName: "India Geography - Drainage System",
    topicNameHindi: "भारत भूगोल - अपवाह तंत्र",
    corpusTopics: ["प्रमुख नदियाँ एवं झीलें"],
  },
  {
    subjectSlug: "world-india-gk",
    subjectName: "World & India General Knowledge",
    subjectNameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    topicSlug: "india-geography-natural-vegetation",
    topicName: "India Geography - Natural Vegetation",
    topicNameHindi: "भारत भूगोल - प्राकृतिक वनस्पति",
    corpusTopics: ["वन एवं वन्य-जीव संरक्षण", "जैव-विविधता एवं इनका संरक्षण"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Indian Polity & Foreign Policy (भारतीय राजव्यवस्था एवं विदेश नीति)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "constituent-assembly",
    topicName: "Constituent Assembly",
    topicNameHindi: "संविधान सभा",
    corpusTopics: ["संविधान सभा, भारतीय संविधान की विशेषताएं, संवैधानिक संशोधन।"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "president",
    topicName: "President",
    topicNameHindi: "राष्ट्रपति",
    corpusTopics: ["राष्ट्रपति, प्रधानमंत्री एवं मंत्रिपरिषद्, संसद, उच्चतम न्यायालय और न्यायिक पुनरावलोकन।"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "prime-minister",
    topicName: "Prime Minister",
    topicNameHindi: "प्रधानमंत्री",
    corpusTopics: ["राष्ट्रपति, प्रधानमंत्री एवं मंत्रिपरिषद्, संसद, उच्चतम न्यायालय और न्यायिक पुनरावलोकन।"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "parliament",
    topicName: "Parliament",
    topicNameHindi: "संसद",
    corpusTopics: ["राष्ट्रपति, प्रधानमंत्री एवं मंत्रिपरिषद्, संसद, उच्चतम न्यायालय और न्यायिक पुनरावलोकन।"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "supreme-court",
    topicName: "Supreme Court",
    topicNameHindi: "उच्चतम न्यायालय",
    corpusTopics: ["राष्ट्रपति, प्रधानमंत्री एवं मंत्रिपरिषद्, संसद, उच्चतम न्यायालय और न्यायिक पुनरावलोकन।"],
  },
  {
    subjectSlug: "indian-polity-foreign-policy",
    subjectName: "Indian Polity & Foreign Policy",
    subjectNameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    topicSlug: "election-commission",
    topicName: "Election Commission",
    topicNameHindi: "भारत निर्वाचन आयोग",
    corpusTopics: ["भारत निर्वाचन आयोग, नियंत्रक एवं महालेखा परीक्षण, नीति आयोग, केन्द्रीय सतकर्ता आयोग, लोकपाल, केन्द्रीय सूचना आयोग एवं राष्ट्रीय मानवाधिकार आयोग।"],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. Educational Psychology (शिक्षा मनोविज्ञान)
  // ──────────────────────────────────────────────────────────────────────────
  {
    subjectSlug: "educational-psychology",
    subjectName: "Educational Psychology",
    subjectNameHindi: "शिक्षा मनोविज्ञान",
    topicSlug: "educational-psychology-meaning-scope",
    topicName: "Educational Psychology - Meaning & Scope",
    topicNameHindi: "शिक्षा मनोविज्ञान - अर्थ एवं क्षेत्र",
    corpusTopics: ["शिक्षा"],
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

