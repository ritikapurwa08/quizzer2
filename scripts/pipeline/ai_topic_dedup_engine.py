#!/usr/bin/env python3
"""
AI Topic Batch Deduplication Engine
Analyzes questions in large topic batches using Global AI Context (Groq / Qwen).
Extracts lightweight [ID + Question + Resolved Answer Text], chunks into 2-3 parts,
and discovers exact duplicates, conceptual duplicates, variant answers, and key conflicts.

Usage:
    python scripts/pipeline/ai_topic_dedup_engine.py --topic 5
    python scripts/pipeline/ai_topic_dedup_engine.py --topics 1-5
    python scripts/pipeline/ai_topic_dedup_engine.py --topics all
"""

import argparse
import json
import os
import re
import sys
import time
import unicodedata
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from scripts.pipeline.groq_paced_client import get_groq_manager

MODEL_NAME = "qwen/qwen3.8-27b"

# --------------------------------------------------------------------------- #
# Question Stripping & Answer Resolution
# --------------------------------------------------------------------------- #

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text))
    text = re.sub(r"[\u200B-\u200D\uFEFF]", "", text)
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    return " ".join(text.split()).lower()

def resolve_option_list(raw_options):
    if isinstance(raw_options, list):
        out = []
        for opt in raw_options:
            if isinstance(opt, dict):
                out.append(str(opt.get("text", "")))
            else:
                out.append(str(opt))
        return out
    if isinstance(raw_options, dict):
        return [str(v) for v in raw_options.values()]
    return []

def resolve_answer_text(answer, options):
    ans_str = str(answer or "").strip()
    if not ans_str:
        return ""
    upper = ans_str.upper()
    letter_map = {
        "A": 0, "B": 1, "C": 2, "D": 3,
        "OPT1": 0, "OPT2": 1, "OPT3": 2, "OPT4": 3,
        "1": 0, "2": 1, "3": 2, "4": 3
    }
    idx = letter_map.get(upper)
    if idx is not None and idx < len(options):
        return str(options[idx]).strip()
    return ans_str

def extract_stripped_questions(raw_questions):
    stripped = []
    for idx, q in enumerate(raw_questions):
        qid = q.get("id") or q.get("_id") or f"q_{idx+1}"
        qtext = q.get("question") or q.get("questionText") or ""
        ans = q.get("answer") or q.get("correctAnswer") or ""
        options = resolve_option_list(q.get("options") or [])
        ans_text = resolve_answer_text(ans, options)
        explanation = q.get("explanation") or ""
        exam = q.get("exam") or q.get("examName") or ""
        year = str(q.get("year") or q.get("examYear") or "")

        # Score for anchor preference
        quality_score = 0
        if exam or year:
            quality_score += 2
        if len(explanation) > 30:
            quality_score += 2
        if len(options) == 4:
            quality_score += 1
        if len(qtext) > 40:
            quality_score += 1

        stripped.append({
            "id": str(qid),
            "question": qtext.strip(),
            "answer": ans_text.strip(),
            "norm_q": normalize_text(qtext),
            "quality_score": quality_score,
            "raw": q
        })
    return stripped

# --------------------------------------------------------------------------- #
# Batch Chunking Strategy
# --------------------------------------------------------------------------- #

def chunk_questions_by_subtopic(questions, max_chunk_size=40):
    if len(questions) <= max_chunk_size:
        return [questions]

    # Keyword based sort so related questions stay grouped
    def sort_key(q):
        words = [w for w in q["norm_q"].split() if len(w) >= 3]
        return " ".join(sorted(words[:3]))

    sorted_qs = sorted(questions, key=sort_key)

    chunks = []
    for i in range(0, len(sorted_qs), max_chunk_size):
        chunks.append(sorted_qs[i : i + max_chunk_size])
    return chunks

# --------------------------------------------------------------------------- #
# AI Audit Prompt
# --------------------------------------------------------------------------- #

AI_SYSTEM_PROMPT = """You are an expert exam auditor for RPSC / RSSB Rajasthan GK examinations.
You will be given a numbered list of questions, each with [ID], Question text, and resolved Answer text.
Your task is to analyze ALL questions in the list and identify any groups of questions that ask the same core fact or concept.

Duplicate Categories:
1. exact_duplicate: Asks the exact same fact with identical or almost identical wording and same answer.
2. conceptual_duplicate: Rephrased or inverted phrasing, but tests the exact same fact/concept.
3. variant_answer: Same question/concept, but answer text has slight variation (e.g. 'अजमेर-सिरोही' vs 'सवाई माधोपुर-सिरोही', or '1722m' vs '1727m').
4. key_conflict: Same question, but contradictory answers (flag key_conflict=true!).

Output Format:
Return ONLY a valid JSON object with a single key "clusters":
{
  "clusters": [
    {
      "canonical_id": "ID_of_best_or_first_question",
      "duplicate_ids": ["ID_of_duplicate_1", "ID_of_duplicate_2"],
      "type": "exact_duplicate" | "conceptual_duplicate" | "variant_answer",
      "has_variant_answer": boolean,
      "key_conflict": boolean,
      "reason": "Short Hindi or English reason why these are duplicates."
    }
  ]
}
If no duplicates are found in this batch, return {"clusters": []}.
Do not include singleton questions (every cluster MUST have at least 1 duplicate_id).
"""

def call_ai_batch_dedup(chunk, topic_name, part_idx, total_parts, retries=3):
    lines = [f"TOPIC: {topic_name} (Part {part_idx}/{total_parts} - {len(chunk)} Questions)\n"]
    for q in chunk:
        lines.append(f"[{q['id']}] Q: {q['question']} | Ans: {q['answer']}")

    user_content = "\n".join(lines)
    mgr = get_groq_manager()

    messages = [
        {"role": "system", "content": AI_SYSTEM_PROMPT},
        {"role": "user", "content": user_content}
    ]

    for attempt in range(retries):
        try:
            resp = mgr.chat_completion(
                messages=messages,
                model=MODEL_NAME,
                temperature=0.0,
                max_tokens=1200,
                response_format={"type": "json_object"}
            )
            raw_text = resp["choices"][0]["message"]["content"].strip()
            parsed = json.loads(raw_text)
            clusters = parsed.get("clusters", [])
            return clusters
        except Exception as e:
            if attempt == retries - 1:
                print(f"    [!] Error in Part {part_idx}: {e}")
                return []
            time.sleep(1.0 + attempt)
    return []

# --------------------------------------------------------------------------- #
# Cluster Processing & Storage
# --------------------------------------------------------------------------- #

def merge_and_save_clusters(topic_num, raw_questions, ai_clusters, variants_dir):
    q_map = {q["id"]: q for q in raw_questions}

    # Load existing clusters if present
    cluster_file = variants_dir / f"topic_{topic_num:02d}_clusters.json"
    existing_clusters = []
    if cluster_file.exists():
        try:
            with open(cluster_file, "r", encoding="utf-8") as f:
                existing_clusters = json.load(f)
        except Exception:
            existing_clusters = []

    # Map existing assignments: qid -> cluster_id
    assigned_qids = set()
    for c in existing_clusters:
        if not isinstance(c, dict):
            continue
        for v in c.get("variants", []):
            if isinstance(v, dict):
                assigned_qids.add(v.get("id"))

    new_clusters_count = 0
    new_questions_grouped = 0

    # Build graph of new duplicates
    for c in ai_clusters:
        if not isinstance(c, dict):
            continue
        canon_id = c.get("canonical_id")
        dup_ids = [d for d in c.get("duplicate_ids", []) if d != canon_id and d in q_map]
        if not dup_ids or canon_id not in q_map:
            continue

        all_members = [canon_id] + dup_ids
        # Check if already covered in existing clusters
        unassigned = [qid for qid in all_members if qid not in assigned_qids]
        if len(unassigned) < 2:
            continue

        # Choose best anchor among members
        best_anchor = max(all_members, key=lambda qid: q_map[qid]["quality_score"])

        cluster_id = f"AI_{len(existing_clusters) + 1:03d}"
        variants_list = []
        for qid in all_members:
            assigned_qids.add(qid)
            q_info = q_map[qid]
            variants_list.append({
                "id": qid,
                "question": q_info["question"],
                "answer": q_info["answer"],
                "is_anchor": (qid == best_anchor)
            })

        existing_clusters.append({
            "cluster_id": cluster_id,
            "anchor_id": best_anchor,
            "anchor_question": q_map[best_anchor]["question"],
            "anchor_answer": q_map[best_anchor]["answer"],
            "total_members": len(variants_list),
            "type": c.get("type", "conceptual_duplicate"),
            "has_variant_answer": c.get("has_variant_answer", False),
            "key_conflict": c.get("key_conflict", False),
            "reason": c.get("reason", ""),
            "variants": variants_list
        })
        new_clusters_count += 1
        new_questions_grouped += len(dup_ids)

    # Save merged clusters
    with open(cluster_file, "w", encoding="utf-8") as f:
        json.dump(existing_clusters, f, ensure_ascii=False, indent=2)

    return {
        "total_clusters": len(existing_clusters),
        "new_clusters": new_clusters_count,
        "new_questions_grouped": new_questions_grouped
    }

# --------------------------------------------------------------------------- #
# Topic Runner
# --------------------------------------------------------------------------- #

def run_topic_dedup(topic_num: int, dry_run=False):
    questions_dir = Path("data/questions/rajasthan-gk")
    variants_dir = Path("data/questions/variants")
    variants_dir.mkdir(parents=True, exist_ok=True)

    topic_file = questions_dir / f"topic_{topic_num:02d}.json"
    if not topic_file.exists():
        return None

    with open(topic_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    raw_qs = data if isinstance(data, list) else data.get("questions", [])

    if len(raw_qs) == 0:
        return {"topic": topic_num, "total": 0, "status": "empty"}

    stripped_qs = extract_stripped_questions(raw_qs)
    chunks = chunk_questions_by_subtopic(stripped_qs, max_chunk_size=40)

    print(f"\n[Topic {topic_num:02d}] Total Questions: {len(stripped_qs)} | Chunks: {len(chunks)}")

    all_ai_clusters = []
    for idx, chunk in enumerate(chunks, 1):
        print(f"  -> Running Part {idx}/{len(chunks)} ({len(chunk)} Qs)...", end="", flush=True)
        part_clusters = call_ai_batch_dedup(
            chunk=chunk,
            topic_name=f"Topic_{topic_num:02d}",
            part_idx=idx,
            total_parts=len(chunks)
        )
        print(f" found {len(part_clusters)} duplicate groups.")
        all_ai_clusters.extend(part_clusters)

    # Report any key conflicts found
    key_conflicts = [c for c in all_ai_clusters if c.get("key_conflict")]
    if key_conflicts:
        print(f"  [!] Flagged {len(key_conflicts)} potential answer key conflicts!")

    if dry_run:
        return {
            "topic": topic_num,
            "total": len(stripped_qs),
            "ai_clusters_found": len(all_ai_clusters),
            "status": "dry_run"
        }

    stats = merge_and_save_clusters(topic_num, stripped_qs, all_ai_clusters, variants_dir)
    print(f"  [OK] Saved clusters. New clusters added: {stats['new_clusters']} (Merged total: {stats['total_clusters']})")
    return {
        "topic": topic_num,
        "total": len(stripped_qs),
        "ai_clusters_found": len(all_ai_clusters),
        "new_clusters": stats["new_clusters"],
        "total_clusters": stats["total_clusters"],
        "status": "done"
    }

# --------------------------------------------------------------------------- #
# CLI Parser
# --------------------------------------------------------------------------- #

def parse_topic_range(val: str):
    val = val.strip().lower()
    if val == "all":
        return list(range(1, 56))
    if "-" in val:
        start, end = val.split("-", 1)
        return list(range(int(start), int(end) + 1))
    if "," in val:
        return [int(x.strip()) for x in val.split(",") if x.strip()]
    return [int(val)]

def main():
    parser = argparse.ArgumentParser(description="AI Topic Batch Deduplication Engine")
    parser.add_argument("--topic", type=int, help="Single topic number (1-55)")
    parser.add_argument("--topics", type=str, help="Topic range, e.g. '1-5', '1,3,5', or 'all'")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    parser.add_argument("--concurrency", type=int, default=3, help="Parallel topic workers (default: 3)")

    args = parser.parse_args()

    if args.topic is not None:
        target_topics = [args.topic]
    elif args.topics:
        target_topics = parse_topic_range(args.topics)
    else:
        print("[!] Error: Specify --topic or --topics (e.g. --topic 5 or --topics 1-10 or --topics all)")
        sys.exit(1)

    print("=" * 70)
    print("AI TOPIC BATCH DEDUPLICATION ENGINE (Groq Qwen 3.8 / 15-Key Round-Robin)")
    print(f"Target Topics: {target_topics}")
    print(f"Parallel Workers: {args.concurrency} | Dry Run: {args.dry_run}")
    print("=" * 70)

    start_time = time.time()
    results = []

    if len(target_topics) == 1:
        res = run_topic_dedup(target_topics[0], dry_run=args.dry_run)
        if res:
            results.append(res)
    else:
        # Multi-worker execution across topics
        with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
            future_to_topic = {
                executor.submit(run_topic_dedup, t, args.dry_run): t for t in target_topics
            }
            for future in as_completed(future_to_topic):
                t = future_to_topic[future]
                try:
                    res = future.result()
                    if res:
                        results.append(res)
                except Exception as e:
                    print(f"[!] Error on Topic {t}: {e}")

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"DEDUPLICATION AUDIT COMPLETE in {elapsed:.1f}s")
    print(f"Topics Processed: {len(results)}")
    total_new = sum(r.get("new_clusters", 0) for r in results)
    print(f"Total New Duplicate Clusters Identified: {total_new}")
    print("=" * 70)

if __name__ == "__main__":
    main()
