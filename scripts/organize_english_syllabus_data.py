import os
import shutil
import json

BASE_DIR = r"e:\quizzer2"
RAW_TOPICS_DIR = os.path.join(BASE_DIR, "data", "ddd", "english", "topics")
ENGLISH_DIR = os.path.join(BASE_DIR, "data", "english")

def copy_or_link_topic(src_filename, target_subpath, title):
    src_file = os.path.join(RAW_TOPICS_DIR, src_filename)
    dest_file = os.path.join(ENGLISH_DIR, target_subpath)
    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
    if os.path.exists(src_file):
        shutil.copy2(src_file, dest_file)
        with open(src_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        count = len(data) if isinstance(data, list) else len(data.get("questions", []))
        print(f"  [OK] Copied {count} questions for '{title}' -> {target_subpath}")
        return count
    else:
        print(f"  [MISSING] Source {src_filename} not found.")
        return 0

def create_readme(target_subpath, title, details):
    readme_path = os.path.join(ENGLISH_DIR, target_subpath, "README.md")
    os.makedirs(os.path.dirname(readme_path), exist_ok=True)
    content = f"# {title}\n\n**RPSC Senior Teacher (English) Paper-II Syllabus**\n\n{details}\n"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)

def main():
    print("Populating English Syllabus Directory Structure...")

    # Part 1: Parts of Speech (SEPARATE as requested)
    copy_or_link_topic("16_Verb.json", "part_1_secondary_sr_secondary/01_parts_of_speech/verbs/verb_questions.json", "Verbs")
    copy_or_link_topic("05_Adjective.json", "part_1_secondary_sr_secondary/01_parts_of_speech/adjectives/adjective_questions.json", "Adjectives")
    create_readme("part_1_secondary_sr_secondary/01_parts_of_speech/nouns", "Nouns (Parts of Speech)", "Classification of Nouns: Proper, Common, Collective, Abstract, Material. Countable vs Uncountable, Singular & Plural rules, Possessive cases.")
    create_readme("part_1_secondary_sr_secondary/01_parts_of_speech/adverbs", "Adverbs (Parts of Speech)", "Adverbs of Manner, Place, Time, Frequency, Degree. Position and inversion of adverbs, Adjective vs Adverb distinctions.")

    # Other Part 1 topics
    copy_or_link_topic("04_Articles.json", "part_1_secondary_sr_secondary/02_articles_and_determiners/articles_questions.json", "Articles")
    copy_or_link_topic("07_Determiner.json", "part_1_secondary_sr_secondary/02_articles_and_determiners/determiners_questions.json", "Determiners")
    copy_or_link_topic("01_Tense.json", "part_1_secondary_sr_secondary/03_tenses/tenses_questions.json", "Tenses")
    copy_or_link_topic("08_Preposition.json", "part_1_secondary_sr_secondary/04_prepositions/prepositions_questions.json", "Prepositions")
    copy_or_link_topic("23_Modals.json", "part_1_secondary_sr_secondary/05_modal_auxiliaries/modals_questions.json", "Modal Auxiliaries")
    copy_or_link_topic("19_Degree_of_Comparison.json", "part_1_secondary_sr_secondary/06_degrees_of_adjectives/degrees_questions.json", "Degrees of Adjectives")
    copy_or_link_topic("18_Conjunctions.json", "part_1_secondary_sr_secondary/07_subordination_and_coordination/conjunctions_questions.json", "Subordination & Coordination")
    copy_or_link_topic("02_Active_-_Passive_Voice.json", "part_1_secondary_sr_secondary/08_transformation_of_sentences/active_passive_questions.json", "Active & Passive Voice")
    copy_or_link_topic("03_Direct_-_Indirect.json", "part_1_secondary_sr_secondary/08_transformation_of_sentences/direct_indirect_questions.json", "Direct & Indirect Speech")
    copy_or_link_topic("10_Translation.json", "part_1_secondary_sr_secondary/08_transformation_of_sentences/translation_questions.json", "Translation")
    copy_or_link_topic("20_Correction_of_Sentences.json", "part_1_secondary_sr_secondary/08_transformation_of_sentences/sentence_correction_questions.json", "Correction of Sentences")
    copy_or_link_topic("17_Idiom_or_phrase.json", "part_1_secondary_sr_secondary/10_proverbs_and_idiomatic_expressions/idioms_questions.json", "Idioms and Proverbs")
    copy_or_link_topic("21_Confusable_Words.json", "part_1_secondary_sr_secondary/11_words_often_misspelt_and_confused/confusable_words_questions.json", "Confusable Words")
    copy_or_link_topic("24_Spellings.json", "part_1_secondary_sr_secondary/11_words_often_misspelt_and_confused/spellings_questions.json", "Spellings")
    copy_or_link_topic("15_One_Word.json", "part_1_secondary_sr_secondary/12_one_word_substitution/one_word_questions.json", "One Word Substitution")
    copy_or_link_topic("06_Synonym.json", "part_1_secondary_sr_secondary/13_synonyms_and_antonyms/synonym_questions.json", "Synonyms")
    copy_or_link_topic("14_Antonym.json", "part_1_secondary_sr_secondary/13_synonyms_and_antonyms/antonym_questions.json", "Antonyms")
    copy_or_link_topic("11_Prefixes_and_Suffixes.json", "part_1_secondary_sr_secondary/13_synonyms_and_antonyms/prefixes_suffixes_questions.json", "Prefixes & Suffixes")
    
    # Phrasal verbs reference
    pv_src = os.path.join(BASE_DIR, "data", "ddd", "english", "vocab", "phrasal_verbs_master.json")
    if os.path.exists(pv_src):
        shutil.copy2(pv_src, os.path.join(ENGLISH_DIR, "part_1_secondary_sr_secondary/09_phrasal_verbs/phrasal_verbs_master.json"))
        print("  [OK] Copied phrasal_verbs_master.json to 09_phrasal_verbs")

    create_readme("part_1_secondary_sr_secondary/14_phonetic_transcription", "Phonetic Transcription", "44 IPA sounds (12 Pure Vowels, 8 Diphthongs, 24 Consonants). Syllables, Word Stress, Phonetic Symbols commonly tested in RPSC.")

    # Part 2: Graduation Standard
    create_readme("part_2_graduation_standard/01_basic_sentence_patterns", "Basic Sentence Patterns", "7 basic sentence structures: SV, SVO, SVOO, SVC, SVOA, SVOC, SVA with diagnostic analysis.")
    create_readme("part_2_graduation_standard/02_clause_analysis_svoca", "Clause Analysis (SVOCA)", "Subject, Verb, Object (Direct & Indirect), Complement (Subject & Object Complement), Adjunct. Finite vs Non-finite clause analysis.")
    copy_or_link_topic("12_Reading_Comprehension.json", "part_2_graduation_standard/03_reading_comprehension_and_vocabulary/reading_comprehension_questions.json", "Reading Comprehension")
    copy_or_link_topic("09_Glossary_of_official_and_technical_terms.json", "part_2_graduation_standard/03_reading_comprehension_and_vocabulary/glossary_technical_terms.json", "Technical Terms")
    create_readme("part_2_graduation_standard/04_poetry_appreciation", "Poetry Appreciation", "Rhyme scheme, meter (iambic, trochaic, anapestic, dactylic), tone, mood, poetic imagery, critical appreciation.")
    create_readme("part_2_graduation_standard/05_literary_forms_devices_techniques", "Literary Forms / Devices / Techniques", "14 Prescribed Devices: Simile, Metaphor, Personification, Pun, Hyperbole, Alliteration, Onomatopoeia, Sonnet, Ode, Elegy, Ballad, Soliloquy, Dramatic Monologue, Stream of Consciousness.")
    create_readme("part_2_graduation_standard/06_major_literary_periods", "Major Literary Periods", "Renaissance, Metaphysical, Jacobean, Neoclassical, Romantic, Victorian, Modern periods with key characteristics and milestones.")
    create_readme("part_2_graduation_standard/07_major_literary_movements", "Major Literary Movements", "Romanticism, Gothic, Pre-Raphaelite Movement, Realism, Existentialism with key exponents.")
    create_readme("part_2_graduation_standard/08_prescribed_poetry", "Prescribed Poetry (15 Poems)", "Detailed analysis of Shakespeare Sonnet 30, Milton, Donne, Dryden, Wordsworth, Keats, Browning, Tennyson, T.S. Eliot, Neruda, Ezekiel, Kamala Das, Kolatkar, Aurobindo, Toru Dutt.")
    create_readme("part_2_graduation_standard/09_prescribed_prose", "Prescribed Prose (6 Works)", "Of Studies (Bacon), Meditations in Westminster Abbey (Addison), My Relations (Lamb), Freedom (Shaw), The Last Lesson (Daudet), The Enemy (Pearl S. Buck).")
    create_readme("part_2_graduation_standard/10_prescribed_fiction", "Prescribed Fiction (2 Works)", "A Tale of Two Cities (Charles Dickens) and Malgudi Days (R.K. Narayan).")
    create_readme("part_2_graduation_standard/11_prescribed_drama", "Prescribed Drama (2 Works)", "Macbeth (Shakespeare) and A Marriage Proposal (Anton Chekhov).")

    # Part 3: Teaching Methods
    create_readme("part_3_teaching_methods/01_basic_principles_of_second_language_teaching", "Basic Principles of Second Language Teaching", "Principles of Selection, Gradation, Presentation, Habit Formation, Motivation, Multiple Line of Approach, Accuracy and Fluency.")
    create_readme("part_3_teaching_methods/02_four_language_skills_lsrw", "Four Language Skills (LSRW)", "Listening, Speaking, Reading (Skimming, Scanning, Intensive, Extensive), Writing (Mechanics, Guided, Free).")
    create_readme("part_3_teaching_methods/03_teaching_of_language_forms", "Teaching of Language Forms", "Teaching of Prose, Poetry (Rhyme & aesthetics, no parsing), Grammar (Inductive vs Deductive), Composition.")
    create_readme("part_3_teaching_methods/04_approaches_and_methods_elt", "Approaches and Methods of ELT", "Grammar Translation Method (GTM), Direct Method, Structural Method, Audio-Lingual Method, Communicative Language Teaching (CLT).")
    create_readme("part_3_teaching_methods/05_evaluation_in_english_language", "Evaluation in English Language", "Continuous and Comprehensive Evaluation (CCE), Diagnostic & Remedial Teaching, Characteristics of a good test: Validity, Reliability, Objectivity, Usability.")

    print("\nEnglish syllabus directory populated successfully!")

if __name__ == "__main__":
    main()
