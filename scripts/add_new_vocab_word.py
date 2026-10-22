import sys
import os
import json
import argparse
import re

MASTER_FILE = r'e:\quizzer2\data\ddd\english\vocab\synonyms\vocabulary_master_complete.json'
SETS_DIR = r'e:\quizzer2\data\ddd\english\vocab\synonyms\sets'

def add_word(word, hindi_meanings, english_def, pos="noun", synonyms=None, antonyms=None, example_sent=None, example_hi=None):
    if not os.path.exists(MASTER_FILE):
        print(f"Master file not found at {MASTER_FILE}")
        return False

    with open(MASTER_FILE, encoding='utf-8') as f:
        master = json.load(f)

    words = master.get('words', [])
    word_clean = word.lower().strip()

    # Check duplicate
    for w in words:
        if w['word'].lower().strip() == word_clean:
            print(f"⚠️ Word '{word_clean}' already exists in master database (ID: {w['id']})!")
            return False

    next_id = max([w['id'] for w in words], default=0) + 1

    # Format Hindi meanings
    if isinstance(hindi_meanings, str):
        hi_list = [h.strip() for h in re.split(r'[,;/|]', hindi_meanings) if h.strip()]
    else:
        hi_list = hindi_meanings or [word_clean]

    # Format POS
    if isinstance(pos, str):
        pos_list = [p.strip() for p in re.split(r'[,;/|]', pos) if p.strip()]
    else:
        pos_list = pos or ["word"]

    # Pronunciation
    pron = {
        "ipa": f"/{word_clean}/",
        "simple": word_clean.upper() if len(word_clean) <= 4 else word_clean[:len(word_clean)//2].upper() + "-" + word_clean[len(word_clean)//2:].lower()
    }

    # Example
    examples = []
    if example_sent:
        examples.append({
            "sentence": example_sent,
            "hindiTranslation": example_hi or ""
        })
    else:
        examples.append({
            "sentence": f"She demonstrated a clear understanding of the term {word_clean}.",
            "hindiTranslation": f"उन्होंने {hi_list[0]} शब्द की स्पष्ट समझ प्रदर्शित की।"
        })

    # Synonyms
    syn_objs = []
    if synonyms:
        if isinstance(synonyms, str):
            syn_list = [s.strip() for s in re.split(r'[,;/|]', synonyms) if s.strip()]
        else:
            syn_list = synonyms
        for s in syn_list:
            syn_objs.append({
                "word": s.lower().strip(),
                "partOfSpeech": pos_list,
                "hindiMeaning": hi_list[:2],
                "examples": [
                    {
                        "sentence": f"The decision was considered {s.lower().strip()}.",
                        "hindiTranslation": f"यह निर्णय {s.lower().strip()} माना गया।"
                    }
                ]
            })

    # Antonyms
    ant_objs = []
    if antonyms:
        if isinstance(antonyms, str):
            ant_list = [a.strip() for a in re.split(r'[,;/|]', antonyms) if a.strip()]
        else:
            ant_list = antonyms
        for a in ant_list:
            ant_objs.append({
                "word": a.lower().strip(),
                "hindiMeaning": []
            })

    new_word_obj = {
        "id": next_id,
        "word": word_clean,
        "partOfSpeech": pos_list,
        "hindiMeaning": hi_list,
        "englishDefinition": english_def or f"Definition of {word_clean}.",
        "pronunciation": pron,
        "examples": examples,
        "synonyms": syn_objs,
        "antonyms": ant_objs,
        "relatedWords": [],
        "reviewStatus": "verified"
    }

    words.append(new_word_obj)
    master['totalWordCount'] = len(words)

    # Save to master
    with open(MASTER_FILE, 'w', encoding='utf-8') as f:
        json.dump(master, f, ensure_ascii=False, indent=2)

    # Update modular set file
    set_num = ((len(words) - 1) // 25) + 1
    set_file = f"{SETS_DIR}\\vocabulary_set_{set_num:03d}.json"
    
    if os.path.exists(set_file):
        with open(set_file, encoding='utf-8') as f:
            set_data = json.load(f)
        set_data['words'].append(new_word_obj)
        set_data['wordCount'] = len(set_data['words'])
    else:
        set_data = {
            "setId": f"vocabulary_set_{set_num:03d}",
            "setNumber": set_num,
            "title": f"Vocabulary Set {set_num:03d}",
            "language": "en-hi",
            "wordCount": 1,
            "words": [new_word_obj]
        }

    with open(set_file, 'w', encoding='utf-8') as f:
        json.dump(set_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully added '{word_clean}' with ID {next_id}!")
    print(f"📁 Appended to Master Bank and Set {set_num:03d} ({set_file})")
    print(f"📊 New Total Words: {len(words)}")
    return True

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    parser = argparse.ArgumentParser(description="Add new vocabulary word to master database")
    parser.add_argument("--word", help="English headword")
    parser.add_argument("--hindi", help="Hindi meaning (comma separated)")
    parser.add_argument("--definition", help="English / Webster definition")
    parser.add_argument("--pos", default="noun", help="Part of speech (noun, verb, adjective, etc.)")
    parser.add_argument("--synonyms", help="Synonyms (comma separated)")
    parser.add_argument("--antonyms", help="Antonyms (comma separated)")
    parser.add_argument("--sentence", help="Example sentence")
    parser.add_argument("--translation", help="Hindi translation of example sentence")

    args = parser.parse_args()

    if args.word and args.hindi and args.definition:
        add_word(
            word=args.word,
            hindi_meanings=args.hindi,
            english_def=args.definition,
            pos=args.pos,
            synonyms=args.synonyms,
            antonyms=args.antonyms,
            example_sent=args.sentence,
            example_hi=args.translation
        )
    else:
        # Interactive mode
        print("==================================================")
        print("     ➕ ADD NEW WORD TO MASTER VOCABULARY BANK     ")
        print("==================================================")
        word = input("Enter Headword: ").strip()
        if not word:
            return
        pos = input("Part of Speech [noun/verb/adjective]: ").strip() or "noun"
        hindi = input("Hindi Meaning: ").strip()
        defn = input("English / Webster Definition: ").strip()
        syns = input("Synonyms (comma-separated, optional): ").strip()
        ants = input("Antonyms (comma-separated, optional): ").strip()
        sent = input("Example sentence (optional): ").strip()
        trans = input("Hindi translation of sentence (optional): ").strip()

        add_word(
            word=word,
            hindi_meanings=hindi,
            english_def=defn,
            pos=pos,
            synonyms=syns,
            antonyms=ants,
            example_sent=sent,
            example_hi=trans
        )

if __name__ == '__main__':
    main()
