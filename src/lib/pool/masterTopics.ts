export interface MasterTopicInfo {
  id: number;
  nameHindi: string;
  nameEnglish: string;
  subjectHindi: string;
  subjectName: string;
}

export const MASTER_TOPICS_LIST: MasterTopicInfo[] = [
  // A. राजस्थान सामान्य ज्ञान एवं भूगोल (1-15)
  { id: 1, nameHindi: "राजस्थान का सामान्य ज्ञान", nameEnglish: "General Knowledge of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 2, nameHindi: "राजस्थान का भौतिक स्वरूप एवं भूगोल", nameEnglish: "Physical Features and Geography of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 3, nameHindi: "राजस्थान की जलवायु", nameEnglish: "Climate of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 4, nameHindi: "राजस्थान की जनसंख्या एवं जनगणना", nameEnglish: "Population and Census of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 5, nameHindi: "राजस्थान की मृदा", nameEnglish: "Soils of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 6, nameHindi: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें", nameEnglish: "Drainage System, Rivers and Lakes of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 7, nameHindi: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन", nameEnglish: "Irrigation Projects, Dams and Water Management", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 8, nameHindi: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान", nameEnglish: "Forests, Wildlife, Sanctuaries and National Parks", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 9, nameHindi: "राजस्थान की कृषि", nameEnglish: "Agriculture of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 10, nameHindi: "राजस्थान का पशुपालन एवं डेयरी विकास", nameEnglish: "Animal Husbandry and Dairy Development of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 11, nameHindi: "राजस्थान के खनिज संसाधन", nameEnglish: "Mineral Resources of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 12, nameHindi: "राजस्थान के ऊर्जा संसाधन", nameEnglish: "Energy Resources of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 13, nameHindi: "राजस्थान के प्रमुख उद्योग", nameEnglish: "Major Industries of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 14, nameHindi: "राजस्थान का परिवहन", nameEnglish: "Transportation in Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },
  { id: 15, nameHindi: "राजस्थान का पर्यटन एवं पर्यटन परिपथ", nameEnglish: "Tourism and Tourist Circuits of Rajasthan", subjectHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल", subjectName: "Rajasthan General Knowledge & Geography" },

  // B. राजस्थान का इतिहास (16-25)
  { id: 16, nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", nameEnglish: "Ancient Civilizations and Archaeological Sites of Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 17, nameHindi: "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)", nameEnglish: "Major Rajput Dynasties and Administrative System of Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 18, nameHindi: "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ", nameEnglish: "Revolt of 1857 and British Treaties in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 19, nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन", nameEnglish: "Peasant and Tribal Movements in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 20, nameHindi: "राजस्थान के प्रजामंडल आंदोलन", nameEnglish: "Prajamandal Movements in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 21, nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ", nameEnglish: "Freedom Struggle Organizations and Institutions in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 22, nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण", nameEnglish: "Social and Political Awakening in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 23, nameHindi: "राजस्थान का एकीकरण", nameEnglish: "Integration of Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 24, nameHindi: "राजस्थान के प्रमुख व्यक्तित्व", nameEnglish: "Prominent Personalities of Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },
  { id: 25, nameHindi: "राजस्थान की महिला व्यक्तित्व एवं पत्रकारिता", nameEnglish: "Women Personalities and Journalism in Rajasthan", subjectHindi: "राजस्थान का इतिहास", subjectName: "Rajasthan History" },

  // C. राजस्थान कला एवं संस्कृति (26-40)
  { id: 26, nameHindi: "राजस्थान के मेले", nameEnglish: "Fairs of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 27, nameHindi: "राजस्थान के त्योहार", nameEnglish: "Festivals of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 28, nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ", nameEnglish: "Customs and Traditions of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 29, nameHindi: "राजस्थान की वेशभूषा एवं आभूषण", nameEnglish: "Costumes and Ornaments of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 30, nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला", nameEnglish: "Architecture and Monuments of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 31, nameHindi: "राजस्थान की चित्रकला शैलियाँ", nameEnglish: "Painting Schools of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 32, nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ", nameEnglish: "Handicrafts and Crafts of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 33, nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ", nameEnglish: "Folk Deities and Goddesses of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 34, nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ", nameEnglish: "Saints Sects and Religious Traditions of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 35, nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत", nameEnglish: "Folk Music and Folk Songs of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 36, nameHindi: "राजस्थान के लोक नृत्य एवं नाट्य", nameEnglish: "Folk Dances and Drama of Rajasthan", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 37, nameHindi: "राजस्थानी भाषा एवं बोलियाँ", nameEnglish: "Rajasthani Language and Dialects", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 38, nameHindi: "राजस्थानी साहित्य", nameEnglish: "Rajasthani Literature", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 39, nameHindi: "राजस्थानी शब्दावली", nameEnglish: "Rajasthani Vocabulary", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },
  { id: 40, nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ", nameEnglish: "Rajasthani Idioms and Proverbs", subjectHindi: "राजस्थान कला एवं संस्कृति", subjectName: "Rajasthan Art & Culture" },

  // D. राजस्थान राजव्यवस्था एवं प्रशासन (41-55)
  { id: 41, nameHindi: "राजस्थान के राज्यपाल", nameEnglish: "Governor of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 42, nameHindi: "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद", nameEnglish: "Chief Minister and Council of Ministers of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 43, nameHindi: "राजस्थान राज्य विधानमंडल (विधानसभा)", nameEnglish: "Rajasthan State Legislature", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 44, nameHindi: "राजस्थान उच्च न्यायालय एवं अधीनस्थ न्यायपालिका", nameEnglish: "Rajasthan High Court and Subordinate Judiciary", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 45, nameHindi: "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन", nameEnglish: "State Secretariat, Chief Secretary, Divisional Commissioner and District Administration", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 46, nameHindi: "राजस्थान पंचायती राज व्यवस्था एवं प्रशासन", nameEnglish: "Panchayati Raj in Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 47, nameHindi: "राजस्थान नगरीय स्वशासन एवं नगरपालिका", nameEnglish: "Urban Local Governance and Municipalities in Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 48, nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)", nameEnglish: "Rajasthan Public Service Commission RPSC", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 49, nameHindi: "राजस्थान राज्य निर्वाचन आयोग (RSEC)", nameEnglish: "Rajasthan State Election Commission", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 50, nameHindi: "राजस्थान राज्य मानवाधिकार आयोग (RSHRC)", nameEnglish: "Rajasthan State Human Rights Commission", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 51, nameHindi: "राजस्थान राज्य महिला आयोग (RSCW)", nameEnglish: "Rajasthan State Commission for Women", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 52, nameHindi: "राजस्थान राज्य वित्त आयोग (RSFC)", nameEnglish: "Rajasthan State Finance Commission", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 53, nameHindi: "राजस्थान राज्य विधिक सेवा प्राधिकरण (RSLA / RSLSA)", nameEnglish: "Rajasthan State Legal Services Authority", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 54, nameHindi: "राजस्थान लोकायुक्त एवं उप-लोकायुक्त", nameEnglish: "Lokayukta and Up-Lokayukta of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
  { id: 55, nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र", nameEnglish: "Major Research and Study Centers of Rajasthan", subjectHindi: "राजस्थान राजव्यवस्था / प्रशासन", subjectName: "Rajasthan Polity & Administration" },
];

export function getTopicById(id: number): MasterTopicInfo | undefined {
  return MASTER_TOPICS_LIST.find((t) => t.id === id);
}

export function getTopicByName(nameHindi: string): MasterTopicInfo | undefined {
  const clean = nameHindi.trim().replace(/_/g, "/");
  if (clean === "राजस्थान पंचायती राज एवं स्थानीय स्वशासन" || clean === "राजस्थान पंचायती राज") {
    return MASTER_TOPICS_LIST.find((t) => t.id === 46);
  }
  if (clean === "राजस्थान के मुख्यमंत्री" || clean === "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल") {
    return MASTER_TOPICS_LIST.find((t) => t.id === 42);
  }
  if (clean === "राजस्थान राज्य प्रशासन" || clean === "राजस्थान जिला प्रशासन") {
    return MASTER_TOPICS_LIST.find((t) => t.id === 45);
  }
  if (clean === "राजस्थान के प्रमुख स्थानों के उपनाम") {
    return MASTER_TOPICS_LIST.find((t) => t.id === 1);
  }
  return MASTER_TOPICS_LIST.find(
    (t) => t.nameHindi === clean || t.nameHindi === nameHindi.trim()
  );
}
