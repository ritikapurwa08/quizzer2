import json
import difflib

with open('data/sets/published-sets.json', 'r', encoding='utf-8') as f:
    sets = json.load(f)

with open('data/sets/topic-id-mapping.json', 'r', encoding='utf-8') as f:
    tmap = json.load(f)

t2_convex_id = tmap.get('2')
t2_sets = [s for s in sets if s.get('topicId') == t2_convex_id]

with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    t2_data = json.load(f)
with open('data/questions/rajasthan-gk/topic_01.json', 'r', encoding='utf-8') as f:
    t1_data = json.load(f)

all_qs = {q['id']: q for q in t1_data.get('questions', []) + t1_data.get('archivedVariants', []) + t2_data.get('questions', []) + t2_data.get('archivedVariants', [])}

# Collect questions in sets 6 to 10
sets_6_to_10 = [s for s in t2_sets if any(f"भाग {x}" in s.get('name', '') for x in [6, 7, 8, 9, 10])]
qids_6_10 = set()
for s in sets_6_to_10:
    qids_6_10.update(s.get('questionIds', []))

saved_qids = {'rg_012922', 'rg_012900', 'rg_012914', 'rg_000621', 'rg_000026', 'rg_000012', 'rg_000017'}

# Also collect questions from Sets 1 to 5
sets_1_to_5 = [s for s in t2_sets if any(f"Part {x}" in s.get('name', '') or f"भाग {x}" in s.get('name', '') for x in [1, 2, 3, 4, 5])]
qids_1_to_5 = set()
for s in sets_1_to_5:
    qids_1_to_5.update(s.get('questionIds', []))

all_eval_ids = list(qids_6_10 | saved_qids)

print(f"Total questions to evaluate: {len(all_eval_ids)}")

def normalize_text(text):
    if not text:
        return ""
    # remove punctuation and spaces
    for ch in " ?।,.-':;\"()[]{}—–":
        text = text.replace(ch, "")
    return text.lower()

potential_pairs = []

for i in range(len(all_eval_ids)):
    id1 = all_eval_ids[i]
    q1 = all_qs.get(id1)
    if not q1: continue
    t1 = q1.get('questionText') or q1.get('question') or ''
    ans1 = str(q1.get('correctAnswer') or q1.get('answer') or '')
    
    # Also check against ALL active questions in Topic 2
    for j in range(i + 1, len(all_eval_ids)):
        id2 = all_eval_ids[j]
        q2 = all_qs.get(id2)
        if not q2: continue
        t2 = q2.get('questionText') or q2.get('question') or ''
        ans2 = str(q2.get('correctAnswer') or q2.get('answer') or '')
        
        sim = difflib.SequenceMatcher(None, normalize_text(t1), normalize_text(t2)).ratio()
        
        # Check keyword overlaps or same topic concepts
        hadoti = ('हाड़ौती' in t1 and 'हाड़ौती' in t2)
        aravali_height = ('अरावली' in t1 and 'अरावली' in t2 and ('चोटि' in t1 or 'शिखर' in t1) and ('चोटि' in t2 or 'शिखर' in t2))
        vistar = ('विस्तार' in t1 and 'विस्तार' in t2)
        kark = ('कर्क' in t1 and 'कर्क' in t2)
        ghaggar = ('घग्घर' in t1 or 'घग्गर' in t1) and ('घग्घर' in t2 or 'घग्गर' in t2)
        border = ('सीमा' in t1 and 'सीमा' in t2)
        
        if sim > 0.60 or hadoti or aravali_height or vistar or kark or ghaggar or (border and sim > 0.45):
            potential_pairs.append({
                'id1': id1,
                'id2': id2,
                'sim': round(sim, 3),
                'concept': 'HIGH_SIM' if sim > 0.60 else ('HADOTI' if hadoti else ('ARAVALI' if aravali_height else ('VISTAR' if vistar else ('GHAGGAR' if ghaggar else 'OTHER')))),
                'q1': t1,
                'q2': t2,
                'ans1': ans1,
                'ans2': ans2,
            })

potential_pairs.sort(key=lambda x: x['sim'], reverse=True)
print(f"Found {len(potential_pairs)} potential similar/duplicate pairs among Sets 6-10 and Saved questions:\n")
for p in potential_pairs[:30]:
    print(f"[{p['concept']}] Sim: {p['sim']} | {p['id1']} vs {p['id2']}")
    print(f"  Q1: {p['q1'][:75]}")
    print(f"  Q2: {p['q2'][:75]}")
    print(f"  Ans1: {p['ans1']} | Ans2: {p['ans2']}\n")

