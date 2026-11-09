import json
import csv
from collections import defaultdict
from pathlib import Path

# 1. Load topic_08.json
with open('data/questions/rajasthan-gk/topic_08.json', 'r', encoding='utf-8') as f:
    t8_data = json.load(f)

qs = t8_data['questions']
q_map = {q['id']: q for q in qs}

# 2. Apply verified factual and OCR typo corrections
fixes = 0

# Fix 1: rg_013696
if 'rg_013696' in q_map:
    q = q_map['rg_013696']
    q['question'] = q['question'].replace('केशरगढ़', 'केसरबाग')
    fixes += 1

# Fix 2: rg_014017
if 'rg_014017' in q_map:
    q = q_map['rg_014017']
    q['options'] = [o.replace('बाद्य', 'बाघ') for o in q['options']]
    fixes += 1

# Fix 3: rg_006246
if 'rg_006246' in q_map:
    q = q_map['rg_006246']
    q['options'] = [o.replace('भतरपुर', 'भरतपुर') for o in q['options']]
    q['answer'] = 'D'
    fixes += 1

# Fix 4: rg_006311
if 'rg_006311' in q_map:
    q = q_map['rg_006311']
    q['answer'] = 'D'
    fixes += 1

# Fix 5: rg_013776
if 'rg_013776' in q_map:
    q = q_map['rg_013776']
    q['options'] = [o.replace('बाऊ लाल बोहरा', 'दाऊ लाल बोहरा') for o in q['options']]
    q['answer'] = 'B'
    fixes += 1

# Fix 6: rg_013743
if 'rg_013743' in q_map:
    q = q_map['rg_013743']
    q['options'] = [o.replace('बाऊलाल बोहरा', 'दाऊ लाल बोहरा') for o in q['options']]
    q['answer'] = 'B'
    fixes += 1

# Fix 7: rg_006139
if 'rg_006139' in q_map:
    q = q_map['rg_006139']
    q['answer'] = 'A'
    fixes += 1

# Fix 8: rg_006202
if 'rg_006202' in q_map:
    q = q_map['rg_006202']
    q['answer'] = 'D'
    fixes += 1

print(f"Applied {fixes} high-accuracy corrections to Topic 08 questions.")

# 3. Load clusters from duplicate_clusters.csv
clusters = defaultdict(list)
with open('audit_results_t8/duplicate_clusters.csv', 'r', encoding='utf-8-sig') as f:
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
with open('data/questions/variants/topic_08_clusters.json', 'w', encoding='utf-8') as f:
    json.dump(cluster_manifest, f, ensure_ascii=False, indent=2)

with open('data/questions/rajasthan-gk/topic_08.json', 'w', encoding='utf-8') as f:
    json.dump(t8_data, f, ensure_ascii=False, indent=2)

print(f"Linked {linked_count} clusters in topic_08.json and saved variants/topic_08_clusters.json.")

