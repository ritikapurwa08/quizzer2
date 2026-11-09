import json
import re
from datetime import datetime

# 1. Parse prod_testSets.txt
test_sets = {}
with open('prod_testSets.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('_id') or line.startswith('---'):
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 3:
            ts_id = parts[0].replace('"', '')
            ts_name = parts[2].replace('"', '')
            test_sets[ts_id] = {'id': ts_id, 'name': ts_name}

print(f"Total testSets loaded: {len(test_sets)}")

# 2. Parse prod_bookmarks.txt
bookmarks = []
with open('prod_bookmarks.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('_id') or line.startswith('---'):
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 4:
            b_id = parts[0].replace('"', '')
            try:
                c_time = float(parts[1])
            except:
                c_time = 0
            q_id = parts[3].replace('"', '')
            bookmarks.append({
                'id': b_id,
                'creationTime': c_time,
                'questionId': q_id,
                'dateStr': datetime.fromtimestamp(c_time / 1000.0).strftime('%Y-%m-%d %H:%M:%S') if c_time else ''
            })

print(f"Total bookmarks loaded: {len(bookmarks)}")

# 3. Parse prod_attempts.txt
# Notice answers column contains json array: [{ "isCorrect": ..., "questionId": "...", "selected": "..." }]
# Let's parse each row carefully
attempts = []
with open('prod_attempts.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# Lines in table format can wrap if wide, but let's check
lines = text.split('\n')
for line in lines:
    line = line.strip()
    if not line or line.startswith('_id') or line.startswith('---') or '(node:' in line or 'Showing the' in line:
        continue
    # Check if starts with quote
    if not line.startswith('"j57'):
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) >= 12:
        att_id = parts[0].replace('"', '')
        try:
            c_time = float(parts[1])
        except:
            c_time = 0
        answers_raw = parts[2]
        completedAt = parts[3]
        elapsed = parts[4]
        score = parts[8]
        startedAt = parts[9]
        status = parts[10].replace('"', '')
        submittedAt = parts[11]
        ts_id = parts[12].replace('"', '') if len(parts) > 12 else ''
        
        try:
            answers = json.loads(answers_raw)
        except:
            answers = []
            
        attempts.append({
            'id': att_id,
            'creationTime': c_time,
            'testSetId': ts_id,
            'testSetName': test_sets.get(ts_id, {}).get('name', 'Unknown'),
            'score': score,
            'status': status,
            'answers': answers,
            'dateStr': datetime.fromtimestamp(c_time / 1000.0).strftime('%Y-%m-%d %H:%M:%S') if c_time else ''
        })

print(f"Total attempts parsed: {len(attempts)}")

# Sort attempts by creationTime descending
attempts.sort(key=lambda a: a['creationTime'], reverse=True)

print("\n--- Recent Attempts ---")
for a in attempts[:15]:
    print(f"{a['dateStr']} | {a['testSetName']} ({a['testSetId']}) | Score: {a['score']} | Qs: {len(a['answers'])}")

print("\n--- Recent Bookmarks ---")
for b in bookmarks[:20]:
    print(f"{b['dateStr']} | Q: {b['questionId']}")

