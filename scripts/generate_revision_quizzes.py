import json
import random
import re
import sys

def load_set(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def generate_quizzes_for_set(set_data, set_num):
    words = set_data['words']
    all_words_list = [w['word'] for w in words]
    
    mcqs = []
    q_id_counter = 1

    # 1. SYNONYM MCQS
    for w in words:
        headword = w['word']
        syns = [s['word'] for s in w.get('synonyms', [])]
        ants = [a['word'] for a in w.get('antonyms', [])]
        hi_meaning = ", ".join(w.get('hindiMeaning', []))
        
        if not syns:
            continue
            
        correct_syn = syns[0]
        # Distractors: pick 1 antonym if available, plus other words from the set
        distractors = []
        if ants:
            distractors.append(ants[0])
            
        other_words = [ow for ow in all_words_list if ow != headword and ow not in syns and ow not in distractors]
        random.seed(headword + "_syn")
        while len(distractors) < 3 and other_words:
            pick = random.choice(other_words)
            distractors.append(pick)
            other_words.remove(pick)
            
        # Fallback if not enough
        filler_pool = ["maintain", "obscure", "trivialize", "enhance", "remedy", "provoke"]
        for filler in filler_pool:
            if len(distractors) < 3 and filler not in distractors and filler != headword:
                distractors.append(filler)

        options = [correct_syn] + distractors[:3]
        random.seed(headword + "_opts")
        random.shuffle(options)
        
        correct_letter = chr(65 + options.index(correct_syn))
        answer_index = options.index(correct_syn)

        expl = (
            f"**'{headword.capitalize()}'** का अर्थ है: **{hi_meaning}** ({w.get('englishDefinition', '')})\n"
            f"• सही Synonym: **'{correct_syn}'** (अर्थ: {hi_meaning})\n"
        )
        if ants:
            expl += f"• Antonyms: {', '.join([a['word'] for a in w['antonyms'][:3]])}"

        mcqs.append({
            "id": f"rev_set0{set_num}_syn_{q_id_counter:03d}",
            "type": "synonym",
            "setNumber": set_num,
            "targetWord": headword,
            "question": f"Select the most appropriate SYNONYM of the given word:\n\n**{headword.upper()}**",
            "options": options,
            "answer": correct_letter,
            "answerIndex": answer_index,
            "correctWord": correct_syn,
            "hindiMeaning": hi_meaning,
            "explanation": expl.strip()
        })
        q_id_counter += 1

    # 2. ANTONYM MCQS
    for w in words:
        headword = w['word']
        syns = [s['word'] for s in w.get('synonyms', [])]
        ants = [a['word'] for a in w.get('antonyms', [])]
        hi_meaning = ", ".join(w.get('hindiMeaning', []))
        
        if not ants:
            continue
            
        correct_ant = ants[0]['word'] if isinstance(ants[0], dict) else ants[0]
        # Distractors: pick 1-2 synonyms (classic exam trap!), plus other words
        distractors = []
        if syns:
            distractors.append(syns[0])
        if len(syns) > 1:
            distractors.append(syns[1])
            
        other_words = [ow for ow in all_words_list if ow != headword and ow != correct_ant and ow not in distractors]
        random.seed(headword + "_ant")
        while len(distractors) < 3 and other_words:
            pick = random.choice(other_words)
            distractors.append(pick)
            other_words.remove(pick)

        options = [correct_ant] + distractors[:3]
        random.seed(headword + "_ant_opts")
        random.shuffle(options)
        
        correct_letter = chr(65 + options.index(correct_ant))
        answer_index = options.index(correct_ant)

        ant_hi = ""
        if isinstance(ants[0], dict) and ants[0].get('hindiMeaning'):
            ant_hi = f" ({', '.join(ants[0]['hindiMeaning'])})"

        expl = (
            f"**'{headword.capitalize()}'** का अर्थ है: **{hi_meaning}**\n"
            f"• सही Antonym (विलोम): **'{correct_ant}'**{ant_hi}\n"
            f"• इसके Synonyms हैं: {', '.join(syns[:3])}"
        )

        mcqs.append({
            "id": f"rev_set0{set_num}_ant_{q_id_counter:03d}",
            "type": "antonym",
            "setNumber": set_num,
            "targetWord": headword,
            "question": f"Select the most appropriate ANTONYM of the given word:\n\n**{headword.upper()}**",
            "options": options,
            "answer": correct_letter,
            "answerIndex": answer_index,
            "correctWord": correct_ant,
            "hindiMeaning": hi_meaning,
            "explanation": expl.strip()
        })
        q_id_counter += 1

    # 3. SENTENCE CONTEXT MCQS (Fill in the blanks)
    for idx, w in enumerate(words):
        if idx % 2 != 0: # take half the words for sentence completion to keep quizzes sharp
            continue
        headword = w['word']
        ex = w.get('examples', [])
        if not ex or not ex[0].get('sentence'):
            continue
            
        sent = ex[0]['sentence']
        # Blank out headword or its forms (e.g. abandon, abandoned, abandons)
        pattern = re.compile(rf'\b{re.escape(headword[:min(len(headword)-1, 5)])}[a-z]*\b', re.IGNORECASE)
        match = pattern.search(sent)
        if not match:
            continue
            
        blanked_sent = sent[:match.start()] + "__________" + sent[match.end():]
        correct_token = match.group(0)

        # Distractors: other words from set with similar length or grammatical category
        other_tokens = [ow['word'] for ow in words if ow['word'].lower() != headword.lower()]
        random.seed(headword + "_sent")
        dist = random.sample(other_tokens, min(3, len(other_tokens)))
        
        options = [correct_token] + dist
        random.seed(headword + "_sent_opts")
        random.shuffle(options)
        
        correct_letter = chr(65 + options.index(correct_token))
        answer_index = options.index(correct_token)

        expl = (
            f"सही उत्तर: **'{correct_token}'**\n"
            f"वाक्य का हिंदी अनुवाद: {ex[0].get('hindiTranslation', '')}\n"
            f"अर्थ: **{headword}** = {', '.join(w.get('hindiMeaning', []))}"
        )

        mcqs.append({
            "id": f"rev_set0{set_num}_ctx_{q_id_counter:03d}",
            "type": "context_fill_in",
            "setNumber": set_num,
            "targetWord": headword,
            "question": f"Select the most appropriate word to fill in the blank:\n\n\"{blanked_sent}\"",
            "options": options,
            "answer": correct_letter,
            "answerIndex": answer_index,
            "correctWord": correct_token,
            "hindiMeaning": ", ".join(w.get('hindiMeaning', [])),
            "explanation": expl.strip()
        })
        q_id_counter += 1

    return mcqs

def generate_markdown_sheet(all_sets):
    md = []
    md.append("# 📖 Master Vocabulary Revision Sheet (Sets 01 – 03)")
    md.append("\n**Total High-Yield Words**: 103 Words | **Exam Focus**: RPSC 2nd Grade, CET, LDC & SSC\n")
    md.append("---\n")

    for s_idx, s in enumerate(all_sets, 1):
        md.append(f"## 🔹 Set {s_idx:02d}: {s['title']} ({s['wordCount']} Words)\n")
        md.append("| # | Word | Pronunciation | Hindi Meaning | Key Synonyms | Key Antonyms | Exam Context / Collocation |")
        md.append("|---|------|---------------|---------------|--------------|--------------|---------------------------|")
        
        for w in s['words']:
            w_id = w['id']
            word = f"**{w['word']}**"
            pron = w.get('pronunciation', {}).get('simple', '')
            hi = "<br>".join(w.get('hindiMeaning', [])[:2])
            
            syns = [s_item['word'] for s_item in w.get('synonyms', [])[:3]]
            syns_str = ", ".join(syns) if syns else "-"
            
            ants = []
            for a_item in w.get('antonyms', [])[:2]:
                if isinstance(a_item, dict):
                    ants.append(a_item['word'])
                else:
                    ants.append(str(a_item))
            ants_str = ", ".join(ants) if ants else "-"
            
            ex_sent = ""
            if w.get('examples'):
                ex_sent = w['examples'][0].get('sentence', '')
            if len(ex_sent) > 55:
                ex_sent = ex_sent[:52] + "..."

            md.append(f"| {w_id} | {word} | `{pron}` | {hi} | {syns_str} | {ants_str} | {ex_sent} |")
        md.append("\n---\n")

    return "\n".join(md)

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    base_dir = r'e:\quizzer2\data\ddd\english\vocab\synonyms'
    
    set1 = load_set(f"{base_dir}\\vocabulary_set_01.json")
    set2 = load_set(f"{base_dir}\\vocabulary_set_02.json")
    set3 = load_set(f"{base_dir}\\vocabulary_set_03.json")
    
    q1 = generate_quizzes_for_set(set1, 1)
    q2 = generate_quizzes_for_set(set2, 2)
    q3 = generate_quizzes_for_set(set3, 3)
    
    print(f"Generated {len(q1)} revision questions for Set 01")
    print(f"Generated {len(q2)} revision questions for Set 02")
    print(f"Generated {len(q3)} revision questions for Set 03")
    
    with open(f"{base_dir}\\revision_quiz_set_01.json", 'w', encoding='utf-8') as f:
        json.dump({"setId": "revision_quiz_set_01", "totalQuestions": len(q1), "questions": q1}, f, ensure_ascii=False, indent=2)

    with open(f"{base_dir}\\revision_quiz_set_02.json", 'w', encoding='utf-8') as f:
        json.dump({"setId": "revision_quiz_set_02", "totalQuestions": len(q2), "questions": q2}, f, ensure_ascii=False, indent=2)

    with open(f"{base_dir}\\revision_quiz_set_03.json", 'w', encoding='utf-8') as f:
        json.dump({"setId": "revision_quiz_set_03", "totalQuestions": len(q3), "questions": q3}, f, ensure_ascii=False, indent=2)

    all_questions = q1 + q2 + q3
    with open(f"{base_dir}\\revision_quiz_master_01_03.json", 'w', encoding='utf-8') as f:
        json.dump({"setId": "revision_quiz_master_01_03", "totalQuestions": len(all_questions), "questions": all_questions}, f, ensure_ascii=False, indent=2)

    sheet_md = generate_markdown_sheet([set1, set2, set3])
    with open(f"{base_dir}\\REVISION_SHEET_SETS_01_03.md", 'w', encoding='utf-8') as f:
        f.write(sheet_md)

    print(f"Total Master Revision Questions created: {len(all_questions)}")
    print(f"Saved Master Revision Sheet to REVISION_SHEET_SETS_01_03.md!")

if __name__ == '__main__':
    main()
