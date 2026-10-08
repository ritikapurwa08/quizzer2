/**
 * Authoritative Static Syllabus Architecture for Quizzer
 * Exclusively dedicated to Rajasthan GK across 4 Canonical Subjects and 55 Master Topics.
 * Conforms to AGENTS.md syllabus contract, RPSC 2nd Grade Paper 1 and RSMSSB CET standards.
 */

export interface StaticSubTopic {
  id: string;
  titleHindi: string;
  titleEnglish: string;
  keyPoints?: string[];
}

export interface StaticTopic {
  id: number; // Canonical Topic ID: 1 - 55
  slug: string;
  name: string;
  nameHindi: string;
  subjectSlug: string;
  subjectHindi: string;
  examScope: "2nd_grade" | "cet" | "both";
  isCommon: boolean;
  commonKey?: string;
  subTopics: StaticSubTopic[];
}

export interface StaticSubject {
  slug: string;
  name: string;
  nameHindi: string;
  order: number;
  description: string;
  topicCount: number;
  topicIdRange: [number, number];
}

export const CANONICAL_SUBJECTS: StaticSubject[] = [
  {
    slug: "rajasthan-general-knowledge-geography",
    name: "Rajasthan General Knowledge & Geography",
    nameHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल",
    order: 1,
    description: "राजस्थान का सामान्य ज्ञान, भौतिक स्वरूप, भूगोल, जलवायु, नदियाँ, झीलें, कृषि, वन एवं खनिज संसाधन",
    topicCount: 15,
    topicIdRange: [1, 15],
  },
  {
    slug: "rajasthan-history",
    name: "Rajasthan History",
    nameHindi: "राजस्थान का इतिहास",
    order: 2,
    description: "राजस्थान का संपूर्ण इतिहास: प्राचीन सभ्यताएँ, राजपूत राजवंश, दिल्ली सल्तनत एवं मुग़ल संबंध, 1857 की क्रांति, प्रजामंडल, किसान व आदिवासी आंदोलन, एकीकरण एवं प्रमुख व्यक्तित्व",
    topicCount: 10,
    topicIdRange: [16, 25],
  },
  {
    slug: "rajasthan-art-culture",
    name: "Rajasthan Art & Culture",
    nameHindi: "राजस्थान कला एवं संस्कृति",
    order: 3,
    description: "मेले, त्योहार, रीति-रिवाज, वेशभूषा, स्थापत्य, चित्रकला, हस्तशिल्प, लोक देवता, संगीत, नृत्य, भाषा एवं साहित्य",
    topicCount: 15,
    topicIdRange: [26, 40],
  },
  {
    slug: "rajasthan-polity-administration",
    name: "Rajasthan Polity & Administration",
    nameHindi: "राजस्थान राजव्यवस्था एवं प्रशासन",
    order: 4,
    description: "राज्य सचिवालय, राज्यपाल, मुख्यमंत्री, मंत्रिपरिषद, विधानमंडल, उच्च न्यायालय, जिला प्रशासन, पंचायती राज व सांविधानिक आयोग",
    topicCount: 15,
    topicIdRange: [41, 55],
  },
];

export const CANONICAL_TOPICS: StaticTopic[] = [
  {
    "id": 1,
    "slug": "general-knowledge-of-rajasthan",
    "name": "General Knowledge of Rajasthan",
    "nameHindi": "राजस्थान का सामान्य ज्ञान",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-gk-general",
    "subTopics": [
      {
        "id": "sub-1-1",
        "titleHindi": "स्थिति, विस्तार एवं सीमावर्ती राज्य/देश",
        "titleEnglish": "Geographical Location & International/State Boundaries"
      },
      {
        "id": "sub-1-2",
        "titleHindi": "संभाग एवं जिलों का पुनर्गठन",
        "titleEnglish": "Administrative Divisions & Reorganized Districts"
      },
      {
        "id": "sub-1-3",
        "titleHindi": "राजस्थान के राज्य प्रतीक (पुष्प, वृक्ष, पशु, पक्षी, खेल, गीत)",
        "titleEnglish": "State Symbols of Rajasthan"
      },
      {
        "id": "sub-1-4",
        "titleHindi": "प्रथम पदाधिकारी एवं प्रमुख व्यक्तित्व",
        "titleEnglish": "First Dignitaries & Historical Firsts"
      },
      {
        "id": "sub-1-5",
        "titleHindi": "प्रमुख नगरों एवं स्थलों के भौगोलिक व सांस्कृतिक उपनाम",
        "titleEnglish": "Nicknames of Major Places and Regions"
      },
      {
        "id": "sub-1-6",
        "titleHindi": "राजस्थान के प्राचीन एवं मध्यकालीन भौगोलिक नाम",
        "titleEnglish": "Ancient & Historical Place Names"
      }
    ]
  },
  {
    "id": 2,
    "slug": "physical-features-geography-rajasthan",
    "name": "Physical Features and Geography of Rajasthan",
    "nameHindi": "राजस्थान का भौतिक स्वरूप एवं भूगोल",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-physical",
    "subTopics": [
      {
        "id": "sub-2-1",
        "titleHindi": "थार का मरुस्थल (शुष्क व अर्द्धशुष्क मैदान, बालुका स्तूप, लाठी सीरीज)",
        "titleEnglish": "Thar Desert & Dune Formations"
      },
      {
        "id": "sub-2-2",
        "titleHindi": "अरावली पर्वतीय प्रदेश (उत्तरी, मध्य, दक्षिणी अरावली, चोटियाँ व दर्रे)",
        "titleEnglish": "Aravalli Range & Mountain Passes"
      },
      {
        "id": "sub-2-3",
        "titleHindi": "पूर्वी मैदान (बनास बेसिन, छप्पन का मैदान, चंबल बीहड़)",
        "titleEnglish": "Eastern Plain & Basins"
      },
      {
        "id": "sub-2-4",
        "titleHindi": "हाड़ौती का पठार (दक्कन लावा पठार, विंध्यन कगार भूमि)",
        "titleEnglish": "Hadoti Plateau & Vindhyan Scarplands"
      }
    ]
  },
  {
    "id": 3,
    "slug": "climate-of-rajasthan",
    "name": "Climate of Rajasthan",
    "nameHindi": "राजस्थान की जलवायु",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-climate",
    "subTopics": [
      {
        "id": "sub-3-1",
        "titleHindi": "ऋतु चक्र एवं स्थानीय पवने (लू, मावठ, पुरवइयाँ)",
        "titleEnglish": "Seasons & Local Wind Phenomena"
      },
      {
        "id": "sub-3-2",
        "titleHindi": "कोपेन का जलवायु वर्गीकरण (BWhw, BShw, Cwg, Aw)",
        "titleEnglish": "Koeppen Climate Classification"
      },
      {
        "id": "sub-3-3",
        "titleHindi": "थॉर्नथवेट व ट्रिवार्था का जलवायु वर्गीकरण",
        "titleEnglish": "Thornthwaite & Trewartha Systems"
      },
      {
        "id": "sub-3-4",
        "titleHindi": "वर्षा का वितरण एवं 50 सेमी व 25 सेमी समवर्षा रेखाएँ",
        "titleEnglish": "Rainfall Isohyets & Drought Patterns"
      }
    ]
  },
  {
    "id": 4,
    "slug": "population-and-census-of-rajasthan",
    "name": "Population and Census of Rajasthan",
    "nameHindi": "राजस्थान की जनसंख्या एवं जनगणना",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-demography",
    "subTopics": [
      {
        "id": "sub-4-1",
        "titleHindi": "जनसंख्या वृद्धि दर, घनत्व एवं वितरण (2011 जनगणना)",
        "titleEnglish": "Growth Rate & Population Density"
      },
      {
        "id": "sub-4-2",
        "titleHindi": "लिंगानुपात एवं 0-6 आयु वर्ग शिशु लिंगानुपात",
        "titleEnglish": "Sex Ratio & Child Sex Ratio"
      },
      {
        "id": "sub-4-3",
        "titleHindi": "साक्षरता दर (कुल, पुरुष एवं महिला साक्षरता विश्लेषण)",
        "titleEnglish": "Literacy Trends & Disparities"
      },
      {
        "id": "sub-4-4",
        "titleHindi": "अनुसूचित जाति (SC) एवं अनुसूचित जनजाति (ST) जनसांख्यिकी",
        "titleEnglish": "SC/ST Demographics & Tribal Distribution"
      }
    ]
  },
  {
    "id": 5,
    "slug": "soils-of-rajasthan",
    "name": "Soils of Rajasthan",
    "nameHindi": "राजस्थान की मृदा",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-soil",
    "subTopics": [
      {
        "id": "sub-5-1",
        "titleHindi": "पारंपरिक मिट्टियों के प्रकार (रेतीली, लाल-पीली, काली, जलोढ़, भूरी)",
        "titleEnglish": "Traditional Soil Classifications"
      },
      {
        "id": "sub-5-2",
        "titleHindi": "वैज्ञानिक वर्गीकरण (Aridisols, Alfisols, Entisols, Inceptisols, Vertisols)",
        "titleEnglish": "USDA Soil Taxonomy in Rajasthan"
      },
      {
        "id": "sub-5-3",
        "titleHindi": "मृदा अपरदन (जल व वायु अपरदन) एवं सेम की समस्या",
        "titleEnglish": "Soil Erosion & Waterlogging (Sem)"
      },
      {
        "id": "sub-5-4",
        "titleHindi": "मृदा सुधार एवं उर्वरता प्रबंधन उपाय",
        "titleEnglish": "Soil Fertility & Conservation Measures"
      }
    ]
  },
  {
    "id": 6,
    "slug": "drainage-system-rivers-and-lakes-rajasthan",
    "name": "Drainage System, Rivers and Lakes of Rajasthan",
    "nameHindi": "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-rivers",
    "subTopics": [
      {
        "id": "sub-6-1",
        "titleHindi": "अरब सागरीय अपवाह तंत्र (लूणी, माही, साबरमती, पश्चिमी बनास)",
        "titleEnglish": "Arabian Sea Drainage (Luni, Mahi, Sabarmati)"
      },
      {
        "id": "sub-6-2",
        "titleHindi": "बंगाल की खाड़ी अपवाह तंत्र (चंबल, बनास, बाणगंगा, कालीसिंध)",
        "titleEnglish": "Bay of Bengal Drainage (Chambal, Banas)"
      },
      {
        "id": "sub-6-3",
        "titleHindi": "आंतरिक अपवाह तंत्र (कांतली, काकनेय, साबी, घग्घर, मेंथा)",
        "titleEnglish": "Inland Drainage Rivers"
      },
      {
        "id": "sub-6-4",
        "titleHindi": "मीठे पानी की प्रमुख झीलें (जयसमंद, राजसमंद, पिछोला, नक्की, आनासागर)",
        "titleEnglish": "Freshwater Lakes"
      },
      {
        "id": "sub-6-5",
        "titleHindi": "खारे पानी की झीलें (सांभर, पचपदरा, डीडवाना, लूणकरणसर)",
        "titleEnglish": "Saline Lakes of Rajasthan"
      }
    ]
  },
  {
    "id": 7,
    "slug": "irrigation-projects-dams-water-management",
    "name": "Irrigation Projects, Dams and Water Management",
    "nameHindi": "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-irrigation",
    "subTopics": [
      {
        "id": "sub-7-1",
        "titleHindi": "इंदिरा गांधी नहर परियोजना (IGNP) - मुख्य नहर, शाखाएं व लिफ्ट नहरें",
        "titleEnglish": "Indira Gandhi Canal Project (IGNP)"
      },
      {
        "id": "sub-7-2",
        "titleHindi": "प्रमुख बांध (राणा प्रताप सागर, बीसलपुर, माही बजाज सागर, जवाई बांध)",
        "titleEnglish": "Major Dams of Rajasthan"
      },
      {
        "id": "sub-7-3",
        "titleHindi": "ईसरदा, परवन, नर्मदा नहर एवं पूर्वी राजस्थान नहर परियोजना (ERCP)",
        "titleEnglish": "ERCP & Inter-linking Projects"
      },
      {
        "id": "sub-7-4",
        "titleHindi": "परंपरागत जल संरक्षण प्रणालियाँ (बावड़ी, टांका, जोहड़, खड़ीन, बेरी)",
        "titleEnglish": "Traditional Water Harvesting Techniques"
      }
    ]
  },
  {
    "id": 8,
    "slug": "forests-wildlife-sanctuaries-national-parks",
    "name": "Forests, Wildlife, Sanctuaries and National Parks",
    "nameHindi": "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-vegetation",
    "subTopics": [
      {
        "id": "sub-8-1",
        "titleHindi": "वन संपदा एवं राज्य वन रिपोर्ट (आरक्षित, संरक्षित व अवर्गीकृत वन)",
        "titleEnglish": "Forest Classification & ISFR Report"
      },
      {
        "id": "sub-8-2",
        "titleHindi": "राष्ट्रीय उद्यान (रणथंभौर, केवलादेव घाना, मुकुंदरा हिल्स)",
        "titleEnglish": "National Parks of Rajasthan"
      },
      {
        "id": "sub-8-3",
        "titleHindi": "टाइगर रिजर्व (रणथंभौर, सरिस्का, मुकुंदरा, रामगढ़ विषधारी, धौलपुर-करौली)",
        "titleEnglish": "Tiger Reserves"
      },
      {
        "id": "sub-8-4",
        "titleHindi": "प्रमुख वन्यजीव अभयारण्य एवं कंजर्वेशन रिजर्व",
        "titleEnglish": "Sanctuaries & Conservation Reserves"
      },
      {
        "id": "sub-8-5",
        "titleHindi": "रामसर आर्द्रभूमि स्थल (केवलादेव व सांभर झील)",
        "titleEnglish": "Ramsar Wetland Sites"
      }
    ]
  },
  {
    "id": 9,
    "slug": "agriculture-of-rajasthan",
    "name": "Agriculture of Rajasthan",
    "nameHindi": "राजस्थान की कृषि",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-agri",
    "subTopics": [
      {
        "id": "sub-9-1",
        "titleHindi": "फसल ऋतुएं: रबी, खरीफ एवं जायद की प्रमुख फसलें",
        "titleEnglish": "Cropping Seasons: Rabi, Kharif & Zaid"
      },
      {
        "id": "sub-9-2",
        "titleHindi": "कृषि जलवायु खंड (10 Agro-Climatic Zones)",
        "titleEnglish": "10 Agro-Climatic Zones of Rajasthan"
      },
      {
        "id": "sub-9-3",
        "titleHindi": "नकदी, दलहन, तिलहन व मसाला फसलें (सरसों, ईसबगोल, जीरा, धनिया)",
        "titleEnglish": "Commercial, Oilseed & Spice Crops"
      },
      {
        "id": "sub-9-4",
        "titleHindi": "जैविक खेती एवं प्रमुख कृषि योजनाएं",
        "titleEnglish": "Organic Farming & Government Schemes"
      }
    ]
  },
  {
    "id": 10,
    "slug": "animal-husbandry-of-rajasthan",
    "name": "Animal Husbandry of Rajasthan",
    "nameHindi": "राजस्थान का पशुपालन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-livestock",
    "subTopics": [
      {
        "id": "sub-10-1",
        "titleHindi": "पशुधन गणना (20वीं पशुगणना प्रमुख आंकड़े व रुझान)",
        "titleEnglish": "20th Livestock Census Statistics"
      },
      {
        "id": "sub-10-2",
        "titleHindi": "गाय, भैंस, भेड़ एवं बकरी की प्रमुख नस्लें व वितरण",
        "titleEnglish": "Major Breeds of Cattle, Sheep, Goat & Camel"
      },
      {
        "id": "sub-10-3",
        "titleHindi": "राज्य के प्रमुख पशु अनुसंधान एवं प्रजनन केंद्र",
        "titleEnglish": "Breeding & Research Centers"
      },
      {
        "id": "sub-10-4",
        "titleHindi": "डेयरी विकास कार्यक्रम (RCDF, सरस) एवं ऊन उत्पादन",
        "titleEnglish": "Dairy Co-operatives & Wool Production"
      }
    ]
  },
  {
    "id": 11,
    "slug": "mineral-resources-of-rajasthan",
    "name": "Mineral Resources of Rajasthan",
    "nameHindi": "राजस्थान के खनिज संसाधन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-minerals",
    "subTopics": [
      {
        "id": "sub-11-1",
        "titleHindi": "धात्विक खनिज (सीसा-जस्ता, तांबा, लोहा, टंगस्टन, चांदी)",
        "titleEnglish": "Metallic Minerals & Key Mines"
      },
      {
        "id": "sub-11-2",
        "titleHindi": "अधात्विक खनिज (रॉक फॉस्फेट, जिप्सम, संगमरमर, ग्रेनाइट, चूना पत्थर)",
        "titleEnglish": "Non-Metallic Minerals & Dimension Stones"
      },
      {
        "id": "sub-11-3",
        "titleHindi": "राजस्थान का एकाधिकार खनिज (वोलास्टोनाइट, जास्पर, गार्नेट, सीसा-जस्ता)",
        "titleEnglish": "Minerals with State Monopoly"
      },
      {
        "id": "sub-11-4",
        "titleHindi": "पेट्रोलियम एवं हाइड्रोकार्बन बेसिन (बाड़मेर-सांचौर, बीकानेर-नागौर)",
        "titleEnglish": "Petroleum Basins & Oilfields"
      }
    ]
  },
  {
    "id": 12,
    "slug": "energy-resources-of-rajasthan",
    "name": "Energy Resources of Rajasthan",
    "nameHindi": "राजस्थान के ऊर्जा संसाधन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-energy",
    "subTopics": [
      {
        "id": "sub-12-1",
        "titleHindi": "सौर ऊर्जा (भड़ला सोलर पार्क, अक्षय ऊर्जा नीति)",
        "titleEnglish": "Solar Energy & Bhadla Solar Park"
      },
      {
        "id": "sub-12-2",
        "titleHindi": "पवन एवं बायोमास ऊर्जा परियोजनाएं",
        "titleEnglish": "Wind & Biomass Power Projects"
      },
      {
        "id": "sub-12-3",
        "titleHindi": "तापीय विद्युत संयंत्र (सूरतगढ़, कोटा, छबड़ा, कालीसिंध)",
        "titleEnglish": "Thermal Power Stations"
      },
      {
        "id": "sub-12-4",
        "titleHindi": "परमाणु ऊर्जा (रावतभाटा RAPS) एवं जल विद्युत",
        "titleEnglish": "Nuclear (Rawatbhata) & Hydro Power"
      }
    ]
  },
  {
    "id": 13,
    "slug": "major-industries-of-rajasthan",
    "name": "Major Industries of Rajasthan",
    "nameHindi": "राजस्थान के प्रमुख उद्योग",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-industries",
    "subTopics": [
      {
        "id": "sub-13-1",
        "titleHindi": "सूती वस्त्र उद्योग एवं प्रमुख मिलें",
        "titleEnglish": "Textile Industry & Mills"
      },
      {
        "id": "sub-13-2",
        "titleHindi": "सीमेंट एवं खनिज आधारित भारी उद्योग",
        "titleEnglish": "Cement & Mineral-Based Industries"
      },
      {
        "id": "sub-13-3",
        "titleHindi": "कृषि आधारित उद्योग (चीनी, तेल मिलें, एग्रो फूड पार्क)",
        "titleEnglish": "Agro-Processing & Food Parks"
      },
      {
        "id": "sub-13-4",
        "titleHindi": "रीको (RIICO), RFC एवं औद्योगिक विकास क्षेत्र (SEZ, DMIC)",
        "titleEnglish": "RIICO, SEZ & DMIC Corridor"
      }
    ]
  },
  {
    "id": 14,
    "slug": "transportation-in-rajasthan",
    "name": "Transportation in Rajasthan",
    "nameHindi": "राजस्थान का परिवहन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-transport",
    "subTopics": [
      {
        "id": "sub-14-1",
        "titleHindi": "सड़क परिवहन (राष्ट्रीय राजमार्ग, राज्य राजमार्ग एवं एक्सप्रेसवे)",
        "titleEnglish": "Road Network & Expressways"
      },
      {
        "id": "sub-14-2",
        "titleHindi": "रेलवे नेटवर्क (उत्तर पश्चिम रेलवे जोन, उप-मंडल)",
        "titleEnglish": "Railway Zones & Major Routes"
      },
      {
        "id": "sub-14-3",
        "titleHindi": "वायु परिवहन (प्रमुख हवाई अड्डे एवं उड़ान योजना)",
        "titleEnglish": "Airports & Civil Aviation"
      },
      {
        "id": "sub-14-4",
        "titleHindi": "जयपुर मेट्रो एवं दिल्ली-मुंबई एक्सप्रेसवे परियोजना",
        "titleEnglish": "Jaipur Metro & High-Speed Corridors"
      }
    ]
  },
  {
    "id": 15,
    "slug": "tourism-in-rajasthan",
    "name": "Tourism in Rajasthan",
    "nameHindi": "राजस्थान का पर्यटन",
    "subjectSlug": "rajasthan-general-knowledge-geography",
    "subjectHindi": "राजस्थान सामान्य ज्ञान एवं भूगोल",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-geo-tourism",
    "subTopics": [
      {
        "id": "sub-15-1",
        "titleHindi": "प्रमुख पर्यटन सर्किट (मरु सर्किट, ढूंढाड़, मेवाड़, हाड़ौती)",
        "titleEnglish": "Tourist Circuits of Rajasthan"
      },
      {
        "id": "sub-15-2",
        "titleHindi": "आरटीडीसी (RTDC) एवं पर्यटन नीतियां",
        "titleEnglish": "RTDC & State Tourism Policies"
      },
      {
        "id": "sub-15-3",
        "titleHindi": "हेरिटेज पर्यटन एवं पैलेस ऑन व्हील्स",
        "titleEnglish": "Heritage Tourism & Luxury Trains"
      },
      {
        "id": "sub-15-4",
        "titleHindi": "धार्मिक, सांस्कृतिक एवं पारिस्थितिकी पर्यटन स्थल",
        "titleEnglish": "Pilgrimage, Eco & Rural Tourism"
      }
    ]
  },
  {
    "id": 16,
    "slug": "ancient-civilizations-archaeological-sites",
    "name": "Ancient Civilizations and Archaeological Sites of Rajasthan",
    "nameHindi": "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-ancient-sites",
    "subTopics": [
      {
        "id": "sub-32-1",
        "titleHindi": "कालीबंगा सभ्यता (हनुमानगढ़, घग्घर नदी, अमलानंद घोष, जूते खेत)",
        "titleEnglish": "Kalibangan Site & Excavations"
      },
      {
        "id": "sub-32-2",
        "titleHindi": "आहड़ सभ्यता (ताम्रवती नगरी, उदयपुर, बेड़च नदी, गोरे-कोठे)",
        "titleEnglish": "Ahar Civilization (Tamravati)"
      },
      {
        "id": "sub-32-3",
        "titleHindi": "गणेश्वर सभ्यता (नीम का थाना, कांतली नदी, ताम्र संचयी संस्कृति)",
        "titleEnglish": "Ganeshwar Copper Culture"
      },
      {
        "id": "sub-32-4",
        "titleHindi": "बैराठ सभ्यता (विराटनगर, मौर्यकालीन अवशेष, भाब्रू शिलालेख)",
        "titleEnglish": "Bairath & Ashokan Inscriptions"
      },
      {
        "id": "sub-32-5",
        "titleHindi": "अन्य प्रमुख स्थल (बागोर, बालाथल, सुनारी, गिलूण्ड, रेड)",
        "titleEnglish": "Bagor, Balathal, Gilund & Rairh"
      }
    ]
  },
  {
    "id": 17,
    "slug": "major-rajput-dynasties-and-administration",
    "name": "Major Rajput Dynasties and Administrative System of Rajasthan",
    "nameHindi": "राजस्थान के प्रमुख राजपूत राजवंश एवं प्रशासनिक व्यवस्था (8वीं से 18वीं सदी)",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-dynasties-admin",
    "subTopics": [
      {
        "id": "sub-17-1",
        "titleHindi": "राजस्थान के इतिहास के स्रोत (शिलालेख, सिक्के, ताम्रपत्र, ख्यात साहित्य)",
        "titleEnglish": "Historical Sources (Inscriptions, Coins & Literature)"
      },
      {
        "id": "sub-17-2",
        "titleHindi": "महाजनपद काल एवं प्राचीन राजनीतिक इतिहास (मत्स्य, सीवि, शूरसेन, जांगल)",
        "titleEnglish": "Mahajanapada Period & Ancient Polity"
      },
      {
        "id": "sub-17-3",
        "titleHindi": "गुर्जर-प्रतिहार वंश (मंडोर, भीनमाल शाखा, वत्सराज, नागभट्ट, मिहिर भोज)",
        "titleEnglish": "Gurjar-Pratihar Dynasty"
      },
      {
        "id": "sub-17-4",
        "titleHindi": "अजमेर, रणथंभौर एवं जालोर के चौहान वंश (पृथ्वीराज III, हम्मीर देव, कान्हड़देव)",
        "titleEnglish": "Chauhan Dynasty of Ajmer, Ranthambore & Jalore"
      },
      {
        "id": "sub-17-5",
        "titleHindi": "मेवाड़ का गुहिल/सिसोदिया वंश (राणा सांगा, महाराणा प्रताप, राजसिंह — सल्तनत व मुग़ल संबंध)",
        "titleEnglish": "Guhil & Sisodia Dynasty of Mewar"
      },
      {
        "id": "sub-17-6",
        "titleHindi": "मारवाड़ एवं बीकानेर के राठौड़ वंश (राव चंद्रसेन, बीकानेर के रायसिंह — मुग़ल संबंध)",
        "titleEnglish": "Rathore Dynasty of Marwar & Bikaner"
      },
      {
        "id": "sub-17-7",
        "titleHindi": "आमेर का कछवाहा वंश (भारमल, मानसिंह प्रथम, मिर्जा राजा जयसिंह — मुग़ल संबंध)",
        "titleEnglish": "Kachhwaha Dynasty of Amer"
      },
      {
        "id": "sub-17-8",
        "titleHindi": "अन्य प्रमुख राजवंश (करौली के यादव, जैसलमेर के भाटी, भरतपुर-धौलपुर के जाट)",
        "titleEnglish": "Other Major Dynasties (Bhati, Jat, Yadav)"
      },
      {
        "id": "sub-17-9",
        "titleHindi": "मध्यकालीन राजस्थान की प्रशासनिक एवं सामंती व्यवस्था (पट्टा रेख, जागीरदारी)",
        "titleEnglish": "Medieval Administrative & Feudal System"
      }
    ]
  },
  {
    "id": 18,
    "slug": "revolt-of-1857-and-british-treaties",
    "name": "Revolt of 1857 and British Treaties in Rajasthan",
    "nameHindi": "राजस्थान में 1857 का विद्रोह एवं ब्रिटिश संधियाँ",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-1857-treaties",
    "subTopics": [
      {
        "id": "sub-18-1",
        "titleHindi": "1818 की ब्रिटिश संधियाँ एवं राजपूताना रियासतें",
        "titleEnglish": "British Treaties of 1818 & Princely States"
      },
      {
        "id": "sub-18-2",
        "titleHindi": "1857 की क्रांति: नसीराबाद, नीमच, एरिनपुरा एवं आउवा विद्रोह (कुशाल सिंह)",
        "titleEnglish": "Outbreak Centers (Nasirabad, Neemuch, Erinpura, Auwa)"
      },
      {
        "id": "sub-18-3",
        "titleHindi": "कोटा जनविद्रोह (जयदयाल व मेहराब खां) एवं तात्या टोपे का अभियान",
        "titleEnglish": "Kota Mass Rebellion & Tatya Tope Campaign"
      },
      {
        "id": "sub-18-4",
        "titleHindi": "1857 की क्रांति के परिणाम, स्वरूप एवं प्रभाव",
        "titleEnglish": "Consequences & Historical Impact"
      }
    ]
  },
  {
    "id": 19,
    "slug": "peasant-and-tribal-movements-in-rajasthan",
    "name": "Peasant and Tribal Movements in Rajasthan",
    "nameHindi": "राजस्थान के किसान एवं जनजातीय आंदोलन",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-peasant",
    "subTopics": [
      {
        "id": "sub-45-1",
        "titleHindi": "बिजौलिया किसान आंदोलन (साधु सीताराम दास, विजय सिंह पथिक, माणिक्यलाल वर्मा)",
        "titleEnglish": "Bijolia Peasant Movement (3 Phases)"
      },
      {
        "id": "sub-45-2",
        "titleHindi": "बेंगू, बूंदी (बरड़), अलवर एवं मेव किसान आंदोलन",
        "titleEnglish": "Bengu, Bundi, Alwar & Meo Movements"
      },
      {
        "id": "sub-45-3",
        "titleHindi": "शेखावाटी किसान आंदोलन एवं कटराथल महिला सम्मेलन (1934)",
        "titleEnglish": "Shekhawati & Katrathal Conference"
      },
      {
        "id": "sub-45-4",
        "titleHindi": "भगत आंदोलन एवं गोविंद गिरी (मानगढ़ धाम नरसंहार 1913)",
        "titleEnglish": "Bhagat Movement & Govind Giri (Mangarh)"
      },
      {
        "id": "sub-45-5",
        "titleHindi": "एकी आंदोलन (मोतीलाल तेजावत, नीमड़ा हत्याकांड, मातृकुंडिया)",
        "titleEnglish": "Eki Movement & Motilal Tejawat"
      },
      {
        "id": "sub-45-6",
        "titleHindi": "मीणा क्षेत्रीय सभा एवं जरायम पेशा कानून उन्मूलन",
        "titleEnglish": "Meena Agitation & Jarayam Pesha Repeal"
      }
    ]
  },
  {
    "id": 20,
    "slug": "prajamandal-movements-in-rajasthan",
    "name": "Prajamandal Movements in Rajasthan",
    "nameHindi": "राजस्थान के प्रजामंडल आंदोलन",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-prajamandal",
    "subTopics": [
      {
        "id": "sub-46-1",
        "titleHindi": "जयपुर प्रजामंडल (कर्पूरचंद पाटनी, जमनालाल बजाज, हीरालाल शास्त्री)",
        "titleEnglish": "Jaipur Prajamandal & Gentlemen's Agreement"
      },
      {
        "id": "sub-46-2",
        "titleHindi": "मेवाड़ प्रजामंडल (माणिक्यलाल वर्मा, बलवंत सिंह मेहता, प्रथम अधिवेशन)",
        "titleEnglish": "Mewar Prajamandal"
      },
      {
        "id": "sub-46-3",
        "titleHindi": "मारवाड़ लोक परिषद (जयनारायण व्यास, छगनराज चौपासनी)",
        "titleEnglish": "Marwar Lok Parishad"
      },
      {
        "id": "sub-46-4",
        "titleHindi": "बीकानेर, सिरोही, हाड़ौती, झालावाड़, डूंगरपुर प्रजामंडल",
        "titleEnglish": "Bikaner, Sirohi & Hadoti Prajamandals"
      },
      {
        "id": "sub-46-5",
        "titleHindi": "प्रजामंडलों की स्थापना वर्ष, प्रमुख नेता एवं उत्तरदायी शासन मांग",
        "titleEnglish": "Chronology & Responsible Government Demands"
      }
    ]
  },
  {
    "id": 21,
    "slug": "freedom-struggle-organizations-institutions",
    "name": "Freedom Struggle Organizations and Institutions in Rajasthan",
    "nameHindi": "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-orgs",
    "subTopics": [
      {
        "id": "sub-47-1",
        "titleHindi": "वीर भारत सभा (केसरी सिंह बारहठ - 1910)",
        "titleEnglish": "Veer Bharat Sabha"
      },
      {
        "id": "sub-47-2",
        "titleHindi": "राजस्थान सेवा संघ (वर्धा 1919, अजमेर स्थानांतरण)",
        "titleEnglish": "Rajasthan Seva Sangh"
      },
      {
        "id": "sub-47-3",
        "titleHindi": "मारवाड़ सेवा संघ, सर्वहितकारिणी सभा (बीकानेर)",
        "titleEnglish": "Marwar Seva Sangh & Sarvahitkarini Sabha"
      },
      {
        "id": "sub-47-4",
        "titleHindi": "राजपूताना मध्य भारत सभा एवं अखिल भारतीय देशी राज्य लोक परिषद",
        "titleEnglish": "Rajputana Madhya Bharat Sabha & AISPC"
      }
    ]
  },
  {
    "id": 22,
    "slug": "social-and-political-awakening-in-rajasthan",
    "name": "Social and Political Awakening in Rajasthan",
    "nameHindi": "राजस्थान में सामाजिक एवं राजनीतिक जागरण",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-awakening",
    "subTopics": [
      {
        "id": "sub-48-1",
        "titleHindi": "स्वामी दयानंद सरस्वती का राजस्थान आगमन एवं आर्य समाज का प्रभाव",
        "titleEnglish": "Swami Dayanand Saraswati & Arya Samaj"
      },
      {
        "id": "sub-48-2",
        "titleHindi": "परोपकारिणी सभा (उदयपुर) एवं सत्यार्थ प्रकाश रचना",
        "titleEnglish": "Paropkarini Sabha & Satyarth Prakash"
      },
      {
        "id": "sub-48-3",
        "titleHindi": "शिक्षा प्रसार, महिला जागरण एवं कुप्रथा विरोधी चेतना",
        "titleEnglish": "Spread of Education & Women Awakening"
      }
    ]
  },
  {
    "id": 23,
    "slug": "integration-of-rajasthan",
    "name": "Integration of Rajasthan",
    "nameHindi": "राजस्थान का एकीकरण",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-integration",
    "subTopics": [
      {
        "id": "sub-49-1",
        "titleHindi": "प्रथम चरण: मत्स्य संघ (18 मार्च 1948 - अलवर, भरतपुर, धौलपुर, करौली)",
        "titleEnglish": "Stage 1: Matsya Sangh"
      },
      {
        "id": "sub-49-2",
        "titleHindi": "द्वितीय व तृतीय चरण: पूर्व राजस्थान संघ एवं संयुक्त राजस्थान संघ",
        "titleEnglish": "Stages 2 & 3: Former & United Rajasthan"
      },
      {
        "id": "sub-49-3",
        "titleHindi": "चतुर्थ चरण: वृहत् राजस्थान (30 मार्च 1949 - राजस्थान दिवस)",
        "titleEnglish": "Stage 4: Greater Rajasthan (30 March 1949)"
      },
      {
        "id": "sub-49-4",
        "titleHindi": "पंचम व षष्ठ चरण: संयुक्त वृहत् राजस्थान एवं सिरोही विलय विवाद",
        "titleEnglish": "Stages 5 & 6: Sirohi Merger Issue"
      },
      {
        "id": "sub-49-5",
        "titleHindi": "सप्तम चरण: पुनर्गठित राजस्थान (1 नवंबर 1956 - अजमेर-मेरवाड़ा, आबू-देलवाड़ा)",
        "titleEnglish": "Stage 7: Final Reorganization (1 Nov 1956)"
      },
      {
        "id": "sub-49-6",
        "titleHindi": "रियासती विभाग, सरदार पटेल, वी.पी. मेनन एवं विभिन्न समितियां",
        "titleEnglish": "States Department, Patel & Key Committees"
      }
    ]
  },
  {
    "id": 24,
    "slug": "prominent-personalities-of-rajasthan",
    "name": "Prominent Personalities of Rajasthan",
    "nameHindi": "राजस्थान के प्रमुख व्यक्तित्व",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-personalities",
    "subTopics": [
      {
        "id": "sub-50-1",
        "titleHindi": "बारहठ परिवार: केसरी सिंह, जोरावर सिंह, प्रताप सिंह बारहठ",
        "titleEnglish": "Barhath Family Freedom Fighters"
      },
      {
        "id": "sub-50-2",
        "titleHindi": "अर्जुनलाल सेठी, विजय सिंह पथिक, सागरमल गोपा (जैसलमेर का गुंडाराज)",
        "titleEnglish": "Arjun Lal Sethi, Pathik & Sagarmal Gopa"
      },
      {
        "id": "sub-50-3",
        "titleHindi": "जमनालाल बजाज (गांधीजी के 5वें पुत्र) एवं हरिभाऊ उपाध्याय",
        "titleEnglish": "Jamnalal Bajaj & Haribhau Upadhyaya"
      },
      {
        "id": "sub-50-4",
        "titleHindi": "गोकुलभाई भट्ट (राजस्थान के गांधी) एवं भोगीलाल पांड्या (वागड़ के गांधी)",
        "titleEnglish": "Gokulbhai Bhatt & Bhogilal Pandya"
      }
    ]
  },
  {
    "id": 25,
    "slug": "women-personalities-and-journalism",
    "name": "Women Personalities and Journalism in Rajasthan",
    "nameHindi": "राजस्थान की महिला व्यक्तित्व एवं पत्रकारिता",
    "subjectSlug": "rajasthan-history",
    "subjectHindi": "राजस्थान का इतिहास",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-hist-women-journalism",
    "subTopics": [
      {
        "id": "sub-25-1",
        "titleHindi": "प्रमुख स्वतंत्रता सेनानी महिलाएँ (जानकी देवी बजाज, अंजना देवी चौधरी, नारायणी देवी)",
        "titleEnglish": "Women Freedom Fighters"
      },
      {
        "id": "sub-25-2",
        "titleHindi": "सामाजिक कुप्रथा उन्मूलन, प्रजामंडल एवं बालिका शिक्षा में महिलाओं की भूमिका",
        "titleEnglish": "Social Reform & Women's Role in Prajamandals"
      },
      {
        "id": "sub-25-3",
        "titleHindi": "राजस्थान में समाचार पत्र एवं पत्रकारिता का उद्भव (राजस्थान केसरी, तरुण राजस्थान, नवीन राजस्थान)",
        "titleEnglish": "Origins of Rajasthani Press & Major Periodicals"
      },
      {
        "id": "sub-25-4",
        "titleHindi": "प्रमुख पत्रकार, संपादक एवं स्वतंत्रता आंदोलन में जनचेतना का प्रसार",
        "titleEnglish": "Prominent Journalists & Mass Awakening"
      }
    ]
  },
  {
    "id": 26,
    "slug": "fairs-of-rajasthan",
    "name": "Fairs of Rajasthan",
    "nameHindi": "राजस्थान के मेले",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-fairs",
    "subTopics": [
      {
        "id": "sub-16-1",
        "titleHindi": "प्रमुख धार्मिक व सांस्कृतिक मेले (पुष्कर, रामदेवरा, बेणेश्वर, खाटूश्यामजी)",
        "titleEnglish": "Major Religious Fairs"
      },
      {
        "id": "sub-16-2",
        "titleHindi": "प्रसिद्ध पशु मेले (तिलवाड़ा, परबतसर, झालरापाटन, गोगामेड़ी)",
        "titleEnglish": "State Livestock Fairs"
      },
      {
        "id": "sub-16-3",
        "titleHindi": "जनजातीय मेले (बेणेश्वर धाम, सीताबाड़ी मेला)",
        "titleEnglish": "Tribal Fairs & Gathering"
      },
      {
        "id": "sub-16-4",
        "titleHindi": "मेले, तिथियाँ एवं संबंधित लोक मान्यताएं",
        "titleEnglish": "Tithis & Calendar Timings of Fairs"
      }
    ]
  },
  {
    "id": 27,
    "slug": "festivals-of-rajasthan",
    "name": "Festivals of Rajasthan",
    "nameHindi": "राजस्थान के त्योहार",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-festivals",
    "subTopics": [
      {
        "id": "sub-17-1",
        "titleHindi": "हिन्दू पंचांग अनुसार प्रमुख त्योहार (गणगौर, कजली तीज, छोटी तीज)",
        "titleEnglish": "Hindu Calendar Festivals (Gangaur, Teej)"
      },
      {
        "id": "sub-17-2",
        "titleHindi": "जैन, मुस्लिम, सिख एवं ईसाई धर्म के प्रमुख त्योहार",
        "titleEnglish": "Jain, Muslim, Sikh & Christian Festivals"
      },
      {
        "id": "sub-17-3",
        "titleHindi": "स्थानीय लोकोत्सव एवं सांस्कृतिक महोत्सव (मरु महोत्सव, थार महोत्सव)",
        "titleEnglish": "Desert Festival & Regional Utsavs"
      },
      {
        "id": "sub-17-4",
        "titleHindi": "त्योहारों से जुड़े विशेष पकवान एवं रीति-रिवाज",
        "titleEnglish": "Traditions & Ritual Foods of Festivals"
      }
    ]
  },
  {
    "id": 28,
    "slug": "customs-and-traditions-of-rajasthan",
    "name": "Customs and Traditions of Rajasthan",
    "nameHindi": "राजस्थान की रीति-रिवाज एवं परंपराएँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-customs",
    "subTopics": [
      {
        "id": "sub-18-1",
        "titleHindi": "जन्म एवं बाल्यकाल संस्कार (जात-कर्म, नामकरण, चूड़ाकर्म)",
        "titleEnglish": "Birth & Childhood Rites"
      },
      {
        "id": "sub-18-2",
        "titleHindi": "विवाह संबंधी रस्में एवं परंपराएँ (तोरण, सामैला, बिंदोली, पहरावणी)",
        "titleEnglish": "Marriage Customs & Rituals"
      },
      {
        "id": "sub-18-3",
        "titleHindi": "मृत्यु संस्कार (मोसर, जोसर, सांतरवाड़ा, फूल चुनना)",
        "titleEnglish": "Funeral Rites & Mourning Traditions"
      },
      {
        "id": "sub-18-4",
        "titleHindi": "सामाजिक प्रथाएँ व कुप्रथा उन्मूलन (सती, डाकन, समाधि, बाल विवाह)",
        "titleEnglish": "Abolition of Social Evils"
      }
    ]
  },
  {
    "id": 29,
    "slug": "costumes-and-ornaments-of-rajasthan",
    "name": "Costumes and Ornaments of Rajasthan",
    "nameHindi": "राजस्थान की वेशभूषा एवं आभूषण",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-costumes",
    "subTopics": [
      {
        "id": "sub-19-1",
        "titleHindi": "पुरुष वेशभूषा (पगड़ी/साफा, अंगरखी, धोती, चुगा, पछेवड़ा)",
        "titleEnglish": "Men's Traditional Attire & Turbans"
      },
      {
        "id": "sub-19-2",
        "titleHindi": "महिला वेशभूषा (घाघरा, कुर्ती-कांचली, ओढ़नी, पोमचा, लहरिया)",
        "titleEnglish": "Women's Attire & Dupattas"
      },
      {
        "id": "sub-19-3",
        "titleHindi": "सिर व मस्तक के आभूषण (शीशफूल, रखड़ी, बोरला, मेमंद, टीका)",
        "titleEnglish": "Head & Forehead Ornaments"
      },
      {
        "id": "sub-19-4",
        "titleHindi": "नाक, कान, गला एवं हाथ-पैरों के आभूषण (नथ, टिमणिया, चोंप, कंदोरा, तगड़ी)",
        "titleEnglish": "Neck, Nose, Ear & Limb Ornaments"
      }
    ]
  },
  {
    "id": 30,
    "slug": "architecture-and-monuments-of-rajasthan",
    "name": "Architecture and Monuments of Rajasthan",
    "nameHindi": "राजस्थान की स्थापत्य कला एवं वास्तुकला",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-architecture",
    "subTopics": [
      {
        "id": "sub-20-1",
        "titleHindi": "यूनेस्को विश्व धरोहर दुर्ग (चित्तौड़गढ़, कुंभलगढ़, रणथंभौर, गागरोन, आमेर, जैसलमेर)",
        "titleEnglish": "6 UNESCO Hill Forts"
      },
      {
        "id": "sub-20-2",
        "titleHindi": "अन्य प्रमुख दुर्ग (मेहरानगढ़, तारागढ़, जूनागढ़, भटनेर, सिवाना, जालौर)",
        "titleEnglish": "Other Historic Forts"
      },
      {
        "id": "sub-20-3",
        "titleHindi": "प्रमुख मंदिर स्थापत्य (महामारु शैली, नागर शैली, देलवाड़ा जैन मंदिर)",
        "titleEnglish": "Temple Architecture & Maha-Maru Style"
      },
      {
        "id": "sub-20-4",
        "titleHindi": "हवेलियाँ, छतरियाँ एवं ऐतिहासिक बावड़ियाँ (चांद बावड़ी, पटवों की हवेली)",
        "titleEnglish": "Havelis, Cenotaphs & Stepwells"
      }
    ]
  },
  {
    "id": 31,
    "slug": "painting-schools-of-rajasthan",
    "name": "Painting Schools of Rajasthan",
    "nameHindi": "राजस्थान की चित्रकला शैलियाँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-paintings",
    "subTopics": [
      {
        "id": "sub-21-1",
        "titleHindi": "मेवाड़ चित्रशैली (चावंड, नाथद्वारा पिछवाई, प्रमुख चित्रकार)",
        "titleEnglish": "Mewar School & Pichwai Art"
      },
      {
        "id": "sub-21-2",
        "titleHindi": "मारवाड़ एवं किशनगढ़ चित्रशैली (बणी-ठणी, निहालचंद, जोधपुर शैली)",
        "titleEnglish": "Marwar & Kishangarh (Bani Thani)"
      },
      {
        "id": "sub-21-3",
        "titleHindi": "ढूंढाड़ चित्रशैली (आमेर, जयपुर, अलवर, शेखावाटी भित्ति चित्र)",
        "titleEnglish": "Dhundhar School & Shekhawati Frescoes"
      },
      {
        "id": "sub-21-4",
        "titleHindi": "हाड़ौती चित्रशैली (बूंदी - शिकार व पशु-पक्षी दृश्य, कोटा शैली)",
        "titleEnglish": "Hadoti School (Bundi & Kota)"
      }
    ]
  },
  {
    "id": 32,
    "slug": "handicrafts-and-crafts-of-rajasthan",
    "name": "Handicrafts and Crafts of Rajasthan",
    "nameHindi": "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-handicrafts",
    "subTopics": [
      {
        "id": "sub-22-1",
        "titleHindi": "थेवा कला (प्रतापगढ़), मीनाकारी व कुंदन कार्य (जयपुर)",
        "titleEnglish": "Thewa Art & Meenakari"
      },
      {
        "id": "sub-22-2",
        "titleHindi": "ब्लू पॉटरी, ब्लैक पॉटरी एवं कागजी पॉटरी",
        "titleEnglish": "Pottery Styles: Blue, Black & Kagzi"
      },
      {
        "id": "sub-22-3",
        "titleHindi": "बंधेज, अजरक प्रिंट, दाबू प्रिंट, मलीर प्रिंट व सांगानेरी प्रिंट",
        "titleEnglish": "Textile Prints & Bandhej Dyeing"
      },
      {
        "id": "sub-22-4",
        "titleHindi": "मोलेला टेराकोटा, उस्ता कला (बीकानेर) व काष्ठ कला (बस्सी)",
        "titleEnglish": "Usta Art, Terracotta & Woodcraft"
      }
    ]
  },
  {
    "id": 33,
    "slug": "folk-deities-and-goddesses-of-rajasthan",
    "name": "Folk Deities and Goddesses of Rajasthan",
    "nameHindi": "राजस्थान के लोक देवता एवं लोक देवियाँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-deities",
    "subTopics": [
      {
        "id": "sub-23-1",
        "titleHindi": "पंचपीर (पाबूजी, रामदेवजी, गोगाजी, मेहाजी मांगलिया, हड़बूजी)",
        "titleEnglish": "Panchpir of Rajasthan"
      },
      {
        "id": "sub-23-2",
        "titleHindi": "तेजाजी, देवनारायणजी, वीर कल्लाजी एवं मल्लीनाथजी",
        "titleEnglish": "Tejaji, Devnarayanji & Veer Kallaji"
      },
      {
        "id": "sub-23-3",
        "titleHindi": "प्रमुख लोक देवियाँ (करणी माता, जीण माता, शीला देवी, कैला देवी)",
        "titleEnglish": "Prominent Goddesses (Karni Mata, Jeen Mata)"
      },
      {
        "id": "sub-23-4",
        "titleHindi": "कुलदेवियाँ, लोक मान्यताएं एवं प्रमुख पूजा स्थल / थान",
        "titleEnglish": "Kuldevis & Folk Beliefs"
      }
    ]
  },
  {
    "id": 34,
    "slug": "saints-sects-religious-traditions-rajasthan",
    "name": "Saints Sects and Religious Traditions of Rajasthan",
    "nameHindi": "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-saints",
    "subTopics": [
      {
        "id": "sub-24-1",
        "titleHindi": "विश्नोई संप्रदाय एवं जांभोजी (29 नियम, पर्यावरण संरक्षण)",
        "titleEnglish": "Bishnoi Sect & Jambhoji"
      },
      {
        "id": "sub-24-2",
        "titleHindi": "जसनाथी संप्रदाय एवं अग्नि नृत्य (कतरियासर)",
        "titleEnglish": "Jasnathi Sect & Fire Dance"
      },
      {
        "id": "sub-24-3",
        "titleHindi": "दादू दयाल एवं दादूपंथ (नरेना, वाणियाँ, प्रमुख शिष्य)",
        "titleEnglish": "Dadu Dayal & Dadupanth"
      },
      {
        "id": "sub-24-4",
        "titleHindi": "रामस्नेही संप्रदाय की 4 शाखाएं (शाहपुरा, रेण, सींथल, खेड़ापा)",
        "titleEnglish": "Ramsnehi Sect 4 Branches"
      },
      {
        "id": "sub-24-5",
        "titleHindi": "मीराबाई, संत धन्ना, पीपा, चरणदास एवं लालदासी संप्रदाय",
        "titleEnglish": "Meerabai & Bhakti Movement Saints"
      }
    ]
  },
  {
    "id": 35,
    "slug": "folk-music-and-folk-songs-of-rajasthan",
    "name": "Folk Music and Folk Songs of Rajasthan",
    "nameHindi": "राजस्थान का लोक संगीत एवं लोकगीत",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-music",
    "subTopics": [
      {
        "id": "sub-25-1",
        "titleHindi": "प्रमुख लोकगीत (केसरिया बालम, मूमल, कुरजां, गोरबंद, पणिहारी)",
        "titleEnglish": "Classic Folk Songs & Themes"
      },
      {
        "id": "sub-25-2",
        "titleHindi": "संगीत घराने एवं गायकी शैलियाँ (मांगणियार, लंगा, कालबेलिया, मांड)",
        "titleEnglish": "Music Gharanas & Singing Communities"
      },
      {
        "id": "sub-25-3",
        "titleHindi": "तत एवं सुषिर वाद्य यंत्र (रावणहत्था, कामायचा, सारंगी, अलगोजा, पूंगी)",
        "titleEnglish": "String & Wind Musical Instruments"
      },
      {
        "id": "sub-25-4",
        "titleHindi": "अवनद्ध एवं घन वाद्य यंत्र (ढोल, मांदल, नगाड़ा, खड़ताल, मंजीरा)",
        "titleEnglish": "Percussion & Metal Instruments"
      }
    ]
  },
  {
    "id": 36,
    "slug": "folk-dances-of-rajasthan",
    "name": "Folk Dances of Rajasthan",
    "nameHindi": "राजस्थान के लोक नृत्य",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-dances",
    "subTopics": [
      {
        "id": "sub-26-1",
        "titleHindi": "राज्य नृत्य: घूमर एवं इसके प्रकार (लूर, झूमरियो)",
        "titleEnglish": "Ghoomar - State Dance"
      },
      {
        "id": "sub-26-2",
        "titleHindi": "व्यावसायिक लोक नृत्य (तेरहताली, भवाई, कच्ची घोड़ी, चरी)",
        "titleEnglish": "Commercial & Acrobatic Dances"
      },
      {
        "id": "sub-26-3",
        "titleHindi": "जनजातीय नृत्य (भीलों के गवरी/राई, गैर, नेजा; गरासियों के वालर, लूर)",
        "titleEnglish": "Tribal Dances (Bhil, Garasia, Sahariya)"
      },
      {
        "id": "sub-26-4",
        "titleHindi": "क्षेत्रीय लोक नृत्य (गींदड़, चंग, ढोल नृत्य, बम नृत्य, डांग)",
        "titleEnglish": "Regional Dances (Shekhawati, Mewat)"
      }
    ]
  },
  {
    "id": 37,
    "slug": "rajasthani-language-and-dialects",
    "name": "Rajasthani Language and Dialects",
    "nameHindi": "राजस्थानी भाषा एवं बोलियाँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-language",
    "subTopics": [
      {
        "id": "sub-27-1",
        "titleHindi": "राजस्थानी भाषा की उत्पत्ति, विकास एवं वर्गीकरण (जॉर्ज ग्रियर्सन)",
        "titleEnglish": "Origins & Grierson's Classification"
      },
      {
        "id": "sub-27-2",
        "titleHindi": "पश्चिमी राजस्थानी बोलियाँ (मारवाड़ी, मेवाड़ी, वागड़ी, शेखावाटी)",
        "titleEnglish": "Western Dialects (Marwari, Mewari)"
      },
      {
        "id": "sub-27-3",
        "titleHindi": "पूर्वी व दक्षिणी बोलियाँ (ढूंढाड़ी, हाड़ौती, मेवाती, मालवी, अहिरवाटी)",
        "titleEnglish": "Eastern & Southern Dialects"
      },
      {
        "id": "sub-27-4",
        "titleHindi": "डिंगल एवं पिंगल शैलियाँ तथा लिपि (मुड़िया/महाजनी)",
        "titleEnglish": "Dingal, Pingal & Muria Script"
      }
    ]
  },
  {
    "id": 38,
    "slug": "rajasthani-literature",
    "name": "Rajasthani Literature",
    "nameHindi": "राजस्थानी साहित्य",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-literature",
    "subTopics": [
      {
        "id": "sub-28-1",
        "titleHindi": "प्राचीन एवं मध्यकालीन साहित्य (रासो, ख्यात, बात, वेली, प्रकाश)",
        "titleEnglish": "Ancient & Medieval Genres"
      },
      {
        "id": "sub-28-2",
        "titleHindi": "प्रमुख ग्रंथकार (चंद्रबरदाई, नैणसी, सूर्यमल्ल मी मिश्रण, दुरसा आढा)",
        "titleEnglish": "Classic Chroniclers & Court Poets"
      },
      {
        "id": "sub-28-3",
        "titleHindi": "आधुनिक राजस्थानी साहित्यकार (कन्हैयालाल सेठिया, विजयदान देथा, सीताराम लालस)",
        "titleEnglish": "Modern Authors (Sethia, Detha)"
      },
      {
        "id": "sub-28-4",
        "titleHindi": "साहित्यिक संस्थाएँ एवं पुरस्कार (राजस्थान साहित्य अकादमी)",
        "titleEnglish": "Literary Academies & Awards"
      }
    ]
  },
  {
    "id": 39,
    "slug": "rajasthani-vocabulary",
    "name": "Rajasthani Vocabulary",
    "nameHindi": "राजस्थानी शब्दावली",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": false,
    "subTopics": [
      {
        "id": "sub-29-1",
        "titleHindi": "कृषि, फसल एवं मौसम से संबंधित देशज शब्द",
        "titleEnglish": "Agricultural & Weather Terms"
      },
      {
        "id": "sub-29-2",
        "titleHindi": "गृहस्थी, औजार एवं पशुपालन संबंधी शब्दावली",
        "titleEnglish": "Household & Pastoral Vocabulary"
      },
      {
        "id": "sub-29-3",
        "titleHindi": "पारिवारिक रिश्ते-नाते एवं सामाजिक संबोधन शब्द",
        "titleEnglish": "Kinship & Social Terms"
      }
    ]
  },
  {
    "id": 40,
    "slug": "rajasthani-idioms-and-proverbs",
    "name": "Rajasthani Idioms and Proverbs",
    "nameHindi": "राजस्थानी मुहावरे एवं लोकोक्तियाँ",
    "subjectSlug": "rajasthan-art-culture",
    "subjectHindi": "राजस्थान कला एवं संस्कृति",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-cult-idioms",
    "subTopics": [
      {
        "id": "sub-30-1",
        "titleHindi": "प्रचलित राजस्थानी कहावतें एवं उनका व्यावहारिक अर्थ",
        "titleEnglish": "Common Proverbs & Practical Meaning"
      },
      {
        "id": "sub-30-2",
        "titleHindi": "ऐतिहासिक घटनाओं व व्यक्तियों पर आधारित लोकोक्तियाँ",
        "titleEnglish": "Historical Idioms & Anecdotes"
      },
      {
        "id": "sub-30-3",
        "titleHindi": "मौसम, शकुन-अपशकुन एवं नीतिपरक कहावतें",
        "titleEnglish": "Weather & Moral Proverbs"
      }
    ]
  },
  {
    "id": 41,
    "slug": "governor-of-rajasthan",
    "name": "Governor of Rajasthan",
    "nameHindi": "राजस्थान के राज्यपाल",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-governor",
    "subTopics": [
      {
        "id": "sub-54-1",
        "titleHindi": "संवैधानिक प्रावधान (अनुच्छेद 153 से 162, नियुक्ति, योग्यताएं, शपथ)",
        "titleEnglish": "Constitutional Provisions (Arts. 153-162)"
      },
      {
        "id": "sub-54-2",
        "titleHindi": "कार्यकारी, विधायी, वित्तीय, न्यायिक एवं स्वविवेकी शक्तियाँ",
        "titleEnglish": "Executive, Legislative & Discretionary Powers"
      },
      {
        "id": "sub-54-3",
        "titleHindi": "राजस्थान के प्रमुख राज्यपाल एवं उनके कार्यकाल की विशिष्ट घटनाएं",
        "titleEnglish": "Notable Governors & Historic Precedents"
      },
      {
        "id": "sub-54-4",
        "titleHindi": "राष्ट्रपति शासन (अनुच्छेद 356) - राजस्थान में 4 बार का विश्लेषण",
        "titleEnglish": "President's Rule in Rajasthan (4 Instances)"
      }
    ]
  },
  {
    "id": 42,
    "slug": "chief-minister-and-council-of-ministers",
    "name": "Chief Minister and Council of Ministers of Rajasthan",
    "nameHindi": "राजस्थान के मुख्यमंत्री एवं मंत्रिपरिषद",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-cm-cabinet",
    "subTopics": [
      {
        "id": "sub-42-1",
        "titleHindi": "मुख्यमंत्री की संवैधानिक स्थिति, नियुक्ति, शपथ, कार्यकाल एवं वेतन-भत्ते",
        "titleEnglish": "Constitutional Status, Appointment & Oath of CM"
      },
      {
        "id": "sub-42-2",
        "titleHindi": "मंत्रिपरिषद का गठन, आकार (91वां संविधान संशोधन), श्रेणियाँ एवं सामूहिक उत्तरदायित्व",
        "titleEnglish": "Council of Ministers Formation & 91st Amendment"
      },
      {
        "id": "sub-42-3",
        "titleHindi": "मुख्यमंत्री की शक्तियाँ, कार्यप्रणाली एवं राज्यपाल व मंत्रिपरिषद के मध्य संबंध",
        "titleEnglish": "Powers, Functions & Inter-branch Relationships"
      },
      {
        "id": "sub-42-4",
        "titleHindi": "राजस्थान के प्रमुख मुख्यमंत्री: ऐतिहासिक कार्यकाल, गठबंधन सरकारें एवं महत्वपूर्ण नीतियां",
        "titleEnglish": "Historical Chief Ministers & Terms in Rajasthan"
      }
    ]
  },
  {
    "id": 43,
    "slug": "rajasthan-state-legislature",
    "name": "Rajasthan State Legislature",
    "nameHindi": "राजस्थान राज्य विधानमंडल",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-assembly",
    "subTopics": [
      {
        "id": "sub-57-1",
        "titleHindi": "विधानसभा संरचना (200 सीटें, आरक्षित सीटें SC: 34, ST: 25)",
        "titleEnglish": "Assembly Composition & Reserved Seats"
      },
      {
        "id": "sub-57-2",
        "titleHindi": "विधानसभा अध्यक्ष, उपाध्यक्ष एवं प्रोटेम स्पीकर की भूमिका",
        "titleEnglish": "Speaker, Deputy Speaker & Protem Speaker"
      },
      {
        "id": "sub-57-3",
        "titleHindi": "विधायी प्रक्रिया, विधेयक पारित होना एवं बजट सत्र",
        "titleEnglish": "Legislative Procedure & Budget Session"
      },
      {
        "id": "sub-57-4",
        "titleHindi": "विधानसभा की प्रमुख समितियाँ (लोक लेखा, प्राक्कलन समिति)",
        "titleEnglish": "Assembly Committees (PAC, Estimates)"
      }
    ]
  },
  {
    "id": 44,
    "slug": "rajasthan-high-court-and-judiciary",
    "name": "Rajasthan High Court and Judiciary",
    "nameHindi": "राजस्थान उच्च न्यायालय एवं न्यायपालिका",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-judiciary",
    "subTopics": [
      {
        "id": "sub-58-1",
        "titleHindi": "उच्च न्यायालय स्थापना (29 अगस्त 1949), मुख्य पीठ जोधपुर व जयपुर खंडपीठ",
        "titleEnglish": "Establishment, Principal Seat & Jaipur Bench"
      },
      {
        "id": "sub-58-2",
        "titleHindi": "न्यायाधीशों की नियुक्ति, योग्यताएं, शपथ, कार्यकाल व स्थानांतरण",
        "titleEnglish": "Appointment & Tenure of Judges"
      },
      {
        "id": "sub-58-3",
        "titleHindi": "क्षेत्राधिकार एवं रिट जारी करने की शक्ति (अनुच्छेद 226)",
        "titleEnglish": "Jurisdiction & Writ Powers (Art. 226)"
      },
      {
        "id": "sub-58-4",
        "titleHindi": "अधीनस्थ न्यायपालिका, लोक अदालतें एवं ग्राम न्यायालय",
        "titleEnglish": "Subordinate Courts & Lok Adalats"
      }
    ]
  },
  {
    "id": 45,
    "slug": "state-secretariat-chief-secretary-and-district-administration",
    "name": "State Secretariat, Chief Secretary, Divisional Commissioner and District Administration",
    "nameHindi": "राज्य सचिवालय, मुख्य सचिव, संभागीय आयुक्त एवं जिला प्रशासन",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-secretariat-district",
    "subTopics": [
      {
        "id": "sub-45-1",
        "titleHindi": "राज्य सचिवालय का संगठन, संरचना, कार्यप्रणाली एवं प्रशासनिक नियम",
        "titleEnglish": "State Secretariat Organization & Rules of Business"
      },
      {
        "id": "sub-45-2",
        "titleHindi": "मुख्य सचिव (Chief Secretary): पद, भूमिका, शक्तियाँ, कार्य एवं ऐतिहासिक स्थिति",
        "titleEnglish": "Role & Authority of Chief Secretary"
      },
      {
        "id": "sub-45-3",
        "titleHindi": "संभागीय आयुक्त प्रणाली: प्रशासनिक दायित्व, प्रासंगिकता एवं कार्य",
        "titleEnglish": "Divisional Commissioner System"
      },
      {
        "id": "sub-45-4",
        "titleHindi": "जिला प्रशासन: जिला मजिस्ट्रेट/कलेक्टर की शक्तियाँ, राजस्व, कानून व्यवस्था एवं विकास कार्य",
        "titleEnglish": "District Collector Powers & Responsibilities"
      },
      {
        "id": "sub-45-5",
        "titleHindi": "उपखंड अधिकारी (SDO), तहसीलदार, नायब तहसीलदार एवं पटवारी स्तर तक प्रशासनिक तंत्र",
        "titleEnglish": "Sub-divisional & Tehsil Administration"
      }
    ]
  },
  {
    "id": 46,
    "slug": "panchayati-raj-in-rajasthan",
    "name": "Panchayati Raj in Rajasthan",
    "nameHindi": "राजस्थान पंचायती राज",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-panchayat",
    "subTopics": [
      {
        "id": "sub-60-1",
        "titleHindi": "ऐतिहासिक पृष्ठभूमि (2 अक्टूबर 1959 - नागौर के बगदरी में नेहरूजी द्वारा उद्घाटन)",
        "titleEnglish": "Nagaur Launch (2 Oct 1959) by Nehru"
      },
      {
        "id": "sub-60-2",
        "titleHindi": "73वां संविधान संशोधन अधिनियम एवं 11वीं अनुसूची के 29 विषय",
        "titleEnglish": "73rd Amendment & 29 Subjects"
      },
      {
        "id": "sub-60-3",
        "titleHindi": "राजस्थान पंचायती राज अधिनियम 1994 एवं त्रि-स्तरीय ढांचा (ग्राम, ब्लॉक, जिला)",
        "titleEnglish": "Rajasthan Panchayati Raj Act 1994"
      },
      {
        "id": "sub-60-4",
        "titleHindi": "ग्राम सभा, ग्राम पंचायत, पंचायत समिति एवं जिला परिषद कार्य",
        "titleEnglish": "Gram Sabha & Standing Committees"
      },
      {
        "id": "sub-60-5",
        "titleHindi": "महिला आरक्षण (50%), पेसा अधिनियम 1996 (PESA Act)",
        "titleEnglish": "50% Women Reservation & PESA in TSP"
      }
    ]
  },
  {
    "id": 47,
    "slug": "urban-local-self-government-municipalities",
    "name": "Urban Local Self-Government and Municipalities",
    "nameHindi": "राजस्थान नगरीय स्वशासन एवं नगरपालिका",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-urban",
    "subTopics": [
      {
        "id": "sub-69-1",
        "titleHindi": "74वां संविधान संशोधन अधिनियम एवं 12वीं अनुसूची के 18 विषय",
        "titleEnglish": "74th Amendment & 18 Municipal Subjects"
      },
      {
        "id": "sub-69-2",
        "titleHindi": "राजस्थान नगरपालिका अधिनियम 2009 की प्रमुख धाराएं",
        "titleEnglish": "Rajasthan Municipalities Act 2009"
      },
      {
        "id": "sub-69-3",
        "titleHindi": "त्रि-स्तरीय नगरीय ढांचा (नगर निगम, नगर परिषद, नगर पालिका बोर्ड)",
        "titleEnglish": "Municipal Corporations, Councils & Boards"
      },
      {
        "id": "sub-69-4",
        "titleHindi": "महापौर (Mayor), सभापति, आयुक्त एवं वार्ड समितियों की भूमिका",
        "titleEnglish": "Mayors, Commissioners & Ward Panels"
      }
    ]
  },
  {
    "id": 48,
    "slug": "rajasthan-public-service-commission-rpsc",
    "name": "Rajasthan Public Service Commission RPSC",
    "nameHindi": "राजस्थान लोक सेवा आयोग (RPSC)",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-rpsc",
    "subTopics": [
      {
        "id": "sub-61-1",
        "titleHindi": "संवैधानिक प्रावधान (अनुच्छेद 315 से 323, स्थापना 20 अगस्त 1949)",
        "titleEnglish": "Constitutional Basis (Arts. 315-323) & Setup"
      },
      {
        "id": "sub-61-2",
        "titleHindi": "अध्यक्ष एवं सदस्यों की संरचना (1 अध्यक्ष + 7 सदस्य), योग्यता व कार्यकाल",
        "titleEnglish": "Composition (1+7), Qualifications & Tenure"
      },
      {
        "id": "sub-61-3",
        "titleHindi": "पदमुक्ति प्रक्रिया (अनुच्छेद 317 - उच्चतम न्यायालय जांच)",
        "titleEnglish": "Removal Procedure (Art. 317)"
      },
      {
        "id": "sub-61-4",
        "titleHindi": "RPSC के कार्य, सलाहकार भूमिका एवं वार्षिक प्रतिवेदन",
        "titleEnglish": "Functions, Advisory Role & Annual Report"
      }
    ]
  },
  {
    "id": 49,
    "slug": "rajasthan-state-election-commission",
    "name": "Rajasthan State Election Commission",
    "nameHindi": "राजस्थान राज्य निर्वाचन आयोग",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-sec",
    "subTopics": [
      {
        "id": "sub-62-1",
        "titleHindi": "संवैधानिक आधार (अनुच्छेद 243-K एवं 243-ZA, स्थापना जुलाई 1994)",
        "titleEnglish": "Constitutional Basis (Arts. 243K & 243ZA)"
      },
      {
        "id": "sub-62-2",
        "titleHindi": "राज्य निर्वाचन आयुक्त की नियुक्ति, सेवा शर्तें व पदमुक्ति",
        "titleEnglish": "State Election Commissioner: Terms & Removal"
      },
      {
        "id": "sub-62-3",
        "titleHindi": "पंचायती राज एवं नगरीय निकायों के चुनाव संचालन अधिकार",
        "titleEnglish": "Conduct of Local Body Elections"
      }
    ]
  },
  {
    "id": 50,
    "slug": "rajasthan-state-human-rights-commission",
    "name": "Rajasthan State Human Rights Commission",
    "nameHindi": "राजस्थान मानवाधिकार आयोग",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-shrc",
    "subTopics": [
      {
        "id": "sub-63-1",
        "titleHindi": "गठन (मानवाधिकार संरक्षण अधिनियम 1993, गठन 18 जनवरी 1999)",
        "titleEnglish": "Establishment under PHRA 1993"
      },
      {
        "id": "sub-63-2",
        "titleHindi": "संरचना (1 अध्यक्ष + 2 सदस्य), चयन समिति (CM, गृहमंत्री, स्पीकर, विपक्ष नेता)",
        "titleEnglish": "Composition (1+2) & Selection Panel"
      },
      {
        "id": "sub-63-3",
        "titleHindi": "कार्यकाल (3 वर्ष या 70 वर्ष), शक्तियाँ एवं सिविल कोर्ट अधिकार",
        "titleEnglish": "Tenure (3 Yrs/70 Yrs) & Civil Court Powers"
      },
      {
        "id": "sub-63-4",
        "titleHindi": "आयोग की कार्यप्रणाली, सीमाएं एवं वार्षिक रिपोर्ट",
        "titleEnglish": "Investigation Mechanism & Limitations"
      }
    ]
  },
  {
    "id": 51,
    "slug": "rajasthan-state-commission-for-women",
    "name": "Rajasthan State Commission for Women",
    "nameHindi": "राजस्थान महिला आयोग",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": false,
    "subTopics": [
      {
        "id": "sub-64-1",
        "titleHindi": "अधिनियम 1999, गठन (15 मई 1999) एवं संरचना (1 अध्यक्ष + 3 सदस्य)",
        "titleEnglish": "Establishment (1999) & Structure (1+3)"
      },
      {
        "id": "sub-64-2",
        "titleHindi": "कार्यकाल (3 वर्ष) एवं महिला अधिकारों के संरक्षण कार्य",
        "titleEnglish": "3-Year Tenure & Women Safeguards"
      },
      {
        "id": "sub-64-3",
        "titleHindi": "महिला उत्पीड़न निवारण, जांच शक्तियाँ एवं जनसुनवाई",
        "titleEnglish": "Inquiry into Gender Injustice & Hearings"
      }
    ]
  },
  {
    "id": 52,
    "slug": "rajasthan-state-finance-commission",
    "name": "Rajasthan State Finance Commission",
    "nameHindi": "राजस्थान राज्य वित्त आयोग (RSFC)",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-rsfc",
    "subTopics": [
      {
        "id": "sub-52-1",
        "titleHindi": "संवैधानिक प्रावधान (अनुच्छेद 243-I एवं 243-Y) एवं आयोग की स्थापना",
        "titleEnglish": "Constitutional Mandate (Art 243-I & 243-Y)"
      },
      {
        "id": "sub-52-2",
        "titleHindi": "आयोग की संरचना, अध्यक्ष, सदस्यों की अर्हता एवं कार्यकाल",
        "titleEnglish": "Composition, Chairpersons & Tenure"
      },
      {
        "id": "sub-52-3",
        "titleHindi": "पंचायती राज संस्थाओं एवं नगरीय निकायों को वित्तीय वितरण की अनुशंसाएँ",
        "titleEnglish": "Devolution of State Funds to Local Bodies"
      },
      {
        "id": "sub-52-4",
        "titleHindi": "प्रथम से छठे राज्य वित्त आयोग के अध्यक्ष एवं प्रमुख सिफारिशें",
        "titleEnglish": "1st to 6th State Finance Commissions of Rajasthan"
      }
    ]
  },
  {
    "id": 53,
    "slug": "rajasthan-state-legal-services-authority",
    "name": "Rajasthan State Legal Services Authority",
    "nameHindi": "राजस्थान राज्य विधिक सेवा प्राधिकरण (RSLA / RSLSA)",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-rslsa",
    "subTopics": [
      {
        "id": "sub-53-1",
        "titleHindi": "विधिक सेवा प्राधिकरण अधिनियम 1987 (NALSA) एवं रालसा (RSLSA) का गठन",
        "titleEnglish": "Legal Services Authorities Act 1987 & RSLSA Establishment"
      },
      {
        "id": "sub-53-2",
        "titleHindi": "राज्य विधिक सेवा प्राधिकरण की संरचना, मुख्य संरक्षक (चीफ जस्टिस) एवं कार्यकारी अध्यक्ष",
        "titleEnglish": "Structure & Patron-in-Chief of RSLSA"
      },
      {
        "id": "sub-53-3",
        "titleHindi": "लोक अदालतें, राष्ट्रीय लोक अदालत, स्थायी लोक अदालत (Permanent Lok Adalat) एवं निर्णय का प्रभाव",
        "titleEnglish": "Lok Adalats & Permanent Lok Adalat Powers"
      },
      {
        "id": "sub-53-4",
        "titleHindi": "निःशुल्क विधिक सहायता, पीड़ित प्रतिकर योजना एवं विधिक साक्षरता कार्यक्रम",
        "titleEnglish": "Free Legal Aid & Victim Compensation Schemes"
      }
    ]
  },
  {
    "id": 54,
    "slug": "lokayukta-of-rajasthan",
    "name": "Lokayukta of Rajasthan",
    "nameHindi": "राजस्थान लोकायुक्त",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-lokayukta",
    "subTopics": [
      {
        "id": "sub-65-1",
        "titleHindi": "राजस्थान लोकायुक्त एवं उप-लोकायुक्त अधिनियम 1973 (स्थापना अगस्त 1973)",
        "titleEnglish": "Lokayukta Act 1973 & Background"
      },
      {
        "id": "sub-65-2",
        "titleHindi": "नियुक्ति (राज्यपाल द्वारा CM, CJI, विपक्ष नेता परामर्श), योग्यता व कार्यकाल (5 वर्ष)",
        "titleEnglish": "Appointment & 5-Year Tenure"
      },
      {
        "id": "sub-65-3",
        "titleHindi": "जांच का क्षेत्राधिकार (मंत्री, सचिव, जनसेवक) एवं छूट (मुख्यमंत्री, MLA, न्यायपालिका)",
        "titleEnglish": "Jurisdiction & Exemptions (CM, MLAs)"
      },
      {
        "id": "sub-65-4",
        "titleHindi": "प्रथम लोकायुक्त (न्यायमूर्ति आई.डी. दुआ) एवं सिफारिशी स्वरूप",
        "titleEnglish": "First Lokayukta (Justice ID Dua) & Powers"
      }
    ]
  },
  {
    "id": 55,
    "slug": "research-and-study-centers-of-rajasthan",
    "name": "Research and Study Centers of Rajasthan",
    "nameHindi": "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र",
    "subjectSlug": "rajasthan-polity-administration",
    "subjectHindi": "राजस्थान राजव्यवस्था एवं प्रशासन",
    "examScope": "both",
    "isCommon": true,
    "commonKey": "raj-pol-research",
    "subTopics": [
      {
        "id": "sub-67-1",
        "titleHindi": "काजरी (CAZRI) एवं आफरी (AFRI) - जोधपुर",
        "titleEnglish": "CAZRI & AFRI (Jodhpur)"
      },
      {
        "id": "sub-67-2",
        "titleHindi": "राष्ट्रीय बीजीय मसाला अनुसंधान केंद्र (तबीजी, अजमेर) व ऊंट अनुसंधान (जोहड़बीड़)",
        "titleEnglish": "NRCSS Ajmer & Camel Research Bikaner"
      },
      {
        "id": "sub-67-3",
        "titleHindi": "केंद्रीय भेड़ एवं ऊन अनुसंधान संस्थान (अविकानगर, टोंक)",
        "titleEnglish": "CSWRI Avikanagar (Tonk)"
      },
      {
        "id": "sub-67-4",
        "titleHindi": "राजस्थान प्राच्य विद्या प्रतिष्ठान एवं भाषा शोध संस्थान",
        "titleEnglish": "Rajasthan Oriental Research Institute"
      }
    ]
  }
];

// Helper functions for static access
export function getStaticSubjects(): StaticSubject[] {
  return CANONICAL_SUBJECTS;
}

export function getStaticSubjectBySlug(slug: string): StaticSubject | undefined {
  return CANONICAL_SUBJECTS.find((s) => s.slug === slug);
}

export function getStaticTopics(): StaticTopic[] {
  return CANONICAL_TOPICS;
}

export function getStaticTopicById(id: number): StaticTopic | undefined {
  return CANONICAL_TOPICS.find((t) => t.id === id);
}

export function getStaticTopicBySlug(slug: string): StaticTopic | undefined {
  return CANONICAL_TOPICS.find((t) => t.slug === slug);
}

export function getStaticTopicsBySubject(subjectSlug: string): StaticTopic[] {
  return CANONICAL_TOPICS.filter((t) => t.subjectSlug === subjectSlug);
}
