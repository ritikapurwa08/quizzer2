export interface MasterTopicInfo {
  id: number;
  nameHindi: string;
  nameEnglish: string;
  subjectHindi: string;
  subjectName: string;
}

export const MASTER_TOPICS_LIST: MasterTopicInfo[] = [
  // A. राजस्थान सामान्य ज्ञान एवं भूगोल (1-20)
  { id: 1, nameHindi: "राजस्थान का सामान्य ज्ञान", nameEnglish: "General Knowledge of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 2, nameHindi: "राजस्थान का भौतिक स्वरूप एवं भूगोल", nameEnglish: "Physical Features and Geography of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 3, nameHindi: "राजस्थान की जलवायु", nameEnglish: "Climate of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 4, nameHindi: "राजस्थान के जिले एवं संभाग", nameEnglish: "Districts and Divisions of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 5, nameHindi: "राजस्थान की जनसंख्या एवं जनगणना", nameEnglish: "Population and Census of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 6, nameHindi: "राजस्थान की मृदा", nameEnglish: "Soils of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 7, nameHindi: "राजस्थान की नदियाँ एवं जल संसाधन", nameEnglish: "Rivers and Water Resources of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 8, nameHindi: "राजस्थान की झीलें", nameEnglish: "Lakes of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 9, nameHindi: "राजस्थान की सिंचाई एवं सिंचाई परियोजनाएँ", nameEnglish: "Irrigation and Irrigation Projects of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 10, nameHindi: "राजस्थान के वन एवं वन्यजीव", nameEnglish: "Forests and Wildlife of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 11, nameHindi: "राजस्थान के अभयारण्य एवं राष्ट्रीय उद्यान", nameEnglish: "Sanctuaries and National Parks of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 12, nameHindi: "राजस्थान में मरुस्थलीकरण", nameEnglish: "Desertification in Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 13, nameHindi: "राजस्थान की कृषि", nameEnglish: "Agriculture of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 14, nameHindi: "राजस्थान का पशुपालन", nameEnglish: "Animal Husbandry of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 15, nameHindi: "राजस्थान के खनिज संसाधन", nameEnglish: "Mineral Resources of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 16, nameHindi: "राजस्थान के ऊर्जा संसाधन", nameEnglish: "Energy Resources of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 17, nameHindi: "राजस्थान के प्रमुख उद्योग", nameEnglish: "Major Industries of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 18, nameHindi: "राजस्थान का परिवहन", nameEnglish: "Transportation in Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 19, nameHindi: "राजस्थान का पर्यटन", nameEnglish: "Tourism in Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 20, nameHindi: "राजस्थान के पारंपरिक जल स्रोत एवं जल प्रबंधन", nameEnglish: "Traditional Water Sources and Water Management", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },

  // B. राजस्थान कला एवं संस्कृति (21-36)
  { id: 21, nameHindi: "राजस्थान के मेले", nameEnglish: "Fairs of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 22, nameHindi: "राजस्थान के त्योहार", nameEnglish: "Festivals of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 23, nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ", nameEnglish: "Customs and Traditions of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 24, nameHindi: "राजस्थान की वेशभूषा एवं आभूषण", nameEnglish: "Costumes and Ornaments of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 25, nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला", nameEnglish: "Architecture and Monuments of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 26, nameHindi: "राजस्थान की चित्रकला शैलियाँ", nameEnglish: "Painting Schools of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 27, nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ", nameEnglish: "Handicrafts and Crafts of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 28, nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ", nameEnglish: "Folk Deities and Goddesses of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 29, nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ", nameEnglish: "Saints Sects and Religious Traditions of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 30, nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत", nameEnglish: "Folk Music and Folk Songs of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 31, nameHindi: "राजस्थान के लोक नृत्य", nameEnglish: "Folk Dances of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 32, nameHindi: "राजस्थानी भाषा एवं बोलियाँ", nameEnglish: "Rajasthani Language and Dialects", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 33, nameHindi: "राजस्थानी साहित्य", nameEnglish: "Rajasthani Literature", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 34, nameHindi: "राजस्थानी शब्दावली", nameEnglish: "Rajasthani Vocabulary", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 35, nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ", nameEnglish: "Rajasthani Idioms and Proverbs", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 36, nameHindi: "राजस्थान के प्रमुख स्थानों के उपनाम", nameEnglish: "Nicknames of Major Places in Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },

  // C. राजस्थान प्राचीन एवं मध्यकालीन इतिहास (37-48)
  { id: 37, nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", nameEnglish: "Ancient Civilizations and Archaeological Sites of Rajasthan", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 38, nameHindi: "राजस्थान के इतिहास के स्रोत", nameEnglish: "Sources of Rajasthan History", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 39, nameHindi: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास", nameEnglish: "Mahajanapadas and Ancient Political History of Rajasthan", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 40, nameHindi: "राजस्थान का राजपूत काल", nameEnglish: "Rajput Period in Rajasthan", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 41, nameHindi: "मेवाड़ का गुहिल/गुहिलोत वंश", nameEnglish: "Guhil and Guhilot Dynasty of Mewar", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 42, nameHindi: "आमेर का कछवाहा वंश", nameEnglish: "Kachhwaha Dynasty of Amer", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 43, nameHindi: "चौहान वंश", nameEnglish: "Chauhan Dynasty", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 44, nameHindi: "गुर्जर-प्रतिहार वंश", nameEnglish: "Gurjara Pratihara Dynasty", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 45, nameHindi: "राठौड़ वंश", nameEnglish: "Rathore Dynasty", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 46, nameHindi: "राजस्थान के अन्य प्रमुख राजवंश", nameEnglish: "Other Major Dynasties of Rajasthan", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 47, nameHindi: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ", nameEnglish: "Princely States of Rajasthan and British Treaties", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },
  { id: 48, nameHindi: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था", nameEnglish: "Administrative System of Medieval Rajasthan", subjectHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास", subjectName: "Rajasthan Ancient & Medieval History" },

  // D. आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन (49-57)
  { id: 49, nameHindi: "राजस्थान में 1857 का विद्रोह", nameEnglish: "Revolt of 1857 in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 50, nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन", nameEnglish: "Peasant and Tribal Movements in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 51, nameHindi: "राजस्थान के प्रजामंडल आंदोलन", nameEnglish: "Prajamandal Movements in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 52, nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ", nameEnglish: "Freedom Struggle Organizations and Institutions in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 53, nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण", nameEnglish: "Social and Political Awakening in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 54, nameHindi: "राजस्थान का एकीकरण", nameEnglish: "Integration of Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 55, nameHindi: "राजस्थान के प्रमुख व्यक्तित्व", nameEnglish: "Prominent Personalities of Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 56, nameHindi: "राजस्थान की महिला व्यक्तित्व", nameEnglish: "Prominent Women Personalities of Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },
  { id: 57, nameHindi: "राजस्थान में प्रेस एवं पत्रकारिता", nameEnglish: "Press and Journalism in Rajasthan", subjectHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन", subjectName: "Modern Rajasthan & Freedom Movement" },

  // E. राजस्थान राजव्यवस्था / प्रशासन (58-75)
  { id: 58, nameHindi: "राजस्थान राज्य प्रशासन", nameEnglish: "Rajasthan State Administration", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 59, nameHindi: "राजस्थान के राज्यपाल", nameEnglish: "Governor of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 60, nameHindi: "राजस्थान के मुख्यमंत्री", nameEnglish: "Chief Minister of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 61, nameHindi: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल", nameEnglish: "Council of Ministers and Cabinet of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 62, nameHindi: "राजस्थान राज्य विधानमंडल", nameEnglish: "Rajasthan State Legislature", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 63, nameHindi: "राजस्थान उच्च न्यायालय एवं न्यायपालिका", nameEnglish: "Rajasthan High Court and Judiciary", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 64, nameHindi: "राजस्थान जिला प्रशासन", nameEnglish: "District Administration of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 65, nameHindi: "राजस्थान पंचायती राज", nameEnglish: "Panchayati Raj in Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 66, nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)", nameEnglish: "Rajasthan Public Service Commission RPSC", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 67, nameHindi: "राजस्थान राज्य निर्वाचन आयोग", nameEnglish: "Rajasthan State Election Commission", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 68, nameHindi: "राजस्थान मानवाधिकार आयोग", nameEnglish: "Rajasthan State Human Rights Commission", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 69, nameHindi: "राजस्थान महिला आयोग", nameEnglish: "Rajasthan State Commission for Women", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 70, nameHindi: "राजस्थान लोकायुक्त", nameEnglish: "Lokayukta of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 71, nameHindi: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ", nameEnglish: "Constitutional Commissions and Institutions of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 72, nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र", nameEnglish: "Major Research and Study Centers of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 73, nameHindi: "राजस्थान विज्ञान एवं प्रौद्योगिकी", nameEnglish: "Science and Technology in Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 74, nameHindi: "राजस्थान नगरीय स्वशासन एवं नगरपालिका", nameEnglish: "Urban Local Governance and Municipalities in Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 75, nameHindi: "राजस्थान का बजट एवं आर्थिक समीक्षा", nameEnglish: "Rajasthan Budget and Economic Review", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
];

export function getTopicById(id: number): MasterTopicInfo | undefined {
  return MASTER_TOPICS_LIST.find((t) => t.id === id);
}

export function getTopicByName(nameHindi: string): MasterTopicInfo | undefined {
  const clean = nameHindi.trim().replace(/_/g, "/");
  if (clean === "राजस्थान पंचायती राज एवं स्थानीय स्वशासन") {
    return MASTER_TOPICS_LIST.find((t) => t.id === 65);
  }
  return MASTER_TOPICS_LIST.find(
    (t) => t.nameHindi === clean || t.nameHindi === nameHindi.trim()
  );
}
