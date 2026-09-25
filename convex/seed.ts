import { mutation } from "./_generated/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Authoritative Master Topic List for Rajasthan GK (73 topics across 5 canonical subjects).
 * India GK, English, etc. are strictly excluded as per syllabus contract.
 */
export const SYLLABUS_DATA = [
  {
    name: "Rajasthan General Knowledge & Geography",
    nameHindi: "राजस्थान सामान्य ज्ञान एवं भूगोल",
    slug: "rajasthan-general-knowledge-geography",
    description: "राजस्थान का सामान्य ज्ञान, भौतिक स्वरूप, भूगोल, जलवायु, नदियाँ, झीलें, कृषि, वन एवं खनिज संसाधन",
    topics: [
      { name: "General Knowledge of Rajasthan", nameHindi: "राजस्थान का सामान्य ज्ञान" },
      { name: "Physical Features and Geography of Rajasthan", nameHindi: "राजस्थान का भौतिक स्वरूप एवं भूगोल" },
      { name: "Climate of Rajasthan", nameHindi: "राजस्थान की जलवायु" },
      { name: "Population and Census of Rajasthan", nameHindi: "राजस्थान की जनसंख्या एवं जनगणना" },
      { name: "Soils of Rajasthan", nameHindi: "राजस्थान की मृदा" },
      { name: "Drainage System, Rivers and Lakes of Rajasthan", nameHindi: "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें" },
      { name: "Irrigation Projects, Dams and Water Management", nameHindi: "राजस्थान की सिंचाई परियोजनाएँ, बाँध एवं जल प्रबंधन" },
      { name: "Forests, Wildlife, Sanctuaries and National Parks", nameHindi: "राजस्थान के वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान" },
      { name: "Agriculture of Rajasthan", nameHindi: "राजस्थान की कृषि" },
      { name: "Animal Husbandry of Rajasthan", nameHindi: "राजस्थान का पशुपालन" },
      { name: "Mineral Resources of Rajasthan", nameHindi: "राजस्थान के खनिज संसाधन" },
      { name: "Energy Resources of Rajasthan", nameHindi: "राजस्थान के ऊर्जा संसाधन" },
      { name: "Major Industries of Rajasthan", nameHindi: "राजस्थान के प्रमुख उद्योग" },
      { name: "Transportation in Rajasthan", nameHindi: "राजस्थान का परिवहन" },
      { name: "Tourism in Rajasthan", nameHindi: "राजस्थान का पर्यटन" },
    ],
  },
  {
    name: "Rajasthan Art & Culture",
    nameHindi: "राजस्थान कला एवं संस्कृति",
    slug: "rajasthan-art-culture",
    description: "राजस्थान के मेले, त्योहार, रीति-रिवाज, वेशभूषा, स्थापत्य, चित्रकला, हस्तशिल्प, लोक देवता, संगीत, नृत्य, भाषा एवं साहित्य",
    topics: [
      { name: "Fairs of Rajasthan", nameHindi: "राजस्थान के मेले" },
      { name: "Festivals of Rajasthan", nameHindi: "राजस्थान के त्योहार" },
      { name: "Customs and Traditions of Rajasthan", nameHindi: "राजस्थान की रीति-रिवाज एवं परंपराएँ" },
      { name: "Costumes and Ornaments of Rajasthan", nameHindi: "राजस्थान की वेशभूषा एवं आभूषण" },
      { name: "Architecture and Monuments of Rajasthan", nameHindi: "राजस्थान की स्थापत्य कला एवं वास्तुकला" },
      { name: "Painting Schools of Rajasthan", nameHindi: "राजस्थान की चित्रकला शैलियाँ" },
      { name: "Handicrafts and Crafts of Rajasthan", nameHindi: "राजस्थान के हस्तशिल्प एवं हस्तकलाएँ" },
      { name: "Folk Deities and Goddesses of Rajasthan", nameHindi: "राजस्थान के लोक देवता एवं लोक देवियाँ" },
      { name: "Saints Sects and Religious Traditions of Rajasthan", nameHindi: "राजस्थान के संत, संप्रदाय एवं धार्मिक परंपराएँ" },
      { name: "Folk Music and Folk Songs of Rajasthan", nameHindi: "राजस्थान का लोक संगीत एवं लोकगीत" },
      { name: "Folk Dances of Rajasthan", nameHindi: "राजस्थान के लोक नृत्य" },
      { name: "Rajasthani Language and Dialects", nameHindi: "राजस्थानी भाषा एवं बोलियाँ" },
      { name: "Rajasthani Literature", nameHindi: "राजस्थानी साहित्य" },
      { name: "Rajasthani Vocabulary", nameHindi: "राजस्थानी शब्दावली" },
      { name: "Rajasthani Idioms and Proverbs", nameHindi: "राजस्थानी मुहावरे एवं लोकोक्तियाँ" },
      { name: "Nicknames of Major Places in Rajasthan", nameHindi: "राजस्थान के प्रमुख स्थानों के उपनाम" },
    ],
  },
  {
    name: "Rajasthan Ancient & Medieval History",
    nameHindi: "राजस्थान प्राचीन एवं मध्यकालीन इतिहास",
    slug: "rajasthan-ancient-medieval-history",
    description: "प्राचीन सभ्यताएँ, इतिहास के स्रोत, महाजनपद, राजपूत काल, गुहिल, कछवाहा, चौहान, गुर्जर-प्रतिहार, राठौड़ एवं मध्यकालीन प्रशासन",
    topics: [
      { name: "Ancient Civilizations and Archaeological Sites of Rajasthan", nameHindi: "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल" },
      { name: "Sources of Rajasthan History", nameHindi: "राजस्थान के इतिहास के स्रोत" },
      { name: "Mahajanapadas and Ancient Political History of Rajasthan", nameHindi: "राजस्थान के महाजनपद एवं प्राचीन राजनीतिक इतिहास" },
      { name: "Rajput Period in Rajasthan", nameHindi: "राजस्थान का राजपूत काल" },
      { name: "Guhil and Guhilot Dynasty of Mewar", nameHindi: "मेवाड़ का गुहिल/गुहिलोत वंश" },
      { name: "Kachhwaha Dynasty of Amer", nameHindi: "आमेर का कछवाहा वंश" },
      { name: "Chauhan Dynasty", nameHindi: "चौहान वंश" },
      { name: "Gurjara Pratihara Dynasty", nameHindi: "गुर्जर-प्रतिहार वंश" },
      { name: "Rathore Dynasty", nameHindi: "राठौड़ वंश" },
      { name: "Other Major Dynasties of Rajasthan", nameHindi: "राजस्थान के अन्य प्रमुख राजवंश" },
      { name: "Princely States of Rajasthan and British Treaties", nameHindi: "राजस्थान की रियासतें एवं ब्रिटिश संधियाँ" },
      { name: "Administrative System of Medieval Rajasthan", nameHindi: "मध्यकालीन राजस्थान की प्रशासनिक व्यवस्था" },
    ],
  },
  {
    name: "Modern Rajasthan & Freedom Movement",
    nameHindi: "आधुनिक राजस्थान एवं स्वतंत्रता आंदोलन",
    slug: "modern-rajasthan-freedom-movement",
    description: "1857 का विद्रोह, किसान एवं जनजातीय आंदोलन, प्रजामंडल, स्वतंत्रता संग्राम संगठन, एकीकरण एवं प्रमुख व्यक्तित्व",
    topics: [
      { name: "Revolt of 1857 in Rajasthan", nameHindi: "राजस्थान में 1857 का विद्रोह" },
      { name: "Peasant and Tribal Movements in Rajasthan", nameHindi: "राजस्थान के किसान एवं जनजातीय आंदोलन" },
      { name: "Prajamandal Movements in Rajasthan", nameHindi: "राजस्थान के प्रजामंडल आंदोलन" },
      { name: "Freedom Struggle Organizations and Institutions in Rajasthan", nameHindi: "राजस्थान में स्वतंत्रता आंदोलन के संगठन एवं संस्थाएँ" },
      { name: "Social and Political Awakening in Rajasthan", nameHindi: "राजस्थान में सामाजिक एवं राजनीतिक जागरण" },
      { name: "Integration of Rajasthan", nameHindi: "राजस्थान का एकीकरण" },
      { name: "Prominent Personalities of Rajasthan", nameHindi: "राजस्थान के प्रमुख व्यक्तित्व" },
      { name: "Prominent Women Personalities of Rajasthan", nameHindi: "राजस्थान की महिला व्यक्तित्व" },
      { name: "Press and Journalism in Rajasthan", nameHindi: "राजस्थान में प्रेस एवं पत्रकारिता" },
    ],
  },
  {
    name: "Rajasthan Polity & Administration",
    nameHindi: "राजस्थान राजव्यवस्था / प्रशासन",
    slug: "rajasthan-polity-administration",
    description: "राज्य प्रशासन, राज्यपाल, मुख्यमंत्री, मंत्रिपरिषद, विधानमंडल, उच्च न्यायालय, जिला प्रशासन, पंचायती राज, RPSC एवं सांविधानिक आयोग",
    topics: [
      { name: "Rajasthan State Administration", nameHindi: "राजस्थान राज्य प्रशासन" },
      { name: "Governor of Rajasthan", nameHindi: "राजस्थान के राज्यपाल" },
      { name: "Chief Minister of Rajasthan", nameHindi: "राजस्थान के मुख्यमंत्री" },
      { name: "Council of Ministers and Cabinet of Rajasthan", nameHindi: "राजस्थान की मंत्रिपरिषद एवं मंत्रिमंडल" },
      { name: "Rajasthan State Legislature", nameHindi: "राजस्थान राज्य विधानमंडल" },
      { name: "Rajasthan High Court and Judiciary", nameHindi: "राजस्थान उच्च न्यायालय एवं न्यायपालिका" },
      { name: "District Administration of Rajasthan", nameHindi: "राजस्थान जिला प्रशासन" },
      { name: "Panchayati Raj in Rajasthan", nameHindi: "राजस्थान पंचायती राज" },
      { name: "Rajasthan Public Service Commission RPSC", nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)" },
      { name: "Rajasthan State Election Commission", nameHindi: "राजस्थान राज्य निर्वाचन आयोग" },
      { name: "Rajasthan State Human Rights Commission", nameHindi: "राजस्थान मानवाधिकार आयोग" },
      { name: "Rajasthan State Commission for Women", nameHindi: "राजस्थान महिला आयोग" },
      { name: "Lokayukta of Rajasthan", nameHindi: "राजस्थान लोकायुक्त" },
      { name: "Constitutional Commissions and Institutions of Rajasthan", nameHindi: "राजस्थान के संवैधानिक आयोग एवं संस्थाएँ" },
      { name: "Major Research and Study Centers of Rajasthan", nameHindi: "राजस्थान के प्रमुख अनुसंधान एवं अध्ययन केंद्र" },
      { name: "Science and Technology in Rajasthan", nameHindi: "राजस्थान विज्ञान एवं प्रौद्योगिकी" },
      { name: "Urban Local Governance and Municipalities in Rajasthan", nameHindi: "राजस्थान नगरीय स्वशासन एवं नगरपालिका" },
      { name: "Rajasthan Budget and Economic Review", nameHindi: "राजस्थान का बजट एवं आर्थिक समीक्षा" },
    ],
  },
];

export const seedSyllabus = mutation({
  args: {},
  handler: async (ctx) => {
    let subjectCount = 0;
    let topicCount = 0;

    const validSubjectSlugs = new Set(SYLLABUS_DATA.map((s) => s.slug));

    // 1. Remove non-canonical subjects (e.g. World GK, India GK, English)
    const existingSubjects = await ctx.db.query("subjects").collect();
    for (const oldSub of existingSubjects) {
      if (!validSubjectSlugs.has(oldSub.slug)) {
        const associatedTopics = await ctx.db
          .query("topics")
          .withIndex("by_subject", (q) => q.eq("subjectId", oldSub._id))
          .collect();
        for (const t of associatedTopics) {
          await ctx.db.delete(t._id);
        }
        await ctx.db.delete(oldSub._id);
      }
    }

    // 2. Seed / Sync the 5 canonical Rajasthan GK subjects and 73 topics
    for (let sIndex = 0; sIndex < SYLLABUS_DATA.length; sIndex++) {
      const item = SYLLABUS_DATA[sIndex];
      if (!item) continue;

      const subject = await ctx.db
        .query("subjects")
        .withIndex("by_slug", (q) => q.eq("slug", item.slug))
        .unique();

      let subjectId;
      if (subject) {
        subjectId = subject._id;
        await ctx.db.patch(subjectId, {
          name: item.name,
          nameHindi: item.nameHindi,
          description: item.description,
          order: sIndex,
        });
      } else {
        subjectId = await ctx.db.insert("subjects", {
          name: item.name,
          nameHindi: item.nameHindi,
          slug: item.slug,
          description: item.description,
          order: sIndex,
        });
        subjectCount++;
      }

      for (let tIndex = 0; tIndex < item.topics.length; tIndex++) {
        const top = item.topics[tIndex];
        if (!top) continue;
        const topicName = typeof top === "string" ? top : top.name;
        const topicNameHindi = typeof top === "string" ? undefined : top.nameHindi;
        const topicSlug = slugify(topicName);

        const existingTopic = await ctx.db
          .query("topics")
          .withIndex("by_subject_slug", (q) =>
            q.eq("subjectId", subjectId).eq("slug", topicSlug)
          )
          .unique();

        if (existingTopic) {
          await ctx.db.patch(existingTopic._id, {
            name: topicName,
            nameHindi: topicNameHindi,
            order: tIndex,
          });
        } else {
          await ctx.db.insert("topics", {
            subjectId,
            name: topicName,
            nameHindi: topicNameHindi,
            slug: topicSlug,
            order: tIndex,
          });
          topicCount++;
        }
      }

      // Clean up topics under this subject that are no longer in canonical list
      const validSlugs = new Set(item.topics.map((t) => slugify(typeof t === "string" ? t : t.name)));
      const existingTopics = await ctx.db
        .query("topics")
        .withIndex("by_subject", (q) => q.eq("subjectId", subjectId))
        .collect();
      for (const et of existingTopics) {
        if (!validSlugs.has(et.slug)) {
          await ctx.db.delete(et._id);
        }
      }
    }

    return {
      message: "Authoritative 73 Rajasthan GK topics seeded successfully",
      subjectCount: SYLLABUS_DATA.length,
      topicCount: 73,
    };
  },
});

export const seedQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find Rajasthan Art & Culture subject
    let subject = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", "rajasthan-art-culture"))
      .unique();

    if (!subject) {
      const subjectId = await ctx.db.insert("subjects", {
        name: "Rajasthan Art & Culture",
        nameHindi: "राजस्थान कला एवं संस्कृति",
        slug: "rajasthan-art-culture",
        description: "राजस्थान के मेले, त्योहार, रीति-रिवाज, वेशभूषा, स्थापत्य, चित्रकला",
        order: 1,
      });
      subject = await ctx.db.get(subjectId);
    }

    // 2. Find Fairs topic
    const topicSlug = slugify("Fairs of Rajasthan");
    let topic = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", subject!._id).eq("slug", topicSlug)
      )
      .unique();

    if (!topic) {
      const topicId = await ctx.db.insert("topics", {
        subjectId: subject!._id,
        name: "Fairs of Rajasthan",
        nameHindi: "राजस्थान के मेले",
        slug: topicSlug,
        order: 0,
      });
      topic = await ctx.db.get(topicId);
    }

    // 3. Create a sample test set under Fairs topic
    const testSetId = await ctx.db.insert("testSets", {
      topicId: topic!._id,
      name: "राजस्थान के मेले एवं त्योहार - अभ्यास टेस्ट 1",
      negativeMarking: true,
      order: 1,
      questionCount: 10,
    });

    const questionsData = [
      {
        type: "match_following",
        questionText: "प्रश्न 1. सूची-I (मेला / उत्सव) को सूची-II (आयोजन तिथि / माह) से सुमेलित कीजिए तथा नीचे दिए गए कूट से सही उत्तर का चयन कीजिए:",
        options: [
          { id: "opt1", text: "A-1, B-2, C-3, D-4" },
          { id: "opt2", text: "A-2, B-1, C-4, D-3" },
          { id: "opt3", text: "A-3, B-4, C-1, D-2" },
          { id: "opt4", text: "A-4, B-3, C-2, D-1" }
        ],
        correctAnswer: "opt1",
        difficulty: "medium",
        explanation: "कजली तीज (भाद्रपद कृ. 3), बेणेश्वर (माघ पूर्णिमा), कपिल मुनि (कार्तिक पूर्णिमा), घोटिया अम्बा (चैत्र अमावस्या)।",
        meta: {
          left: [
            { id: "A", text: "कजली तीज (बड़ी तीज)" },
            { id: "B", text: "बेणेश्वर मेला" },
            { id: "C", text: "कपिल मुनि मेला" },
            { id: "D", text: "घोटिया अम्बा मेला" }
          ],
          right: [
            { id: "1", text: "भाद्रपद कृष्ण तृतीया" },
            { id: "2", text: "माघ पूर्णिमा" },
            { id: "3", text: "कार्तिक पूर्णिमा" },
            { id: "4", text: "चैत्र अमावस्या" }
          ]
        }
      },
      {
        type: "assertion_reason",
        questionText: "प्रश्न 2. निम्नलिखित कथनों पर विचार कीजिए:\nकथन (A): राजस्थान में कोटा का दशहरा मेला देश-विदेश में प्रसिद्ध है।\nकारण (R): विजयादशमी के दिन खेजड़ी वृक्ष की पूजा की जाती है तथा शस्त्र पूजन की परंपरा है।",
        options: [
          { id: "opt1", text: "कथन (A) और कारण (R) दोनों सही हैं तथा (R), (A) की सही व्याख्या करता है।" },
          { id: "opt2", text: "कथन (A) और कारण (R) दोनों सही हैं, लेकिन (R), (A) की सही व्याख्या नहीं करता है।" },
          { id: "opt3", text: "कथन (A) सही है, परंतु कारण (R) गलत है।" },
          { id: "opt4", text: "कथन (A) गलत है, परंतु कारण (R) सही है।" }
        ],
        correctAnswer: "opt2",
        difficulty: "hard",
        explanation: "दोनों कथन तथ्यपरक रूप से सही हैं, परंतु कोटा में दशहरा मेला प्रसिद्ध होना खेजड़ी या शस्त्र पूजन का सांस्कृतिक कारण नहीं है।"
      },
      {
        type: "mcq",
        questionText: "प्रश्न 3. राजस्थान के प्रमुख त्योहारों से संबंधित निम्नलिखित कथनों पर विचार कीजिए:\n1. छोटी तीज (श्रावणी तीज) पर जयपुर की तीज की सवारी विश्व प्रसिद्ध है तथा इससे एक दिन पूर्व नवविवाहितों के लिए \"सिंजारा\" भेजा जाता है।\n2. बूंदी राजपरिवार में गणगौर का पर्व अत्यधिक धूमधाम से मनाया जाता है।\n3. जैसलमेर की गणगौर (चैत्र शुक्ल चतुर्थी) की प्रमुख विशेषता यह है कि यहाँ केवल \"गवर\" (पार्वती) की सवारी निकाली जाती है, \"ईसर\" (शिव) की नहीं।\n4. नाथद्वारा (राजसमंद) में चैत्र शुक्ल पंचमी को \"गुलाबी गणगौर\" अथवा \"चुनड़ी गणगौर\" मनाई जाती है।\n\nउपर्युक्त कथनों में से कौन-से कथन सत्य हैं?",
        options: [
          { id: "opt1", text: "केवल 1, 2 और 3" },
          { id: "opt2", text: "केवल 1, 3 और 4" },
          { id: "opt3", text: "केवल 2, 3 और 4" },
          { id: "opt4", text: "1, 2, 3 और 4" }
        ],
        correctAnswer: "opt2",
        difficulty: "medium",
        explanation: "बूंदी में गणगौर नहीं मनाई जाती (\"हाड़ा ले डूब्यो गणगौर\")। अतः कथन 2 गलत है।"
      },
      {
        type: "match_following",
        questionText: "प्रश्न 4. सूची-I (पशु मेला) को सूची-II (स्थान / जिला) से सुमेलित कीजिए:",
        options: [
          { id: "opt1", text: "A-1, B-2, C-3, D-4" },
          { id: "opt2", text: "A-2, B-3, C-4, D-1" },
          { id: "opt3", text: "A-3, B-1, C-2, D-4" },
          { id: "opt4", text: "A-4, B-2, C-1, D-3" }
        ],
        correctAnswer: "opt1",
        difficulty: "medium",
        explanation: "मल्लीनाथ (तिलवाड़ा), चंद्रभागा (झालावाड़), जसवंत (भरतपुर), सेवड़िया (सांचौर)।",
        meta: {
          left: [
            { id: "A", text: "मल्लीनाथ पशु मेला" },
            { id: "B", text: "चंद्रभागा पशु मेला" },
            { id: "C", text: "जसवंत पशु मेला" },
            { id: "D", text: "सेवड़िया पशु मेला" }
          ],
          right: [
            { id: "1", text: "तिलवाड़ा (बालोतरा)" },
            { id: "2", text: "झालरापाटन (झालावाड़)" },
            { id: "3", text: "भरतपुर" },
            { id: "4", text: "रानीवाड़ा (सांचौर)" }
          ]
        }
      },
      {
        type: "mcq",
        questionText: "प्रश्न 5. \"आदिवासियों का कुंभ\" कहे जाने वाले बेणेश्वर मेले के संबंध में निम्नलिखित कथनों में से असत्य कथन का चयन कीजिए:",
        options: [
          { id: "opt1", text: "यह मेला माघ पूर्णिमा को सोम, माही और जाखम नदियों के त्रिवेणी संगम (नवाटपुरा, डूंगरपुर) पर आयोजित होता है।" },
          { id: "opt2", text: "यह भारत का एकमात्र ऐसा स्थान है जहाँ खंडित शिवलिंग की पूजा की जाती है।" },
          { id: "opt3", text: "बेणेश्वर धाम की स्थापना संत माऊजी द्वारा की गई थी।" },
          { id: "opt4", text: "इस मेले के अवसर पर सहरिया जनजाति द्वारा मुख्य रूप से अपने पूर्वजों की अस्थियों का विसर्जन किया जाता है।" }
        ],
        correctAnswer: "opt4",
        difficulty: "medium",
        explanation: "कपिलधारा मेला (बारां) में सहरिया जनजाति अस्थियों का विसर्जन करती है। बेणेश्वर मुख्य रूप से भीलों का कुंभ है।"
      }
    ];

    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];
      if (!q) continue;
      await ctx.db.insert("questions", {
        testSetId,
        type: q.type as any,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty as any,
        order: i,
        meta: q.meta,
      });
    }

    return {
      testSetId,
      subjectId: subject!._id,
      topicId: topic!._id,
      name: "राजस्थान के मेले एवं त्योहार - अभ्यास टेस्ट 1",
    };
  },
});

export const seedFixedSyllabus = seedSyllabus;

export const seedSampleNotes = mutation({
  args: {},
  handler: async (ctx) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", "rajasthan-general-knowledge-geography"))
      .unique();
    if (!subject) throw new Error("Subject rajasthan-general-knowledge-geography not found");

    const topic = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", subject._id).eq("slug", "rivers-and-water-resources-of-rajasthan")
      )
      .unique();
    if (!topic) throw new Error("Topic rivers-and-water-resources-of-rajasthan not found");

    const existing = await ctx.db
      .query("topicNotes")
      .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
      .unique();

    const sampleDocument = {
      version: "1.0",
      title: "राजस्थान की नदियाँ एवं जल संसाधन",
      subtitle: "Rivers and Water Resources of Rajasthan",
      overview: "राजस्थान के 3 प्रमुख अपवाह तंत्र (बंगाल की खाड़ी, अरब सागर एवं आंतरिक प्रवाह) तथा महत्वपूर्ण नदियों की परीक्षा-उन्मुख मुख्य अवधारणाएँ।",
      tags: ["राजस्थान GK", "राजस्थान भूगोल", "RPSC Exam Notes"],
      blocks: [
        {
          type: "heading",
          level: 2,
          text: "राजस्थान का अपवाह तंत्र (Drainage System)",
          subtitle: "General Classification & Features",
        },
        {
          type: "paragraph",
          content: "राजस्थान का अपवाह तंत्र अरावली पर्वतमाला द्वारा दो मुख्य भागों (बंगाल की खाड़ी एवं अरब सागर) में विभाजित होता है, जबकि राज्य का अधिकांश भाग आंतरिक प्रवाह प्रणाली के अंतर्गत आता है।",
        },
        {
          type: "facts",
          title: "प्रमुख परीक्षा-उपयोगी तथ्य (Key High-Yield Facts)",
          items: [
            "आंतरिक प्रवाह प्रणाली राज्य के कुल अपवाह क्षेत्र का लगभग 60.2% भाग घेरे हुए है।",
            "बंगाल की खाड़ी का अपवाह तंत्र लगभग 22.4% क्षेत्र में फैला है।",
            "अरब सागर का अपवाह तंत्र लगभग 17.4% है।",
            "चंबल नदी राजस्थान की एकमात्र बारहमासी (नित्यवाही) नदी है जो सर्वाधिक बीहड़ (Badland topography) बनाती है।",
            "पूर्णतः राजस्थान में बहने वाली सबसे लंबी नदी बनास (480 किमी) है।",
          ],
        },
        {
          type: "comparison_table",
          title: "राजस्थान के अपवाह तंत्र का तुलनात्मक अध्ययन",
          headers: ["अरब सागर की नदियाँ", "बंगाल की खाड़ी की नदियाँ"],
          rows: [
            {
              feature: "प्रमुख नदियाँ",
              col1: "लूणी, माही, साबरमती, पश्चिमी बनास",
              col2: "चंबल, बनास, बाणगंगा, बेड़च, कोठारी",
            },
            {
              feature: "राज्य के कुल अपवाह का %",
              col1: "लगभग 17.1%",
              col2: "लगभग 22.4%",
            },
            {
              feature: "अंतिम विसर्जन",
              col1: "कच्छ के रन या खंभात की खाड़ी में विलीन",
              col2: "यमुना के माध्यम से गंगा में मिलकर बंगाल की खाड़ी",
            },
          ],
        },
        {
          type: "image",
          src: "/notes/rajasthan-gk/rajasthan-general-knowledge-geography/rivers-and-water-resources-of-rajasthan/images/image-01.webp",
          alt: "राजस्थान अपवाह तंत्र रेखाचित्र",
          caption: "राजस्थान के 3 प्रमुख अपवाह तंत्र: आंतरिक, बंगाल की खाड़ी एवं अरब सागर",
        },
        {
          type: "trick",
          title: "अरब सागर की नदियों की शॉर्टकट ट्रिक",
          mnemonic: "समानता (स-मा-न-ता)",
          explanation: "साबरमती, माही, नर्मदा, ताप्ती — ये नदियाँ पश्चिम की ओर बहकर खंभात की खाड़ी/अरब सागर में गिरती हैं।",
          examContext: "अरब सागरीय अपवाह की नदियाँ पहचानने के लिए",
        },
        {
          type: "exam_trap",
          title: "सावधानी / सामान्य भ्रम (Exam Trap)",
          confusion: "बाणगंगा नदी को हमेशा बंगाल की खाड़ी की नदी समझा जाता है।",
          clarification: "वर्तमान में पर्याप्त जल न होने एवं यमुना तक न पहुँच पाने के कारण इसे 'रुण्डित सरिता' (आंतरिक प्रवाह) की श्रेणी में रखा जाने लगा है।",
        },
        {
          type: "quick_revision",
          title: "त्वरित पुनरावलोकन (Quick Revision)",
          summaryPoints: [
            "कर्क रेखा को दो बार काटने वाली नदी माही नदी (कांठल की गंगा) है।",
            "लूणी नदी का जल बालोतरा (बाड़मेर) तक मीठा और उसके बाद खारा हो जाता है।",
            "चंबल नदी पर 4 प्रमुख बाँध (गांधी सागर, राणा प्रताप सागर, जवाहर सागर, कोटा बैराज) स्थित हैं।",
          ],
        },
        {
          type: "pyq_connection",
          examName: "RPSC RAS Pre",
          year: "2021/2023",
          questionSnippet: "निम्न में से कौनसी नदी आंतरिक प्रवाह की नहीं है?",
          insight: "RPSC लगातार आंतरिक प्रवाह (कांतली, साबी, घग्घर, काकनी, मेंथा, रूपनगढ़) और अरब सागरीय नदियों के अंतर पर प्रश्न पूछती है।",
        },
      ],
    };

    const notePayload = {
      topicId: topic._id,
      subjectId: subject._id,
      slug: topic.slug,
      title: "राजस्थान की नदियाँ एवं जल संसाधन",
      summary: "राजस्थान के अपवाह तंत्र (बंगाल की खाड़ी, अरब सागर, आंतरिक प्रवाह), मुख्य नदियाँ, बाँध एवं जल संसाधन।",
      pdfPath: "/notes/rajasthan-gk/rajasthan-general-knowledge-geography/rivers-and-water-resources-of-rajasthan/notes.pdf",
      hasPdf: true,
      images: [
        {
          id: "img-01",
          src: "/notes/rajasthan-gk/rajasthan-general-knowledge-geography/rivers-and-water-resources-of-rajasthan/images/image-01.webp",
          alt: "राजस्थान अपवाह तंत्र रेखाचित्र",
          caption: "राजस्थान के 3 प्रमुख अपवाह तंत्र: आंतरिक, बंगाल की खाड़ी एवं अरब सागर",
          title: "अपवाह तंत्र वर्गीकरण",
          width: 800,
          height: 500,
        },
      ],
      content: JSON.stringify(sampleDocument),
      isPublished: true,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, notePayload);
      return existing._id;
    } else {
      return await ctx.db.insert("topicNotes", notePayload);
    }
  },
});


