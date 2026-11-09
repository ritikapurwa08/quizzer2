import json
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
t2_path = os.path.join(base_dir, "data", "questions", "rajasthan-gk", "topic_02.json")
pool_state_path = os.path.join(base_dir, "data", "sets", "pool-state.json")
sets_path = os.path.join(base_dir, "data", "sets", "published-sets.json")
mapping_path = os.path.join(base_dir, "data", "sets", "topic-id-mapping.json")

with open(t2_path, "r", encoding="utf-8") as f:
    t2_data = json.load(f)

with open(pool_state_path, "r", encoding="utf-8") as f:
    pool_state = json.load(f)

with open(sets_path, "r", encoding="utf-8") as f:
    published_sets = json.load(f)

with open(mapping_path, "r", encoding="utf-8") as f:
    topic_map = json.load(f)

questions = t2_data.get("questions", t2_data)
q_map = {q["id"]: q for q in questions}

# All 18 variants to separate completely from the top-level active pool
variant_ids = {
    'rg_000595', 'rg_000664', 'rg_000816', # Variants of rg_000571 (Gurushikhar)
    'rg_000602', 'rg_000645', 'rg_000815', # Variants of rg_000569 (Hadoti)
    'rg_013028', 'rg_012982',             # Variants of rg_012922 (Radcliffe line)
    'rg_000626', 'rg_001133',             # Variants of rg_000612 (Thar desert)
    'rg_000806', 'rg_000638',             # Variants of rg_000836 (Aravalli peaks match)
    'rg_000898', 'rg_000992',             # Variants of rg_000864 (Local peaks match)
    'rg_000005', 'rg_000075',             # Variants of rg_000001 (Tropic of cancer)
    'rg_012920',                          # Variant of rg_012925 (Pakistan border)
    'rg_000055'                           # Variant of rg_000038 (Banswara Dungarpur Tropic)
}

# Attach rg_000055 to rg_000038 similarQuestions if not already there
main_38 = q_map.get('rg_000038')
var_55 = q_map.get('rg_000055')
if main_38 and var_55:
    if not main_38.get('similarQuestions'):
        main_38['similarQuestions'] = []
    if not any(s['id'] == 'rg_000055' for s in main_38['similarQuestions']):
        main_38['similarQuestions'].append({
            'id': var_55['id'],
            'question': var_55['question'],
            'options': var_55['options'],
            'answer': var_55['answer'],
            'explanation': var_55.get('explanation'),
            'exam': var_55.get('exam'),
            'year': var_55.get('year'),
            'clusterTopic': 'कर्क रेखा बांसवाड़ा व डूंगरपुर'
        })

# Keep ONLY pure Main Questions in topic_02.json
clean_questions = [q for q in questions if q["id"] not in variant_ids]
print(f"Original Topic 2 questions in file: {len(questions)}")
print(f"Variants separated from pool: {len(variant_ids)}")
print(f"New clean active Topic 2 pool: {len(clean_questions)}")

t2_data["questions"] = clean_questions
t2_data["totalAvailable"] = len(clean_questions)

with open(t2_path, "w", encoding="utf-8") as f:
    json.dump(t2_data, f, ensure_ascii=False, indent=2)

print(f"Saved topic_02.json with totalAvailable = {len(clean_questions)}.")

# Update pool-state.json
t2_convex_id = topic_map["2"]
t2_sets = [s for s in published_sets if s.get("topicId") == t2_convex_id]
all_used_ids = set()
for s in t2_sets:
    for qid in s.get("questionIds", []):
        all_used_ids.add(qid)

clean_ids = [q["id"] for q in clean_questions]
unused_ids = [qid for qid in clean_ids if qid not in all_used_ids]

print(f"Total used in sets: {len(all_used_ids)}")
print(f"Total clean unused in reserve: {len(unused_ids)}")

if "topics" in pool_state and "2" in pool_state["topics"]:
    pool_state["topics"]["2"]["available"] = unused_ids
    pool_state["topics"]["2"]["totalAvailable"] = len(clean_questions)
    pool_state["topics"]["2"]["completedSets"] = 36

with open(pool_state_path, "w", encoding="utf-8") as f:
    json.dump(pool_state, f, ensure_ascii=False, indent=2)

print("Saved pool-state.json.")
print("\nDone! Topic 2 pool count is now 949.")

