import json
import csv
from pathlib import Path

# Load topic 16 questions
t16_path = Path("data/questions/rajasthan-gk/topic_16.json")
with open(t16_path, "r", encoding="utf-8") as f:
    t16_data = json.load(f)

qs = {q["id"]: q for q in t16_data["questions"]}

# 1. Apply Flagged Key Fix
# rg_009196: Sunari iron smelting furnace is option D, not C (which was Bagor)
if "rg_009196" in qs:
    qs["rg_009196"]["answer"] = "D"
    qs["rg_009196"]["explanation"] = "नीम का थाना जिले की खेतड़ी तहसील के सुनारी में कांटली नदी के तट पर खुदाई में अयस्क से लोहा बनाने की प्राचीनतम भट्टियों के अवशेष मिले हैं (विकल्प D)।"
    print("Fixed rg_009196 answer key to D.")

# 2. Load Clusters from duplicate_clusters.csv
clusters_file = Path("audit_results_t16/duplicate_clusters.csv")
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

# Default anchor if not set
for cid, c in clusters_data.items():
    if not c["anchor_id"] and c["members"]:
        c["anchor_id"] = c["members"][0]["id"]
        c["members"][0]["is_anchor"] = True

# Save variants file
variants_path = Path("data/questions/variants/topic_16_clusters.json")
with open(variants_path, "w", encoding="utf-8") as f:
    json.dump(list(clusters_data.values()), f, ensure_ascii=False, indent=2)
print(f"Saved {len(clusters_data)} clusters to {variants_path}")

# 3. Link similarQuestions in topic_16.json
duplicates_set = set()
for c in clusters_data.values():
    anchor = c["anchor_id"]
    variant_ids = [m["id"] for m in c["members"] if m["id"] != anchor]
    for vid in variant_ids:
        duplicates_set.add(vid)
    if anchor in qs:
        qs[anchor]["similarQuestions"] = variant_ids

t16_data["questions"] = list(qs.values())
with open(t16_path, "w", encoding="utf-8") as f:
    json.dump(t16_data, f, ensure_ascii=False, indent=2)
print(f"Updated {t16_path}: {len(duplicates_set)} duplicate questions linked as variants under {len(clusters_data)} anchors.")

# 4. Remove duplicate rg_009123 from published-sets.json (Part 5)
pub_path = Path("data/sets/published-sets.json")
with open(pub_path, "r", encoding="utf-8") as f:
    published_sets = json.load(f)

for s in published_sets:
    if "Part 5" in s.get("name", "") and "प्राचीन सभ्यताएँ" in s.get("name", ""):
        qlist = s.get("questionIds", [])
        if "rg_009123" in qlist:
            qlist[qlist.index("rg_009123")] = "rg_009149"
            print("Replaced duplicate rg_009123 in Part 5 with fresh clean question rg_009149!")

with open(pub_path, "w", encoding="utf-8") as f:
    json.dump(published_sets, f, ensure_ascii=False, indent=2)
print("Updated published-sets.json successfully!")

