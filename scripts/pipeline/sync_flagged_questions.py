#!/usr/bin/env python3
"""
Sync flagged questions from Convex (Production or Dev) to data/audit/flagged-questions.json
Usage:
    python scripts/pipeline/sync_flagged_questions.py [--dev]
"""

import sys
import json
import subprocess
import os

FLAG_LABELS = {
    "wrong_answer": "गलत उत्तर / Wrong Answer",
    "duplicate": "डुप्लीकेट प्रश्न / Duplicate Question",
    "similar": "समान प्रश्न / Similar Question",
    "formatting": "फॉर्मेटिंग त्रुटि / UI Glitch",
}

def main():
    target_env = "--dev" if "--dev" in sys.argv else "--prod"
    print(f"[*] Fetching flagged questions from Convex ({target_env})...")

    cmd = ["npx", "convex", "run", "flaggedQuestions:listAll", target_env]
    if os.name == 'nt':
        res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
    else:
        res = subprocess.run(cmd, capture_output=True, text=True)

    if res.returncode != 0:
        print(f"[!] Error fetching flags from Convex: {res.stderr}")
        sys.exit(1)

    raw_output = res.stdout.strip()
    # Filter out node experimental warnings
    json_lines = []
    for line in raw_output.splitlines():
        if line.startswith("(") or "Warning" in line or "ExperimentalWarning" in line:
            continue
        json_lines.append(line)

    clean_json = "\n".join(json_lines).strip()
    try:
        flags = json.loads(clean_json) if clean_json else []
    except Exception as e:
        print(f"[!] Failed to parse JSON: {e}")
        print(f"Raw output:\n{clean_json}")
        sys.exit(1)

    out_file = os.path.join("data", "audit", "flagged-questions.json")
    os.makedirs(os.path.dirname(out_file), exist_ok=True)

    formatted_flags = []
    for f in flags:
        ftype = f.get("flagType", "unknown")
        formatted_flags.append({
            "questionId": f.get("questionId"),
            "testSetId": f.get("testSetId"),
            "questionNumber": f.get("questionNumber"),
            "flagType": ftype,
            "flagLabel": FLAG_LABELS.get(ftype, ftype),
            "note": f.get("note"),
            "flaggedAt": f.get("flaggedAt"),
            "userId": f.get("userId"),
        })

    data = {
        "updatedAt": subprocess.run(["node", "-e", "console.log(new Date().toISOString())"], capture_output=True, text=True).stdout.strip(),
        "totalCount": len(formatted_flags),
        "flags": formatted_flags,
    }

    with open(out_file, "w", encoding="utf-8") as fp:
        json.dump(data, fp, indent=2, ensure_ascii=False)

    print(f"[+] Successfully synced {len(formatted_flags)} flagged questions to {out_file}!")
    if formatted_flags:
        for i, item in enumerate(formatted_flags, 1):
            print(f"  {i}. [{item['flagType']}] {item['questionId']} (Set: {item.get('testSetId')} Q{item.get('questionNumber')}): {item.get('note') or 'No note'}")

if __name__ == "__main__":
    main()
