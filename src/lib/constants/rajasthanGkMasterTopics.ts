/**
 * Authoritative Master Topic List for Rajasthan GK (70 Topics across 5 Sections).
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
      { id: 4, name: "Population and Census of Rajasthan", nameHindi: "राजस्थान की जनसंख्या एवं जनगणना" },
      { id: 5, name: "Soils of Rajasthan", nameHindi: "राजस्थान की मृदा" },
      { id: 6, name: "Drainage System, Rivers and Lakes of Rajasthan", nameHindi: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें" },
      { id: 7, name: "Irrigation Projects, Dams and Water Management", nameHindi: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन" },
      { id: 8, name: "Forests, Wildlife, Sanctuaries and National Parks", nameHindi: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान" },
      { id: 9, name: "Agriculture of Rajasthan", nameHindi: "राजस्थान की कृषि" },
      { id: 10, name: "Animal Husbandry of Rajasthan", nameHindi: "राजस्थान का पशुपालन" },
      { id: 11, name: "Mineral Resources of Rajasthan", nameHindi: "राजस्थान के खनिज संसाधन" },
      { id: 12, name: "Energy Resources of Rajasthan", nameHindi: "राजस्थान के ऊर्जा संसाधन" },
      { id: 13, name: "Major Industries of Rajasthan", nameHindi: "राजस्थान के प्रमुख उद्योग" },
      { id: 14, name: "Transportation in Rajasthan", nameHindi: "राजस्थान का परिवहन" },
      { id: 15, name: "Tourism in Rajasthan", nameHindi: "राजस्थान का पर्यटन" },
    ],
  },
  {
    code: "B",
    titleHindi: "राजस्थान कला एवं संस्कृति",
    titleEnglish: "Rajasthan Art & Culture",
    slug: "rajasthan-art-culture",
    topics: [
      { id: 16, name: "Fairs of Rajasthan", nameHindi: "राजस्थान के मेले" },
      { id: 17, name: "Festivals of Rajasthan", nameHindi: "राजस्थान के त्योहार" },
      { id: 18, name: "Customs and Traditions of Rajasthan", nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ" },
      { id: 19, name: "Costumes and Ornaments of Rajasthan", nameHindi: "राजस्थान की वेशभूषा एवं आभूषण" },
      { id: 20, name: "Architecture and Monuments of Rajasthan", nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला" },
      { id: 21, name: "Painting Schools of Rajasthan", nameHindi: "राजस्थान की चित्रकला शैलियाँ" },
      { id: 22, name: "Handicrafts and Crafts of Rajasthan", nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ" },
      { id: 23, name: "Folk Deities and Goddesses of Rajasthan", nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ" },
      { id: 24, name: "Saints Sects and Religious Traditions of Rajasthan", nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ" },
      { id: 25, name: "Folk Music and Folk Songs of Rajasthan", nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत" },
      { id: 26, name: "Folk Dances of Rajasthan", nameHindi: "राजस्थान के लोक नृत्य" },
      { id: 27, name: "Rajasthani Language and Dialects", nameHindi: "राजस्थानी भाषा एवं बोलियाँ" },
      { id: 28, name: "Rajasthani Literature", nameHindi: "राजस्थानी साहित्य" },
      { id: 29, name: "Rajasthani Vocabulary", nameHindi: "राजस्थानी शब्दावली" },
      { id: 30, name: "Rajasthani Idioms and Proverbs", nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ" },
      { id: 31, name: "Nicknames of Major Places in Rajasthan", nameHindi: "राजस्थान के प्रमुख स्थानों के उपनाम" },
    ],
  },
  {
    code: "C",
    titleHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास",
    titleEnglish: "Rajasthan Ancient & Medieval History",
    slug: "rajasthan-ancient-medieval-history",
    topics: [
      { id: 32, name: "Ancient Civilizations and Archaeological Sites of Rajasthan", nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल" },
      { id: 33, name: "Sources of Rajasthan History", nameHindi: "राजस्थान के इतिहास के स्रोत" },
      { id: 34, name: "Mahajanapadas and Ancient Political History of Rajasthan", nameHindi: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास" },
      { id: 35, name: "Rajput Period in Rajasthan", nameHindi: "राजस्थान का राजपूत काल" },
      { id: 36, name: "Guhil and Guhilot Dynasty of Mewar", nameHindi: "मेवाड़ का गुहिल/गुहिलोत वंश" },
      { id: 37, name: "Kachhwaha Dynasty of Amer", nameHindi: "आमेर का कछवाहा वंश" },
      { id: 38, name: "Chauhan Dynasty", nameHindi: "चौहान वंश" },
      { id: 39, name: "Gurjara Pratihara Dynasty", nameHindi: "गुर्जर-प्रतिहार वंश" },
      { id: 40, name: "Rathore Dynasty", nameHindi: "राठौड़ वंश" },
      { id: 41, name: "Other Major Dynasties of Rajasthan", nameHindi: "राजस्थान के अन्य प्रमुख राजवंश" },
      { id: 42, name: "Princely States of Rajasthan and British Treaties", nameHindi: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ" },
      { id: 43, name: "Administrative System of Medieval Rajasthan", nameHindi: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था" },
    ],
  },
  {
    code: "D",
    titleHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन",
    titleEnglish: "Modern Rajasthan & Freedom Movement",
    slug: "modern-rajasthan-freedom-movement",
    topics: [
      { id: 44, name: "Revolt of 1857 in Rajasthan", nameHindi: "राजस्थान में 1857 का विद्रोह" },
      { id: 45, name: "Peasant and Tribal Movements in Rajasthan", nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन" },
      { id: 46, name: "Prajamandal Movements in Rajasthan", nameHindi: "राजस्थान के प्रजामंडल आंदोलन" },
      { id: 47, name: "Freedom Struggle Organizations and Institutions in Rajasthan", nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ" },
      { id: 48, name: "Social and Political Awakening in Rajasthan", nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण" },
      { id: 49, name: "Integration of Rajasthan", nameHindi: "राजस्थान का एकीकरण" },
      { id: 50, name: "Prominent Personalities of Rajasthan", nameHindi: "राजस्थान के प्रमुख व्यक्तित्व" },
      { id: 51, name: "Prominent Women Personalities of Rajasthan", nameHindi: "राजस्थान की महिला व्यक्तित्व" },
      { id: 52, name: "Press and Journalism in Rajasthan", nameHindi: "राजस्थान में प्रेस एवं पत्रकारिता" },
    ],
  },
  {
    code: "E",
    titleHindi: "राजस्थान राजव्यवस्था / प्रशासन",
    titleEnglish: "Rajasthan Polity & Administration",
    slug: "rajasthan-polity-administration",
    topics: [
      { id: 53, name: "Rajasthan State Administration", nameHindi: "राजस्थान राज्य प्रशासन" },
      { id: 54, name: "Governor of Rajasthan", nameHindi: "राजस्थान के राज्यपाल" },
      { id: 55, name: "Chief Minister of Rajasthan", nameHindi: "राजस्थान के मुख्यमंत्री" },
      { id: 56, name: "Council of Ministers and Cabinet of Rajasthan", nameHindi: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल" },
      { id: 57, name: "Rajasthan State Legislature", nameHindi: "राजस्थान राज्य विधानमंडल" },
      { id: 58, name: "Rajasthan High Court and Judiciary", nameHindi: "राजस्थान उच्च न्यायालय एवं न्यायपालिका" },
      { id: 59, name: "District Administration of Rajasthan", nameHindi: "राजस्थान जिला प्रशासन" },
      { id: 60, name: "Panchayati Raj in Rajasthan", nameHindi: "राजस्थान पंचायती राज" },
      { id: 61, name: "Rajasthan Public Service Commission RPSC", nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)" },
      { id: 62, name: "Rajasthan State Election Commission", nameHindi: "राजस्थान राज्य निर्वाचन आयोग" },
      { id: 63, name: "Rajasthan State Human Rights Commission", nameHindi: "राजस्थान मानवाधिकार आयोग" },
      { id: 64, name: "Rajasthan State Commission for Women", nameHindi: "राजस्थान महिला आयोग" },
      { id: 65, name: "Lokayukta of Rajasthan", nameHindi: "राजस्थान लोकायुक्त" },
      { id: 66, name: "Constitutional Commissions and Institutions of Rajasthan", nameHindi: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ" },
      { id: 67, name: "Major Research and Study Centers of Rajasthan", nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र" },
      { id: 68, name: "Science and Technology in Rajasthan", nameHindi: "राजस्थान विज्ञान एवं प्रौद्योगिकी" },
      { id: 69, name: "Urban Local Governance and Municipalities in Rajasthan", nameHindi: "राजस्थान नगरीय स्वशासन एवं नगरपालिका" },
      { id: 70, name: "Rajasthan Budget and Economic Review", nameHindi: "राजस्थान का बजट एवं आर्थिक समीक्षा" },
    ],
  },
];
