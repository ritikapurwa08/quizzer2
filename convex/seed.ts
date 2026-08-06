import { mutation } from "./_generated/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SYLLABUS_DATA = [
  {
    name: "Rajasthan Geography & Economy",
    nameHindi: "राजस्थान का भूगोल एवं अर्थव्यवस्था",
    slug: "rajasthan-geography-economy",
    description: "Physical features, climate, drainage, vegetation, agriculture, demographic, tribes, industries & tourism of Rajasthan",
    topics: [
      { name: "Physical Features", nameHindi: "भौतिक स्वरूप" },
      { name: "Climate", nameHindi: "जलवायु" },
      { name: "Drainage System", nameHindi: "अपवाह तंत्र" },
      { name: "Natural Vegetation", nameHindi: "प्राकृतिक वनस्पति" },
      { name: "Agriculture", nameHindi: "कृषि" },
      { name: "Animal Husbandry", nameHindi: "पशुपालन" },
      { name: "Dairy Development", nameHindi: "डेयरी विकास" },
      { name: "Demographic Characteristics", nameHindi: "जनसांख्यिकी विशेषताएं" },
      { name: "Tribes", nameHindi: "जनजातियां" },
      { name: "Industries", nameHindi: "उद्योग" },
      { name: "Tourism", nameHindi: "पर्यटन" },
      { name: "Major Tourist Places", nameHindi: "प्रमुख पर्यटन स्थल" },
    ],
  },
  {
    name: "Rajasthan History",
    nameHindi: "राजस्थान का इतिहास",
    slug: "rajasthan-history",
    description: "Ancient culture, archaeological sites, Rajput states, Delhi sultanate & Mughal relations, freedom struggle & integration",
    topics: [
      { name: "Ancient Culture & Civilization", nameHindi: "प्राचीन संस्कृति एवं सभ्यता" },
      { name: "Archaeological Sites and Their Importance", nameHindi: "पुरातात्विक स्थल एवं उनका महत्व" },
      { name: "History of Rajasthan up to the 18th Century", nameHindi: "18वीं शताब्दी तक राजस्थान का इतिहास" },
      { name: "Rajput States", nameHindi: "राजपूत राज्य" },
      { name: "Relations with Delhi Sultanate", nameHindi: "दिल्ली सल्तनत के साथ संबंध" },
      { name: "Mewar", nameHindi: "मेवाड़" },
      { name: "Ranthambore", nameHindi: "रणथंभौर" },
      { name: "Jalore", nameHindi: "जालौर" },
      { name: "Rajasthan and the Mughals", nameHindi: "राजस्थान एवं मुगल" },
      { name: "Maharana Sanga", nameHindi: "महाराणा सांगा" },
      { name: "Maharana Pratap", nameHindi: "महाराणा प्रताप" },
      { name: "Raja Man Singh", nameHindi: "राजा मानसिंह" },
      { name: "Chandrasen Rathore", nameHindi: "राव चंद्रसेन" },
      { name: "Rai Singh", nameHindi: "रायसिंह" },
      { name: "Raj Singh", nameHindi: "राजसिंह" },
      { name: "Freedom Struggle in Rajasthan", nameHindi: "राजस्थान में स्वतंत्रता संग्राम" },
      { name: "Revolt of 1857", nameHindi: "1857 की क्रांति" },
      { name: "Political Awakening", nameHindi: "राजनीतिक चेतना" },
      { name: "Prajamandal Movement", nameHindi: "प्रजामण्डल आंदोलन" },
      { name: "Peasant Movements", nameHindi: "किसान आंदोलन" },
      { name: "Tribal Movements", nameHindi: "जनजातीय आंदोलन" },
      { name: "Integration of Rajasthan", nameHindi: "राजस्थान का एकीकरण" },
      { name: "Important Personalities of Rajasthan", nameHindi: "राजस्थान के प्रमुख व्यक्तित्व" },
    ],
  },
  {
    name: "Rajasthan Art, Culture & Society",
    nameHindi: "राजस्थान की कला, संस्कृति एवं समाज",
    slug: "rajasthan-art-culture-society",
    description: "Folk deities, saints, architecture, forts, painting schools, fairs, festivals, ornaments, handicrafts, music & dance",
    topics: [
      { name: "Folk Deities", nameHindi: "लोक देवता एवं देवियां" },
      { name: "Saints of Rajasthan", nameHindi: "राजस्थान के संत" },
      { name: "Temple Architecture", nameHindi: "मंदिर स्थापत्य" },
      { name: "Forts", nameHindi: "दुर्ग एवं किले" },
      { name: "Palaces", nameHindi: "महल" },
      { name: "Monuments", nameHindi: "स्मारक एवं हवेलियां" },
      { name: "Painting Schools", nameHindi: "चित्रकला शैलियां" },
      { name: "Fairs", nameHindi: "मेले" },
      { name: "Festivals", nameHindi: "त्योहार" },
      { name: "Customs & Traditions", nameHindi: "रीति-रिवाज एवं परंपराएं" },
      { name: "Dresses", nameHindi: "वेशभूषा" },
      { name: "Ornaments", nameHindi: "आभूषण" },
      { name: "Handicrafts", nameHindi: "हस्तशिल्प" },
      { name: "Folk Music", nameHindi: "लोक संगीत" },
      { name: "Folk Dance", nameHindi: "लोक नृत्य" },
      { name: "Folk Theatre", nameHindi: "लोक नाट्य" },
      { name: "Language", nameHindi: "बोली एवं भाषा" },
      { name: "Literature", nameHindi: "साहित्य" },
    ],
  },
  {
    name: "Rajasthan Polity & Administration",
    nameHindi: "राजस्थान की राजव्यवस्था एवं प्रशासनिक व्यवस्था",
    slug: "rajasthan-polity-administration",
    description: "Governor, CM, state legislature, High Court, Panchayati Raj, district administration, RPSC & Commissions",
    topics: [
      { name: "Governor", nameHindi: "राज्यपाल" },
      { name: "Chief Minister", nameHindi: "मुख्यमंत्री" },
      { name: "Council of Ministers", nameHindi: "मन्त्रिपरिषद" },
      { name: "State Legislature", nameHindi: "राज्य विधानमंडल" },
      { name: "Rajasthan High Court", nameHindi: "राजस्थान उच्च न्यायालय" },
      { name: "Subordinate Courts", nameHindi: "अधीनस्थ न्यायालय" },
      { name: "Panchayati Raj", nameHindi: "पंचायती राज" },
      { name: "Urban Local Government", nameHindi: "नगरीय निकाय" },
      { name: "State Secretariat", nameHindi: "राज्य सचिवालय" },
      { name: "Divisional Commissioner", nameHindi: "संभाग आयुक्त" },
      { name: "District Administration", nameHindi: "जिला प्रशासन" },
      { name: "Rajasthan Public Service Commission (RPSC)", nameHindi: "राजस्थान लोक सेवा आयोग (RPSC)" },
      { name: "Rajasthan State Women's Commission", nameHindi: "राज्य महिला आयोग" },
      { name: "Rajasthan State Finance Commission", nameHindi: "राज्य वित्त आयोग" },
      { name: "Rajasthan State Election Commission", nameHindi: "राज्य निर्वाचन आयोग" },
      { name: "Lokayukta", nameHindi: "लोकायुक्त" },
      { name: "Rajasthan State Legal Services Authority", nameHindi: "राज्य विधिक सेवा प्राधिकरण" },
    ],
  },
  {
    name: "Rajasthan Current Affairs",
    nameHindi: "राजस्थान समसामयिकी",
    slug: "rajasthan-current-affairs",
    description: "Current issues, personalities, places, welfare schemes, economic scenario, sports & awards",
    topics: [
      { name: "Important Personalities", nameHindi: "प्रमुख व्यक्तित्व" },
      { name: "Important Places", nameHindi: "प्रमुख स्थान" },
      { name: "Current Issues", nameHindi: "समसामयिक मुद्दे" },
      { name: "Welfare Schemes", nameHindi: "कल्याणकारी योजनाएं" },
      { name: "Development Schemes", nameHindi: "विकास योजनाएं" },
      { name: "Government Initiatives", nameHindi: "शासकीय पहल" },
      { name: "Economic Scenario", nameHindi: "आर्थिक परिदृश्य" },
      { name: "Political Scenario", nameHindi: "राजनीतिक परिदृश्य" },
      { name: "Sports", nameHindi: "खेलकूद" },
      { name: "Awards", nameHindi: "पुरस्कार एवं सम्मान" },
      { name: "Books", nameHindi: "प्रमुख पुस्तकें" },
      { name: "Authors", nameHindi: "लेखक" },
    ],
  },
  {
    name: "World & India General Knowledge",
    nameHindi: "विश्व एवं भारत का सामान्य ज्ञान",
    slug: "world-india-gk",
    description: "World geography, Indian geography, monsoon, natural resources, biodiversity & Indian economy",
    topics: [
      { name: "World Geography - Continents", nameHindi: "विश्व भूगोल - महाद्वीप" },
      { name: "World Geography - Oceans", nameHindi: "विश्व भूगोल - महासागर" },
      { name: "World Geography - Features of Oceans", nameHindi: "विश्व भूगोल - महासागरीय विशेषताएं" },
      { name: "World Geography - Global Wind System", nameHindi: "विश्व भूगोल - पवन तंत्र" },
      { name: "World Geography - Environmental Problems", nameHindi: "विश्व भूगोल - पर्यावरणीय समस्याएं" },
      { name: "World Geography - Environmental Strategies", nameHindi: "विश्व भूगोल - पर्यावरण रणनीतियां" },
      { name: "World Geography - Major Human Occupations", nameHindi: "विश्व भूगोल - प्रमुख मानव व्यवसाय" },
      { name: "World Geography - Population Distribution", nameHindi: "विश्व भूगोल - जनसंख्या वितरण" },
      { name: "World Geography - Population Growth", nameHindi: "विश्व भूगोल - जनसंख्या वृद्धि" },
      { name: "India Geography - Physical Features", nameHindi: "भारत भूगोल - भौतिक स्वरूप" },
      { name: "India Geography - Climate", nameHindi: "भारत भूगोल - जलवायु" },
      { name: "India Geography - Monsoon System", nameHindi: "भारत भूगोल - मानसून तंत्र" },
      { name: "India Geography - Drainage System", nameHindi: "भारत भूगोल - अपवाह तंत्र" },
      { name: "India Geography - Natural Vegetation", nameHindi: "भारत भूगोल - प्राकृतिक वनस्पति" },
      { name: "India Geography - Biodiversity", nameHindi: "भारत भूगोल - जैव विविधता" },
      { name: "India Geography - Energy Resources", nameHindi: "भारत भूगोल - ऊर्जा संसाधन" },
      { name: "Indian Economy - Agriculture", nameHindi: "भारतीय अर्थव्यवस्था - कृषि" },
      { name: "Indian Economy - Industries", nameHindi: "भारतीय अर्थव्यवस्था - उद्योग" },
      { name: "Indian Economy - Service Sector", nameHindi: "भारतीय अर्थव्यवस्था - सेवा क्षेत्र" },
      { name: "Indian Economy - Growth & Development", nameHindi: "भारतीय अर्थव्यवस्था - वृद्धि एवं विकास" },
      { name: "Indian Economy - Foreign Trade", nameHindi: "भारतीय अर्थव्यवस्था - वैदेशिक व्यापार" },
      { name: "Indian Economy - Trade Trends", nameHindi: "भारतीय अर्थव्यवस्था - व्यापार प्रवृत्तियां" },
      { name: "Indian Economy - Trade Structure", nameHindi: "भारतीय अर्थव्यवस्था - व्यापार संरचना" },
      { name: "Indian Economy - Trade Direction", nameHindi: "भारतीय अर्थव्यवस्था - व्यापार दिशा" },
    ],
  },
  {
    name: "Indian Polity & Foreign Policy",
    nameHindi: "भारतीय राजव्यवस्था एवं विदेश नीति",
    slug: "indian-polity-foreign-policy",
    description: "Constitution, Fundamental Rights, DPSP, President, PM, Parliament, Supreme Court & foreign policy principles",
    topics: [
      { name: "Constitutional Development", nameHindi: "भारत का संवैधानिक विकास" },
      { name: "Constituent Assembly", nameHindi: "संविधान सभा" },
      { name: "Dr. B. R. Ambedkar's Contribution", nameHindi: "डॉ. बी. आर. अम्बेडकर का योगदान" },
      { name: "Citizenship", nameHindi: "नागरिकता" },
      { name: "Fundamental Rights", nameHindi: "मौलिक अधिकार" },
      { name: "Directive Principles of State Policy", nameHindi: "राज्य के नीति निर्देशक तत्व" },
      { name: "Fundamental Duties", nameHindi: "मौलिक कर्तव्य" },
      { name: "President", nameHindi: "राष्ट्रपति" },
      { name: "Vice President", nameHindi: "उपराष्ट्रपति" },
      { name: "Prime Minister", nameHindi: "प्रधानमंत्री" },
      { name: "Council of Ministers", nameHindi: "केंद्रीय मन्त्रिपरिषद" },
      { name: "Parliament", nameHindi: "संसद" },
      { name: "Supreme Court", nameHindi: "उच्चतम न्यायालय" },
      { name: "Election Commission", nameHindi: "भारत निर्वाचन आयोग" },
      { name: "Principles of India's Foreign Policy", nameHindi: "भारत की विदेश नीति के सिद्धांत" },
      { name: "Jawaharlal Nehru's Contribution", nameHindi: "जवाहरलाल नेहरू का योगदान" },
      { name: "India's Major Powers Relations", nameHindi: "प्रमुख शक्तियों के साथ भारत के संबंध" },
      { name: "Neighbouring Countries", nameHindi: "पड़ोसी देश" },
      { name: "Contemporary Issues", nameHindi: "समसामयिक मुद्दे" },
      { name: "Challenges", nameHindi: "चुनौतियां" },
    ],
  },
  {
    name: "Educational Psychology",
    nameHindi: "शिक्षा मनोविज्ञान",
    slug: "educational-psychology",
    description: "Learner development, theories of learning, personality, intelligence, creativity, motivation & inclusive education",
    topics: [
      { name: "Educational Psychology - Meaning & Scope", nameHindi: "शिक्षा मनोविज्ञान - अर्थ एवं क्षेत्र" },
      { name: "Implications for Effective Teaching", nameHindi: "प्रभावी शिक्षण हेतु निहितार्थ" },
      { name: "Learner Development - Concept of Development", nameHindi: "शिक्षार्थी विकास - विकास की अवधारणा" },
      { name: "Learner Development - Principles of Development", nameHindi: "शिक्षार्थी विकास - विकास के सिद्धांत" },
      { name: "Learner Development - Cognitive Development", nameHindi: "शिक्षार्थी विकास - संज्ञानात्मक विकास" },
      { name: "Learner Development - Social Development", nameHindi: "शिक्षार्थी विकास - सामाजिक विकास" },
      { name: "Learner Development - Moral Development", nameHindi: "शिक्षार्थी विकास - नैतिक विकास" },
      { name: "Learner Development - Emotional Development", nameHindi: "शिक्षार्थी विकास - संवेगात्मक विकास" },
      { name: "Learner Development - Language Development", nameHindi: "शिक्षार्थी विकास - भाषा विकास" },
      { name: "Learner Development - Physical Development", nameHindi: "शिक्षार्थी विकास - शारीरिक विकास" },
      { name: "Learning - Behaviourism", nameHindi: "अधिगम - व्यवहारवाद" },
      { name: "Learning - Cognitivism", nameHindi: "अधिगम - संज्ञानवाद" },
      { name: "Learning - Social Cognitive Theory", nameHindi: "अधिगम - सामाजिक संज्ञानात्मक सिद्धांत" },
      { name: "Learning - Constructivism", nameHindi: "अधिगम - निर्मितिवाद" },
      { name: "Learning - Factors Affecting Learning", nameHindi: "अधिगम को प्रभावित करने वाले कारक" },
      { name: "Learning - Implications for Teachers", nameHindi: "शिक्षकों हेतु अधिगम निहितार्थ" },
      { name: "Personality", nameHindi: "व्यक्तित्व" },
      { name: "Personality Measurement", nameHindi: "व्यक्तित्व मापन" },
      { name: "Adjustment", nameHindi: "समायोजन" },
      { name: "Mental Health", nameHindi: "मानसिक स्वास्थ्य" },
      { name: "Intelligence", nameHindi: "बुद्धि" },
      { name: "Creativity", nameHindi: "सृजनात्मकता" },
      { name: "Emotional Intelligence", nameHindi: "संवेगात्मक बुद्धि" },
      { name: "Motivation", nameHindi: "अभिप्रेरणा" },
      { name: "Theories of Motivation", nameHindi: "अभिप्रेरणा के सिद्धांत" },
      { name: "Individual Differences", nameHindi: "व्यक्तिगत भिन्नताएं" },
      { name: "Inclusive Education", nameHindi: "समावेशी शिक्षा" },
      { name: "21st Century Skills", nameHindi: "21वीं सदी के कौशल" },
    ],
  },
  {
    name: "English",
    nameHindi: "अंग्रेजी भाषा",
    slug: "english",
    description: "Grammar, vocabulary, comprehension, and language skills",
    topics: [
      { name: "General English", nameHindi: "सामान्य अंग्रेजी" },
      { name: "Grammar & Usage", nameHindi: "व्याकरण एवं प्रयोग" },
      { name: "Vocabulary & Idioms", nameHindi: "शब्दावली एवं मुहावरे" },
      { name: "Comprehension", nameHindi: "अपठित गद्यांश एवं समझ" },
    ],
  },
];

export const seedFixedSyllabus = mutation({
  args: {},
  handler: async (ctx) => {
    let subjectCount = 0;
    let topicCount = 0;

    for (let sIndex = 0; sIndex < SYLLABUS_DATA.length; sIndex++) {
      const item = SYLLABUS_DATA[sIndex];
      if (!item) continue;

      let subject = await ctx.db
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
    }

    return { message: "Fixed syllabus seeded successfully", subjectCount, topicCount };
  },
});

export const seedQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create or find subject
    let subject = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", "rajasthan-art-culture-society"))
      .unique();

    if (!subject) {
      const subjectId = await ctx.db.insert("subjects", {
        name: "Rajasthan Art, Culture & Society",
        slug: "rajasthan-art-culture-society",
        description: "Folk deities, saints, architecture, forts, painting schools, fairs & festivals",
        order: 2,
      });
      subject = await ctx.db.get(subjectId);
    }

    // 2. Create or find topic
    let topic = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", subject!._id).eq("slug", "fairs")
      )
      .unique();

    if (!topic) {
      const topicId = await ctx.db.insert("topics", {
        subjectId: subject!._id,
        name: "Fairs",
        slug: "fairs",
        order: 7,
      });
      topic = await ctx.db.get(topicId);
    }

    // 3. Create a new test set under Fairs topic
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
        options: [],
        correctAnswer: ["A-1", "B-2", "C-3", "D-4"],
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
        type: "statement_reason",
        questionText: "प्रश्न 2. निम्नलिखित कथनों पर विचार कीजिए:",
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
        options: [],
        correctAnswer: ["A-1", "B-2", "C-3", "D-4"],
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
            { id: "2", text: "झाअलरापाटन (झालावाड़)" },
            { id: "3", text: "भरतपुर" },
            { id: "4", text: "रानीवाड़ा (सांचौर)" }
          ]
        }
      },
      {
        type: "mcq",
        questionText: "प्रश्न 5. धार्मिक त्योहारों एवं संप्रदायों के संदर्भ में निम्नलिखित युग्मों पर विचार कीजिए:\n1. पर्युषण पर्व - भाद्रपद माह में मनाया जाने वाला जैन धर्म का प्रमुख पर्व।\n2. सुगंध दशमी - भाद्रपद शुक्ल दशमी (जैन धर्म)।\n3. साहवा का मेला - सिख समाज का सबसे बड़ा मेला (चूरू)।\n4. थदरी सातम (बड़ी सातम) - जैन समाज द्वारा रखा जाने वाला उपवास।\n\nउपर्युक्त में से कौन-से युग्म सही सुमेलित हैं?",
        options: [
          { id: "opt1", text: "केवल 1, 2 और 3" },
          { id: "opt2", text: "केवल 1, 3 और 4" },
          { id: "opt3", text: "केवल 2 और 4" },
          { id: "opt4", text: "1, 2, 3 और 4" }
        ],
        correctAnswer: "opt1",
        difficulty: "medium",
        explanation: "थदरी सातम (बड़ी सातम) सिंधी समाज का त्योहार है (भाद्रपद कृष्ण सप्तमी), जैन समाज का नहीं।"
      },
      {
        type: "match_following",
        questionText: "प्रश्न 6. सूची-I (उर्स / मज़ार) को सूची-II (संबंधित स्थान) से सुमेलित कीजिए:",
        options: [],
        correctAnswer: ["A-1", "B-2", "C-3", "D-4"],
        difficulty: "medium",
        explanation: "गलियाकोट (डूंगरपुर), मीठे शाह (गागरोन), मलिक शाह (जालौर), सदरुद्दीन (रणथंभौर)।",
        meta: {
          left: [
            { id: "A", text: "गलियाकोट का उर्स (मज़ार-ए-फ़खरी)" },
            { id: "B", text: "मीठे शाह का उर्स" },
            { id: "C", text: "मलिक शाह का उर्स" },
            { id: "D", text: "संत सदरुद्दीन की दरगाह का उर्स" }
          ],
          right: [
            { id: "1", text: "सागवाड़ा (डूंगरपुर)" },
            { id: "2", text: "गागरोन (झालावाड़)" },
            { id: "3", text: "जालौर" },
            { id: "4", text: "रणथंभौर (सवाई माधोपुर)" }
          ]
        }
      },
      {
        type: "mcq",
        questionText: "प्रश्न 7. राजस्थान में मनाई जाने वाली प्रसिद्ध होलियों एवं उनके क्षेत्रों का कौन-सा युग्म असत्य (गलत) है?",
        options: [
          { id: "opt1", text: "लठमार होली - श्री महावीर जी (करौली)" },
          { id: "opt2", text: "कोडामार होली - भिनाय (अजमेर)" },
          { id: "opt3", text: "पत्थरमार होली - बाड़मेर" },
          { id: "opt4", text: "कपड़ा फाड़ होली - सांगोद (कोटा)" }
        ],
        correctAnswer: "opt4",
        difficulty: "easy",
        explanation: "कपड़ा फाड़ होली पुष्कर (अजमेर) की प्रसिद्ध है। सांगोद (कोटा) का \"नाण\" (लोकोत्सव) प्रसिद्ध है।"
      },
      {
        type: "mcq",
        questionText: "प्रश्न 8. \"आदिवासियों का कुंभ\" कहे जाने वाले बेणेश्वर मेले के संबंध में निम्नलिखित कथनों में से असत्य कथन का चयन कीजिए:",
        options: [
          { id: "opt1", text: "यह मेला माघ पूर्णिमा को सोम, माही और जाखम नदियों के त्रिवेणी संगम (नवाटपुरा, डूंगरपुर) पर आयोजित होता है।" },
          { id: "opt2", text: "यह भारत का एकमात्र ऐसा स्थान है जहाँ खंडित शिवलिंग की पूजा की जाती है।" },
          { id: "opt3", text: "बेणेश्वर धाम की स्थापना संत माऊजी द्वारा की गई थी।" },
          { id: "opt4", text: "इस मेले के अवसर पर सहरिया जनजाति द्वारा मुख्य रूप से अपने पूर्वजों की अस्थियों का विसर्जन किया जाता है।" }
        ],
        correctAnswer: "opt4",
        difficulty: "medium",
        explanation: "कपिलधारा मेला (बारां) में सहरिया जनजाति अस्थियों का विसर्जन करती है। बेणेश्वर मुख्य रूप से भीलों का कुंभ है।"
      },
      {
        type: "sequence",
        questionText: "प्रश्न 9. राजस्थान के प्रमुख त्योहारों को उनके वर्ष में आने के कालक्रमानुसार (चैत्र माह से प्रारंभ करते हुए) सही क्रम में व्यवस्थित कीजिए:",
        options: [],
        correctAnswer: ["item1", "item2", "item3", "item4"],
        difficulty: "hard",
        explanation: "आखा तीज (वैशाख शु. 3) ➔ हरियाली अमावस्या (श्रावण अमा.) ➔ बछ बारस (भाद्रपद कृ. 12) ➔ देवउठनी एकादशी (कार्तिक शु. 11)।",
        meta: {
          items: [
            { id: "item1", text: "आखा तीज (अक्षय तृतीया)" },
            { id: "item2", text: "हरियाली अमावस्या" },
            { id: "item3", text: "बछ बारस" },
            { id: "item4", text: "देवउठनी एकादशी (प्रबोधिनी एकादशी)" }
          ]
        }
      },
      {
        type: "mcq",
        questionText: "प्रश्न 10. निम्नलिखित कथनों को ध्यानपूर्वक पढ़कर सही विकल्प का चयन कीजिए:\n1. डिग्गीपुरी के कल्याण जी मेले (टोंक) में भगवान विष्णु की \"कलह-पीर\" के रूप में पूजा की जाती है।\n2. धौलपुर स्थित मचकुण्ड तीर्थ को \"तीर्थों का भांजा\" कहा जाता है, जहाँ के कुंड में सल्फर की उपस्थिति के कारण चरम रोग सही होने की मान्यता है।\n3. भाद्रपद शुक्ल एकादशी को जलझूलनी एकादशी (डोल ग्यारस) कहा जाता है, जिस दिन कृष्ण जी के बाल रूप को रेवाड़ी में ले जाकर स्नान कराया जाता है।\n\nकूट:",
        options: [
          { id: "opt1", text: "केवल कथन 1 और 2 सही हैं।" },
          { id: "opt2", text: "केवल कथन 2 और 3 सही हैं।" },
          { id: "opt3", text: "केवल कथन 1 और 3 सही हैं।" },
          { id: "opt4", text: "तीनों कथन (1, 2 और 3) सही हैं।" }
        ],
        correctAnswer: "opt4",
        difficulty: "medium",
        explanation: "तीनों ही कथन पूर्णतः सत्य एवं तथ्यपरक हैं।"
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
