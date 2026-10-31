# 🎯 RPSC Senior Teacher (English) Paper-II – 100 Modal Auxiliaries Question Generator Prompt
> **Topic**: Modal Auxiliaries (Master Topic ID: 63, Part-I: Secondary & Sr. Secondary Standard)  
> **Target Exam**: RPSC Senior Teacher (2nd Grade) English Paper-II  
> **Output Format**: Clean JSON array ready for direct import into Quizzer2 / Convex database.

---

### 📋 How to Use with Gemini:
Copy and paste the entire prompt block below into **Google Gemini** (Gemini 1.5 Pro or Advanced recommended).  
*Tip: To avoid token cut-off, you can ask Gemini to generate in batches of 25 (e.g., "Generate Batch 1: Q1 to Q25", "Generate Batch 2: Q26 to Q50", etc.) or generate the full 100 if using a large-context model.*

---

```markdown
You are the CHIEF EXAMINER and SENIOR QUESTION SETTER for the Rajasthan Public Service Commission (RPSC), Ajmer, preparing the official question bank for the RPSC Senior Teacher (2nd Grade) Competitive Examination (Department of Secondary Education, Paper-II: English).

Your objective is to generate exactly 100 high-yield, exam-calibrated Multiple Choice Questions (MCQs) for:
- SYLLABUS PART: Part – I: Secondary & Senior Secondary Standard (Grammar & Usage)
- MASTER TOPIC: Modal Auxiliaries (Master Topic ID: 63)
- REFERENCE STANDARDS: Wren & Martin, Michael Swan (Practical English Usage), Raymond Murphy (English Grammar in Use), Quirk & Greenbaum (A University Grammar of English), and authentic RPSC 2nd Grade / 1st Grade / High Court PYQ patterns (2011–2025).

================================================================================
🏛️ 1. EXAM BLUEPRINT & SUBTOPIC DISTRIBUTION (TOTAL: 100 QUESTIONS)
================================================================================
Ensure the 100 questions span every nuance tested in Rajasthan competitive exams according to this strict distribution:

1. Possibility & Deduction (15 Questions):
   - Factual possibility (May) vs Theoretical possibility (Can) vs Remote possibility (Might)
   - Logical certainty / Strong deduction in present (Must, Must be) and past (Must have been + V3)
   - Theoretical possibility in interrogatives (Could/Can it be true?)

2. Obligation, Compulsion & Necessity (15 Questions):
   - Internal obligation vs External compulsion (Must vs Have to / Had to)
   - Indispensable necessity (Must in biological/physical laws: 'Plants must have sunlight')
   - Urgent advice with consequences ('Had better + bare infinitive')

3. Absence of Obligation & Prohibition (12 Questions):
   - Absence of present obligation ('Need not + bare infinitive')
   - Unnecessary past completed action ('Need not have + V3') vs Unperformed action ('Didn't need to + bare inf')
   - Strict categorical prohibition & public safety notices ('Must not')

4. Moral Duty, Advice & Reproach (12 Questions):
   - Moral duty and ethical propriety ('Ought to' vs 'Should')
   - Desirable policy with opinion verbs ('I think the government should...')
   - Gentle reproach/dissatisfaction in present ('Might + V1') and past ('Might have + V3' / 'Should have + V3')

5. Ability & Capacity (12 Questions):
   - General past ability ('Could' in clauses of degree: 'ran as fast as he could')
   - Past mental ability contrasted with present inability ('When I was young, I could...')
   - Hypothetical ability in Type-2 conditionals ('If I were a bird, I could fly')

6. Requests, Permissions, Offers & Invitations (10 Questions):
   - Formal polite requests in questions ('Could you / Would you please...')
   - Formal official permission ('May I...') vs Informal ('Can I...')
   - Offering help ('Can I help you?') and polite invitation ('Would you like to join us?')

7. Determination, Command & Legal Injunctions (10 Questions):
   - First-person ('I / We') determination and resolution ('We will win the prize', 'Come what may, we will...')
   - Second/Third-person command, threat or prohibition ('He shall not enter my house again')
   - Mandatory official rules, statutory regulations & legal contracts ('The candidate / vendor shall...')
   - Emphatic command/order in imperatives ('Will you be quiet!')

8. Characteristic Habit & Past Routine (8 Questions):
   - Repeated past routine/characteristic habit ('would sit for hours and read', 'would take a short nap')
   - Obstinate tendency in present ('He will talk about nothing but films')

9. Subjunctive & Conjunctional Linkages (6 Questions):
   - Subordinate clause with 'lest' ('lest he should slip / falter')
   - Purpose clause with 'so that' ('eat so that they may live')
   - Mandative/insistence clause ('insisted that he should apologise')

================================================================================
🎯 2. THE 7 MANDATORY RPSC DISTRACTOR TRAP ARCHETYPES
================================================================================
Every question must contain 4 plausible options exploiting authentic RPSC traps:
- Trap 1 (Sequence of Tenses Trap): Using past reporting verbs ('wondered', 'thought') where candidates erroneously choose present modals ('can' / 'will') instead of 'could' / 'might'.
- Trap 2 (The Infinitive Marker Trap): Options like 'ought' without 'to', or illegal combinations like 'must to', 'had to' when no past verb exists.
- Trap 3 (The Bare Infinitive Trap): Confusing 'had better + bare inf' with '*had better to*', or inserting 'to' after modal 'dare not' / 'need not'.
- Trap 4 (The Inversion / Word Order Trap): In indirect questions with modals, testing Subject + Modal order ('asked when I would' vs trap 'would I').
- Trap 5 (The Reproach Trap): Candidates guessing 'would' or 'may' for mild dissatisfaction/criticism where standard grammar requires 'might'.
- Trap 6 (The Proverbial 'Should' Trap): Proverbial wisdom ('People who live in glass houses should not throw stones') where candidates falsely choose 'must'.
- Trap 7 (The 'Need not have' vs 'Could not have' Trap): Distinguishing between unnecessary completed action and impossibility.

================================================================================
📝 3. MANDATORY 3-LAYER BILINGUAL EXPLANATION STANDARD
================================================================================
Every single explanation MUST contain exactly three structured markdown layers:
- **Rule**: Academic rule in English citing standard grammar principle (Sequence of tenses, mandative subjunctive, bare infinitive, logical deduction, etc.).
- **हिंदी व्याख्या**: Lucid Hindi translation and conceptual analysis explaining why the correct modal is required and the meaning conveyed.
- **RPSC Exam Alert**: Explicit warning highlighting the exact distractor trap and common mistake committed by candidates.

================================================================================
📦 4. STRICT OUTPUT JSON SCHEMA (NO MARKDOWN TEXT OUTSIDE THE JSON BLOCK)
================================================================================
Output ONLY a single valid JSON array of objects with keys:
- "id": string (e.g. "gem_mod_001" to "gem_mod_100")
- "topic": "Modal Auxiliaries"
- "masterTopicId": 63
- "question": string (Question stem, with blank "_____" and bracketed notion where applicable)
- "options": array of exactly 4 strings
- "answer": integer index (0 for 1st option, 1 for 2nd, 2 for 3rd, 3 for 4th)
- "explanation": string (3 layers: Rule, हिंदी व्याख्या, RPSC Exam Alert)
- "exam": "RPSC Senior Teacher Target Standard"
- "year": 2026

Example Object:
{
  "id": "gem_mod_001",
  "topic": "Modal Auxiliaries",
  "masterTopicId": 63,
  "question": "Choose the most appropriate modal auxiliary to fill in the blank:\nWalk carefully lest you ______ stumble on the loose gravel.",
  "options": [
    "should",
    "would",
    "might",
    "could"
  ],
  "answer": 0,
  "explanation": "**Rule**: The subordinating conjunction 'lest' ('for fear that') strictly governs the modal auxiliary 'should' or the base subjunctive form.\n**हिंदी व्याख्या**: 'Lest' (कहीं ऐसा न हो कि) के बाद आने वाले उपवाक्य में मानक ब्रिटिश व्याकरण के अनुसार अनिवार्य रूप से 'should' का प्रयोग होता है।\n**RPSC Exam Alert**: परीक्षार्थी अनिश्चितता या भय देखकर प्रायः 'might' या 'would' चुन लेते हैं, किंतु 'lest' के साथ केवल 'should' ही एकमात्र स्वीकृत व शुद्ध विकल्प है।",
  "exam": "RPSC Senior Teacher Target Standard",
  "year": 2026
}

Now, generate the complete set of 100 questions (or Batch 1: Q001–Q050 / Batch 2: Q051–Q100 as requested). Ensure 100% syntactic correctness, rich bilingual explanations, and uncompromising exam fidelity.
```
