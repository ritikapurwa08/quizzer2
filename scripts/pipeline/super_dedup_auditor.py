#!/usr/bin/env python3
"""
AI-assisted question deduplication and answer verification engine.
Features:
- Devanagari NFC Normalization & matra preservation
- Negation Parity (Inverse Question detection)
- Token Inverted Index + Length-bounded candidate generator
- Multi-Key Groq API pool (Rotating round-robin across all keys)
- Dual Auditor: Detects duplicate pairs AND flags answer-key / OCR contradictions
- Union-Find Multi-Way Clustering (One main question -> multiple variants)
- Dry-run mode + Set Re-packer integration
"""

import argparse
import csv
import hashlib
import json
import os
import re
import time
import unicodedata
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
from pathlib import Path

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
DUP_DECISIONS = {"exact_duplicate", "near_duplicate", "conceptual_duplicate"}

MAX_Q_CHARS = 500
MAX_ANS_CHARS = 120
MAX_OPT_CHARS = 80

AI_INSTRUCTIONS = (
    "You are an expert exam auditor for RPSC/RSSB Rajasthan GK.\n"
    "Compare the anchor question Q with each numbered candidate.\n"
    "Codes for duplicates:\n"
    "  E = exact duplicate (asks the exact same fact)\n"
    "  N = near duplicate (same fact reworded or options rearranged)\n"
    "  C = conceptual duplicate (same core knowledge point and same target answer)\n"
    "  V = related variation (different fact, different year/scope, or inverse question)\n"
    "  D = completely different question\n"
    "  U = unsure\n"
    "CRITICAL RULES:\n"
    "- If two questions share a generic template (e.g. 'युग्म सुमेलित नहीं है?') but test DIFFERENT entities, sanctuaries, places, persons, or facts, they are DIFFERENT (code D)!\n"
    "- Different answers, dates, numbers, or targets mean NOT a duplicate (code D or V).\n"
    "AUDIT CHECKS:\n"
    "- If a question explanation directly contradicts the marked answer key, set 'key_error': true\n"
    "- If options have obvious OCR typos (e.g. 'भीलवाड़ा' instead of 'देलवाड़ा' for a peak), set 'typo': true\n"
    "Reply ONLY a JSON array, one object per candidate:\n"
    '[{"i":<number>,"d":"E|N|C|V|D|U","c":<0-1>,"r":"<=10 words reason","key_error":false,"typo":false}]'
)

BOILERPLATE_PATTERNS = (
    r"\((?=[^()]{0,60}\))[^()]*(?:rpsc|rssb|rsmssb|\bras\b|grade|ग्रेड)[^()]*\)",
    r"निम्न(?:लिखित)? में से (?:सबसे )?(?:उपयुक्त|सही) (?:विकल्प|उत्तर) (?:चुनें|चुनिए|चुनिये)",
    r"सही (?:उत्तर|विकल्प) (?:का )?(?:चयन|चुनाव) (?:कीजिए|कीजिये|करें)",
    r"सही (?:उत्तर|विकल्प) (?:चुनें|चुनिए|चुनिये)",
)

NEGATION_WORDS = (
    "नहीं", "नही", "गलत", "असत्य", "सिवाय", "छोड़कर", "not", "except",
    "incorrect", "false", "wrong"
)

_TAG = re.compile(r"<[^>]+>")
_SPACE = re.compile(r"\s+")
_LETTER_ANSWER = re.compile(r"\(?([A-Ha-h])[\).:]?")

def load_groq_keys():
    keys = []
    # 1. Check environment variable
    env_keys = os.getenv("GROQ_API_KEYS", "")
    if env_keys:
        keys.extend([k.strip() for k in env_keys.split(",") if k.strip()])
    # 2. Check .env.local
    env_local = Path(".env.local")
    if env_local.exists():
        with env_local.open("r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("GROQ_API_KEYS="):
                    val = line.split("=", 1)[1].strip()
                    keys.extend([k.strip() for k in val.split(",") if k.strip()])
    return list(dict.fromkeys(keys))

GROQ_KEYS = load_groq_keys()


# --------------------------------------------------------------------------- #
# Loading / Normalisation
# --------------------------------------------------------------------------- #

def read_json(path):
    with open(path, "r", encoding="utf-8-sig") as f:
        return json.load(f)


def flatten_questions(data):
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for key in ("questions", "data", "items", "records"):
            if isinstance(data.get(key), list):
                return [x for x in data[key] if isinstance(x, dict)]
        result = []
        def walk(obj):
            if isinstance(obj, dict):
                if any(k in obj for k in DEFAULT_TEXT_FIELDS):
                    result.append(obj)
                else:
                    for v in obj.values():
                        walk(v)
            elif isinstance(obj, list):
                for v in obj:
                    walk(v)
        walk(data)
        return result
    raise ValueError("Unsupported JSON shape; expected list or object.")


def first_value(row, fields, default=""):
    for key in fields:
        value = row.get(key)
        if value is not None and value != "":
            return value
    return default


def text_value(value):
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value or "")


_BOILER = [re.compile(unicodedata.normalize("NFC", p)) for p in BOILERPLATE_PATTERNS]


def normalize(text):
    text = unicodedata.normalize("NFC", text_value(text)).lower()
    for ch in ("\u200b", "\u200c", "\u200d", "\ufeff"):
        text = text.replace(ch, "")
    text = _TAG.sub(" ", text)
    for rx in _BOILER:
        text = rx.sub(" ", text)
    text = "".join(" " if unicodedata.category(c)[0] in "PS" else c for c in text)
    return _SPACE.sub(" ", text).strip()


_NEG = {normalize(w) for w in NEGATION_WORDS}


def negation_parity(norm_text):
    return sum(1 for t in norm_text.split() if t in _NEG) % 2


def similarity(a, b):
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def stable_hash(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonical_pair_key(id_a, id_b, text_a, text_b):
    left = str(id_a or stable_hash(normalize(text_a)))
    right = str(id_b or stable_hash(normalize(text_b)))
    ordered = sorted((left, right))
    return stable_hash(ordered[0] + "||" + ordered[1])


def option_list(raw):
    if isinstance(raw, dict):
        raw = list(raw.values())
    if not isinstance(raw, list):
        return []
    out = []
    for o in raw:
        if isinstance(o, dict):
            o = first_value(o, ("text", "label", "value", "option"), json.dumps(o, ensure_ascii=False))
        out.append(str(o).strip())
    return out


def resolve_answer(answer, opts):
    a = answer.strip()
    m = _LETTER_ANSWER.fullmatch(a)
    if m and opts:
        i = ord(m.group(1).lower()) - 97
        if 0 <= i < len(opts):
            return opts[i]
    return a


HINDI_EXAM_STOP_WORDS = {
    "राजस्थान", "निम्नलिखित", "कथन", "कथनों", "सही", "उत्तर", "विकल्प", "विकल्पों",
    "चुनें", "चुनिए", "चयन", "करें", "कीजिए", "जिले", "जिला", "जिलों", "राज्य", "प्रमुख",
    "कौन", "कौन-सा", "कौन-सी", "कौनसा", "कौनसी", "किस", "किसे", "कितने", "कहाँ", "कब",
    "निम्न", "संदर्भ", "दिए", "गए", "सूची", "सुमेलित", "सम्बंधित", "संबंधित", "स्थित", "माना"
}

def question_record(row, index):
    qid = text_value(first_value(row, DEFAULT_ID_FIELDS, f"row-{index}"))
    question = text_value(first_value(row, DEFAULT_TEXT_FIELDS))
    answer = text_value(first_value(row, DEFAULT_ANSWER_FIELDS))
    explanation = text_value(first_value(row, DEFAULT_EXP_FIELDS))
    raw_options = first_value(row, DEFAULT_OPTIONS_FIELDS, "")
    opts = option_list(raw_options)
    answer_text = resolve_answer(answer, opts)
    needs_options = bool(opts) and normalize(answer_text) not in {normalize(o) for o in opts}
    norm_q = normalize(question)
    
    # Filter generic exam stop-words from token set for high-signal matching
    raw_tokens = norm_q.split()
    content_tokens = frozenset(w for w in raw_tokens if w not in HINDI_EXAM_STOP_WORDS and len(w) >= 3)
    
    return {
        "idx": index,
        "id": qid,
        "question": question,
        "answer": answer,
        "answer_text": answer_text,
        "explanation": explanation,
        "options": text_value(raw_options),
        "opts": opts,
        "needs_options": needs_options,
        "topic": text_value(first_value(row, DEFAULT_TOPIC_FIELDS)),
        "set_id": text_value(first_value(row, DEFAULT_SET_FIELDS)),
        "normalized_question": norm_q,
        "normalized_answer": normalize(answer_text),
        "tokens": content_tokens if content_tokens else frozenset(raw_tokens),
        "neg": negation_parity(norm_q),
    }


# --------------------------------------------------------------------------- #
# Candidate Generation (Token Inverted Index)
# --------------------------------------------------------------------------- #

def build_candidates(records, min_jaccard=0.20, min_ratio=0.55):
    groups = defaultdict(list)
    for r in records:
        groups[r["topic"] or "__no_topic__"].append(r)

    pairs = []
    for topic, group in groups.items():
        inverted = defaultdict(list)
        for i, r in enumerate(group):
            for token in r["tokens"]:
                if len(token) >= 3:
                    inverted[token].append(i)

        possible = set()
        for indices in inverted.values():
            if len(indices) > 350:
                continue
            for p, i in enumerate(indices):
                for j in indices[p + 1:]:
                    possible.add((i, j))

        for i, j in sorted(possible):
            a, b = group[i], group[j]
            wa, wb = a["tokens"], b["tokens"]
            jac = len(wa & wb) / len(wa | wb) if wa and wb else 0.0
            la, lb = len(a["normalized_question"]), len(b["normalized_question"])
            if jac < min_jaccard:
                if not la or not lb or 2 * min(la, lb) / (la + lb) < min_ratio:
                    continue
            ratio = similarity(a["normalized_question"], b["normalized_question"])
            if ratio >= min_ratio or jac >= min_jaccard:
                pairs.append({
                    "pair_key": canonical_pair_key(a["id"], b["id"], a["question"], b["question"]),
                    "id_a": a["id"], "id_b": b["id"],
                    "topic": topic, "set_a": a["set_id"], "set_b": b["set_id"],
                    "question_a": a["question"], "question_b": b["question"],
                    "options_a": a["options"], "options_b": b["options"],
                    "answer_a": a["answer"], "answer_b": b["answer"],
                    "explanation_a": a["explanation"], "explanation_b": b["explanation"],
                    "text_ratio": round(ratio, 4), "word_jaccard": round(jac, 4),
                    "human_decision": "", "duplicate_of": "",
                    "ai_decision": "", "ai_confidence": "", "ai_reason": "",
                    "decision_source": "", "cluster_id": "",
                    "key_error": False, "typo_flag": False,
                    "_a": a, "_b": b,
                    "_score": max(ratio, jac),
                    "_inverse": a["neg"] != b["neg"],
                })
    return sorted(pairs, key=lambda x: (x["text_ratio"], x["word_jaccard"]), reverse=True)


# --------------------------------------------------------------------------- #
# Feedback Memory & Cache
# --------------------------------------------------------------------------- #

def load_feedback(path):
    memory = {}
    if not path.exists():
        return memory
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                key = item.get("pair_key")
                if key:
                    memory[key] = item
            except:
                pass
    return memory


def load_cache(path):
    cache = {}
    if path.exists():
        with path.open("r", encoding="utf-8") as f:
            for line in f:
                try:
                    item = json.loads(line)
                    cache[item["key"]] = item
                except:
                    pass
    return cache


def append_cache(path, items):
    if not items:
        return
    with path.open("a", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")


def rule_decision(pair):
    a, b = pair["_a"], pair["_b"]
    # Exact duplicate: identical normalized text and answer
    if a["normalized_question"] and a["normalized_question"] == b["normalized_question"] \
            and a["normalized_answer"] == b["normalized_answer"]:
        return {"decision": "exact_duplicate", "confidence": 1.0,
                "reason": "identical text and answer", "key_error": False, "typo": False}

    # Inverse question rule: MUST have very high base similarity (>= 0.80 or jaccard >= 0.65)
    # AND differ in negation parity
    if pair["_inverse"] and (pair["text_ratio"] >= 0.78 or pair["word_jaccard"] >= 0.65):
        return {"decision": "related_variation", "confidence": 0.95,
                "reason": "negation differs: inverse question", "key_error": False, "typo": False}

    # Different if similarity is very low
    if pair["text_ratio"] < 0.40 and pair["word_jaccard"] < 0.25:
        return {"decision": "different", "confidence": 1.0,
                "reason": "low token similarity", "key_error": False, "typo": False}

    return None


def content_key(pair, model):
    a, b = pair["_a"], pair["_b"]
    sides = sorted(f"{x['normalized_question']}|{x['normalized_answer']}" for x in (a, b))
    return stable_hash(model + "||" + "||".join(sides))


def set_ai(pair, res, source):
    pair["ai_decision"] = res["decision"]
    pair["ai_confidence"] = round(float(res.get("confidence", 0)), 3)
    pair["ai_reason"] = res.get("reason", "")
    pair["decision_source"] = source
    if res.get("key_error"):
        pair["key_error"] = True
    if res.get("typo"):
        pair["typo_flag"] = True


# --------------------------------------------------------------------------- #
# Groq Multi-Key Round Robin API Caller
# --------------------------------------------------------------------------- #

_key_index = 0

def get_next_groq_key(keys):
    global _key_index
    k = keys[_key_index % len(keys)]
    _key_index += 1
    return k


def clip(text, limit):
    text = _SPACE.sub(" ", _TAG.sub(" ", str(text))).strip()
    return text if len(text) <= limit else text[:limit - 1] + "\u2026"


def format_item(rec, with_options=False):
    s = f"Q: {clip(rec['question'], MAX_Q_CHARS)}\nAns: {clip(rec['answer_text'], MAX_ANS_CHARS)}"
    if rec.get("explanation"):
        s += f"\nExpl: {clip(rec['explanation'], 150)}"
    if rec["opts"] and (with_options or rec["needs_options"]):
        s += "\nOpts: " + " | ".join(clip(o, MAX_OPT_CHARS) for o in rec["opts"])
    return s


def groq_batch(anchor, candidates, keys, model="qwen/qwen3.8-27b", with_options=False, timeout=25, retries=5):
    body_text = f"{AI_INSTRUCTIONS}\n\nANCHOR QUESTION:\n{format_item(anchor, with_options)}\n\nCANDIDATES TO AUDIT:"
    for n, cand in enumerate(candidates, 1):
        body_text += f"\n\n[{n}] {format_item(cand, with_options)}"

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    for attempt in range(retries + 1):
        key = get_next_groq_key(keys)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        data = json.dumps({
            "model": model,
            "messages": [
                {"role": "system", "content": "You are a precise JSON-only exam question audit assistant. Reply ONLY with a valid JSON array."},
                {"role": "user", "content": body_text}
            ],
            "temperature": 0.0,
            "max_tokens": 150 + 90 * len(candidates)
        }).encode("utf-8")

        try:
            req = urllib.request.Request(url, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
            
            raw_text = payload["choices"][0]["message"]["content"].strip()
            # Clean possible markdown fence
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
                
            verdicts = {}
            for item in parsed:
                n = int(item.get("i", 0))
                d = str(item.get("d", "U")).strip()
                decision = d if d in CODES.values() else CODES.get(d.upper()[:1], "unresolved")
                conf = max(0.0, min(1.0, float(item.get("c", 0.8))))
                verdicts[n] = {
                    "decision": decision,
                    "confidence": conf,
                    "reason": str(item.get("r", ""))[:200],
                    "key_error": bool(item.get("key_error", False)),
                    "typo": bool(item.get("typo", False))
                }
            return verdicts, ""
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < retries:
                time.sleep(2.0 * (attempt + 1))
                continue
            last_error = f"HTTP {e.code}"
        except Exception as e:
            last_error = str(e)
            
    return {}, last_error


def plan_chunks(pending, batch_size):
    adj = defaultdict(list)
    for p in pending:
        adj[p["_a"]["idx"]].append(p)
        adj[p["_b"]["idx"]].append(p)
    recs = {}
    for p in pending:
        recs[p["_a"]["idx"]] = p["_a"]
        recs[p["_b"]["idx"]] = p["_b"]

    assigned, chunks = set(), []
    for idx in sorted(adj, key=lambda k: (-len(adj[k]), k)):
        mine = [p for p in adj[idx] if id(p) not in assigned]
        if not mine:
            continue
        assigned.update(id(p) for p in mine)
        mine.sort(key=lambda p: p["_score"], reverse=True)
        for s in range(0, len(mine), batch_size):
            chunks.append((recs[idx], mine[s:s + batch_size]))
    chunks.sort(key=lambda c: c[1][0]["_score"], reverse=True)
    return chunks


# --------------------------------------------------------------------------- #
# Multi-Way Clustering (Union-Find)
# --------------------------------------------------------------------------- #

def edge_type(pair, min_conf):
    if pair["decision_source"] == "feedback_memory":
        return "duplicate" if pair["human_decision"] == "duplicate" else None
    try:
        conf = float(pair["ai_confidence"] or 0)
    except:
        conf = 0.0
    dec = pair.get("ai_decision")
    reason = (pair.get("ai_reason") or "").lower()

    # Safety guard: if reason notes different entities or facts, never cluster as duplicate!
    if "different" in reason or "distinct" in reason or "not duplicate" in reason or "not a duplicate" in reason:
        return None

    if dec in ("exact_duplicate", "near_duplicate") and conf >= min_conf:
        return "duplicate"

    if dec == "conceptual_duplicate" and conf >= 0.85:
        # Conceptual duplicate must have matching answer text or key error
        ans_a = pair.get("_a", {}).get("norm_answer", "")
        ans_b = pair.get("_b", {}).get("norm_answer", "")
        if (ans_a and ans_b and (ans_a == ans_b or ans_a in ans_b or ans_b in ans_a)) or pair.get("key_error"):
            return "duplicate"

    return None


def build_clusters(pairs, min_conf):
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    nodes, links, etype, edges = {}, defaultdict(set), {}, []
    for p in pairs:
        t = edge_type(p, min_conf)
        if not t:
            continue
        a, b = p["_a"], p["_b"]
        nodes[a["idx"]], nodes[b["idx"]] = a, b
        links[a["idx"]].add(b["idx"])
        links[b["idx"]].add(a["idx"])
        etype[frozenset((a["idx"], b["idx"]))] = t
        edges.append(p)
        ra, rb = find(a["idx"]), find(b["idx"])
        if ra != rb:
            parent[ra] = rb

    comps = defaultdict(list)
    for idx in nodes:
        comps[find(idx)].append(idx)

    ordered = sorted(comps.values(), key=lambda m: (-len(m), min(m)))
    cluster_of, rows, similar = {}, [], []
    for n, members in enumerate(ordered, 1):
        cid = f"C{n:03d}"
        members.sort()
        member_set = set(members)
        for idx in members:
            cluster_of[idx] = cid
        ids = {nodes[i]["id"]: i for i in members}
        keeper = None
        for p in edges:
            if p["_a"]["idx"] in member_set and p["duplicate_of"] in ids:
                keeper = ids[p["duplicate_of"]]
                break
        if keeper is None:
            def dup_links(i):
                return sum(1 for j in links[i] if etype[frozenset((i, j))] == "duplicate")
            keeper = max(members, key=lambda i: (dup_links(i), len(links[i]), -i))
        sim = []
        for idx in members:
            r = nodes[idx]
            relation = "main" if idx == keeper else etype.get(frozenset((idx, keeper)), "variant")
            if idx != keeper:
                sim.append({"id": r["id"], "relation": relation, "question": r["question"][:80]})
            rows.append({
                "cluster_id": cid, "cluster_size": len(members),
                "suggested_keep": "yes" if idx == keeper else "",
                "relation_to_keep": relation,
                "id": r["id"], "topic": r["topic"], "set_id": r["set_id"],
                "question": r["question"], "answer": r["answer"],
                "explanation": r["explanation"][:120],
                "direct_links": len(links[idx]),
                "linked_to": ";".join(nodes[j]["id"] for j in sorted(links[idx])),
            })
        similar.append({"cluster": cid, "main": nodes[keeper]["id"], "main_question": nodes[keeper]["question"][:80], "similarQuestions": sim})
    for p in edges:
        p["cluster_id"] = cluster_of.get(p["_a"]["idx"], "")
    return rows, similar


# --------------------------------------------------------------------------- #
# Main Pipeline Runner
# --------------------------------------------------------------------------- #

def main():
    parser = argparse.ArgumentParser(description="Groq-Powered AI Deduplication and Question Audit Engine")
    parser.add_argument("input", help="Path to JSON questions file (e.g. data/questions/rajasthan-gk/topic_02.json)")
    parser.add_argument("--out", default="audit_output", help="Output directory")
    parser.add_argument("--min-jaccard", type=float, default=0.20)
    parser.add_argument("--min-ratio", type=float, default=0.55)
    parser.add_argument("--ai-review", action="store_true", help="Enable Groq AI review")
    parser.add_argument("--ai-limit", type=int, default=100, help="Maximum Groq API calls")
    parser.add_argument("--batch-size", type=int, default=6, help="Candidates per anchor question")
    parser.add_argument("--ai-min-score", type=float, default=0.40, help="Min similarity score to send to AI")
    parser.add_argument("--cluster-min-conf", type=float, default=0.75, help="Min confidence to join cluster")
    parser.add_argument("--workers", type=int, default=4, help="Parallel worker threads")
    parser.add_argument("--model", default="qwen/qwen3.8-27b", help="Groq model ID")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    memory_path = out / "feedback_memory.jsonl"
    cache_path = out / "ai_cache.jsonl"

    print("=" * 60)
    print("🚀 GROQ-POWERED AI QUESTION AUDITOR & DEDUPLICATION ENGINE")
    print("=" * 60)
    print(f"Reading input from: {args.input}")

    data = read_json(args.input)
    rows = flatten_questions(data)
    records = [question_record(row, i) for i, row in enumerate(rows, 1)]
    print(f"Total Questions Loaded: {len(records)}")

    print("\n🔍 Building candidate similarity pairs (Token Inverted Index)...")
    pairs = build_candidates(records, args.min_jaccard, args.min_ratio)
    print(f"Candidate Pairs Found: {len(pairs)}")

    memory = load_feedback(memory_path)
    cache = load_cache(cache_path)

    stats = {"rule": 0, "cache": 0, "below_score": 0, "twins": 0, "inverse": 0}
    pending = []
    seen_keys = {}
    twins = defaultdict(list)

    for p in pairs:
        ckey = content_key(p, args.model)
        # Check feedback memory
        item = memory.get(p["pair_key"])
        if item:
            p["decision_source"] = "feedback_memory"
            p["human_decision"] = item.get("decision", "")
            continue

        # Check rule decision
        res = rule_decision(p)
        if res:
            set_ai(p, res, "rule")
            stats["rule"] += 1
            stats["inverse"] += p["_inverse"] and res["decision"] == "related_variation"
            continue

        # Check content cache
        hit = cache.get(ckey)
        if hit:
            set_ai(p, hit, "groq_cache")
            stats["cache"] += 1
            continue

        if not args.ai_review:
            continue

        if p["_score"] < args.ai_min_score:
            stats["below_score"] += 1
            continue

        if ckey in seen_keys:
            twins[ckey].append(p)
            stats["twins"] += 1
            continue

        seen_keys[ckey] = p
        p["_ckey"] = ckey
        pending.append(p)

    print(f"\n📊 Pre-AI Processing Stats:")
    print(f"  • Decided by Rules: {stats['rule']} (including {stats['inverse']} inverse questions)")
    print(f"  • Cached from Previous Runs: {stats['cache']}")
    print(f"  • Duplicate Twins: {stats['twins']}")
    print(f"  • Pending for Groq AI Review: {len(pending)}")

    chunks = plan_chunks(pending, max(1, args.batch_size))
    print(f"  • Formed {len(chunks)} Anchor Chunks (batch_size={args.batch_size})")

    if args.ai_review and chunks:
        chunks_to_run = chunks[:args.ai_limit]
        print(f"\n⚡ Running Groq AI Review on {len(chunks_to_run)} chunks across {len(GROQ_KEYS)} keys (Workers={args.workers})...")

        def run_chunk(chunk):
            anchor, members = chunk
            cands = [p["_b"] if p["_a"] is anchor else p["_a"] for p in members]
            verdicts, err = groq_batch(anchor, cands, GROQ_KEYS, args.model)
            return chunk, verdicts, err

        ai_pairs_audited = 0
        key_errors = []
        typo_errors = []

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for (anchor, members), verdicts, err in pool.map(run_chunk, chunks_to_run):
                new_cache = []
                for n, p in enumerate(members, 1):
                    res = verdicts.get(n)
                    if res:
                        set_ai(p, res, "groq_ai")
                        ai_pairs_audited += 1
                        new_cache.append({"key": content_key(p, args.model), **res, "model": args.model})
                        if res.get("key_error"):
                            key_errors.append(p)
                        if res.get("typo"):
                            typo_errors.append(p)
                    else:
                        set_ai(p, {"decision": "unresolved", "confidence": 0.0, "reason": err or "AI error"}, "groq_ai")
                append_cache(cache_path, new_cache)

        # Fan out to twins
        for rep in pending:
            if rep["ai_decision"]:
                for t in twins.get(rep["_ckey"], []):
                    set_ai(t, {"decision": rep["ai_decision"], "confidence": rep["ai_confidence"],
                               "reason": rep["ai_reason"], "key_error": rep.get("key_error"), "typo": rep.get("typo_flag")},
                           rep["decision_source"])

        print(f"\n✅ Groq AI Audit Completed ({ai_pairs_audited} pairs audited).")
        if key_errors:
            print(f"⚠️  FLAGGED {len(key_errors)} QUESTIONS WITH POSSIBLE ANSWER-KEY CONTRADICTIONS!")
        if typo_errors:
            print(f"⚠️  FLAGGED {len(typo_errors)} QUESTIONS WITH POSSIBLE OCR / TYPO CORRUPTIONS!")

    # Multi-way clustering
    cluster_rows, similar = build_clusters(pairs, args.cluster_min_conf)

    # Save CSVs
    pair_fields = [
        "pair_key", "cluster_id", "id_a", "id_b", "topic", "set_a", "set_b",
        "question_a", "question_b", "answer_a", "answer_b", "text_ratio", "word_jaccard",
        "human_decision", "duplicate_of", "ai_decision", "ai_confidence", "ai_reason",
        "decision_source", "key_error", "typo_flag"
    ]
    with (out / "candidate_pairs.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=pair_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(pairs)

    cluster_fields = [
        "cluster_id", "cluster_size", "suggested_keep", "relation_to_keep",
        "id", "topic", "set_id", "question", "answer", "explanation", "direct_links", "linked_to"
    ]
    with (out / "duplicate_clusters.csv").open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=cluster_fields)
        writer.writeheader()
        writer.writerows(cluster_rows)

    with (out / "similar_questions.json").open("w", encoding="utf-8") as f:
        json.dump(similar, f, ensure_ascii=False, indent=2)

    unique_clusters = len({r["cluster_id"] for r in cluster_rows})
    print("\n" + "=" * 60)
    print("📋 AUDIT SUMMARY & RESULTS")
    print("=" * 60)
    print(f"Total Unique Clusters Formed: {unique_clusters}")
    print(f"Total Questions Grouped into Clusters: {len(cluster_rows)}")
    print(f"Output files saved to: {out.resolve()}/")
    print("  • candidate_pairs.csv")
    print("  • duplicate_clusters.csv")
    print("  • similar_questions.json")


if __name__ == "__main__":
    main()
