import json
from datetime import datetime

# Load topic_02 questions
with open('data/questions/rajasthan-gk/topic_02.json', 'r', encoding='utf-8') as f:
    topic_data = json.load(f)

# Also load variants if exists
variants_map = {}
try:
    with open('data/questions/variants/topic_02_clusters.json', 'r', encoding='utf-8') as f:
        variants_data = json.load(f)
        for cluster in variants_data:
            main_id = cluster['mainQuestion']['id']
            variants_map[main_id] = cluster['variants']
except:
    pass

q_map = {q['id']: q for q in topic_data['questions']}

# Load testSets
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

# Load bookmarks from today (after 2026-11-06 18:00:00)
# timestamp for 2026-11-06 18:00:00 is around 1793960000000
today_bookmarks = []
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
            if c_time > 1793960000000:
                today_bookmarks.append({
                    'id': b_id,
                    'creationTime': c_time,
                    'questionId': q_id,
                    'time': datetime.fromtimestamp(c_time / 1000.0).strftime('%H:%M:%S')
                })

print(f"Total bookmarks created in today's session: {len(today_bookmarks)}")

# Load the 9 attempts (Part 1 to Part 9 of Topic 2)
attempts = []
with open('prod_attempts.txt', 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line or not line.startswith('"j57'):
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 13:
            att_id = parts[0].replace('"', '')
            try:
                c_time = float(parts[1])
            except:
                c_time = 0
            answers_raw = parts[2]
            score = parts[8]
            ts_id = parts[12].replace('"', '')
            ts_name = test_sets.get(ts_id, {}).get('name', 'Unknown')
            
            # We only care about Topic 2 Part 1 to 9
            if 'भौतिक स्वरूप' in ts_name:
                try:
                    answers = json.loads(answers_raw)
                except:
                    answers = []
                attempts.append({
                    'id': att_id,
                    'creationTime': c_time,
                    'testSetId': ts_id,
                    'testSetName': ts_name,
                    'score': score,
                    'answers': answers,
                    'time': datetime.fromtimestamp(c_time / 1000.0).strftime('%Y-%m-%d %H:%M:%S')
                })

# Sort attempts chronologically Part 1 -> Part 9
attempts.sort(key=lambda a: a['creationTime'])

print(f"\n--- Found {len(attempts)} attempts for Topic 2 ---")
for att in attempts:
    print(f"Set: {att['testSetName']} | Time: {att['time']} | Score: {att['score']} | Total Questions: {len(att['answers'])}")

# Analyze bookmarks in relation to these 9 sets
bookmarked_qids = [b['questionId'] for b in today_bookmarks]
print(f"\nBookmarked QIDs ({len(bookmarked_qids)} total): {bookmarked_qids}")

# Check which sets these bookmarked questions came from
bookmark_analysis = []
for b in today_bookmarks:
    qid = b['questionId']
    q = q_map.get(qid)
    # find which attempt this was in
    found_in_set = None
    user_answer = None
    for att in attempts:
        for ans in att['answers']:
            if ans.get('questionId') == qid:
                found_in_set = att['testSetName']
                user_answer = ans
                break
        if found_in_set:
            break
            
    bookmark_analysis.append({
        'qid': qid,
        'time': b['time'],
        'found_in_set': found_in_set,
        'user_ans': user_answer,
        'question': q
    })

# Save detailed output to json for inspection
with open('today_audit_details.json', 'w', encoding='utf-8') as f:
    json.dump({
        'attempts': attempts,
        'bookmarks': bookmark_analysis
    }, f, ensure_ascii=False, indent=2)

print("\nWrote today_audit_details.json successfully.")

