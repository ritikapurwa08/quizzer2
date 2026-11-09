import json
import glob
import os

def apply_healing():
    report_file = 'data/questions/audit_heal_211_report.json'
    if not os.path.exists(report_file):
        print("Report file not found yet!")
        return

    with open(report_file, 'r', encoding='utf-8') as f:
        healed_list = json.load(f)

    print(f"=== APPLYING HEALING FOR {len(healed_list)} AUDITED QUESTIONS ===")

    # Group healed items by topic
    healed_by_topic = {}
    answer_changes = []
    format_changes = []
    errors = []

    for item in healed_list:
        if 'error' in item:
            errors.append(item)
            continue
            
        tnum = item.get('topic')
        if tnum not in healed_by_topic:
            healed_by_topic[tnum] = {}
        healed_by_topic[tnum][item['id']] = item
        
        orig_ans = item.get('original_answer')
        new_ans = item.get('answer')
        if orig_ans and new_ans and orig_ans != new_ans:
            answer_changes.append({
                'id': item['id'],
                'topic': tnum,
                'from': orig_ans,
                'to': new_ans,
                'question': item.get('question', '')[:60]
            })
            
        if item.get('type') in ['match', 'sequence']:
            format_changes.append(item['id'])

    print(f"Successfully Parsed: {len(healed_list) - len(errors)} / {len(healed_list)}")
    print(f"Failed/Errors: {len(errors)}")
    print(f"Factual Answer Key Corrections: {len(answer_changes)}")
    print(f"Structured Meta Formatted (Match/Sequence): {len(format_changes)}")

    if answer_changes:
        print("\n--- SAMPLE ANSWER KEY CORRECTIONS ---")
        for ac in answer_changes[:10]:
            print(f"  • [{ac['id']} | Topic {ac['topic']:02d}]: Changed {ac['from']} -> {ac['to']} | {ac['question']}...")

    # Apply changes to topic JSON files
    total_topic_updates = 0
    for tnum, q_map in healed_by_topic.items():
        fname = f"data/questions/rajasthan-gk/topic_{tnum:02d}.json"
        if not os.path.exists(fname):
            continue
            
        with open(fname, 'r', encoding='utf-8') as tf:
            tdata = json.load(tf)
            
        is_dict = isinstance(tdata, dict)
        qs = tdata.get('questions', []) if is_dict else tdata
        
        updated_in_topic = 0
        for q in qs:
            qid = q.get('id')
            if qid in q_map:
                h = q_map[qid]
                q['question'] = h.get('question', q['question'])
                q['options'] = h.get('options', q['options'])
                q['answer'] = h.get('answer', q['answer'])
                q['type'] = h.get('type', q.get('type', 'mcq'))
                q['explanation'] = h.get('explanation') or q.get('explanation')
                
                # Merge meta
                if not q.get('meta'):
                    q['meta'] = {}
                h_meta = h.get('meta') or {}
                for k, v in h_meta.items():
                    q['meta'][k] = v
                q['meta']['auditedAt'] = '2026-11-09T14:30:00Z'
                q['meta']['qualityAudited'] = True
                
                updated_in_topic += 1
                total_topic_updates += 1
                
        # Also check archivedVariants if present
        if is_dict and 'archivedVariants' in tdata:
            for q in tdata['archivedVariants']:
                qid = q.get('id')
                if qid in q_map:
                    h = q_map[qid]
                    q['question'] = h.get('question', q['question'])
                    q['options'] = h.get('options', q['options'])
                    q['answer'] = h.get('answer', q['answer'])
                    q['type'] = h.get('type', q.get('type', 'mcq'))
                    if not q.get('meta'):
                        q['meta'] = {}
                    h_meta = h.get('meta') or {}
                    for k, v in h_meta.items():
                        q['meta'][k] = v
                    q['meta']['auditedAt'] = '2026-11-09T14:30:00Z'
                    q['meta']['qualityAudited'] = True
                    updated_in_topic += 1
                    total_topic_updates += 1

        with open(fname, 'w', encoding='utf-8') as tf:
            json.dump(tdata, tf, ensure_ascii=False, indent=2)

    print(f"\n✅ Total Question Updates Applied to Master Topic Files: {total_topic_updates}")

    # Now propagate to individual set JSON files in data/sets/topic-XX/
    total_set_updates = 0
    all_healed_ids = {qid: h for tnum, q_map in healed_by_topic.items() for qid, h in q_map.items()}
    
    set_files = glob.glob('data/sets/topic-*/*.json')
    for sf in set_files:
        try:
            with open(sf, 'r', encoding='utf-8') as f:
                sdata = json.load(f)
            
            # Check if this set file contains full questions array
            if 'questions' in sdata and isinstance(sdata['questions'], list):
                modified = False
                for q in sdata['questions']:
                    qid = q.get('id')
                    if qid in all_healed_ids:
                        h = all_healed_ids[qid]
                        q['question'] = h.get('question', q['question'])
                        q['options'] = h.get('options', q['options'])
                        q['answer'] = h.get('answer', q['answer'])
                        q['type'] = h.get('type', q.get('type', 'mcq'))
                        q['explanation'] = h.get('explanation') or q.get('explanation')
                        if not q.get('meta'):
                            q['meta'] = {}
                        for k, v in (h.get('meta') or {}).items():
                            q['meta'][k] = v
                        modified = True
                        total_set_updates += 1
                if modified:
                    with open(sf, 'w', encoding='utf-8') as f:
                        json.dump(sdata, f, ensure_ascii=False, indent=2)
        except Exception as e:
            pass

    print(f"✅ Propagated Updates to Live Set JSON Files: {total_set_updates} question instances")

if __name__ == '__main__':
    apply_healing()

