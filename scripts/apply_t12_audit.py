import json
import csv
from collections import defaultdict
from pathlib import Path

# 1. Load topic_12.json
with open('data/questions/rajasthan-gk/topic_12.json', 'r', encoding='utf-8') as f:
    t12_data = json.load(f)

qs = t12_data['questions']
q_map = {q['id']: q for q in qs}

fixes = 0

# Fix 1: rg_011686
if 'rg_011686' in q_map:
    q = q_map['rg_011686']
    q['question'] = q['question'].replace('कीन सा', 'कौन सा')
    fixes += 1

# Fix 2: rg_011688
if 'rg_011688' in q_map:
    q = q_map['rg_011688']
    q['question'] = q['question'].replace('परमाणा', 'परमाणु')
    fixes += 1

# Fix 3: rg_011744
if 'rg_011744' in q_map:
    q = q_map['rg_011744']
    q['question'] = q['question'].replace('मथानिय', 'मथानिया')
    fixes += 1

# Fix 4: rg_011741
if 'rg_011741' in q_map:
    q = q_map['rg_011741']
    q['answer'] = 'B'
    fixes += 1

# Fix 5: rg_011742
if 'rg_011742' in q_map:
    q = q_map['rg_011742']
    q['answer'] = 'A'
    fixes += 1

print(f"Applied {fixes} high-accuracy corrections to Topic 12 questions.")

# 2. Load clusters from duplicate_clusters.csv
clusters = defaultdict(list)
with open('audit_results_t12/duplicate_clusters.csv', 'r', encoding='utf-8-sig') as f:
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
with open('data/questions/variants/topic_12_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(cluster_manifest, f, ensure_ascii=False, indent=2)

with open('data/questions/rajasthan-gk/topic_12.json', 'w', encoding='utf-8') as f:
    json.dump(t12_data, f, ensure_ascii=False, indent=2)

print(f"Linked {linked_count} clusters in topic_12.json and saved variants/topic_12_clusters.json.")

