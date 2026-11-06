const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');

function updateQuestionInFile(fileName, qId, updater) {
  const filePath = path.join(gkDir, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  const q = questions.find(x => x.id === qId);
  if (q) {
    updater(q);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${qId} in ${fileName}`);
  }
}

// 1. rg_000570 in topic_02.json
updateQuestionInFile('topic_02.json', 'rg_000570', q => {
  q.questionText = 'अरावली की निम्नलिखित चोटियों को ऊँचाई के अनुसार (उच्च से निम्न) सही क्रम में व्यवस्थित करें :';
  q.question = q.questionText;
  q.type = 'sequence';
  q.meta = {
    items: [
      { id: 'a', text: 'कुंभलगढ़' },
      { id: 'b', text: 'अचलगढ़' },
      { id: 'c', text: 'तारागढ़' },
      { id: 'd', text: 'दिलवाड़ा' }
    ]
  };
  // Heights: दिलवाड़ा (1442m, d) > अचलगढ़ (1380m, b) > कुंभलगढ़ (1224m, a) > तारागढ़ (870m, c)
  // Sequence: d, b, a, c
  q.options = [
    'd, b, a, c',
    'b, d, a, c',
    'd, a, b, c',
    'a, b, d, c'
  ];
  q.answer = 'A';
  q.explanation = 'अरावली की चोटियों की ऊँचाई (उच्च से निम्न क्रम):\n1. दिलवाड़ा : 1442 मीटर (सिरोही) - (d)\n2. अचलगढ़ : 1380 मीटर (सिरोही) - (b)\n3. कुंभलगढ़ : 1224 मीटर (राजसमंद) - (a)\n4. तारागढ़ : 870 मीटर (अजमेर) - (c)\nअतः सही क्रम d, b, a, c है।';
});

// 2. rg_000572 in topic_02.json
updateQuestionInFile('topic_02.json', 'rg_000572', q => {
  q.answer = 'B';
  q.options = [
    'd, c, b, a',
    'a, b, c, d',
    'b, c, d, a',
    'c, d, a, b'
  ];
  q.explanation = 'दक्षिण-पूर्व से उत्तर-पश्चिम दिशा में राजस्थान के भौतिक प्रदेशों का सही क्रम:\n1. हाड़ौती पठार (दक्षिण-पूर्व) - (a)\n2. बनास मैदान - (b)\n3. अरावली पर्वतमाला - (c)\n4. पश्चिमी रेतीला मैदान (उत्तर-पश्चिम) - (d)\nअतः सही क्रम a, b, c, d (विकल्प B) है।';
});

// 3. rg_000266 in topic_03.json
updateQuestionInFile('topic_03.json', 'rg_000266', q => {
  q.questionText = 'जल उपलब्धता के निम्नलिखित क्षेत्रों को सबसे शुष्क से सबसे आर्द्र (निम्नतम से उच्चतम) के क्रम में व्यवस्थित करें :';
  q.question = q.questionText;
  q.type = 'sequence';
  q.meta = {
    items: [
      { id: 'a', text: 'मरुस्थल (थार)' },
      { id: 'b', text: 'पूर्वी नदी मैदान' },
      { id: 'c', text: 'अरावली उच्चभूमि' },
      { id: 'd', text: 'नहरों के साथ सिंचित कमांड क्षेत्र' }
    ]
  };
  // Shushk to Aardra: Thar desert (a) < Aravalli (c) < Command area (d) < Eastern plains (b)
  // Sequence: a, c, d, b
  q.options = [
    'a, b, c, d',
    'a, c, d, b',
    'b, d, c, a',
    'a, d, c, b'
  ];
  q.answer = 'B';
  q.explanation = 'जल उपलब्धता के अनुसार शुष्क से आर्द्र क्रम (कम से अधिक):\n1. थार मरुस्थल (सबसे शुष्क) - (a)\n2. अरावली उच्चभूमि - (c)\n3. सिंचित कमांड क्षेत्र - (d)\n4. पूर्वी नदी मैदान (सबसे आर्द्र) - (b)\nअतः सही क्रम a, c, d, b (विकल्प B) है।';
});

// 4. rg_007927 in topic_11.json
updateQuestionInFile('topic_11.json', 'rg_007927', q => {
  q.questionText = 'देश में राजस्थान के खनिज स्रोतों के योगदान को बढ़ते क्रम में व्यवस्थित करें :';
  q.question = q.questionText;
  q.type = 'sequence';
  q.meta = {
    items: [
      { id: 'a', text: 'पोटाश' },
      { id: 'b', text: 'जिप्सम' },
      { id: 'c', text: 'ताम्र अयस्क' },
      { id: 'd', text: 'टंगस्टन' }
    ]
  };
  // Increasing order: Tungsten (d) < Copper (c) < Gypsum (b) < Potash (a)
  // Sequence: d, c, b, a
  q.options = [
    'a, b, c, d',
    'd, b, c, a',
    'c, d, b, a',
    'd, c, b, a'
  ];
  q.answer = 'D';
  q.explanation = 'खनिज स्रोतों के योगदान का बढ़ता क्रम:\n1. टंगस्टन (उत्पादन बेहद सीमित) - (d)\n2. ताम्र अयस्क (मध्य प्रदेश के बाद दूसरा) - (c)\n3. जिप्सम (देश का 90% से अधिक) - (b)\n4. पोटाश (देश के सबसे विशाल भंडार) - (a)\nअतः बढ़ता क्रम d, c, b, a (विकल्प D) है।';
});

// 5. rg_011655 in topic_12.json
updateQuestionInFile('topic_12.json', 'rg_011655', q => {
  q.questionText = 'राजस्थान में सौर ऊर्जा संयंत्रों को निम्नतम से उच्चतम स्थापित क्षमता के अनुसार व्यवस्थित करें :';
  q.question = q.questionText;
  q.type = 'sequence';
  q.meta = {
    items: [
      { id: 'a', text: 'मोकाला सौर ऊर्जा परियोजना (जैसलमेर)' },
      { id: 'b', text: 'खींवसर सौर ऊर्जा संयंत्र (नागौर)' },
      { id: 'c', text: 'गौरीर सौर फोटोबोल्टेइक (झुंझनूं)' },
      { id: 'd', text: 'भड़ला सोलर पार्क (जोधपुर)' }
    ]
  };
  // Mokala < Gaurir < Khinvsar < Bhadla -> a, c, b, d
  q.options = [
    'a, c, b, d',
    'a, b, c, d',
    'c, a, b, d',
    'd, b, c, a'
  ];
  q.answer = 'A';
  q.explanation = 'स्थापित सौर क्षमता का बढ़ता क्रम:\n1. मोकाला (जैसलमेर) - (a)\n2. गौरीर (झुंझुनूं) - (c)\n3. खींवसर (नागौर) - (b)\n4. भड़ला सोलर पार्क (जोधपुर - विश्व का सबसे बड़ा) - (d)\nअतः सही क्रम a, c, b, d (विकल्प A) है।';
});

// 6. rg_014243 in topic_25.json
updateQuestionInFile('topic_25.json', 'rg_014243', q => {
  q.questionText = 'राजस्थान के निम्नलिखित समाचारपत्रों को कालक्रमानुसार व्यवस्थित करें :';
  q.question = q.questionText;
  q.type = 'sequence';
  q.meta = {
    items: [
      { id: 'a', text: 'राजस्थान केसरी' },
      { id: 'b', text: 'राजस्थान (साप्ताहिक)' },
      { id: 'c', text: 'राजपूताना गजट' },
      { id: 'd', text: 'जयपुर समाचार' }
    ]
  };
  // 1885: Rajputana Gazette (c)
  // 1920: Rajasthan Kesari (a)
  // 1923: Rajasthan Saptahik (b)
  // 1942: Jaipur Samachar (d)
  // Sequence: c, a, b, d
  q.options = [
    'a, b, c, d',
    'c, b, a, d',
    'c, a, b, d',
    'd, a, b, c'
  ];
  q.answer = 'C';
  q.explanation = 'समाचारपत्रों का कालानुक्रम:\n1. राजपूताना गजट (1885 - अजमेर) - (c)\n2. राजस्थान केसरी (1920 - वर्धा) - (a)\n3. राजस्थान साप्ताहिक (1923 - ब्यावर) - (b)\n4. जयपुर समाचार (1942 - जयपुर) - (d)\nअतः सही कालक्रम c, a, b, d (विकल्प C) है।';
});

console.log('Sequence healing complete!');

