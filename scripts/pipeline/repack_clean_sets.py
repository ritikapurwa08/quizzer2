import json
import os
from collections import defaultdict

print("=" * 60)
print("RE-PACKING TOPIC 1 & 2 SETS WITH ZERO DUPLICATES")
print("=" * 60)

# 1. Load Topic 1 questions
with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1_data = json.load(f)
t1_qs = t1_data['questions']
t1_map = {q['id']: q for q in t1_qs}

# 2. Load Topic 2 questions
with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2_data = json.load(f)
t2_qs = t2_data['questions']
t2_map = {q['id']: q for q in t2_qs}

# 3. Load similarity clusters from our Groq audit runs
with open('audit_results_t1/similar_questions.json', 'r', encoding='utf-8') as f:
    t1_clusters = json.load(f)

with open('audit_results_t2/similar_questions.json', 'r', encoding='utf-8') as f:
    t2_clusters = json.load(f)

# Save cluster variants for review screen carousel
os.makedirs('data/questions/variants', exist_ok=True)
with open('data/questions/variants/topic_01_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(t1_clusters, f, ensure_ascii=False, indent=2)

with open('data/questions/variants/topic_02_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(t2_clusters, f, ensure_ascii=False, indent=2)

# Attach similarQuestions to questions in topic_01 and topic_02
t1_sim_map = {c['main']: c['similarQuestions'] for c in t1_clusters}
for q in t1_qs:
    if q['id'] in t1_sim_map:
        q['similarQuestions'] = t1_sim_map[q['id']]

t2_sim_map = {c['main']: c['similarQuestions'] for c in t2_clusters}
for q in t2_qs:
    if q['id'] in t2_sim_map:
        q['similarQuestions'] = t2_sim_map[q['id']]

# Save updated topic_01 and topic_02
with open('data/questions/rajasthan-gk/topic_01.json', 'w', encoding='utf-8') as f:
    json.dump(t1_data, f, ensure_ascii=False, indent=2)

with open('data/questions/rajasthan-gk/topic_02.json', 'w', encoding='utf-8') as f:
    json.dump(t2_data, f, ensure_ascii=False, indent=2)

print(f"Updated topic_01.json ({len(t1_qs)} Qs) and topic_02.json ({len(t2_qs)} Qs) with similarQuestions.")

# 4. Filter true duplicate IDs so they are not used in live sets
t1_dup_ids = set()
# In Topic 1, only exact identical twins should be excluded from live slots
t1_exact_twins = {'rg_013102', 'rg_013061', 'rg_013090', 'rg_015366'}
t1_dup_ids.update(t1_exact_twins)

t2_dup_ids = set()
for c in t2_clusters:
    for sq in c.get('similarQuestions', []):
        if sq.get('relation') == 'duplicate':
            t2_dup_ids.add(sq['id'])

print(f"Topic 1 excluded twins: {len(t1_dup_ids)}")
print(f"Topic 2 excluded duplicates: {len(t2_dup_ids)}")

# Available active pools
t1_pool = [q['id'] for q in t1_qs if q['id'] not in t1_dup_ids]
t2_pool = [q['id'] for q in t2_qs if q['id'] not in t2_dup_ids]

print(f"Topic 1 available unique: {len(t1_pool)} (Need 200 for 10 sets)")
print(f"Topic 2 available unique: {len(t2_pool)} (Need 720 for 36 sets)")

assert len(t1_pool) >= 200, f"Topic 1 pool short: {len(t1_pool)}"
assert len(t2_pool) >= 720, f"Topic 2 pool short: {len(t2_pool)}"

# Load existing published-sets.json
with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    published = json.load(f)

# Re-pack Topic 1 sets (10 sets)
t1_sets = [s for s in published if 'सामान्य ज्ञान' in s.get('name', '')]
t1_sets.sort(key=lambda s: s.get('order', 0))

allocated_t1 = 0
for idx, s in enumerate(t1_sets[:10]):
    qids = t1_pool[idx * 20 : (idx + 1) * 20]
    s['questionIds'] = qids
    s['questionCount'] = len(qids)
    allocated_t1 += len(qids)

print(f"Allocated {allocated_t1} unique questions to {len(t1_sets[:10])} Topic 1 sets.")

# Re-pack Topic 2 sets (36 sets)
t2_sets = [s for s in published if 'भौतिक स्वरूप' in s.get('name', '')]
t2_sets.sort(key=lambda s: s.get('order', 0))

allocated_t2 = 0
for idx, s in enumerate(t2_sets[:36]):
    qids = t2_pool[idx * 20 : (idx + 1) * 20]
    s['questionIds'] = qids
    s['questionCount'] = len(qids)
    allocated_t2 += len(qids)

print(f"Allocated {allocated_t2} unique questions to {len(t2_sets[:36])} Topic 2 sets.")

# Save published-sets.json
with open('data/sets/published-sets.json', 'w', encoding='utf-8') as f:
    json.dump(published, f, ensure_ascii=False, indent=2)

print("\nWrote updated published-sets.json successfully!")

# Verification: Check cross-set overlaps
all_used_t1 = []
for s in t1_sets[:10]:
    all_used_t1.extend(s['questionIds'])
print(f"Topic 1: Total slots {len(all_used_t1)}, Unique Qs {len(set(all_used_t1))}, Duplicates = {len(all_used_t1) - len(set(all_used_t1))}")

all_used_t2 = []
for s in t2_sets[:36]:
    all_used_t2.extend(s['questionIds'])
print(f"Topic 2: Total slots {len(all_used_t2)}, Unique Qs {len(set(all_used_t2))}, Duplicates = {len(all_used_t2) - len(set(all_used_t2))}")
