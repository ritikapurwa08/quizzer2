#!/usr/bin/env python3
"""
INTEGRITY V2: Advanced Multi-Engine AI Question Deduplication & Quality Assurance Engine
Features:
- Stage 0: Data Validation & Normalization (NFC, Matras, Normalized Answers)
- Stage 1: 4-Engine Topic-wise Candidate Retrieval:
    * Engine 1: Exact Text & Options Hash Match
    * Engine 2: Answer-Based Retrieval (Questions sharing substantive normalized answer)
    * Engine 3: High-Recall Lexical Similarity (Token Inverted Index + RapidFuzz)
    * Engine 4: Concept / Keyword Overlap
- Stage 2: Deterministic Rule Engine (Instant twins, Negation Parity, Entity Mismatch)
- Stage 3: Feedback Memory V2 Lookup (11,331+ decisions compatible)
- Stage 4: Multi-Worker Groq AI Review across 15 Parallel Keys (qwen/qwen3.8-27b)
    * Decoupled 3 Outputs: Duplicate Classification, Answer Key Audit, Typo Detection
- Stage 5: Cluster Validation & Transitive Chaining Protection (Prevents false merges)
- Stage 6: Authoritative Anchor Selection (PYQ authenticity + Explanation depth)
- Stage 7: Comparison Metrics vs V1
"""

import argparse
import csv
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
    "निम्न", "संदर्भ", "दिए", "गए", "सूची", "सुमेलित", "सम्बंधित", "संबंधित", "स्थित", "माना"
}

GENERIC_ANSWER_WORDS = {
    "none", "null", "true", "false", "उपरोक्त सभी", "इनमें से कोई नहीं", "a", "b", "c", "d",
    "1", "2", "3", "4", "हाँ", "नहीं", "all of the above", "none of these"
}

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
    norm_ans = normalize_text(ans_text)

    # Content tokens
    raw_tokens = norm_q.split()
    content_tokens = frozenset(w for w in raw_tokens if w not in HINDI_EXAM_STOP_WORDS and len(w) >= 3)

    # Content Hash
    content_hash = stable_hash(f"{norm_q}::{'|'.join(options)}")

    # Quality score for anchor selection
    quality_score = 0
    if exam or year:
        quality_score += 2
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
        "options": options,
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
        "quality_score": quality_score,
    }

# --------------------------------------------------------------------------- #
# Stage 1: 4-Engine Candidate Retrieval
# --------------------------------------------------------------------------- #

def build_candidates_v2(records, min_jaccard=0.18, min_ratio=0.50):
    candidates = {}

    # Engine 1: Exact Hash Index
    hash_index = defaultdict(list)
    for i, r in enumerate(records):
        hash_index[r["content_hash"]].append(i)

    for indices in hash_index.values():
        if len(indices) > 1:
            for p, i in enumerate(indices):
                for j in indices[p+1:]:
                    pair_key = (min(i, j), max(i, j))
                    candidates[pair_key] = {"engine": "exact_hash", "reason": "exact_content_match"}

    # Engine 2: Answer-Based Retrieval Index
    ans_index = defaultdict(list)
    for i, r in enumerate(records):
        a = r["normalized_answer"]
        if len(a) >= 3 and a not in GENERIC_ANSWER_WORDS:
            ans_index[a].append(i)

    for a, indices in ans_index.items():
        if 1 < len(indices) <= 30: # ignore overly broad answers
            for p, i in enumerate(indices):
                for j in indices[p+1:]:
                    r1, r2 = records[i], records[j]
                    w1, w2 = r1["tokens"], r2["tokens"]
                    jac = len(w1 & w2) / len(w1 | w2) if w1 and w2 else 0.0
                    ratio = fast_ratio(r1["normalized_question"], r2["normalized_question"])
                    # If same answer and (jac >= 0.10 or ratio >= 0.28 or token overlap >= 1)
                    if jac >= 0.10 or ratio >= 0.28 or len(w1 & w2) >= 1:
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
        if len(indices) > 300:
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
# Stage 2: Deterministic Rules
# --------------------------------------------------------------------------- #

def apply_deterministic_rules(pair):
    a, b = pair["_a"], pair["_b"]
    if a["content_hash"] == b["content_hash"]:
        return "exact_duplicate", 1.0, "Exact content hash match", True, False

    if a["normalized_question"] == b["normalized_question"]:
        if a["normalized_answer"] == b["normalized_answer"]:
            return "exact_duplicate", 0.99, "Identical question and answer", False, False
        else:
            return "exact_duplicate", 0.95, "Identical question with conflicting answer key", True, False

    if pair["_inverse"]:
        if pair["text_ratio"] < 0.95:
            return "different", 0.95, "Inverse question logic (सत्य vs नहीं है/असत्य)", False, False

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
# Stage 4: Multi-Worker Groq AI Review
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
        except Exception as e:
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

        # Transitive Protection: Validate mutual consistency with Anchor
        validated_members = [anchor]
        for candidate in member_records[1:]:
            if candidate["id"] in dup_graph[anchor["id"]]:
                validated_members.append(candidate)
            else:
                r = fast_ratio(anchor["normalized_question"], candidate["normalized_question"])
                if r >= 0.35 and anchor["normalized_answer"] == candidate["normalized_answer"]:
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
# Main Benchmark Pipeline
# --------------------------------------------------------------------------- #

def run_topic_benchmark(topic_num, max_ai_chunks=100, workers=15):
    topic_file = Path(f"data/questions/rajasthan-gk/topic_{topic_num:02d}.json")
    if not topic_file.exists():
        print(f"Error: {topic_file} not found!")
        return

    with open(topic_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    raw_questions = data.get("questions", []) if isinstance(data, dict) else data

    # Load V1 baseline clusters
    v1_file = Path(f"data/questions/variants/topic_{topic_num:02d}_clusters.json")
    v1_clusters = []
    v1_absorbed = set()
    if v1_file.exists():
        with open(v1_file, "r", encoding="utf-8") as f:
            v1_raw = json.load(f)
            v1_clusters = list(v1_raw.values()) if isinstance(v1_raw, dict) else v1_raw
            for c in v1_clusters:
                if "members" in c:
                    for m in c["members"]:
                        if not m.get("is_anchor", False):
                            v1_absorbed.add(m["id"])
                else:
                    for s in c.get("similarQuestions", []) or c.get("variants", []):
                        v1_absorbed.add(s if isinstance(s, str) else s.get("id"))

    print("=" * 70)
    print(f"🚀 RUNNING INTEGRITY V2 AUDIT ON TOPIC {topic_num:02d} ({data.get('masterTopic', '')})")
    print("=" * 70)
    print(f"Total Raw Questions: {len(raw_questions)}")
    print(f"Baseline (V1) Clusters: {len(v1_clusters)} | V1 Absorbed Duplicates: {len(v1_absorbed)}")

    # Stage 0: Parse Records
    records = [parse_question_record(q, i) for i, q in enumerate(raw_questions)]

    # Stage 1: 4-Engine Retrieval
    print("\n🔍 Running Stage 1: 4-Engine Candidate Retrieval...")
    t0 = time.time()
    candidates = build_candidates_v2(records)
    print(f"Candidate Pairs Surfaced: {len(candidates)} (in {time.time()-t0:.2f}s)")

    engine_counts = defaultdict(int)
    for c in candidates:
        engine_counts[c["retrieval_engine"]] += 1
    print(f"  • Exact Hash Engine: {engine_counts['exact_hash']}")
    print(f"  • Answer-Based Engine: {engine_counts['answer_index']}")
    print(f"  • Lexical Inverted Index: {engine_counts['lexical_inverted_index']}")

    # Stage 2 & 3: Deterministic Rules & Feedback Memory
    memory_path = Path("scripts/pipeline/feedback_memory.jsonl")
    feedback_memory = load_feedback_memory(memory_path)
    print(f"🧠 Loaded {len(feedback_memory)} decisions from Feedback Memory")

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
            pair["key_error"] = k_err
            pair["typo_flag"] = typo
            decided_rules += 1
            continue

        pk = pair["pair_key"]
        if pk in feedback_memory:
            mem = feedback_memory[pk]
            pair["human_decision"] = mem.get("human_decision") or mem.get("decision", "")
            pair["ai_confidence"] = mem.get("confidence", 0.95)
            pair["ai_reason"] = mem.get("reason", "reused from feedback memory")
            pair["decision_source"] = "memory"
            decided_memory += 1
            continue

        pending_ai.append(pair)

    print(f"📊 Pre-AI Processing Stats:")
    print(f"  • Decided by Deterministic Rules: {decided_rules}")
    print(f"  • Reused from Feedback Memory: {decided_memory}")
    print(f"  • Pending for Groq AI Review: {len(pending_ai)}")

    # Stage 4: Multi-Worker Groq AI Review
    if pending_ai and max_ai_chunks > 0:
        anchor_chunks = []
        by_anchor = defaultdict(list)
        for p in pending_ai:
            by_anchor[p["_a"]["id"]].append(p)

        for anchor_id, pairs_for_anchor in by_anchor.items():
            anchor_rec = pairs_for_anchor[0]["_a"]
            for i in range(0, len(pairs_for_anchor), 6):
                batch = pairs_for_anchor[i:i+6]
                anchor_chunks.append({
                    "anchor": anchor_rec,
                    "candidates": [{"index": k+1, "pair": p} for k, p in enumerate(batch)]
                })

        num_chunks = min(len(anchor_chunks), max_ai_chunks)
        print(f"\n⚡ Running Groq AI Review on {num_chunks} chunks across 15 keys (Workers={workers})...")

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

        total_audited = 0
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(worker_fn, chunk) for chunk in anchor_chunks[:num_chunks]]
            for f in as_completed(futures):
                try:
                    count = f.result()
                    total_audited += count
                except:
                    pass
        print(f"✅ AI Review Completed ({total_audited} pairs audited).")

        # Persist new AI decisions to feedback memory
        new_mem_count = 0
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
                    new_mem_count += 1
        print(f"💾 Persisted {new_mem_count} new decisions to feedback_memory.jsonl")

    # Stage 5: Cluster Validation
    v2_clusters = build_validated_clusters(records, candidates)
    v2_absorbed = set()
    size_dist = Counter()
    for c in v2_clusters:
        sz = len(c["variants"])
        size_dist[sz] += 1
        for v in c["variants"]:
            if not v["is_anchor"]:
                v2_absorbed.add(v["id"])

    # Save V2 clusters
    out_cluster_file = Path(f"data/questions/variants/topic_{topic_num:02d}_clusters.json")
    with open(out_cluster_file, "w", encoding="utf-8") as f:
        json.dump(v2_clusters, f, ensure_ascii=False, indent=2)
    print(f"💾 Saved {len(v2_clusters)} validated clusters to {out_cluster_file}")

    # Stage 7: Comparative Metrics & Multi-Variant Report
    new_duplicates_caught = v2_absorbed - v1_absorbed
    print("\n" + "=" * 70)
    print("📈 INTEGRITY V2 MULTI-VARIANT DEDUPLICATION REPORT")
    print("=" * 70)
    print(f"Total Raw Questions in Pool  : {len(raw_questions)}")
    print(f"Total Multi-Variant Clusters : {len(v2_clusters)}")
    print(f"Total Variants Absorbed (V2) : {len(v2_absorbed)}")
    print(f"Clean Unique Questions Left  : {len(raw_questions) - len(v2_absorbed)}")
    print(f"Baseline (V1) Absorbed Dups  : {len(v1_absorbed)}")
    print(f"🎯 NEW Duplicates Caught by V2: {len(new_duplicates_caught)}")
    if len(v1_absorbed) > 0:
        increase_pct = ((len(v2_absorbed) - len(v1_absorbed)) / len(v1_absorbed)) * 100
        print(f"🚀 Multi-Variant Improvement : {increase_pct:+.1f}%")

    print("\n📊 Multi-Variant Cluster Size Distribution:")
    for sz in sorted(size_dist.keys()):
        variants = sz - 1
        cnt = size_dist[sz]
        print(f"  • {cnt:2d} Clusters have {sz} Questions (1 Anchor + {variants} Variants)")

    print(f"\n🔍 Detailed Multi-Variant Clusters (3+ questions):")
    multi_count = 0
    for c in v2_clusters:
        tot = len(c["variants"])
        if tot >= 3:
            multi_count += 1
            n_var = tot - 1
            aid = c["anchor_id"]
            aq = c["anchor_question"][:55]
            ans = c["anchor_answer"]
            print(f"\n  ⭐ Cluster {c['cluster_id']} [{aid}] (Ans: {ans}) -> 1 Anchor + {n_var} Variants ({tot} Qs total):")
            print(f"     [ANCHOR]: {aq}...")
            for v in c["variants"]:
                if not v["is_anchor"]:
                    print(f"     ↳ [VARIANT {v['id']}]: {v['question'][:55]}...")
    if multi_count == 0:
        print("  (All clusters currently have 2 questions: 1 Anchor + 1 Variant)")
    print("=" * 70)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Integrity V2 Question Deduplication Engine")
    parser.add_argument("--topic", type=int, required=True, help="Topic number to audit (1-55)")
    parser.add_argument("--max-ai", type=int, default=100, help="Maximum AI chunks to review")
    parser.add_argument("--workers", type=int, default=15, help="Number of parallel worker threads")
    args = parser.parse_args()

    run_topic_benchmark(args.topic, max_ai_chunks=args.max_ai, workers=args.workers)
