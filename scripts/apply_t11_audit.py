import json
import csv
from collections import defaultdict
from pathlib import Path

# 1. Load topic_11.json
with open('data/questions/rajasthan-gk/topic_11.json', 'r', encoding='utf-8') as f:
    t11_data = json.load(f)

qs = t11_data['questions']
q_map = {q['id']: q for q in qs}

# 2. Fix verified typos
fixes = 0
if 'rg_008008' in q_map:
    q = q_map['rg_008008']
    q['question'] = q['question'].replace('नाधरा की पाल', 'नाथरा की पाल')
    fixes += 1

if 'rg_008334' in q_map:
    q = q_map['rg_008334']
    q['question'] = q['question'].replace('बाल्टा', 'बाल्दा')
    fixes += 1

if 'rg_008327' in q_map:
    q = q_map['rg_008327']
    q['question'] = q['question'].replace('मेरीजा-बानोला', 'मोरीजा-बानोल')
    fixes += 1

print(f"Applied {fixes} high-accuracy corrections to Topic 11 questions.")

# 3. Load clusters from duplicate_clusters.csv
clusters = defaultdict(list)
with open('audit_results_t11/duplicate_clusters.csv', 'r', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        clusters[row['cluster_id']].append(row)

# Save cluster manifests
cluster_manifest = {}
linked_count = 0
for cid, rows in clusters.items():
    main_row = next((r for r in rows if r['suggested_keep'] == 'yes'), rows[0])
    main_id = main_row['id']
    variants = [r['id'] for r in rows if r['id'] != main_id]
    cluster_manifest[cid] = {
        'mainId': main_id,
        'clusterSize': len(rows),
        'variants': variants,
        'questionSummary': main_row['question'][:100]
    }
    
    # Link inside questions for carousel
    if main_id in q_map:
        q_map[main_id]['similarQuestions'] = [
            {'id': vid, 'relation': 'duplicate'} for vid in variants
        ]
        linked_count += 1
    for vid in variants:
        if vid in q_map:
            q_map[vid]['isDuplicateOf'] = main_id

Path('data/questions/variants').mkdir(parents=True, exist_ok=True)
with open('data/questions/variants/topic_11_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(cluster_manifest, f, ensure_ascii=False, indent=2)

with open('data/questions/rajasthan-gk/topic_11.json', 'w', encoding='utf-8') as f:
    json.dump(t11_data, f, ensure_ascii=False, indent=2)

print(f"Linked {linked_count} clusters in topic_11.json and saved variants/topic_11_clusters.json.")

