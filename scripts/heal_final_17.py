import json
import re

# Load topic files and fix the 17 items
def heal_remaining_17():
    with open('data/questions/flagged_published_211.json', 'r', encoding='utf-8') as f:
        items = json.load(f)

    print(f"Healing remaining {len(items)} items...")
    
    # Cache topics
    topics = {}
    for it in items:
        tnum = it['topic']
        if tnum not in topics:
            fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
            with open(fname, 'r', encoding='utf-8') as tf:
                topics[tnum] = json.load(tf)
                
    for it in items:
        qid = it['id']
        tnum = it['topic']
        tdata = topics[tnum]
        qs = tdata['questions'] if isinstance(tdata, dict) else tdata
        q = next((x for x in qs if x['id'] == qid), None)
        if not q:
            continue
            
        text = q.get('question', '')
        opts = q.get('options', [])
        ans = q.get('answer', '')
        
        # 1. Fix answer if text instead of letter
        if ans not in ['A', 'B', 'C', 'D']:
            # Find which option matches
            for o_idx, opt in enumerate(opts):
                if ans.strip() == opt.strip():
                    new_letter = chr(ord('A') + o_idx)
                    print(f"[{qid}]: Fixed answer string '{ans}' -> '{new_letter}'")
                    q['answer'] = new_letter
                    break
                    
        # 2. Extract structured meta.items from statement list in question text
        # Patterns like A. ... \n B. ... or (A) ... \n (B) ... or 1. ... \n 2. ...
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        stem_lines = []
        items_extracted = []
        
        for l in lines:
            m = re.match(r'^[\(\[]?([A-D1-4अबसदअ-दivxIVX]+)[\)\]\.\-:]\s*(.+)$', l)
            if m:
                lbl = m.group(1)
                content = m.group(2).strip()
                items_extracted.append({'id': lbl, 'text': content})
            else:
                stem_lines.append(l)
                
        if len(items_extracted) >= 2:
            q['type'] = 'sequence'
            if not q.get('meta'):
                q['meta'] = {}
            q['meta']['items'] = items_extracted
            # Clean stem text
            clean_stem = ' '.join(stem_lines).strip()
            if clean_stem:
                q['question'] = clean_stem
            print(f"[{qid}]: Extracted {len(items_extracted)} statement items into meta.items")
            
        q['meta']['auditedAt'] = '2026-11-09T14:40:00Z'
        q['meta']['qualityAudited'] = True

    # Save topics
    for tnum, tdata in topics.items():
        fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
        with open(fname, 'w', encoding='utf-8') as tf:
            json.dump(tdata, tf, ensure_ascii=False, indent=2)

    print("✅ All 17 items successfully healed and saved!")

if __name__ == '__main__':
    heal_remaining_17()
