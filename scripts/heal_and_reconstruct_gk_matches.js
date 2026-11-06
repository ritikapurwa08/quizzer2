const fs = require('fs');
const path = require('path');

const reconResults = JSON.parse(fs.readFileSync('scripts/reconstruction_results_v2.json', 'utf8'));
const reconMap = new Map();
reconResults.forEach(r => reconMap.set(r.id, r));

const gkDir = path.join(__dirname, '..', 'data', 'questions', 'rajasthan-gk');
const files = fs.readdirSync(gkDir).filter(f => f.endsWith('.json')).sort();

let reconstructedCount = 0;
let fixedOtherCount = 0;

files.forEach(file => {
  const filePath = path.join(gkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questions = Array.isArray(data) ? data : data.questions || [];
  let fileChanged = false;

  questions.forEach(q => {
    // 1. Check if it's one of the 38 mangled questions
    if (reconMap.has(q.id)) {
      const r = reconMap.get(q.id);
      
      // Special manual cases for the 2 complex ones
      if (q.id === 'rg_007332') {
        q.options = [
          'a-II, b-I, c-III, d-IV',
          'a-I, b-II, c-III, d-IV',
          'a-IV, b-III, c-II, d-I',
          'a-III, b-I, c-IV, d-II'
        ];
        q.answer = 'B';
        fileChanged = true;
        reconstructedCount++;
        return;
      }
      if (q.id === 'rg_002193') {
        q.options = [
          'a-V, b-IV, c-III, d-II, e-I',
          'a-III, b-I, c-II, d-IV, e-V',
          'a-II, b-III, c-IV, d-V, e-I',
          'a-I, b-II, c-III, d-IV, e-V'
        ];
        q.answer = 'D';
        fileChanged = true;
        reconstructedCount++;
        return;
      }

      if (r.allValid && r.reconstructed) {
        q.options = r.reconstructed;
        // Verify answer
        if (q.id === 'rg_001017') {
          q.answer = 'A'; // Jarga 1431 (II), Dilwara 1442 (I), Taragarh 873 (III), Nag Pahar 795 (IV) -> 2 1 3 4
        } else if (q.id === 'rg_003185') {
          q.answer = 'D'; // Chambal -> Parbati (III), Luni -> Jawai (IV), Mahi -> Jakham (I), Banas -> Berach (II) -> 3 4 1 2
        } else if (q.id === 'rg_005784') {
          q.answer = 'A'; // Bhed -> Nali (IV), Govansh -> Rathi (III), Unt -> Nachana (II), Bhains -> Murrah (I) -> 4 3 2 1
        } else {
          // Keep oldAns or currentAns (they are identical for all other 35 questions)
          q.answer = r.oldAns || q.answer;
        }
        fileChanged = true;
        reconstructedCount++;
        return;
      }
    }

    // 2. Fix the 16 individual non-standard match questions
    if (q.id === 'rg_000430') {
      q.type = 'statement_reason';
      q.questionText = 'कोपेन के जलवायु वर्गीकरण के अनुसार निम्न में से कौन से सही सुमेलित हैं?\n\n(A) Cwg – भरतपुर\n(B) Bwhw – बाड़मेर\n(C) Bshw – गंगानगर\n(D) Aw – डूंगरपुर';
      q.options = ['(B) एवं (C)', '(A), (C) एवं (D)', '(B), (C) एवं (D)', '(A) एवं (D)'];
      q.answer = 'D';
      q.explanation = 'Aw जलवायु क्षेत्र : डूंगरपुर और बांसवाड़ा (सुमेलित है)। Cwg जलवायु क्षेत्र : भरतपुर, करौली, धौलपुर (सुमेलित है)। Bwhw जलवायु क्षेत्र : जैसलमेर, बीकानेर (बाड़मेर नहीं, बाड़मेर Bshw है)। Bshw जलवायु क्षेत्र : बाड़मेर, जालोर, नागौर (गंगानगर Bwhw है)। अतः केवल (A) एवं (D) सही सुमेलित हैं।';
      delete q.meta;
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_013130') {
      q.options = [
        'a-II, b-IV, c-I, d-III',
        'a-I, b-IV, c-II, d-III',
        'a-III, b-I, c-II, d-IV',
        'a-II, b-I, c-IV, d-III'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_013178') {
      q.options = [
        'a-II, b-III, c-IV, d-I',
        'a-I, b-III, c-II, d-IV',
        'a-II, b-IV, c-I, d-III',
        'a-I, b-III, c-IV, d-II'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_013474') {
      q.options = [
        'a-III, b-II, c-I, d-IV',
        'a-IV, b-III, c-II, d-I',
        'a-I, b-II, c-III, d-IV',
        'a-II, b-III, c-IV, d-I'
      ];
      q.answer = 'B';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_003550') {
      q.options = [
        'a-II, b-III, c-IV, d-I',
        'a-II, b-I, c-IV, d-III',
        'a-I, b-IV, c-II, d-III',
        'a-III, b-II, c-IV, d-I'
      ];
      q.answer = 'B';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_003718') {
      q.options = [
        'a-III, b-IV, c-I, d-II',
        'a-I, b-II, c-III, d-IV',
        'a-II, b-I, c-III, d-IV',
        'a-IV, b-III, c-I, d-II'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_003988') {
      q.options = [
        'a-III, b-I, c-IV, d-II',
        'a-III, b-II, c-IV, d-I',
        'a-II, b-IV, c-I, d-III',
        'a-II, b-III, c-IV, d-I'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_014241') {
      q.options = [
        'a-II, b-I, c-IV, d-III',
        'a-III, b-II, c-IV, d-I',
        'a-III, b-I, c-II, d-IV',
        'a-III, b-II, c-I, d-IV'
      ];
      q.answer = 'D';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_001801') {
      q.options = [
        'a-II, b-IV, c-III, d-I',
        'a-III, b-II, c-IV, d-I',
        'a-IV, b-III, c-I, d-II',
        'a-I, b-II, c-III, d-IV'
      ];
      q.answer = 'C';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_010315') {
      q.options = [
        'a-III, b-IV, c-V, d-I, e-II',
        'a-I, b-II, c-III, d-IV, e-V',
        'a-V, b-II, c-IV, d-III, e-I',
        'a-IV, b-V, c-I, d-II, e-III'
      ];
      q.answer = 'D';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_010317') {
      q.options = [
        'a-IV, b-III, c-II, d-I',
        'a-II, b-III, c-I, d-IV',
        'a-I, b-II, c-IV, d-III',
        'a-III, b-I, c-IV, d-II'
      ];
      q.answer = 'D';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_002666') {
      q.options = [
        'a-I, b-II, c-IV, d-III',
        'a-I, b-II, c-III, d-IV',
        'a-II, b-I, c-IV, d-III',
        'a-III, b-IV, c-I, d-II'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_004756') {
      q.options = [
        'a-IV, b-I, c-II, d-III',
        'a-I, b-II, c-III, d-IV',
        'a-I, b-III, c-IV, d-II',
        'a-III, b-II, c-IV, d-I'
      ];
      q.answer = 'D';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_004759') {
      q.options = [
        'a-III, b-IV, c-II, d-I',
        'a-III, b-IV, c-I, d-II',
        'a-I, b-II, c-III, d-IV',
        'a-IV, b-III, c-I, d-II'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_009919') {
      q.options = [
        'a-I, b-III, c-IV, d-II',
        'a-II, b-IV, c-III, d-I',
        'a-III, b-I, c-II, d-IV',
        'a-IV, b-II, c-I, d-III'
      ];
      q.answer = 'B';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }

    if (q.id === 'rg_014903') {
      q.options = [
        'a-II, b-I, c-III',
        'a-I, b-II, c-III',
        'a-I, b-III, c-II',
        'a-II, b-III, c-I'
      ];
      q.answer = 'A';
      fileChanged = true;
      fixedOtherCount++;
      return;
    }
  });

  if (fileChanged) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
});

console.log(`Successfully healed ${reconstructedCount} reconstructed questions and ${fixedOtherCount} individual match questions in Rajasthan GK!`);

