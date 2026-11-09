import urllib.request
import urllib.error
import json
import os
import time

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            GROQ_KEYS = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

# Load report
with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    current_report = json.load(f)

# Find remaining errors
error_entries = [d for d in current_report if 'error' in d]
print(f"Remaining to process: {len(error_entries)}")

success_dict = {d['id']: d for d in current_report if 'error' not in d}

topic_cache = {}
def get_topic_data(tnum):
    if tnum not in topic_cache:
        fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
        with open(fname, 'r', encoding='utf-8') as f:
            topic_cache[tnum] = json.load(f)
    return topic_cache[tnum]

healed_count = 0
for idx, item in enumerate(error_entries, 1):
    qid = item['id']
    tnum = item['topic']
    tdata = get_topic_data(tnum)
    qs = tdata.get('questions', []) if isinstance(tdata, dict) else tdata
    full_q = next((q for q in qs if q['id'] == qid), None)
    if not full_q and isinstance(tdata, dict) and 'archivedVariants' in tdata:
        full_q = next((q for q in tdata['archivedVariants'] if q['id'] == qid), None)
        
    actual_text = full_q.get('question', '') if full_q else ''
    actual_opts = full_q.get('options', []) if full_q else []
    actual_ans = full_q.get('answer', '') if full_q else ''

    prompt = f"""You are a senior RPSC Rajasthan GK subject matter expert and fact-checker.
Output strictly valid JSON with keys: id, question, type, options, answer, explanation, meta.
If match: set type="match", extract meta.left and meta.right arrays.
If sequence/statements: set type="sequence", extract meta.items array.
Otherwise type="mcq".
Verify factual truth for the answer.

Question to format:
ID: {qid}
Question: {actual_text}
Options: {json.dumps(actual_opts, ensure_ascii=False)}
Current Answer: {actual_ans}
"""

    key = GROQ_KEYS[idx % len(GROQ_KEYS)]
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'Groq-Client/1.0'},
        data=json.dumps({
            'model': 'qwen/qwen3.8-27b',
            'messages': [{'role': 'user', 'content': prompt}],
            'response_format': {'type': 'json_object'},
            'temperature': 0.0,
            'max_tokens': 2500
        }).encode('utf-8')
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            parsed = json.loads(data['choices'][0]['message']['content'])
            parsed['topic'] = tnum
            parsed['original_answer'] = actual_ans
            success_dict[qid] = parsed
            healed_count += 1
            print(f"[{idx:02d}/{len(error_entries)}] Successfully healed {qid} ({parsed.get('type')})")
    except Exception as e:
        print(f"[{idx:02d}/{len(error_entries)}] Failed {qid}: {e}")

# Save complete 211 report
final_report = list(success_dict.values())
with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as out:
    json.dump(final_report, out, ensure_ascii=False, indent=2)

print(f"\nFinal Complete Report Saved: {len(final_report)} / 211 questions!")
