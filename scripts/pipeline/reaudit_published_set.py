#!/usr/bin/env python3
"""
Authoritative Re-Audit Pipeline for Published Practice Sets
Usage:
    python scripts/pipeline/reaudit_published_set.py --topic 3 --set 8
    python scripts/pipeline/reaudit_published_set.py --set-id kd7bp3qgeswnt8xj2yymdyb9w98hz4be
    python scripts/pipeline/reaudit_published_set.py --topic 2 --set 38 --apply
"""

import sys
import os
import json
import argparse
import re

# Match option marker patterns safely: requires delimiter like (A), [A], A., A-, A), or (क), (i)
ROGUE_MARKER_RE = re.compile(
    r'^(?:(?:\([A-Ea-e1-5ivxIVX\u0915-\u0918\u0905-\u0908]\)|\[[A-Ea-e1-5ivxIVX\u0915-\u0918\u0905-\u0908]\]|[A-Ea-e1-5ivxIVX\u0915-\u0918\u0905-\u0908][.)\-:])\s*)+'
)

def heal_option(text: str) -> str:
    if not isinstance(text, str):
        return ""
    cleaned = text.strip()
    # Don't strip if it's already a clean matching code like 'A-(I)' or 'A - 1'
    if re.match(r'^[A-Da-d]\s*[-–—]\s*[\(]?[I|V|X|1-4]', cleaned):
        return cleaned
    m = ROGUE_MARKER_RE.match(cleaned)
    if m:
        cleaned = cleaned[m.end():].strip()
    return cleaned

def main():
    parser = argparse.ArgumentParser(description="Re-audit a specific published set")
    parser.add_argument("--topic", type=int, help="Master Topic ID (1-55)")
    parser.add_argument("--set", type=int, help="Set number (1, 2, ...)")
    parser.add_argument("--set-id", type=str, help="Convex / Published Set ID")
    parser.add_argument("--apply", action="store_true", help="Apply auto-healing fixes to master pool and set file")

    args = parser.parse_args()

    if not args.set_id and (args.topic is None or args.set is None):
        print("[!] Error: Specify either --set-id OR both --topic and --set")
        print("Example: python scripts/pipeline/reaudit_published_set.py --topic 3 --set 8")
        sys.exit(1)

    # Load published sets manifest and topic mapping
    manifest_path = os.path.join("data", "sets", "published-sets.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifests = json.load(f)

    mapping_path = os.path.join("data", "sets", "topic-id-mapping.json")
    topic_mapping = {}
    rev_mapping = {}
    if os.path.exists(mapping_path):
        with open(mapping_path, "r", encoding="utf-8") as f:
            topic_mapping = json.load(f)
            rev_mapping = {v: int(k) for k, v in topic_mapping.items() if k.isdigit()}

    target_set = None
    if args.set_id:
        target_set = next((s for s in manifests if s.get("id") == args.set_id or s.get("_id") == args.set_id), None)
    else:
        convex_tid = topic_mapping.get(str(args.topic))
        topic_sets = [
            s for s in manifests 
            if s.get("masterTopicId") == args.topic or (convex_tid and s.get("topicId") == convex_tid)
        ]
        topic_sets.sort(key=lambda s: s.get("order", 0))
        if 1 <= args.set <= len(topic_sets):
            target_set = topic_sets[args.set - 1]

    if not target_set:
        print(f"[!] Set not found in {manifest_path}!")
        sys.exit(1)

    set_id = target_set.get("id") or target_set.get("_id")
    set_name = target_set.get("name", "Unknown Set")
    topic_id = target_set.get("masterTopicId") or args.topic or rev_mapping.get(target_set.get("topicId"))
    qids = target_set.get("questionIds", [])

    print("=" * 70)
    print(f"RE-AUDITING PRACTICE SET: {set_name}")
    print(f"Set ID: {set_id} | Topic ID: {topic_id} | Questions: {len(qids)}")
    print("=" * 70)

    # Load master pool file for this topic
    topic_file = os.path.join("data", "questions", "rajasthan-gk", f"topic_{topic_id:02d}.json")
    if not os.path.exists(topic_file):
        print(f"[!] Master topic file not found: {topic_file}")
        sys.exit(1)

    with open(topic_file, "r", encoding="utf-8") as f:
        pool_data = json.load(f)

    if isinstance(pool_data, dict):
        pool = pool_data.get("questions", [])
    elif isinstance(pool_data, list):
        pool = pool_data
    else:
        pool = []

    pool_map = {q.get("id"): q for q in pool if isinstance(q, dict)}

    # Load admin flags if available
    flags_file = os.path.join("data", "audit", "flagged-questions.json")
    admin_flags = {}
    if os.path.exists(flags_file):
        try:
            with open(flags_file, "r", encoding="utf-8") as f:
                f_data = json.load(f)
                for item in f_data.get("flags", []):
                    admin_flags[item.get("questionId")] = item
        except Exception:
            pass

    issues = []
    healed_count = 0

    print(f"\n{'#':<3} {'ID':<12} {'TYPE':<15} {'ANS':<5} {'STATUS':<20} {'DETAILS'}")
    print("-" * 70)

    for idx, qid in enumerate(qids, 1):
        q = pool_map.get(qid)
        if not q:
            print(f"{idx:<3} {qid:<12} {'MISSING':<15} {'-':<5} {'ERROR':<20} Question ID not in pool!")
            issues.append((idx, qid, "Missing question in master pool"))
            continue

        q_type = q.get("type", "mcq")
        ans = q.get("answer") or q.get("correctAnswer") or q.get("correctOption")
        prompt = q.get("question") or q.get("questionText") or ""
        options = q.get("options", [])

        status = "OK"
        details = []

        # Check admin flag
        if qid in admin_flags:
            flag = admin_flags[qid]
            status = f"FLAGGED ({flag.get('flagType')})"
            details.append(f"Admin Note: {flag.get('note') or 'Marked for review'}")

        # Check options count
        if len(options) != 4:
            status = "WARNING"
            details.append(f"Has {len(options)} options instead of 4")

        # Check rogue formatting in options
        healed_opts = []
        needs_opt_heal = False
        for opt in options:
            if isinstance(opt, dict):
                text = opt.get("text", "")
                h_text = heal_option(text)
                if h_text != text:
                    needs_opt_heal = True
                healed_opts.append({**opt, "text": h_text})
            elif isinstance(opt, str):
                h_text = heal_option(opt)
                if h_text != opt:
                    needs_opt_heal = True
                healed_opts.append(h_text)
            else:
                healed_opts.append(opt)

        if needs_opt_heal:
            status = "FORMAT_HEALED"
            details.append("Rogue option marker removed")
            if args.apply:
                q["options"] = healed_opts
                healed_count += 1

        # Check match table consistency
        meta = q.get("meta") or {}
        if q_type == "match_following":
            left = meta.get("left") or meta.get("columnA") or []
            right = meta.get("right") or meta.get("columnB") or []
            if len(left) != len(right):
                status = "WARNING"
                details.append(f"Match length mismatch: Left={len(left)}, Right={len(right)}")

        detail_str = " | ".join(details) if details else prompt[:45] + "..."
        print(f"{idx:<3} {qid:<12} {q_type:<15} {str(ans):<5} {status:<20} {detail_str}")

    print("-" * 70)
    print(f"Audit Complete: {len(qids)} questions audited.")
    if admin_flags:
        flagged_in_set = [qid for qid in qids if qid in admin_flags]
        print(f"Admin Flags In This Set: {len(flagged_in_set)} questions flagged.")

    if args.apply and healed_count > 0:
        save_obj = pool_data if isinstance(pool_data, dict) else pool
        with open(topic_file, "w", encoding="utf-8") as f:
            json.dump(save_obj, f, ensure_ascii=False, indent=2)
        print(f"[+] Applied healing fixes to {healed_count} questions in {topic_file}!")
    elif healed_count > 0:
        print(f"[*] {healed_count} formatting fixes available. Run with --apply to write to disk.")

if __name__ == "__main__":
    main()
