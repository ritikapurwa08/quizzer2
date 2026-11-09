import json
from collections import defaultdict

with open('today_audit_details.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

attempts = data['attempts']
bookmarks = data['bookmarks']

# Map of questions in the 9 sets
set_questions = {}
all_qids_in_9_sets = []
for att in attempts:
    s_name = att['testSetName']
    qids = [ans['questionId'] for ans in att['answers']]
    set_questions[s_name] = qids
    all_qids_in_9_sets.extend(qids)

print("--- Question count per set ---")
for s_name, qids in set_questions.items():
    print(f"{s_name}: {len(qids)} questions")

# Check cross-set overlaps among these 9 sets!
print("\n--- Cross-set Question Overlaps among these 9 sets ---")
qid_sets = defaultdict(list)
for s_name, qids in set_questions.items():
    for qid in qids:
        qid_sets[qid].append(s_name)

repeats = {qid: sets for qid, sets in qid_sets.items() if len(sets) > 1}
print(f"Total questions appearing in MULTIPLE sets among the 9 sets: {len(repeats)}")
for qid, sets in list(repeats.items())[:20]:
    print(f"  Question {qid} appears in: {sets}")

# Inspect bookmarked questions
print(f"\n--- Bookmarked questions analysis ({len(bookmarks)} total) ---")
b_in_9_sets = [b for b in bookmarks if b['found_in_set'] is not None]
b_not_in_9 = [b for b in bookmarks if b['found_in_set'] is None]
print(f"Bookmarked from these 9 sets: {len(b_in_9_sets)}")
print(f"Bookmarked from other sets (e.g. Topic 1): {len(b_not_in_9)}")

# Let's see what questions were bookmarked and their details
with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)
t2_map = {q['id']: q for q in t2['questions']}

with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1 = json.load(f)
t1_map = {q['id']: q for q in t1['questions']}

all_map = {**t1_map, **t2_map}

print("\n--- Details of Bookmarked Questions from Today's 9 Sets ---")
for i, b in enumerate(b_in_9_sets):
    qid = b['qid']
    q = all_map.get(qid)
    u_ans = b['user_ans']
    if q:
        prompt = q.get('prompt', '').replace('\n', ' ')[:80]
        correct_key = q.get('answerKey')
        user_sel = u_ans.get('selected') if u_ans else 'N/A'
        is_corr = u_ans.get('isCorrect') if u_ans else 'N/A'
        print(f"[{i+1}] {qid} ({b['found_in_set']}) | Correct: {correct_key} | UserSel: {user_sel} | IsCorrect: {is_corr} | Prompt: {prompt}")
    else:
        print(f"[{i+1}] {qid} NOT FOUND IN TOPIC 1/2 JSON!")


