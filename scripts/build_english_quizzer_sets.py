import json
import os
import random
import re

def convert_revision_quiz_to_quizzer_formats(rev_quiz_path, out_standard_path, out_minified_path, set_title):
    with open(rev_quiz_path, "r", encoding="utf-8") as f:
        rev_data = json.load(f)

    questions = rev_data.get("questions", [])
    standard_questions = []
    minified_questions = []

    for idx, q in enumerate(questions):
        raw_options = q.get("options", [])
        ans_idx = q.get("answerIndex", 0)
        
        # Ensure 4 options
        options_obj = []
        for i, opt in enumerate(raw_options):
            options_obj.append({
                "id": f"opt{i+1}",
                "text": opt
            })

        correct_opt_id = f"opt{ans_idx + 1}"

        # Standard Quizzer question
        std_q = {
            "id": q.get("id", f"eng_v_{idx+1:03d}"),
            "type": "mcq",
            "questionText": q.get("question", ""),
            "options": options_obj,
            "correctAnswer": correct_opt_id,
            "explanation": q.get("explanation", ""),
            "difficulty": "medium",
            "meta": {
                "source": "Master Vocab Bank (RPSC 2nd Grade English)",
                "targetWord": q.get("targetWord", ""),
                "type": q.get("type", "synonym"),
                "setNumber": q.get("setNumber", 1)
            }
        }
        standard_questions.append(std_q)

        # Minified import question
        min_q = {
            "q": q.get("question", ""),
            "o": raw_options,
            "a": ans_idx,
            "e": q.get("explanation", ""),
            "t": "mcq",
            "d": "medium"
        }
        minified_questions.append(min_q)

    # Wrap standard test set
    standard_set = {
        "name": set_title,
        "topicName": "Synonyms and Antonyms",
        "subjectName": "English (Paper-II)",
        "questionCount": len(standard_questions),
        "durationMinutes": max(15, len(standard_questions) // 2),
        "negativeMarking": True,
        "questions": standard_questions
    }

    with open(out_standard_path, "w", encoding="utf-8") as f:
        json.dump(standard_set, f, ensure_ascii=False, indent=2)

    with open(out_minified_path, "w", encoding="utf-8") as f:
        json.dump(minified_questions, f, ensure_ascii=False, indent=2)

    print(f"Generated {len(standard_questions)} questions:")
    print(f"  -> Standard: {out_standard_path}")
    print(f"  -> Minified: {out_minified_path}")

def main():
    base_dir = r"e:\quizzer2"
    syn_dir = os.path.join(base_dir, "data", "ddd", "english", "vocab", "synonyms")
    out_dir = os.path.join(base_dir, "data", "english", "quiz_sets")
    os.makedirs(out_dir, exist_ok=True)

    sets = [
        ("revision_quiz_set_01.json", "set_01_vocab_mcqs.json", "set_01_minified_import.json", "English Vocab Practice - Set 01 (Synonyms, Antonyms & Context)"),
        ("revision_quiz_set_02.json", "set_02_vocab_mcqs.json", "set_02_minified_import.json", "English Vocab Practice - Set 02 (Synonyms, Antonyms & Context)"),
        ("revision_quiz_set_03.json", "set_03_vocab_mcqs.json", "set_03_minified_import.json", "English Vocab Practice - Set 03 (Synonyms, Antonyms & Context)"),
    ]

    for rev_file, std_file, min_file, title in sets:
        rev_path = os.path.join(syn_dir, rev_file)
        if os.path.exists(rev_path):
            out_std = os.path.join(out_dir, std_file)
            out_min = os.path.join(out_dir, min_file)
            convert_revision_quiz_to_quizzer_formats(rev_path, out_std, out_min, title)
        else:
            print(f"File not found: {rev_path}")

if __name__ == "__main__":
    main()
