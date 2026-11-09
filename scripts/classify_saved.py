import json

with open('audit_report_9sets.json', 'r', encoding='utf-8') as f:
    audit_data = json.load(f)

with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)
t2_map = {q['id']: q for q in t2['questions']}

with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1 = json.load(f)
t1_map = {q['id']: q for q in t1['questions']}
all_map = {**t1_map, **t2_map}

saved_items = audit_data['saved_questions']

print(f"Total saved questions to classify: {len(saved_items)}")

classified = []
for item in saved_items:
    qid = item['qid']
    q = all_map.get(qid, {})
    q_text = item['question']
    u_sel = item['user_sel']
    is_corr = item['is_corr']
    s_name = item['set']
    sys_ans = item['answer']
    opts = item['options']
    exp = item['explanation']
    
    cat = "UNKNOWN"
    reason = ""
    
    if qid == 'rg_012901':
        cat = "CRITICAL_KEY_ERROR"
        reason = "System marked D (अलवर) instead of B (दौसा). User correctly chose दौसा (does NOT border Haryana). 100% Platform Fault."
    elif qid == 'rg_000603':
        cat = "CORRUPTED_OPTION_TYPO"
        reason = "Option A was typed as 'भीलवाड़ा' instead of 'देलवाड़ा'. User picked A because Bhilwara is not an Abu peak. Double correct answer. 100% Platform Fault."
    elif qid == 'rg_012897':
        cat = "UI_OPTION_FORMATTING_BUG"
        reason = "Interstate border states (a,b,c,e) - UI option mismatch caused wrong selection. Platform Fault."
    elif any(k in q_text for k in ['सूची-I', 'सुमेलित', 'तालिका']):
        cat = "UI_TRUNCATION_GLITCH"
        reason = "cleanQuestionPrompt regex truncated the match table in the test UI. Platform Rendering Fault."
    elif qid in ['rg_000003', 'rg_000006', 'rg_000028']:
        cat = "SEMANTIC_NEAR_DUPLICATE"
        reason = "Rajasthan's area as % of India (10.41%) asked repeatedly with slight wording variations."
    elif qid in ['rg_000012', 'rg_000024', 'rg_000053']:
        cat = "SEMANTIC_NEAR_DUPLICATE"
        reason = "North-South (826 km) & East-West (869 km) extent / 43 km difference asked repeatedly."
    elif qid in ['rg_000161', 'rg_000166']:
        cat = "SEMANTIC_NEAR_DUPLICATE"
        reason = "District area descending order ranking asked multiple times."
    elif qid in ['rg_000604', 'rg_000605', 'rg_000569']:
        cat = "SEMANTIC_NEAR_DUPLICATE"
        reason = "Hadoti plateau district coverage asked multiple times."
    elif qid in ['rg_000608', 'rg_000612', 'rg_000563', 'rg_000570']:
        cat = "SEMANTIC_NEAR_DUPLICATE"
        reason = "Aravalli peaks height ordering asked repeatedly."
    elif not is_corr:
        cat = "USER_CONCEPTUAL_ERROR"
        reason = f"Key ({sys_ans}) is geographically accurate; user selected {u_sel}."
    else:
        cat = "USER_VERIFIED_BOOKMARK"
        reason = "User answered correctly and bookmarked for review/revision."

    classified.append({
        'qid': qid,
        'set': s_name,
        'question': q_text,
        'category': cat,
        'reason': reason,
        'user_sel': u_sel,
        'sys_ans': sys_ans,
        'is_corr': is_corr
    })

# Summary counts
from collections import Counter
counts = Counter(c['category'] for c in classified)
print("\n--- Breakdown of User's Bookmarked Questions ---")
for k, v in counts.items():
    print(f"  {k}: {v}")

with open('classified_saved_questions.json', 'w', encoding='utf-8') as f:
    json.dump(classified, f, ensure_ascii=False, indent=2)

print("\nWrote classified_saved_questions.json")

