import urllib.request
import urllib.error
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# 1. Load Workers Keys
with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            GROQ_KEYS = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

print(f"Loaded {len(GROQ_KEYS)} Active Groq Workers.")

# 2. Load Existing Report
with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    existing_results = json.load(f)

successful_ids = {r['id']: r for r in existing_results if 'error' not in r}
print(f"Already Succeeded: {len(successful_ids)} / 211")

# 3. Load Flagged Questions and find remaining
with open('data/questions/flagged_published_211.json', 'r', encoding='utf-8') as f:
    all_flagged = json.load(f)

remaining = [q for q in all_flagged if q['id'] not in successful_ids]
print(f"Remaining to Process: {len(remaining)}")

topic_cache = {}
def get_topic_data(tnum):
    if tnum not in topic_cache:
        fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
        with open(fname, 'r', encoding='utf-8') as f:
            topic_cache[tnum] = json.load(f)
    return topic_cache[tnum]

def audit_single_question(item, worker_idx):
    qid = item['id']
    tnum = item['topic']
    qtext = item['question_preview']
    opts = item.get('options', [])
    ans = item.get('answer', '')
    
    tdata = get_topic_data(tnum)
    qs = tdata.get('questions', []) if isinstance(tdata, dict) else tdata
    full_q = next((q for q in qs if q['id'] == qid), None)
    if not full_q and isinstance(tdata, dict) and 'archivedVariants' in tdata:
        full_q = next((q for q in tdata['archivedVariants'] if q['id'] == qid), None)
        
    actual_text = full_q.get('question', qtext) if full_q else qtext
    actual_opts = full_q.get('options', opts) if full_q else opts
    actual_ans = full_q.get('answer', ans) if full_q else ans

    prompt = f"""You are a senior RPSC Rajasthan GK subject matter expert and fact-checker.
Carefully fact-check, fix and format the following raw question.

CRITICAL INSTRUCTIONS:
1. FACTUAL ACCURACY IS PARAMOUNT:
   - Verify every factual detail, geographical coordinate, historical date, and administrative rule according to standard Rajasthan GK facts.
   - DO NOT blindly trust the 'Current Scraped Answer'. If the current answer is wrong, select the factually true answer option (A, B, C, or D).
2. OPTION SANITIZATION:
   - Ensure options list has exactly 4 clean strings.
   - Fix option formatting errors (e.g. if 'A-' or '(a)-' or '1-' is missing from the first item, restore it).
3. STRUCTURED METADATA:
   - If this is a matching question (सुमेलित कीजिए):
     Set type = "match".
     Extract the matching lists into structured arrays in meta.left and meta.right.
     Remove list tables from the main question text.
   - If this is a statement/sequence question (कथन / क्रम / कूट):
     Set type = "sequence".
     Extract statements into meta.items array.
   - Otherwise, set type = "mcq".

Output strictly valid JSON matching this schema:
{{
  "id": "{qid}",
  "question": "Clean stem question text",
  "type": "match" | "sequence" | "mcq",
  "options": ["Clean Opt A", "Clean Opt B", "Clean Opt C", "Clean Opt D"],
  "answer": "A" | "B" | "C" | "D",
  "explanation": "Clear factual explanation in Hindi demonstrating why this answer is correct",
  "meta": {{
    "leftTitle": "सूची-I (...)",
    "rightTitle": "सूची-II (...)",
    "left": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}],
    "right": [{{"id": "1", "text": "..."}}, {{"id": "2", "text": "..."}}]
    // OR if sequence/statements:
    // "items": [{{"id": "A", "text": "..."}}, {{"id": "B", "text": "..."}}]
  }}
}}

Question Data:
ID: {qid}
Question: {actual_text}
Options: {json.dumps(actual_opts, ensure_ascii=False)}
Current Scraped Answer: {actual_ans}
"""

    for attempt in range(5):
        key = GROQ_KEYS[(worker_idx + attempt) % len(GROQ_KEYS)]
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'User-Agent': 'Groq-Client/1.0'
            },
            data=json.dumps({
                'model': 'qwen/qwen3.8-27b',
                'messages': [
                    {'role': 'system', 'content': 'You are an authoritative Rajasthan GK fact-checker and structured JSON auditor. Output only valid JSON.'},
                    {'role': 'user', 'content': prompt}
                ],
                'response_format': {'type': 'json_object'},
                'temperature': 0.0,
                'max_tokens': 1200
            }).encode('utf-8')
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                content = data['choices'][0]['message']['content']
                parsed = json.loads(content)
                parsed['topic'] = tnum
                parsed['original_answer'] = actual_ans
                return parsed
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + attempt * 2)
            else:
                time.sleep(1)
        except Exception:
            time.sleep(2)

    return {'id': qid, 'topic': tnum, 'error': 'Failed after 5 attempts'}

# Process with 8 concurrent workers with small pacing to avoid 429
start_time = time.time()
print(f"⚡ Processing {len(remaining)} questions with rate-limiting protection...")

healed_remaining = []
with ThreadPoolExecutor(max_workers=8) as executor:
    futures = {executor.submit(audit_single_question, item, i): item for i, item in enumerate(remaining)}
    completed = 0
    for future in as_completed(futures):
        res = future.result()
        healed_remaining.append(res)
        completed += 1
        if completed % 15 == 0 or completed == len(remaining):
            elapsed = time.time() - start_time
            print(f"  Progress: {completed}/{len(remaining)} completed...", flush=True)

# Combine with existing successful
final_report = list(successful_ids.values()) + healed_remaining

with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as out:
    json.dump(final_report, out, ensure_ascii=False, indent=2)

print(f"\n✅ All completed! Total records in report: {len(final_report)}")

