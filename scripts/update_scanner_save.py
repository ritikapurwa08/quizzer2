import json

# Modify scanner to save flagged list
with open('scripts/scan_all_55_anomalies.py', 'r', encoding='utf-8') as f:
    code = f.read()

if 'flagged_published_211.json' not in code:
    code += """
with open('data/questions/flagged_published_211.json', 'w', encoding='utf-8') as out:
    json.dump(all_flagged_questions, out, ensure_ascii=False, indent=2)
print(f"Saved {len(all_flagged_questions)} flagged questions to data/questions/flagged_published_211.json")
"""
    with open('scripts/scan_all_55_anomalies.py', 'w', encoding='utf-8') as f:
        f.write(code)

print("Updated scanner code.")

