#!/usr/bin/env python3
"""
Quizzer pool deduplicator v2 (GK + English).  Python 3.8+, NO extra packages.

Run from the repo root:
    python3 scripts/dedup_pool.py                       # dedup the pool
    python3 scripts/dedup_pool.py --convex export.json  # + mark questions already uploaded to Convex
    python3 scripts/dedup_pool.py --selftest            # measure recall on synthetic duplicates

--convex accepts a Convex export of the `questions` table (JSON array or JSONL), or a plain
JSON list of sourceQuestionIds (e.g. from audit:getAllUsedSourceQuestionIds). Only the
`sourceQuestionId` (= pool id like rg_013046) and `_id` of each row are used.

Reads (never modifies): data/ddd/topics/*.json, data/ddd/english/topics/*.json
Writes to data/ddd/dedup/:
    master-deduped.json  one canonical question per group (already-uploaded one is preferred)
    dedup-groups.json    canonical id -> all members (nothing is lost)
    review-pairs.json    doubtful pairs for Gemini (NOT merged)
    convex-actions.json  (with --convex) groups whose members are already in Convex
    report.md

MERGE RULE (conservative - "do not over-dedupe"): merge only when the CORRECT ANSWER matches
(shuffled options are fine) AND the questions are textually the same by ANY of:
    A. character similarity of the stem  >= 0.85
    B. content-word similarity of the stem >= 0.80
    C. stem similarity >= 0.60 AND the option sets are >= 0.80 the same
Same stem + near-same options but a DIFFERENT answer is listed for review (possible wrong key).
"""
import glob, json, os, random, re, sys, unicodedata
from collections import defaultdict, Counter

OUT = os.path.join("data", "ddd", "dedup")
DIG = str.maketrans("०१२३४५६७८९", "0123456789")
STOP = set("निम्नलिखित में से कौन कौनसा कौनसी सा सी है हैं था थी थे के की का को ने पर और व एवं तथा यह वह "
           "किस कहाँ कहां क्या कब कितने कितनी सही गलत कथन विकल्प the a an of is are was were which following "
           "in to and for as by on with from correct select choose".split())


def norm(t):
    t = unicodedata.normalize("NFKC", t or "").lower().translate(DIG)
    t = re.sub(r"^\s*[\(\[]?[a-d1-4][\)\].:]\s+", "", t)           # leading option label  (a) / A.
    t = "".join(c if unicodedata.category(c)[0] in "LNM" else " " for c in t)
    t = t.replace("\u093c", "").replace("ँ", "ं")                  # nukta, chandrabindu
    t = t.replace("ू", "ु").replace("ी", "ि")                      # गुरू/गुरु  शीतला/शितला
    t = t.replace("ं", "न्") if False else t
    return re.sub(r"\s+", " ", t).strip()


def shingles(s, n=3):
    s = f" {s} "
    return {s[i:i + n] for i in range(max(1, len(s) - n + 1))}


def dice(a, b):
    return 2 * len(a & b) / (len(a) + len(b)) if a and b else 0.0


def tsim(a, b):
    """symmetric content-word dice"""
    if not a or not b:
        return 0.0
    return 2 * len(a & b) / (len(a) + len(b))


def tcont(a, b):
    """containment: how much of the SHORTER stem sits inside the longer (reworded / prefixed stems)"""
    if min(len(a), len(b)) < 4:
        return 0.0
    return 0.9 * len(a & b) / min(len(a), len(b))


def correct_text(q):
    try:
        return norm(q["options"]["ABCD".index(str(q["answer"]).strip().upper()[0])])
    except Exception:
        return ""


def load(subject, pattern):
    seen = {}
    for f in sorted(glob.glob(pattern)):
        d = json.load(open(f, encoding="utf-8"))
        for q in d.get("questions", []):
            if q["id"] in seen:                     # English repeats ids across topic files
                continue
            q = dict(q)
            q["_subject"] = subject
            seen[q["id"]] = q
    return list(seen.values())


def load_convex(path):
    txt = open(path, encoding="utf-8").read().strip()
    try:
        data = json.loads(txt)
        rows = data if isinstance(data, list) else data.get("questions", [])
    except json.JSONDecodeError:
        rows = [json.loads(l) for l in txt.splitlines() if l.strip()]
    m = {}
    for r in rows:
        if isinstance(r, str):
            m[r] = None
            continue
        sid = r.get("sourceQuestionId") or (r.get("meta") or {}).get("sourceQuestionId")
        if sid is not None:
            m[str(sid)] = r.get("_id")
    return m


def dedup(qs, pre_uploaded=frozenset()):
    """returns (groups: list[list[int]], review: list[tuple])"""
    n = len(qs)
    nq = [norm(q["question"]) for q in qs]
    ans = [correct_text(q) for q in qs]
    opts = [" ".join(sorted(norm(o) for o in q["options"])) for q in qs]
    sh = [shingles(x) for x in nq]
    ash = [shingles(a) for a in ans]
    osh = [shingles(o) for o in opts]
    tok = [{w for w in x.split() if w not in STOP and len(w) > 1} for x in nq]

    SYM = set("a b c d i ii iii iv v 1 2 3 4 और r दोनों सही हैं नहीं लेकिन है ए आर का सही नहीं सही".split())

    def structured(i):
        """match-the-following / ordering / assertion-reason: the answer is only a CODE, so the
        answer text proves nothing - the stem itself (with the statements) must be identical."""
        a = set(ans[i].split())
        stem = qs[i]["question"].lower()
        return (a and a <= SYM) or any(k in stem for k in ("assertion", "अभिकथन", "सुमेलित", "match list", "match the",
                                                              "कालक्रम", "arrange", "सही युग्म", "correct order"))

    def entity_swap(i, j, o):
        """both stems carry a word the other lacks (भपंग vs टामक) and options differ -> different fact"""
        if o >= 0.8:
            return False
        ex = lambda a, b: [w for w in tok[a] if len(w) > 2 and not any(dice(shingles(w), shingles(v)) >= 0.6 for v in tok[b])]
        return bool(ex(i, j)) and bool(ex(j, i))

    def same_answer(i, j):
        if not ans[i] or not ans[j]:
            return False
        if ans[i] == ans[j]:
            return True
        short, long_ = sorted((ans[i], ans[j]), key=len)
        if len(short) >= 4 and (short in long_ and len(short) >= 0.5 * len(long_)):
            return True
        return len(short) >= 6 and dice(ash[i], ash[j]) >= 0.8

    index = defaultdict(list)
    for i, s in enumerate(sh):
        for g in s:
            index[g].append(i)

    parent = list(range(n))

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    review = []
    for i in range(n):
        # candidates = questions sharing any of the 20 RAREST shingles of this question
        rare = sorted(sh[i], key=lambda g: len(index[g]))[:20]
        cnt = Counter()
        for g in rare:
            for j in index[g]:
                if j > i:
                    cnt[j] += 1
        for j, c in cnt.items():
            if qs[i]["_subject"] != qs[j]["_subject"]:
                continue
            s = dice(sh[i], sh[j])
            t = tsim(tok[i], tok[j])
            tc = tcont(tok[i], tok[j])
            o = dice(osh[i], osh[j])
            if s < 0.5 and max(t, tc) < 0.7:
                continue
            same = same_answer(i, j)
            if structured(i) or structured(j):
                if s >= 0.95 and o >= 0.90 and ans[i] == ans[j]:
                    parent[find(i)] = find(j)
                elif s >= 0.85 and o >= 0.70:
                    review.append((i, j, s, ans[i] == ans[j]))
                continue
            strong = s >= 0.85 or t >= 0.80 or (tc >= 0.80 and o >= 0.60) or (max(s, t) >= 0.60 and o >= 0.80)
            if same and strong and not entity_swap(i, j, o):
                parent[find(i)] = find(j)
            elif same and max(s, t, tc) >= 0.60 and o >= 0.30:
                review.append((i, j, max(s, t), True))
            elif (not same) and s >= 0.85 and o >= 0.70:
                review.append((i, j, s, False))
    groups = defaultdict(list)
    for i in range(n):
        groups[find(i)].append(i)
    return list(groups.values()), [r for r in review if find(r[0]) != find(r[1])]


# ---------------------------------------------------------------- self-test
def mutate(q, rnd):
    """make a realistic duplicate: shuffle options, change spelling/punctuation, add filler, maybe change digits"""
    m = {k: v for k, v in q.items()}
    opts = list(q["options"])
    try:
        ci = "ABCD".index(str(q["answer"]).strip().upper()[0])
    except Exception:
        return None
    order = list(range(len(opts)))
    rnd.shuffle(order)
    m["options"] = [opts[i] for i in order]
    m["answer"] = "ABCD"[order.index(ci)]
    t = q["question"]
    kind = rnd.choice(["punct", "spell", "filler", "tail", "digits"])
    if kind == "punct":
        t = re.sub(r"[-–:।?]", " ", t) + " ?"
    elif kind == "spell":
        t = t.replace("ा", "ा", 1).replace("ी", "ि").replace("ं", "ँ").replace("कहां", "कहाँ")
        t = t.replace("ू", "ु")
    elif kind == "filler":
        t = "निम्नलिखित में से " + t
    elif kind == "tail":
        t = t.rstrip(" -:।?") + " -"
    else:
        t = t.translate(str.maketrans("0123456789", "०१२३४५६७८९"))
    m["question"] = t
    m["id"] = q["id"] + "_dup"
    return m


def selftest(qs, k=1000, seed=7):
    rnd = random.Random(seed)
    base = rnd.sample(qs, k)
    dups = [d for d in (mutate(q, rnd) for q in base) if d]
    allq = qs + dups
    groups, rev = dedup(allq)
    gid = {}
    for gi, g in enumerate(groups):
        for i in g:
            gid[allq[i]["id"]] = gi
    hit = sum(1 for q in base if gid[q["id"]] == gid[q["id"] + "_dup"])
    inrev = sum(1 for a, b, *_ in rev if {allq[a]["id"], allq[b]["id"]} & {q["id"] + "_dup" for q in base})
    # precision side: how many ORIGINAL (non-synthetic) merges happened
    print(f"SELFTEST  injected {len(dups)} synthetic duplicates into {len(qs)} real questions")
    print(f"  caught (merged back with their original): {hit}  = {100*hit/len(dups):.1f}%")
    print(f"  missed: {len(dups)-hit}  (of which sitting in review list: ~{min(inrev, len(dups)-hit)})")


def main():
    args = sys.argv[1:]
    qs = load("gk", os.path.join("data", "ddd", "topics", "*.json")) + \
         load("english", os.path.join("data", "ddd", "english", "topics", "*.json"))
    if not qs:
        sys.exit("No questions found - run this from the repo root.")
    if "--selftest" in args:
        return selftest(qs)
    cvx = load_convex(args[args.index("--convex") + 1]) if "--convex" in args else {}
    print(f"loaded {len(qs)} unique-id questions; {len(cvx)} already in Convex")
    groups, rv = dedup(qs)

    def score(i):   # canonical pick: already in Convex > has explanation > newest > more options
        q = qs[i]
        return (q["id"] in cvx, len(q.get("explanation") or ""), q.get("year") or 0, len(q["options"]))

    master, gjson, actions = [], {}, []
    for members in groups:
        members.sort(key=score, reverse=True)
        c = qs[members[0]]
        out = {k: v for k, v in c.items() if not k.startswith("_")}
        out.update(subject=c["_subject"], repeatCount=len(members),
                   variantIds=[qs[m]["id"] for m in members],
                   exams=sorted({f'{qs[m].get("exam")} ({qs[m].get("year")})' for m in members if qs[m].get("exam")}),
                   inConvex=c["id"] in cvx)
        master.append(out)
        if len(members) > 1:
            gjson[c["id"]] = [{"id": qs[m]["id"], "exam": qs[m].get("exam"), "year": qs[m].get("year"),
                               "inConvex": qs[m]["id"] in cvx, "question": qs[m]["question"],
                               "options": qs[m]["options"], "answer": qs[m]["answer"]} for m in members]
            up = [qs[m]["id"] for m in members if qs[m]["id"] in cvx]
            if len(up) > 1:      # same fact uploaded to Convex more than once
                actions.append({"action": "DUPLICATE_IN_CONVEX", "keep": up[0], "remove": up[1:],
                                "convexDocIds": {u: cvx[u] for u in up}})
    rvj = []
    for i, j, s, same in sorted(rv, key=lambda r: -r[2]):
        f = lambda k: {"id": qs[k]["id"], "q": qs[k]["question"], "options": qs[k]["options"], "answer": qs[k]["answer"]}
        rvj.append({"a": f(i), "b": f(j), "similarity": round(s, 3),
                    "why": "same_answer_reworded" if same else "similar_text_DIFFERENT_answer"})
    os.makedirs(OUT, exist_ok=True)
    dump = lambda nm, o: json.dump(o, open(os.path.join(OUT, nm), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    dump("master-deduped.json", master); dump("dedup-groups.json", gjson); dump("review-pairs.json", rvj)
    if cvx:
        dump("convex-actions.json", actions)
    n = len(qs)
    by, byu = Counter(q["_subject"] for q in qs), Counter(m["subject"] for m in master)
    lines = ["# Dedup report", "", f"- input: {n}", f"- after merge: {len(master)} (removed {100*(n-len(master))/n:.1f}%)",
             f"- merged groups: {len(gjson)}", f"- review pairs for Gemini: {len(rvj)}"]
    if cvx:
        lines.append(f"- same fact uploaded to Convex more than once: {len(actions)}")
    lines += [f"- {s}: {by[s]} -> {byu[s]}" for s in by]
    open(os.path.join(OUT, "report.md"), "w", encoding="utf-8").write("\n".join(lines))
    print("\n".join(lines))


if __name__ == "__main__":
    main()

