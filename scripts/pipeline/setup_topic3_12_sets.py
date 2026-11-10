import json
import subprocess
import os

print("=" * 60)
print("SETUP & PARTITION TOPIC 3 INTO 12 COMPLETE UNIQUE SETS (240 Qs)")
print("=" * 60)

# 1. Load topic_03.json
with open('data/questions/rajasthan-gk/topic_03.json', 'r', encoding='utf-8') as f:
    t3_data = json.load(f)

qs = t3_data['questions']
q_by_id = {q['id']: q for q in qs}
print(f"Loaded {len(qs)} questions from topic_03.json.")

# 2. Add the two canonical RPSC questions if not already present
q_562 = {
    "id": "rg_000562",
    "source": "RPSC",
    "sourceTopicId": 23,
    "sourceTopic": "राजस्थान की जलवायु",
    "masterTopicId": 3,
    "masterTopic": "राजस्थान की जलवायु",
    "question": "राजस्थान के संदर्भ में 'पुरवइयाँ' (Purvaiya) से क्या तात्पर्य है?",
    "options": [
        "बंगाल की खाड़ी से आने वाली मानसूनी हवाएँ",
        "अरब सागर से आने वाली हवाएँ",
        "शीतकाल में चलने वाली शुष्क हवाएँ",
        "ग्रीष्मकाल में चलने वाली धूल भरी आँधियाँ"
    ],
    "answer": "A",
    "explanation": "राजस्थान में बंगाल की खाड़ी की मानसूनी शाखा से पूर्व दिशा से आने वाली नम मानसूनी हवाओं को स्थानीय भाषा में 'पुरवइयाँ' कहा जाता है। ये हवाएँ अरावली के पूर्वी तथा दक्षिणी भागों में अच्छी वर्षा करती हैं।",
    "topic": "राजस्थान की जलवायु",
    "topicId": 3,
    "type": "mcq",
    "questionText": "राजस्थान के संदर्भ में 'पुरवइयाँ' (Purvaiya) से क्या तात्पर्य है?",
    "meta": {
        "sourceType": "PYQ",
        "auditedAt": "2026-11-10T06:35:00Z",
        "qualityAudited": True
    }
}

q_563 = {
    "id": "rg_000563",
    "source": "RPSC",
    "sourceTopicId": 23,
    "sourceTopic": "राजस्थान की जलवायु",
    "masterTopicId": 3,
    "masterTopic": "राजस्थान की जलवायु",
    "question": "थॉर्नथवेट के जलवायु वर्गीकरण के अनुसार राजस्थान का अधिकांश भाग किस जलवायु प्रदेश के अंतर्गत आता है?",
    "options": [
        "DA'w",
        "CA'w",
        "DB'w",
        "EA'd"
    ],
    "answer": "A",
    "explanation": "सी.डब्ल्यू. थॉर्नथवेट के जलवायु वर्गीकरण (वर्षा प्रभाविकता एवं तापीय दक्षता पर आधारित) के अनुसार राजस्थान का अधिकांश मध्य एवं पूर्वी भाग 'DA\\'w' (उष्ण-आर्द्र या अर्द्ध-शुष्क) जलवायु प्रदेश के अंतर्गत सम्मिलित है।",
    "topic": "राजस्थान की जलवायु",
    "topicId": 3,
    "type": "mcq",
    "questionText": "थॉर्नथवेट के जलवायु वर्गीकरण के अनुसार राजस्थान का अधिकांश भाग किस जलवायु प्रदेश के अंतर्गत आता है?",
    "meta": {
        "sourceType": "PYQ",
        "auditedAt": "2026-11-10T06:35:00Z",
        "qualityAudited": True
    }
}

if 'rg_000562' not in q_by_id:
    qs.append(q_562)
    q_by_id['rg_000562'] = q_562
    print("Added rg_000562 to pool.")

if 'rg_000563' not in q_by_id:
    qs.append(q_563)
    q_by_id['rg_000563'] = q_563
    print("Added rg_000563 to pool.")

# Fix rg_000524 to be self-contained (removing broken map reference)
if 'rg_000524' in q_by_id:
    q_by_id['rg_000524']['question'] = "कोपेन के जलवायु वर्गीकरण के अनुसार राजस्थान में दक्षिण से उत्तर-पश्चिम की ओर जलवायु प्रदेशों का सही अनुक्रम क्या है?"
    q_by_id['rg_000524']['questionText'] = "कोपेन के जलवायु वर्गीकरण के अनुसार राजस्थान में दक्षिण से उत्तर-पश्चिम की ओर जलवायु प्रदेशों का सही अनुक्रम क्या है?"
    q_by_id['rg_000524']['options'] = [
        "BWhw, BShw, Cwg, Aw",
        "Aw, Cwg, BShw, BWhw",
        "BShw, BWhw, Aw, Cwg",
        "Cwg, BWhw, BShw, Aw"
    ]
    q_by_id['rg_000524']['answer'] = "B"
    q_by_id['rg_000524']['explanation'] = "कोपेन के वर्गीकरण के अनुसार राजस्थान में दक्षिण/दक्षिण-पूर्व से उत्तर-पश्चिम की ओर सही क्रम है: Aw (उष्ण कटिबंधीय आर्द्र) -> Cwg (उप-आर्द्र) -> BShw (अर्द्ध-शुष्क) -> BWhw (उष्ण कटिबंधीय शुष्क मरुस्थलीय)। अतः सही अनुक्रम Aw, Cwg, BShw, BWhw है।"
    print("Healed rg_000524 map reference.")

t3_data['questions'] = qs
t3_data['totalAvailable'] = len(qs)

with open('data/questions/rajasthan-gk/topic_03.json', 'w', encoding='utf-8') as f:
    json.dump(t3_data, f, ensure_ascii=False, indent=2)

print(f"Total questions in topic_03.json now: {len(qs)}")

# 3. Load published-sets.json and topic-id-mapping.json
with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    published_sets = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    topic_map = json.load(f)

t3_convex_topic_id = topic_map['3']
t3_existing_7 = [s for s in published_sets if s.get('topicId') == t3_convex_topic_id]
print(f"Found {len(t3_existing_7)} existing Topic 3 sets in published-sets.json.")

# Deduplicate Sets 1 to 7
used_qids = set()
deduped_sets_1_to_7 = []

for s in t3_existing_7:
    retained_qids = []
    for qid in s.get('questionIds', []):
        if qid in q_by_id and qid not in used_qids:
            retained_qids.append(qid)
            used_qids.add(qid)
    deduped_sets_1_to_7.append({
        "id": s.get("id"),
        "name": s.get("name"),
        "qids": retained_qids
    })

# Backfill sets 1 to 7 up to 20 questions using unused questions
all_qids = [q['id'] for q in qs]
unused_pool = [qid for qid in all_qids if qid not in used_qids]

for s in deduped_sets_1_to_7:
    needed = 20 - len(s['qids'])
    if needed > 0:
        fillers = unused_pool[:needed]
        unused_pool = unused_pool[needed:]
        for qid in fillers:
            s['qids'].append(qid)
            used_qids.add(qid)
    print(f"Set {s['name']}: now has {len(s['qids'])} unique questions.")

print(f"\nRemaining unused questions in pool: {len(unused_pool)}")
assert len(unused_pool) == 100, f"Expected exactly 100 unused questions, got {len(unused_pool)}"

# 4. Create Sets 8 to 12 in Convex DB
new_sets_info = []
for s_num in range(8, 13):
    s_name = f"राजस्थान की जलवायु भाग {s_num}"
    args_obj = {
        "topicId": t3_convex_topic_id,
        "name": s_name,
        "negativeMarking": True,
        "questions": [{"id": f"q_{i}"} for i in range(20)],
        "adminSecret": "quizzer_admin_pool_init_2026"
    }
    cmd = ["npx", "convex", "run", "testSets:importTestSet", json.dumps(args_obj, ensure_ascii=False), "--prod"]
    print(f"Creating Set {s_num} in Convex ({s_name})...")
    res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    if res.returncode != 0:
        print(f"Error creating Set {s_num}: {res.stderr}")
        raise RuntimeError(f"Convex creation failed for set {s_num}")
    
    out_json = json.loads(res.stdout.strip())
    cid = out_json.get("testSetId")
    print(f"✅ Set {s_num} created in Convex! ID: {cid}")
    new_sets_info.append({"setNum": s_num, "name": s_name, "convexId": cid})

# 5. Build full 12 sets list
all_12_sets = []

# Add sets 1 to 7
for idx, s in enumerate(deduped_sets_1_to_7):
    s_num = idx + 1
    all_12_sets.append({
        "setNum": s_num,
        "name": f"राजस्थान की जलवायु भाग {s_num}" if s_num >= 5 else f"राजस्थान की जलवायु Part {s_num}",
        "convexId": s["id"],
        "questionIds": s["qids"]
    })

# Add sets 8 to 12
for idx, s_info in enumerate(new_sets_info):
    s_num = s_info["setNum"]
    cid = s_info["convexId"]
    s_name = s_info["name"]
    chunk_ids = unused_pool[idx*20 : (idx+1)*20]
    used_qids.update(chunk_ids)
    all_12_sets.append({
        "setNum": s_num,
        "name": s_name,
        "convexId": cid,
        "questionIds": chunk_ids
    })

# 6. Save set JSON files to data/sets/topic-03/set-0XX.json
os.makedirs("data/sets/topic-03", exist_ok=True)
for s in all_12_sets:
    s_num = s["setNum"]
    padSet = f"{s_num:03d}"
    cid = s["convexId"]
    s_name = s["name"]
    qids = s["questionIds"]
    
    set_payload = {
        "setId": f"topic-3-set-{padSet}",
        "convexId": cid,
        "masterTopicId": 3,
        "masterTopic": "राजस्थान की जलवायु",
        "setNumber": s_num,
        "completedAt": "2026-11-10T06:35:00.000Z",
        "questionCount": len(qids),
        "questionIds": qids,
        "questions": [q_by_id[qid] for qid in qids if qid in q_by_id]
    }
    fpath = f"data/sets/topic-03/set-{padSet}.json"
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(set_payload, f, ensure_ascii=False, indent=2)
    print(f"Saved {fpath} with {len(qids)} unique questions.")

# 7. Update published-sets.json
# Remove any old topic-3 entries
clean_published = [s for s in published_sets if s.get('topicId') != t3_convex_topic_id]

# Build new manifest entries for all 12 sets
for s in all_12_sets:
    manifest_entry = {
        "id": s["convexId"],
        "name": s["name"],
        "topicId": t3_convex_topic_id,
        "masterTopicId": 3,
        "negativeMarking": True,
        "order": s["setNum"],
        "questionCount": len(s["questionIds"]),
        "questionIds": s["questionIds"]
    }
    clean_published.append(manifest_entry)

with open('data/sets/published-sets.json', 'w', encoding='utf-8') as f:
    json.dump(clean_published, f, ensure_ascii=False, indent=2)
print("Updated published-sets.json with 12 Topic 3 sets.")

# 8. Update pool-state.json
with open('data/sets/pool-state.json', 'r', encoding='utf-8') as f:
    pool_state = json.load(f)

t3_state = pool_state['topics']['3']
t3_state['used'] = list(used_qids)
t3_state['available'] = []
t3_state['candidate'] = []
t3_state['completedSets'] = 12
t3_state['totalAvailable'] = 240
pool_state['updatedAt'] = '2026-11-10T06:35:00.000Z'

with open('data/sets/pool-state.json', 'w', encoding='utf-8') as f:
    json.dump(pool_state, f, ensure_ascii=False, indent=2)

print(f"Updated pool-state.json! Topic 3 completedSets: 12 | Total questions: {len(used_qids)}")
print("\nTopic 3 is now fully partitioned into 12 sets of 20 unique questions!")

