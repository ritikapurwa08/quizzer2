import json
import os
from collections import Counter

def process_topic_02():
    print("=== STEP 1: ARCHIVING IDENTIFIED VARIANTS IN TOPIC 02 ===")
    
    with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
        t2 = json.load(f)

    active_qs = {q['id']: q for q in t2.get('questions', [])}
    archived_qs = {q['id']: q for q in t2.get('archivedVariants', [])}

    # Variants to archive and their anchors:
    # 1. rg_000649 -> anchor rg_000569 (Hadoti Plateau)
    # 2. rg_012914 -> anchor rg_012900 (Punjab and Haryana border)
    # 3. rg_000026 -> anchor rg_000025 (78 17 eastern longitude)
    # 4. rg_000756 -> anchor rg_000742 (Aravalli height descending order)
    variants_to_archive = {
        'rg_000649': 'rg_000569',
        'rg_012914': 'rg_012900',
        'rg_000026': 'rg_000025',
        'rg_000756': 'rg_000742'
    }

    archived_now = []
    for var_id, anchor_id in variants_to_archive.items():
        if var_id in active_qs:
            q = active_qs.pop(var_id)
            q['variantOf'] = anchor_id
            archived_qs[var_id] = q
            archived_now.append((var_id, anchor_id))
            print(f"Archived variant [{var_id}] -> Anchor [{anchor_id}]")
        elif var_id in archived_qs:
            print(f"[{var_id}] already archived.")

    # Save updated topic_02.json
    t2['questions'] = list(active_qs.values())
    t2['archivedVariants'] = list(archived_qs.values())
    
    with open('data/questions/rajasthan-gk/topic_02.json', 'w', encoding='utf-8') as f:
        json.dump(t2, f, ensure_ascii=False, indent=2)

    print(f"Topic 02 Pool updated: Active = {len(t2['questions'])}, Archived = {len(t2['archivedVariants'])}")

    # Update clusters in topic_02_clusters.json
    cluster_file = 'data/questions/variants/topic_02_clusters.json'
    clusters = []
    if os.path.exists(cluster_file):
        with open(cluster_file, 'r', encoding='utf-8') as cf:
            clusters = json.load(cf)

    cluster_by_anchor = {}
    for c in clusters:
        anc = c.get('anchor_id') or (c.get('anchor', {}).get('id') if isinstance(c.get('anchor'), dict) else None)
        if anc:
            cluster_by_anchor[anc] = c

    for var_id, anc_id in archived_now:
        var_q = archived_qs[var_id]
        anc_q = active_qs.get(anc_id) or archived_qs.get(anc_id)
        if anc_id in cluster_by_anchor:
            c = cluster_by_anchor[anc_id]
            # check if var_id already in variants
            existing_vids = [v.get('id') if isinstance(v, dict) else v for v in c.get('variants', [])]
            if var_id not in existing_vids:
                c.setdefault('variants', []).append({
                    'id': var_id,
                    'question': var_q.get('questionText') or var_q.get('question'),
                    'answer': var_q.get('correctAnswer') or var_q.get('answer'),
                    'similarity': 0.95
                })
                c['total_members'] = len(c['variants']) + 1
        else:
            new_c = {
                'cluster_id': f"C_T02_{len(clusters)+1:03d}",
                'anchor_id': anc_id,
                'anchor_question': anc_q.get('questionText') or anc_q.get('question') if anc_q else '',
                'anchor_answer': anc_q.get('correctAnswer') or anc_q.get('answer') if anc_q else '',
                'total_members': 2,
                'variants': [{
                    'id': var_id,
                    'question': var_q.get('questionText') or var_q.get('question'),
                    'answer': var_q.get('correctAnswer') or var_q.get('answer'),
                    'similarity': 0.95
                }]
            }
            clusters.append(new_c)
            cluster_by_anchor[anc_id] = new_c

    with open(cluster_file, 'w', encoding='utf-8') as cf:
        json.dump(clusters, cf, ensure_ascii=False, indent=2)
    print("Updated topic_02_clusters.json successfully.")

    print("\n=== STEP 2: REPACKING ALL 36 SETS OF TOPIC 02 WITH 100% GLOBAL UNIQUENESS ===")
    
    with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
        all_published_sets = json.load(f)

    with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
        tmap = json.load(f)
    t2_convex_id = tmap.get('2')

    t2_sets = [s for s in all_published_sets if s.get('topicId') == t2_convex_id]
    t2_sets.sort(key=lambda s: s.get('order', 0))

    active_ids = set(active_qs.keys())
    # All active questions in Topic 2
    all_available_pool = [q['id'] for q in t2['questions']]

    # We need to assign questions such that:
    # 1. No question appears more than once across all 36 sets.
    # 2. Existing valid assignments in sets are respected where possible on first-come basis.
    # 3. Any duplicate or archived question is replaced with an unassigned active question.
    
    globally_used_qids = set()
    total_slots = len(t2_sets) * 20
    print(f"Total sets to repack: {len(t2_sets)} (Slots: {total_slots})")

    # Pass 1: Keep legitimate first-seen active questions in each set
    temp_sets = []
    for s in t2_sets:
        clean_qids = []
        for qid in s.get('questionIds', []):
            if qid in active_ids and qid not in globally_used_qids:
                clean_qids.append(qid)
                globally_used_qids.add(qid)
        temp_sets.append({
            'set': s,
            'qids': clean_qids
        })

    # Pass 2: Fill empty slots from unused questions in all_available_pool
    unassigned_pool = [qid for qid in all_available_pool if qid not in globally_used_qids]
    print(f"Globally used after Pass 1: {len(globally_used_qids)}")
    print(f"Available unassigned active questions in Topic 02: {len(unassigned_pool)}")

    fill_idx = 0
    for item in temp_sets:
        s = item['set']
        qids = item['qids']
        while len(qids) < 20:
            if fill_idx >= len(unassigned_pool):
                raise RuntimeError("Ran out of unassigned questions in Topic 02!")
            fresh_qid = unassigned_pool[fill_idx]
            fill_idx += 1
            qids.append(fresh_qid)
            globally_used_qids.add(fresh_qid)
        
        s['questionIds'] = qids
        s['questionCount'] = 20

    # Verification of Topic 02 sets
    all_final_qids = []
    archived_found = 0
    internal_dups = 0
    for s in t2_sets:
        qids = s.get('questionIds', [])
        all_final_qids.extend(qids)
        if len(qids) != len(set(qids)):
            internal_dups += 1
        for qid in qids:
            if qid in archived_qs:
                archived_found += 1

    counts = Counter(all_final_qids)
    multi_used = {qid: c for qid, c in counts.items() if c > 1}

    print("\n=== POST-REPACK VERIFICATION OF TOPIC 02 ===")
    print(f"Total Sets: {len(t2_sets)}")
    print(f"Total Slots: {len(all_final_qids)} (Expected: 720)")
    print(f"Unique Questions Used: {len(counts)} (Expected: 720)")
    print(f"Questions appearing in multiple sets: {len(multi_used)} (Must be 0!)")
    print(f"Archived questions in sets: {archived_found} (Must be 0!)")
    print(f"Internal duplicate questions in sets: {internal_dups} (Must be 0!)")

    assert len(multi_used) == 0, f"Error: {len(multi_used)} questions appear in multiple sets!"
    assert archived_found == 0, "Error: archived questions found in sets!"
    assert internal_dups == 0, "Error: internal duplicates found in sets!"

    # Save published-sets.json
    with open('data/sets/published-sets.json', 'w', encoding='utf-8') as f:
        json.dump(all_published_sets, f, ensure_ascii=False, indent=2)

    print("Successfully saved clean data/sets/published-sets.json!")

if __name__ == '__main__':
    process_topic_02()
