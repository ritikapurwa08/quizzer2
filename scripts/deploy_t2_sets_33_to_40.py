import json
import subprocess
import os

print("=== DEPLOYING COMPLETE 40 UNIQUE SETS FOR TOPIC 2 ===")

# 1. Load Topic 2 questions
with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2_data = json.load(f)
    active_qs = t2_data.get('questions', [])
    q_by_id = {q['id']: q for q in active_qs}

print(f"Total Active Questions in Topic 2 Pool: {len(active_qs)}")

# 2. Load published-sets.json
with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    published_sets = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    topic_map = json.load(f)

t2_convex_topic_id = topic_map['2']

# Find sets 1 to 32 already in published_sets
t2_existing_32 = []
used_qids = set()

for s in published_sets:
    if s.get('topicId') == t2_convex_topic_id:
        sid = s.get('id', '')
        if sid.startswith('kd7') and sid != 'kd7f9sj73q6dvqhhrt9aemn6y58hwdkt':
            t2_existing_32.append(s)
            used_qids.update(s.get('questionIds', []))

print(f"Found {len(t2_existing_32)} existing Convex sets (Sets 1 to 32) using {len(used_qids)} unique questions.")

# 3. Find unused pool questions
all_active_ids = [q['id'] for q in active_qs]
unused_ids = [qid for qid in all_active_ids if qid not in used_qids]
print(f"Total Unused Questions available for Sets 33 to 40: {len(unused_ids)}")

# 4. We will create 8 new sets (Sets 33 to 40) of 20 questions each (total 160 Qs)
# Set 33 was already created in Convex: kd7f9sj73q6dvqhhrt9aemn6y58hwdkt
new_sets_info = [
    {"setNum": 33, "name": "राजस्थान का भौतिक स्वरूप एवं भूगोल भाग 33", "convexId": "kd7f9sj73q6dvqhhrt9aemn6y58hwdkt"}
]

# We need to create Sets 34 to 40 in Convex
for s_num in range(34, 41):
    s_name = f"राजस्थान का भौतिक स्वरूप एवं भूगोल भाग {s_num}"
    args_obj = {
        "topicId": t2_convex_topic_id,
        "name": s_name,
        "negativeMarking": True,
        "questions": [{"id": f"q_{i}"} for i in range(20)],
        "adminSecret": "quizzer_admin_pool_init_2026"
    }
    cmd = ["npx", "convex", "run", "testSets:importTestSet", json.dumps(args_obj, ensure_ascii=False), "--prod"]
    print(f"Creating Set {s_num} in Convex...")
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"Error creating Set {s_num}: {res.stderr}")
        raise RuntimeError(f"Convex creation failed for set {s_num}")
    
    out_json = json.loads(res.stdout.strip())
    cid = out_json.get("testSetId")
    print(f"✅ Set {s_num} created in Convex! ID: {cid}")
    new_sets_info.append({"setNum": s_num, "name": s_name, "convexId": cid})

# 5. Allocate 20 unique questions to each of the 8 new sets
print("\nAllocating 20 unique questions to each of Sets 33 to 40...")
new_published_entries = []
new_set_files_data = []

for idx, s_info in enumerate(new_sets_info):
    s_num = s_info["setNum"]
    cid = s_info["convexId"]
    s_name = s_info["name"]
    
    chunk_ids = unused_ids[idx*20 : (idx+1)*20]
    used_qids.update(chunk_ids)
    
    # Manifest entry for published-sets.json
    manifest_entry = {
        "id": cid,
        "name": s_name,
        "topicId": t2_convex_topic_id,
        "masterTopicId": 2,
        "negativeMarking": True,
        "order": s_num,
        "questionCount": len(chunk_ids),
        "questionIds": chunk_ids
    }
    new_published_entries.append(manifest_entry)
    
    # Set file payload for data/sets/topic-02/set-XXX.json
    padSet = f"{s_num:03d}"
    set_payload = {
        "setId": f"topic-2-set-{padSet}",
        "convexId": cid,
        "masterTopicId": 2,
        "masterTopic": "राजस्थान का भौतिक स्वरूप एवं भूगोल",
        "setNumber": s_num,
        "completedAt": "2026-11-09T14:50:00.000Z",
        "questionCount": len(chunk_ids),
        "questionIds": chunk_ids,
        "questions": [q_by_id[qid] for qid in chunk_ids if qid in q_by_id]
    }
    new_set_files_data.append((padSet, set_payload))

# 6. Save set JSON files to data/sets/topic-02/
os.makedirs("data/sets/topic-02", exist_ok=True)
for padSet, payload in new_set_files_data:
    fpath = f"data/sets/topic-02/set-{padSet}.json"
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Saved {fpath} with {len(payload['questionIds'])} unique questions.")

# 7. Update published-sets.json
# Remove any old topic-2 entries that had dummy IDs (e.g. topic-2-set-033..37)
clean_published = [
    s for s in published_sets 
    if not (s.get('topicId') == t2_convex_topic_id and not str(s.get('id', '')).startswith('kd7'))
]
# Remove kd7f9sj73q6dvqhhrt9aemn6y58hwdkt if it was already in clean_published
clean_published = [s for s in clean_published if s.get('id') != 'kd7f9sj73q6dvqhhrt9aemn6y58hwdkt']

# Append all 8 new entries
clean_published.extend(new_published_entries)

# Sort all published sets cleanly
with open('data/sets/published-sets.json', 'w', encoding='utf-8') as f:
    json.dump(clean_published, f, ensure_ascii=False, indent=2)

print(f"\n✅ Updated published-sets.json! Topic 2 now has exactly 40 sets with real Convex IDs.")

# 8. Update pool-state.json
with open('data/sets/pool-state.json', 'r', encoding='utf-8') as f:
    pool_state = json.load(f)

t2_state = pool_state['topics']['2']
# Rebuild used list from used_qids
t2_state['used'] = [{'id': qid, 'usedAt': '2026-11-09T14:50:00.000Z'} for qid in used_qids]
t2_state['available'] = [qid for qid in all_active_ids if qid not in used_qids]
t2_state['candidate'] = []
t2_state['completedSets'] = 40
pool_state['updatedAt'] = '2026-11-09T14:50:00.000Z'

with open('data/sets/pool-state.json', 'w', encoding='utf-8') as f:
    json.dump(pool_state, f, ensure_ascii=False, indent=2)

print(f"✅ Updated pool-state.json! Topic 2 completedSets: 40 | Used: {len(t2_state['used'])} | Remaining Available: {len(t2_state['available'])}")
