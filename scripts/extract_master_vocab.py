import sys
import re
import json
from pypdf import PdfReader

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def extract_vocab_list_1200(pdf_path):
    reader = PdfReader(pdf_path)
    entries = {}
    
    # Format: 1. Rein N/V नियंत्रण, लगाम... Strap to guide...
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
        
    lines = full_text.splitlines()
    for line in lines:
        line = line.strip()
        m = re.match(r'^(\d+)\.\s+([A-Za-z\s\'-]+?)\s+(N/V|N|V\.|V|Adj\.|Adj|Adv\.|Adv)\s+([^\x00-\x7F]+.*?)\s+([A-Z][a-z].*|\bTo\b.*|\bStrap\b.*|\bPower\b.*)', line)
        if m:
            num = int(m.group(1))
            word = m.group(2).strip()
            pos = m.group(3).strip().replace('.', '')
            hi = m.group(4).strip()
            en = m.group(5).strip()
            entries[num] = {
                "id": num,
                "word": word,
                "pos": pos,
                "hindi": hi,
                "english": en
            }
            
    print(f"Extracted {len(entries)} entries from Vocabulary List.pdf")
    return entries

def extract_new_vocab_1655(pdf_path):
    reader = PdfReader(pdf_path)
    entries = {}
    
    for page in reader.pages:
        for line in page.extract_text().splitlines():
            line = line.strip()
            m = re.match(r'^(\d+)\s+([A-Za-z\s\'-]+?)\s+(.*)', line)
            if m:
                num = int(m.group(1))
                word = m.group(2).strip()
                rest = m.group(3).strip()
                
                # Hindi meaning usually at the end after repeated number
                hi_match = re.search(r'\b' + str(num) + r'\s+([^\x00-\x7F].*)$', rest)
                if hi_match:
                    en = rest[:hi_match.start()].strip()
                    hi = hi_match.group(1).strip()
                else:
                    # check if hindi characters exist anywhere in rest
                    hi_chars = re.search(r'([^\x00-\x7F]+.*)$', rest)
                    if hi_chars:
                        en = rest[:hi_chars.start()].strip()
                        hi = hi_chars.group(1).strip()
                    else:
                        en = rest
                        hi = ""
                        
                entries[num] = {
                    "id": num,
                    "word": word,
                    "hindi": hi,
                    "english": en
                }
                
    print(f"Extracted {len(entries)} entries from NewVocabList.pdf")
    return entries

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    p_1200 = r'e:\quizzer2\data\ddd\english\vocab\Vocabulary List.pdf'
    p_1655 = r'e:\quizzer2\data\ddd\english\vocab\NewVocabList.pdf'
    
    dict_1200 = extract_vocab_list_1200(p_1200)
    dict_1655 = extract_new_vocab_1655(p_1655)
    
    # Load Sets 01-03 to flag covered words
    covered_words = set()
    for s_file in ['vocabulary_set_01.json', 'vocabulary_set_02.json', 'vocabulary_set_03.json']:
        with open(rf'e:\quizzer2\data\ddd\english\vocab\synonyms\{s_file}', encoding='utf-8') as f:
            d = json.load(f)
            for w in d['words']:
                covered_words.add(w['word'].lower().strip())
                for syn in w.get('synonyms', []):
                    covered_words.add(syn['word'].lower().strip())

    master_vocab = []
    max_id = max(max(dict_1200.keys(), default=0), max(dict_1655.keys(), default=0))
    print(f"Total range: 1 to {max_id}")
    
    for i in range(1, max_id + 1):
        item_1200 = dict_1200.get(i)
        item_1655 = dict_1655.get(i)
        
        if not item_1200 and not item_1655:
            continue
            
        word = item_1655['word'] if item_1655 else item_1200['word']
        pos = item_1200['pos'] if item_1200 else ("Idiom/Phrase" if " " in word else "Word")
        hi = item_1655['hindi'] if (item_1655 and item_1655['hindi']) else (item_1200['hindi'] if item_1200 else "")
        en = item_1655['english'] if (item_1655 and item_1655['english']) else (item_1200['english'] if item_1200 else "")
        
        is_covered = word.lower().strip() in covered_words
        category = "Idiom / Expression" if i > 1500 or " " in word else ("Core High-Frequency" if i <= 500 else "Intermediate / Advanced")

        master_vocab.append({
            "id": i,
            "word": word,
            "partOfSpeech": pos,
            "hindiMeaning": hi,
            "englishDefinition": en,
            "category": category,
            "isCoveredInSets01_03": is_covered
        })

    out_json = r'e:\quizzer2\data\ddd\english\vocab\master_vocab_1655.json'
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({
            "title": "Master Vocabulary Bank (1655 Words & Expressions)",
            "totalWords": len(master_vocab),
            "sourceFiles": ["Vocabulary List.pdf", "NewVocabList.pdf"],
            "wordsCoveredInSets01_03": sum(1 for m in master_vocab if m['isCoveredInSets01_03']),
            "words": master_vocab
        }, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {out_json} with {len(master_vocab)} words!")
    print(f"Overlap with Sets 01-03: {sum(1 for m in master_vocab if m['isCoveredInSets01_03'])} words covered.")

if __name__ == '__main__':
    main()
