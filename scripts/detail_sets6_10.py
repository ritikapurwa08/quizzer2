import json

with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    sets = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    tmap = json.load(f)

t2_convex_id = tmap.get('2')
t2_sets = [s for s in sets if s.get('topicId') == t2_convex_id]
t2_sets.sort(key=lambda s: s.get('order', 0))

with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2_data = json.load(f)

with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1_data = json.load(f)

all_qs = {q['id']: q for q in t1_data.get('questions', []) + t1_data.get('archivedVariants', []) + t2_data.get('questions', []) + t2_data.get('archivedVariants', [])}

target_sets = []
for s in t2_sets:
    order = s.get('order', 0)
    name = s.get('name', '')
    # Check if order is 5, 6, 7, 8, 9 (0-indexed or 1-indexed for Parts 6 to 10)
    if any(f"भाग {x}" in name or f"Part {x}" in name for x in [6, 7, 8, 9, 10]):
        target_sets.append(s)

print(f"Target Sets found: {len(target_sets)}")
for s in target_sets:
    print(f"\n=======================================================")
    print(f"SET: {s.get('name')} (Order: {s.get('order')}, ID: {s.get('id') or s.get('_id')})")
    print(f"=======================================================")
    qids = s.get('questionIds', [])
    for idx, qid in enumerate(qids, 1):
        q = all_qs.get(qid)
        text = (q.get('questionText') or q.get('question') or '') if q else 'NOT FOUND'
        ans = q.get('correctAnswer') or q.get('answer') if q else ''
        print(f"{idx:02d}. [{qid}] {text[:70]} (Ans: {ans})")

