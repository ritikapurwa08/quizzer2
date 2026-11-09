import urllib.request
import json

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            keys = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

with open('data/questions/rajasthan-gk/topic_44.json', 'r', encoding='utf-8') as f:
    t44 = json.load(f)
q = next(x for x in t44['questions'] if x['id'] == 'rg_012845')

prompt = f"""You are a senior RPSC Rajasthan GK expert.
Output strictly valid JSON with keys: id, question, type, options, answer, explanation, meta.
If match: type="match", meta.left and meta.right.
If sequence/statements: type="sequence", meta.items.
Otherwise type="mcq".
Verify factual truth for the answer.

Question:
ID: rg_012845
Question: {q['question']}
Options: {json.dumps(q['options'], ensure_ascii=False)}
Answer: {q['answer']}
"""

req = urllib.request.Request(
    'https://api.groq.com/openai/v1/chat/completions',
    headers={'Authorization': f'Bearer {keys[6]}', 'Content-Type': 'application/json', 'User-Agent': 'Groq-Client/1.0'},
    data=json.dumps({
        'model': 'qwen/qwen3.8-27b',
        'messages': [{'role': 'user', 'content': prompt}],
        'response_format': {'type': 'json_object'},
        'temperature': 0.0,
        'max_tokens': 2500
    }).encode('utf-8')
)

with urllib.request.urlopen(req, timeout=25) as resp:
    parsed = json.loads(json.loads(resp.read().decode('utf-8'))['choices'][0]['message']['content'])
    parsed['topic'] = 44
    parsed['original_answer'] = q['answer']
    print('Successfully healed rg_012845:', parsed.get('type'))

with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

sdict = {d['id']: d for d in rep if 'error' not in d}
sdict['rg_012845'] = parsed

final_list = list(sdict.values())
with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print('FINAL AUDIT COUNT IN REPORT:', len(final_list))

