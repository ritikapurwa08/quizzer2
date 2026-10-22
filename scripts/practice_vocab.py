import json
import random
import sys
import os

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

BASE_SYN_DIR = r'e:\quizzer2\data\ddd\english\vocab\synonyms'
MASTER_2500_PATH = r'e:\quizzer2\data\ddd\english\vocab\master_vocab_2500_complete.json'

_cached_master_2500 = None

def get_master_2500():
    global _cached_master_2500
    if _cached_master_2500 is None:
        if os.path.exists(MASTER_2500_PATH):
            with open(MASTER_2500_PATH, encoding='utf-8') as f:
                _cached_master_2500 = json.load(f)
        else:
            _cached_master_2500 = {"words": []}
    return _cached_master_2500

def load_set_words(set_num):
    # If 1, 2, 3 -> load rich synonym json
    if set_num in [1, 2, 3]:
        p = f"{BASE_SYN_DIR}\\vocabulary_set_0{set_num}.json"
        if os.path.exists(p):
            with open(p, encoding='utf-8') as f:
                d = json.load(f)
                return d.get('words', [])

    # For any set 1 to 101 -> load from master 2500
    master = get_master_2500()
    words_in_set = [w for w in master['words'] if w['setNumber'] == set_num]
    formatted = []
    for w in words_in_set:
        formatted.append({
            "id": w['masterId'],
            "word": w['word'],
            "partOfSpeech": [w['partOfSpeech']] if w['partOfSpeech'] else [],
            "hindiMeaning": [w['hindiMeaning']] if w['hindiMeaning'] else [],
            "englishDefinition": w['englishDefinition'],
            "pronunciation": {"simple": w['word'].upper()},
            "synonyms": [],
            "antonyms": [],
            "examples": []
        })
    return formatted

def load_quiz(set_num):
    if set_num == 0:
        p = f"{BASE_SYN_DIR}\\revision_quiz_master_01_03.json"
    elif set_num in [1, 2, 3]:
        p = f"{BASE_SYN_DIR}\\revision_quiz_set_0{set_num}.json"
    else:
        p = None

    if p and os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            return json.load(f)

    # Dynamically generate quiz questions for sets > 3 from 2500 bank
    words = load_set_words(set_num)
    if not words or len(words) < 4:
        return None

    all_master_words = get_master_2500()['words']
    questions = []
    for idx, w in enumerate(words, 1):
        headword = w['word']
        hi = ", ".join(w['hindiMeaning'])
        defn = w['englishDefinition']
        
        # Pick 3 random distractors from entire master pool
        other_words = [ow['word'] for ow in all_master_words if ow['word'].lower() != headword.lower()]
        distractors = random.sample(other_words, 3)
        options = [headword] + distractors
        random.shuffle(options)
        
        ans_letter = chr(65 + options.index(headword))
        ans_idx = options.index(headword)
        
        questions.append({
            "id": f"dyn_set_{set_num:03d}_{idx:02d}",
            "question": f"Which word matches this meaning / definition?\n\nMeaning: \"{hi}\"\nDefinition: \"{defn}\"",
            "options": options,
            "answer": ans_letter,
            "answerIndex": ans_idx,
            "explanation": f"**{headword.upper()}** ({', '.join(w['partOfSpeech'])})\n• अर्थ: {hi}\n• Definition: {defn}"
        })

    return {"questions": questions}

def run_flashcards(set_num):
    words = load_set_words(set_num)
    if not words:
        print(f"No words found for Set {set_num}.")
        input("Press ENTER...")
        return

    clear_screen()
    print(f"============================================================")
    print(f"  📖 FLASHCARD STUDY MODE — Set {set_num:02d} ({len(words)} Words)")
    print(f"============================================================")
    print("Press ENTER to reveal the meaning, or type 'q' to exit.\n")

    for idx, w in enumerate(words, 1):
        pron = w.get('pronunciation', {}).get('simple', '')
        pos_str = ', '.join(w.get('partOfSpeech', []))
        print(f"[{idx}/{len(words)}] WORD: \033[1;36m{w['word'].upper()}\033[0m" + (f" ({pron})" if pron else ""))
        if pos_str:
            print(f"Part of Speech: {pos_str}")
            
        user_input = input(">> Press [ENTER] to reveal meaning (or 'q' to quit)... ")
        if user_input.strip().lower() == 'q':
            break

        print("\n\033[1;32m--- REVEAL ---\033[0m")
        hi_str = ', '.join(w.get('hindiMeaning', []))
        print(f"Hindi Meaning: \033[1;33m{hi_str}\033[0m")
        print(f"Definition   : {w.get('englishDefinition', '')}")
        
        syns = [s['word'] for s in w.get('synonyms', [])[:4]]
        if syns:
            print(f"Synonyms     : \033[1;32m{', '.join(syns)}\033[0m")
        
        ants = []
        for a in w.get('antonyms', [])[:3]:
            if isinstance(a, dict):
                ants.append(a['word'])
            else:
                ants.append(str(a))
        if ants:
            print(f"Antonyms     : \033[1;31m{', '.join(ants)}\033[0m")

        if w.get('examples'):
            ex = w['examples'][0]
            print(f"Example      : {ex.get('sentence', '')}")
            print(f"Translation  : {ex.get('hindiTranslation', '')}")
        
        print("-" * 60)
        user_next = input("Press [ENTER] for next word (or 'q' to return)... ")
        if user_next.strip().lower() == 'q':
            break
        clear_screen()

def run_quiz(set_num, num_q=15):
    quiz_data = load_quiz(set_num)
    if not quiz_data or not quiz_data.get('questions'):
        print(f"No quiz questions available for Set {set_num}.")
        input("Press ENTER...")
        return

    questions = quiz_data['questions']
    random.shuffle(questions)
    questions = questions[:num_q]

    clear_screen()
    title = f"Set {set_num:02d}" if set_num > 0 else "Master Mega Quiz (All Sets)"
    print(f"============================================================")
    print(f"  🎯 REVISION MCQ QUIZ — {title} ({len(questions)} Questions)")
    print(f"============================================================")
    print("Type A, B, C, or D for each question (or 'q' to quit).\n")

    score = 0
    for idx, q in enumerate(questions, 1):
        print(f"Q{idx}. {q['question']}\n")
        opts = q['options']
        for i, opt in enumerate(opts):
            letter = chr(65 + i)
            print(f"   ({letter}) {opt}")

        user_ans = input("\nYour Answer (A/B/C/D): ").strip().upper()
        if user_ans == 'Q':
            break

        correct_ans = q['answer']
        if user_ans == correct_ans:
            print("\033[1;32m✔ CORRECT!\033[0m")
            score += 1
        else:
            print(f"\033[1;31m✘ INCORRECT! Correct answer was ({correct_ans}): {opts[q['answerIndex']]}\033[0m")

        print(f"\nExplanation:\n{q['explanation']}")
        print("=" * 60)
        user_c = input("Press [ENTER] to continue (or 'q' to quit)... ")
        if user_c.strip().lower() == 'q':
            break
        clear_screen()

    print("\n================== QUIZ RESULT ==================")
    print(f"Final Score: {score} / {len(questions)} ({int(score/len(questions)*100)}%)")
    if score == len(questions):
        print("🌟 Outstanding! Full marks!")
    elif score >= len(questions) * 0.7:
        print("👍 Well done! Good retention.")
    else:
        print("⚠️ Needs revision. Re-read the revision sheet!")
    print("=================================================")
    input("\nPress ENTER to return to menu...")

def search_word():
    clear_screen()
    print("============================================================")
    print("       🔍 INSTANT DICTIONARY & SET LOOKUP (2,522 Words)      ")
    print("============================================================")
    query = input("Enter word to search (English or Hindi): ").strip().lower()
    if not query:
        return

    master = get_master_2500()['words']
    matches = [w for w in master if query in w['word'].lower() or query in w.get('hindiMeaning', '').lower()]
    
    print(f"\nFound {len(matches)} match(es):\n")
    for m in matches[:10]:
        print(f"• \033[1;36m{m['word'].upper()}\033[0m ({m['partOfSpeech']}) — [Set {m['setNumber']:02d}]")
        print(f"  Hindi Meaning : {m['hindiMeaning']}")
        print(f"  Definition    : {m['englishDefinition']}")
        print(f"  Source Notes  : {', '.join(m.get('sources', []))}")
        print("-" * 50)
    
    if len(matches) > 10:
        print(f"... and {len(matches) - 10} more results.")
    input("\nPress ENTER to return...")

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    master = get_master_2500()
    total_words = len(master.get('words', []))
    total_sets = master.get('totalSetsOf25', 101)

    while True:
        clear_screen()
        print("============================================================")
        print("       🧠 QUIZZER2 VOCABULARY LEARNING & REVISION HUB        ")
        print(f"          Total Bank: {total_words} Words | {total_sets} Sets of 25 Words    ")
        print("============================================================")
        print("1. Flashcard Mode (Choose any Set 1 to 101)")
        print("2. Practice Quiz (Choose any Set 1 to 101)")
        print("3. Master Mega Quiz (Sets 01–03 Combined: 25 MCQs)")
        print("4. Quick Study: Set 01 (Words 1–25: Abandon to Allege)")
        print("5. Quick Study: Set 02 (Words 26–51: Altitude to Banish)")
        print("6. Quick Study: Set 03 (Words 52–103: Barren to Original)")
        print("7. 🔍 Instant Word Search across all 2,522 words")
        print("------------------------------------------------------------")
        print("0. Exit")
        print("============================================================")
        choice = input("Enter choice (0-7): ").strip()
        
        if choice == '1':
            s_input = input(f"Enter Set Number (1-{total_sets}): ").strip()
            if s_input.isdigit() and 1 <= int(s_input) <= total_sets:
                run_flashcards(int(s_input))
        elif choice == '2':
            s_input = input(f"Enter Set Number (1-{total_sets}): ").strip()
            if s_input.isdigit() and 1 <= int(s_input) <= total_sets:
                run_quiz(int(s_input), 15)
        elif choice == '3':
            run_quiz(0, 25)
        elif choice == '4':
            run_flashcards(1)
        elif choice == '5':
            run_flashcards(2)
        elif choice == '6':
            run_flashcards(3)
        elif choice == '7':
            search_word()
        elif choice == '0':
            print("Keep revising! Happy learning!")
            break

if __name__ == '__main__':
    main()
