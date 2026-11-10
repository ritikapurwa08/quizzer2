import os
import sys
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from scripts.pipeline.groq_paced_client import GroqKeyManager

AUDIT_SYSTEM_PROMPT = """You are an expert RPSC exam auditor for Rajasthan Geography (Topic 3: राजस्थान की जलवायु).
Your job is to audit, format, and fact-check questions for RPSC 2nd Grade GK standard:
1. Fact-check the answer against standard authoritative sources (हरिमोहन सक्सेना / राजस्थान सरकार / RPSC Official Answer Keys).
   - If a question has an incorrect marked answer (e.g. rg_000390 factors affecting climate: latitude, distance from sea, and relief are correct, longitude is not -> A, C, D is Option C), correct the answer.
2. For match_following questions:
   - Provide structured "meta" with "leftTitle", "rightTitle", "left" (array of {id: "A"|"B"|"C"|"D", text: string}), "right" (array of {id: "I"|"II"|"III"|"IV", text: string}).
   - Format options cleanly as: "A-(I), B-(II), C-(III), D-(IV)" (or appropriate pairs).
   - "question" must be a clean prompt line ending in colon, e.g. "सूची-I को सूची-II से सुमेलित कीजिए :"
3. For sequence questions:
   - Provide structured "meta" with "items" (array of {id: "A"|"B"|"C"|"D" or "I"|"II"|"III"|"IV", text: string}).
   - "question" must be a clean prompt line ending in colon.
4. For mcq/statement questions:
   - Clean up any broken options, ensure exactly 4 options.
   - If question stem has bullet points (A), (B), (C), format them neatly into question text with newlines or provide statement items in meta.
5. Provide a clear, authoritative Hindi explanation.
6. Return ONLY valid JSON with keys:
   {
     "id": string,
     "type": "mcq" | "match_following" | "sequence" | "statement_reason",
     "question": string,
     "options": [string, string, string, string],
     "answer": "A" | "B" | "C" | "D",
     "explanation": string,
     "meta": object
   }
"""

def main():
    print("=" * 60, flush=True)
    print("TOPIC 3 (SETS 1 - 12) WORKER-BASED AUDIT & HEALER", flush=True)
    print("Using 15 Groq Workers via GroqKeyManager (qwen/qwen3.8-27b)", flush=True)
    print("=" * 60, flush=True)

    manager = GroqKeyManager(max_concurrent_per_key=1, inter_request_delay=0.30)
    print(f"Loaded {len(manager.keys)} Groq worker keys.", flush=True)

    # 1. Load questions from data/questions/rajasthan-gk/topic_03.json
    with open('data/questions/rajasthan-gk/topic_03.json', 'r', encoding='utf-8') as f:
        t3_file = json.load(f)

    qs = t3_file['questions']
    questions_by_id = {q['id']: q for q in qs}
    print(f"Loaded {len(qs)} questions in topic_03.json.", flush=True)

    # 2. Identify questions needing audit
    questions_to_audit = []
    for q in qs:
        qid = q.get('id')
        stem = q.get('question') or q.get('questionText') or ''
        meta = q.get('meta') or {}
        opts = q.get('options', [])
        qt = q.get('type')

        needs_work = False
        reasons = []

        # Check options for missing A- or lowercase
        for opt in opts:
            if isinstance(opt, str):
                if opt.startswith('(I)') or opt.startswith('(II)') or opt.startswith('(III)') or opt.startswith('(IV)') or opt.startswith('(i)') or opt.startswith('(1)'):
                    needs_work = True
                    reasons.append('missing_A_prefix')
                    break
                if opt.startswith('a-') or opt.startswith('b-') or opt.startswith('c-') or opt.startswith('d-'):
                    needs_work = True
                    reasons.append('lowercase_options')
                    break

        # Check match
        if (qt in ['match', 'match_following'] or any(k in stem for k in ['सूची-I', 'सूची-1', 'सूची-II'])) and not (meta.get('left') and meta.get('right')):
            needs_work = True
            reasons.append('unstructured_match')

        # Check sequence
        if qt == 'sequence' and not meta.get('items'):
            needs_work = True
            reasons.append('unstructured_sequence')

        # Check if question stem has list items like (A), (B), (C) but no structured meta
        has_bracket_letters = '(A)' in stem and '(B)' in stem
        has_bracket_nums = ('(1)' in stem and '(2)' in stem) or ('(i)' in stem and '(ii)' in stem)
        if (has_bracket_letters or has_bracket_nums) and not (meta.get('left') or meta.get('items')):
            needs_work = True
            reasons.append('stem_contains_unstructured_list')

        # Specific known corrections like rg_000390
        if qid == 'rg_000390':
            needs_work = True
            reasons.append('answer_check_needed')

        if needs_work:
            questions_to_audit.append((qid, q, reasons))

    print(f"Identified {len(questions_to_audit)} questions needing Worker AI formatting/auditing.", flush=True)
    for qid, _, reasons in questions_to_audit:
        print(f"  -> {qid}: {', '.join(reasons)}", flush=True)

    # 3. Dispatch each question to Groq workers
    audited_count = 0
    updated_questions = {}

    for qid, q, reasons in questions_to_audit:
        print(f"\n[Worker Dispatch] Auditing {qid} (Reasons: {reasons})...", flush=True)
        user_prompt = f"""Audit and heal this Rajasthan GK question. Return clean JSON:
Question ID: {qid}
Current Type: {q.get('type')}
Current Question Text:
{q.get('question') or q.get('questionText')}

Current Options:
{json.dumps(q.get('options'), ensure_ascii=False, indent=2)}

Current Answer: {q.get('answer')}
Current Explanation: {q.get('explanation')}
"""
        messages = [
            {"role": "system", "content": AUDIT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        try:
            res = manager.chat_completion(
                messages=messages,
                model="qwen/qwen3.8-27b",
                temperature=0.0,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            raw_text = res["choices"][0]["message"]["content"]
            parsed = json.loads(raw_text)

            # Accept question or statement as question key, answer or correct as answer key
            q_text = parsed.get("question") or parsed.get("statement") or parsed.get("questionText")
            ans = parsed.get("answer") or parsed.get("correct")
            opts = parsed.get("options")

            # Validate parsed response
            if q_text and opts and len(opts) == 4 and ans in ["A", "B", "C", "D"]:
                q["type"] = parsed.get("type", q.get("type"))
                q["question"] = q_text
                q["questionText"] = q_text
                q["options"] = opts
                q["answer"] = ans
                if parsed.get("explanation"):
                    q["explanation"] = parsed["explanation"]
                if parsed.get("meta"):
                    old_meta = q.get("meta") or {}
                    old_meta.update(parsed["meta"])
                    old_meta["auditedAt"] = "2026-11-10T06:40:00Z"
                    old_meta["qualityAudited"] = True
                    q["meta"] = old_meta

                updated_questions[qid] = q
                audited_count += 1
                print(f"  ✅ {qid} healed successfully! Answer: {ans}, Type: {q['type']}", flush=True)
            else:
                print(f"  ⚠️ {qid} returned incomplete JSON format: {parsed.keys()}", flush=True)

        except Exception as e:
            print(f"  ❌ Error auditing {qid} with worker: {e}", flush=True)

    print(f"\nFinished Worker Audit. Total successfully healed: {audited_count}/{len(questions_to_audit)}", flush=True)

    # 4. Save back to data/questions/rajasthan-gk/topic_03.json
    for idx, q in enumerate(t3_file['questions']):
        if q['id'] in updated_questions:
            t3_file['questions'][idx] = updated_questions[q['id']]

    with open('data/questions/rajasthan-gk/topic_03.json', 'w', encoding='utf-8') as f:
        json.dump(t3_file, f, ensure_ascii=False, indent=2)
    print("Saved updated questions to data/questions/rajasthan-gk/topic_03.json.", flush=True)

    # 5. Update local set files data/sets/topic-03/set-0XX.json
    for s_num in range(1, 13):
        set_path = f"data/sets/topic-03/set-{s_num:03d}.json"
        if os.path.exists(set_path):
            with open(set_path, 'r', encoding='utf-8') as f:
                s_data = json.load(f)
            if 'questions' in s_data:
                for q_idx, sq in enumerate(s_data['questions']):
                    sq_id = sq.get('id')
                    if sq_id in updated_questions:
                        s_data['questions'][q_idx] = updated_questions[sq_id]
            with open(set_path, 'w', encoding='utf-8') as f:
                json.dump(s_data, f, ensure_ascii=False, indent=2)
            print(f"Synchronized local set file: {set_path}", flush=True)

    print("\nAll done!", flush=True)

if __name__ == '__main__':
    main()
