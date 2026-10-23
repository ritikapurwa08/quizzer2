import fs from "fs";
import path from "path";

// Raw content from prompt
const rawBlock1 = [
  {
    "id": 1,
    "exam": "III Grade (Sans. Edu.) English-15.02.2023",
    "question": "Fill in the blank with the correct option.\nMy dues of seven thousand rupees ..... to him.",
    "options": {
      "a": "have paid",
      "b": "had paid",
      "c": "been paid",
      "d": "has been paid"
    },
    "answer": "d",
    "concept": "जब कोई निश्चित धनराशि (seven thousand rupees) एकमुश्त इकाई (single unit/sum) के रूप में देखी जाती है, तो क्रिया एकवचन (singular) होती है। साथ ही, वाक्य पैसिव वॉइस (Passive Voice) में है क्योंकि बकाया राशि का भुगतान किया गया है (has been paid)।",
    "elimination_logic": "'have paid' और 'had paid' एक्टिव वॉइस हैं (dues खुद भुगतान नहीं कर सकते)। 'been paid' बिना सहायक क्रिया के अधूरा है। अतः 'has been paid' सही है।"
  },
  {
    "id": 2,
    "exam": "II Grade (English) 23.12.2022",
    "question": "Everyone of the boys ..... to ride a bike.",
    "options": {
      "a": "loving",
      "b": "love",
      "c": "loves",
      "d": "are loving"
    },
    "answer": "c",
    "concept": "'Everyone of' के बाद संज्ञा बहुवचन (boys) आती है, लेकिन वास्तविक कर्ता 'Everyone' होता है जो हमेशा Singular होता है। अतः इसके साथ Singular Verb (V1 + s/es) का प्रयोग होगा।",
    "elimination_logic": "'boys' को देखकर छात्र भ्रमित होकर 'love' चुनते हैं, जो गलत है। 'loving' बिना aux verb के नहीं आ सकता और 'are loving' बहुवचन है।"
  },
  {
    "id": 3,
    "exam": "II Grade (English) 23.12.2022",
    "question": "Choose the grammatically correct option:",
    "options": {
      "a": "Any dictionaries will give you the meaning of these words.",
      "b": "Any dictionary will gives you the meaning of these words.",
      "c": "Any dictionary will give you the meaning of these words.",
      "d": "Any dictionary is give you the meaning of these words."
    },
    "answer": "c",
    "concept": "मोडल वर्ब (Modal Verb जैसे will/shall/can) के तुरंत बाद क्रिया का मूल रूप (Bare Infinitive - V1) आता है।",
    "elimination_logic": "(b) में modal 'will' के बाद 'gives' (s-form) का गलत प्रयोग है। (d) में 'is give' संरचना अमान्य है। (a) में 'Any' के साथ सामान्य संदर्भ में singular countable noun 'dictionary' बेहतर है।"
  },
  {
    "id": 4,
    "exam": "II Grade (English) 23.12.2022",
    "question": "Choose the grammatically correct option:",
    "options": {
      "a": "Many a flowers is born to blush unseens.",
      "b": "Many a flowers are born to blush unseen.",
      "c": "Many a flower is born to blush unseen.",
      "d": "Many a flower are born to blush unseen."
    },
    "answer": "c",
    "concept": "नियम: 'Many a / an + Singular Countable Noun + Singular Verb'।",
    "elimination_logic": "(a) और (b) में 'Many a' के बाद 'flowers' (plural) लगाया गया है जो गलत है। (d) में 'flower' के साथ plural verb 'are' का प्रयोग हुआ है, इसलिए गलत है।"
  },
  {
    "id": 5,
    "exam": "High Court LDC - 19.03.2023",
    "question": "Pick the correct sentence from the options given:",
    "options": {
      "a": "Nobody lives forever.",
      "b": "Nobody lives for ever.",
      "c": "Everyone lives forever.",
      "d": "Nobody wants to live ever."
    },
    "answer": "a",
    "concept": "Indefinite Pronoun 'Nobody' एकवचन (singular) होता है, जिसके साथ क्रिया 'lives' और मानक एडवर्ब 'forever' (एक शब्द) आता है।",
    "elimination_logic": "(b) में 'for ever' दो अलग शब्दों में लिखा है जो कम मानक है। (c) अर्थ की दृष्टि से असत्य है। (a) व्याकरण और मुहावरेदार रूप से सटीक है।"
  },
  {
    "id": 6,
    "exam": "महिला पर्यवेक्षक परीक्षा 06.01.2019",
    "question": "Choose the correct answer from the following options determining whether subject agrees in number with the verb:",
    "options": {
      "a": "Just around the corner is a fantastic bakery and a small supermarket.",
      "b": "After all the gardening we did, the sun shining on the flowerbeds make a beautiful sight.",
      "c": "Jack, along with some of his closest friends, is sharing a car to attend a wedding.",
      "d": "There is according to my doctor, many courses of treatment available to me."
    },
    "answer": "c",
    "concept": "जब दो कर्ता 'along with', 'with', 'together with', 'as well as' से जुड़ते हैं, तो क्रिया हमेशा पहले कर्ता (Jack - Singular) के अनुसार आती है। इसलिए 'is' सही है।",
    "elimination_logic": "(a) में दो चीजें हैं (bakery and supermarket), इसलिए 'are' होना चाहिए। (b) में मुख्य कर्ता 'the sun shining' (singular) है अतः 'makes' होना चाहिए। (d) में 'many courses' (plural) के लिए 'there are' होना चाहिए।"
  },
  {
    "id": 7,
    "exam": "LDC 2018",
    "question": "Fill in the blank with the correct option:\nEither the boy or the girl ..... at fault.",
    "options": {
      "a": "were",
      "b": "are",
      "c": "was",
      "d": "have been"
    },
    "answer": "c",
    "concept": "'Either... or' या 'Neither... nor' में क्रिया निकटतम कर्ता (Proximity rule) के अनुसार आती है। यहाँ निकटतम कर्ता 'the girl' (Singular) है, अतः Singular Verb आएगी।",
    "elimination_logic": "'were', 'are', और 'have been' तीनों बहुवचन (Plural) क्रियाएँ हैं। एकमात्र Singular विकल्प 'was' है।"
  },
  {
    "id": 8,
    "exam": "LDC 2018",
    "question": "Ram as well as his brothers ..... coming today.",
    "options": {
      "a": "are",
      "b": "were",
      "c": "is",
      "d": "have been"
    },
    "answer": "c",
    "concept": "'as well as' से जुड़ने पर क्रिया पहले कर्ता के अनुसार प्रयुक्त होती है। पहला कर्ता 'Ram' (Singular) है।",
    "elimination_logic": "निकटवर्ती शब्द 'his brothers' को देखकर छात्र 'are' चुनते हैं, परंतु नियम के अनुसार क्रिया प्रथम कर्ता 'Ram' के अनुसार 'is' होगी।"
  },
  {
    "id": 9,
    "exam": "II Grade 2013",
    "question": "John as well as Tom ..... waiting for you.",
    "options": {
      "a": "is",
      "b": "were",
      "c": "have been",
      "d": "are"
    },
    "answer": "a",
    "concept": "'as well as' से जुड़े होने के कारण प्रथम कर्ता 'John' (Singular) के अनुसार Singular Verb आएगी।",
    "elimination_logic": "'were', 'have been' और 'are' सभी Plural Verbs हैं, जो सीधे एलिमिनेट हो जाते हैं।"
  },
  {
    "id": 10,
    "exam": "LDC 2018",
    "question": "Each of the girl Scouts ..... a community project.",
    "options": {
      "a": "does",
      "b": "do",
      "c": "participates",
      "d": "participate"
    },
    "answer": "a",
    "concept": "'Each of + Plural Noun' के साथ Singular Verb का प्रयोग होता है। किसी प्रोजेक्ट को 'करने' के संदर्भ में क्रिया 'does' उपयुक्त है।",
    "elimination_logic": "'participates' के बाद preposition 'in' अनिवार्य होता है (participates in a project), अतः बिना 'in' के 'does' ही व्याकरण सम्मत है।"
  },
  {
    "id": 11,
    "exam": "LDC HC 2017",
    "question": "My friend, philosopher and guide ..... going abroad.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "am",
      "d": "being"
    },
    "answer": "b",
    "concept": "यदि एक ही व्यक्ति के लिए कई उपाधियों या संज्ञाओं का प्रयोग हो और केवल पहले शब्द के पूर्व possessive/article (My friend) लगा हो, तो वह एक ही व्यक्ति को दर्शाता है। अतः क्रिया Singular होगी।",
    "elimination_logic": "यहाँ तीन अलग-अलग व्यक्ति नहीं हैं, बल्कि एक ही मित्र है जो दार्शनिक और मार्गदर्शक भी है। इसलिए 'are' गलत है और 'is' सही है।"
  },
  {
    "id": 12,
    "exam": "LDC HC 2017",
    "question": "A variety of beverages ..... flooded the market.",
    "options": {
      "a": "has",
      "b": "had't",
      "c": "have",
      "d": "would"
    },
    "answer": "c",
    "concept": "'A variety of + Plural Noun' को व्याकरण में बहुवचन (Plural) माना जाता है, इसलिए इसके साथ Plural Verb 'have' आती है। (नोट: 'The variety of' के साथ singular verb आती है)।",
    "elimination_logic": "'has' का प्रयोग 'The variety of' के साथ होता है। यहाँ 'A variety of' होने से 'have' चुना जाएगा।"
  },
  {
    "id": 13,
    "exam": "LDC HC 2017",
    "question": "A hundred and twenty kilometers an hour ..... much too fast.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "am",
      "d": "being"
    },
    "answer": "a",
    "concept": "गति (Speed), दूरी (Distance) या समय की निश्चित माप जब एक संयुक्त इकाई (Single measurement) के रूप में व्यक्त की जाती है, तो वह Singular Verb लेती है।",
    "elimination_logic": "'kilometers' प्लूरल देखकर 'are' लगाना एक सामान्य जाल (trap) है। गति एक इकाई है, अतः 'is' सही है।"
  },
  {
    "id": 14,
    "exam": "LDC HC 2015",
    "question": "Choose the correct sentence.",
    "options": {
      "a": "One of these candidates are sure to be selected.",
      "b": "One of these candidates is sure to be selected.",
      "c": "One of these candidates were sure to be selected.",
      "d": "One of these candidates have sure to be selected."
    },
    "answer": "b",
    "concept": "'One of + Plural Noun' में वास्तविक कर्ता 'One' (Singular) होता है, अतः इसके साथ Singular Verb 'is' आएगी।",
    "elimination_logic": "(a) और (c) में क्रमशः 'are' और 'were' (Plural) हैं। (d) में 'have sure' व्याकरण सम्मत नहीं है।"
  },
  {
    "id": 15,
    "exam": "LDC HC 2015",
    "question": "Choose the correct sentence.",
    "options": {
      "a": "The class had divided in their opinions.",
      "b": "The class have divided in their opinions.",
      "c": "The class were divided in their opinions.",
      "d": "The class being divided in their opinions."
    },
    "answer": "c",
    "concept": "Collective Noun (जैसे class, jury, committee) जब विभाजित हो या उसके सदस्यों के अलग-अलग विचार हों (Noun of Multitude), तो क्रिया और सर्वनाम दोनों बहुवचन (Plural) होते हैं।",
    "elimination_logic": "विभाजित अवस्था में 'were divided' सटीक पैसिव अवस्था को दर्शाता है। 'have divided' की जगह अवस्था दर्शाने के लिए 'were divided in their opinions' मानक प्रयोग है।"
  },
  {
    "id": 16,
    "exam": "LDC HC 2015",
    "question": "One of my friends ..... going abroad.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "been",
      "d": "being"
    },
    "answer": "a",
    "concept": "'One of + Plural Pronoun/Noun' में कर्ता 'One' होने के कारण Singular Verb 'is' का प्रयोग होगा।",
    "elimination_logic": "'friends' को देखकर 'are' लगाना गलत है। 'been' और 'being' बिना सहायक क्रिया के नहीं आ सकते।"
  },
  {
    "id": 17,
    "exam": "LDC HC 2015",
    "question": "Every boy and girl ..... (be) ready to appear for the examination.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "being",
      "d": "been"
    },
    "answer": "b",
    "concept": "यदि दो संज्ञाएँ 'and' से जुड़ी हों लेकिन उनके पहले 'Each' या 'Every' लगा हो, तो वह हमेशा Singular माना जाता है और Singular Verb लेता है।",
    "elimination_logic": "'boy and girl' देखकर 'were' लगाना गलत है। 'Every' के प्रभाव से क्रिया Singular 'was' होगी।"
  },
  {
    "id": 18,
    "exam": "II Grade 2018",
    "question": "Politics ..... an interesting subject.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "were",
      "d": "have"
    },
    "answer": "a",
    "concept": "विषयों के नाम जो अंत में '-s' रखते हैं (जैसे Politics, Mathematics, Physics), वे अर्थ में एकवचन होते हैं और Singular Verb लेते हैं।",
    "elimination_logic": "दिखने में plural होने के बावजूद विषय का नाम होने से 'are/were' हट जाते हैं। सही उत्तर 'is' है।"
  },
  {
    "id": 19,
    "exam": "II Grade 2018",
    "question": "Eighty pounds a week ..... not a good wage.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "were",
      "d": "have"
    },
    "answer": "b",
    "concept": "वेतन या धनराशि (Eighty pounds a week) जब एक निश्चित राशि/दर के रूप में संदर्भित हो, तो वह एकवचन मानी जाती है।",
    "elimination_logic": "'pounds' बहुवचन है, लेकिन 'a week' के साथ मिलकर यह एक निश्चित मजदूरी (a good wage) की बात कर रहा है, अतः 'is' सही है।"
  },
  {
    "id": 20,
    "exam": "II Grade 2018",
    "question": "The workers ..... worried about their jobs.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "have"
    },
    "answer": "b",
    "concept": "साधारण बहुवचन कर्ता 'The workers' (Plural Subject) के साथ Plural Verb 'are' का प्रयोग होता है।",
    "elimination_logic": "'is' और 'was' एकवचन हैं। 'have worried' का अर्थ बदल जाता है, यहाँ 'worried' विशेषण (adjective) के रूप में स्थिति बता रहा है (are worried)।"
  },
  {
    "id": 21,
    "exam": "II Grade 2018",
    "question": "The jeans you sent me ..... fit me.",
    "options": {
      "a": "wasn't",
      "b": "doesn't",
      "c": "don't",
      "d": "isn't"
    },
    "answer": "c",
    "concept": "कपड़ों और औजारों के दो भागों वाले नाम (Jeans, Trousers, Scissors, Pliers) हमेशा Plural माने जाते हैं और Plural Verb लेते हैं।",
    "elimination_logic": "'wasn't', 'doesn't', और 'isn't' तीनों Singular हैं। 'Jeans' प्लूरल है और V1 'fit' के साथ नकारात्मक में 'don't fit' आएगा।"
  },
  {
    "id": 22,
    "exam": "II Grade 2018",
    "question": "Twelve hundred rupees ..... our sales price.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "were",
      "d": "have"
    },
    "answer": "a",
    "concept": "निश्चित कीमत (sales price) के रूप में धनराशि एकवचन मानी जाती है।",
    "elimination_logic": "'rupees' के आधार पर 'are' चुनना परीक्षक का मुख्य ट्रैप है। पूरक शब्द 'our sales price' स्पष्ट करता है कि यह एक इकाई है, अतः 'is' सही है।"
  },
  {
    "id": 23,
    "exam": "II Grade 2018",
    "question": "Either the mayor or his deputy ..... bound to come.",
    "options": {
      "a": "are",
      "b": "were",
      "c": "is",
      "d": "have"
    },
    "answer": "c",
    "concept": "'Either... or' में क्रिया निकटतम कर्ता के अनुसार आती है। 'his deputy' Singular है, अतः Singular Verb आएगी।",
    "elimination_logic": "'are', 'were' और 'have' सभी बहुवचन हैं, इसलिए सीधे बाहर हो जाते हैं।"
  },
  {
    "id": 24,
    "exam": "II Grade 2018",
    "question": "One of the boys ..... gone home.",
    "options": {
      "a": "are",
      "b": "were",
      "c": "has",
      "d": "have"
    },
    "answer": "c",
    "concept": "'One of the + Plural Noun' के साथ Singular Verb आती है। वाक्य में V3 'gone' है, इसलिए 'has' का प्रयोग होगा।",
    "elimination_logic": "'gone' (V3) के पहले 'are' या 'were' एक्टिव अर्थ में नहीं आ सकते। 'have' बहुवचन है, अतः 'has' सही है।"
  },
  {
    "id": 25,
    "exam": "II Grade 2018",
    "question": "Renu, with her mother and sister ..... spending a month in London.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "were",
      "d": "have been"
    },
    "answer": "a",
    "concept": "'with' से जुड़े रहने पर क्रिया मुख्य कर्ता 'Renu' (Singular) के अनुसार Singular होगी।",
    "elimination_logic": "कोमा के बीच का भाग 'with her mother and sister' अतिरिक्त जानकारी (parenthetical) है, मुख्य कर्ता Renu है, अतः 'is' सही है।"
  },
  {
    "id": 26,
    "exam": "II Grade 2018",
    "question": "What I say and what I think ..... my own affairs.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "was",
      "d": "has"
    },
    "answer": "a",
    "concept": "जब दो Noun Clauses 'and' से जुड़कर दो अलग-अलग विचारों या कार्यों को दर्शाते हैं, तो क्रिया Plural होती है।",
    "elimination_logic": "यहाँ दो अलग पहलू हैं: 'कहना' और 'सोचना'। 'affairs' (plural) भी संकेत देता है कि क्रिया Plural 'are' होगी।"
  },
  {
    "id": 27,
    "exam": "II Grade 2017",
    "question": "The news ..... true.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "had",
      "d": "have"
    },
    "answer": "a",
    "concept": "'News' एक Uncountable Singular Noun है। अंत में 's' होने पर भी यह हमेशा Singular Verb लेता है।",
    "elimination_logic": "'are' और 'have' बहुवचन हैं। 'had' के बाद 'true' (adjective) जोड़ने पर अर्थ अधूरा रहता है।"
  },
  {
    "id": 28,
    "exam": "II Grade 2017",
    "question": "Their means ..... simple.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "has",
      "d": "had"
    },
    "answer": "a",
    "concept": "जब 'Means' का अर्थ 'आय/संसाधन' (wealth/resources/income) होता है, तो यह हमेशा Plural माना जाता है और Plural Verb लेता है।",
    "elimination_logic": "यदि 'means' का अर्थ 'तरीका' (method/way) हो तब यह singular हो सकता है (e.g., this means of transport is...)। यहाँ जीवनयापन के साधन/संसाधनों की बात है, अतः 'are' सही है।"
  },
  {
    "id": 29,
    "exam": "II Grade 2017",
    "question": "A bunch of keys ..... lying on the table.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "were",
      "d": "has"
    },
    "answer": "a",
    "concept": "Collective Noun 'A bunch of + Plural Noun' में गुच्छा (bunch) एक है, अतः क्रिया Singular होगी।",
    "elimination_logic": "'keys' को देखकर छात्र भ्रमित होते हैं, लेकिन कर्ता 'A bunch' है, इसलिए 'is' आएगा।"
  },
  {
    "id": 30,
    "exam": "II Grade 2017",
    "question": "All citrus fruits ..... a rich source of vitamin C.",
    "options": {
      "a": "has",
      "b": "are",
      "c": "was",
      "d": "is"
    },
    "answer": "b",
    "concept": "'All citrus fruits' एक स्पष्ट बहुवचन कर्ता (Plural Subject) है, जो Plural Verb की मांग करता है।",
    "elimination_logic": "'is', 'has', 'was' तीनों Singular हैं, इसलिए एकमात्र उपयुक्त विकल्प 'are' है।"
  },
  {
    "id": 31,
    "exam": "II Grade 2017",
    "question": "..... is lying on the table.",
    "options": {
      "a": "A new pair of glasses",
      "b": "A new pair of glass",
      "c": "A new pairs of glass",
      "d": "New pair of glass"
    },
    "answer": "a",
    "concept": "चश्मे के लिए 'glasses' शब्द का प्रयोग होता है (glass केवल सामग्री या कांच है)। 'A pair of' एकवचन को दर्शाता है, जो दी गई क्रिया 'is' के अनुकूल है।",
    "elimination_logic": "(b), (c), और (d) में 'glass' का गलत रूप प्रयुक्त है। सही शब्द 'glasses' केवल विकल्प (a) में है।"
  },
  {
    "id": 32,
    "exam": "II Grade 2017",
    "question": "Neither of the students ..... interested in extra classes.",
    "options": {
      "a": "were",
      "b": "have been",
      "c": "are",
      "d": "is"
    },
    "answer": "d",
    "concept": "'Neither of + Plural Noun' औपचारिक मानक व्याकरण में हमेशा Singular माना जाता है और Singular Verb लेता है।",
    "elimination_logic": "'were', 'have been' और 'are' तीनों Plural क्रियाएँ हैं। एकमात्र Singular विकल्प 'is' है।"
  },
  {
    "id": 33,
    "exam": "II Grade 2013",
    "question": "One of my books ..... missing.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "has",
      "d": "was"
    },
    "answer": "b",
    "concept": "'One of my books' में कर्ता 'One' है। वर्तमान स्थिति दर्शाने के लिए 'is missing' मानक प्रयोग है।",
    "elimination_logic": "'books' देखकर 'are' नहीं आएगा। 'has missing' व्याकरण की दृष्टि से अशुद्ध है। 'is' सबसे उपयुक्त है।"
  },
  {
    "id": 34,
    "exam": "II Grade 2013",
    "question": "The house with all its contents ..... insured.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "has"
    },
    "answer": "b",
    "concept": "'with' से जुड़े वाक्यांश (with all its contents) मुख्य कर्ता को प्रभावित नहीं करते। मुख्य कर्ता 'The house' (Singular) है, अतः Singular Verb 'was' आएगी।",
    "elimination_logic": "'contents' (plural) को देखकर 'were' या 'are' लगाना परीक्षक का जाल है। कर्ता 'The house' होने से 'was' सही है।"
  },
  {
    "id": 35,
    "exam": "II Grade 2013",
    "question": "Either he or I ..... mistaken.",
    "options": {
      "a": "am",
      "b": "are",
      "c": "were",
      "d": "is"
    },
    "answer": "a",
    "concept": "'Either... or' में जब दो अलग-अलग Person के सर्वनाम जुड़ते हैं, तो क्रिया निकटतम सर्वनाम (Nearest Subject - I) के अनुसार आती है। 'I' के साथ 'am' लगता है।",
    "elimination_logic": "निकटतम कर्ता 'I' है, अतः 'is' या 'are' नहीं आ सकते। नियम के अनुसार 'am' ही सही उत्तर है।"
  }
];

const rawBlock2 = [
  {
    "id": 36,
    "exam": "LDC 2024",
    "question": "Fill in the blank in the sentence below choosing the most appropriate verb from the options given.\nEach of the students ..... responsible for maintaining the school garden.",
    "options": {
      "A": "is",
      "B": "must",
      "C": "are",
      "D": "were",
      "E": "Question not attempted"
    },
    "answer": "A",
    "concept": "'Each of + Plural Noun' की संरचना में वास्तविक कर्ता 'Each' (एकवचन) होता है, जिसके साथ हमेशा Singular Verb का प्रयोग होता है।",
    "elimination_logic": "'students' बहुवचन देखकर 'are' या 'were' चुनना गलत है। 'must' के बाद 'be' आवश्यक होता (must be responsible), अतः केवल 'is' व्याकरण सम्मत है।"
  },
  {
    "id": 37,
    "exam": "LDC 2024",
    "question": "Select the most appropriate verb form to fill in the blank in the following sentence.\nNeither she nor I ..... getting the Trophy this year.",
    "options": {
      "A": "are",
      "B": "was",
      "C": "is",
      "D": "am",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "'Neither... nor' संयोजन में क्रिया निकटतम कर्ता (Proximity rule) के अनुसार प्रयुक्त होती है। यहाँ रिक्त स्थान के सबसे निकट कर्ता 'I' है, अतः 'am' आएगा।",
    "elimination_logic": "'this year' वर्तमान संदर्भ को दर्शाता है, इसलिए 'was' नहीं आएगा। निकटतम कर्ता 'I' होने के कारण 'are' और 'is' सीधे बाहर हो जाते हैं।"
  },
  {
    "id": 38,
    "exam": "LDC 2024",
    "question": "Select the most appropriate option to identify the incorrect segment in the following sentence.\nThe judge concluded that (a)/ either the maid or the driver were (b)/ responsible for the murder. (c)",
    "options": {
      "A": "(c) only",
      "B": "No error",
      "C": "(a) only",
      "D": "(b) only",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "'Either... or' से जुड़े दो एकवचन कर्ताओं (the maid / the driver) में निकटतम कर्ता 'the driver' एकवचन है, इसलिए बहुवचन क्रिया 'were' के स्थान पर 'was' होना चाहिए।",
    "elimination_logic": "भाग (b) में 'were' का प्रयोग अशुद्ध है। अतः उत्तर विकल्प (D) है।"
  },
  {
    "id": 39,
    "exam": "LDC 2024",
    "question": "Select the most appropriate option to identify the incorrect segment in the following sentence.\nThe dazzle and glamour (a)/ of money and success (b)/ have gone to her head. (c)",
    "options": {
      "A": "(c) only",
      "B": "No error",
      "C": "(a) only",
      "D": "(b) only",
      "E": "Question not attempted"
    },
    "answer": "A",
    "concept": "'The dazzle and glamour' एक ही समग्र विचार/प्रभाव (Single idea/notion) को व्यक्त करते हैं। जब दो संज्ञाएँ मिलकर एक ही भाव दर्शाती हैं, तो क्रिया एकवचन होती है। अतः 'have gone' की जगह 'has gone' आएगा।",
    "elimination_logic": "त्रुटि भाग (c) में क्रिया 'have gone' में है। आधिकारिक उत्तर कुंजी में (c) को अशुद्ध खंड माना गया है।"
  },
  {
    "id": 40,
    "exam": "Patwar 17 Aug, 2025, Shift-01",
    "question": "Choose the correct plural word from the list below.",
    "options": {
      "A": "womans",
      "B": "mothers-in-law",
      "C": "sheeps",
      "D": "childrens",
      "E": "Question not attempted"
    },
    "answer": "B",
    "concept": "Compound Noun का बहुवचन बनाते समय मुख्य शब्द (Root word) में 's' जोड़ा जाता है (mother -> mothers-in-law)।",
    "elimination_logic": "'woman' का बहुवचन 'women' होता है। 'sheep' का बहुवचन 'sheep' ही रहता है। 'children' स्वयं बहुवचन है, अतः उसमें 's' नहीं लगता।"
  },
  {
    "id": 41,
    "exam": "Grade 2nd Sanskrit dpt. 2025",
    "question": "Choose the correct sentence in which the verb is in agreement with the subject -",
    "options": {
      "1": "The President and the Secretary was arrested.",
      "2": "Patience as well as perseverance are necessary for success.",
      "3": "Neither he nor his friends has broken the window pane.",
      "4": "The wages of sin is death."
    },
    "answer": "4",
    "concept": "'The wages of sin is death' एक प्रसिद्ध बाइबिल संबंधी कहावत है जहाँ 'wages' का अर्थ 'परिणाम/फल' (result/consequence) होता है और यह Singular Verb 'is' लेता है।",
    "elimination_logic": "विकल्प 1 में दो अलग व्यक्ति हैं ('The President and the Secretary'), अतः 'were' होना चाहिए। विकल्प 2 में 'as well as' के कारण 'Patience' के अनुसार 'is' होना चाहिए। विकल्प 3 में निकटतम कर्ता 'his friends' (Plural) होने से 'have' आना चाहिए।"
  },
  {
    "id": 42,
    "exam": "Grade 2nd Sanskrit dpt. 2025",
    "question": "Choose the sentence with the correct subject-verb agreement -",
    "options": {
      "1": "The Committee have made its decision.",
      "2": "The Committee has made its decision.",
      "3": "The Committee has made their decision.",
      "4": "The Committee have made their decision."
    },
    "answer": "2",
    "concept": "जब Collective Noun (Committee) एक इकाई (Unitary body) के रूप में सर्वसम्मति से निर्णय लेती है, तो क्रिया (has) और सर्वनाम (its) दोनों Singular होते हैं।",
    "elimination_logic": "विकल्प 1 में Plural verb 'have' के साथ Singular pronoun 'its' का असंगत मेल है। विकल्प 3 में 'has' के साथ 'their' का असंगत मेल है।"
  },
  {
    "id": 43,
    "exam": "Grade 2nd Sanskrit dpt. 2025",
    "question": "Which sentence has the correct subject-verb agreement?",
    "options": {
      "1": "Neither of the boys has completed their homework.",
      "2": "Neither of the boys has completed his homework.",
      "3": "Neither of the boys have completed their homework.",
      "4": "Neither of the boy has completed their homework."
    },
    "answer": "2",
    "concept": "'Neither of + Plural Noun' औपचारिक व्याकरण में Singular माना जाता है, इसलिए इसके साथ Singular Verb 'has' और Singular Pronoun 'his' का ही प्रयोग होता है।",
    "elimination_logic": "विकल्प 1 में 'has' के साथ Plural pronoun 'their' गलत है। विकल्प 4 में 'of the' के बाद 'boy' (Singular) लिखना व्याकरण की दृष्टि से अशुद्ध है।"
  },
  {
    "id": 44,
    "exam": "Grade 2nd Sanskrit dpt. 2025",
    "question": "Fill in the blank with the Verb that agrees with the subject in the sentence below-\nThe hammer and sickle ..... from a tall flag post.",
    "options": {
      "1": "was flew",
      "2": "is flying",
      "3": "was flying",
      "4": "has flew"
    },
    "answer": "2",
    "concept": "'Hammer and sickle' एक संयुक्त प्रतीक (Single emblem/symbol) को दर्शाता है, अतः यह Singular Subject है और Singular Verb लेता है। आधिकारिक कुंजी के अनुसार 'is flying' मान्य किया गया है।",
    "elimination_logic": "'was flew' और 'has flew' दोनों अशुद्ध रूप हैं ('flew' V2 है, जबकि passive में V3 'flown' चाहिए)।"
  },
  {
    "id": 45,
    "exam": "NHM Pharma Assistant 2025",
    "question": "Choose the sentence that is grammatically correct:",
    "options": {
      "A": "Neither the students nor the teachers has completed his work.",
      "B": "Neither the students nor the teacher have completed their work.",
      "C": "Neither the students nor the teacher has completed the work.",
      "D": "Neither the students nor the teacher have completed its work."
    },
    "answer": "C",
    "concept": "'Neither... nor' में क्रिया निकटतम कर्ता के अनुसार आती है। 'the teacher' (Singular) होने के कारण Singular Verb 'has completed' सही है।",
    "elimination_logic": "विकल्प B और D में 'the teacher' के साथ plural verb 'have' लगाई गई है जो अशुद्ध है। विकल्प A में 'teachers' (Plural) के साथ 'has' लगाया गया है।"
  },
  {
    "id": 46,
    "exam": "PTET 2 years 2025",
    "question": "Identify the sentence with correct subject verb concord-",
    "options": {
      "A": "He go to temple every morning.",
      "B": "They plays chess every night.",
      "C": "The ironsmith beats the iron daily.",
      "D": "They will study yesterday."
    },
    "answer": "C",
    "concept": "Third Person Singular Subject ('The ironsmith') के साथ Present Indefinite में V1 + s/es ('beats') का प्रयोग होता है।",
    "elimination_logic": "विकल्प A में 'He' के साथ 'goes' होना चाहिए। विकल्प B में 'They' के साथ 'play' होना चाहिए। विकल्प D में 'yesterday' के साथ 'will study' काल दोष (tense error) है।"
  },
  {
    "id": 47,
    "exam": "BSTC Paper-2024",
    "question": "Select the part of the sentence that contains grammatical error -\nNew furniture were ordered for the primary classes.",
    "options": {
      "A": "for the",
      "B": "primary classes",
      "C": "New furniture",
      "D": "were ordered"
    },
    "answer": "D",
    "concept": "'Furniture' एक Uncountable Noun है, इसका बहुवचन नहीं बनता और यह सदैव Singular Verb लेता है। अतः 'were ordered' की जगह 'was ordered' होना चाहिए।",
    "elimination_logic": "त्रुटि सहायक क्रिया 'were ordered' में है, अतः विकल्प (D) सही उत्तर है।"
  },
  {
    "id": 48,
    "exam": "संविदा लेखा सहायक भर्ती परीक्षा 2024",
    "question": "Fill in the blanks with the most appropriate pair of words:\nBread and butter ..... a soldier's food while honour and glory ..... the reward he awaits.",
    "options": {
      "A": "are, are",
      "B": "was, is",
      "C": "is, is",
      "D": "is, were",
      "E": "Question not attempted"
    },
    "answer": "C",
    "concept": "जब 'and' से जुड़ी दो संज्ञाएँ मिलकर एक ही वस्तु, आहार या अमूर्त विचार व्यक्त करती हैं (जैसे Bread and butter = भोजन, Honour and glory = एक पुरस्कार), तो दोनों के साथ Singular Verb का प्रयोग होता है।",
    "elimination_logic": "'food' और 'the reward' दोनों पूरक शब्द (complements) एकवचन हैं, जो स्पष्ट करते हैं कि दोनों खंडों में 'is, is' ही आएगा।"
  },
  {
    "id": 49,
    "exam": "Grade 2nd Sanskrit dpt. 2025",
    "question": "Fill in the blank with the correct option:\nEither you or she ..... presenting a paper.",
    "options": {
      "1": "is",
      "2": "is to",
      "3": "are",
      "4": "is being"
    },
    "answer": "1",
    "concept": "'Either... or' में क्रिया निकटतम कर्ता ('she' - Singular) के अनुसार Singular होगी। Continuous tense में 'is presenting' शुद्ध रूप है।",
    "elimination_logic": "'are' निकटतम कर्ता के अनुसार नहीं है। 'is to' के बाद V1 आता है (presenting नहीं)। अतः 'is' सही है।"
  },
  {
    "id": 50,
    "exam": "REET (L1) 2024",
    "question": "..... is an incorrect sentence.",
    "options": {
      "A": "He loved his work.",
      "B": "It would be his last work.",
      "C": "His arms grown heavy.",
      "D": "He worked till his hands began to tremble."
    },
    "answer": "C",
    "concept": "अंग्रेजी वाक्य संरचना में Past Participle (grown - V3) बिना किसी सहायक क्रिया (auxiliary verb जैसे had/were) के मुख्य क्रिया के रूप में सीधा प्रयुक्त नहीं हो सकता। यहाँ 'grew' (V2) होना चाहिए।",
    "elimination_logic": "विकल्प C में फाइनाइट वर्ब (finite verb) गायब होने के कारण वाक्य व्याकरण की दृष्टि से अमान्य है।"
  },
  {
    "id": 51,
    "exam": "BSTC Paper-2025",
    "question": "Which of the following sentence is not correct?",
    "options": {
      "A": "We had swum across the river before the sunset.",
      "B": "The bus was hired by the ladies for its picnic.",
      "C": "Our country needs a number of self-sacrificing and devoted political leaders.",
      "D": "At last he was married to a poor girl."
    },
    "answer": "B",
    "concept": "Pronoun-Antecedent Agreement: यहाँ पिकनिक 'the ladies' (Plural, सजीव) की है, इसलिए सर्वनाम 'its' (निर्जीव/एकवचन) का प्रयोग गलत है; इसके स्थान पर 'their' होना चाहिए।",
    "elimination_logic": "विकल्प B में सर्वनाम संबंधी अशुद्धि होने के कारण यह वाक्य सही नहीं है।"
  },
  {
    "id": 52,
    "exam": "BSTC Paper-2025",
    "question": "Which is a correct sentence?",
    "options": {
      "A": "I worked hard that fails.",
      "B": "Failure resulted by working long.",
      "C": "She and her mother is late.",
      "D": "She as well as her brother is late."
    },
    "answer": "D",
    "concept": "'as well as' से जुड़ने पर क्रिया प्रथम कर्ता ('She' - Singular) के अनुसार Singular 'is' होती है।",
    "elimination_logic": "विकल्प C में 'and' से दो कर्ता जुड़े हैं, अतः 'are' होना चाहिए था। विकल्प A और B व्याकरण और अर्थ की दृष्टि से असंगत हैं।"
  },
  {
    "id": 53,
    "exam": "BSTC Paper-2025",
    "question": "Which of the following sentences is correct?",
    "options": {
      "A": "They decided to talk it over at dinner.",
      "B": "He picked up the books and put it on the table.",
      "C": "He will not escape punishment unless he does not speak the truth.",
      "D": "Milk is the most perfect food in the world."
    },
    "answer": "A",
    "concept": "'Talk it over' एक मान्य Phrasal Verb है जिसका अर्थ किसी विषय पर चर्चा करना होता है।",
    "elimination_logic": "विकल्प B में 'books' (Plural) के लिए सर्वनाम 'it' लगाया गया है (them होना चाहिए)। विकल्प C में 'unless' के साथ 'does not' का दोहरा नकारात्मक प्रयोग (double negative) गलत है।"
  },
  {
    "id": 54,
    "exam": "Conductor Exam 2025",
    "question": "Choose the correct pairs from the options given below:\n(a) Thief - thieves\n(b) Loaf - Loafs\n(c) Piano - Pianoes\n(d) Lorry - Lorries\n(e) Syllabus - Syllabi",
    "options": {
      "A": "(c), (d) and (e) Only",
      "B": "(a), (b) and (c) Only",
      "C": "(b), (c) and (d) Only",
      "D": "(a), (d) and (e) Only",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "संज्ञाओं के बहुवचन रूप: Thief -> thieves, Lorry -> lorries, Syllabus -> syllabi मान्य हैं।",
    "elimination_logic": "'Loaf' का बहुवचन 'loaves' होता है (Loafs गलत है) और 'Piano' का 'pianos' होता है (Pianoes गलत है)। अतः (b) और (c) अशुद्ध हैं।"
  },
  {
    "id": 55,
    "exam": "Raj. Assistant Professor 2025",
    "question": "Fill in the correct form of the Noun:\nOur ..... are wearing their new jerseys.",
    "options": {
      "a": "team's",
      "b": "team",
      "c": "teamings",
      "d": "teems",
      "e": "Question not attempted"
    },
    "answer": "b",
    "concept": "Collective Noun 'team' जब अपने अलग-अलग सदस्यों के रूप में कार्य करती है (Noun of Multitude - 'their new jerseys' से स्पष्ट है), तो यह बहुवचन क्रिया 'are' लेती है, परंतु संज्ञा का रूप 'team' ही रहता है।",
    "elimination_logic": "'team's' संबंध कारक (Possessive) है जिसकी यहाँ आवश्यकता नहीं है। 'teamings' कोई शब्द नहीं है और 'teems' एक क्रिया (verb) है।"
  },
  {
    "id": 56,
    "exam": "REET Mains/Grade 3rd L-2 2026",
    "question": "Pick the correct form of possessive case:",
    "options": {
      "A": "The table's leg",
      "B": "Childrens' books",
      "C": "Girls' school",
      "D": "The Bhutan's King's Visit",
      "E": "Question not attempted"
    },
    "answer": "C",
    "concept": "बहुवचन शब्द जो '-s' पर समाप्त होते हैं, उनमें सम्बन्ध कारक (Possessive) दर्शाने के लिए केवल अंत में apostrophe (') लगाया जाता है (Girls -> Girls')।",
    "elimination_logic": "निर्जीव वस्तुओं के साथ apostrophe s नहीं लगता ('The leg of the table' सही होता)। 'Children' में 's' नहीं होता, अतः 'Children's' लिखा जाता है।"
  },
  {
    "id": 57,
    "exam": "REET Mains/Grade 3rd L-2 2026",
    "question": "Identify the incorrect form of word:\nBEGIN\n(a) Beginning (gerund)\n(b) Beginner (noun)\n(c) Beginning (noun)\n(d) Began (participle)\n(e) Begun (past participle)",
    "options": {
      "A": "(b), (c) only",
      "B": "(a), (c) only",
      "C": "(d), (e) only",
      "D": "(d) only",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "'Began' क्रिया का Past Tense (V2) रूप है, यह Participle (कृदंत) नहीं है। Past Participle रूप 'Begun' (V3) होता है।",
    "elimination_logic": "केवल (d) में 'Began' को participle कहा गया है जो व्याकरण सम्मत नहीं है।"
  },
  {
    "id": 58,
    "exam": "REET Mains/Grade 3rd L-2 2026",
    "question": "He said, \"no sooner, .....\n(a) the station\n(b) reached\n(c) I\n(d) had\n(e) than the train departed.\"",
    "options": {
      "A": "(d), (c), (b), ( ), (a)",
      "B": "(c), (d), (b), (a), (e)",
      "C": "(d), (c), (b), (a), (e)",
      "D": "(c), (d), (b), (e), (a)",
      "E": "Question not attempted"
    },
    "answer": "C",
    "concept": "नियम: 'No sooner' से वाक्य शुरू होने पर Inversion होता है (No sooner + had + Subject + V3 + object + than...)।",
    "elimination_logic": "क्रम 'had (d) + I (c) + reached (b) + the station (a) + than the train departed (e)' बनेगा।"
  },
  {
    "id": 59,
    "exam": "REET Mains/Grade 3rd L-2 2026",
    "question": "I begged .....\n(a) some\n(b) of\n(c) for\n(d) him\n(e) rice",
    "options": {
      "A": "(b), (d), (c), (a), (e)",
      "B": "(c), (a), (e), (b), (d)",
      "C": "(d), (c), (a), (b), (e)",
      "D": "(a), (b), (e), (c), (d)",
      "E": "Question not attempted"
    },
    "answer": "A",
    "concept": "मानक मुहावरेदार प्रयोग: 'to beg of someone for something'। क्रम होगा: begged of (b) + him (d) + for (c) + some (a) + rice (e)।",
    "elimination_logic": "संरचना 'begged of him for some rice' विकल्प (A) के क्रम को संतुष्ट करती है।"
  },
  {
    "id": 60,
    "exam": "REET Mains/Grade 3rd L-2 2026",
    "question": "Fill in the blank with correct option:\nThe news ..... true. The ship, with its crew, ..... lost.",
    "options": {
      "A": "are, was",
      "B": "is, were",
      "C": "are, were",
      "D": "is, was",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "'News' Uncountable Noun होने के कारण 'is' लेगा। दूसरे वाक्य में 'with its crew' मुख्य कर्ता 'The ship' (Singular) को नहीं बदलता, अतः क्रिया 'was' आएगी।",
    "elimination_logic": "दोनों ही रिक्त स्थानों में Singular Verbs (is, was) की आवश्यकता है, जो केवल विकल्प (D) में उपलब्ध है।"
  },
  {
    "id": 61,
    "exam": "1st grade (English) 2026",
    "question": "Fill in the blank with appropriate verb in agreement with its subject -\nMany a man ..... done so.",
    "options": {
      "1": "have",
      "2": "had",
      "3": "having",
      "4": "has",
      "5": "Question not attempted"
    },
    "answer": "4",
    "concept": "नियम: 'Many a + Singular Noun + Singular Verb'। अतः 'Many a man' के साथ 'has' का प्रयोग होगा।",
    "elimination_logic": "'have' बहुवचन है। सामान्य वर्तमान पूर्ण काल (Present Perfect) के संदर्भ में 'has' सर्वाधिक उपयुक्त विकल्प है।"
  },
  {
    "id": 62,
    "exam": "1st grade (English) 2026",
    "question": "Fill in the blank with the correct option -\nOne in ten ..... drugs.",
    "options": {
      "1": "take",
      "2": "has taken",
      "3": "takes",
      "4": "does take",
      "5": "Question not attempted"
    },
    "answer": "3",
    "concept": "'One in ten' या 'One out of ten' में मुख्य कर्ता 'One' (Singular) होता है, जिसके साथ Singular Verb (V1 + s/es) का प्रयोग होता है।",
    "elimination_logic": "'ten' को देखकर 'take' (Plural) चुनना आम गलती है। नियमित आदत/तथ्य दर्शाने के लिए Present Indefinite में 'takes' शुद्ध है।"
  },
  {
    "id": 63,
    "exam": "LDC 2026",
    "question": "Select the most appropriate plural of 'child'.",
    "options": {
      "A": "Childs",
      "B": "Childrens",
      "C": "Children",
      "D": "Childes",
      "E": "Question not attempted"
    },
    "answer": "C",
    "concept": "'Child' का Irregular Plural रूप 'Children' होता है।",
    "elimination_logic": "'Childs', 'Childrens' और 'Childes' अमान्य शब्द रूप हैं।"
  },
  {
    "id": 64,
    "exam": "LDC 2026",
    "question": "Which of the following sentences are grammatically correct?\na. Each of the players was given a prize.\nb. Each of the players were given a prize.\nc. Each player was given a prize.\nd. Each players was given a prize.",
    "options": {
      "A": "a and d",
      "B": "a and c",
      "C": "a, c and d",
      "D": "b only",
      "E": "Question not attempted"
    },
    "answer": "B",
    "concept": "'Each of the + Plural Noun + Singular Verb' (वाक्य a सही है)। 'Each + Singular Noun + Singular Verb' (वाक्य c सही है)।",
    "elimination_logic": "वाक्य b में 'were' (Plural verb) गलत है। वाक्य d में 'Each' के तुरंत बाद 'players' (Plural noun) का प्रयोग गलत है।"
  },
  {
    "id": 65,
    "exam": "LDC 2026",
    "question": "Select the sentences that are grammatically correct.\na. Hardly he had reached the station when the train left.\nb. Hardly had he reached the station when the train left.\nc. The train left before he reached the station hardly.\nd. No sooner had he reached the station than the train left.",
    "options": {
      "A": "a, c and d",
      "B": "b, c and d",
      "C": "a, b and d",
      "D": "b and d",
      "E": "Question not attempted"
    },
    "answer": "D",
    "concept": "नकारात्मक संयोजनों (Hardly/No sooner) से वाक्य प्रारंभ होने पर Inversion (Auxiliary verb + Subject) अनिवार्य होता है। Hardly के साथ 'when' और No sooner के साथ 'than' का जोड़ा बनता है।",
    "elimination_logic": "वाक्य a में inversion नहीं हुआ है (Hardly he had गलत है)। वाक्य c में Hardly का स्थान अनुचित है। अतः केवल b और d सही हैं।"
  },
  {
    "id": 66,
    "exam": "PTET 2026",
    "question": "Rohit as well as my sister ..... in college now.",
    "options": {
      "A": "am",
      "B": "is",
      "C": "are",
      "D": "has"
    },
    "answer": "B",
    "concept": "'as well as' से जुड़ने पर क्रिया प्रथम कर्ता ('Rohit' - Singular) के अनुसार प्रयुक्त होती है।",
    "elimination_logic": "'Rohit' एकवचन है, अतः 'is' सही है। 'has' के बाद 'in college' स्थिति नहीं दर्शाता।"
  },
  {
    "id": 67,
    "exam": "PTET 2026",
    "question": "Add suitable form of \"Be\" Verb -\nNeither Seema nor Mohan ..... there.",
    "options": {
      "A": "was",
      "B": "were",
      "C": "being",
      "D": "been"
    },
    "answer": "A",
    "concept": "'Neither... nor' में निकटतम कर्ता 'Mohan' (Singular) होने के कारण क्रिया एकवचन 'was' होगी।",
    "elimination_logic": "'were' बहुवचन है। 'being' और 'been' बिना सहायक क्रिया के मुख्य क्रिया नहीं बन सकते।"
  },
  {
    "id": 68,
    "exam": "2nd grade English, 17.07.2026",
    "question": "Which of the following countable nouns have the same form for both singular and plural?\ni. sheep\nii. bison\niii. mouse\niv. salmon",
    "options": {
      "1": "Only ii",
      "2": "i and ii",
      "3": "ii and iii",
      "4": "i, ii and iv",
      "5": "Question not attempted"
    },
    "answer": "4",
    "concept": "Sheep, bison और salmon ऐसी संज्ञाएँ हैं जिनका एकवचन और बहुवचन रूप समान रहता है।",
    "elimination_logic": "'mouse' का बहुवचन 'mice' होता है (समान नहीं रहता)। अतः iii को छोड़कर शेष सभी (i, ii, iv) सही हैं।"
  },
  {
    "id": 69,
    "exam": "2nd grade English, 17.07.2026",
    "question": "Choose the correct sentences from the options given below:\nA. He gave me an advice.\nB. He gave me some advice.\nC. The sceneries here are very good.\nD. The scenery here is very good.",
    "options": {
      "1": "B and D",
      "2": "A and D",
      "3": "C and D",
      "4": "A and C",
      "5": "Question not attempted"
    },
    "answer": "1",
    "concept": "'Advice' और 'Scenery' दोनों Uncountable Nouns हैं। इनके साथ 'an' या बहुवचन '-ies' (sceneries) का प्रयोग अमान्य है।",
    "elimination_logic": "वाक्य A में 'an advice' गलत है। वाक्य C में 'sceneries' गलत है। इसलिए केवल B और D शुद्ध हैं।"
  }
];

const rawBlock3 = [
  {
    "id": 70,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank with the correct option:\nNeither the teacher nor the students ..... convinced by the new grading policy.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'Neither... nor' संयोजन में क्रिया हमेशा निकटतम कर्ता (Proximity rule) के अनुसार आती है। यहाँ रिक्त स्थान के सबसे करीब 'the students' (Plural Noun) है, अतः Plural Verb का प्रयोग होगा।",
    "elimination_logic": "'was', 'is' और 'has been' तीनों Singular Verbs हैं। निकटतम कर्ता बहुवचन होने के कारण केवल 'were' ही व्याकरण सम्मत है।"
  },
  {
    "id": 71,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the grammatically correct option:\nNot only the principal but also the lecturers ..... present at the seminar.",
    "options": {
      "a": "was",
      "b": "is",
      "c": "were",
      "d": "has been"
    },
    "answer": "c",
    "concept": "'Not only... but also' में भी क्रिया 'but also' के बाद आने वाले निकटतम कर्ता के अनुसार तय होती है। 'lecturers' बहुवचन है, अतः Plural Verb आएगी।",
    "elimination_logic": "'principal' (Singular) को देखकर 'was' या 'is' लगाना परीक्षार्थी के लिए मुख्य ट्रैप है। नियम निकटतम कर्ता का है।"
  },
  {
    "id": 72,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nMore than one officer ..... found guilty of negligence in duty.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "नियम: 'More than one + Singular Noun + Singular Verb'। भले ही अर्थ बहुवचन का निकले, वाक्य का रूप (form) एकवचन का होता है।",
    "elimination_logic": "परीक्षार्थी अर्थ 'एक से अधिक' समझकर 'were' चुनते हैं, परंतु व्याकरणिक रूप से 'More than one officer was' ही मान्य है।"
  },
  {
    "id": 73,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nMore officers than one ..... involved in the scandal.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has been"
    },
    "answer": "b",
    "concept": "नियम: 'More + Plural Noun + than one + Plural Verb'। यहाँ मुख्य कर्ता 'More officers' है, अतः क्रिया बहुवचन होगी।",
    "elimination_logic": "रिक्त स्थान से ठीक पहले 'one' देखकर छात्र 'was' चुन लेते हैं, जबकि मुख्य कर्ता 'More officers' बहुवचन है।"
  },
  {
    "id": 74,
    "exam": "RPSC / REET Target Mock",
    "question": "Select the correct option:\nThe percentage of successful candidates ..... increased significantly this year.",
    "options": {
      "a": "have",
      "b": "has",
      "c": "are",
      "d": "were"
    },
    "answer": "b",
    "concept": "'The percentage of' के बाद चाहे Noun plural हो, मुख्य कर्ता 'percentage' (एकवचन) होता है और यह हमेशा Singular Verb लेता है। (नोट: केवल 'A percent of' में संज्ञा के अनुसार क्रिया बदलती है)।",
    "elimination_logic": "'candidates' बहुवचन होने के बावजूद कर्ता 'The percentage' है, अतः 'have/are/were' सीधे बाहर हो जाते हैं।"
  },
  {
    "id": 75,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nTen percent of the equipment ..... damaged during transit.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "प्रतिशत या अंश (Percentage / Fraction) वाले वाक्यों में 'of' के बाद आने वाली संज्ञा के अनुसार क्रिया आती है। 'Equipment' एक Uncountable Noun है, अतः क्रिया Singular होगी।",
    "elimination_logic": "'Ten percent' देखकर छात्र बहुवचन समझ लेते हैं, लेकिन मात्रा Uncountable Noun (equipment) की है।"
  },
  {
    "id": 76,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nA number of rare artifacts ..... stolen from the museum.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'A number of + Plural Noun' का अर्थ 'कई' (Many) होता है, इसलिए यह हमेशा Plural Verb लेता है।",
    "elimination_logic": "'The number of' निश्चित संख्या दर्शाता है और Singular लेता है, जबकि 'A number of' अनिश्चित बहुवचन दर्शाता है और Plural लेता है।"
  },
  {
    "id": 77,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct verb:\nThe number of applicants for the post ..... astonishingly high.",
    "options": {
      "a": "were",
      "b": "is",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "'The number of + Plural Noun' एक निश्चित संख्या (Single figure) को दर्शाता है, अतः यह Singular Verb लेता है।",
    "elimination_logic": "'applicants' को देखकर 'are/were' चुनना गलत है। मुख्य कर्ता 'The number' (एकवचन) है।"
  },
  {
    "id": 78,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nHe is one of the doctors who ..... relentlessly for poor patients.",
    "options": {
      "a": "works",
      "b": "work",
      "c": "working",
      "d": "is working"
    },
    "answer": "b",
    "concept": "Relative Pronoun (who/which/that) के बाद आने वाली क्रिया उसके पूर्ववर्ती (Antecedent) के अनुसार होती है। यहाँ 'who' का Antecedent 'doctors' (Plural) है, अतः Plural Verb 'work' (V1) आएगी।",
    "elimination_logic": "शुरुआत में 'He is one' देखकर छात्र 'works' चुनते हैं, लेकिन Relative Pronoun 'who' यहाँ 'doctors' को संदर्भित करता है।"
  },
  {
    "id": 79,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nThis is the only one of his books that ..... worth reading.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "were",
      "d": "have been"
    },
    "answer": "a",
    "concept": "यदि 'one of' से पहले 'the only' लग जाए ('the only one of... that'), तो Relative Pronoun के बाद क्रिया हमेशा Singular होती है क्योंकि बात केवल उस एकमात्र वस्तु की हो रही है।",
    "elimination_logic": "'books' प्लूरल होने पर भी 'the only one' के विशिष्ट नियम के तहत क्रिया 'is' होगी।"
  },
  {
    "id": 80,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nEach boy and each girl ..... given a certificate of merit.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "यदि दो संज्ञाएँ 'and' से जुड़ी हों और दोनों के आगे 'Each' या 'Every' लगा हो, तो पूरा संयुक्त कर्ता एकवचन माना जाता है और Singular Verb लेता है।",
    "elimination_logic": "दो संज्ञाएँ 'and' से जुड़ी देखकर 'were' या 'are' लगाना गलत है। 'Each' का प्रभाव क्रिया को Singular बनाता है।"
  },
  {
    "id": 81,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct sentence:",
    "options": {
      "a": "The jury was divided in their opinions regarding the verdict.",
      "b": "The jury were divided in their opinions regarding the verdict.",
      "c": "The jury has divided in their opinions regarding the verdict.",
      "d": "The jury were divided in its opinion regarding the verdict."
    },
    "answer": "b",
    "concept": "जब Collective Noun (Jury) के सदस्य परस्पर विभाजित हों (Noun of Multitude), तो क्रिया और Pronoun दोनों Plural होते हैं ('were divided' और 'their opinions')।",
    "elimination_logic": "(a) में 'was' (Singular) और 'their' (Plural) का विरोधाभास है। (d) में 'were' (Plural) के साथ 'its' (Singular) का गलत मेल है।"
  },
  {
    "id": 82,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nFifty miles ..... a long distance to travel on foot.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "were",
      "d": "seem"
    },
    "answer": "b",
    "concept": "दूरी, वजन, राशि या समय की निश्चित इकाई जब समग्र रूप से एक मात्रा (Single unit) समझी जाए, तो क्रिया Singular होती है। 'a long distance' (पूरक) इसका स्पष्ट प्रमाण है।",
    "elimination_logic": "'miles' बहुवचन देखकर 'are' या 'seem' चुनना परीक्षा का सामान्य ट्रैप है।"
  },
  {
    "id": 83,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nThe rich ..... not always happy with their lavish lifestyle.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'The + Adjective' (जैसे The rich, The poor, The blind) उस पूरे वर्ग या समुदाय के लोगों को दर्शाता है और यह Plural Noun की तरह कार्य करता है, अतः क्रिया Plural आएगी।",
    "elimination_logic": "'The rich' दिखने में एकवचन जैसा लगता है परंतु यह 'all rich people' को व्यक्त करता है, अतः 'is' गलत है।"
  },
  {
    "id": 84,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct option:\nThe police ..... investigating the sudden disappearance of the documents.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'Police', 'Cattle', 'Gentry', 'Poultry', 'Peasantry' ऐसे संज्ञा शब्द हैं जो बिना '-s' के भी हमेशा बहुवचन होते हैं और Plural Verb लेते हैं।",
    "elimination_logic": "'Police' को छात्र एक विभाग समझकर 'is' लगा देते हैं, जबकि व्याकरण में 'Police' Plural Subject है।"
  },
  {
    "id": 85,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nNone of the counterfeit money ..... recovered by the enforcement team.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "'None of + Uncountable Noun' के साथ हमेशा Singular Verb का प्रयोग होता है। 'Money' एक Uncountable Noun है।",
    "elimination_logic": "'None' को देखकर कई छात्र 'were' लगा देते हैं, परंतु 'money' अगणनीय होने के कारण 'was' ही सही है।"
  },
  {
    "id": 86,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nNone of the tourists ..... willing to change their schedule.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'None of + Plural Countable Noun' के साथ जब संदर्भ बहुवचन व्यक्तियों का हो और आगे सर्वनाम 'their' आया हो, तो Plural Verb 'were' उपयुक्त और मानक होती है।",
    "elimination_logic": "वाक्य में आगे 'their schedule' का प्रयोग स्पष्ट करता है कि कर्ता को बहुवचन माना गया है, अतः 'were' सही उत्तर है।"
  },
  {
    "id": 87,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nTwo-thirds of the heritage building ..... completely renovated.",
    "options": {
      "a": "has been",
      "b": "have been",
      "c": "were",
      "d": "are"
    },
    "answer": "a",
    "concept": "भिन्न (Fraction) के बाद यदि 'of' के साथ Singular Noun ('the heritage building') आए, तो क्रिया Singular होती है।",
    "elimination_logic": "'Two-thirds' देखकर छात्र भ्रमित होकर Plural Verb चुनते हैं, लेकिन यह एक ही इमारत का हिस्सा है।"
  },
  {
    "id": 88,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nThree-fourths of the questions ..... extremely challenging.",
    "options": {
      "a": "is",
      "b": "was",
      "c": "were",
      "d": "has been"
    },
    "answer": "c",
    "concept": "भिन्न (Fraction) के बाद यदि 'of' के साथ Plural Countable Noun ('the questions') आए, तो क्रिया Plural होती है।",
    "elimination_logic": "'questions' गणनीय बहुवचन है, अतः Singular Verbs (is, was, has been) सभी खारिज हो जाते हैं।"
  },
  {
    "id": 89,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct verb form:\nSlow and steady ..... the race.",
    "options": {
      "a": "win",
      "b": "wins",
      "c": "won",
      "d": "are winning"
    },
    "answer": "b",
    "concept": "जब दो शब्द मिलकर एक ही गुण या संयुक्त धारणा (Single concept) बनाते हैं, तो वे एकवचन माने जाते हैं और V1 + s/es लेते हैं।",
    "elimination_logic": "यह एक सार्वभौमिक कहावत है, 'win' (Plural) नहीं आ सकता। वर्तमान आदत/नियम दर्शाने के लिए 'wins' सही है।"
  },
  {
    "id": 90,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nTime and tide ..... for none.",
    "options": {
      "a": "wait",
      "b": "waits",
      "c": "is waiting",
      "d": "waited"
    },
    "answer": "a",
    "concept": "पारंपरिक और आधुनिक व्याकरण में 'Time' और 'Tide' दो अलग-अलग प्राकृतिक शक्तियों के रूप में देखे जाते हैं, अतः मानक रूप में Plural Verb 'wait' का प्रयोग सर्वमान्य है।",
    "elimination_logic": "यद्यपि कुछ पुरानी पुस्तकों में 'waits' मिलता है, प्रमुख प्रतियोगी परीक्षाओं में 'wait' को ही सही कुंजी माना जाता है क्योंकि दोनों स्वतंत्र सत्ताएँ हैं।"
  },
  {
    "id": 91,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nDrinking and driving ..... a major cause of highway accidents.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "were",
      "d": "have been"
    },
    "answer": "b",
    "concept": "दो Gerunds (Drinking and driving) जब एक ही संयुक्त कृत्य/अपराध का बोध कराते हैं, तो वे Singular Subject माने जाते हैं।",
    "elimination_logic": "'a major cause' (Singular Complement) यह सिद्ध करता है कि दोनों क्रियाएँ अलग-अलग नहीं, बल्कि एक अपराध के रूप में 'is' लेंगी।"
  },
  {
    "id": 92,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nThe Arabian Nights ..... still widely appreciated across the globe.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "were",
      "d": "have been"
    },
    "answer": "b",
    "concept": "किसी पुस्तक, उपन्यास या फिल्म का शीर्षक (Title) भले ही बहुवचन रूप में हो (Nights), वह एक ही कृति को दर्शाता है, अतः Singular Verb लेता है।",
    "elimination_logic": "'Nights' बहुवचन देखकर 'are/were' लगाना परीक्षक का जाल है। पुस्तक का नाम होने से 'is' सही है।"
  },
  {
    "id": 93,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nHis mathematics ..... remarkably sharp, enabling him to solve complex problems effortlessly.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "has been"
    },
    "answer": "b",
    "concept": "जब किसी विषय (Mathematics, Statistics, Politics) के पहले Possessive Adjective (his, my, their) या Article 'the' लग जाए, तो उसका अर्थ विषय न रहकर 'गणनाएँ' या 'सिद्धांत' हो जाता है और यह Plural Verb लेता है।",
    "elimination_logic": "सामान्यतः 'Mathematics is a tough subject' होता है, परंतु 'His mathematics' का अर्थ 'his calculations' है, अतः 'are' सही है।"
  },
  {
    "id": 94,
    "exam": "RPSC / REET Target Mock",
    "question": "Select the correct option:\nThe acoustics of this modern auditorium ..... exceptional.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'Acoustics' जब किसी कमरे या हॉल की ध्वनि विशेषताओं (Acoustic properties) को दर्शाता है, तो यह हमेशा Plural Verb लेता है।",
    "elimination_logic": "केवल एक वैज्ञानिक विषय के रूप में यह Singular होता है। भवन की ध्वनि-गुणवत्ता के रूप में 'are' ही मान्य है।"
  },
  {
    "id": 95,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nA pair of scissors ..... kept in the upper drawer of the desk.",
    "options": {
      "a": "were",
      "b": "is",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "यद्यपि 'Scissors' हमेशा बहुवचन होता है, लेकिन यदि उसके आगे 'A pair of' जुड़ जाए, तो कर्ता 'A pair' (एकवचन) बन जाता है और Singular Verb लेता है।",
    "elimination_logic": "केवल 'Scissors' होता तो 'are' आता, लेकिन 'A pair of' के कारण 'is' सही है।"
  },
  {
    "id": 96,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct verb:\nAll the apparatus ..... thoroughly sanitized before the experiment.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has"
    },
    "answer": "a",
    "concept": "'Apparatus' मानक अंग्रेजी में मुख्य रूप से Uncountable Noun के रूप में प्रयुक्त होता है (उपकरण/सामग्री), अतः 'All the apparatus' के साथ Singular Verb 'was' का प्रयोग मान्य है।",
    "elimination_logic": "'Apparatus' का बहुवचन रूप भी 'apparatus' या 'apparatuses' हो सकता है, लेकिन सामूहिक सामग्री के अर्थ में Singular Verb को प्राथमिकता दी जाती है।"
  },
  {
    "id": 97,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nPlenty of milk ..... required to prepare sweets for the festival.",
    "options": {
      "a": "are",
      "b": "were",
      "c": "is",
      "d": "have been"
    },
    "answer": "c",
    "concept": "'Plenty of / A lot of' के बाद यदि Uncountable Noun ('milk') आए, तो क्रिया Singular होती है।",
    "elimination_logic": "'Plenty of' गणनीय संज्ञा के साथ Plural और अगणनीय संज्ञा के साथ Singular लेता है। दूध अगणनीय है, अतः 'is' सही है।"
  },
  {
    "id": 98,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nPlenty of job opportunities ..... available in the IT sector.",
    "options": {
      "a": "is",
      "b": "are",
      "c": "was",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'Plenty of + Plural Countable Noun' ('job opportunities') के साथ Plural Verb 'are' का प्रयोग होता है।",
    "elimination_logic": "'opportunities' गणनीय बहुवचन है, अतः Singular क्रियाएँ (is, was, has been) स्वतः हट जाती हैं।"
  },
  {
    "id": 99,
    "exam": "RPSC / REET Target Mock",
    "question": "Identify the correct option:\nThe commander, accompanied by his troops, ..... successfully captured the fort.",
    "options": {
      "a": "have",
      "b": "has",
      "c": "were",
      "d": "are"
    },
    "answer": "b",
    "concept": "जब कर्ता 'accompanied by', 'together with', 'in addition to' से जुड़ा हो, तो क्रिया प्रथम कर्ता ('The commander' - Singular) के अनुसार आती है।",
    "elimination_logic": "'his troops' (Plural) को देखकर 'have/were' चुनना गलत है। मुख्य कर्ता 'The commander' होने से 'has' आएगा।"
  },
  {
    "id": 100,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nMany a soldier ..... laid down their life for the country.",
    "options": {
      "a": "have",
      "b": "has",
      "c": "were",
      "d": "are"
    },
    "answer": "b",
    "concept": "नियम: 'Many a + Singular Countable Noun + Singular Verb'। अतः 'Many a soldier' के साथ 'has' आएगा।",
    "elimination_logic": "अर्थ भले ही 'अनेक' हो, परंतु संरचनात्मक रूप से 'has' ही सही है। 'have/were/are' बहुवचन रूप हैं।"
  },
  {
    "id": 101,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nA great many students ..... registered for the crash course.",
    "options": {
      "a": "has",
      "b": "have",
      "c": "is",
      "d": "was"
    },
    "answer": "b",
    "concept": "'A great many / A good many + Plural Noun' हमेशा Plural Verb लेते हैं।",
    "elimination_logic": "'Many a' के विपरीत, 'A great many' पूरी तरह बहुवचन संरचना है। अतः 'have' सही है।"
  },
  {
    "id": 102,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nNeither the quality nor the prices of the imported items ..... satisfactory.",
    "options": {
      "a": "was",
      "b": "were",
      "c": "is",
      "d": "has been"
    },
    "answer": "b",
    "concept": "'Neither... nor' में निकटतम कर्ता 'the prices' (बहुवचन) है। (नोट: 'of the imported items' केवल एक Prepositional Phrase है)। निकटतम कर्ता बहुवचन होने से क्रिया 'were' होगी।",
    "elimination_logic": "प्रथम कर्ता 'quality' को देखकर 'was' या 'is' लगाना गलत होगा क्योंकि नियम निकटतम कर्ता का है।"
  },
  {
    "id": 103,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nUnder the shady banyan tree ..... sitting an old saint.",
    "options": {
      "a": "were",
      "b": "was",
      "c": "are",
      "d": "have been"
    },
    "answer": "b",
    "concept": "Inversion Rule: जब वाक्य किसी स्थान-सूचक Prepositional Phrase से प्रारंभ हो, तो क्रिया वाक्य के वास्तविक कर्ता के अनुसार आती है जो क्रिया के बाद आता है। यहाँ वास्तविक कर्ता 'an old saint' (Singular) है।",
    "elimination_logic": "वाक्य की शुरुआत देखकर छात्र क्रिया नहीं चुन सकते। कर्ता बाद में है ('an old saint'), अतः 'was' सही है।"
  },
  {
    "id": 104,
    "exam": "RPSC / REET Target Mock",
    "question": "Choose the correct sentence:",
    "options": {
      "a": "What we urgently need are more trained teachers.",
      "b": "What we urgently need is more trained teachers.",
      "c": "What we urgently need have been more trained teachers.",
      "d": "What we urgently needs are more trained teachers."
    },
    "answer": "a",
    "concept": "'What-clause' जब पूरक (Complement) के रूप में एक Plural Noun ('more trained teachers') से जुड़ता है, तो क्रिया अक्सर बहुवचन 'are' ली जाती है।",
    "elimination_logic": "आधुनिक औपचारिक अंग्रेजी में यदि Complement बहुवचन हो, तो What-clause के साथ 'are' को प्राथमिक मानक माना जाता है।"
  },
  {
    "id": 105,
    "exam": "RPSC / REET Target Mock",
    "question": "Fill in the blank:\nNo news ..... good news.",
    "options": {
      "a": "are",
      "b": "is",
      "c": "were",
      "d": "have been"
    },
    "answer": "b",
    "concept": "'News' Uncountable Noun है और यह प्रसिद्ध कहावत 'No news is good news' में हमेशा Singular Verb लेती है।",
    "elimination_logic": "'news' के अंत में 's' देखकर बहुवचन मानना सबसे आम भूल है।"
  }
];

export const ALL_RAW_QUESTIONS = [...rawBlock1, ...rawBlock2, ...rawBlock3];
console.log(`Total questions loaded: ${ALL_RAW_QUESTIONS.length}`);
