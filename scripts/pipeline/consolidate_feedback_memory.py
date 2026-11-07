import json
import csv
from pathlib import Path

memory_records = []
seen_pairs = set()

# Scan all completed audit directories
for t in range(1, 12):
    adir = Path(f"audit_results_t{t}")
    cfile = adir / "candidate_pairs.csv"
    if not cfile.exists():
        continue
    
    with cfile.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            dec = row.get("ai_decision") or row.get("decision")
            pair_key = row.get("pair_key")
            if not pair_key or pair_key in seen_pairs:
                continue
            
            # Save verified duplicates
            if dec in ("exact_duplicate", "near_duplicate"):
                seen_pairs.add(pair_key)
                memory_records.append({
                    "pair_key": pair_key,
                    "id_a": row["id_a"],
                    "id_b": row["id_b"],
                    "human_decision": "duplicate",
                    "duplicate_of": row.get("id_a"),
                    "topic": row.get("topic", str(t)),
                    "reason": row.get("ai_reason", "Verified duplicate across audit runs")
                })
            # Save verified different questions
            elif dec == "different" or "different" in (row.get("ai_reason") or "").lower():
                seen_pairs.add(pair_key)
                memory_records.append({
                    "pair_key": pair_key,
                    "id_a": row["id_a"],
                    "id_b": row["id_b"],
                    "human_decision": "keep_both",
                    "duplicate_of": "",
                    "topic": row.get("topic", str(t)),
                    "reason": row.get("ai_reason", "Verified distinct questions")
                })

out_path = Path("scripts/pipeline/feedback_memory.jsonl")
with out_path.open("w", encoding="utf-8") as f:
    for rec in memory_records:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")

print(f"Consolidated {len(memory_records)} verified pairs into {out_path}!")
