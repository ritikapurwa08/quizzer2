import json
import csv
from pathlib import Path

# Load topic 15 questions
t15_path = Path("data/questions/rajasthan-gk/topic_15.json")
with open(t15_path, "r", encoding="utf-8") as f:
    t15_data = json.load(f)

qs = {q["id"]: q for q in t15_data["questions"]}

# 1. Apply Flagged Key & Explanation Fixes
# rg_004185: Marked A, should be D (Jal Mahal->Jaipur, Ek Thamba->Jodhpur, Junagarh->Bikaner)
if "rg_004185" in qs:
    qs["rg_004185"]["answer"] = "D"
    qs["rg_004185"]["explanation"] = "जल महल जयपुर (3) में, एक थंबा महल जोधपुर (1) में तथा जूनागढ़ किला बीकानेर (2) में स्थित है। अतः सही मिलान अ-3, ब-1, स-2 (विकल्प D) है।"
    print("Fixed rg_004185 answer key to D.")

if "rg_004190" in qs:
    qs["rg_004190"]["explanation"] = "जल महल जयपुर (III) में, एक थंबा महल जोधपुर (I) में तथा जूनागढ़ किला बीकानेर (II) में स्थित है। अतः सही कोड a-III, b-I, c-II (विकल्प B) है।"
    print("Fixed rg_004190 explanation.")

if "rg_004491" in qs:
    qs["rg_004491"]["explanation"] = "जल महल जयपुर (3) में, एक थंबा महल जोधपुर (1) में तथा जूनागढ़ किला बीकानेर (2) में स्थित है। अतः सही कोड a-III, b-I, c-II (विकल्प D) है।"
    print("Fixed rg_004491 explanation.")

if "rg_004143" in qs:
    qs["rg_004143"]["explanation"] = "मेनाल जलप्रपात एवं प्राचीन शिव मंदिर भीलवाड़ा जिले में स्थित है (चित्तौड़गढ़ सीमा के समीप)। अतः यह मिलान सही नहीं है।"
    print("Fixed rg_004143 explanation.")

if "rg_004202" in qs:
    qs["rg_004202"]["explanation"] = "मेनाल जलप्रपात एवं मंदिर भीलवाड़ा जिले में स्थित है, अजमेर में नहीं। अतः विकल्प B सही उत्तर है।"
    print("Fixed rg_004202 explanation.")

# 2. Load Clusters from duplicate_clusters.csv
clusters_file = Path("audit_results_t15/duplicate_clusters.csv")
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
variants_path = Path("data/questions/variants/topic_15_clusters.json")
with open(variants_path, "w", encoding="utf-8") as f:
    json.dump(list(clusters_data.values()), f, ensure_ascii=False, indent=2)
print(f"Saved {len(clusters_data)} clusters to {variants_path}")

# 3. Link similarQuestions in topic_15.json
duplicates_set = set()
for c in clusters_data.values():
    anchor = c["anchor_id"]
    variant_ids = [m["id"] for m in c["members"] if m["id"] != anchor]
    for vid in variant_ids:
        duplicates_set.add(vid)
    if anchor in qs:
        qs[anchor]["similarQuestions"] = variant_ids

t15_data["questions"] = list(qs.values())
with open(t15_path, "w", encoding="utf-8") as f:
    json.dump(t15_data, f, ensure_ascii=False, indent=2)

print(f"Updated {t15_path}: {len(duplicates_set)} duplicate questions linked as variants under {len(clusters_data)} anchors.")

