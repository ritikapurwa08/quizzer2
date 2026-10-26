/**
 * Authoritative Master Topic List for Rajasthan GK (55 Topics across 4 Canonical Subjects).
 * Strictly exclusive: India GK, English, etc. are NOT included.
 * Aligned with RPSC Senior Teacher (2nd Grade) Paper-1 GK Curriculum.
 */

export interface MasterTopic {
  id: number;
  name: string;
  nameHindi: string;
}

export interface MasterSection {
  code: "A" | "B" | "C" | "D" | "E";
  id?: string;
  title?: string;
  titleHindi: string;
  titleEnglish: string;
  slug: string;
  topics: MasterTopic[];
}

export const ENGLISH_MASTER_SECTION: MasterSection = {
  code: "E",
  id: "E",
  title: "अंग्रेजी (Paper-II)",
  titleHindi: "अंग्रेजी (Paper-II)",
  titleEnglish: "English (Paper-II)",
  slug: "english",
  topics: [
    // Part I: Secondary & Sr. Secondary Standard (Grammar and Usage)
    { id: 56, name: "Parts of Speech – Nouns", nameHindi: "संज्ञा (Nouns)" },
    { id: 57, name: "Parts of Speech – Verbs", nameHindi: "क्रिया (Verbs)" },
    { id: 58, name: "Parts of Speech – Adjectives", nameHindi: "विशेषण (Adjectives)" },
    { id: 59, name: "Parts of Speech – Adverbs", nameHindi: "क्रियाविशेषण (Adverbs)" },
    { id: 60, name: "Articles and Determiners", nameHindi: "उपपद एवं निर्धारक (Articles & Determiners)" },
    { id: 61, name: "Tenses & Sequence of Tenses", nameHindi: "काल एवं कालक्रम (Tenses)" },
    { id: 62, name: "Prepositions", nameHindi: "संबंधबोधक अव्यय (Prepositions)" },
    { id: 63, name: "Modal Auxiliaries", nameHindi: "रूपात्मक सहायक क्रियाएँ (Modal Auxiliaries)" },
    { id: 64, name: "Degrees of Adjectives", nameHindi: "विशेषण की अवस्थाएँ (Degrees of Adjectives)" },
    { id: 65, name: "Subordination and Coordination", nameHindi: "आश्रित एवं समानपदीय उपवाक्य (Subordination & Coordination)" },
    { id: 66, name: "Transformation of Sentences", nameHindi: "वाक्य रूपांतरण (Transformation of Sentences)" },
    { id: 67, name: "Phrasal Verbs", nameHindi: "संयुक्त क्रियाएँ (Phrasal Verbs)" },
    { id: 68, name: "Proverbs and Idiomatic Expressions", nameHindi: "कहावतें एवं मुहावरे (Proverbs & Idioms)" },
    { id: 69, name: "Words Often Misspelt and Confused", nameHindi: "भ्रामक एवं अशुद्ध वर्तनी वाले शब्द (Confusable & Misspelt Words)" },
    { id: 70, name: "One Word Substitution", nameHindi: "वाक्यांश के लिए एक शब्द (One Word Substitution)" },
    { id: 71, name: "Synonyms and Antonyms", nameHindi: "समानार्थी एवं विलोम शब्द (Synonyms and Antonyms)" },
    { id: 72, name: "Phonetic Transcription", nameHindi: "ध्वन्यात्मक प्रतिलेखन (Phonetic Transcription)" },
    // Part II: Graduation Standard (Grammar, Usage & Literature)
    { id: 73, name: "Basic Sentence Patterns", nameHindi: "मूल वाक्य प्रतिरूप (Basic Sentence Patterns)" },
    { id: 74, name: "Clause Analysis (SPOCA / SVOCA)", nameHindi: "उपवाक्य विश्लेषण (Clause Analysis)" },
    { id: 75, name: "Reading Comprehension and Vocabulary", nameHindi: "अपठित गद्यांश एवं शब्दावली (Reading Comprehension)" },
    { id: 76, name: "Poetry Appreciation", nameHindi: "काव्य रसास्वादन (Poetry Appreciation)" },
    { id: 77, name: "Literary Forms Devices and Figures of Speech", nameHindi: "साहित्यिक रूप एवं अलंकार (Literary Forms & Devices)" },
    { id: 78, name: "Major Literary Periods", nameHindi: "प्रमुख साहित्यिक काल (Major Literary Periods)" },
    { id: 79, name: "Major Literary Movements", nameHindi: "प्रमुख साहित्यिक आंदोलन (Literary Movements)" },
    { id: 80, name: "Prescribed Poetry", nameHindi: "निर्धारित कविताएँ (Prescribed Poetry – 15 Works)" },
    { id: 81, name: "Prescribed Prose", nameHindi: "निर्धारित गद्य (Prescribed Prose – 6 Works)" },
    { id: 82, name: "Prescribed Fiction", nameHindi: "निर्धारित कथा साहित्य (Prescribed Fiction)" },
    { id: 83, name: "Prescribed Drama", nameHindi: "निर्धारित नाटक (Prescribed Drama)" },
    // Part III: Teaching Methods (ELT)
    { id: 84, name: "Basic Principles of Second Language Teaching", nameHindi: "द्वितीय भाषा शिक्षण के मूल सिद्धांत (ELT Principles)" },
    { id: 85, name: "Developing Four Language Skills (LSRW)", nameHindi: "चार भाषाई कौशल: LSRW (Language Skills)" },
    { id: 86, name: "Teaching of Language Forms", nameHindi: "भाषाई रूपों का शिक्षण: गद्य, पद्य, व्याकरण व रचना" },
    { id: 87, name: "Approaches and Methods of ELT", nameHindi: "अंग्रेजी शिक्षण के दृष्टिकोण एवं विधियाँ (ELT Methods)" },
    { id: 88, name: "Evaluation in English Language", nameHindi: "अंग्रेजी भाषा में मूल्यांकन एवं परीक्षण (Evaluation & Testing)" },
  ],
};

export const RAJASTHAN_GK_MASTER_SECTIONS: MasterSection[] = [
  {
    code: "A",
    id: "A",
    title: "राजस्थान सामान्य ज्ञान एवं भूगोल",
    titleHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल",
    titleEnglish: "Rajasthan General Knowledge & Geography",
    slug: "rajasthan-general-knowledge-geography",
    topics: [
      { id: 1, name: "General Knowledge of Rajasthan", nameHindi: "राजस्थान का सामान्य ज्ञान" },
      { id: 2, name: "Physical Features and Geography of Rajasthan", nameHindi: "राजस्थान का भौतिक स्वरूप एवं भूगोल" },
      { id: 3, name: "Climate of Rajasthan", nameHindi: "राजस्थान की जलवायु" },
      { id: 4, name: "Population and Census of Rajasthan", nameHindi: "राजस्थान की जनसंख्या एवं जनगणना" },
      { id: 5, name: "Soils of Rajasthan", nameHindi: "राजस्थान की मृदा" },
      { id: 6, name: "Drainage System, Rivers and Lakes of Rajasthan", nameHindi: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें" },
      { id: 7, name: "Irrigation Projects, Dams and Water Management", nameHindi: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन" },
      { id: 8, name: "Forests, Wildlife, Sanctuaries and National Parks", nameHindi: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान" },
      { id: 9, name: "Agriculture of Rajasthan", nameHindi: "राजस्थान की कृषि" },
      { id: 10, name: "Animal Husbandry and Dairy Development of Rajasthan", nameHindi: "राजस्थान का पशुपालन एवं डेयरी विकास" },
      { id: 11, name: "Mineral Resources of Rajasthan", nameHindi: "राजस्थान के खनिज संसाधन" },
      { id: 12, name: "Energy Resources of Rajasthan", nameHindi: "राजस्थान के ऊर्जा संसाधन" },
      { id: 13, name: "Major Industries of Rajasthan", nameHindi: "राजस्थान के प्रमुख उद्योग" },
      { id: 14, name: "Transportation in Rajasthan", nameHindi: "राजस्थान का परिवहन" },
      { id: 15, name: "Tourism and Tourist Circuits of Rajasthan", nameHindi: "राजस्थान का पर्यटन एवं पर्यटन परिपथ" },
    ],
  },
  {
    code: "B",
    id: "B",
    title: "राजस्थान का इतिहास",
    titleHindi: "राजस्थान का इतिहास",
    titleEnglish: "Rajasthan History",
    slug: "rajasthan-history",
    topics: [
      { id: 16, name: "Ancient Civilizations and Archaeological Sites of Rajasthan", nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल" },
      { id: 17, name: "Major Rajput Dynasties and Administrative System of Rajasthan", nameHindi: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)" },
      { id: 18, name: "Revolt of 1857 and British Treaties in Rajasthan", nameHindi: "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ" },
      { id: 19, name: "Peasant and Tribal Movements in Rajasthan", nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन" },
      { id: 20, name: "Prajamandal Movements in Rajasthan", nameHindi: "राजस्थान के प्रजामंडल आंदोलन" },
      { id: 21, name: "Freedom Struggle Organizations and Institutions in Rajasthan", nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ" },
      { id: 22, name: "Social and Political Awakening in Rajasthan", nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण" },
      { id: 23, name: "Integration of Rajasthan", nameHindi: "राजस्थान का एकीकरण" },
      { id: 24, name: "Prominent Personalities of Rajasthan", nameHindi: "राजस्थान के प्रमुख व्यक्तित्व" },
      { id: 25, name: "Women Personalities and Journalism in Rajasthan", nameHindi: "राजस्थान की महिला व्यक्तित्व एवं पत्रकारिता" },
    ],
  },
  {
    code: "C",
    id: "C",
    title: "राजस्थान कला एवं संस्कृति",
    titleHindi: "राजस्थान कला एवं संस्कृति",
    titleEnglish: "Rajasthan Art & Culture",
    slug: "rajasthan-art-culture",
    topics: [
      { id: 26, name: "Fairs of Rajasthan", nameHindi: "राजस्थान के मेले" },
      { id: 27, name: "Festivals of Rajasthan", nameHindi: "राजस्थान के त्योहार" },
      { id: 28, name: "Customs and Traditions of Rajasthan", nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ" },
      { id: 29, name: "Costumes and Ornaments of Rajasthan", nameHindi: "राजस्थान की वेशभूषा एवं आभूषण" },
      { id: 30, name: "Architecture and Monuments of Rajasthan", nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला" },
      { id: 31, name: "Painting Schools of Rajasthan", nameHindi: "राजस्थान की चित्रकला शैलियाँ" },
      { id: 32, name: "Handicrafts and Crafts of Rajasthan", nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ" },
      { id: 33, name: "Folk Deities and Goddesses of Rajasthan", nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ" },
      { id: 34, name: "Saints Sects and Religious Traditions of Rajasthan", nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ" },
      { id: 35, name: "Folk Music and Folk Songs of Rajasthan", nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत" },
      { id: 36, name: "Folk Dances and Drama of Rajasthan", nameHindi: "राजस्थान के लोक नृत्य एवं नाट्य" },
      { id: 37, name: "Rajasthani Language and Dialects", nameHindi: "राजस्थानी भाषा एवं बोलियाँ" },
      { id: 38, name: "Rajasthani Literature", nameHindi: "राजस्थानी साहित्य" },
      { id: 39, name: "Rajasthani Vocabulary", nameHindi: "राजस्थानी शब्दावली" },
      { id: 40, name: "Rajasthani Idioms and Proverbs", nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ" },
    ],
  },
  {
    code: "D",
    id: "D",
    title: "राजस्थान राजव्यवस्था एवं प्रशासन",
    titleHindi: "राजस्थान राजव्यवस्था एवं प्रशासन",
    titleEnglish: "Rajasthan Polity & Administration",
    slug: "rajasthan-polity-administration",
    topics: [
      { id: 41, name: "Governor of Rajasthan", nameHindi: "राजस्थान के राज्यपाल" },
      { id: 42, name: "Chief Minister and Council of Ministers of Rajasthan", nameHindi: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद" },
      { id: 43, name: "Rajasthan State Legislature", nameHindi: "राजस्थान राज्य विधानमंडल (विधानसभा)" },
      { id: 44, name: "Rajasthan High Court and Subordinate Judiciary", nameHindi: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका" },
      { id: 45, name: "State Secretariat, Chief Secretary, Divisional Commissioner and District Administration", nameHindi: "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन" },
      { id: 46, name: "Panchayati Raj in Rajasthan", nameHindi: "राजस्थान पंचायती राज व्यवस्था एवं प्रशासन" },
      { id: 47, name: "Urban Local Governance and Municipalities in Rajasthan", nameHindi: "राजस्थान नगरीय स्वशासन एवं नगरपालिका" },
      { id: 48, name: "Rajasthan Public Service Commission RPSC", nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)" },
      { id: 49, name: "Rajasthan State Election Commission", nameHindi: "राजस्थान राज्य निर्वाचन आयोग (RSEC)" },
      { id: 50, name: "Rajasthan State Human Rights Commission", nameHindi: "राजस्थान राज्य मानवाधिकार आयोग (RSHRC)" },
      { id: 51, name: "Rajasthan State Commission for Women", nameHindi: "राजस्थान राज्य महिला आयोग (RSCW)" },
      { id: 52, name: "Rajasthan State Finance Commission", nameHindi: "राजस्थान राज्य वित्त आयोग (RSFC)" },
      { id: 53, name: "Rajasthan State Legal Services Authority", nameHindi: "राजस्थान राज्य विधिक सेवा प्राधिकरण (RSLA / RSLSA)" },
      { id: 54, name: "Lokayukta and Up-Lokayukta of Rajasthan", nameHindi: "राजस्थान लोकायुक्त एवं उप-लोकायुक्त" },
      { id: 55, name: "Major Research and Study Centers of Rajasthan", nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र" },
    ],
  },
];
