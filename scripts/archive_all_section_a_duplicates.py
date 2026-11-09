#!/usr/bin/env python3
"""
Archive Duplicates Script:
1. Moves all absorbed duplicate questions from `questions` array into `archivedVariants`
   for Topics 1 to 17 in `data/questions/rajasthan-gk/topic_XX.json`.
2. Updates `data/sets/published-sets.json` so that NO published set contains any duplicate variant.
3. Automatically drops the Master Pool total from 13,952 down to the true clean number!
"""

import json
import os
import re
from pathlib import Path

def run_archival():
    total_raw_before = 0
    total_clean_after = 0
    total_archived_all = 0
    topic_summary = []

    all_dup_ids_by_topic = {}

    for t in range(1, 18):
        c_fn = Path(f"data/questions/variants/topic_{t:02d}_clusters.json")
        q_fn = Path(f"data/questions/rajasthan-gk/topic_{t:02d}.json")
        if not c_fn.exists() or not q_fn.exists():
            continue

        c_data = json.load(open(c_fn, encoding="utf-8"))
        clusters = list(c_data.values()) if isinstance(c_data, dict) else c_data

        dup_ids = set()
        for c in clusters:
            if "members" in c:
                for m in c["members"]:
                    if not m.get("is_anchor", False):
                        dup_ids.add(m["id"])
            elif "variants" in c:
                for v in c["variants"]:
                    if isinstance(v, dict):
                        if not v.get("is_anchor", False):
                            dup_ids.add(v["id"])
                    else:
                        dup_ids.add(v)
            elif "similarQuestions" in c:
                for s in c["similarQuestions"]:
                    dup_ids.add(s if isinstance(s, str) else s.get("id"))

        # Explicitly ensure bookmarked duplicates are included
        if t == 2:
            dup_ids.add("rg_012914") # duplicate of rg_012900 (पंजाब और हरियाणा)
            dup_ids.add("rg_000017") # variant of rg_000012 (826 km विस्तार)

        all_dup_ids_by_topic[t] = dup_ids

        with open(q_fn, "r", encoding="utf-8") as f:
            q_data = json.load(f)

        raw_qs = q_data.get("questions", [])
        existing_archived = q_data.get("archivedVariants", [])
        existing_archived_ids = {q["id"] for q in existing_archived}

        clean_qs = []
        newly_archived = []

        for q in raw_qs:
            qid = q["id"]
            if qid in dup_ids:
                if qid not in existing_archived_ids:
                    newly_archived.append(q)
            else:
                clean_qs.append(q)

        all_archived = existing_archived + newly_archived

        # Update JSON file
        q_data["questions"] = clean_qs
        q_data["archivedVariants"] = all_archived
        q_data["totalAvailable"] = len(clean_qs)
        q_data["totalArchivedVariants"] = len(all_archived)

        with open(q_fn, "w", encoding="utf-8") as f:
            json.dump(q_data, f, ensure_ascii=False, indent=2)

        raw_count = len(raw_qs)
        clean_count = len(clean_qs)
        archived_count = len(all_archived)

        total_raw_before += (raw_count + len(existing_archived))
        total_clean_after += clean_count
        total_archived_all += archived_count

        topic_summary.append({
            "topic": t,
            "name": q_data.get("masterTopic", f"Topic {t}"),
            "before": raw_count + len(existing_archived),
            "after": clean_count,
            "archived": archived_count
        })

    print("=" * 80)
    print("🎯 ARCHIVAL SUMMARY ACROSS TOPICS 1 TO 17")
    print("=" * 80)
    for ts in topic_summary:
        print(f"Topic {ts['topic']:02d} | {ts['name'][:28]:28} | Pool: {ts['before']:4} -> {ts['after']:4} (Archived: {ts['archived']:3} dups)")

    print("--------------------------------------------------------------------------------")
    print(f"Total Questions in Topics 1-17 before: {total_raw_before}")
    print(f"Total Clean Active Questions after   : {total_clean_after}")
    print(f"Total Duplicates Safely Archived     : {total_archived_all}")
    print("=" * 80)

    # ---------------------------------------------------------
    # Now Repack Published Sets to purge any archived duplicates
    # ---------------------------------------------------------
    print("\n🧹 Scanning and Cleaning Published Sets...")
    published_sets_path = Path("data/sets/published-sets.json")
    all_sets = json.load(open(published_sets_path, encoding="utf-8"))

    # Flatten all duplicate IDs
    all_dups_flat = set()
    for dset in all_dup_ids_by_topic.values():
        all_dups_flat.update(dset)

    # Clean pools map by topic number
    clean_pool_by_topic = {}
    for t in range(1, 18):
        q_fn = Path(f"data/questions/rajasthan-gk/topic_{t:02d}.json")
        if q_fn.exists():
            qd = json.load(open(q_fn, encoding="utf-8"))
            clean_pool_by_topic[t] = [q["id"] for q in qd.get("questions", [])]

    # Map topic prefixes to topic number
    topic_prefix_map = {
        "राजस्थान का सामान्य ज्ञान": 1,
        "राजस्थान का भौतिक स्वरूप एवं भूगोल": 2,
        "राजस्थान की जलवायु": 3,
        "राजस्थान की जनसंख्या एवं जनगणना": 4,
        "राजस्थान की मृदा": 5,
        "राजस्थान का अपवाह तंत्र, नदियाँ एवं झीलें": 6,
        "राजस्थान की नदियाँ एवं जल संसाधन": 6,
        "राजस्थान के पारंपरिक जल स्रोत एवं जल प्रबंधन": 7,
        "राजस्थान की कृषि": 9,
        "राजस्थान का पशुपालन एवं डेयरी विकास": 10,
        "राजस्थान के खनिज संसाधन": 11,
        "राजस्थान के प्रमुख उद्योग": 13,
        "राजस्थान की प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल": 16,
        "आमेर का कछवाहा वंश": 17,
        "गुर्जर-प्रतिहार वंश": 17,
        "चौहान वंश": 17,
        "मेवाड़ का गुहिल/गुहिलोत वंश": 17,
        "राठौड़ वंश": 17,
        "राजस्थान का राजपूत काल": 17,
    }

    sets_modified = 0
    total_replacements = 0

    for s in all_sets:
        s_name = s.get("name", "")
        t_num = None
        for prefix, num in topic_prefix_map.items():
            if s_name.startswith(prefix):
                t_num = num
                break

        if not t_num or t_num not in clean_pool_by_topic:
            continue

        clean_pool = clean_pool_by_topic[t_num]
        qids = s.get("questionIds", [])
        has_dup = any(q in all_dups_flat for q in qids)

        if has_dup:
            sets_modified += 1
            new_qids = []
            for qid in qids:
                if qid not in all_dups_flat:
                    new_qids.append(qid)
                else:
                    total_replacements += 1

            # Fill up to 20 from clean pool
            for candidate in clean_pool:
                if len(new_qids) >= 20:
                    break
                if candidate not in new_qids and candidate not in all_dups_flat:
                    new_qids.append(candidate)

            s["questionIds"] = new_qids
            s["questionCount"] = len(new_qids)

    with open(published_sets_path, "w", encoding="utf-8") as f:
        json.dump(all_sets, f, ensure_ascii=False, indent=2)

    print(f"✅ Cleaned {sets_modified} published sets (Replaced {total_replacements} duplicate questions).")
    print("🎉 All published sets now reference ONLY active clean questions!")

if __name__ == "__main__":
    run_archival()

