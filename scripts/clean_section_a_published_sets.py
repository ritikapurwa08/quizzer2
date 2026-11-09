import json
from pathlib import Path
from collections import Counter

# Load all duplicates
duplicate_ids = set()
for t in range(1, 16):
    vf = Path(f"data/questions/variants/topic_{t:02d}_clusters.json")
    if not vf.exists():
        continue
    with open(vf, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        for item in data:
            main = item.get("main") or item.get("anchor_id")
            sim = item.get("similarQuestions") or item.get("members") or []
            for s in sim:
                sid = s.get("id") if isinstance(s, dict) else s
                if sid != main:
                    duplicate_ids.add(sid)
    elif isinstance(data, dict):
        for cid, item in data.items():
            main = item.get("anchor") or item.get("main") or item.get("anchor_id")
            for m in (item.get("members") or []):
                mid = m.get("id") if isinstance(m, dict) else m
                if mid != main:
                    duplicate_ids.add(mid)

with open("data/sets/published-sets.json", encoding="utf-8") as f:
    published_sets = json.load(f)

with open("data/sets/topic-id-mapping.json", encoding="utf-8") as f:
    mapping = json.load(f)

t1_id = mapping.get("1")
t2_id = mapping.get("2")
t3_id = mapping.get("3")
t7_id = mapping.get("7")
t9_id = mapping.get("9")

# Fix Topic 1 भाग 3: replace with rg_015291
for s in published_sets:
    if s.get("topicId") == t1_id and s.get("name") == "राजस्थान का सामान्य ज्ञान भाग 3":
        qlist = s.get("questionIds", [])
        if "rg_013061" in qlist:
            qlist[qlist.index("rg_013061")] = "rg_015291"
            print("Topic 1: replaced with fresh rg_015291")

# Fix Topic 2 भाग 19: replace with rg_013011
for s in published_sets:
    if s.get("topicId") == t2_id and s.get("name") == "राजस्थान का भौतिक स्वरूप एवं भूगोल भाग 19":
        qlist = s.get("questionIds", [])
        if "rg_000002" in qlist:
            qlist[qlist.index("rg_000002")] = "rg_013011"
            print("Topic 2: replaced with fresh rg_013011")

# Fix Topic 3 Part 3: replace with rg_000379
for s in published_sets:
    if s.get("topicId") == t3_id and s.get("name") == "राजस्थान की जलवायु Part 3":
        qlist = s.get("questionIds", [])
        if "rg_000265" in qlist:
            qlist[qlist.index("rg_000265")] = "rg_000379"
            print("Topic 3: replaced with fresh rg_000379")

# Fix Topic 7 repeats:
# In भाग 2: replace repeat rg_014845 and rg_014849 with rg_003568, rg_003569
for s in published_sets:
    if s.get("topicId") == t7_id and "भाग 2" in s.get("name", ""):
        qlist = s.get("questionIds", [])
        if "rg_014845" in qlist:
            qlist[qlist.index("rg_014845")] = "rg_003568"
            print("Topic 7: replaced repeat rg_014845 with rg_003568")
        if "rg_014849" in qlist:
            qlist[qlist.index("rg_014849")] = "rg_003569"
            print("Topic 7: replaced repeat rg_014849 with rg_003569")

# Fix Topic 9 repeat:
for s in published_sets:
    if s.get("topicId") == t9_id and "भाग 4" in s.get("name", ""):
        qlist = s.get("questionIds", [])
        if "rg_005366" in qlist:
            qlist[qlist.index("rg_005366")] = "rg_005395"
            print("Topic 9: replaced repeat rg_005366 with rg_005395")

with open("data/sets/published-sets.json", "w", encoding="utf-8") as f:
    json.dump(published_sets, f, ensure_ascii=False, indent=2)

print("Saved clean sets successfully!")
