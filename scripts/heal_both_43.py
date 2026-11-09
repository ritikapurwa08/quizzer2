import urllib.request
import urllib.error
import json

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            keys = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

key = keys[13]

with open('data/questions/rajasthan-gk/topic_43.json', 'r', encoding='utf-8') as f:
    t43 = json.load(f)

with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

sdict = {d['id']: d for d in rep if 'error' not in d}

for qid in ['14640', 'rg_012752']:
    q = next(x for x in t43['questions'] if x['id'] == qid)
    prompt = f"""You are a senior RPSC Rajasthan GK expert.
Output strictly valid JSON with keys: id, question, type, options, answer, explanation, meta.
If match: type="match", meta.left and meta.right.
If sequence/statements: type="sequence", meta.items.
Otherwise type="mcq".
Verify factual truth for the answer.

Question:
ID: {qid}
Question: {q['question']}
Options: {json.dumps(q['options'], ensure_ascii=False)}
Answer: {q['answer']}
"""
    req = urllib.request.Request(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'User-Agent': 'Groq-Client/1.0'},
        data=json.dumps({
            'model': 'qwen/qwen3.8-27b',
            'messages': [{'role': 'user', 'content': prompt}],
            'response_format': {'type': 'json_object'},
            'temperature': 0.0,
            'max_tokens': 2000
        }).encode('utf-8')
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        parsed = json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
        parsed['topic'] = 43
        parsed['original_answer'] = q['answer']
        sdict[qid] = parsed
        print('Successfully healed:', qid, parsed.get('type'))

final_list = list(sdict.values())
with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print('TOTAL AUDITED AND HEALED QUESTIONS IN REPORT:', len(final_list))
