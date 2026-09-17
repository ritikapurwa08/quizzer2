import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const INDEX_PATH = path.join(ROOT_DIR, "src/xdata/topics/index.json");
const CLEAN_PATH = path.join(ROOT_DIR, "src/xdata/rajasthan_gk_india_gk_clean_sorted.json");

const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
const cleanData = JSON.parse(fs.readFileSync(CLEAN_PATH, "utf8"));

// 1. Authoritative 73 Rajasthan Master Topics
export const RAJASTHAN_MASTER_TOPICS: { id: number; section: string; title: string }[] = [
  // A. राजस्थान सामान्य ज्ञान एवं भूगोल (1-20)
  { id: 1, section: "A", title: "राजस्थान का सामान्य ज्ञान" },
  { id: 2, section: "A", title: "राजस्थान का भौतिक स्वरूप एवं भूगोल" },
  { id: 3, section: "A", title: "राजस्थान की जलवायु" },
  { id: 4, section: "A", title: "राजस्थान के जिले एवं संभाग" },
  { id: 5, section: "A", title: "राजस्थान की जनसंख्या एवं जनगणना" },
  { id: 6, section: "A", title: "राजस्थान की मृदा" },
  { id: 7, section: "A", title: "राजस्थान की नदियाँ एवं जल संसाधन" },
  { id: 8, section: "A", title: "राजस्थान की झीलें" },
  { id: 9, section: "A", title: "राजस्थान की सिंचाई एवं सिंचाई परियोजनाएँ" },
  { id: 10, section: "A", title: "राजस्थान के वन एवं वन्यजीव" },
  { id: 11, section: "A", title: "राजस्थान के अभयारण्य एवं राष्ट्रीय उद्यान" },
  { id: 12, section: "A", title: "राजस्थान में मरुस्थलीकरण" },
  { id: 13, section: "A", title: "राजस्थान की कृषि" },
  { id: 14, section: "A", title: "राजस्थान का पशुपालन" },
  { id: 15, section: "A", title: "राजस्थान के खनिज संसाधन" },
  { id: 16, section: "A", title: "राजस्थान के ऊर्जा संसाधन" },
  { id: 17, section: "A", title: "राजस्थान के प्रमुख उद्योग" },
  { id: 18, section: "A", title: "राजस्थान का परिवहन" },
  { id: 19, section: "A", title: "राजस्थान का पर्यटन" },
  { id: 20, section: "A", title: "राजस्थान के पारंपरिक जल स्रोत एवं जल प्रबंधन" },

  // B. राजस्थान कला एवं संस्कृति (21-36)
  { id: 21, section: "B", title: "राजस्थान के मेले" },
  { id: 22, section: "B", title: "राजस्थान के त्योहार" },
  { id: 23, section: "B", title: "राजस्थान की रीति-रिवाज एवं परंपराएँ" },
  { id: 24, section: "B", title: "राजस्थान की वेशभूषा एवं आभूषण" },
  { id: 25, section: "B", title: "राजस्थान की स्थापत्य कला एवं वास्तुकला" },
  { id: 26, section: "B", title: "राजस्थान की चित्रकला शैलियाँ" },
  { id: 27, section: "B", title: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ" },
  { id: 28, section: "B", title: "राजस्थान के लोक देवता एवं लोक देवियाँ" },
  { id: 29, section: "B", title: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ" },
  { id: 30, section: "B", title: "राजस्थान का लोक संगीत एवं लोकगीत" },
  { id: 31, section: "B", title: "राजस्थान के लोक नृत्य" },
  { id: 32, section: "B", title: "राजस्थानी भाषा एवं बोलियाँ" },
  { id: 33, section: "B", title: "राजस्थानी साहित्य" },
  { id: 34, section: "B", title: "राजस्थानी शब्दावली" },
  { id: 35, section: "B", title: "राजस्थानी मुहावरे एवं लोकोक्तियाँ" },
  { id: 36, section: "B", title: "राजस्थान के प्रमुख स्थानों के उपनाम" },

  // C. राजस्थान प्राचीन एवं मध्यकालीन इतिहास (37-48)
  { id: 37, section: "C", title: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल" },
  { id: 38, section: "C", title: "राजस्थान के इतिहास के स्रोत" },
  { id: 39, section: "C", title: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास" },
  { id: 40, section: "C", title: "राजस्थान का राजपूत काल" },
  { id: 41, section: "C", title: "मेवाड़ का गुहिल/गुहिलोत वंश" },
  { id: 42, section: "C", title: "आमेर का कछवाहा वंश" },
  { id: 43, section: "C", title: "चौहान वंश" },
  { id: 44, section: "C", title: "गुर्जर-प्रतिहार वंश" },
  { id: 45, section: "C", title: "राठौड़ वंश" },
  { id: 46, section: "C", title: "राजस्थान के अन्य प्रमुख राजवंश" },
  { id: 47, section: "C", title: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ" },
  { id: 48, section: "C", title: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था" },

  // D. आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन (49-57)
  { id: 49, section: "D", title: "राजस्थान में 1857 का विद्रोह" },
  { id: 50, section: "D", title: "राजस्थान के किसान एवं जनजातीय आंदोलन" },
  { id: 51, section: "D", title: "राजस्थान के प्रजामंडल आंदोलन" },
  { id: 52, section: "D", title: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ" },
  { id: 53, section: "D", title: "राजस्थान में सामाजिक एवं राजनीतिक जागरण" },
  { id: 54, section: "D", title: "राजस्थान का एकीकरण" },
  { id: 55, section: "D", title: "राजस्थान के प्रमुख व्यक्तित्व" },
  { id: 56, section: "D", title: "राजस्थान की महिला व्यक्तित्व" },
  { id: 57, section: "D", title: "राजस्थान में प्रेस एवं पत्रकारिता" },

  // E. राजस्थान राजव्यवस्था / प्रशासन (58-73)
  { id: 58, section: "E", title: "राजस्थान राज्य प्रशासन" },
  { id: 59, section: "E", title: "राजस्थान के राज्यपाल" },
  { id: 60, section: "E", title: "राजस्थान के मुख्यमंत्री" },
  { id: 61, section: "E", title: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल" },
  { id: 62, section: "E", title: "राजस्थान राज्य विधानमंडल" },
  { id: 63, section: "E", title: "राजस्थान उच्च न्यायालय एवं न्यायपालिका" },
  { id: 64, section: "E", title: "राजस्थान जिला प्रशासन" },
  { id: 65, section: "E", title: "राजस्थान पंचायती राज एवं स्थानीय स्वशासन" },
  { id: 66, section: "E", title: "राजस्थान लोक सेवा आयोग (RPSC)" },
  { id: 67, section: "E", title: "राजस्थान राज्य निर्वाचन आयोग" },
  { id: 68, section: "E", title: "राजस्थान मानवाधिकार आयोग" },
  { id: 69, section: "E", title: "राजस्थान महिला आयोग" },
  { id: 70, section: "E", title: "राजस्थान लोकायुक्त" },
  { id: 71, section: "E", title: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ" },
  { id: 72, section: "E", title: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र" },
  { id: 73, section: "E", title: "राजस्थान विज्ञान एवं प्रौद्योगिकी" },
];

// 2. Removal Candidate Topics (Part 3)
export const REMOVAL_CANDIDATE_PATTERNS = [
  /सरकारी योजना|कल्याणकारी योजना|विकास योजना/i,
  /लोक सेवा गारंटी/i,
  /एक जिला एक उत्पाद|odop/i,
  /प्रतीक चिन्ह|राज्य प्रतीक/i,
  /शिक्षा\b|राजस्थान में शिक्षा/i,
  /बजट 2025-26|बजट 2026-27/i,
  /आर्थिक सर्वेक्षण|आर्थिक समीक्षा 2024-25|आर्थिक समीक्षा 2025-26/i,
  /प्रमुख नीतियां|major policies/i,
  /सांस्कृतिक कार्यक्रम स्थल|cultural program venues/i,
  /क्षेत्रीय कार्यक्रम|regional programs/i,
];

// 3. Other Subjects Master Topics (Part 5)
export const OTHER_SUBJECTS_MASTER_TOPICS = [
  { id: 101, subject: "भारत का सामान्य ज्ञान", title: "भारत का भूगोल एवं भौतिक स्वरूप" },
  { id: 102, subject: "भारत का सामान्य ज्ञान", title: "भारत का अपवाह तंत्र एवं नदियाँ" },
  { id: 103, subject: "भारत का सामान्य ज्ञान", title: "भारत की जलवायु एवं प्राकृतिक वनस्पति" },
  { id: 104, subject: "भारत का सामान्य ज्ञान", title: "प्राचीन भारत का इतिहास" },
  { id: 105, subject: "भारत का सामान्य ज्ञान", title: "मध्यकालीन भारत का इतिहास" },
  { id: 106, subject: "भारत का सामान्य ज्ञान", title: "आधुनिक भारत का इतिहास एवं राष्ट्रीय आंदोलन" },
  { id: 107, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "भारतीय संविधान का निर्माण, स्रोत एवं प्रस्तावना" },
  { id: 108, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "मौलिक अधिकार, नीति निदेशक तत्व एवं मूल कर्तव्य" },
  { id: 109, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "संघीय कार्यपालिका – राष्ट्रपति, उपराष्ट्रपति एवं प्रधानमंत्री" },
  { id: 110, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "संसद एवं केंद्रीय विधायिका" },
  { id: 111, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "न्यायपालिका – उच्चतम न्यायालय एवं उच्च न्यायालय" },
  { id: 112, subject: "भारतीय राजव्यवस्था एवं संविधान", title: "संवैधानिक एवं गैर-संवैधानिक आयोग" },
  { id: 113, subject: "भारतीय अर्थव्यवस्था", title: "भारतीय अर्थव्यवस्था, कृषि, उद्योग एवं वित्तीय बाजार" },
  { id: 114, subject: "सामान्य विज्ञान एवं प्रौद्योगिकी", title: "दैनिक जीवन में विज्ञान, भौतिक एवं रसायन" },
  { id: 115, subject: "सामान्य विज्ञान एवं प्रौद्योगिकी", title: "जीव विज्ञान, मानव शरीर एवं स्वास्थ्य" },
  { id: 116, subject: "सामान्य विज्ञान एवं प्रौद्योगिकी", title: "पर्यावरण, पारिस्थितिकी एवं जैव विविधता" },
  { id: 117, subject: "सामान्य विज्ञान एवं प्रौद्योगिकी", title: "कंप्यूटर, सूचना एवं संचार प्रौद्योगिकी (ICT)" },
  { id: 118, subject: "विश्व का सामान्य ज्ञान", title: "विश्व भूगोल – महाद्वीप, महासागर एवं पवन तंत्र" },
  { id: 119, subject: "तार्किक विवेचन एवं मानसिक योग्यता", title: "तर्कशक्ति एवं मानसिक योग्यता (Reasoning)" },
  { id: 120, subject: "आधारभूत गणित", title: "आधारभूत गणित एवं संख्यात्मक अभियोग्यता (Mathematics)" },
];

console.log(`Master topics defined:`);
console.log(`  - Rajasthan Master Topics: ${RAJASTHAN_MASTER_TOPICS.length}`);
console.log(`  - Other Subjects Master Topics: ${OTHER_SUBJECTS_MASTER_TOPICS.length}`);
console.log(`  - Total Combined Master Topics: ${RAJASTHAN_MASTER_TOPICS.length + OTHER_SUBJECTS_MASTER_TOPICS.length} (Well within 70-100 range!)`);
