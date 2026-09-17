/**
 * Authoritative Master Topic List for Rajasthan GK (73 Topics across 5 Sections).
 * Strictly exclusive: India GK, English, etc. are NOT included.
 */

export interface MasterTopic {
  id: number;
  name: string;
  nameHindi: string;
}

export interface MasterSection {
  code: "A" | "B" | "C" | "D" | "E";
  titleHindi: string;
  titleEnglish: string;
  slug: string;
  topics: MasterTopic[];
}

export const RAJASTHAN_GK_MASTER_SECTIONS: MasterSection[] = [
  {
    code: "A",
    titleHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल",
    titleEnglish: "Rajasthan General Knowledge & Geography",
    slug: "rajasthan-general-knowledge-geography",
    topics: [
      { id: 1, name: "General Knowledge of Rajasthan", nameHindi: "राजस्थान का सामान्य ज्ञान" },
      { id: 2, name: "Physical Features and Geography of Rajasthan", nameHindi: "राजस्थान का भौतिक स्वरूप एवं भूगोल" },
      { id: 3, name: "Climate of Rajasthan", nameHindi: "राजस्थान की जलवायु" },
      { id: 4, name: "Districts and Divisions of Rajasthan", nameHindi: "राजस्थान के जिले एवं संभाग" },
      { id: 5, name: "Population and Census of Rajasthan", nameHindi: "राजस्थान की जनसंख्या एवं जनगणना" },
      { id: 6, name: "Soils of Rajasthan", nameHindi: "राजस्थान की मृदा" },
      { id: 7, name: "Rivers and Water Resources of Rajasthan", nameHindi: "राजस्थान की नदियाँ एवं जल संसाधन" },
      { id: 8, name: "Lakes of Rajasthan", nameHindi: "राजस्थान की झीलें" },
      { id: 9, name: "Irrigation and Irrigation Projects of Rajasthan", nameHindi: "राजस्थान की सिंचाई एवं सिंचाई परियोजनाएँ" },
      { id: 10, name: "Forests and Wildlife of Rajasthan", nameHindi: "राजस्थान के वन एवं वन्यजीव" },
      { id: 11, name: "Sanctuaries and National Parks of Rajasthan", nameHindi: "राजस्थान के अभयारण्य एवं राष्ट्रीय उद्यान" },
      { id: 12, name: "Desertification in Rajasthan", nameHindi: "राजस्थान में मरुस्थलीकरण" },
      { id: 13, name: "Agriculture of Rajasthan", nameHindi: "राजस्थान की कृषि" },
      { id: 14, name: "Animal Husbandry of Rajasthan", nameHindi: "राजस्थान का पशुपालन" },
      { id: 15, name: "Mineral Resources of Rajasthan", nameHindi: "राजस्थान के खनिज संसाधन" },
      { id: 16, name: "Energy Resources of Rajasthan", nameHindi: "राजस्थान के ऊर्जा संसाधन" },
      { id: 17, name: "Major Industries of Rajasthan", nameHindi: "राजस्थान के प्रमुख उद्योग" },
      { id: 18, name: "Transportation in Rajasthan", nameHindi: "राजस्थान का परिवहन" },
      { id: 19, name: "Tourism in Rajasthan", nameHindi: "राजस्थान का पर्यटन" },
      { id: 20, name: "Traditional Water Sources and Water Management", nameHindi: "राजस्थान के पारंपरिक जल स्रोत एवं जल प्रबंधन" },
    ],
  },
  {
    code: "B",
    titleHindi: "राजस्थान कला एवं संस्कृति",
    titleEnglish: "Rajasthan Art & Culture",
    slug: "rajasthan-art-culture",
    topics: [
      { id: 21, name: "Fairs of Rajasthan", nameHindi: "राजस्थान के मेले" },
      { id: 22, name: "Festivals of Rajasthan", nameHindi: "राजस्थान के त्योहार" },
      { id: 23, name: "Customs and Traditions of Rajasthan", nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ" },
      { id: 24, name: "Costumes and Ornaments of Rajasthan", nameHindi: "राजस्थान की वेशभूषा एवं आभूषण" },
      { id: 25, name: "Architecture and Monuments of Rajasthan", nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला" },
      { id: 26, name: "Painting Schools of Rajasthan", nameHindi: "राजस्थान की चित्रकला शैलियाँ" },
      { id: 27, name: "Handicrafts and Crafts of Rajasthan", nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ" },
      { id: 28, name: "Folk Deities and Goddesses of Rajasthan", nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ" },
      { id: 29, name: "Saints Sects and Religious Traditions of Rajasthan", nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ" },
      { id: 30, name: "Folk Music and Folk Songs of Rajasthan", nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत" },
      { id: 31, name: "Folk Dances of Rajasthan", nameHindi: "राजस्थान के लोक नृत्य" },
      { id: 32, name: "Rajasthani Language and Dialects", nameHindi: "राजस्थानी भाषा एवं बोलियाँ" },
      { id: 33, name: "Rajasthani Literature", nameHindi: "राजस्थानी साहित्य" },
      { id: 34, name: "Rajasthani Vocabulary", nameHindi: "राजस्थानी शब्दावली" },
      { id: 35, name: "Rajasthani Idioms and Proverbs", nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ" },
      { id: 36, name: "Nicknames of Major Places in Rajasthan", nameHindi: "राजस्थान के प्रमुख स्थानों के उपनाम" },
    ],
  },
  {
    code: "C",
    titleHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास",
    titleEnglish: "Rajasthan Ancient & Medieval History",
    slug: "rajasthan-ancient-medieval-history",
    topics: [
      { id: 37, name: "Ancient Civilizations and Archaeological Sites of Rajasthan", nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल" },
      { id: 38, name: "Sources of Rajasthan History", nameHindi: "राजस्थान के इतिहास के स्रोत" },
      { id: 39, name: "Mahajanapadas and Ancient Political History of Rajasthan", nameHindi: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास" },
      { id: 40, name: "Rajput Period in Rajasthan", nameHindi: "राजस्थान का राजपूत काल" },
      { id: 41, name: "Guhil and Guhilot Dynasty of Mewar", nameHindi: "मेवाड़ का गुहिल/गुहिलोत वंश" },
      { id: 42, name: "Kachhwaha Dynasty of Amer", nameHindi: "आमेर का कछवाहा वंश" },
      { id: 43, name: "Chauhan Dynasty", nameHindi: "चौहान वंश" },
      { id: 44, name: "Gurjara Pratihara Dynasty", nameHindi: "गुर्जर-प्रतिहार वंश" },
      { id: 45, name: "Rathore Dynasty", nameHindi: "राठौड़ वंश" },
      { id: 46, name: "Other Major Dynasties of Rajasthan", nameHindi: "राजस्थान के अन्य प्रमुख राजवंश" },
      { id: 47, name: "Princely States of Rajasthan and British Treaties", nameHindi: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ" },
      { id: 48, name: "Administrative System of Medieval Rajasthan", nameHindi: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था" },
    ],
  },
  {
    code: "D",
    titleHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन",
    titleEnglish: "Modern Rajasthan & Freedom Movement",
    slug: "modern-rajasthan-freedom-movement",
    topics: [
      { id: 49, name: "Revolt of 1857 in Rajasthan", nameHindi: "राजस्थान में 1857 का विद्रोह" },
      { id: 50, name: "Peasant and Tribal Movements in Rajasthan", nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन" },
      { id: 51, name: "Prajamandal Movements in Rajasthan", nameHindi: "राजस्थान के प्रजामंडल आंदोलन" },
      { id: 52, name: "Freedom Struggle Organizations and Institutions in Rajasthan", nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ" },
      { id: 53, name: "Social and Political Awakening in Rajasthan", nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण" },
      { id: 54, name: "Integration of Rajasthan", nameHindi: "राजस्थान का एकीकरण" },
      { id: 55, name: "Prominent Personalities of Rajasthan", nameHindi: "राजस्थान के प्रमुख व्यक्तित्व" },
      { id: 56, name: "Prominent Women Personalities of Rajasthan", nameHindi: "राजस्थान की महिला व्यक्तित्व" },
      { id: 57, name: "Press and Journalism in Rajasthan", nameHindi: "राजस्थान में प्रेस एवं पत्रकारिता" },
    ],
  },
  {
    code: "E",
    titleHindi: "राजस्थान राजव्यवस्था / प्रशासन",
    titleEnglish: "Rajasthan Polity & Administration",
    slug: "rajasthan-polity-administration",
    topics: [
      { id: 58, name: "Rajasthan State Administration", nameHindi: "राजस्थान राज्य प्रशासन" },
      { id: 59, name: "Governor of Rajasthan", nameHindi: "राजस्थान के राज्यपाल" },
      { id: 60, name: "Chief Minister of Rajasthan", nameHindi: "राजस्थान के मुख्यमंत्री" },
      { id: 61, name: "Council of Ministers and Cabinet of Rajasthan", nameHindi: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल" },
      { id: 62, name: "Rajasthan State Legislature", nameHindi: "राजस्थान राज्य विधानमंडल" },
      { id: 63, name: "Rajasthan High Court and Judiciary", nameHindi: "राजस्थान उच्च न्यायालय एवं न्यायपालिका" },
      { id: 64, name: "District Administration of Rajasthan", nameHindi: "राजस्थान जिला प्रशासन" },
      { id: 65, name: "Panchayati Raj and Local Self Government in Rajasthan", nameHindi: "राजस्थान पंचायती राज एवं स्थानीय स्वशासन" },
      { id: 66, name: "Rajasthan Public Service Commission RPSC", nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)" },
      { id: 67, name: "Rajasthan State Election Commission", nameHindi: "राजस्थान राज्य निर्वाचन आयोग" },
      { id: 68, name: "Rajasthan State Human Rights Commission", nameHindi: "राजस्थान मानवाधिकार आयोग" },
      { id: 69, name: "Rajasthan State Commission for Women", nameHindi: "राजस्थान महिला आयोग" },
      { id: 70, name: "Lokayukta of Rajasthan", nameHindi: "राजस्थान लोकायुक्त" },
      { id: 71, name: "Constitutional Commissions and Institutions of Rajasthan", nameHindi: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ" },
      { id: 72, name: "Major Research and Study Centers of Rajasthan", nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र" },
      { id: 73, name: "Science and Technology in Rajasthan", nameHindi: "राजस्थान विज्ञान एवं प्रौद्योगिकी" },
    ],
  },
];

export const ALL_RAJASTHAN_GK_TOPICS: MasterTopic[] = RAJASTHAN_GK_MASTER_SECTIONS.flatMap((s) => s.topics);
