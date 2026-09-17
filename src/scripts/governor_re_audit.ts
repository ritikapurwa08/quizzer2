import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const RG_GOV_PATH = path.join(XDATA_DIR, "topics/rajasthan_gyan/46_राज्यपाल.json");

interface RawQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
}

interface ProcessedQuestion extends RawQuestion {
  cleanStemText: string;
  cleanOptions: string[];
  cleanAnswer: string;
  isPYQ: boolean;
  score: number;
  factKey: string;
  factTitle: string;
  defectReason?: string;
}

const rawData: RawQuestion[] = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));

function cleanOptionText(opt: string): string {
  if (!opt) return "";
  return opt
    // (A) or [A] or (अ) or (1)
    .replace(/^[\s(\[]+(?:[अबसदa-dA-D1-5]|[ivxIVX]+)[\s)\]:.-]+\s*/, "")
    // A. or 1. or क. or A- or 1- (must have punctuation delimiter)
    .replace(/^(?:[अबसदa-dA-D1-5]|[ivxIVX]+)[)\]:.-]+\s*/, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function cleanStemText(text: string): string {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/निम्नांकित/g, "निम्नलिखित")
    .replace(/कोन\b|कोन(?=\s)/g, "कौन")
    .replace(/[\s\-_।,?!;:""''()[\]{}|/\\~`@#$%^&*+=<>]+/g, "")
    .toLowerCase();
}

function isFakeExam(str?: string | null): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return (
    !lower ||
    lower === "unknown" ||
    lower === "unknown exam" ||
    lower === "practice" ||
    lower === "practice exam" ||
    lower === "none" ||
    lower === "n/a"
  );
}

// 1. Initial Quality Audit & Defect Detection
const processed: ProcessedQuestion[] = [];
const defectiveList: { id: number; reason: string; question: string }[] = [];

for (const q of rawData) {
  let defectReason: string | undefined;

  // Check options count
  if (!q.options || q.options.length < 4) {
    defectReason = `Invalid options count: ${q.options?.length || 0}`;
  } else if (q.options.length > 4) {
    // Check if 8 options due to explanation text merged into options (e.g. 12574, 12595)
    defectReason = `Corrupted options count (${q.options.length} options - explanation merged into options array)`;
  }

  const cleanedOpts = (q.options || []).slice(0, 4).map(cleanOptionText).filter(Boolean);
  if (!defectReason && cleanedOpts.length < 4) {
    defectReason = "Less than 4 non-empty options after cleaning";
  }

  // Check unique options
  const optSet = new Set(cleanedOpts.map((o) => o.toLowerCase()));
  if (!defectReason && optSet.size < 4) {
    defectReason = "Duplicate options within question";
  }

  // Check answer match
  const rawAns = (q.answer || "").trim();
  const cleanAns = cleanOptionText(rawAns);
  let matchedAns = "";
  if (!defectReason) {
    for (const opt of cleanedOpts) {
      if (
        opt.toLowerCase() === cleanAns.toLowerCase() ||
        opt.toLowerCase() === rawAns.toLowerCase() ||
        cleanStemText(opt) === cleanStemText(cleanAns)
      ) {
        matchedAns = opt;
        break;
      }
    }
    if (!matchedAns) {
      // Check letter match (अ/ब/स/द)
      const letterMatch = rawAns.match(/^[\(\[]?([अबसदa-dA-D1-4])[\)\]]?/);
      if (letterMatch) {
        const letterMap: Record<string, number> = {
          अ: 0,
          ब: 1,
          स: 2,
          द: 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
          "1": 0,
          "2": 1,
          "3": 2,
          "4": 3,
        };
        const idx = letterMap[letterMatch[1].toLowerCase()];
        if (idx !== undefined && idx < cleanedOpts.length) {
          matchedAns = cleanedOpts[idx];
        }
      }
    }
    if (!matchedAns) {
      defectReason = `Answer "${rawAns}" does not match any option`;
    }
  }

  // Check deleted / cancelled * answer
  if (rawAns === "*" || rawAns === "X" || rawAns.includes("डिलीट")) {
    defectReason = `RPSC cancelled/deleted question (Answer = "${rawAns}")`;
  }

  if (defectReason) {
    defectiveList.push({ id: q.id, reason: defectReason, question: q.question });
  }

  // Score calculation for prioritization
  const isPYQ = !isFakeExam(q.exam);
  let score = 50;
  if (isPYQ) {
    score += 40;
    if (/ras|sub inspector|lecturer|teacher|patwar|cet/i.test(q.exam || "")) score += 15;
    // Year bonus for recent exams
    const yrMatch = (q.exam || "").match(/20\d\d/);
    if (yrMatch) {
      score += Math.min(10, parseInt(yrMatch[0], 10) - 2015);
    }
  }
  if (q.explanation && q.explanation.length >= 30) score += 15;
  if (q.question.length >= 30 && q.question.length <= 150) score += 10;

  processed.push({
    ...q,
    cleanStemText: cleanStemText(q.question),
    cleanOptions: cleanedOpts,
    cleanAnswer: matchedAns || cleanAns,
    isPYQ,
    score,
    factKey: "",
    factTitle: "",
    defectReason,
  });
}

// 2. Identify EXACT Duplicates (cleanStemText equality)
const exactDupGroups = new Map<string, ProcessedQuestion[]>();
processed.forEach((q) => {
  if (!exactDupGroups.has(q.cleanStemText)) exactDupGroups.set(q.cleanStemText, []);
  exactDupGroups.get(q.cleanStemText)!.push(q);
});

// 3. Define Fact / Information Point Classifiers
// RULE: One specific information-point = 1 representative question.
// BUT different facts (e.g. Art 153 vs 154 vs 155 vs 156 tenure vs 156 resignation vs 157 vs 159 vs 161 vs 200 vs 213, etc.) MUST be separate!

function assignFact(q: ProcessedQuestion): { key: string; title: string } {
  const full = (q.question + " " + (q.explanation || "") + " " + (q.answer || "") + " " + q.options.join(" ")).toLowerCase();
  const qStem = q.question.toLowerCase();
  const ans = (q.answer || "").toLowerCase();

  // Art 153: Office of Governor / 7th Amendment
  if (/153\b|प्रत्येक राज्य के लिए एक राज्यपाल|प्रत्येक राज्य में एक राज्यपाल/.test(full) && (/153/.test(ans) || /एक राज्यपाल/.test(qStem))) {
    return { key: "art_153", title: "Article 153 – Office of Governor (प्रत्येक राज्य हेतु एक राज्यपाल / 7वां संशोधन)" };
  }

  // Art 154: Executive Power of State
  if (/154\b|कार्यपालक शक्तियां|कार्यपालिका शक्ति राज्यपाल में निहित/.test(full) && (/154/.test(ans) || /कार्यपाल/.test(qStem))) {
    return { key: "art_154", title: "Article 154 – Executive Power of State (राज्य की कार्यपालिका शक्ति)" };
  }

  // Who Appoints Governor (राष्ट्रपति द्वारा)
  if (/नियुक्ति कौन करता|नियुक्ति करता है|नियुक्ति कोन करता/.test(qStem) && /राष्ट्रपति/.test(ans)) {
    return { key: "who_appoints_governor", title: "Governor Appointment Authority – President of India (राज्यपाल की नियुक्ति राष्ट्रपति द्वारा की जाती है)" };
  }

  // Art 155: Appointment of Governor (Article number / Warrant under hand & seal)
  if (/155\b|राज्यपाल की नियुक्ति|वारंट|अधिपत्र/.test(full) && (/155/.test(ans) || /हस्ताक्षर और मुद्रा सहित अधिपत्र/.test(qStem) || /वारंट/.test(qStem))) {
    return { key: "art_155", title: "Article 155 – Appointment of Governor (अनुच्छेद 155 - अधिपत्र / वारंट)" };
  }

  // Art 156: Tenure & Pleasure of President vs Resignation
  if (/156\b|कार्यकाल|पदावधि|प्रसादपर्यन्त|त्यागपत्र/.test(full)) {
    if (/त्यागपत्र|संबोधित/.test(qStem) || /राष्ट्रपति को संबोधित/.test(ans)) {
      return { key: "art_156_resignation", title: "Article 156(2) – Resignation of Governor (राष्ट्रपति को त्यागपत्र)" };
    }
    if (/प्रसादपर्यन्त/.test(qStem) || /प्रसाद-पर्यन्त/.test(ans)) {
      return { key: "art_156_pleasure", title: "Article 156(1) – Pleasure of President (राष्ट्रपति के प्रसादपर्यन्त)" };
    }
    if (/सामान्य कार्यकाल|5 वर्ष|कार्यकाल से संबंधित/.test(full)) {
      return { key: "art_156_tenure", title: "Article 156(3) – 5-Year Term of Office (राज्यपाल का 5 वर्ष का कार्यकाल)" };
    }
  }

  // Art 157: Qualifications (35 years, Indian citizen)
  if (/157\b|योग्यता|अहर्ता|35 वर्ष/.test(full) && (/157/.test(ans) || /योग्यता/.test(qStem) || /35 वर्ष/.test(ans) || /अहर्ता/.test(qStem))) {
    return { key: "art_157", title: "Article 157 – Qualifications for Governor (35 वर्ष की आयु एवं नागरिकता)" };
  }

  // Art 158: Conditions of Office / Salary / Emoluments
  if (/158\b|पद के लिए शर्तें|संसद का सदस्य नहीं|वेतन|भत्ते|परिलब्धियां/.test(full) && (/158/.test(ans) || /शर्तें/.test(qStem) || /वेतन/.test(qStem))) {
    return { key: "art_158", title: "Article 158 – Conditions of Governor's Office & Emoluments (पद की शर्तें एवं परिलब्धियां)" };
  }

  // Oath of Ministers under Art 164(3) (12524)
  if (/शपथ/.test(qStem) && /164/.test(ans)) {
    return { key: "oath_ministers_164_3", title: "Article 164(3) – Oath of Ministers Administered by Governor (मंत्रियों को राज्यपाल द्वारा शपथ)" };
  }

  // Dignitaries Taking Oath Before Governor (12588)
  if (/शपथ लेता है|शपथ लेते हैं/.test(qStem) && /मानवाधिकार|लोकायुक्त/.test(full)) {
    return { key: "oath_before_gov_dignitaries", title: "Dignitaries Taking Oath Before Governor (लोकायुक्त एवं SHRC अध्यक्ष की शपथ)" };
  }

  // Art 159: Oath / Affirmation of Governor
  if (/शपथ|प्रतिज्ञान/.test(qStem) || (/159\b/.test(full) && /शपथ/.test(full))) {
    return { key: "art_159", title: "Article 159 – Oath of Governor (हाईकोर्ट के मुख्य न्यायाधीश द्वारा शपथ)" };
  }

  // Art 160: Contingencies
  if (/160\b|आकस्मिकता/.test(full)) {
    return { key: "art_160", title: "Article 160 – Discharge of Functions in Certain Contingencies (आकस्मिकताओं में कृत्य)" };
  }

  // Art 161: Pardoning Power
  if (/161\b|क्षमादान|दंडादेश|निलंबन|परिहार|लघुकरण/.test(full) && (/161/.test(ans) || /क्षमा/.test(qStem) || /दंडादेश/.test(qStem))) {
    return { key: "art_161", title: "Article 161 – Governor's Pardoning Power (क्षमादान की शक्ति)" };
  }

  // Art 163: Council of Ministers & Discretionary Powers
  if (/163\b|विवेकाधीन शक्तियां|स्वविवेक|सहायता और सलाह/.test(full)) {
    return { key: "art_163", title: "Article 163 – Council of Ministers & Discretionary Powers (मंत्रिपरिषद एवं स्वविवेकी शक्तियां)" };
  }

  // 7th Amendment: Two or more states governor
  if (/दो या अधिक राज्यों|दो या दो से अधिक राज्यों/.test(full) && (/सातवां|सातवाँ|7वां|7वाँ/.test(ans) || /संविधान संशोधन/.test(qStem))) {
    if (/धारा|section/.test(qStem) || /धारा-6/.test(ans)) {
      return { key: "7th_amend_section_6", title: "7th Amendment 1956 – Section 6 (एक व्यक्ति दो या अधिक राज्यों का राज्यपाल - धारा 6)" };
    }
    return { key: "7th_amend_two_states", title: "7th Amendment 1956 – One Governor for Two or More States (एक व्यक्ति दो या अधिक राज्यों का राज्यपाल)" };
  }

  // Art 164: Appointment of CM & Ministers
  if (/164\b|मुख्यमंत्री की नियुक्ति|मंत्रियों की नियुक्ति|मंत्रिपरिषद की नियुक्ति/.test(full) && (/164/.test(ans) || /मुख्यमंत्री की नियुक्ति/.test(qStem) || /मंत्रियों की नियुक्ति/.test(qStem) || /मंत्रिपरिषद/.test(qStem))) {
    if (/किसकी सलाह पर|परामर्श|मंत्रियों की नियुक्ति/.test(qStem)) {
      return { key: "art_164_ministers_advice", title: "Article 164(1) – Ministers Appointment on CM's Advice (मुख्यमंत्री की सलाह पर मंत्रियों की नियुक्ति)" };
    }
    return { key: "art_164_cm_appointment", title: "Article 164(1) – CM Appointment by Governor (राज्यपाल द्वारा मुख्यमंत्री की नियुक्ति)" };
  }

  // Art 165: Advocate General Appointment
  if (/165\b|महाधिवक्ता/.test(full) && (/165/.test(ans) || /महाधिवक्ता/.test(qStem))) {
    return { key: "art_165", title: "Article 165 – Appointment of Advocate General (महाधिवक्ता की नियुक्ति)" };
  }

  // Art 166: Conduct of Government Business
  if (/166\b|कार्य संचालन|राज्यपाल के नाम से/.test(full) && (/166/.test(ans) || /नाम से/.test(qStem))) {
    return { key: "art_166", title: "Article 166 – Conduct of Business of Government (राज्य की समस्त कार्यपालिका कार्रवाई राज्यपाल के नाम से)" };
  }

  // Art 167: Duties of Chief Minister
  if (/167\b|मुख्यमंत्री का कर्तव्य|सूचना देना|जानकारी मांगना/.test(full) && (/167/.test(ans) || /सूचना/.test(qStem) || /कर्तव्य/.test(qStem))) {
    return { key: "art_167", title: "Article 167 – CM's Duties to Furnish Information to Governor (राज्यपाल को सूचना देने का CM का कर्तव्य)" };
  }

  // Art 174: Sessions, Prorogation, Dissolution
  if (/174\b|सत्राहूत|सत्रावसान|विघटन|विधानसभा को भंग/.test(full)) {
    return { key: "art_174", title: "Article 174 – Sessions, Prorogation & Dissolution of Assembly (विधानसभा सत्राहूत/सत्रावसान/विघटन)" };
  }

  // Art 175-176: Address & Messages
  if (/175\b|176\b|विशेष अभिभाषण|संबोधन करने का अधिकार/.test(full)) {
    return { key: "art_175_176", title: "Articles 175-176 – Governor's Right to Address & Special Address (राज्यपाल का विशेष अभिभाषण)" };
  }

  // Art 188 / Protem Speaker
  if (/188\b|प्रोटेम स्पीकर|विधानसभा सदस्यों को शपथ/.test(full)) {
    return { key: "art_188_protem", title: "Article 188 / Protem Speaker – Oath to Assembly Members (विधायकों को शपथ / प्रोटेम स्पीकर)" };
  }

  // Art 192: Disqualification of Members
  if (/192\b|निर्हरता|अयोग्यता|निर्वाचन आयोग की राय/.test(full)) {
    return { key: "art_192", title: "Article 192 – Disqualification of Assembly Members (निर्वाचन आयोग के परामर्श से विधायकों की अयोग्यता)" };
  }

  // Art 200: Assent to Bills / Reservation for President
  if (/200\b|विधेयक पर अनुमति|विचारार्थ आरक्षित|पुनर्विचार/.test(full)) {
    if (/राष्ट्रपति के विचारार्थ|आरक्षित/.test(qStem) || /राष्ट्रपति के विचारार्थ/.test(ans)) {
      return { key: "art_200_reserved", title: "Article 200 – Reservation of Bills for President (राष्ट्रपति के विचारार्थ विधेयक आरक्षित रखना)" };
    }
    return { key: "art_200_assent", title: "Article 200 – Assent to State Bills (राज्य विधेयकों पर अनुमति / पुनर्विचार)" };
  }

  // Art 213: Ordinance Power
  if (/213\b|अध्यादेश|ordinance/.test(full)) {
    if (/6 सप्ताह|6 माह|सप्ताह|अधिकतम अवधि/.test(full)) {
      return { key: "art_213_duration", title: "Article 213 – Ordinance Validity & Duration (अध्यादेश की अधिकतम अवधि - 6 सप्ताह/6 माह)" };
    }
    return { key: "art_213_power", title: "Article 213 – Ordinance Promulgation Power (विश्रांतिकाल में राज्यपाल की अध्यादेश शक्ति)" };
  }

  // Constitutional Head of State (संवैधानिक मुखिया)
  if (/संवैधानिक मुखिया|राज्य का कार्यकारी अध्यक्ष|राज्य का प्रथम नागरिक/.test(qStem) && /राज्यपाल/.test(ans)) {
    return { key: "constitutional_head", title: "Constitutional Head of State (राजस्थान राज्य का संवैधानिक मुखिया - राज्यपाल)" };
  }

  // Rajasthan - First Governor Gurumukh Nihal Singh
  if (/गुरुमुख निहाल सिंह|प्रथम राज्यपाल|पहला राज्यपाल/.test(full)) {
    if (/कालक्रमानुसार व्यवस्थित|कालक्रम/.test(qStem)) {
      return { key: `chronology_${q.id}`, title: "Rajasthan Governors – Chronological Ordering (राज्यपालों का कालक्रम)" };
    }
    return { key: "first_governor_gurumukh", title: "Rajasthan – First Governor (गुरुमुख निहाल सिंह - 1 Nov 1956 / 25 Oct 1956)" };
  }

  // Rajasthan - 7th Constitutional Amendment & Abolition of Rajpramukh
  if (/राजप्रमुख संस्था का लोप|राजप्रमुख संस्था समाप्त|7वाँ सांविधानिक संशोधन|7वां संविधान संशोधन/.test(full)) {
    return { key: "rajpramukh_abolition", title: "7th Amendment 1956 – Abolition of Rajpramukh (राजप्रमुख पद की समाप्ति एवं राज्यपाल पद का सृजन)" };
  }

  // Rajasthan - Additional Charge (स्वरूप सिंह)
  if (/अतिरिक्त कार्यभार|सबसे पहले राजस्थान के राज्यपाल का अतिरिक्त कार्यभार|स्वरूप सिंह/.test(full)) {
    return { key: "additional_charge_swaroop", title: "Rajasthan – First Governor with Additional Charge (स्वरूप सिंह - 1991)" };
  }

  // Rajasthan - President Rule (356) specific facts
  if (/राष्ट्रपति शासन|356/.test(full)) {
    if (/कितनी बार|चार बार/.test(full) && (/चार बार/.test(ans) || /4/.test(ans))) {
      return { key: "pres_rule_count_4", title: "Rajasthan – Total Times President's Rule Imposed (चार बार: 1967, 1977, 1980, 1992)" };
    }
    if (/पहली बार.*राज्यपाल|पहला राष्ट्रपति शासन.*राज्यपाल|संपूर्णानंद/.test(full) && /संपूर्णानंद/.test(ans)) {
      return { key: "pres_rule_1st_sampurnanand", title: "Rajasthan 1st President's Rule 1967 – Governor (डॉ. संपूर्णानंद)" };
    }
    if (/दूसरी बार.*1977|वेदपाल त्यागी/.test(full)) {
      return { key: "pres_rule_2nd_vedpal", title: "Rajasthan 2nd President's Rule 1977 – Governor (वेदपाल त्यागी)" };
    }
  // Multi-statement President rule dates/duration (e.g. 12550)
  if (/पहला राष्ट्रपति शासन.*दूसरा राष्ट्रपति शासन.*तीसरा.*चौथा|13-03-1967/.test(full)) {
    return { key: "pres_rule_exact_dates_statement", title: "President's Rule – Exact Dates & Durations Statement Question" };
  }

  // Rajasthan - President Rule under Raghukul Tilak (imposed & revoked)
  if (/उद्घोषित भी किया गया और वापस भी लिया गया|लगाने और हटाने की उद्घोषणा|वापस लेने की उद्घोषणा दो अवसरों/.test(full) ||
      (/रघुकुल तिलक/.test(ans) && /राष्ट्रपति-शासन|राष्ट्रपति शासन/.test(full))) {
    return { key: "pres_rule_raghukul", title: "Rajasthan 3rd President's Rule 1980 – Imposed & Revoked under Raghukul Tilak" };
  }
    if (/चौथी बार.*1992|आखिरी बार.*राज्यपाल|चेन्ना रेड्डी/.test(full) && /चेन्ना रेड्डी/.test(ans)) {
      return { key: "pres_rule_4th_chenna", title: "Rajasthan 4th President's Rule 1992 – Governor (एम. चेन्ना रेड्डी)" };
    }
    if (/किन वर्षों में|चारों वर्षों/.test(full)) {
      return { key: "pres_rule_all_years", title: "Rajasthan – President's Rule Imposition Years (1967, 1977, 1980, 1992)" };
    }
  }

  // Rajasthan - Female Governors
  if (/महिला राज्यपाल|प्रतिभा पाटिल|प्रभा राव|मार्ग्रेट अल्वा/.test(full) && /महिला/.test(full)) {
    return { key: "female_governors", title: "Rajasthan – Female Governors (प्रतिभा पाटिल, प्रभा राव, मार्ग्रेट अल्वा)" };
  }

  // Rajasthan - Governors who Died in Office
  if (/पद पर रहते हुए मृत्यु|कार्यकाल के दौरान मृत्यु|दरबारा सिंह|निर्मल चंद जैन|शैलेंद्र कुमार सिंह/.test(full)) {
    return { key: "died_in_office", title: "Rajasthan – Governors Who Died in Office (दरबारा सिंह, निर्मल चंद जैन, एस.के. सिंह, प्रभा राव)" };
  }

  // Rajasthan - Acting Governors (जगत नारायण, के.डी. शर्मा, पी.के. बनर्जी)
  if (/कार्यवाहक राज्यपाल|जगत नारायण/.test(full)) {
    return { key: "acting_governors", title: "Rajasthan – Acting Governors (प्रथम कार्यवाहक - जगत नारायण)" };
  }

  // Rajasthan - Governor who was RPSC Member (रघुकुल तिलक)
  if (/rpsc के सदस्य|rpsc सदस्य.*राज्यपाल/.test(full) && /रघुकुल तिलक/.test(full)) {
    return { key: "rpsc_member_raghukul", title: "Rajasthan – Governor Who was Earlier RPSC Member (रघुकुल तिलक)" };
  }

  // Rajasthan - Governor who was Lok Sabha Speaker (हुकम सिंह, बलिराम भगत)
  if (/लोकसभा अध्यक्ष|स्पीकर.*राज्यपाल/.test(full)) {
    return { key: "lok_sabha_speaker_gov", title: "Rajasthan – Governors Who Served as Lok Sabha Speaker (हुकम सिंह, बलिराम भगत)" };
  }

  // Chancellor Role (कुलाधिपति)
  if (/कुलाधिपति|chancellor|विश्वविद्यालयों के कुलपति/.test(full)) {
    return { key: "chancellor_role", title: "Governor's Role – Chancellor of State Universities (राज्य विश्वविद्यालयों के कुलाधिपति)" };
  }

  // Appointments made by Governor vs NOT made by Governor
  if (/किसकी नियुक्ति राज्यपाल द्वारा नहीं की जाती|राज्यपाल द्वारा नियुक्त नहीं किया जाता|राज्यपाल द्वारा नियुक्त नहीं किए जाते/.test(qStem)) {
    if (/उच्च न्यायालय के न्यायाधीश|मुख्य न्यायाधीश/.test(ans)) {
      return { key: "not_appointed_hc_judges", title: "Appointment Exception – High Court Judges (नियुक्ति राष्ट्रपति द्वारा, राज्यपाल द्वारा नहीं)" };
    }
    if (/राज्य पुलिस महानिदेशक/.test(ans)) {
      return { key: "not_appointed_dgp", title: "Appointment Exception – State DGP (नियुक्ति राज्य सरकार/UPSC पैनल द्वारा)" };
    }
    return { key: `not_appointed_other_${q.id}`, title: "Appointments NOT made by Governor – Specific Post" };
  }

  // Appointed by Governor but CANNOT be removed by Governor
  if (/नियुक्त किए जाते हैं, लेकिन उन्हें राज्यपाल द्वारा उनके पद से नहीं हटाया जा सकता|हटाया नहीं जा सकता/.test(qStem)) {
    return { key: "appointed_not_removed_by_gov", title: "Officers Appointed by Governor but Removed by President/Procedure (SEC, RPSC Members)" };
  }

  // Statutory bodies patron/head (Red Cross, WZCC, Sainik Kalyan)
  if (/रेडक्रॉस|सैनिक कल्याण|पश्चिमी क्षेत्र सांस्कृतिक केंद्र|wzcc/.test(full)) {
    return { key: "ex_officio_societies", title: "Governor Ex-Officio Head – Red Cross, WZCC Udaipur & Sainik Kalyan Board" };
  }

  // Recent Governors Specific Statements (कलराज मिश्र, हरिभाऊ बागड़े)
  if (/कलराज मिश्र/.test(qStem)) {
    return { key: `kalraj_mishra_${q.id}`, title: "Rajasthan Governor – Kalraj Mishra Specific Question" };
  }
  if (/हरिभाऊ.*बागड़े/.test(qStem)) {
    return { key: `haribhau_bagade_${q.id}`, title: "Rajasthan Governor – Haribhau Kisanrao Bagade Specific Question" };
  }

  // Match / Pair questions (सुमेलित कीजिए / सही सुमेलित नहीं है)
  if (/सुमेलित नहीं है|सही सुमेलित नहीं|सुमेलित कीजिए/.test(qStem)) {
    return { key: `matching_question_${q.id}`, title: "Analytical Matching Question – Governor Articles/Roles" };
  }

  // Specific Multi-statement Analytical Questions
  if (/निम्नलिखित कथनों पर विचार कीजिए|नीचे दो कथन दिए गए हैं|अभिकथन/.test(qStem)) {
    return { key: `statement_analytical_${q.id}`, title: "Statement-Reason / Multi-Statement Analytical Question" };
  }

  // Fallback: Group by specific core stem + answer
  return { key: `misc_fact_${cleanStemText(q.question).slice(0, 30)}_${cleanStemText(q.answer)}`, title: `Specific Fact: ${q.question.slice(0, 45)}...` };
}

// Assign facts to all processed questions
processed.forEach((q) => {
  const f = assignFact(q);
  q.factKey = f.key;
  q.factTitle = f.title;
});

// Group by factKey
const factGroups = new Map<string, ProcessedQuestion[]>();
processed.forEach((q) => {
  if (!factGroups.has(q.factKey)) factGroups.set(q.factKey, []);
  factGroups.get(q.factKey)!.push(q);
});

// Select representative per fact
const retainedList: ProcessedQuestion[] = [];
const exactDuplicatesList: {
  stem: string;
  allIds: number[];
  retainedId: number;
  removedIds: number[];
}[] = [];

const semanticDuplicatesList: {
  factTitle: string;
  allIds: number[];
  retainedId: number;
  removedIds: number[];
  reason: string;
}[] = [];

// Track already recorded exact dup IDs so we don't double count
const recordedExactDupIds = new Set<number>();

exactDupGroups.forEach((group, stem) => {
  if (group.length > 1) {
    // Sort by score
    group.sort((a, b) => b.score - a.score);
    const retained = group[0];
    const removed = group.slice(1);
    exactDuplicatesList.push({
      stem: group[0].question,
      allIds: group.map((x) => x.id),
      retainedId: retained.id,
      removedIds: removed.map((x) => x.id),
    });
    removed.forEach((x) => recordedExactDupIds.add(x.id));
  }
});

factGroups.forEach((group, factKey) => {
  // First filter out defective questions
  const validGroup = group.filter((q) => !q.defectReason);

  if (validGroup.length === 0) {
    // All questions in this group are defective
    return;
  }

  // Sort by quality score (highest first: genuine PYQ, clean options, good explanation, recent exam)
  validGroup.sort((a, b) => b.score - a.score);

  const best = validGroup[0];
  retainedList.push(best);

  if (group.length > 1) {
    const redundant = group.filter((q) => q.id !== best.id);
    const semDupRemoved = redundant.filter((q) => !recordedExactDupIds.has(q.id) && !q.defectReason);

    if (semDupRemoved.length > 0) {
      semanticDuplicatesList.push({
        factTitle: best.factTitle,
        allIds: group.map((x) => x.id),
        retainedId: best.id,
        removedIds: semDupRemoved.map((x) => x.id),
        reason: `Tested the exact same fact/information point. Retained ID ${best.id} (${best.exam || "PYQ"}) due to superior exam accreditation and phrasing.`,
      });
    }
  }
});

// Final counts
const totalOriginal = rawData.length;
const totalExactDups = exactDuplicatesList.reduce((acc, x) => acc + x.removedIds.length, 0);
const totalDefective = defectiveList.length;
const totalSemanticDups = semanticDuplicatesList.reduce((acc, x) => acc + x.removedIds.length, 0);
const totalRetained = retainedList.length;

console.log("\n==================================================");
console.log("RE-AUDIT SUMMARY (46_राज्यपाल.json)");
console.log("==================================================");
console.log(`Original questions: ${totalOriginal}`);
console.log(`Exact Duplicates removed: ${totalExactDups}`);
console.log(`Defective / Corrupted removed: ${totalDefective}`);
console.log(`Semantic Duplicates removed: ${totalSemanticDups}`);
console.log(`Retained Unique High-Quality: ${totalRetained}`);
console.log(`Checksum (Exact + Defective + Semantic + Retained): ${totalExactDups + totalDefective + totalSemanticDups + totalRetained} (Expected: ${totalOriginal})`);

console.log("\n--- EXACT DUPLICATE LIST ---");
exactDuplicatesList.forEach((ed, idx) => {
  console.log(`[${idx + 1}] Duplicate Question: "${ed.stem}"`);
  console.log(`    All IDs: [${ed.allIds.join(", ")}]`);
  console.log(`    Retained ID: ${ed.retainedId}`);
  console.log(`    Removed IDs: [${ed.removedIds.join(", ")}]`);
});

console.log("\n--- DEFECTIVE / CORRUPTED QUESTIONS ---");
defectiveList.forEach((d, idx) => {
  console.log(`[${idx + 1}] ID ${d.id}: Reason = ${d.reason}`);
  console.log(`    Q: "${d.question}"`);
});

console.log("\n--- SEMANTIC DUPLICATE / FACT CLUSTERS ---");
semanticDuplicatesList.forEach((sd, idx) => {
  console.log(`[${idx + 1}] Fact: ${sd.factTitle}`);
  console.log(`    All Related IDs: [${sd.allIds.join(", ")}]`);
  console.log(`    Retained ID: ${sd.retainedId}`);
  console.log(`    Removed IDs: [${sd.removedIds.join(", ")}]`);
  console.log(`    Reason: ${sd.reason}`);
});

console.log("\n--- RETAINED QUESTION IDS (TOTAL: " + totalRetained + ") ---");
console.log(JSON.stringify(retainedList.map((q) => q.id).sort((a, b) => a - b)));
