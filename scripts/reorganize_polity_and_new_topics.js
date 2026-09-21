const fs = require("fs");
const path = require("path");

function normalizeText(text) {
  if (!text) return "";
  return text
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

const TOPICS_CONFIG = {
  58: {
    id: 58,
    name: "राजस्थान राज्य प्रशासन",
    englishName: "Rajasthan State Administration",
    slug: "राजस्थान-राज्य-प्रशासन",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  59: {
    id: 59,
    name: "राजस्थान के राज्यपाल",
    englishName: "Governor of Rajasthan",
    slug: "राजस्थान-के-राज्यपाल",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  60: {
    id: 60,
    name: "राजस्थान के मुख्यमंत्री",
    englishName: "Chief Minister of Rajasthan",
    slug: "राजस्थान-के-मुख्यमंत्री",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  61: {
    id: 61,
    name: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल",
    englishName: "Council of Ministers and Cabinet of Rajasthan",
    slug: "राजस्थान-की-मंत्रिपरिषद-एवं-मंत्रिमंडल",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  62: {
    id: 62,
    name: "राजस्थान राज्य विधानमंडल",
    englishName: "Rajasthan State Legislature",
    slug: "राजस्थान-राज्य-विधानमंडल",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  63: {
    id: 63,
    name: "राजस्थान उच्च न्यायालय एवं न्यायपालिका",
    englishName: "Rajasthan High Court and Judiciary",
    slug: "राजस्थान-उच्च-न्यायालय-एवं-न्यायपालिका",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  64: {
    id: 64,
    name: "राजस्थान जिला प्रशासन",
    englishName: "District Administration of Rajasthan",
    slug: "राजस्थान-जिला-प्रशासन",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  65: {
    id: 65,
    name: "राजस्थान पंचायती राज",
    englishName: "Panchayati Raj in Rajasthan",
    slug: "राजस्थान-पंचायती-राज",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  74: {
    id: 74,
    name: "राजस्थान नगरीय स्वशासन एवं नगरपालिका",
    englishName: "Urban Local Governance and Municipalities in Rajasthan",
    slug: "राजस्थान-नगरीय-स्वशासन-एवं-नगरपालिका",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  },
  75: {
    id: 75,
    name: "राजस्थान का बजट एवं आर्थिक समीक्षा",
    englishName: "Rajasthan Budget and Economic Review",
    slug: "राजस्थान-का-बजट-एवं-आर्थिक-समीक्षा",
    subjectSlug: "rajasthan-polity-administration",
    subject: "राजस्थान राजव्यवस्था / प्रशासन"
  }
};

const dddTopicsDir = path.join(__dirname, "..", "data", "ddd", "topics");
const pyqBatchesDir = path.join(__dirname, "..", "src", "xdata", "final_pyq_batches");
const dddJsonPath = path.join(__dirname, "..", "src", "xdata", "ddd.json");

console.log("==================================================");
console.log("  REORGANIZING RAJASTHAN POLITY & NEW TOPICS (58-65, 74, 75)");
console.log("==================================================\n");

// 1. Gather all questions from all sources
const rawPool = [];

// A. From data/ddd/topics/ (topics 58 through 65)
if (fs.existsSync(dddTopicsDir)) {
  const files = fs.readdirSync(dddTopicsDir);
  [58, 59, 60, 61, 62, 63, 64, 65].forEach(id => {
    const pad = String(id).padStart(2, "0");
    const found = files.find(f => f.startsWith(pad + "_"));
    if (found) {
      const content = JSON.parse(fs.readFileSync(path.join(dddTopicsDir, found), "utf8"));
      const list = Array.isArray(content) ? content : (content.questions || []);
      list.forEach(q => {
        rawPool.push({
          source: q.source || "ddd_topic",
          sourceTopic: q.sourceTopic || "",
          question: q.question || q.questionText || "",
          options: q.options || [],
          answer: q.answer !== undefined ? q.answer : q.correctAnswer,
          explanation: q.explanation || "",
          exam: q.exam || q.meta?.exam || null,
          year: q.year || q.meta?.year || null,
          sourceQuestionId: q.id || q.meta?.sourceQuestionId || `q_${rawPool.length}`,
          reference: q.reference || (q.exam ? `📌 PYQ — ${q.exam}${q.year ? ` (${q.year})` : ""}` : undefined),
          type: q.type || "mcq"
        });
      });
    }
  });
}

// B. From final_pyq_batches folders
const relevantFolders = [
  "राजस्थान राज्य प्रशासन",
  "राजस्थान पंचायती राज एवं स्थानीय स्वशासन",
  "राजस्थान राज्य विधानमंडल",
  "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल"
];

relevantFolders.forEach(folder => {
  const fPath = path.join(pyqBatchesDir, folder);
  if (fs.existsSync(fPath)) {
    const bFiles = fs.readdirSync(fPath).filter(f => f.endsWith(".json"));
    bFiles.forEach(file => {
      const bData = JSON.parse(fs.readFileSync(path.join(fPath, file), "utf8"));
      (bData.questions || []).forEach(q => {
        const opts = (q.options || []).map(o => typeof o === "string" ? o : o.text);
        rawPool.push({
          source: "final_pyq_batch",
          sourceTopic: folder,
          question: q.questionText || "",
          options: opts,
          answer: q.correctAnswer,
          explanation: q.explanation || "",
          exam: q.meta?.exam || null,
          year: q.meta?.year || null,
          sourceQuestionId: q.meta?.sourceQuestionId || q.id || `pyq_${rawPool.length}`,
          reference: q.reference,
          type: q.type || "mcq"
        });
      });
    });
  }
});

// C. From ddd.json for topic IDs 58-65 and budget topics
if (fs.existsSync(dddJsonPath)) {
  const dddData = JSON.parse(fs.readFileSync(dddJsonPath, "utf8"));
  dddData.forEach(q => {
    const mId = Number(q.masterTopicId);
    const sTopic = q.sourceTopic || "";
    if ((mId >= 58 && mId <= 65) || sTopic.includes("बजट") || sTopic.includes("आर्थिक समीक्षा") || sTopic.includes("नीतियां")) {
      rawPool.push({
        source: "ddd_json",
        sourceTopic: sTopic,
        question: q.question || "",
        options: q.options || [],
        answer: q.answer,
        explanation: q.explanation || "",
        exam: q.exam || null,
        year: q.year || null,
        sourceQuestionId: q.id || `ddd_${rawPool.length}`,
        type: "mcq"
      });
    }
  });
}

console.log(`Total raw questions collected: ${rawPool.length}`);

// 2. Global deduplication by normalized question text
const uniqueMap = new Map();
rawPool.forEach(q => {
  if (!q.question) return;
  const norm = normalizeText(q.question);
  if (!norm || norm.length < 5) return;

  if (!uniqueMap.has(norm)) {
    uniqueMap.set(norm, { ...q });
  } else {
    const ex = uniqueMap.get(norm);
    if (!ex.explanation && q.explanation) ex.explanation = q.explanation;
    if (!ex.exam && q.exam) ex.exam = q.exam;
    if (!ex.year && q.year) ex.year = q.year;
    if ((!ex.options || ex.options.length < 4) && q.options && q.options.length >= 4) {
      ex.options = q.options;
      ex.answer = q.answer;
    }
  }
});

const uniqueQuestions = Array.from(uniqueMap.values());
console.log(`Unique questions after deduplication: ${uniqueQuestions.length}`);

// 3. Classify into Buckets
const buckets = {
  excluded_india_polity: [],
  75: [], // बजट एवं आर्थिक समीक्षा
  74: [], // नगरीय स्वशासन एवं नगरपालिका
  65: [], // पंचायती राज (ग्रामीण)
  64: [], // जिला प्रशासन
  63: [], // उच्च न्यायालय एवं न्यायपालिका
  62: [], // राज्य विधानमंडल
  61: [], // मंत्रिपरिषद एवं मंत्रिमंडल
  60: [], // मुख्यमंत्री
  59: [], // राज्यपाल
  58: [], // राज्य प्रशासन (कोर)
};

uniqueQuestions.forEach(q => {
  const fullText = (q.question + " " + (q.explanation || "") + " " + (q.sourceTopic || ""));
  const qText = q.question;

  // A. Check for Pure Central / India Polity
  const isPureIndiaPolity = /(भारत के राष्ट्रपति|राष्ट्रपति पद के चुनाव|शपथ लेते समय राज्यसभा|अनुच्छेद 74\(2\)|अनुच्छेद 75\(2\)|अनुच्छेद 75\(3\)|अनुच्छेद 356\(1\)\(क\)|राज्य सभा में सीट के मामले|संघ की कार्यकारी शक्ति|राष्ट्रपति अन्य कोई लाभ|सर्वोच्च न्यायालय ने प्रस्तावना|अनुच्छेद 60 के अनुसार|प्रधानमंत्रियों में से किसने पाकिस्तान|उप-प्रधानमंत्री का पद|संचार का चैनल बनाता है|राष्ट्रपति की पदावधि|उद्देशिका की कौन-सी विशेषता|संसद के दोनों सदनों|लोक सभा के अध्यक्ष|भारत का उपराष्ट्रपति|संसदीय शासन प्रणाली|लोक सभा अध्यक्ष|संसद की मंजूरी|अनुच्छेद 53|अनुच्छेद 54|अनुच्छेद 55|अनुच्छेद 61|अनुच्छेद 72|अनुच्छेद 76|अनुच्छेद 78|उद्देशिका)/i.test(qText) &&
    !/राजस्थान|आरपीएससी|जोधपुर|जयपुर|बरकतुल्लाह|भैरोंसिंह|सुखाड़िया|गुरुमुख|विधानसभा/i.test(qText);

  if (isPureIndiaPolity) {
    buckets.excluded_india_polity.push(q);
    return;
  }

  // B. Topic 75: राजस्थान का बजट एवं आर्थिक समीक्षा
  const isBudgetEco = (q.sourceTopic && (q.sourceTopic.includes("बजट") || q.sourceTopic.includes("आर्थिक समीक्षा") || q.sourceTopic.includes("नीतियां"))) ||
    /बजट 202[0-9]|आर्थिक समीक्षा 202[0-9]|सकल राज्य घरेलू उत्पाद|GSDP|प्रति व्यक्ति आय|लखपति दीदी|लॉजिस्टिक्स नीति|एयरोस्पेस एण्ड डिफेंस|ए\.आई\.\/एम\.एल\. नीति|ग्लोबल कैपेबिलिटी|व्यापार प्रोत्साहन नीति|थोक मूल्य सूचकांक.*राजस्थान|स्थिर मूल्यों पर.*जीएसडीपी|कृषि बजट.*राजस्थान|राजस्थान बजट/i.test(fullText);

  if (isBudgetEco) {
    buckets[75].push(q);
    return;
  }

  // C. Topic 74: राजस्थान नगरीय स्वशासन एवं नगरपालिका
  const isNagarPalika = /नगरपालिका|नगर पालिका|नगर निगम|नगर परिषद|नगरीय स्वशासन|74वां संविधान|74वें संविधान|243[P-Z]|243-[P-Z]|243ZA|243ZG|राजस्थान नगरपालिका अधिनियम|शहरी स्थानीय निकाय|महानगरीय आयोजन|महानगर योजना|राइट टू रिकॉल.*नगर|नगरीय निकाय|नगर परिषदों/i.test(fullText);

  if (isNagarPalika) {
    buckets[74].push(q);
    return;
  }

  // D. Topic 65: राजस्थान पंचायती राज (Rural only)
  const isPanchayat = /पंचायती राज|पंचायत समिति|ग्राम पंचायत|जिला परिषद|ग्राम सभा|73वां संविधान|73वें संविधान|243[A-O]|243-[A-O]|बलवंत राय मेहता|सादिक अली|गिरधारी लाल व्यास|हरलाल सिंह|पेसा|PESA|सरपंच|उपसरपंच|प्रधान.*पंचायत|जिला प्रमुख|ग्राम विकास अधिकारी|ग्राम सेवक|ग्राम पंचायतें/i.test(fullText);

  if (isPanchayat) {
    buckets[65].push(q);
    return;
  }

  // E. Topic 64: राजस्थान जिला प्रशासन
  const isDistrictAdmin = (q.sourceTopic && q.sourceTopic.includes("जिला प्रशासन")) ||
    /जिला प्रशासन|जिला कलेक्टर|जिला मजिस्ट्रेट|उपखंड अधिकारी|तहसीलदार|नायब तहसीलदार|पटवारी|पटवार मंडल|उपखण्ड स्तर|भू-राजस्व अधिनियम|काश्तकारी अधिनियम.*तहसील/i.test(fullText);

  if (isDistrictAdmin && !/उच्च न्यायालय|विधानसभा|राज्यपाल|मुख्यमंत्री/i.test(qText)) {
    buckets[64].push(q);
    return;
  }

  // F. Topic 63: राजस्थान उच्च न्यायालय एवं न्यायपालिका
  const isJudiciary = (q.sourceTopic && q.sourceTopic.includes("उच्च न्यायालय")) ||
    /उच्च न्यायालय|हाईकोर्ट|मुख्य न्यायाधीश|न्यायाधीश|चीफ जस्टिस|न्यायिक अकादमी|ग्राम न्यायालय|लोक अदालत|कमलकांत वर्मा|जयपुर पीठ.*न्यायालय|जोधपुर पीठ|अधीनस्थ न्यायालय|विधिक सेवा प्राधिकरण/i.test(fullText);

  if (isJudiciary && !/राज्यपाल|विधानसभा|मुख्यमंत्री/i.test(qText)) {
    buckets[63].push(q);
    return;
  }

  // G. Topic 62: राजस्थान राज्य विधानमंडल
  const isVidhanSabha = (q.sourceTopic && (q.sourceTopic.includes("विधानमंडल") || q.sourceTopic.includes("विधानसभा"))) ||
    /विधानसभा|विधान सभा|विधानमंडल|विधान परिषद|स्पीकर|विधानसभा अध्यक्ष|प्रोटेम स्पीकर|उपाध्यक्ष.*विधानसभा|सचेतक|विधेयक.*विधानसभा|सदन की बैठक/i.test(fullText);

  if (isVidhanSabha && !/राज्यपाल की अनुमति|राज्यपाल अध्यादेश|मुख्यमंत्री की नियुक्ति/i.test(qText)) {
    buckets[62].push(q);
    return;
  }

  // H. Topic 61: राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल
  const isCabinet = (q.sourceTopic && q.sourceTopic.includes("मंत्रिपरिषद")) ||
    /मंत्रिपरिषद|मंत्रिमंडल|कैबिनेट|मंत्रियों के लिए आचार संहिता|91वां संविधान संशोधन.*मंत्री|मंत्रियों की अधिकतम संख्या|मंत्रियों का उत्तरदायित्व|कैबिनेट सचिवालय/i.test(fullText);

  if (isCabinet && !/राज्यपाल|मुख्यमंत्री.*कालक्रम/i.test(qText)) {
    buckets[61].push(q);
    return;
  }

  // I. Topic 60: राजस्थान के मुख्यमंत्री
  const isCM = (q.sourceTopic && q.sourceTopic.includes("मुख्यमंत्री")) ||
    /मुख्यमंत्री|मुख्य मंत्री|उपमुख्यमंत्री|उप-मुख्यमंत्री|हीरालाल शास्त्री|सी\.एस\. वेंकटाचारी|जयनारायण व्यास|टीकाराम पालीवाल|मोहनलाल सुखाड़िया|बरकतुल्लाह|हरिदेव जोशी|भैरोंसिंह शेखावत|जगन्नाथ पहाड़िया|शिवचरण माथुर|वसुंधरा राजे|अशोक गहलोत|भजनलाल शर्मा/i.test(fullText);

  if (isCM && !/राज्यपाल/i.test(qText)) {
    buckets[60].push(q);
    return;
  }

  // J. Topic 59: राजस्थान के राज्यपाल
  const isGovernor = (q.sourceTopic && q.sourceTopic.includes("राज्यपाल")) ||
    /राज्यपाल|गवर्नर|राष्ट्रपति शासन.*राजस्थान|राजप्रमुख|अनुच्छेद 153|अनुच्छेद 154|अनुच्छेद 155|अनुच्छेद 156|अनुच्छेद 157|अनुच्छेद 158|अनुच्छेद 159|अनुच्छेद 160|अनुच्छेद 161|अनुच्छेद 213|गुरुमुख निहाल सिंह|संपूर्णानंद|हुकुम सिंह|जोगिन्दर सिंह|वेदपाल त्यागी|रघुकुल तिलक|ओ\.पी\. मेहरा|कलराज मिश्र|मार्गरेट अल्वा|कल्याण सिंह.*राज्यपाल/i.test(fullText);

  if (isGovernor) {
    buckets[59].push(q);
    return;
  }

  // K. Remaining -> Topic 58: राजस्थान राज्य प्रशासन
  buckets[58].push(q);
});

console.log("\n--- BUCKET COUNTS ---");
console.log(`Excluded (Pure India Polity): ${buckets.excluded_india_polity.length}`);
[58, 59, 60, 61, 62, 63, 64, 65, 74, 75].forEach(id => {
  console.log(`Topic ${id} (${TOPICS_CONFIG[id].name}): ${buckets[id].length} questions`);
});

// Helper to format options and answer
function formatOptionsAndAnswer(rawOptions, rawAnswer) {
  let opts = Array.isArray(rawOptions) ? rawOptions.slice(0, 4) : [];
  while (opts.length < 4) {
    opts.push(`विकल्प ${opts.length + 1}`);
  }

  const formattedOptions = opts.map((opt, i) => {
    const text = typeof opt === "string" ? opt.trim() : (opt && opt.text ? String(opt.text).trim() : `विकल्प ${i + 1}`);
    return {
      id: `opt${i + 1}`,
      text: text
    };
  });

  let correctOptId = "opt1";
  if (typeof rawAnswer === "string") {
    const u = rawAnswer.trim().toLowerCase();
    if (u === "opt1" || u === "a" || u === "0" || u === "1") correctOptId = "opt1";
    else if (u === "opt2" || u === "b" || u === "1" || u === "2") {
      correctOptId = (u === "1" && typeof rawAnswer === "string" && rawAnswer.startsWith("opt")) ? "opt1" : (u === "1" && rawAnswer.length === 1 ? "opt2" : (u === "b" ? "opt2" : (u === "opt2" ? "opt2" : "opt1")));
      if (u === "opt2" || u === "b") correctOptId = "opt2";
    }
    else if (u === "opt3" || u === "c" || u === "2" || u === "3") {
      if (u === "opt3" || u === "c") correctOptId = "opt3";
    }
    else if (u === "opt4" || u === "d" || u === "3" || u === "4") {
      if (u === "opt4" || u === "d") correctOptId = "opt4";
    }
  } else if (typeof rawAnswer === "number") {
    if (rawAnswer >= 0 && rawAnswer <= 3) {
      correctOptId = `opt${rawAnswer + 1}`;
    }
  }

  // Extra safety: if rawAnswer was "A", "B", "C", "D"
  const cleanAns = String(rawAnswer || "").trim().toUpperCase();
  if (cleanAns === "A") correctOptId = "opt1";
  else if (cleanAns === "B") correctOptId = "opt2";
  else if (cleanAns === "C") correctOptId = "opt3";
  else if (cleanAns === "D") correctOptId = "opt4";

  return { formattedOptions, correctOptId };
}

// 4. Update data/ddd/topics/
console.log("\n4. Updating data/ddd/topics/ JSON files...");
[58, 59, 60, 61, 62, 63, 64, 65, 74, 75].forEach(id => {
  const cfg = TOPICS_CONFIG[id];
  const pad = String(id).padStart(2, "0");
  const fileName = `${pad}_${cfg.name}.json`;
  const filePath = path.join(dddTopicsDir, fileName);

  const topicQuestions = buckets[id].map((q, idx) => {
    const { formattedOptions, correctOptId } = formatOptionsAndAnswer(q.options, q.answer);
    const ansLetter = correctOptId === "opt1" ? "A" : correctOptId === "opt2" ? "B" : correctOptId === "opt3" ? "C" : "D";
    return {
      id: q.sourceQuestionId || `topic_${id}_${idx + 1}`,
      source: q.source || "RajasthanGyan",
      sourceTopic: q.sourceTopic || cfg.name,
      masterTopicId: id,
      masterTopic: cfg.name,
      question: q.question,
      options: formattedOptions.map(o => o.text),
      answer: ansLetter,
      exam: q.exam || null,
      year: q.year || null,
      explanation: q.explanation || ""
    };
  });

  const topicOutput = {
    masterTopicId: id,
    masterTopic: cfg.name,
    totalAvailable: topicQuestions.length,
    questions: topicQuestions
  };

  fs.writeFileSync(filePath, JSON.stringify(topicOutput, null, 2), "utf8");
  console.log(`✓ Wrote ${topicQuestions.length} questions to data/ddd/topics/${fileName}`);
});

// Remove old 65 file if it had the old name
const oldTopic65File = path.join(dddTopicsDir, "65_राजस्थान पंचायती राज एवं स्थानीय स्वशासन.json");
if (fs.existsSync(oldTopic65File)) {
  fs.unlinkSync(oldTopic65File);
  console.log("✓ Removed legacy data/ddd/topics/65_राजस्थान पंचायती राज एवं स्थानीय स्वशासन.json");
}

// 5. Generate Batches in src/xdata/final_pyq_batches/
console.log("\n5. Generating batches in src/xdata/final_pyq_batches/...");

// Remove legacy batch folder for old 65 name if exists
const old65BatchDir = path.join(pyqBatchesDir, "राजस्थान पंचायती राज एवं स्थानीय स्वशासन");
if (fs.existsSync(old65BatchDir)) {
  fs.rmSync(old65BatchDir, { recursive: true, force: true });
  console.log("✓ Removed legacy final_pyq_batches/राजस्थान पंचायती राज एवं स्थानीय स्वशासन");
}

const batchSummary = {};

[58, 59, 60, 61, 62, 63, 64, 65, 74, 75].forEach(id => {
  const cfg = TOPICS_CONFIG[id];
  const folderDir = path.join(pyqBatchesDir, cfg.name);

  // Clean out target folder
  if (fs.existsSync(folderDir)) {
    fs.rmSync(folderDir, { recursive: true, force: true });
  }
  fs.mkdirSync(folderDir, { recursive: true });

  const questions = buckets[id];
  const totalQ = questions.length;
  const batchSize = 20;
  const batchCount = Math.ceil(totalQ / batchSize);
  const createdBatchFiles = [];

  for (let bIndex = 1; bIndex <= batchCount; bIndex++) {
    const startIdx = (bIndex - 1) * batchSize;
    const endIdx = Math.min(startIdx + batchSize, totalQ);
    const slice = questions.slice(startIdx, endIdx);

    const formattedBatchQuestions = slice.map((q, idx) => {
      const { formattedOptions, correctOptId } = formatOptionsAndAnswer(q.options, q.answer);
      return {
        type: "mcq",
        questionText: q.question,
        options: formattedOptions,
        correctAnswer: correctOptId,
        explanation: q.explanation || "",
        reference: q.reference || (q.exam ? `📌 PYQ — ${q.exam}${q.year ? ` (${q.year})` : ""}` : undefined),
        difficulty: "medium",
        order: idx,
        meta: {
          sourceType: "PYQ",
          sourceQuestionId: q.sourceQuestionId || `q_${id}_${bIndex}_${idx}`,
          exam: q.exam || null,
          year: q.year || null
        }
      };
    });

    const padBatch = String(bIndex).padStart(3, "0");
    const fileName = `batch_${padBatch}.json`;
    const batchContent = {
      masterTopic: cfg.name,
      batchIndex: bIndex,
      batchName: `${cfg.name} भाग ${bIndex}`,
      subject: cfg.subject,
      subjectSlug: cfg.subjectSlug,
      topicSlug: cfg.slug,
      negativeMarking: true,
      questionCount: formattedBatchQuestions.length,
      questions: formattedBatchQuestions
    };

    fs.writeFileSync(path.join(folderDir, fileName), JSON.stringify(batchContent, null, 2), "utf8");
    createdBatchFiles.push(fileName);
  }

  batchSummary[cfg.name] = {
    masterTopic: cfg.name,
    inputCount: totalQ,
    keepCount: totalQ,
    repairCount: 0,
    removeCount: 0,
    reviewCount: 0,
    batchCount,
    finalBatchFiles: createdBatchFiles
  };

  console.log(`✓ ${cfg.name}: created ${batchCount} batches (${totalQ} questions) in final_pyq_batches/${cfg.name}`);
});

// 6. Update MANIFEST_FINAL.json
console.log("\n6. Updating MANIFEST_FINAL.json...");
const manifestPath = path.join(pyqBatchesDir, "MANIFEST_FINAL.json");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Remove any legacy entries (like old topic 65)
  manifest.topics = (manifest.topics || []).filter(t => t.masterTopic !== "राजस्थान पंचायती राज एवं स्थानीय स्वशासन");

  // Replace or add entries for our 10 topics
  Object.values(batchSummary).forEach(summaryItem => {
    const existingIdx = manifest.topics.findIndex(t => t.masterTopic === summaryItem.masterTopic);
    if (existingIdx >= 0) {
      manifest.topics[existingIdx] = summaryItem;
    } else {
      manifest.topics.push(summaryItem);
    }
  });

  // Recalculate totals
  let totalBatches = 0;
  let totalQuestions = 0;
  manifest.topics.forEach(t => {
    totalBatches += t.batchCount || 0;
    totalQuestions += t.keepCount || 0;
  });

  manifest.summary.totalMasterTopics = manifest.topics.length;
  manifest.summary.totalBatches = totalBatches;
  manifest.summary.totalFinalQuestions = totalQuestions;
  manifest.generatedAt = new Date().toISOString();

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`✓ Updated MANIFEST_FINAL.json with ${manifest.topics.length} topics and ${totalBatches} total batches.`);
}

console.log("\nReorganization script finished successfully!");
