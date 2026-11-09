import json

with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    ps = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    tm = json.load(f)

cid2 = tm['2']
t2_sets = [s for s in ps if s.get('topicId') == cid2]

print(f"=== FINAL AUDIT OF TOPIC 2 PUBLISHED SETS ===")
print(f"Total Topic 2 Sets: {len(t2_sets)}")

seen = set()
duplicates = []
all_convex_ids = True

for idx, s in enumerate(t2_sets, 1):
    sid = s.get('id', '')
    if not sid.startswith('kd7'):
        all_convex_ids = False
        print(f"Non-convex ID: Set {idx} -> {sid}")
        
    qids = s.get('questionIds', [])
    if len(qids) != 20:
        print(f"Warning: Set {idx} ({sid}) has {len(qids)} questions instead of 20!")
        
    for qid in qids:
        if qid in seen:
            duplicates.append((idx, qid))
        seen.add(qid)

print(f"All sets have valid Convex IDs: {all_convex_ids}")
print(f"Total Unique Questions Used Across All 40 Sets: {len(seen)}")
print(f"Total Cross-Set Duplicate Questions: {len(duplicates)}")
print(f"Expected: 40 Sets x 20 Questions = 800 Unique Questions, 0 Duplicates.")
if len(seen) == 800 and len(duplicates) == 0 and len(t2_sets) == 40:
    print("🌟 100% PERFECT MATCH! ALL 40 SETS ARE GLOBALLY UNIQUE WITH REAL CONVEX IDS!")

