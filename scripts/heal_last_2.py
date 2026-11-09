import urllib.request
import urllib.error
import json
import time

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            keys = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

success_dict = {d['id']: d for d in report if 'error' not in d}
two_ids = ['rg_012752', 'rg_012845']

for i, qid in enumerate(two_ids):
    fname = 'data/questions/rajasthan-gk/topic_43.json'
    with open(fname, 'r', encoding='utf-8') as f:
        tdata = json.load(f)
    q = next(x for x in tdata['questions'] if x['id'] == qid)
    
    prompt = f"""You are a senior RPSC Rajasthan GK expert.
Output strictly valid JSON with keys: id, question, type, options, answer, explanation, meta.
If match: type="match", meta.left and meta.right.
If sequence/statements: type="sequence", meta.items.
Otherwise type="mcq".
Verify the factual answer.

Question:
ID: {qid}
Question: {q['question']}
Options: {json.dumps(q['options'], ensure_ascii=False)}
Answer: {q['answer']}
"""
    key = keys[(i + 4) % len(keys)]
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'Groq-Client/1.0'},
        data=json.dumps({
            'model': 'qwen/qwen3.8-27b',
            'messages': [{'role': 'user', 'content': prompt}],
            'response_format': {'type': 'json_object'},
            'temperature': 0.0,
            'max_tokens': 3000
        }).encode('utf-8')
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            parsed = json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
            parsed['topic'] = 43
            parsed['original_answer'] = q['answer']
            success_dict[qid] = parsed
            print('Successfully healed:', qid, parsed.get('type'))
    except Exception as e:
        print('Error on', qid, e)

final_report = list(success_dict.values())
with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as out:
    json.dump(final_report, out, ensure_ascii=False, indent=2)
print('Total in final report:', len(final_report))
