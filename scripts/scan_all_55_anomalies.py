import json
import glob
import os
import re

print("=== SCANNING ALL 55 TOPICS FOR RAW / UNFORMATTED / ANOMALOUS QUESTIONS IN PUBLISHED SETS ===")

# 1. Load Published Sets
with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    published_sets = json.load(f)

# 2. Load Topic ID Mapping
with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    topic_map = json.load(f) # e.g. "1": "kh7...", "2": "kh7..."

# Invert topic map: convex_id -> topic_number (1..55)
convex_to_topic = {v: int(k) for k, v in topic_map.items()}

# Group published question IDs by topic number
topic_published_qids = {t: set() for t in range(1, 56)}
for s in published_sets:
    cid = s.get('topicId')
    tnum = convex_to_topic.get(cid)
    if tnum and 1 <= tnum <= 55:
        topic_published_qids[tnum].update(s.get('questionIds', []))

total_published_qids = sum(len(qids) for qids in topic_published_qids.values())
print(f"Total Published Sets: {len(published_sets)}")
print(f"Total Unique Published Questions across 55 Topics: {total_published_qids}")

# 3. Check question files for each topic
flagged_by_topic = {}
all_flagged_questions = []

for tnum in range(1, 56):
    fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
    if not os.path.exists(fname):
        continue
        
    with open(fname, 'r', encoding='utf-8') as f:
        tdata = json.load(f)
        qs = tdata.get('questions', []) if isinstance(tdata, dict) else tdata
        qmap = {q['id']: q for q in qs}
        
    pub_ids = topic_published_qids.get(tnum, set())
    topic_flags = []
    
    for qid in pub_ids:
        q = qmap.get(qid)
        if not q:
            # Let's check archived variants in case
            if isinstance(tdata, dict) and 'archivedVariants' in tdata:
                for av in tdata['archivedVariants']:
                    if av['id'] == qid:
                        q = av
                        break
        if not q:
            topic_flags.append({
                'id': qid,
                'topic': tnum,
                'issue_type': 'NOT_FOUND_IN_POOL',
                'question': 'Question ID not found in topic file',
                'raw': None
            })
            continue
            
        text = q.get('question', '')
        opts = q.get('options', [])
        ans = q.get('answer', '')
        meta = q.get('meta') or {}
        
        issues = []
        
        # Check invalid options count
        if len(opts) != 4:
            issues.append(f"options count is {len(opts)}")
            
        # Check invalid answer
        if ans not in ['A', 'B', 'C', 'D']:
            issues.append(f"invalid answer '{ans}'")
            
        # Check raw match-the-following without structured meta
        has_match_keywords = any(kw in text for kw in ['सूची-I', 'सूची I', 'सूची – I', 'सुमेलित कीजिए', 'सही सुमेलित', 'सुमेलित नहीं'])
        if ('सूची' in text or 'सुमेलित' in text) and ('सूची-II' in text or 'सूची II' in text or 'सूची – II' in text or 'स्तम्भ' in text):
            if not meta.get('left') or not meta.get('right'):
                issues.append("raw match-the-following (needs structured meta.left/meta.right)")
                
        # Check raw statements / sequences without structured meta
        has_stmt_format = bool(re.search(r'[\(\[]?[A-D1-4अबसदिकखगघ][\)\]\.]\s+.*[\n\r]+.*[\(\[]?[B-D2-4बसदखगघ][\)\]\.]', text))
        if has_stmt_format and not meta.get('items') and not meta.get('left'):
            issues.append("raw statement/sequence list (needs structured meta.items)")
            
        # Check OCR corruption in options (e.g. missing 'A-' or '(a)-' like '(I), B-(II)')
        for opt_idx, opt in enumerate(opts):
            if re.match(r'^\s*[\(\[]?(?:i{1,3}|iv|v|1|2|3|4)[\)\]]\s*,\s*[B-Dबसद]', str(opt)):
                issues.append(f"malformed option {opt_idx}: missing first label '{opt[:20]}'")
                
        if issues:
            flag_entry = {
                'id': qid,
                'topic': tnum,
                'issues': issues,
                'question_preview': text[:80].replace('\n', ' '),
                'options': opts,
                'answer': ans,
                'meta': meta
            }
            topic_flags.append(flag_entry)
            all_flagged_questions.append(flag_entry)
            
    if topic_flags:
        flagged_by_topic[tnum] = topic_flags

print(f"\n=== SCAN RESULTS SUMMARY ===")
print(f"Total Topics Scanned: 55")
print(f"Topics with Flagged Questions: {len(flagged_by_topic)}")
print(f"Total Flagged Questions across All Published Sets: {len(all_flagged_questions)}")

print("\nBreakdown by Topic:")
for tnum in sorted(flagged_by_topic.keys()):
    print(f"  • Topic {tnum:02d}: {len(flagged_by_topic[tnum])} questions flagged")

with open('data/questions/flagged_published_211.json', 'w', encoding='utf-8') as out:
    json.dump(all_flagged_questions, out, ensure_ascii=False, indent=2)
print(f"Saved {len(all_flagged_questions)} flagged questions to data/questions/flagged_published_211.json")
