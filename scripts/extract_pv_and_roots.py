import sys
import re
import json
from pypdf import PdfReader

def extract_phrasal_verbs(pdf_path):
    reader = PdfReader(pdf_path)
    entries = []
    print(f"Reading {pdf_path} (Pages: {len(reader.pages)})...")
    
    current_entry = None
    for p in reader.pages:
        text = p.extract_text()
        for line in text.splitlines():
            line = line.strip()
            if not line or "Complete Phrasal Verbs List" in line or line.startswith("Phrasal Verb Meaning"):
                continue
            
            # Format: 'Abide by Accept or follow a decision or rule. We have to ABIDE BY what the court says.'
            # Usually starts with capitalized Phrasal Verb: [A-Z][a-z]+ (by|for|on|out|up|down|away|into|off|in|with|over|through|about|across|after|against|along|around|at|back|before|behind|below|between|beyond|from|of|to|under|upon)
            m = re.match(r'^([A-Z][a-z]+(?:\s+[a-z]+){1,3})\s+([A-Z][a-z].*?\.)\s+(.*)', line)
            if m:
                pv = m.group(1).strip()
                meaning = m.group(2).strip()
                example = m.group(3).strip()
                entries.append({
                    "id": len(entries) + 1,
                    "phrasalVerb": pv,
                    "meaning": meaning,
                    "example": example
                })
    print(f"Extracted {len(entries)} Phrasal Verbs with examples!")
    return entries

def extract_root_words(pdf_path):
    reader = PdfReader(pdf_path)
    entries = []
    print(f"Reading Root words ({pdf_path})...")
    
    for p_num, p in enumerate(reader.pages, 1):
        text = p.extract_text()
        lines = text.splitlines()
        for line in lines:
            line = line.strip()
            # Match root words like 'FID (Trust / ...)', 'MAL (Bad / ...)', 'BEN/BENE (Good)'
            m = re.match(r'^([A-Z\s/]+)\s*\((.*?)\)\s*(.*)', line)
            if m and len(m.group(1).strip()) <= 15 and not m.group(1).startswith("APP"):
                root = m.group(1).strip()
                meaning = m.group(2).strip()
                hi = m.group(3).strip()
                entries.append({
                    "id": len(entries) + 1,
                    "page": p_num,
                    "root": root,
                    "englishMeaning": meaning,
                    "hindiMeaning": hi
                })
    print(f"Extracted {len(entries)} Root Word families!")
    return entries

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    pv_path = r'e:\quizzer2\data\ddd\english\vocab\Phrasal Verbs.pdf'
    rw_path = r"e:\quizzer2\data\ddd\english\vocab\Rani Mam's Root words.pdf"
    
    pvs = extract_phrasal_verbs(pv_path)
    out_pv = r'e:\quizzer2\data\ddd\english\vocab\phrasal_verbs_master.json'
    with open(out_pv, 'w', encoding='utf-8') as f:
        json.dump({
            "title": "Master Phrasal Verbs Bank",
            "totalEntries": len(pvs),
            "entries": pvs
        }, f, ensure_ascii=False, indent=2)

    rws = extract_root_words(rw_path)
    out_rw = r'e:\quizzer2\data\ddd\english\vocab\root_words_master.json'
    with open(out_rw, 'w', encoding='utf-8') as f:
        json.dump({
            "title": "Master Root Words Bank",
            "totalEntries": len(rws),
            "entries": rws
        }, f, ensure_ascii=False, indent=2)

    print("Extracted Phrasal Verbs and Root Words successfully!")

if __name__ == '__main__':
    main()
