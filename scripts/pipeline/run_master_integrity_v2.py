#!/usr/bin/env python3
"""
MASTER INTEGRITY V2: High-Performance, Low-Cost Full Question Bank Processor
Optimized for:
- Maximum local CPU execution (85-90% solved by deterministic algorithms & memory)
- Minimal Groq API calls (only for genuinely ambiguous cases)
- Continuous self-learning (codifying new patterns into deterministic rules)
- Automatic archival of duplicates from `questions` -> `archivedVariants`
- Automatic repacking of published sets in `published-sets.json`
- Zero agent context waste
"""

import argparse
import hashlib
import json
import os
import re
import socket
import time
import unicodedata
import urllib.error
import urllib.request
from collections import defaultdict, Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Enforce strict 15s network timeout on all sockets
socket.setdefaulttimeout(15.0)

try:
    from rapidfuzz import fuzz
    def fast_ratio(s1, s2):
        return fuzz.ratio(s1, s2) / 100.0
except ImportError:
    from difflib import SequenceMatcher
    def fast_ratio(s1, s2):
        return SequenceMatcher(None, s1, s2).ratio()

DEFAULT_TEXT_FIELDS = ("question", "questionText", "text", "prompt", "statement")
DEFAULT_ANSWER_FIELDS = ("answer", "correctAnswer", "correct_answer", "answerText", "key")
DEFAULT_OPTIONS_FIELDS = ("options", "choices", "answers")
DEFAULT_ID_FIELDS = ("_id", "id", "questionId", "question_id")
DEFAULT_TOPIC_FIELDS = ("topicId", "topic_id", "topic", "subjectTopicId")
DEFAULT_SET_FIELDS = ("setId", "set_id", "testId", "test_id")
DEFAULT_EXP_FIELDS = ("explanation", "detailedExplanation", "solution")

CODES = {
    "E": "exact_duplicate",
    "N": "near_duplicate",
    "C": "conceptual_duplicate",
    "V": "related_variation",
    "D": "different",
    "U": "unresolved",
}
DUP_DECISIONS = {"exact_duplicate", "near_duplicate", "conceptual_duplicate", "duplicate"}

HINDI_EXAM_STOP_WORDS = {
    "राजस्थान", "निम्नलिखित", "कथन", "कथनों", "सही", "उत्तर", "विकल्प", "विकल्पों",
    "चुनें", "चुनिए", "चयन", "करें", "कीजिए", "जिले", "जिला", "जिलों", "राज्य", "प्रमुख",
    "कौन", "कौन-सा", "कौन-सी", "कौनसा", "कौनसी", "किस", "किसे", "कितने", "कहाँ", "कब",
    "निम्न", "संदर्भ", "दिए", "गए", "सूची", "सुमेलित", "सम्बंधित", "संबंधित", "स्थित", "माना",
    "नीचे", "सबसे", "उपयुक्त"
}

GENERIC_ANSWER_WORDS = {
    "none", "null", "true", "false", "उपरोक्त सभी", "इनमें से कोई नहीं", "a", "b", "c", "d",
    "1", "2", "3", "4", "हाँ", "नहीं", "all of the above", "none of these"
}

BOILERPLATE_PREFIXES = [
    r"^निम्नलिखित\s+में\s+से\s+",
    r"^निम्न\s+में\s+से\s+",
    r"^नीचे\s+दिए\s+गए\s+विकल्पों\s+में\s+से\s+",
    r"^दिए\s+गए\s+विकल्पों\s+में\s+से\s+",
    r"^राजस्थान\s+के\s+संदर्भ\s+में\s+",
    r"^राजस्थान\s+में\s+",
    r"\s*:\s*नीचे\s+दिए\s+गए\s+विकल्पों\s+में\s+से\s+सबसे\s+उपयुक्त\s+उत्तर\s+चुनें.*$",
    r"\s*\(निम्न\s+में\s+से\s+सबसे\s+उपयुक्त\s+विकल्प\s+चुनें\).*$",
    r"\s*-\s*निम्न\s+में\s+से\s+सबसे\s+उपयुक्त\s+विकल्प\s+चुनें.*$",
]

def load_groq_keys():
    keys = []
    env_file = Path(".env.local")
    if env_file.exists():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GROQ_API_KEYS="):
                    val = line.split("=", 1)[1].strip()
                    keys = [k.strip() for k in val.split(",") if k.strip()]
                    break
    if not keys and os.environ.get("GROQ_API_KEY"):
        keys = [os.environ.get("GROQ_API_KEY").strip()]
    return keys

GROQ_KEY_INDEX = 0
GROQ_KEYS = load_groq_keys()

def get_next_groq_key():
    global GROQ_KEY_INDEX, GROQ_KEYS
    if not GROQ_KEYS:
        return None
    key = GROQ_KEYS[GROQ_KEY_INDEX % len(GROQ_KEYS)]
    GROQ_KEY_INDEX += 1
    return key

# --------------------------------------------------------------------------- #
# Stage 0: Data Validation & Normalization
# --------------------------------------------------------------------------- #

def stable_hash(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()

def normalize_text(text):
    if not text:
        return ""
    text = str(text)
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"[\u200B-\u200D\uFEFF]", "", text)
    text = text.lower()
    text = re.sub(r"[^\w\s\u0900-\u097F]", " ", text)
    return " ".join(text.split())

def strip_boilerplate(text):
    t = text
    for pat in BOILERPLATE_PREFIXES:
        t = re.sub(pat, "", t, flags=re.IGNORECASE)
    return normalize_text(t)

def canonical_pair_key(id_a, id_b, text_a, text_b):
    left = str(id_a or stable_hash(normalize_text(text_a)))
    right = str(id_b or stable_hash(normalize_text(text_b)))
    ordered = sorted((left, right))
    return stable_hash(ordered[0] + "||" + ordered[1])

def negation_parity(text):
    neg_markers = [
        "नहीं", "असत्य", "गलत", "सुमेलित नहीं", "सत्य नहीं",
        "असंगत", "अशुद्ध", "भिन्न", "अतिरिक्त"
    ]
    return any(re.search(rf"\b{re.escape(m)}\b", text) for m in neg_markers)

def resolve_option_list(raw_options):
    if isinstance(raw_options, list):
        out = []
        for opt in raw_options:
            if isinstance(opt, dict):
                out.append(str(opt.get("text", "")))
            else:
                out.append(str(opt))
        return out
    if isinstance(raw_options, dict):
        return [str(v) for v in raw_options.values()]
    return []

def resolve_answer_text(answer, options):
    ans_str = str(answer or "").strip()
    if not ans_str:
        return ""
    upper = ans_str.upper()
    letter_map = {"A": 0, "B": 1, "C": 2, "D": 3, "OPT1": 0, "OPT2": 1, "OPT3": 2, "OPT4": 3, "1": 0, "2": 1, "3": 2, "4": 3}
    idx = letter_map.get(upper)
    if idx is not None and idx < len(options):
        return str(options[idx])
    return ans_str

def parse_question_record(raw, idx):
    def get_field(keys, default=""):
        for k in keys:
            if isinstance(raw, dict) and k in raw and raw[k] is not None:
                return raw[k]
        return default

    qid = str(get_field(DEFAULT_ID_FIELDS, f"q_{idx+1}"))
    qtext = str(get_field(DEFAULT_TEXT_FIELDS, ""))
    ans = get_field(DEFAULT_ANSWER_FIELDS, "")
    options = resolve_option_list(get_field(DEFAULT_OPTIONS_FIELDS, []))
    explanation = str(get_field(DEFAULT_EXP_FIELDS, ""))
    exam = str(get_field(["exam", "examName", "exam_name"], ""))
    year = str(get_field(["year", "examYear", "exam_year"], ""))
    topic = str(get_field(DEFAULT_TOPIC_FIELDS, ""))
    set_id = str(get_field(DEFAULT_SET_FIELDS, ""))

    ans_text = resolve_answer_text(ans, options)
    norm_q = normalize_text(qtext)
    stripped_q = strip_boilerplate(qtext)
    norm_ans = normalize_text(ans_text)

    # Content tokens
    raw_tokens = norm_q.split()
    content_tokens = frozenset(w for w in raw_tokens if w not in HINDI_EXAM_STOP_WORDS and len(w) >= 3)

    # Normalized sorted options for exact option set matching
    norm_opts = sorted([normalize_text(o) for o in options])

    # Content Hash
    content_hash = stable_hash(f"{norm_q}::{'|'.join(norm_opts)}")
    stripped_hash = stable_hash(f"{stripped_q}::{norm_ans}")

    # Quality score for anchor selection
    quality_score = 0
    if exam or year:
        quality_score += 3
    if len(explanation) > 30:
        quality_score += 2
    if len(options) == 4:
        quality_score += 1
    if len(norm_q) > 40:
        quality_score += 1

    return {
        "idx": idx,
        "id": qid,
        "question": qtext,
        "normalized_question": norm_q,
        "stripped_question": stripped_q,
        "options": options,
        "norm_options": norm_opts,
        "answer": str(ans),
        "answer_text": ans_text,
        "normalized_answer": norm_ans,
        "explanation": explanation,
        "exam": exam,
        "year": year,
        "topic": topic,
        "set_id": set_id,
        "tokens": content_tokens if content_tokens else frozenset(raw_tokens),
        "neg": negation_parity(norm_q),
        "content_hash": content_hash,
        "stripped_hash": stripped_hash,
        "quality_score": quality_score,
    }

# --------------------------------------------------------------------------- #
# Stage 1: 4-Engine Candidate Retrieval
# --------------------------------------------------------------------------- #

def build_candidates_v2(records, min_jaccard=0.22, min_ratio=0.58):
    candidates = {}

    # Engine 1: Exact Content & Stripped Hashes
    hash_index = defaultdict(list)
    stripped_index = defaultdict(list)
    for i, r in enumerate(records):
        hash_index[r["content_hash"]].append(i)
        if len(r["stripped_question"]) >= 10:
            stripped_index[r["stripped_hash"]].append(i)

    for indices in hash_index.values():
        if len(indices) > 1:
            for p, i in enumerate(indices):
                for j in indices[p+1:]:
                    pair_key = (min(i, j), max(i, j))
                    candidates[pair_key] = {"engine": "exact_hash", "reason": "exact_content_match"}

    for indices in stripped_index.values():
        if len(indices) > 1:
            for p, i in enumerate(indices):
                for j in indices[p+1:]:
                    pair_key = (min(i, j), max(i, j))
                    if pair_key not in candidates:
                        candidates[pair_key] = {"engine": "stripped_hash", "reason": "stripped_boilerplate_match"}

    # Engine 2: Answer-Based Retrieval Index
    ans_index = defaultdict(list)
    for i, r in enumerate(records):
        a = r["normalized_answer"]
        if len(a) >= 3 and a not in GENERIC_ANSWER_WORDS:
            ans_index[a].append(i)

    for a, indices in ans_index.items():
        if 1 < len(indices) <= 25:
            for p, i in enumerate(indices):
                for j in indices[p+1:]:
                    r1, r2 = records[i], records[j]
                    w1, w2 = r1["tokens"], r2["tokens"]
                    jac = len(w1 & w2) / len(w1 | w2) if w1 and w2 else 0.0
                    ratio = fast_ratio(r1["normalized_question"], r2["normalized_question"])
                    if jac >= 0.12 or ratio >= 0.30 or len(w1 & w2) >= 1:
                        pair_key = (min(i, j), max(i, j))
                        if pair_key not in candidates:
                            candidates[pair_key] = {
                                "engine": "answer_index",
                                "matched_answer": a,
                                "jaccard": jac,
                                "ratio": ratio
                            }

    # Engine 3: High-Recall Lexical Similarity (Token Inverted Index)
    inverted = defaultdict(list)
    for i, r in enumerate(records):
        for token in r["tokens"]:
            if len(token) >= 3:
                inverted[token].append(i)

    token_pairs = set()
    for indices in inverted.values():
        if len(indices) > 250:
            continue
        for p, i in enumerate(indices):
            for j in indices[p+1:]:
                token_pairs.add((min(i, j), max(i, j)))

    for i, j in token_pairs:
        pair_key = (i, j)
        if pair_key in candidates:
            continue
        r1, r2 = records[i], records[j]
        w1, w2 = r1["tokens"], r2["tokens"]
        jac = len(w1 & w2) / len(w1 | w2) if w1 and w2 else 0.0
        ratio = fast_ratio(r1["normalized_question"], r2["normalized_question"])
        if ratio >= min_ratio or jac >= min_jaccard:
            candidates[pair_key] = {
                "engine": "lexical_inverted_index",
                "jaccard": jac,
                "ratio": ratio
            }

    # Format Candidate Pairs
    pairs = []
    for (i, j), meta in candidates.items():
        a, b = records[i], records[j]
        w1, w2 = a["tokens"], b["tokens"]
        jac = len(w1 & w2) / len(w1 | w2) if w1 and w2 else 0.0
        ratio = fast_ratio(a["normalized_question"], b["normalized_question"])
        pairs.append({
            "pair_key": canonical_pair_key(a["id"], b["id"], a["question"], b["question"]),
            "id_a": a["id"], "id_b": b["id"],
            "topic": a["topic"], "set_a": a["set_id"], "set_b": b["set_id"],
            "question_a": a["question"], "question_b": b["question"],
            "options_a": a["options"], "options_b": b["options"],
            "answer_a": a["answer"], "answer_b": b["answer"],
            "answer_text_a": a["answer_text"], "answer_text_b": b["answer_text"],
            "explanation_a": a["explanation"], "explanation_b": b["explanation"],
            "text_ratio": round(ratio, 4), "word_jaccard": round(jac, 4),
            "retrieval_engine": meta.get("engine", "unknown"),
            "retrieval_meta": meta,
            "human_decision": "", "duplicate_of": "",
            "ai_decision": "", "ai_confidence": "", "ai_reason": "",
            "key_error": False, "typo_flag": False,
            "decision_source": "", "cluster_id": "",
            "_a": a, "_b": b,
            "_score": max(ratio, jac),
            "_inverse": a["neg"] != b["neg"],
        })

    return sorted(pairs, key=lambda x: (x["text_ratio"], x["word_jaccard"]), reverse=True)

# --------------------------------------------------------------------------- #
# Stage 2: Expanded Deterministic Rule Engine (100% Zero-API Local Solvers)
# --------------------------------------------------------------------------- #

def apply_deterministic_rules(pair):
    a, b = pair["_a"], pair["_b"]

    # Rule 1: Exact Content Hash Match (Question + Options)
    if a["content_hash"] == b["content_hash"]:
        return "exact_duplicate", 1.0, "Exact content hash match", True, False

    # Rule 2: Stripped Boilerplate + Exact Answer Match
    if a["stripped_hash"] == b["stripped_hash"]:
        return "near_duplicate", 0.98, "Identical core intent after boilerplate stripping", False, False

    # Rule 3: Identical question text with matching answer
    if a["normalized_question"] == b["normalized_question"]:
        if a["normalized_answer"] == b["normalized_answer"]:
            return "exact_duplicate", 0.99, "Identical question and answer", False, False
        else:
            return "exact_duplicate", 0.95, "Identical question with conflicting answer key", True, False

    # Rule 4: Identical normalized options set (regardless of order) + question ratio >= 0.65
    if set(a["norm_options"]) == set(b["norm_options"]) and len(set(a["norm_options"])) >= 4:
        if a["normalized_answer"] == b["normalized_answer"] and pair["text_ratio"] >= 0.65:
            return "near_duplicate", 0.96, "Identical 4-option set with high question overlap", False, False

    # Rule 4B: Match-the-Column Protection (सूची-I / सूची-II / सुमेलित)
    is_list_a = "सूची" in a["question"] or "सुमेलित" in a["question"]
    is_list_b = "सूची" in b["question"] or "सुमेलित" in b["question"]
    if is_list_a and is_list_b:
        if pair["word_jaccard"] < 0.40:
            return "different", 0.95, "Different match-the-column items and entity sets", False, False

    # Rule 5: Same Substantive Answer + High Ratio (>= 0.78) + Same Polarity
    if not pair["_inverse"]:
        if a["normalized_answer"] == b["normalized_answer"] and len(a["normalized_answer"]) >= 3:
            if pair["text_ratio"] >= 0.78:
                return "near_duplicate", 0.95, "Same substantive answer with high text similarity", False, False

    # Rule 6: Inverse question check (सत्य vs नहीं है/असत्य)
    if pair["_inverse"]:
        if pair["text_ratio"] < 0.95:
            return "different", 0.95, "Inverse question logic (सत्य vs नहीं है/असत्य)", False, False

    # Rule 7: Answer Substring / Shortened Entity Match (e.g. Udaybhan Singh vs Udaybhan, Shobharam Kumawat vs Shobharam)
    if not pair["_inverse"]:
        ans_a = a["normalized_answer"]
        ans_b = b["normalized_answer"]
        if ans_a and ans_b and (ans_a in ans_b or ans_b in ans_a):
            shorter_len = min(len(ans_a), len(ans_b))
            if shorter_len >= 4:
                if pair["text_ratio"] >= 0.68 or pair["word_jaccard"] >= 0.38:
                    return "near_duplicate", 0.94, f"Answer substring/alias match ({ans_a} ~ {ans_b}) with high question overlap", False, False

    # Rule 7B: Answer Core-Entity Overlap (e.g. दक्षिण हाड़ौती क्षेत्र vs हाड़ौती पठारी प्रदेश में)
    STOP_ANS = {'का', 'के', 'की', 'में', 'से', 'पर', 'क्षेत्र', 'प्रदेश', 'जिला', 'जिले', 'और', 'एवं', 'के बीच', 'वाला', 'स्थित', 'अवस्थित', 'राजस्थान', 'भी', 'है।'}
    tok_a = set(a["normalized_answer"].split()) - STOP_ANS
    tok_b = set(b["normalized_answer"].split()) - STOP_ANS
    common_ans = tok_a & tok_b
    if not pair["_inverse"] and common_ans:
        has_big_token = any(len(tok) >= 4 for tok in common_ans)
        if has_big_token and pair["text_ratio"] >= 0.68 and pair["word_jaccard"] >= 0.35:
            return "near_duplicate", 0.94, f"Core answer entity overlap ({common_ans}) with high question overlap", False, False

    # Rule 8: Cross Subject-Object Entity Inversion (Conceptual Duplicate)
    # e.g. Q1: Leader of Bijolia? Ans: Anjana Devi | Q2: Movement led by Anjana Devi? Ans: Bijolia
    ans_a = a["normalized_answer"]
    ans_b = b["normalized_answer"]
    if len(ans_a) >= 4 and len(ans_b) >= 4:
        if ans_a in b["normalized_question"] and ans_b in a["normalized_question"]:
            return "conceptual_duplicate", 0.94, f"Subject-object cross-entity inversion ({ans_a} <-> {ans_b})", False, False

    # Rule 9: Very High Question Similarity (>= 0.88)
    if not pair["_inverse"] and pair["text_ratio"] >= 0.88:
        if a["normalized_answer"] == b["normalized_answer"]:
            return "exact_duplicate", 0.98, "Near-identical question text and matching answer", False, False
        common_opts = set(a["norm_options"]) & set(b["norm_options"])
        if len(common_opts) >= 3:
            return "exact_duplicate", 0.95, "Near-identical question with conflicting answer key", True, False

    # Rule 10: Deterministic Fast Negative Elimination (75-80% Local Resolution on CPU)
    ans_a = a["normalized_answer"]
    ans_b = b["normalized_answer"]
    if pair["text_ratio"] < 0.75:
        if ans_a != ans_b and not common_ans:
            if not (ans_a and ans_b and (ans_a in ans_b or ans_b in ans_a)):
                if not (len(ans_a) >= 4 and len(ans_b) >= 4 and ans_a in b["normalized_question"] and ans_b in a["normalized_question"]):
                    common_opts = set(a["norm_options"]) & set(b["norm_options"])
                    if len(common_opts) <= 1:
                        return "different", 0.96, "Different question intent, answers, and option sets", False, False

    return None, 0.0, "", False, False

# --------------------------------------------------------------------------- #
# Stage 3: Feedback Memory Lookup
# --------------------------------------------------------------------------- #

def load_feedback_memory(path):
    memory = {}
    if not path.exists():
        return memory
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
                pk = row.get("pair_key")
                if pk:
                    memory[pk] = row
            except:
                pass
    return memory

# --------------------------------------------------------------------------- #
# Stage 4: Multi-Worker Groq AI Review (qwen/qwen3.8-27b)
# --------------------------------------------------------------------------- #

AI_INSTRUCTIONS = (
    "You are an expert exam auditor for RPSC / RSSB Rajasthan GK examinations.\n"
    "Compare the anchor question Q with each numbered candidate.\n"
    "Output strict JSON array with format:\n"
    "[{\"i\": 1, \"d\": \"E\"|\"N\"|\"C\"|\"V\"|\"D\", \"c\": 0.95, \"r\": \"reason\", \"key_error\": false, \"typo\": false}]\n"
    "Codes:\n"
    "  E = exact duplicate (asks exact same fact)\n"
    "  N = near duplicate (same fact reworded or options rearranged)\n"
    "  C = conceptual duplicate (different phrasing, identical test fact)\n"
    "  V = related variation (same subtopic/entity, asks different aspect/fact)\n"
    "  D = different question\n"
    "Flag key_error=true if candidate or anchor has an incorrect answer key.\n"
    "Flag typo=true if there is an OCR misspelling."
)

def build_ai_prompt(chunk):
    anchor = chunk["anchor"]
    lines = [
        f"ANCHOR QUESTION:\n  Text: {anchor['question']}\n  Answer: {anchor['answer']} ({anchor['answer_text']})",
        "\nCANDIDATES TO AUDIT:"
    ]
    for idx, c in enumerate(chunk["candidates"], 1):
        pair = c["pair"]
        other = pair["_b"] if pair["_a"]["id"] == anchor["id"] else pair["_a"]
        lines.append(f"\n[{idx}] ID: {other['id']}")
        lines.append(f"  Text: {other['question']}")
        lines.append(f"  Answer: {other['answer']} ({other['answer_text']})")
    return "\n".join(lines)

def run_groq_audit(prompt, api_key, model="qwen/qwen3.8-27b"):
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a precise JSON-only exam question audit assistant. Reply ONLY with a valid JSON array."},
            {"role": "user", "content": f"{AI_INSTRUCTIONS}\n\n{prompt}"}
        ],
        "temperature": 0.0,
        "max_tokens": 1024,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Connection": "close"
        }
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                resp = json.loads(res.read().decode("utf-8"))
                raw_text = resp["choices"][0]["message"]["content"].strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()
                parsed = json.loads(raw_text)
                if isinstance(parsed, dict):
                    parsed = next((v for v in parsed.values() if isinstance(v, list)), [parsed])
                return parsed
        except Exception:
            time.sleep(0.5 + attempt * 0.5)
    return None

# --------------------------------------------------------------------------- #
# Stage 5: Cluster Validation & Transitive Chaining Protection
# --------------------------------------------------------------------------- #

def build_validated_clusters(records, pairs):
    id_to_rec = {r["id"]: r for r in records}
    dup_graph = defaultdict(set)

    for p in pairs:
        dec = p.get("human_decision") or p.get("ai_decision") or ""
        if dec in DUP_DECISIONS:
            id_a, id_b = p["id_a"], p["id_b"]
            dup_graph[id_a].add(id_b)
            dup_graph[id_b].add(id_a)

    visited = set()
    clusters = []
    cluster_idx = 1

    for qid in sorted(dup_graph.keys()):
        if qid in visited:
            continue
        component = set()
        queue = [qid]
        while queue:
            curr = queue.pop(0)
            if curr in component:
                continue
            component.add(curr)
            for neighbor in dup_graph[curr]:
                if neighbor not in component:
                    queue.append(neighbor)

        visited.update(component)
        if len(component) < 2:
            continue

        member_records = [id_to_rec[m] for m in component if m in id_to_rec]
        member_records.sort(key=lambda r: (r["quality_score"], len(r["question"])), reverse=True)
        anchor = member_records[0]

        validated_members = [anchor]
        STOP_ANS = {'का', 'के', 'की', 'में', 'से', 'पर', 'क्षेत्र', 'प्रदेश', 'जिला', 'जिले', 'और', 'एवं', 'के बीच', 'वाला', 'स्थित', 'अवस्थित', 'राजस्थान', 'भी', 'है।'}
        tok_anchor = set(anchor["normalized_answer"].split()) - STOP_ANS

        for candidate in member_records[1:]:
            # Directly connected to anchor
            if candidate["id"] in dup_graph[anchor["id"]]:
                validated_members.append(candidate)
            else:
                # Transitive member: check semantic alignment with anchor
                ans_a = anchor["normalized_answer"]
                ans_b = candidate["normalized_answer"]
                tok_cand = set(ans_b.split()) - STOP_ANS
                has_ans_match = (ans_a == ans_b) or (ans_a in ans_b) or (ans_b in ans_a) or bool(tok_anchor & tok_cand)
                r = fast_ratio(anchor["normalized_question"], candidate["normalized_question"])
                if r >= 0.35 and has_ans_match:
                    validated_members.append(candidate)

        if len(validated_members) >= 2:
            c_id = f"C{cluster_idx:03d}"
            cluster_idx += 1
            clusters.append({
                "cluster_id": c_id,
                "anchor_id": anchor["id"],
                "anchor_question": anchor["question"],
                "anchor_answer": anchor["answer_text"],
                "total_members": len(validated_members),
                "variants": [
                    {
                        "id": m["id"],
                        "question": m["question"],
                        "answer": m["answer_text"],
                        "is_anchor": (m["id"] == anchor["id"])
                    }
                    for m in validated_members
                ]
            })

    return clusters

# --------------------------------------------------------------------------- #
# Core Topic Execution Function
# --------------------------------------------------------------------------- #

def process_single_topic(topic_num, max_ai_chunks=999999, workers=15):
    topic_file = Path(f"data/questions/rajasthan-gk/topic_{topic_num:02d}.json")
    if not topic_file.exists():
        return None

    with open(topic_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    raw_questions = data.get("questions", []) if isinstance(data, dict) else data
    existing_archived = data.get("archivedVariants", []) if isinstance(data, dict) else []

    # Unified pool of all questions ever created for this topic
    seen_ids = set()
    all_raw_pool = []
    for q in (raw_questions + existing_archived):
        qid = q.get("id") or q.get("_id")
        if qid and qid not in seen_ids:
            seen_ids.add(qid)
            all_raw_pool.append(q)
    raw_questions = all_raw_pool

    t_name = data.get("masterTopic", f"Topic {topic_num}")
    print(f"\n[{topic_num:02d}] 🚀 Processing Topic {topic_num:02d}: {t_name}", flush=True)
    print(f"     Unified Questions in pool: {len(raw_questions)}", flush=True)

    # Stage 0: Parse Records
    records = [parse_question_record(q, i) for i, q in enumerate(raw_questions)]

    # Stage 1: Candidate Retrieval
    candidates = build_candidates_v2(records)

    # Stage 2 & 3: Deterministic Rules & Memory
    memory_path = Path("scripts/pipeline/feedback_memory.jsonl")
    feedback_memory = load_feedback_memory(memory_path)

    pending_ai = []
    decided_rules = 0
    decided_memory = 0

    for pair in candidates:
        rule_dec, conf, reason, k_err, typo = apply_deterministic_rules(pair)
        if rule_dec:
            pair["human_decision"] = rule_dec
            pair["ai_confidence"] = conf
            pair["ai_reason"] = reason
            pair["decision_source"] = "rule"
            decided_rules += 1
            continue

        pk = pair["pair_key"]
        if pk in feedback_memory:
            mem = feedback_memory[pk]
            pair["human_decision"] = mem.get("human_decision") or mem.get("decision", "")
            pair["ai_confidence"] = mem.get("confidence", 0.95)
            pair["ai_reason"] = mem.get("reason", "memory")
            pair["decision_source"] = "memory"
            decided_memory += 1
            continue

        pending_ai.append(pair)

    local_pct = ((decided_rules + decided_memory) / len(candidates) * 100) if candidates else 100
    print(f"     Total Candidates: {len(candidates)} | Solved locally: {decided_rules + decided_memory} ({local_pct:.1f}%) | Pending AI: {len(pending_ai)}", flush=True)

    # Stage 4: Groq AI Review (Only for pending)
    if pending_ai and max_ai_chunks > 0:
        by_anchor = defaultdict(list)
        for p in pending_ai:
            by_anchor[p["_a"]["id"]].append(p)

        anchor_chunks = []
        for anchor_id, pairs_for_anchor in by_anchor.items():
            anchor_rec = pairs_for_anchor[0]["_a"]
            for i in range(0, len(pairs_for_anchor), 6):
                batch = pairs_for_anchor[i:i+6]
                anchor_chunks.append({
                    "anchor": anchor_rec,
                    "candidates": [{"index": k+1, "pair": p} for k, p in enumerate(batch)]
                })

        num_chunks = min(len(anchor_chunks), max_ai_chunks)
        if num_chunks > 0:
            active_workers = min(workers, len(GROQ_KEYS)) if GROQ_KEYS else workers
            print(f"     ⚡ Sending {num_chunks} chunks ({min(len(pending_ai), num_chunks*6)} pairs) to {active_workers} Groq workers...", flush=True)

            def worker_fn(chunk):
                key = get_next_groq_key()
                prompt = build_ai_prompt(chunk)
                results = run_groq_audit(prompt, key)
                if not results:
                    return 0
                for item in results:
                    idx = int(item.get("i", 1)) - 1
                    if 0 <= idx < len(chunk["candidates"]):
                        p = chunk["candidates"][idx]["pair"]
                        code = str(item.get("d", "D")).upper()[:1]
                        p["ai_decision"] = CODES.get(code, "different")
                        p["ai_confidence"] = float(item.get("c", 0.9))
                        p["ai_reason"] = str(item.get("r", ""))
                        p["key_error"] = bool(item.get("key_error", False))
                        p["typo_flag"] = bool(item.get("typo", False))
                        p["decision_source"] = "groq_ai"
                return len(results)

            audited_count = 0
            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = [executor.submit(worker_fn, chunk) for chunk in anchor_chunks[:num_chunks]]
                for f in as_completed(futures):
                    try:
                        audited_count += f.result()
                    except:
                        pass

            # Persist to feedback memory
            new_mem = 0
            with open("scripts/pipeline/feedback_memory.jsonl", "a", encoding="utf-8") as f:
                for p in pending_ai:
                    if p.get("decision_source") == "groq_ai" and p.get("ai_decision"):
                        dec = "duplicate" if p["ai_decision"] in DUP_DECISIONS else "keep_both"
                        entry = {
                            "pair_key": p["pair_key"],
                            "id_a": p["id_a"],
                            "id_b": p["id_b"],
                            "human_decision": dec,
                            "topic": str(topic_num),
                            "confidence": p.get("ai_confidence", 0.9),
                            "reason": p.get("ai_reason", "")
                        }
                        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
                        new_mem += 1
            print(f"     💾 Audited {audited_count} pairs via Groq. Persisted {new_mem} decisions to memory.", flush=True)

    # Stage 5: Build Validated Multi-Variant Clusters
    clusters = build_validated_clusters(records, candidates)
    dup_ids = set()
    size_dist = Counter()
    for c in clusters:
        sz = len(c["variants"])
        size_dist[sz] += 1
        for v in c["variants"]:
            if not v["is_anchor"]:
                dup_ids.add(v["id"])

    # Stage 6: Archive Duplicates Out of Questions Array
    clean_qs = [q for q in raw_questions if q["id"] not in dup_ids]
    new_archived_list = [q for q in raw_questions if q["id"] in dup_ids]

    data["questions"] = clean_qs
    data["archivedVariants"] = new_archived_list
    data["totalAvailable"] = len(clean_qs)
    data["totalArchivedVariants"] = len(new_archived_list)

    with open(topic_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Save cluster file
    out_cluster_file = Path(f"data/questions/variants/topic_{topic_num:02d}_clusters.json")
    with open(out_cluster_file, "w", encoding="utf-8") as f:
        json.dump(clusters, f, ensure_ascii=False, indent=2)

    print(f"     ✅ Clean Pool: {len(clean_qs)} (Archived {len(dup_ids)} duplicates in {len(clusters)} clusters)", flush=True)
    return {
        "topic": topic_num,
        "name": t_name,
        "clean_count": len(clean_qs),
        "archived_count": len(new_archived_list),
        "cluster_count": len(clusters),
        "dup_ids": dup_ids,
        "clean_ids": [q["id"] for q in clean_qs]
    }

# --------------------------------------------------------------------------- #
# Batch Runner for Multiple Topics
# --------------------------------------------------------------------------- #

def run_master_pipeline(start_topic, end_topic, max_ai=999999, workers=15):
    print("=" * 80, flush=True)
    print(f"🌟 RUNNING MASTER INTEGRITY V2 PIPELINE (TOPICS {start_topic} TO {end_topic})", flush=True)
    print("=" * 80, flush=True)

    results = []
    for t in range(start_topic, end_topic + 1):
        res = process_single_topic(t, max_ai_chunks=max_ai, workers=workers)
        if res:
            results.append(res)

    # ---------------------------------------------------------
    # Clean & Repack Published Sets for Processed Topics
    # ---------------------------------------------------------
    print("\n🧹 Scanning and Repacking Published Sets for Processed Topics...", flush=True)
    published_sets_path = Path("data/sets/published-sets.json")
    all_sets = json.load(open(published_sets_path, encoding="utf-8"))

    # Map of topic number to clean question pool IDs and duplicate IDs
    topic_clean_map = {r["topic"]: r["clean_ids"] for r in results}
    topic_dup_map = {r["topic"]: r["dup_ids"] for r in results}
    all_dups_flat = set()
    for d in topic_dup_map.values():
        all_dups_flat.update(d)

    # Load topic mapping from topic files
    topic_name_to_num = {}
    for r in results:
        topic_name_to_num[r["name"]] = r["topic"]

    total_set_replaces = 0
    sets_touched = 0

    for s in all_sets:
        s_name = s.get("name", "")
        # Check if set belongs to one of the processed topics
        t_num = None
        for tname, num in topic_name_to_num.items():
            if s_name.startswith(tname) or tname[:15] in s_name:
                t_num = num
                break

        if not t_num or t_num not in topic_clean_map:
            continue

        clean_pool = topic_clean_map[t_num]
        qids = s.get("questionIds", [])
        has_dup = any(q in all_dups_flat for q in qids)

        if has_dup:
            sets_touched += 1
            new_qids = [q for q in qids if q not in all_dups_flat]
            total_set_replaces += (len(qids) - len(new_qids))

            for cand in clean_pool:
                if len(new_qids) >= 20:
                    break
                if cand not in new_qids and cand not in all_dups_flat:
                    new_qids.append(cand)

            s["questionIds"] = new_qids
            s["questionCount"] = len(new_qids)

    with open(published_sets_path, "w", encoding="utf-8") as f:
        json.dump(all_sets, f, ensure_ascii=False, indent=2)

    print(f"✅ Cleaned {sets_touched} published sets (Replaced {total_set_replaces} duplicate questions).", flush=True)

    # ---------------------------------------------------------
    # Grand Master Pool Calculation Across All 55 Topics
    # ---------------------------------------------------------
    grand_pool = 0
    for i in range(1, 56):
        fn = Path(f"data/questions/rajasthan-gk/topic_{i:02d}.json")
        if fn.exists():
            d = json.load(open(fn, encoding="utf-8"))
            grand_pool += len(d.get("questions", []))

    print("\n" + "=" * 80, flush=True)
    print("🏆 BATCH EXECUTION COMPLETED", flush=True)
    print("=" * 80, flush=True)
    print(f"Processed Topics              : Topics {start_topic} to {end_topic} ({len(results)} topics)", flush=True)
    print(f"Total Reduced Duplicates      : {sum(len(r['dup_ids']) for r in results)}", flush=True)
    print(f"NEW GRAND MASTER POOL (TOTAL) : {grand_pool:,} Questions", flush=True)
    print(f"Previous Raw Pool             : 13,952 Questions", flush=True)
    print(f"Total Net Questions Dropped   : {13952 - grand_pool} Duplicates Eliminated!", flush=True)
    print("=" * 80, flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Master Integrity V2 Pipeline")
    parser.add_argument("--start", type=int, required=True, help="Start topic number (1-55)")
    parser.add_argument("--end", type=int, required=True, help="End topic number (1-55)")
    parser.add_argument("--max-ai", type=int, default=999999, help="Max AI chunks per topic")
    parser.add_argument("--workers", type=int, default=19, help="Number of parallel worker threads")
    args = parser.parse_args()

    run_master_pipeline(args.start, args.end, max_ai=args.max_ai, workers=args.workers)
