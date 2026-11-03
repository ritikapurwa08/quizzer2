import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

def main():
    print("Building unified master question pool and variant mapping...")

    # 1. Load current master pool
    master_pool_path = "e:/quizzer2/data/ddd/dedup/master-pool-final.json"
    with open(master_pool_path, "r", encoding="utf-8") as f:
        master_pool = json.load(f)

    # 2. Load Convex backup data
    backup_dir = "e:/quizzer2/convex-latest-backup"
    convex_questions = []
    with open(f"{backup_dir}/questions/documents.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            convex_questions.append(json.loads(line))

    convex_sets = []
    with open(f"{backup_dir}/testSets/documents.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            convex_sets.append(json.loads(line))

    convex_topics = {}
    with open(f"{backup_dir}/topics/documents.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            t = json.loads(line)
            convex_topics[t["_id"]] = t

    # Initialize convex tracking on all pool questions
    for q in master_pool:
        if "convexIds" not in q:
            q["convexIds"] = []
        if "convexTestSetIds" not in q:
            q["convexTestSetIds"] = []
        if "variantIds" not in q:
            q["variantIds"] = []

    canonical_by_id = {q["id"]: q for q in master_pool}
    variant_to_canonical = {}
    for q in master_pool:
        for v in q.get("variantIds", []):
            variant_to_canonical[v] = q["id"]

    id_mapping = {}  # any ID (convexId or variantId) -> canonicalId

    # Register known variants in mapping
    for v, c_id in variant_to_canonical.items():
        id_mapping[v] = c_id

    matched_direct = 0
    matched_variant = 0
    new_from_convex = 0

    unmatched_convex = []

    for cq in convex_questions:
        cid = cq["_id"]
        sid = cq.get("sourceQuestionId") or (cq.get("meta") or {}).get("sourceQuestionId") or cid
        tsid = cq.get("testSetId")

        if sid in canonical_by_id:
            matched_direct += 1
            q = canonical_by_id[sid]
            q["inConvex"] = True
            if cid not in q["convexIds"]:
                q["convexIds"].append(cid)
            if tsid and tsid not in q["convexTestSetIds"]:
                q["convexTestSetIds"].append(tsid)
            id_mapping[cid] = q["id"]
            id_mapping[sid] = q["id"]
        elif sid in variant_to_canonical:
            matched_variant += 1
            canon_id = variant_to_canonical[sid]
            q = canonical_by_id[canon_id]
            q["inConvex"] = True
            if cid not in q["convexIds"]:
                q["convexIds"].append(cid)
            if tsid and tsid not in q["convexTestSetIds"]:
                q["convexTestSetIds"].append(tsid)
            id_mapping[cid] = canon_id
            id_mapping[sid] = canon_id
        else:
            unmatched_convex.append(cq)

    # Convert the unmatched 155 questions from Convex into clean pool questions
    def convert_options(opts_raw):
        if not opts_raw:
            return ["A", "B", "C", "D"]
        if isinstance(opts_raw[0], dict):
            return [opt.get("text", "") for opt in opts_raw]
        return opts_raw

    def convert_answer(ans_raw, opts_raw):
        if ans_raw in ("A", "B", "C", "D"):
            return ans_raw
        if isinstance(ans_raw, str) and ans_raw.startswith("opt"):
            try:
                idx = int(ans_raw.replace("opt", "")) - 1
                return ["A", "B", "C", "D"][idx]
            except:
                return "A"
        return "A"

    for cq in unmatched_convex:
        cid = cq["_id"]
        sid = cq.get("sourceQuestionId") or (cq.get("meta") or {}).get("sourceQuestionId") or cid
        tsid = cq.get("testSetId")
        top_id = cq.get("topicId")
        top_obj = convex_topics.get(top_id, {})
        top_name = top_obj.get("name", "General Knowledge")
        top_hindi = top_obj.get("nameHindi", "सामान्य ज्ञान")

        is_eng = sid.startswith("gem_mod_") or sid.startswith("rg_eng_") or "English" in top_name
        subject = "english" if is_eng else "gk"

        opts = convert_options(cq.get("options", []))
        ans = convert_answer(cq.get("correctAnswer"), cq.get("options", []))

        new_q = {
            "id": sid,
            "source": "Convex Live Set",
            "sourceTopic": top_name,
            "masterTopicId": int(top_obj.get("order", 1)) if top_obj.get("order") else 1,
            "masterTopic": top_name,
            "question": cq.get("questionText", ""),
            "options": opts,
            "answer": ans,
            "explanation": cq.get("explanation", ""),
            "exam": (cq.get("meta") or {}).get("exam", cq.get("reference")),
            "year": (cq.get("meta") or {}).get("year"),
            "subject": subject,
            "repeatCount": 1,
            "variantIds": [],
            "inConvex": True,
            "convexIds": [cid],
            "convexTestSetIds": [tsid] if tsid else [],
        }

        master_pool.append(new_q)
        canonical_by_id[sid] = new_q
        id_mapping[cid] = sid
        id_mapping[sid] = sid
        new_from_convex += 1

    # Map remaining canonical questions to themselves in id_mapping
    for q in master_pool:
        id_mapping[q["id"]] = q["id"]

    # Build Test Sets index
    # testSetId -> { id, name, topicId, questionCount, questions: [canonical questions in order] }
    set_questions_map = {}
    for cq in convex_questions:
        tsid = cq.get("testSetId")
        if not tsid:
            continue
        if tsid not in set_questions_map:
            set_questions_map[tsid] = []
        
        cid = cq["_id"]
        canon_id = id_mapping.get(cid)
        canon_q = canonical_by_id.get(canon_id)

        set_questions_map[tsid].append({
            "order": cq.get("order", 0),
            "convexId": cid,
            "canonicalId": canon_id,
            "questionText": canon_q["question"] if canon_q else cq.get("questionText"),
            "options": canon_q["options"] if canon_q else convert_options(cq.get("options")),
            "correctAnswer": canon_q["answer"] if canon_q else convert_answer(cq.get("correctAnswer"), cq.get("options")),
            "explanation": canon_q.get("explanation") if canon_q else cq.get("explanation"),
            "type": cq.get("type", "mcq"),
            "meta": cq.get("meta"),
            "reference": cq.get("reference"),
        })

    # Sort questions in each set by order
    for tsid in set_questions_map:
        set_questions_map[tsid].sort(key=lambda x: x.get("order", 0))

    published_sets = []
    for ts in convex_sets:
        tsid = ts["_id"]
        qs = set_questions_map.get(tsid, [])
        published_sets.append({
            "id": tsid,
            "name": ts.get("name", "Practice Set"),
            "topicId": ts.get("topicId"),
            "negativeMarking": ts.get("negativeMarking", True),
            "order": ts.get("order", 0),
            "questionCount": len(qs),
            "questions": qs,
        })

    published_sets.sort(key=lambda s: (s.get("topicId", ""), s.get("order", 0)))

    # Save to disk
    out_dir = "e:/quizzer2/data/master-pool"
    os.makedirs(out_dir, exist_ok=True)

    with open(f"{out_dir}/master-pool.json", "w", encoding="utf-8") as f:
        json.dump(master_pool, f, ensure_ascii=False, indent=2)

    with open(f"{out_dir}/id-mapping.json", "w", encoding="utf-8") as f:
        json.dump(id_mapping, f, ensure_ascii=False, indent=2)

    with open(f"{out_dir}/published-sets.json", "w", encoding="utf-8") as f:
        json.dump(published_sets, f, ensure_ascii=False, indent=2)

    gk_count = sum(1 for q in master_pool if q.get("subject") == "gk")
    eng_count = sum(1 for q in master_pool if q.get("subject") == "english")
    in_convex_count = sum(1 for q in master_pool if q.get("inConvex"))

    print("\n--- UNIFIED MASTER POOL SUMMARY ---")
    print(f"Total Unique Questions in Master Pool: {len(master_pool)}")
    print(f"  - Rajasthan GK Questions: {gk_count}")
    print(f"  - English Questions: {eng_count}")
    print(f"  - Questions Marked inConvex: {in_convex_count}")
    print(f"Total Convex Questions Processed: {len(convex_questions)}")
    print(f"  - Direct Matches: {matched_direct}")
    print(f"  - Merged as Known Variants: {matched_variant}")
    print(f"  - Added as New Canonical from Convex: {new_from_convex}")
    print(f"Total ID Mappings Generated: {len(id_mapping)}")
    print(f"Total Published Sets Mapped: {len(published_sets)}")
    print(f"Saved to: {out_dir}/")

if __name__ == "__main__":
    main()

