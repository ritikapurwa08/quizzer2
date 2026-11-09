import json

with open('audit_report_9sets.json', 'r', encoding='utf-8') as f:
    rep = json.load(f)

saved = rep['saved_questions']
print(f"Total saved questions from the 9 sets: {len(saved)}")

# Check each saved question
faults = []
for item in saved:
    qid = item['qid']
    q_text = item['question']
    opts = item['options']
    ans = item['answer']
    exp = item['explanation']
    u_sel = item['user_sel']
    is_corr = item['is_corr']
    s_name = item['set']
    
    # Analyze known bugs
    issue = None
    if qid == 'rg_012901':
        issue = "CRITICAL_KEY_BUG: Haryana border - Dausa is correct (doesn't border), but system marked Alwar!"
    elif qid == 'rg_000603':
        issue = "TYPO_CORRUPTION: Option A says 'भीलवाड़ा' instead of 'देलवाड़ा'! User selected A, system marked C."
    elif qid == 'rg_012897':
        issue = "UI_OPTION_BUG: Interstate border states (a,b,c,e) - UI option mismatch caused wrong selection."
    elif 'सूची' in q_text or 'सुमेलित' in q_text:
        issue = "FORMATTING/TRUNCATION: Match the following question truncated in UI test interface."
    
    faults.append({
        'qid': qid,
        'set': s_name,
        'q_text': q_text[:80],
        'user_sel': u_sel,
        'system_ans': ans,
        'is_corr': is_corr,
        'issue': issue,
        'options': opts,
        'explanation': exp[:150]
    })

print("\n--- Identified Key & Content Issues in User's Saved Questions ---")
for f in faults:
    if f['issue'] or not f['is_corr']:
        print(f"[{f['qid']}] ({f['set']})")
        print(f"  Q: {f['q_text']}")
        print(f"  System Ans: {f['system_ans']} | User Sel: {f['user_sel']} | IsCorr: {f['is_corr']}")
        if f['issue']:
            print(f"  ISSUE: {f['issue']}")
        print()

with open('saved_faults_detailed.json', 'w', encoding='utf-8') as f:
    json.dump(faults, f, ensure_ascii=False, indent=2)

