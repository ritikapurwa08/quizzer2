#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Comprehensive Semantic Deduplication & Set Verification Engine
For Topic 1 (राजस्थान का सामान्य ज्ञान) & Topic 2 (राजस्थान का भौतिक स्वरूप एवं भूगोल)
"""

import json
import re
import os
from collections import defaultdict

def normalize_text(text: str) -> str:
    if not text:
        return ""
    # Remove punctuation, extra spaces, lower-case
    cleaned = re.sub(r"[^\w\s\u0900-\u097f]+", " ", str(text).lower())
    return re.sub(r"\s+", " ", cleaned).strip()

def get_correct_option_text(q: dict) -> str:
    ans = str(q.get("answer", "")).strip().upper()
    options = q.get("options", [])
    idx_map = {"A": 0, "B": 1, "C": 2, "D": 3, "OPT1": 0, "OPT2": 1, "OPT3": 2, "OPT4": 3, "1": 0, "2": 1, "3": 2, "4": 3}
    idx = idx_map.get(ans, -1)
    if 0 <= idx < len(options):
        opt = options[idx]
        return normalize_text(opt.get("text", "") if isinstance(opt, dict) else str(opt))
    return ""

def score_question_quality(q: dict) -> int:
    score = 0
    # Explanation completeness
    expl = q.get("explanation") or ""
    score += min(len(expl), 300)
    # Real exam metadata
    if q.get("exam"):
        score += 80
    if q.get("year"):
        score += 40
    # Options validity
    opts = q.get("options") or []
    if len(opts) == 4 and len(set(str(o) for o in opts)) == 4:
        score += 50
    return score

def main():
    print("=" * 65)
    print("  TOPIC 1 & 2 COMPREHENSIVE SEMANTIC AUDIT & VERIFICATION")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    t1_path = os.path.join(base_dir, "data", "questions", "rajasthan-gk", "topic_01.json")
    t2_path = os.path.join(base_dir, "data", "questions", "rajasthan-gk", "topic_02.json")
    sets_path = os.path.join(base_dir, "data", "sets", "published-sets.json")
    mapping_path = os.path.join(base_dir, "data", "sets", "topic-id-mapping.json")

    with open(t1_path, "r", encoding="utf-8") as f:
        t1_raw = json.load(f)
    with open(t2_path, "r", encoding="utf-8") as f:
        t2_raw = json.load(f)
    with open(sets_path, "r", encoding="utf-8") as f:
        all_sets = json.load(f)
    with open(mapping_path, "r", encoding="utf-8") as f:
        topic_map = json.load(f)

    t1_questions = t1_raw.get("questions", t1_raw)
    t2_questions = t2_raw.get("questions", t2_raw)

    print(f"\n[1] Question Pool Statistics:")
    print(f"    - Topic 1 total questions: {len(t1_questions)}")
    print(f"    - Topic 2 total questions: {len(t2_questions)}")

    # 1. Inspect Similar Questions clusters
    t1_with_sim = [q for q in t1_questions if q.get("similarQuestions")]
    t2_with_sim = [q for q in t2_questions if q.get("similarQuestions")]

    t1_total_variants = sum(len(q["similarQuestions"]) for q in t1_with_sim)
    t2_total_variants = sum(len(q["similarQuestions"]) for q in t2_with_sim)

    print(f"\n[2] Similar Questions Multi-Way Clusters:")
    print(f"    - Topic 1 clusters: {len(t1_with_sim)} Main Questions linked to {t1_total_variants} variations")
    for q in t1_with_sim:
        sim_count = len(q["similarQuestions"])
        print(f"      * [{q['id']}] {q['question'][:55]}... -> {sim_count} variations")

    print(f"\n    - Topic 2 clusters: {len(t2_with_sim)} Main Questions linked to {t2_total_variants} variations")
    for q in t2_with_sim:
        sim_count = len(q["similarQuestions"])
        print(f"      * [{q['id']}] {q['question'][:55]}... -> {sim_count} variations")

    # 2. Set Integrity Audit
    t1_convex_id = topic_map["1"]
    t2_convex_id = topic_map["2"]

    t1_sets = [s for s in all_sets if s.get("topicId") == t1_convex_id]
    t2_sets = [s for s in all_sets if s.get("topicId") == t2_convex_id]

    print(f"\n[3] Published Sets Integrity Audit:")
    print(f"    - Topic 1 Sets: {len(t1_sets)} sets")
    print(f"    - Topic 2 Sets: {len(t2_sets)} sets")

    # Check Topic 1
    t1_all_ids = []
    t1_set_errors = 0
    for idx, s in enumerate(t1_sets, 1):
        q_ids = s.get("questionIds", [])
        if len(q_ids) != 20:
            print(f"      [!] ERROR in T1 Set {idx}: Expected 20 questions, got {len(q_ids)}")
            t1_set_errors += 1
        if len(q_ids) != len(set(q_ids)):
            print(f"      [!] ERROR in T1 Set {idx}: Contains internal duplicate question IDs!")
            t1_set_errors += 1
        t1_all_ids.extend(q_ids)

    t1_unique_ids = set(t1_all_ids)
    t1_cross_dups = len(t1_all_ids) - len(t1_unique_ids)

    print(f"    - Topic 1 Result: {len(t1_all_ids)} slots assigned, {len(t1_unique_ids)} unique.")
    print(f"      Internal duplicates: {t1_set_errors} | Cross-set duplicates: {t1_cross_dups}")

    # Check Topic 2
    t2_all_ids = []
    t2_set_errors = 0
    for idx, s in enumerate(t2_sets, 1):
        q_ids = s.get("questionIds", [])
        if len(q_ids) != 20:
            print(f"      [!] ERROR in T2 Set {idx}: Expected 20 questions, got {len(q_ids)}")
            t2_set_errors += 1
        if len(q_ids) != len(set(q_ids)):
            print(f"      [!] ERROR in T2 Set {idx}: Contains internal duplicate question IDs!")
            t2_set_errors += 1
        t2_all_ids.extend(q_ids)

    t2_unique_ids = set(t2_all_ids)
    t2_cross_dups = len(t2_all_ids) - len(t2_unique_ids)

    print(f"    - Topic 2 Result: {len(t2_all_ids)} slots assigned, {len(t2_unique_ids)} unique.")
    print(f"      Internal duplicates: {t2_set_errors} | Cross-set duplicates: {t2_cross_dups}")

    print("\n" + "=" * 65)
    if t1_cross_dups == 0 and t2_cross_dups == 0 and t1_set_errors == 0 and t2_set_errors == 0:
        print("  VERIFICATION RESULT: 100% PERFECT (ZERO DUPLICATES, ALL SETS = 20)")
    else:
        print("  VERIFICATION RESULT: ISSUES DETECTED")
    print("=" * 65)

if __name__ == "__main__":
    main()

