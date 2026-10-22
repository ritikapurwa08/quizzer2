import sys
import re
import json
from pypdf import PdfReader

# Ligature fix for Samundra Manthan PDF text
LIGATURE_FIXES = {
    "सुथत": "सुस्त",
    "सुथती": "सुस्ती",
    "आलथय": "आलस्य",
    "स्िस्रिय": "निष्क्रिय",
    "अस्िय": "अक्रिय",
    "प्रसुप्त": "प्रसुप्त",
    "आदशि": "आदर्श",
    "स्िठल्ल": "निठल्ला",
    "अकमिण्य": "अकर्मण्य",
    "स्िथतेज": "निस्तेज",
    "स्शस्िल": "शिथिल",
    "स्िरुत्स ही": "निरुत्साही",
    "गस्तहीि": "गतिहीन",
    "बैठ  रहिे र्व ल": "बैठे रहने वाला",
    "धीम": "धीमा",
    "िक  हुआ": "थका हुआ",
    "भ र्वुक": "भावुक",
    "श ांत": "शांत",
    "स्थिर": "स्थिर",
    "बेक र": "बेकार",
    "मूस्ति": "मूर्ति",
    "सर्वोत्तम": "सर्वोत्तम",
    "स्सद् ांत": "सिद्धांत"
}

def clean_hindi(text):
    if not text:
        return ""
    for bad, good in LIGATURE_FIXES.items():
        text = text.replace(bad, good)
    return text.strip()

def build_2500_master():
    sys.stdout.reconfigure(encoding='utf-8')
    
    # 1. Load 1655 list
    with open(r'e:\quizzer2\data\ddd\english\vocab\master_vocab_1655.json', encoding='utf-8') as f:
        nv_data = json.load(f)['words']
    
    nv_lookup = {w['word'].lower().strip(): w for w in nv_data}
    
    # 2. Extract Samundra Manthan
    sm_pdf = r'e:\quizzer2\data\ddd\english\vocab\SamundraManthanBatch-3.0.pdf'
    reader = PdfReader(sm_pdf)
    print(f"Parsing Samundra Manthan ({len(reader.pages)} pages)...")
    
    extracted_entries = []
    for p_idx, page in enumerate(reader.pages):
        lines = page.extract_text().splitlines()
        for line in lines:
            line = line.strip()
            # Match: 1. Quiescent (adj) Marked by...
            m = re.match(r'^(\d+)\.\s+([A-Za-z\s\'-]+?)(?:\s+(\([a-z/]+\)|\bAdj\b|\bNoun\b|\bVerb\b|\bAdv\b|\bTo\b|\bA\b|[A-Z][a-z]+))?\s+(.*)', line)
            if m:
                num = int(m.group(1))
                word = m.group(2).strip()
                pos = m.group(3) or ''
                rest = m.group(4).strip()
                
                if len(word) > 1 and not word.isupper():
                    # Split rest into english definition & hindi
                    # Hindi characters check
                    hi_match = re.search(r'([^\x00-\x7F]+.*)$', rest)
                    if hi_match:
                        en_def = rest[:hi_match.start()].strip()
                        hi_meaning = clean_hindi(hi_match.group(1).strip())
                    else:
                        en_def = rest
                        hi_meaning = ""
                        
                    extracted_entries.append({
                        "sm_id": num,
                        "word": word,
                        "pos": pos.replace('(', '').replace(')', '').strip(),
                        "englishDefinition": en_def,
                        "hindiMeaning": hi_meaning
                    })

    print(f"Extracted {len(extracted_entries)} raw items from Samundra Manthan")
    
    # Merge and Deduplicate
    master_dict = {}
    
    # First add Samundra Manthan
    for e in extracted_entries:
        key = e['word'].lower().strip()
        if key not in master_dict:
            master_dict[key] = {
                "word": e['word'],
                "pos": e['pos'],
                "hindiMeaning": e['hindiMeaning'],
                "englishDefinition": e['englishDefinition'],
                "sources": ["SamundraManthan"]
            }

    # Then enrich or add from NewVocabList (which has clean Hindi!)
    for e in nv_data:
        key = e['word'].lower().strip()
        if key in master_dict:
            master_dict[key]['sources'].append("NewVocabList")
            if not master_dict[key]['hindiMeaning'] or len(e['hindiMeaning']) > len(master_dict[key]['hindiMeaning']):
                master_dict[key]['hindiMeaning'] = e['hindiMeaning']
            if not master_dict[key]['pos']:
                master_dict[key]['pos'] = e['partOfSpeech']
        else:
            master_dict[key] = {
                "word": e['word'],
                "pos": e['partOfSpeech'],
                "hindiMeaning": e['hindiMeaning'],
                "englishDefinition": e['englishDefinition'],
                "sources": ["NewVocabList"]
            }

    print(f"Total Unique Combined Words: {len(master_dict)}")
    
    # Assign sequential IDs and group into Sets of 25
    sorted_words = []
    for idx, (k, val) in enumerate(master_dict.items(), 1):
        set_number = ((idx - 1) // 25) + 1
        sorted_words.append({
            "masterId": idx,
            "setNumber": set_number,
            "word": val['word'],
            "partOfSpeech": val['pos'],
            "hindiMeaning": val['hindiMeaning'],
            "englishDefinition": val['englishDefinition'],
            "sources": val['sources']
        })

    out_file = r'e:\quizzer2\data\ddd\english\vocab\master_vocab_2500_complete.json'
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump({
            "title": "Complete 2500+ Master Exam Vocabulary Bank",
            "totalWords": len(sorted_words),
            "totalSetsOf25": ((len(sorted_words) - 1) // 25) + 1,
            "words": sorted_words
        }, f, ensure_ascii=False, indent=2)

    print(f"Saved master file to {out_file} with {len(sorted_words)} words partitioned into {((len(sorted_words)-1)//25)+1} Sets of 25!")

if __name__ == '__main__':
    build_2500_master()
