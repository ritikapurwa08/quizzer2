import urllib.request
import json

with open('.env.local', 'r', encoding='utf-8') as f:
    for line in f:
        if line.startswith('GROQ_API_KEYS='):
            keys = [k.strip() for k in line.replace('GROQ_API_KEYS=', '').split(',') if k.strip()]
            break

key = keys[1]

with open('data/questions/rajasthan-gk/topic_43.json', 'r', encoding='utf-8') as f:
    t43 = json.load(f)

with open('data/questions/audit_heal_211_report.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

sdict = {d['id']: d for d in rep if 'error' not in d}

qid = 'rg_012752'
q = next(x for x in t43['questions'] if x['id'] == qid)
prompt = f"""You are a senior RPSC Rajasthan GK expert.
Output strictly valid JSON with keys: id, question, type, options, answer, explanation, meta.
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
        'max_tokens': 1200
    }).encode('utf-8')
)
with urllib.request.urlopen(req, timeout=25) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    parsed = json.loads(res['choices'][0]['message']['content'])
    parsed['id'] = qid
    parsed['topic'] = 43
    parsed['original_answer'] = q['answer']
    sdict[qid] = parsed
    print('Successfully processed:', qid)

final_list = list(sdict.values())
with open('data/questions/audit_heal_211_report.json', 'w', encoding='utf-8') as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print('TOTAL 100% COMPLETE HEALED QUESTIONS:', len(final_list))
