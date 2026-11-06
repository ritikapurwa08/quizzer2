const fs = require('fs');
const path = require('path');

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const assertions = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_assertion_questions.json'), 'utf8'));

console.log(`Auditing all ${assertions.length} assertion questions...`);

const parsedList = [];

for (const q of assertions) {
  let text = q.questionText;

  // Split into intro, assertion, reason, footer
  let intro = "नीचे दो कथन दिए गए हैं, एक को अभिकथन (A) और दूसरे को कारण (R) कहा गया है:";
  let assertionText = "";
  let reasonText = "";
  let footer = "उपर्युक्त कथनों के आलोक में सही विकल्प चुनिए:";

  // Extract assertion text
  const aMatch = text.match(/(?:अभिकथन\s*(?:\(Assertion\))?\s*\(?[aA1]\)?[:\-–—]|कथन\s*\(?[aA]\)?[:\-–—])([\s\S]+?)(?=(?:कारण\s*(?:\(Reason\))?\s*\(?[rR2]\)?[:\-–—]|\(R\)\s*[-–—:]))/u);
  // Extract reason text
  const rMatch = text.match(/(?:कारण\s*(?:\(Reason\))?\s*\(?[rR2]\)?[:\-–—]|\(R\)\s*[-–—:])([\s\S]+?)(?=(?:उपरो(?:क्त|युक्त)|नीचे\s*दिए|इनमें\s*से|$))/u);

  if (aMatch && rMatch) {
    assertionText = aMatch[1].trim();
    reasonText = rMatch[1].trim();

    // Clean trailing danda or intro bleed
    assertionText = assertionText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
    reasonText = reasonText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  parsedList.push({
    id: q.id,
    file: q.file,
    currentType: q.currentType,
    currentAnswer: q.answer,
    assertionText,
    reasonText,
    options: q.options,
    explanation: q.explanation
  });
}

fs.writeFileSync(path.join(__dirname, 'parsed_assertions.json'), JSON.stringify(parsedList, null, 2));

console.log(`Successfully parsed ${parsedList.filter(x => x.assertionText && x.reasonText).length}/${parsedList.length} assertion-reason questions!`);

