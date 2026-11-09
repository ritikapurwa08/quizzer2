import json, sys, os
sys.path.insert(0, os.path.abspath("."))
from collections import Counter
from pathlib import Path
from scripts.pipeline.super_dedup_auditor_v2 import (
    parse_question_record,
    build_candidates_v2,
    apply_deterministic_rules,
    load_feedback_memory,
    build_validated_clusters
)

def run_deep_cluster_analysis(topic_nums):
    memory = load_feedback_memory(Path("scripts/pipeline/feedback_memory.jsonl"))
    overall = []

    for t_num in topic_nums:
        topic_path = Path(f"data/questions/rajasthan-gk/topic_{t_num:02d}.json")
        if not topic_path.exists():
            continue
        data = json.load(open(topic_path, encoding="utf-8"))
        qs = data.get("questions", []) if isinstance(data, dict) else data
        records = [parse_question_record(q, i) for i, q in enumerate(qs)]

        # Run Stage 1: Candidate retrieval
        candidates = build_candidates_v2(records, min_jaccard=0.18, min_ratio=0.50)

        # Stage 2 & 3: Rules & Feedback Memory
        for p in candidates:
            r_dec, conf, reason, k_err, typo = apply_deterministic_rules(p)
            if r_dec:
                p["human_decision"] = r_dec
                continue
            pk = p["pair_key"]
            if pk in memory:
                p["human_decision"] = memory[pk].get("human_decision") or memory[pk].get("decision", "")

        # Stage 5: Multi-variant Cluster Validation
        v2_clusters = build_validated_clusters(records, candidates)

        # Baseline V1
        v1_file = Path(f"data/questions/variants/topic_{t_num:02d}_clusters.json")
        v1_clusters = []
        v1_variants = set()
        if v1_file.exists():
            v1_raw = json.load(open(v1_file, encoding="utf-8"))
            v1_clusters = list(v1_raw.values()) if isinstance(v1_raw, dict) else v1_raw
            for c in v1_clusters:
                if "members" in c:
                    for m in c["members"]:
                        if not m.get("is_anchor", False):
                            v1_variants.add(m["id"])
                else:
                    for s in c.get("similarQuestions", []) or c.get("variants", []):
                        v1_variants.add(s if isinstance(s, str) else s.get("id"))

        v2_variants = set()
        size_dist = Counter()
        for c in v2_clusters:
            size = len(c["variants"])
            size_dist[size] += 1
            for v in c["variants"]:
                if not v["is_anchor"]:
                    v2_variants.add(v["id"])

        overall.append({
            "topic": t_num,
            "name": data.get("masterTopic", ""),
            "total_raw": len(qs),
            "v1_clusters": len(v1_clusters),
            "v1_variants": len(v1_variants),
            "v2_clusters": len(v2_clusters),
            "v2_variants": len(v2_variants),
            "size_dist": dict(sorted(size_dist.items())),
            "clusters": v2_clusters
        })

    return overall

if __name__ == "__main__":
    results = run_deep_cluster_analysis([1, 2])
    print("=" * 80)
    print("📊 INTEGRITY V2 MULTI-VARIANT CLUSTER AUDIT REPORT (TOPIC 1 & TOPIC 2)")
    print("=" * 80)
    for r in results:
        print(f"\n🏷️ TOPIC {r['topic']:02d}: {r['name']}")
        print(f"  • Total Raw Questions In Pool: {r['total_raw']}")
        print(f"  • V1 Duplicate Variants Absorbed: {r['v1_variants']} (in {r['v1_clusters']} clusters)")
        print(f"  • V2 Duplicate Variants Absorbed: {r['v2_variants']} (in {r['v2_clusters']} clusters)")
        inc = r['v2_variants'] - r['v1_variants']
        pct = (inc / r['v1_variants'] * 100) if r['v1_variants'] else 0
        print(f"  • 🚀 Net Extra Duplicates Caught by V2: +{inc} ({pct:+.1f}%)")
        print(f"  • Multi-Variant Distribution (Total Questions per Cluster):")
        for sz, count in r['size_dist'].items():
            variants = sz - 1
            print(f"      - {count} clusters have {sz} questions (1 Anchor + {variants} Variants)")

        print(f"\n  🔍 Deep Dive into Multi-Variant Clusters (3+ questions):")
        for c in r['clusters']:
            tot = len(c['variants'])
            if tot >= 3:
                n_var = tot - 1
                aid = c['anchor_id']
                aq = c['anchor_question'][:65]
                ans = c['anchor_answer']
                print(f"\n    ⭐ Cluster {c['cluster_id']} [{aid}] (Ans: {ans}) -> 1 Anchor + {n_var} Variants ({tot} Qs total):")
                print(f"       [ANCHOR]: {aq}...")
                for v in c['variants']:
                    if not v['is_anchor']:
                        print(f"       ↳ [VARIANT {v['id']}]: {v['question'][:65]}...")
