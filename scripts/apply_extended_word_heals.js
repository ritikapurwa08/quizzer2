const fs = require('fs');
const path = require('path');

const EXTENDED_HEALS = {
  "क्षिणतम": "दक्षिणतम",
  "ुंडा": "सुंडा",
  "ेसाल्ट": "बेसाल्ट",
  "ी. ए.": "सी. ए.",
  "ाबाई": "बाबई",
  "ुसरा": "दूसरा",
  "ोरकुंड": "बोरकुंड",
  "ामोदरलाल": "दामोदरलाल",
  "ीकर": "सीकर",
  "ुबा": "सूबा",
  "ोझ": "बोझ",
  "ूजाजी": "दूजाजी",
  "ांवलदान": "सांवलदान",
  "ायतु": "बायतु",
  "ायटू": "बायटू",
  "ंथानम": "संथानम",
  "ृजमोहन": "बृजमोहन",
  "ांकल": "सांकल",
  "ांकियां": "सांकिया",
  "ांकिया": "सांकिया",
  "िछवा": "बिछवा",
  "िन्दौरी": "बिन्दौरी",
  "िस्मिल्लाह": "बिस्मिल्लाह",
  "ूमनेश": "सुमनेश",
  "ेचु": "देचू",
  "ांथू": "सांथू",
  "ैंदरिया": "सेंदिरिया",
  "ुरताखेड़ा": "सुरताखेड़ा",
  "ांतड़ा": "दांतड़ा",
  "ुथार": "सुथार",
  "ुल्ल्हे": "सुल्ल्हे",
  "ुवाप": "सुवाप",
  "ेदू": "देदू",
  "ामलिया": "सामलिया",
  "ोहड़": "सोहड़",
  "ाणमाता": "बाणमाता",
  "ाण": "बाण",
  "ांवगिया": "सांवगिया",
  "ंचियाय": "सचियाय",
  "ुदर्शनगढ़": "सुदर्शनगढ़",
  "ाजोट": "बाजोट",
  "ाटिक": "बाटिक",
  "ायू": "बायू",
  "ीवार": "दीवार",
  "ीदड़": "गीदड़",
  "ोडा": "सोडा",
  "ाबात": "साबात",
  "ालूराम": "बालूराम",
  "ुन्दी": "बूंदी",
  "ालिगराम": "सालिगराम",
  "ारहमाषा": "बारहमासा",
  "ेवकीनन्दन": "देवकीनन्दन",
  "ेसर": "देसर",
  "ानपुर": "दानपुर",
  "िरला": "बिरला",
  "ामन्व": "समन्वय",
  "ाराँ": "बारां",
  "ेवताओं": "देवताओं",
  "ोरला": "बोरला",
  "ंधेज": "बंधेज",
  "िरजस": "बिरजस",
  "ाजरी": "बाजरी",
  "ोरल": "बोरल",
  "ींठी": "बींठी",
  "ुरज": "बुरज",
  "ालरूप": "बालरूप",
  "ीका": "बीका",
  "ौन्दर्य": "सौन्दर्य",
  "िवान": "दीवान",
  "िल्क": "सिल्क",
  "ारी": "साड़ी",
  "ुपट्टा": "दुपट्टा",
  "ाँत": "दांत",
  "िक्कों": "सिक्कों",
  "ुकुल": "दुकुल",
  "ाफों": "साफों",
  "ाफ़ा": "साफा",
  "ाफे": "साफे",
  "ाझी": "सांझी",
  "ामणा": "सामणा",
  "ेवशयनी": "देवशयनी",
  "ोभायात्रा": "शोभायात्रा",
  "ाबा रामदेव": "बाबा रामदेव",
  "ादूजी": "दादूजी",
  "िवाना दुर्ग": "सिवाना दुर्ग",
  "ांसवाड़ा प्रजामंडल": "बांसवाड़ा प्रजामंडल",
  "ीकानेर प्रजामंडल": "बीकानेर प्रजामंडल",
  "िरोही प्रजामंडल": "सिरोही प्रजामंडल",
  "ूंदी प्रजामंडल": "बूंदी प्रजामंडल",
  "ौसा प्रजामंडल": "दौसा प्रजामंडल"
};

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let totalExtendedHealed = 0;

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  let fileChanged = false;

  questions.forEach(q => {
    let qChanged = false;
    const opts = q.options || [];

    const newOpts = opts.map(opt => {
      if (typeof opt !== 'string') return opt;
      let trimmed = opt.trim();

      for (const [corrupted, replacement] of Object.entries(EXTENDED_HEALS)) {
        if (trimmed === corrupted) {
          trimmed = replacement;
          qChanged = true;
          totalExtendedHealed++;
          break;
        }
        if (trimmed.startsWith(corrupted + " ") ||
            trimmed.startsWith(corrupted + "-") ||
            trimmed.startsWith(corrupted + "–") ||
            trimmed.startsWith(corrupted + "—") ||
            trimmed.startsWith(corrupted + ",") ||
            trimmed.startsWith(corrupted + "।") ||
            trimmed.startsWith(corrupted + "(") ||
            trimmed.startsWith(corrupted + ":") ||
            trimmed.startsWith(corrupted + ";")) {
          trimmed = replacement + trimmed.slice(corrupted.length);
          qChanged = true;
          totalExtendedHealed++;
          break;
        }
      }

      return trimmed;
    });

    if (qChanged) {
      q.options = newOpts;
      fileChanged = true;
    }
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Extended healing applied to ${totalExtendedHealed} additional options.`);

