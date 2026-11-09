import json
import csv
from pathlib import Path
from collections import Counter

# Load topic 17 questions
t17_path = Path("data/questions/rajasthan-gk/topic_17.json")
with open(t17_path, "r", encoding="utf-8") as f:
    t17_data = json.load(f)

qs = {q["id"]: q for q in t17_data["questions"]}

# 1. Apply Flagged Key & Typo Fixes
# 1. rg_006442: Silhadi Tanwar betrayed Sanga, option D, not C (Udai Singh)
if "rg_006442" in qs:
    qs["rg_006442"]["answer"] = "D"
    print("Fixed rg_006442 answer key to D (सल्हदी तंवर).")

# 2. rg_006668: James Tod called Battle of Dewair Marathon of Mewar, option B, not D (Sarangpur)
if "rg_006668" in qs:
    qs["rg_006668"]["answer"] = "B"
    print("Fixed rg_006668 answer key to B (दिवेर का युद्ध).")

# 3. rg_011445: Dasharatha Sharma author of Early Chauhan Dynasties, option C typo fixed, answer C
if "rg_011445" in qs:
    opts = qs["rg_011445"]["options"]
    if len(opts) > 2 and "शरथ" in opts[2]:
        opts[2] = "दशरथ शर्मा"
    qs["rg_011445"]["options"] = opts
    qs["rg_011445"]["answer"] = "C"
    print("Fixed rg_011445 typo & answer key to C (दशरथ शर्मा).")

# 4. rg_011449: Dasharatha Sharma author, option B typo fixed, answer B
if "rg_011449" in qs:
    opts = qs["rg_011449"]["options"]
    if len(opts) > 1 and "शरथ" in opts[1]:
        opts[1] = "दशरथ शर्मा"
    qs["rg_011449"]["options"] = opts
    qs["rg_011449"]["answer"] = "B"
    print("Fixed rg_011449 typo & answer key to B (दशरथ शर्मा).")

# 5. rg_011582: Ghosundi inscription language is Sanskrit (B), not Pali (C)
if "rg_011582" in qs:
    qs["rg_011582"]["answer"] = "B"
    print("Fixed rg_011582 answer key to B (संस्कृत).")

# 6. rg_011478: Ghosundi inscription language is Sanskrit (D), not Apabhramsha (C)
if "rg_011478" in qs:
    qs["rg_011478"]["answer"] = "D"
    print("Fixed rg_011478 answer key to D (संस्कृत).")

# 7. rg_006925: Zij Muhammad Shahi author is Sawai Jai Singh (B), typo fixed, answer B
if "rg_006925" in qs:
    opts = qs["rg_006925"]["options"]
    if len(opts) > 1 and opts[1] == "वाई जयसिंह":
        opts[1] = "सवाई जयसिंह"
    qs["rg_006925"]["options"] = opts
    qs["rg_006925"]["answer"] = "B"
    print("Fixed rg_006925 typo & answer key to B (सवाई जयसिंह).")

# 8. rg_006997: Man Singh subahdar of Kabul, Bihar, Bengal (a, c, d), answer D, not A
if "rg_006997" in qs:
    qs["rg_006997"]["answer"] = "D"
    print("Fixed rg_006997 answer key to D (a, c और d).")

# 9. rg_006452: Mughal army commander at Haldighati was Raja Man Singh (D), not Rana Punja (A)
if "rg_006452" in qs:
    qs["rg_006452"]["answer"] = "D"
    qs["rg_006452"]["explanation"] = "हल्दीघाटी के युद्ध (18 जून, 1576) में अकबर की मुगल सेना का मुख्य सेनापति आमेर के राजा मान सिंह (प्रथम) था, जबकि आसफ खां सहयोगी सेनापति था।"
    print("Fixed rg_006452 answer key to D (राजा मान सिंह).")

# 10. rg_014673: Matsya capital typos fixed
if "rg_014673" in qs:
    qs["rg_014673"]["question"] = "निम्न में से कौनसा स्थल प्राचीन मत्स्य महाजनपद की राजधानी था ?"
    opts = qs["rg_014673"]["options"]
    if len(opts) > 0 and opts[0] == "याना":
        opts[0] = "बयाना"
    qs["rg_014673"]["options"] = opts
    qs["rg_014673"]["explanation"] = "प्राचीन मत्स्य महाजनपद की राजधानी विराटनगर (बैराठ) थी।"
    print("Fixed rg_014673 typos & explanation.")

# 2. Load Clusters from duplicate_clusters.csv
clusters_file = Path("audit_results_t17/duplicate_clusters.csv")
clusters_data = {}
with open(clusters_file, "r", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for r in reader:
        cid = r["cluster_id"]
        if cid not in clusters_data:
            clusters_data[cid] = {"cluster_id": cid, "anchor_id": None, "members": []}
        clusters_data[cid]["members"].append({
            "id": r["id"],
            "question": r["question"],
            "answer": r["answer"],
            "is_anchor": r.get("is_anchor") == "True"
        })
        if r.get("is_anchor") == "True":
            clusters_data[cid]["anchor_id"] = r["id"]

for cid, c in clusters_data.items():
    if not c["anchor_id"] and c["members"]:
        c["anchor_id"] = c["members"][0]["id"]
        c["members"][0]["is_anchor"] = True

# Save variants file
variants_path = Path("data/questions/variants/topic_17_clusters.json")
with open(variants_path, "w", encoding="utf-8") as f:
    json.dump(list(clusters_data.values()), f, ensure_ascii=False, indent=2)
print(f"Saved {len(clusters_data)} clusters to {variants_path}")

# 3. Link similarQuestions in topic_17.json
duplicates_set = set()
for c in clusters_data.values():
    anchor = c["anchor_id"]
    variant_ids = [m["id"] for m in c["members"] if m["id"] != anchor]
    for vid in variant_ids:
        duplicates_set.add(vid)
    if anchor in qs:
        qs[anchor]["similarQuestions"] = variant_ids

t17_data["questions"] = list(qs.values())
with open(t17_path, "w", encoding="utf-8") as f:
    json.dump(t17_data, f, ensure_ascii=False, indent=2)
print(f"Updated {t17_path}: {len(duplicates_set)} duplicate questions linked as variants under {len(clusters_data)} anchors.")

# 4. Clean & Repack the 51 published sets of Topic 17 (0 duplicates, 0 cross-set repeats!)
pub_path = Path("data/sets/published-sets.json")
with open(pub_path, "r", encoding="utf-8") as f:
    published_sets = json.load(f)

with open("data/sets/topic-id-mapping.json", encoding="utf-8") as f:
    mapping = json.load(f)

t17_id = mapping.get("17")
t17_sets = [s for s in published_sets if s.get("topicId") == t17_id]
other_sets = [s for s in published_sets if s.get("topicId") != t17_id]

# Build pool of clean questions (not in duplicates_set)
clean_pool = [q["id"] for q in t17_data["questions"] if q["id"] not in duplicates_set]
print(f"Total clean, unique non-duplicate questions in Topic 17 pool: {len(clean_pool)}")

# Repack each of the 51 sets with 20 mutually exclusive questions
used_ids = set()
repacked_sets = []
for i, s in enumerate(t17_sets):
    # Prefer existing questions if they are clean and not yet used
    existing = s.get("questionIds", [])
    # Deduplicate existing questions within the set as well
    seen_in_set = set()
    valid_existing = []
    for qid in existing:
        if qid in clean_pool and qid not in used_ids and qid not in seen_in_set:
            seen_in_set.add(qid)
            valid_existing.append(qid)
    
    needed = 20 - len(valid_existing)
    # Fill remaining from clean_pool
    fillers = []
    if needed > 0:
        for qid in clean_pool:
            if qid not in used_ids and qid not in valid_existing:
                fillers.append(qid)
                if len(fillers) == needed:
                    break
    
    new_set_qids = valid_existing + fillers
    for qid in new_set_qids:
        used_ids.add(qid)
    
    s["questionIds"] = new_set_qids
    s["questionCount"] = len(new_set_qids)
    repacked_sets.append(s)

# Verify 0 cross-set repeats in repacked Topic 17 sets
check_counts = Counter()
for s in repacked_sets:
    check_counts.update(s["questionIds"])

repeats = [q for q, c in check_counts.items() if c > 1]
dups_in_sets = [q for q in check_counts if q in duplicates_set]
print(f"Repacked {len(repacked_sets)} Topic 17 sets: {len(used_ids)} questions assigned.")
print(f"Verification -> Cross-set repeats: {len(repeats)}, Duplicate questions in sets: {len(dups_in_sets)} (BOTH ZERO!)")

published_sets = other_sets + repacked_sets
with open(pub_path, "w", encoding="utf-8") as f:
    json.dump(published_sets, f, ensure_ascii=False, indent=2)
print("Updated published-sets.json successfully with clean Topic 17 sets!")
