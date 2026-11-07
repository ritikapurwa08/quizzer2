import json
import os

def clean_and_repack():
    print("=== REPACKING PUBLISHED SETS TO USE ONLY CLEAN ACTIVE QUESTIONS ===")
    
    # 1. Load active questions and archived variants per topic
    active_by_topic = {}
    archived_by_topic = {}
    variant_to_anchor = {}
    all_archived_ids = set()
    all_active_ids = set()

    for i in range(1, 56):
        path = f"data/questions/rajasthan-gk/topic_{i:02d}.json"
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            d = json.load(f)
        
        active_list = [q["id"] for q in d.get("questions", [])]
        archived_list = [q["id"] for q in d.get("archivedVariants", [])]
        
        active_by_topic[i] = active_list
        archived_by_topic[i] = set(archived_list)
        all_archived_ids.update(archived_list)
        all_active_ids.update(active_list)
        
        cluster_path = f"data/questions/variants/topic_{i:02d}_clusters.json"
        if os.path.exists(cluster_path):
            with open(cluster_path, "r", encoding="utf-8") as cf:
                clusters = json.load(cf)
                for c in clusters:
                    anc = c.get("anchor_id") or (c.get("anchor", {}).get("id") if isinstance(c.get("anchor"), dict) else None)
                    for v in c.get("variants", []):
                        vid = v.get("id") if isinstance(v, dict) else v
                        if vid and anc:
                            variant_to_anchor[vid] = anc

    # 2. Load mappings and published sets
    with open("data/sets/topic-id-mapping.json", "r", encoding="utf-8") as f:
        master_to_convex = json.load(f)
    convex_to_master = {v: int(k) for k, v in master_to_convex.items()}

    with open("data/sets/published-sets.json", "r", encoding="utf-8") as f:
        sets = json.load(f)

    # 3. For each Rajasthan GK topic, track which active questions are used across all sets of that topic
    # We want to ensure each set has 20 unique active questions, preferably using the anchor if not already used in that set
    # And if anchor is already in the set, pull an unassigned active question from the topic pool.
    
    replaced_count = 0
    repacked_sets_count = 0

    for s in sets:
        c_tid = s.get("topicId")
        m_tid = convex_to_master.get(c_tid)
        
        if not m_tid or m_tid not in active_by_topic:
            continue # Skip non-GK (e.g. English)
        
        qids = s.get("questionIds", [])
        if not any(qid in all_archived_ids for qid in qids) and len(qids) == len(set(qids)):
            continue # Already clean

        # Set needs cleanup
        new_qids = []
        seen_in_set = set()
        topic_pool = active_by_topic[m_tid]
        
        # Determine questions currently used in other sets of this topic to prefer fresh unused ones
        for qid in qids:
            if qid in all_archived_ids:
                # Need replacement
                anchor_id = variant_to_anchor.get(qid)
                replacement = None
                
                # Option A: Use anchor if it's not already in this set
                if anchor_id and anchor_id in active_by_topic[m_tid] and anchor_id not in seen_in_set and anchor_id not in qids:
                    replacement = anchor_id
                else:
                    # Option B: Pick an active question from topic_pool not in this set and not currently in qids
                    for cand in topic_pool:
                        if cand not in seen_in_set and cand not in qids:
                            replacement = cand
                            break
                
                if replacement:
                    new_qids.append(replacement)
                    seen_in_set.add(replacement)
                    replaced_count += 1
                else:
                    print(f"Warning: Could not find replacement for {qid} in Topic {m_tid}!")
            else:
                if qid not in seen_in_set:
                    new_qids.append(qid)
                    seen_in_set.add(qid)
                else:
                    # Internal duplicate in set! Replace with fresh
                    replacement = None
                    for cand in topic_pool:
                        if cand not in seen_in_set and cand not in qids:
                            replacement = cand
                            break
                    if replacement:
                        new_qids.append(replacement)
                        seen_in_set.add(replacement)
                        replaced_count += 1

        # Ensure length is exactly 20
        while len(new_qids) < 20:
            for cand in topic_pool:
                if cand not in seen_in_set:
                    new_qids.append(cand)
                    seen_in_set.add(cand)
                    break
        
        s["questionIds"] = new_qids
        s["questionCount"] = len(new_qids)
        repacked_sets_count += 1

    print(f"Replaced {replaced_count} archived/duplicate question references across {repacked_sets_count} sets.")

    # 4. Save updated published-sets.json
    with open("data/sets/published-sets.json", "w", encoding="utf-8") as f:
        json.dump(sets, f, ensure_ascii=False, indent=2)
    print("Successfully saved data/sets/published-sets.json!")

    # 5. Verification
    archived_still_used = 0
    internal_dups = 0
    bad_lengths = 0
    gk_sets_count = 0

    for s in sets:
        c_tid = s.get("topicId")
        m_tid = convex_to_master.get(c_tid)
        if not m_tid or m_tid not in active_by_topic:
            continue
        gk_sets_count += 1
        qids = s.get("questionIds", [])
        if len(qids) != 20:
            bad_lengths += 1
            print(f"Non-20 set: Topic {m_tid} - '{s.get('name')}' has {len(qids)} Qs (total active pool for topic: {len(active_by_topic[m_tid])})")
        if len(qids) != len(set(qids)):
            internal_dups += 1
        for qid in qids:
            if qid in all_archived_ids:
                archived_still_used += 1

    print(f"\n=== POST-REPACK VERIFICATION ({gk_sets_count} GK Sets) ===")
    print(f"Archived questions in GK sets: {archived_still_used} (Must be 0)")
    print(f"Internal duplicate IDs in sets: {internal_dups} (Must be 0)")
    print(f"GK Sets with != 20 questions:   {bad_lengths} (Must be 0)")

if __name__ == "__main__":
    clean_and_repack()
