import json
from collections import defaultdict
from difflib import SequenceMatcher

with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)
t2_map = {q['id']: q for q in t2['questions']}

with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1 = json.load(f)
t1_map = {q['id']: q for q in t1['questions']}

all_map = {**t1_map, **t2_map}

with open('today_audit_details.json', 'r', encoding='utf-8') as f:
    session_data = json.load(f)

attempts = session_data['attempts']
bookmarks = session_data['bookmarks']

# Inspect the 9 sets
print("=" * 60)
print("AUDIT REPORT: 9 ATTEMPTED SETS OF TOPIC 2 ON PRODUCTION")
print("=" * 60)

set_questions = {}
for att in attempts:
    s_name = att['testSetName']
    qids = [ans['questionId'] for ans in att['answers']]
    set_questions[s_name] = qids

# 1. Cross-set duplication
print("\n--- 1. EXACT DUPLICATION ACROSS THE 9 LIVE SETS ---")
cross_repeats = defaultdict(list)
for s_name, qids in set_questions.items():
    for qid in qids:
        cross_repeats[qid].append(s_name)

multi_set_qs = {qid: sets for qid, sets in cross_repeats.items() if len(sets) > 1}
print(f"Total questions appearing in 2 or more sets: {len(multi_set_qs)}")

# Let's count pairs between sets
set_names = list(set_questions.keys())
for i in range(len(set_names)):
    for j in range(i + 1, len(set_names)):
        s1, s2 = set_names[i], set_names[j]
        common = set(set_questions[s1]).intersection(set(set_questions[s2]))
        if common:
            print(f"  • [{s1}] & [{s2}] share {len(common)} questions: {list(common)[:4]}")

# 2. Bookmarked questions analysis
print("\n--- 2. ANALYSIS OF USER'S BOOKMARKED QUESTIONS (SAVED AS SIMILAR/BUGGY) ---")
b_in_9 = [b for b in bookmarks if b.get('found_in_set')]
print(f"Total bookmarks from these 9 sets: {len(b_in_9)}")

# Let's inspect each bookmarked question
saved_records = []
for b in b_in_9:
    qid = b['qid']
    q = all_map.get(qid)
    u_ans = b.get('user_ans', {})
    if not q:
        continue
    
    q_text = q.get('question', '')
    opts = q.get('options', [])
    ans = q.get('answer', '')
    exp = q.get('explanation', '')
    user_sel = u_ans.get('selected', 'None')
    is_corr = u_ans.get('isCorrect', False)
    
    saved_records.append({
        'qid': qid,
        'set': b['found_in_set'],
        'time': b['time'],
        'question': q_text,
        'options': opts,
        'answer': ans,
        'explanation': exp,
        'user_sel': user_sel,
        'is_corr': is_corr
    })

# Check semantic similarity among the 116 unique questions in the 9 sets
unique_qids = list(set([qid for qids in set_questions.values() for qid in qids]))
unique_qs = [all_map[qid] for qid in unique_qids if qid in all_map]

print(f"\nUnique questions across the 9 sets: {len(unique_qs)} (out of 180 total slots)")

# Semantic clusters among these unique questions
concept_clusters = defaultdict(list)
for q in unique_qs:
    txt = (q.get('question', '') + ' ' + ' '.join(q.get('options', [])) + ' ' + q.get('explanation', '')).lower()
    if any(k in txt for k in ['हरियाणा', 'सीमा', 'रेडक्लिफ', 'पाकिस्तान', 'पंजाब', 'गुजरात', 'मध्य प्रदेश', 'उत्तर प्रदेश']):
        concept_clusters['अंतर्राज्यीय एवं अंतर्राष्ट्रीय सीमाएँ (Borders)'].append(q)
    elif any(k in txt for k in ['चोटी', 'शिखर', 'गुरुशिखर', 'शेर', 'देलवाड़ा', 'जरगा', 'अचलगढ़', 'रघुनाथगढ़', 'कुंभलगढ़', 'अरावली']):
        concept_clusters['अरावली पर्वतमाला एवं प्रमुख पर्वत चोटियाँ'].append(q)
    elif any(k in txt for k in ['थार', 'मरुस्थल', 'रेतीला', 'बालुका', 'बरखान', 'लाठी', 'सीफ', 'अनुप्रस्थ', 'अनुदैर्ध्य']):
        concept_clusters['थार का मरुस्थल एवं बालुका स्तूप'].append(q)
    elif any(k in txt for k in ['हाड़ौती', 'दक्कन', 'विंध्यन', 'मुकंदरा', 'डग-गंगधार']):
        concept_clusters['हाड़ौती का पठार एवं दक्षिणी-पूर्वी भाग'].append(q)
    elif any(k in txt for k in ['पूर्वी मैदान', 'छप्पन', 'माही', 'बनास']):
        concept_clusters['पूर्वी मैदान एवं छप्पन का मैदान'].append(q)
    elif any(k in txt for k in ['अक्षांश', 'देशान्तर', 'कर्क रेखा', 'क्षेत्रफल', 'उत्तर से दक्षिण', 'पूर्व से पश्चिम']):
        concept_clusters['भौगोलिक स्थिति, अक्षांश-देशांतर व विस्तार'].append(q)
    elif any(k in txt for k in ['टेथिस', 'गोंडवाना']):
        concept_clusters['भूगर्भिक इतिहास (टेथिस सागर / गोंडवानालैंड)'].append(q)
    else:
        concept_clusters['अन्य विशिष्ट भौगोलिक प्रश्न'].append(q)

print("\n--- 3. CONCEPTUAL CLUSTERS IN THE 9 SETS ---")
for cname, cqs in concept_clusters.items():
    print(f"\nCluster: {cname} ({len(cqs)} questions):")
    # find pairs with question text similarity > 0.6
    for i in range(len(cqs)):
        for j in range(i+1, len(cqs)):
            q1, q2 = cqs[i], cqs[j]
            t1, t2 = q1.get('question', ''), q2.get('question', '')
            sim = SequenceMatcher(None, t1, t2).ratio()
            if sim > 0.55:
                print(f"  * Similar (sim={sim:.2f}):")
                print(f"    - [{q1['id']}]: {t1}")
                print(f"    - [{q2['id']}]: {t2}")

# Save detailed report
with open('audit_report_9sets.json', 'w', encoding='utf-8') as f:
    json.dump({
        'total_unique': len(unique_qs),
        'cross_repeats': multi_set_qs,
        'saved_questions': saved_records,
        'clusters': {k: [q['id'] for q in v] for k, v in concept_clusters.items()}
    }, f, ensure_ascii=False, indent=2)

print("\nWrote audit_report_9sets.json successfully.")

