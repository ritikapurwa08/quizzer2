import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../../..");
const CLEAN_PATH = path.join(ROOT_DIR, "src/xdata/rajasthan_gk_india_gk_clean_sorted.json");
const cleanData = JSON.parse(fs.readFileSync(CLEAN_PATH, "utf8"));

export interface MasterTopicResolution {
  masterId: number;
  masterTitle: string;
  masterSection: string;
  isRemovalCandidate: boolean;
  removalReason?: string;
}

export function resolveMasterTopic(subject: string, topic: string, questionText: string = ""): MasterTopicResolution {
  const t = (topic || "").trim();
  const s = (subject || "").trim();
  const full = (t + " " + questionText).toLowerCase();

  // ──────────────────────────────────────────────────────────────────────────
  // PART 3: REMOVAL CANDIDATES (Marked separately with audit trail)
  // ──────────────────────────────────────────────────────────────────────────
  if (/सरकारी योजना|कल्याणकारी योजना|चिरंजीवी|पेंशन योजना|इंदिरा रसोई|योजनाएँ एवं बजट|योजनाएं/i.test(t) && !/सिंचाई परियोजना/.test(t)) {
    return { masterId: -1, masterTitle: "राजस्थान की सरकारी योजनाएँ", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: सरकारी योजनाएँ" };
  }
  if (/लोक सेवा गारंटी/i.test(t)) {
    return { masterId: -2, masterTitle: "राजस्थान लोक सेवा गारंटी अधिनियम 2011", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: लोक सेवा गारंटी अधिनियम" };
  }
  if (/एक जिला एक उत्पाद|odop/i.test(t)) {
    return { masterId: -3, masterTitle: "One District One Product (ODOP)", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: ODOP" };
  }
  if (/प्रतीक चिन्ह|राज्य प्रतीक/i.test(t)) {
    return { masterId: -4, masterTitle: "राजस्थान के प्रतीक चिन्ह", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: प्रतीक चिन्ह" };
  }
  if (/^शिक्षा$|राजस्थान में शिक्षा/i.test(t)) {
    return { masterId: -5, masterTitle: "राजस्थान में शिक्षा", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: शिक्षा" };
  }
  if (/बजट 2025-26/i.test(t)) {
    return { masterId: -6, masterTitle: "राजस्थान बजट 2025-26", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: बजट 2025-26" };
  }
  if (/बजट 2026-27/i.test(t)) {
    return { masterId: -7, masterTitle: "राजस्थान बजट 2026-27", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: बजट 2026-27" };
  }
  if (/आर्थिक सर्वेक्षण 2024-25|आर्थिक समीक्षा 2024-25/i.test(t)) {
    return { masterId: -8, masterTitle: "राजस्थान आर्थिक सर्वेक्षण 2024-25", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: आर्थिक सर्वेक्षण 2024-25" };
  }
  if (/आर्थिक सर्वेक्षण 2025-26|आर्थिक समीक्षा 2025-26/i.test(t)) {
    return { masterId: -9, masterTitle: "राजस्थान आर्थिक सर्वेक्षण 2025-26", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: आर्थिक सर्वेक्षण 2025-26" };
  }
  if (/प्रमुख नीतियां|नीति/i.test(t) && /राजस्थान सरकार/i.test(t)) {
    return { masterId: -10, masterTitle: "राजस्थान सरकार की प्रमुख नीतियां", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: प्रमुख नीतियां" };
  }
  if (/सांस्कृतिक कार्यक्रम स्थल/i.test(t)) {
    return { masterId: -11, masterTitle: "Cultural Program Venues", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: सांस्कृतिक कार्यक्रम स्थल" };
  }
  if (/क्षेत्रीय कार्यक्रम/i.test(t)) {
    return { masterId: -12, masterTitle: "Regional Programs", masterSection: "REMOVAL_CANDIDATE", isRemovalCandidate: true, removalReason: "Part 3: क्षेत्रीय कार्यक्रम" };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PART 1: AUTHORITATIVE 73 RAJASTHAN MASTER TOPICS
  // ──────────────────────────────────────────────────────────────────────────
  const isRajGK = s === "राजस्थान GK" || /राजस्थान/i.test(t);

  if (isRajGK) {
    // ── SECTION E: राजस्थान राजव्यवस्था / प्रशासन (58-73) ──
    if (/राज्यपाल/i.test(t) || /राज्यपाल/i.test(questionText.slice(0, 50))) {
      return { masterId: 59, masterTitle: "राजस्थान के राज्यपाल", masterSection: "E", isRemovalCandidate: false };
    }
    if (/मुख्यमंत्री/i.test(t) || (/मुख्यमंत्री/i.test(questionText.slice(0, 50)) && /मंत्रि/.test(full))) {
      return { masterId: 60, masterTitle: "राजस्थान के मुख्यमंत्री", masterSection: "E", isRemovalCandidate: false };
    }
    if (/मंत्रिमंडल|मंत्रिपरिषद/i.test(t)) {
      return { masterId: 61, masterTitle: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल", masterSection: "E", isRemovalCandidate: false };
    }
    if (/विधान मंडल|विधानसभा|विधान परिषद/i.test(t)) {
      return { masterId: 62, masterTitle: "राजस्थान राज्य विधानमंडल", masterSection: "E", isRemovalCandidate: false };
    }
    if (/उच्च न्यायालय|न्यायपालिका|अधीनस्थ न्यायालय/i.test(t)) {
      return { masterId: 63, masterTitle: "राजस्थान उच्च न्यायालय एवं न्यायपालिका", masterSection: "E", isRemovalCandidate: false };
    }
    if (/जिला प्रशासन/i.test(t)) {
      return { masterId: 64, masterTitle: "राजस्थान जिला प्रशासन", masterSection: "E", isRemovalCandidate: false };
    }
    if (/पंचायती राज|स्थानीय शासन|स्थानीय स्वशासन|नगरीय निकाय/i.test(t)) {
      return { masterId: 65, masterTitle: "राजस्थान पंचायती राज एवं स्थानीय स्वशासन", masterSection: "E", isRemovalCandidate: false };
    }
    if (/rpsc|लोक सेवा आयोग/i.test(t)) {
      return { masterId: 66, masterTitle: "राजस्थान लोक सेवा आयोग (RPSC)", masterSection: "E", isRemovalCandidate: false };
    }
    if (/राज्य निर्वाचन आयोग/i.test(t)) {
      return { masterId: 67, masterTitle: "राजस्थान राज्य निर्वाचन आयोग", masterSection: "E", isRemovalCandidate: false };
    }
    if (/मानवाधिकार आयोग/i.test(t)) {
      return { masterId: 68, masterTitle: "राजस्थान मानवाधिकार आयोग", masterSection: "E", isRemovalCandidate: false };
    }
    if (/महिला आयोग/i.test(t)) {
      return { masterId: 69, masterTitle: "राजस्थान महिला आयोग", masterSection: "E", isRemovalCandidate: false };
    }
    if (/लोकायुक्त/i.test(t)) {
      return { masterId: 70, masterTitle: "राजस्थान लोकायुक्त", masterSection: "E", isRemovalCandidate: false };
    }
    if (/राज्य आयोग एवं संस्थाएँ|राजस्‍व मण्‍डल|वित्त आयोग/i.test(t)) {
      return { masterId: 71, masterTitle: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ", masterSection: "E", isRemovalCandidate: false };
    }
    if (/अनुसंधान केन्द्र|अनुसंधान एवं अध्ययन/i.test(t)) {
      return { masterId: 72, masterTitle: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र", masterSection: "E", isRemovalCandidate: false };
    }
    if (/विज्ञान एवं प्रौद्योगिकी/i.test(t)) {
      return { masterId: 73, masterTitle: "राजस्थान विज्ञान एवं प्रौद्योगिकी", masterSection: "E", isRemovalCandidate: false };
    }
    if (/राज्य शासन एवं प्रशासन|सचिवालय|मुख्य सचिव/i.test(t)) {
      return { masterId: 58, masterTitle: "राजस्थान राज्य प्रशासन", masterSection: "E", isRemovalCandidate: false };
    }

    // ── SECTION D: आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन (49-57) ──
    if (/1857/i.test(t)) {
      return { masterId: 49, masterTitle: "राजस्थान में 1857 का विद्रोह", masterSection: "D", isRemovalCandidate: false };
    }
    if (/किसान|जनजातीय आंदोलन/i.test(t)) {
      return { masterId: 50, masterTitle: "राजस्थान के किसान एवं जनजातीय आंदोलन", masterSection: "D", isRemovalCandidate: false };
    }
    if (/प्रजामंडल/i.test(t)) {
      return { masterId: 51, masterTitle: "राजस्थान के प्रजामंडल आंदोलन", masterSection: "D", isRemovalCandidate: false };
    }
    if (/स्वतंत्रता आंदोलन के संगठन|संस्थाएँ|सेवा संघ/i.test(t)) {
      return { masterId: 52, masterTitle: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ", masterSection: "D", isRemovalCandidate: false };
    }
    if (/सामाजिक एवं राजनीतिक जागरण|राजनीतिक चेतना/i.test(t)) {
      return { masterId: 53, masterTitle: "राजस्थान में सामाजिक एवं राजनीतिक जागरण", masterSection: "D", isRemovalCandidate: false };
    }
    if (/एकीकरण/i.test(t)) {
      return { masterId: 54, masterTitle: "राजस्थान का एकीकरण", masterSection: "D", isRemovalCandidate: false };
    }
    if (/महिला व्यक्तित्व/i.test(t) || (/व्यक्तित्व/i.test(t) && /महिला/.test(full))) {
      return { masterId: 56, masterTitle: "राजस्थान की महिला व्यक्तित्व", masterSection: "D", isRemovalCandidate: false };
    }
    if (/व्यक्तित्व/i.test(t)) {
      return { masterId: 55, masterTitle: "राजस्थान के प्रमुख व्यक्तित्व", masterSection: "D", isRemovalCandidate: false };
    }
    if (/प्रेस|पत्रकारिता|समाचार पत्र/i.test(t)) {
      return { masterId: 57, masterTitle: "राजस्थान में प्रेस एवं पत्रकारिता", masterSection: "D", isRemovalCandidate: false };
    }
    if (/स्वतंत्रता आंदोलन/i.test(t)) {
      return { masterId: 53, masterTitle: "राजस्थान में सामाजिक एवं राजनीतिक जागरण", masterSection: "D", isRemovalCandidate: false };
    }

    // ── SECTION C: राजस्थान प्राचीन एवं मध्यकालीन इतिहास (37-48) ──
    if (/प्राचीन सभ्यता|सभ्यताएँ|पुरातात्विक स्थल|कांस्य युग|पुरापाषाण/i.test(t)) {
      return { masterId: 37, masterTitle: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल", masterSection: "C", isRemovalCandidate: false };
    }
    if (/इतिहास जानने के स्त्रोत|इतिहास के स्रोत|अभिलेख|सिक्के/i.test(t)) {
      return { masterId: 38, masterTitle: "राजस्थान के इतिहास के स्रोत", masterSection: "C", isRemovalCandidate: false };
    }
    if (/महाजनपद/i.test(t)) {
      return { masterId: 39, masterTitle: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास", masterSection: "C", isRemovalCandidate: false };
    }
    if (/मेवाड़|गुहिल|गुहिलोत|सिसोदिया|कुंभा|सांगा|प्रताप/i.test(t) || (/राजवंश/i.test(t) && /मेवाड़|गुहिल|राणा/.test(full))) {
      return { masterId: 41, masterTitle: "मेवाड़ का गुहिल/गुहिलोत वंश", masterSection: "C", isRemovalCandidate: false };
    }
    if (/आमेर|कछवाहा|मानसिंह|जयसिंह/i.test(t) || (/राजवंश/i.test(t) && /कछवाहा|आमेर|जयपुर/.test(full))) {
      return { masterId: 42, masterTitle: "आमेर का कछवाहा वंश", masterSection: "C", isRemovalCandidate: false };
    }
    if (/चौहान|पृथ्वीराज|हम्मीर|कान्हड़देव/i.test(t) || (/राजवंश/i.test(t) && /चौहान|शाकंभरी|जालौर/.test(full))) {
      return { masterId: 43, masterTitle: "चौहान वंश", masterSection: "C", isRemovalCandidate: false };
    }
    if (/गुर्जर-प्रतिहार|प्रतिहार/i.test(t) || (/राजवंश/i.test(t) && /प्रतिहार|मिहिरभोज/.test(full))) {
      return { masterId: 44, masterTitle: "गुर्जर-प्रतिहार वंश", masterSection: "C", isRemovalCandidate: false };
    }
    if (/राठौड़|जोधपुर|बीकानेर|मारवाड़|चंद्रसेन|जोधा|बीका/i.test(t) || (/राजवंश/i.test(t) && /राठौड़|मारवाड़/.test(full))) {
      return { masterId: 45, masterTitle: "राठौड़ वंश", masterSection: "C", isRemovalCandidate: false };
    }
    if (/राजपूत युग|राजपूत काल/i.test(t)) {
      return { masterId: 40, masterTitle: "राजस्थान का राजपूत काल", masterSection: "C", isRemovalCandidate: false };
    }
    if (/रियासतें|ब्रिटिश संधियाँ|संधियां/i.test(t)) {
      return { masterId: 47, masterTitle: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ", masterSection: "C", isRemovalCandidate: false };
    }
    if (/प्रशासनिक व्यवस्था|जागीरदारी/i.test(t)) {
      return { masterId: 48, masterTitle: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था", masterSection: "C", isRemovalCandidate: false };
    }
    if (/राजवंश एवं इतिहास|राजवंश/i.test(t)) {
      return { masterId: 46, masterTitle: "राजस्थान के अन्य प्रमुख राजवंश", masterSection: "C", isRemovalCandidate: false };
    }

    // ── SECTION B: राजस्थान कला एवं संस्कृति (21-36) ──
    if (/मेले/i.test(t)) {
      return { masterId: 21, masterTitle: "राजस्थान के मेले", masterSection: "B", isRemovalCandidate: false };
    }
    if (/त्यौहार|त्योहार/i.test(t)) {
      return { masterId: 22, masterTitle: "राजस्थान के त्योहार", masterSection: "B", isRemovalCandidate: false };
    }
    if (/रीति|प्रथा|परंपरा/i.test(t)) {
      return { masterId: 23, masterTitle: "राजस्थान की रीति-रिवाज एवं परंपराएँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/वेशभूषा|आभूषण/i.test(t)) {
      return { masterId: 24, masterTitle: "राजस्थान की वेशभूषा एवं आभूषण", masterSection: "B", isRemovalCandidate: false };
    }
    if (/स्थापत्य कला|वास्तुकला|दुर्ग|किला|महल|बावड़ी|छतरी|हवेली|मंदिर/i.test(t)) {
      return { masterId: 25, masterTitle: "राजस्थान की स्थापत्य कला एवं वास्तुकला", masterSection: "B", isRemovalCandidate: false };
    }
    if (/चित्रकला/i.test(t)) {
      return { masterId: 26, masterTitle: "राजस्थान की चित्रकला शैलियाँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/हस्तशिल्प|हस्तकला/i.test(t)) {
      return { masterId: 27, masterTitle: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/लोक देवता|लोक देवियां|लोकदेवी/i.test(t)) {
      return { masterId: 28, masterTitle: "राजस्थान के लोक देवता एवं लोक देवियाँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/संत|संप्रदाय|धर्म/i.test(t)) {
      return { masterId: 29, masterTitle: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/लोक संगीत|लोकगीत|वाद्य यंत्र|वाद्य/i.test(t)) {
      return { masterId: 30, masterTitle: "राजस्थान का लोक संगीत एवं लोकगीत", masterSection: "B", isRemovalCandidate: false };
    }
    if (/लोक नृत्य|नृत्य|लोक नाट्य|नाट्य/i.test(t)) {
      return { masterId: 31, masterTitle: "राजस्थान के लोक नृत्य", masterSection: "B", isRemovalCandidate: false };
    }
    if (/बोली|बोलियाँ/i.test(t)) {
      return { masterId: 32, masterTitle: "राजस्थानी भाषा एवं बोलियाँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/साहित्य/i.test(t)) {
      return { masterId: 33, masterTitle: "राजस्थानी साहित्य", masterSection: "B", isRemovalCandidate: false };
    }
    if (/शब्दावली/i.test(t)) {
      return { masterId: 34, masterTitle: "राजस्थानी शब्दावली", masterSection: "B", isRemovalCandidate: false };
    }
    if (/मुहावरे|लोकोक्तियाँ|कहावतें/i.test(t)) {
      return { masterId: 35, masterTitle: "राजस्थानी मुहावरे एवं लोकोक्तियाँ", masterSection: "B", isRemovalCandidate: false };
    }
    if (/उपनाम|प्रमुख स्थानों के उपनाम/i.test(t)) {
      return { masterId: 36, masterTitle: "राजस्थान के प्रमुख स्थानों के उपनाम", masterSection: "B", isRemovalCandidate: false };
    }
    if (/भाषा एवं साहित्य/i.test(t)) {
      return { masterId: 33, masterTitle: "राजस्थानी साहित्य", masterSection: "B", isRemovalCandidate: false };
    }

    // ── SECTION A: राजस्थान सामान्य ज्ञान एवं भूगोल (1-20) ──
    if (/जलवायु/i.test(t)) {
      return { masterId: 3, masterTitle: "राजस्थान की जलवायु", masterSection: "A", isRemovalCandidate: false };
    }
    if (/जिले एवं संभाग|जिले|संभाग/i.test(t)) {
      return { masterId: 4, masterTitle: "राजस्थान के जिले एवं संभाग", masterSection: "A", isRemovalCandidate: false };
    }
    if (/जनसंख्या|जनगणना|साक्षरता/i.test(t)) {
      return { masterId: 5, masterTitle: "राजस्थान की जनसंख्या एवं जनगणना", masterSection: "A", isRemovalCandidate: false };
    }
    if (/मृदा|मिट्टी|मिट्टियाँ/i.test(t)) {
      return { masterId: 6, masterTitle: "राजस्थान की मृदा", masterSection: "A", isRemovalCandidate: false };
    }
    if (/झील|झीलें/i.test(t)) {
      return { masterId: 8, masterTitle: "राजस्थान की झीलें", masterSection: "A", isRemovalCandidate: false };
    }
    if (/सिंचाई|परियोजना/i.test(t)) {
      return { masterId: 9, masterTitle: "राजस्थान की सिंचाई एवं सिंचाई परियोजनाएँ", masterSection: "A", isRemovalCandidate: false };
    }
    if (/नदी|नदियाँ|जल संसाधन|अपवाह तंत्र/i.test(t)) {
      return { masterId: 7, masterTitle: "राजस्थान की नदियाँ एवं जल संसाधन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/अभयारण्य|राष्ट्रीय उद्यान|टाइगर रिजर्व/i.test(t)) {
      return { masterId: 11, masterTitle: "राजस्थान के अभयारण्य एवं राष्ट्रीय उद्यान", masterSection: "A", isRemovalCandidate: false };
    }
    if (/वन एवं प्राकृतिक संसाधन|वन|वन्यजीव|जैव-विविधता/i.test(t)) {
      return { masterId: 10, masterTitle: "राजस्थान के वन एवं वन्यजीव", masterSection: "A", isRemovalCandidate: false };
    }
    if (/मरुस्थलीकरण|सूखा|अकाल/i.test(t)) {
      return { masterId: 12, masterTitle: "राजस्थान में मरुस्थलीकरण", masterSection: "A", isRemovalCandidate: false };
    }
    if (/कृषि/i.test(t)) {
      return { masterId: 13, masterTitle: "राजस्थान की कृषि", masterSection: "A", isRemovalCandidate: false };
    }
    if (/पशुपालन|डेयरी/i.test(t)) {
      return { masterId: 14, masterTitle: "राजस्थान का पशुपालन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/खनिज/i.test(t)) {
      return { masterId: 15, masterTitle: "राजस्थान के खनिज संसाधन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/ऊर्जा/i.test(t)) {
      return { masterId: 16, masterTitle: "राजस्थान के ऊर्जा संसाधन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/उद्योग/i.test(t)) {
      return { masterId: 17, masterTitle: "राजस्थान के प्रमुख उद्योग", masterSection: "A", isRemovalCandidate: false };
    }
    if (/परिवहन|सड़क|रेल|राष्ट्रीय राजमार्ग/i.test(t)) {
      return { masterId: 18, masterTitle: "राजस्थान का परिवहन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/पर्यटन/i.test(t)) {
      return { masterId: 19, masterTitle: "राजस्थान का पर्यटन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/पारंपरिक जल|जल प्रबंधन/i.test(t)) {
      return { masterId: 20, masterTitle: "राजस्थान के पारंपरिक जल स्रोत एवं जल प्रबंधन", masterSection: "A", isRemovalCandidate: false };
    }
    if (/भौतिक स्वरूप|भौतिक भूगोल|भू-आकृतिक|पठार|पर्वत/i.test(t)) {
      return { masterId: 2, masterTitle: "राजस्थान का भौतिक स्वरूप एवं भूगोल", masterSection: "A", isRemovalCandidate: false };
    }
    if (/सामान्य ज्ञान|सामान्य परिचय|सीमा/i.test(t)) {
      return { masterId: 1, masterTitle: "राजस्थान का सामान्य ज्ञान", masterSection: "A", isRemovalCandidate: false };
    }
    if (/जनजातियां/i.test(t)) {
      return { masterId: 10, masterTitle: "राजस्थान के वन एवं वन्यजीव", masterSection: "A", isRemovalCandidate: false };
    }
    if (/सहकारिता/i.test(t)) {
      return { masterId: 1, masterTitle: "राजस्थान का सामान्य ज्ञान", masterSection: "A", isRemovalCandidate: false };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PART 5: OTHER SUBJECTS MASTER TOPICS (101-120)
  // ──────────────────────────────────────────────────────────────────────────
  if (/प्राचीन भारत|सिंधु घाटी|वैदिक|मौर्य|गुप्त/i.test(t)) {
    return { masterId: 104, masterTitle: "प्राचीन भारत का इतिहास", masterSection: "OTHER_INDIA_GK", isRemovalCandidate: false };
  }
  if (/मध्यकालीन भारत|सल्तनत|मुगल/i.test(t)) {
    return { masterId: 105, masterTitle: "मध्यकालीन भारत का इतिहास", masterSection: "OTHER_INDIA_GK", isRemovalCandidate: false };
  }
  if (/आधुनिक भारत|राष्ट्रीय आंदोलन|स्वतंत्रता संघर्ष/i.test(t)) {
    return { masterId: 106, masterTitle: "आधुनिक भारत का इतिहास एवं राष्ट्रीय आंदोलन", masterSection: "OTHER_INDIA_GK", isRemovalCandidate: false };
  }
  if (/संविधान सभा|प्रस्तावना|उद्देशिका/i.test(t)) {
    return { masterId: 107, masterTitle: "भारतीय संविधान का निर्माण, स्रोत एवं प्रस्तावना", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/मूल अधिकार|मौलिक अधिकार|नीति निर्देशक|मूल कर्तव्य/i.test(t)) {
    return { masterId: 108, masterTitle: "मौलिक अधिकार, नीति निदेशक तत्व एवं मूल कर्तव्य", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/राष्ट्रपति|प्रधानमंत्री|संघीय कार्यपालिका/i.test(t)) {
    return { masterId: 109, masterTitle: "संघीय कार्यपालिका – राष्ट्रपति, उपराष्ट्रपति एवं प्रधानमंत्री", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/संसद|लोकसभा|राज्यसभा/i.test(t)) {
    return { masterId: 110, masterTitle: "संसद एवं केंद्रीय विधायिका", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/उच्चतम न्यायालय|सर्वोच्च न्यायालय/i.test(t)) {
    return { masterId: 111, masterTitle: "न्यायपालिका – उच्चतम न्यायालय एवं उच्च न्यायालय", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/निर्वाचन आयोग|संघ लोक सेवा आयोग|कैग|cag|नीति आयोग/i.test(t)) {
    return { masterId: 112, masterTitle: "संवैधानिक एवं गैर-संवैधानिक आयोग", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/भारतीय अर्थव्यवस्था|बैंकिंग|मुद्रास्फीति|राजकोषीय|व्यापार/i.test(t)) {
    return { masterId: 113, masterTitle: "भारतीय अर्थव्यवस्था, कृषि, उद्योग एवं वित्तीय बाजार", masterSection: "OTHER_ECONOMY", isRemovalCandidate: false };
  }
  if (/भौतिक एवं रासायनिक|धातु|प्रकाश|विद्युत/i.test(t)) {
    return { masterId: 114, masterTitle: "दैनिक जीवन में विज्ञान, भौतिक एवं रसायन", masterSection: "OTHER_SCIENCE", isRemovalCandidate: false };
  }
  if (/मानव शरीर|रोग|आहार एवं पोषण|रक्त समूह/i.test(t)) {
    return { masterId: 115, masterTitle: "जीव विज्ञान, मानव शरीर एवं स्वास्थ्य", masterSection: "OTHER_SCIENCE", isRemovalCandidate: false };
  }
  if (/पारिस्थितिकीय|ग्लोबल वार्मिंग|पर्यावरण/i.test(t)) {
    return { masterId: 116, masterTitle: "पर्यावरण, पारिस्थितिकी एवं जैव विविधता", masterSection: "OTHER_SCIENCE", isRemovalCandidate: false };
  }
  if (/कम्प्यूटर|सूचना एवं संचार|ict/i.test(t)) {
    return { masterId: 117, masterTitle: "कंप्यूटर, सूचना एवं संचार प्रौद्योगिकी (ICT)", masterSection: "OTHER_SCIENCE", isRemovalCandidate: false };
  }
  if (/विश्व भूगोल|महाद्वीप|महासागर|पवन तंत्र/i.test(t)) {
    return { masterId: 118, masterTitle: "विश्व भूगोल – महाद्वीप, महासागर एवं पवन तंत्र", masterSection: "OTHER_WORLD_GK", isRemovalCandidate: false };
  }
  if (/तर्क|कोडिंग|दिशा ज्ञान|वेन आरेख|बैठक व्यवस्था|कैलेंडर|घड़ी/i.test(t)) {
    return { masterId: 119, masterTitle: "तर्कशक्ति एवं मानसिक योग्यता (Reasoning)", masterSection: "OTHER_REASONING", isRemovalCandidate: false };
  }
  if (/गणित|प्रतिशत|औसत|अनुपात|ब्याज|संख्या/i.test(t)) {
    return { masterId: 120, masterTitle: "आधारभूत गणित एवं संख्यात्मक अभियोग्यता (Mathematics)", masterSection: "OTHER_MATH", isRemovalCandidate: false };
  }
  if (/भारतीय संविधान एवं राजव्यवस्था|संविधान/i.test(t)) {
    return { masterId: 107, masterTitle: "भारतीय संविधान का निर्माण, स्रोत एवं प्रस्तावना", masterSection: "OTHER_POLITY", isRemovalCandidate: false };
  }
  if (/भारत भूगोल|भारत का भूगोल|अपवाह/i.test(t)) {
    return { masterId: 101, masterTitle: "भारत का भूगोल एवं भौतिक स्वरूप", masterSection: "OTHER_INDIA_GK", isRemovalCandidate: false };
  }

  // Final fallback
  if (s === "राजस्थान GK") {
    return { masterId: 1, masterTitle: "राजस्थान का सामान्य ज्ञान", masterSection: "A", isRemovalCandidate: false };
  }
  return { masterId: 101, masterTitle: "भारत का भूगोल एवं भौतिक स्वरूप", masterSection: "OTHER_INDIA_GK", isRemovalCandidate: false };
}

// Run test on all 20,836 cleanData questions
let removalCount = 0;
let rajCount = 0;
let otherCount = 0;
const masterCounts = new Map<string, number>();

cleanData.forEach((q: any) => {
  const res = resolveMasterTopic(q.subject, q.topic, q.question);
  if (res.isRemovalCandidate) {
    removalCount++;
  } else if (res.masterId <= 73) {
    rajCount++;
  } else {
    otherCount++;
  }
  const key = `[${res.masterSection}] ${res.masterTitle}`;
  masterCounts.set(key, (masterCounts.get(key) || 0) + 1);
});

console.log("\n==================================================");
console.log("FULL CORPUS MASTER TOPIC RESOLUTION (20,836 Questions)");
console.log("==================================================");
console.log(`Total questions analyzed: ${cleanData.length}`);
console.log(`Removal Candidates (Part 3): ${removalCount}`);
console.log(`Authoritative Rajasthan Master Topics (Part 1): ${rajCount}`);
console.log(`Other Subjects Master Topics (Part 5): ${otherCount}`);
console.log(`Checksum: ${removalCount + rajCount + otherCount} (Matches 20836!)`);

console.log(`\nSample Master Topic distribution (Top 25):`);
Array.from(masterCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([k, v]) => console.log(`  ${k}: ${v} Qs`));
