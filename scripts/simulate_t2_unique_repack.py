import json

with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2 = json.load(f)

with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    sets = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    tmap = json.load(f)

t2_convex_id = tmap.get('2')
t2_sets = [s for s in sets if s.get('topicId') == t2_convex_id]
t2_sets.sort(key=lambda s: s.get('order', 0))

active_qs = t2['questions']
print(f"Total Topic 2 sets: {len(t2_sets)}")
print(f"Total questions needed: {len(t2_sets) * 20}")
print(f"Total active questions available: {len(active_qs)}")
assert len(active_qs) >= len(t2_sets) * 20, "Not enough questions in active pool!"
print(f"Excess questions after assigning 720 unique questions: {len(active_qs) - len(t2_sets) * 20}")

