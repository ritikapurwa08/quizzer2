import fs from "fs";
import path from "path";

interface RawQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
  subject?: string;
}

interface AuditedQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
  exam?: string;
  explanation?: string;
  subject?: string;
  factCluster: string;
  factSubKey: string;
  isPYQ: boolean;
  qualityScore: number;
  auditIssues: string[];
  repaired: boolean;
}

const ROOT_DIR = path.resolve(__dirname, "../..");
const XDATA_DIR = path.join(ROOT_DIR, "src/xdata");
const RG_GOV_PATH = path.join(XDATA_DIR, "topics/rajasthan_gyan/46_राज्यपाल.json");
const CLEAN_SORTED_PATH = path.join(XDATA_DIR, "rajasthan_gk_india_gk_clean_sorted.json");

function cleanStem(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^\u0900-\u097Fa-z0-9]/g, "")
    .trim();
}

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

function normalizeStem(text: string): string {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[।,?!;:""''()[\]{}|/\\_~`@#$%^&*+=<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
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

// Extract fact cluster based on constitutional articles, Rajasthan-specific facts, commissions, etc.
function extractFactCluster(q: RawQuestion): { cluster: string; subKey: string } {
  const fullText = (q.question + " " + (q.explanation || "") + " " + q.options.join(" ")).toLowerCase();
  const qStem = q.question.toLowerCase();
  const ans = (q.answer || "").toLowerCase();

  // 1. Specific Articles
  if (/अनुच्छेद\s*153\b|article\s*153\b|प्रत्येक राज्य के लिए एक राज्यपाल/.test(fullText)) {
    return { cluster: "Article 153 – Office of Governor", subKey: "art_153" };
  }
  if (/अनुच्छेद\s*154\b|article\s*154\b|कार्यपालिका शक्ति राज्यपाल में निहित/.test(fullText)) {
    return { cluster: "Article 154 – Executive Power of State", subKey: "art_154" };
  }
  if (/अनुच्छेद\s*155\b|article\s*155\b|राज्यपाल की नियुक्ति|वारंट|हस्ताक्षर और मुद्रा सहित अधिपत्र/.test(fullText) && 
      (/155/.test(ans) || /नियुक्ति/.test(qStem) || /राष्ट्रपति द्वारा/.test(ans) || /वारंट/.test(qStem))) {
    return { cluster: "Article 155 – Appointment of Governor", subKey: "art_155" };
  }
  if (/अनुच्छेद\s*156\b|article\s*156\b|पदावधि|कार्यकाल|प्रसादपर्यन्त|त्यागपत्र/.test(fullText) &&
      (/156/.test(ans) || /कार्यकाल/.test(qStem) || /पदावधि/.test(qStem) || /प्रसादपर्यन्त/.test(qStem) || /त्यागपत्र/.test(qStem))) {
    // subkey: distinguish tenure length vs pleasure of president vs resignation
    const sub = /त्यागपत्र/.test(qStem) ? "resignation" : /प्रसादपर्यन्त/.test(qStem) ? "pleasure" : "tenure_general";
    return { cluster: "Article 156 – Tenure & Term of Office", subKey: `art_156_${sub}` };
  }
  if (/अनुच्छेद\s*157\b|article\s*157\b|योग्यता|अहर्ता|35 वर्ष/.test(fullText) && (/157/.test(ans) || /योग्यता/.test(qStem) || /35 वर्ष/.test(ans) || /अहर्ता/.test(qStem))) {
    return { cluster: "Article 157 – Qualifications for Appointment", subKey: "art_157" };
  }
  if (/अनुच्छेद\s*158\b|article\s*158\b|शर्तें|वेतन|भत्ते|संसद का सदस्य नहीं/.test(fullText) && (/158/.test(ans) || /शर्तें/.test(qStem) || /वेतन/.test(qStem))) {
    return { cluster: "Article 158 – Conditions of Governor's Office", subKey: "art_158" };
  }
  if (/अनुच्छेद\s*159\b|article\s*159\b|शपथ|प्रतिज्ञान|उच्च न्यायालय के मुख्य न्यायाधीश/.test(fullText) &&
      (/159/.test(ans) || /शपथ/.test(qStem) || /मुख्य न्यायाधीश/.test(ans) || /प्रतिज्ञान/.test(qStem))) {
    return { cluster: "Article 159 – Oath / Affirmation", subKey: "art_159" };
  }
  if (/अनुच्छेद\s*160\b|article\s*160\b|आकस्मिकता/.test(fullText)) {
    return { cluster: "Article 160 – Discharge of Functions in Contingencies", subKey: "art_160" };
  }
  if (/अनुच्छेद\s*161\b|article\s*161\b|क्षमादान|दंडादेश|निलंबन|परिहार|लघुकरण/.test(fullText) &&
      (/161/.test(ans) || /क्षमा/.test(qStem) || /दंडादेश/.test(qStem) || /माफी/.test(qStem))) {
    return { cluster: "Article 161 – Pardoning Power", subKey: "art_161" };
  }
  if (/अनुच्छेद\s*163\b|article\s*163\b|विवेकाधीन|मंत्रिपरिषद की सहायता और सलाह|स्वविवेक/.test(fullText) &&
      (/163/.test(ans) || /विवेकाधीन/.test(qStem) || /स्वविवेक/.test(qStem) || /सहायता और सलाह/.test(qStem))) {
    return { cluster: "Article 163 – Discretionary Powers & CoM", subKey: "art_163" };
  }
  if (/अनुच्छेद\s*164\b|article\s*164\b|मुख्यमंत्री की नियुक्ति|मंत्रियों की नियुक्ति/.test(fullText) &&
      (/164/.test(ans) || /मुख्यमंत्री की नियुक्ति/.test(qStem) || /मंत्रियों की नियुक्ति/.test(qStem))) {
    return { cluster: "Article 164 – Appointment of CM & Ministers", subKey: "art_164" };
  }
  if (/अनुच्छेद\s*165\b|article\s*165\b|महाधिवक्ता/.test(fullText)) {
    return { cluster: "Article 165 – Advocate General Appointment", subKey: "art_165" };
  }
  if (/अनुच्छेद\s*166\b|article\s*166\b|कार्य संचालन|राज्यपाल के नाम से/.test(fullText)) {
    return { cluster: "Article 166 – Conduct of Government Business", subKey: "art_166" };
  }
  if (/अनुच्छेद\s*167\b|article\s*167\b|मुख्यमंत्री का कर्तव्य|सूचना देना|जानकारी मांगना/.test(fullText)) {
    return { cluster: "Article 167 – CM Duties to Furnish Information", subKey: "art_167" };
  }
  if (/अनुच्छेद\s*174\b|article\s*174\b|सत्राहूत|सत्रावसान|विघटन|विधानसभा को भंग/.test(fullText)) {
    return { cluster: "Article 174 – Sessions, Prorogation & Dissolution", subKey: "art_174" };
  }
  if (/अनुच्छेद\s*175\b|अनुच्छेद\s*176\b|विशेष अभिभाषण|संबोधन/.test(fullText)) {
    return { cluster: "Articles 175-176 – Governor's Address & Messages", subKey: "art_175_176" };
  }
  if (/अनुच्छेद\s*188\b|प्रोटेम स्पीकर|विधानसभा सदस्यों को शपथ/.test(fullText)) {
    return { cluster: "Protem Speaker & Oath to MLAs", subKey: "protem_oath" };
  }
  if (/अनुच्छेद\s*192\b|निर्हरता|अयोग्यता|निर्वाचन आयोग की राय/.test(fullText)) {
    return { cluster: "Article 192 – Disqualification of Members", subKey: "art_192" };
  }
  if (/अनुच्छेद\s*200\b|article\s*200\b|विधेयक पर अनुमति|राष्ट्रपति के विचारार्थ आरक्षित|पुनर्विचार/.test(fullText)) {
    const sub = /आरक्षित/.test(qStem) ? "reserved_president" : "assent_general";
    return { cluster: "Article 200 – Assent to Bills / Reservation", subKey: `art_200_${sub}` };
  }
  if (/अनुच्छेद\s*201\b|article\s*201\b/.test(fullText)) {
    return { cluster: "Article 201 – Bills Reserved for President", subKey: "art_201" };
  }
  if (/अनुच्छेद\s*213\b|article\s*213\b|अध्यादेश|ordinance|6 सप्ताह|6 माह/.test(fullText)) {
    const sub = /सप्ताह|माह|अवधि/.test(qStem) ? "duration" : "power";
    return { cluster: "Article 213 – Ordinance Making Power", subKey: `art_213_${sub}` };
  }

  // 2. Rajasthan Specific Governors
  if (/गुरुमुख निहाल सिंह|प्रथम राज्यपाल|पहला राज्यपाल/.test(fullText)) {
    return { cluster: "Rajasthan – First Governor (Gurumukh Nihal Singh)", subKey: "first_gov_gurumukh" };
  }
  if (/पद पर रहते हुए मृत्यु|कार्यकाल के दौरान मृत्यु|निर्मल चंद जैन|दरबारा सिंह|शैलेंद्र कुमार सिंह|प्रभा राव/.test(fullText) &&
      /मृत्यु/.test(fullText)) {
    return { cluster: "Rajasthan – Governors Who Died in Office", subKey: "died_in_office" };
  }
  if (/महिला राज्यपाल|प्रतिभा पाटिल|प्रभा राव|मार्ग्रेट अल्वा/.test(fullText) && /महिला/.test(fullText)) {
    return { cluster: "Rajasthan – Female Governors", subKey: "female_governors" };
  }
  if (/त्यागपत्र|इस्तीफा/.test(fullText) && /मदनलाल खुराना|प्रतिभा पाटिल|राजस्थान/.test(fullText)) {
    return { cluster: "Rajasthan – Governors Who Resigned", subKey: "gov_resigned" };
  }
  if (/राष्ट्रपति शासन|356|संपूर्णानंद|वेदपाल त्यागी|रघुकुल तिलक|एम. चेन्ना रेड्डी|बलिराम भगत/.test(fullText)) {
    if (/उद्घोषित भी किया गया और वापस भी लिया गया|एकमात्र राज्यपाल/.test(fullText)) {
      return { cluster: "Rajasthan – President Rule: Imposed & Revoked (Raghukul Tilak)", subKey: "pres_rule_raghukul" };
    }
    if (/कालक्रमानुसार|चार बार|पहला राष्ट्रपति शासन|दूसरा|तीसरा|चौथा/.test(fullText)) {
      return { cluster: "Rajasthan – President Rule & Governors Timeline", subKey: "pres_rule_timeline" };
    }
    return { cluster: "Rajasthan – President Rule & Governor Role", subKey: "pres_rule_general" };
  }
  if (/कालक्रमानुसार व्यवस्थित|सही कालक्रम|क्रम/.test(qStem) && /राज्यपालों/.test(qStem)) {
    return { cluster: "Rajasthan – Chronological Order of Governors", subKey: `chronology_${ans.slice(0, 10)}` };
  }
  if (/आरपीएससी|rpsc के सदस्य|rpsc/.test(fullText) && /रघुकुल तिलक/.test(fullText)) {
    return { cluster: "Rajasthan – Governor Who was RPSC Member (Raghukul Tilak)", subKey: "rpsc_member_gov" };
  }
  if (/लोकसभा अध्यक्ष|स्पीकर/.test(fullText) && /हुकम सिंह|बलिराम भगत/.test(fullText)) {
    return { cluster: "Rajasthan – Governors Who Served as Lok Sabha Speaker", subKey: "lok_sabha_speaker_gov" };
  }
  if (/कार्यवाहक राज्यपाल|चीफ जस्टिस|जगत नारायण/.test(fullText)) {
    return { cluster: "Rajasthan – Acting Governors (कार्यवाहक राज्यपाल)", subKey: "acting_governors" };
  }

  // 3. Ex-officio roles & Commissions
  if (/कुलाधिपति|विश्वविद्यालयों के कुलपति|chancellor/.test(fullText)) {
    return { cluster: "Governor – Chancellor of Universities (कुलाधिपति)", subKey: "chancellor_role" };
  }
  if (/रेडक्रॉस|सैनिक कल्याण|पश्चिमी क्षेत्र सांस्कृतिक केंद्र|उदयपुर/.test(fullText)) {
    return { cluster: "Governor – Ex-officio Patron / Society Roles", subKey: "ex_officio_societies" };
  }
  if (/सरकारिया आयोग|पुंछी आयोग|प्रशासनिक सुधार आयोग|rajmannar/.test(fullText)) {
    return { cluster: "Governor – Commissions & Recommendations (Sarkaria / Punchhi)", subKey: "commissions_gov" };
  }
  if (/लोकायुक्त की नियुक्ति|rpsc अध्यक्ष की नियुक्ति|राज्य चुनाव आयुक्त|राज्य वित्त आयोग/.test(fullText)) {
    return { cluster: "Governor – Statutory & Constitutional Appointments", subKey: "statutory_appointments" };
  }

  // Fallback: Group by core stem keywords + answer
  const coreFact = cleanStem(q.question).slice(0, 30) + "__" + cleanStem(q.answer);
  return { cluster: "Governor – Miscellaneous Constitutional & General Facts", subKey: coreFact };
}

// 1. Load source data
const rgQuestions: RawQuestion[] = JSON.parse(fs.readFileSync(RG_GOV_PATH, "utf8"));
const cleanSortedAll: RawQuestion[] = JSON.parse(fs.readFileSync(CLEAN_SORTED_PATH, "utf8"));

// Filter Governor questions from clean_sorted
const cleanGovQuestions = cleanSortedAll.filter((q) => {
  const qText = q.question || "";
  const ans = q.answer || "";
  const topic = q.topic || "";
  if (q.subject !== "राजस्थान GK" && q.subject !== "India GK") return false;
  if (/राज्यपाल|governor|राजप्रमुख/i.test(qText)) return true;
  if (topic === "राज्य शासन एवं प्रशासन" && /अनुच्छेद\s*(15[3-9]|16[0-7]|20[0-1]|213)/.test(qText + " " + ans)) {
    return true;
  }
  return false;
});

function scoreQuality(q: RawQuestion, hasGoodExplanation: boolean): number {
  let score = 50;
  if (q.exam && !isFakeExam(q.exam)) {
    score += 30;
    if (/rpsc|ras|lecturer|sub inspector|teacher|college/i.test(q.exam)) score += 10;
  }
  if (hasGoodExplanation) score += 15;
  if (q.options && q.options.length === 4) score += 5;
  // Clear question stem bonus (not too short, not overly rambling)
  if (q.question.length >= 30 && q.question.length <= 180) score += 10;
  return score;
}

// ─── EXECUTE AUDIT ON DATASET ────────────────────────────────────────────────
function auditDataset(questions: RawQuestion[], sourceName: string) {
  console.log(`\n======================================================`);
  console.log(`RUNNING AUDIT PIPELINE ON: ${sourceName} (${questions.length} Questions)`);
  console.log(`======================================================`);

  let exactDupCount = 0;
  let invalidWrongCount = 0;
  let ambiguousCount = 0;
  let repairedCount = 0;
  let genuinePyqCount = 0;

  const auditedQuestions: AuditedQuestion[] = [];
  const seenStems = new Set<string>();

  for (const q of questions) {
    const issues: string[] = [];
    const stemNorm = normalizeStem(q.question);

    // 1. Exact Duplicate Stem Check
    if (seenStems.has(stemNorm)) {
      exactDupCount++;
      continue; // drop exact duplicate
    }
    seenStems.add(stemNorm);

    // 2. Minimum length / corruption check
    if (!q.question || q.question.trim().length < 15) {
      ambiguousCount++;
      continue;
    }

    // 3. Options validation
    const rawOpts = q.options || [];
    const cleanOpts = rawOpts.map(cleanOptionText).filter(Boolean);
    if (cleanOpts.length < 4) {
      invalidWrongCount++;
      continue;
    }
    const distinctOpts = new Set(cleanOpts.map((o) => o.toLowerCase()));
    if (distinctOpts.size < 4) {
      invalidWrongCount++;
      continue; // invalid duplicate options
    }

    // 4. Answer Resolution & Repair
    const rawAns = (q.answer || "").trim();
    const cleanAns = cleanOptionText(rawAns);
    let matchedIdx = -1;

    for (let i = 0; i < cleanOpts.length; i++) {
      if (
        cleanOpts[i].toLowerCase() === cleanAns.toLowerCase() ||
        cleanOpts[i].toLowerCase() === rawAns.toLowerCase() ||
        cleanStem(cleanOpts[i]) === cleanStem(cleanAns)
      ) {
        matchedIdx = i;
        break;
      }
    }

    // Option letter repair: e.g. "(अ)" -> option 0
    let wasRepaired = false;
    if (matchedIdx === -1) {
      const letterMatch = rawAns.match(/^[\(\[]?([अबसदa-dA-D1-4])[\)\]]?/);
      if (letterMatch) {
        const l = letterMatch[1].toLowerCase();
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
        if (letterMap[l] !== undefined && letterMap[l] < cleanOpts.length) {
          matchedIdx = letterMap[l];
          wasRepaired = true;
          repairedCount++;
        }
      }
    }

    if (matchedIdx === -1) {
      // Answer could not be matched to any of the 4 options
      invalidWrongCount++;
      continue;
    }

    // Ambiguity check: Question stems like "निम्न में से कौन सा सही है" with no context
    if (q.question.trim().length < 25 && !q.question.includes("राज्यपाल")) {
      ambiguousCount++;
      continue;
    }

    const isPyq = !isFakeExam(q.exam);
    if (isPyq) genuinePyqCount++;

    const hasGoodExp = Boolean(q.explanation && q.explanation.trim().length >= 20);
    const score = scoreQuality(q, hasGoodExp);

    const factInfo = extractFactCluster(q);

    auditedQuestions.push({
      ...q,
      options: cleanOpts,
      answer: cleanOpts[matchedIdx],
      factCluster: factInfo.cluster,
      factSubKey: factInfo.subKey,
      isPYQ: isPyq,
      qualityScore: score,
      auditIssues: issues,
      repaired: wasRepaired,
    });
  }

  // ─── 5. FACT-BASED SEMANTIC DEDUPLICATION ─────────────────────────────────
  // Group by (factCluster + factSubKey)
  // CRITICAL RULE: One information point / fact asked in different wording -> keep only the BEST 1 representative question!
  // BUT distinct facts inside the same cluster (e.g. Art 156 tenure vs Art 156 resignation vs Art 156 pleasure) have distinct subKeys and are preserved!

  const clusters = new Map<string, AuditedQuestion[]>();
  for (const q of auditedQuestions) {
    const key = q.factCluster + ":::" + q.factSubKey;
    if (!clusters.has(key)) {
      clusters.set(key, []);
    }
    clusters.get(key)!.push(q);
  }

  let semanticNearDupCount = 0;
  const retainedQuestions: AuditedQuestion[] = [];
  const factClusterReport: Array<{
    cluster: string;
    original: number;
    retained: number;
    exampleQuestion: string;
  }> = [];

  // Track counts by broad cluster
  const broadClusterStats = new Map<
    string,
    { original: number; retained: number; subfacts: Set<string>; examples: string[] }
  >();

  clusters.forEach((qList, key) => {
    const [clusterName, subKey] = key.split(":::");
    if (!broadClusterStats.has(clusterName)) {
      broadClusterStats.set(clusterName, {
        original: 0,
        retained: 0,
        subfacts: new Set(),
        examples: [],
      });
    }
    const stats = broadClusterStats.get(clusterName)!;
    stats.original += qList.length;

    // Sort by quality score (highest first: genuine PYQ, real exam, clear explanation, clean stem)
    qList.sort((a, b) => b.qualityScore - a.qualityScore);

    // Pick 1 best representative question for this exact fact/information point
    const representative = qList[0];
    retainedQuestions.push(representative);
    stats.retained += 1;
    stats.subfacts.add(subKey);
    if (stats.examples.length === 0) {
      stats.examples.push(representative.question);
    }

    // The rest are semantic / near duplicates
    if (qList.length > 1) {
      semanticNearDupCount += qList.length - 1;
    }
  });

  // Calculate retained genuine PYQs
  const retainedPyqs = retainedQuestions.filter((q) => q.isPYQ).length;

  return {
    totalOriginal: questions.length,
    exactDuplicates: exactDupCount,
    semanticNearDuplicates: semanticNearDupCount,
    invalidWrong: invalidWrongCount,
    ambiguous: ambiguousCount,
    repaired: repairedCount,
    genuinePyqsRetained: retainedPyqs,
    uniqueRetained: retainedQuestions.length,
    broadClusterStats,
    retainedQuestions,
    auditedQuestions,
  };
}

// RUN PILOT ON 46_राज्यपाल.json (the dedicated Topic: राज्यपाल file)
const rgReport = auditDataset(rgQuestions, "46_राज्यपाल.json (Authoritative Topic: राज्यपाल File)");

// Print Report Tables
console.log(`\n======================================================`);
console.log(`PILOT REPORT: 46_राज्यपाल.json`);
console.log(`======================================================\n`);

console.log(`| Metric | Count |`);
console.log(`| :--- | ---: |`);
console.log(`| Original Governor Questions | ${rgReport.totalOriginal} |`);
console.log(`| Exact Duplicates | ${rgReport.exactDuplicates} |`);
console.log(`| Semantic/Near Duplicates | ${rgReport.semanticNearDuplicates} |`);
console.log(`| Invalid/Wrong (Options/Answer mismatch) | ${rgReport.invalidWrong} |`);
console.log(`| Ambiguous / Corrupt | ${rgReport.ambiguous} |`);
console.log(`| Repaired/Corrected (Option prefix / formatting) | ${rgReport.repaired} |`);
console.log(`| Genuine PYQs Retained | ${rgReport.genuinePyqsRetained} |`);
console.log(`| Unique High-Quality Questions Retained | ${rgReport.uniqueRetained} |`);

console.log(`\n======================================================`);
console.log(`FACT CLUSTER REPORT (46_राज्यपाल.json)`);
console.log(`======================================================\n`);

console.log(`| Fact Cluster | Original | Retained | Status / Distinction Preserved |`);
console.log(`| :--- | ---: | ---: | :--- |`);

Array.from(rgReport.broadClusterStats.entries())
  .sort((a, b) => b[1].original - a[1].original)
  .forEach(([cluster, stats]) => {
    const statusNote =
      stats.original > stats.retained
        ? `Merged ${stats.original - stats.retained} duplicate wording(s)`
        : `Unique distinct fact preserved`;
    console.log(`| ${cluster} | ${stats.original} | ${stats.retained} | ${statusNote} |`);
  });

// ALSO AUDIT THE 280 GOVERNOR QUESTIONS IN clean_sorted (Master 20,836 Corpus)
console.log(`\n\n======================================================`);
const cleanGovReport = auditDataset(cleanGovQuestions, "rajasthan_gk_india_gk_clean_sorted.json (Governor subset from 20,836 Corpus)");

console.log(`\n======================================================`);
console.log(`PILOT REPORT: Governor Subset from 20,836 Corpus`);
console.log(`======================================================\n`);

console.log(`| Metric | Count |`);
console.log(`| :--- | ---: |`);
console.log(`| Original Governor Questions | ${cleanGovReport.totalOriginal} |`);
console.log(`| Exact Duplicates | ${cleanGovReport.exactDuplicates} |`);
console.log(`| Semantic/Near Duplicates | ${cleanGovReport.semanticNearDuplicates} |`);
console.log(`| Invalid/Wrong (Options/Answer mismatch) | ${cleanGovReport.invalidWrong} |`);
console.log(`| Ambiguous / Corrupt | ${cleanGovReport.ambiguous} |`);
console.log(`| Repaired/Corrected (Option prefix / formatting) | ${cleanGovReport.repaired} |`);
console.log(`| Genuine PYQs Retained | ${cleanGovReport.genuinePyqsRetained} |`);
console.log(`| Unique High-Quality Questions Retained | ${cleanGovReport.uniqueRetained} |`);

console.log(`\n======================================================`);
console.log(`FACT CLUSTER REPORT (Governor Subset from 20,836 Corpus)`);
console.log(`======================================================\n`);

console.log(`| Fact Cluster | Original | Retained | Status / Distinction Preserved |`);
console.log(`| :--- | ---: | ---: | :--- |`);

Array.from(cleanGovReport.broadClusterStats.entries())
  .sort((a, b) => b[1].original - a[1].original)
  .forEach(([cluster, stats]) => {
    const statusNote =
      stats.original > stats.retained
        ? `Merged ${stats.original - stats.retained} duplicate wording(s)`
        : `Unique distinct fact preserved`;
    console.log(`| ${cluster} | ${stats.original} | ${stats.retained} | ${statusNote} |`);
  });
