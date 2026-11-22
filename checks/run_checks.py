"""Accuracy and safety checks for the tutoring site. Run before every publish:
    python3 checks/run_checks.py
Uses only built-in Python. Prints PASS or a list of problems."""
import json, re, sys
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
DATA = SITE / "data"
problems = []

def bad(where, msg):
    problems.append(f"{where}: {msg}")

# ---------- banned words ----------
# School names, surnames and non-English example names must never appear on the site.
# Real names and school names live in checks/private_words.txt, which never leaves this Mac.
PRIVATE = ["T. Roy"]
_pw = Path(__file__).resolve().parent / "private_words.txt"
if _pw.exists():
    PRIVATE += [l.strip() for l in _pw.read_text().splitlines() if l.strip() and not l.startswith("#")]
else:
    print("WARNING: checks/private_words.txt not found, so real names are NOT being checked.")
NON_ENGLISH_NAMES = ["Somchai", "Somsak", "Ploy", "Pim", "Nong", "Ning", "Ying", "Nam", "Fah", "Mali", "Kanya", "Siriporn",
    "Ming", "Wei", "Li", "Wang", "Zhang", "Chen", "Liu", "Xiao", "Mei", "Jun", "Hui", "Yan", "Ling", "Hao", "Jie", "Lei",
    "Priya", "Raj", "Arjun", "Aarav", "Ananya", "Rahul", "Ravi", "Sanjay", "Deepa", "Kavya", "Rohan", "Aditi", "Vikram"]

def walk_strings(obj, path=""):
    if isinstance(obj, str):
        yield path, obj
    elif isinstance(obj, dict):
        for k, v in obj.items():
            yield from walk_strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from walk_strings(v, f"{path}[{i}]")

def text_rules(where, s):
    if "—" in s:
        bad(where, "em dash found. Use a comma, full stop or colon instead.")
    for n in PRIVATE + NON_ENGLISH_NAMES:
        if re.search(r"\b" + re.escape(n) + r"\b", s):
            bad(where, f'banned name or private word "{n}"')
    if re.search(r"\^\d", s):
        bad(where, "use superscript (2³), not ^")
    if re.search(r"\b(mm|cm|m|km)[23]\b", s):
        bad(where, "use cm² / cm³, not cm2 / cm3")

# ---------- maths ----------
TOKEN = re.compile(r"\s*(\d+\s+\d+/\d+|\d+/\d+|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+\.\d+|\d+|[×÷+\-−()])")

def evaluate(expr):
    """Evaluate a fraction expression like '3/4 × 2/1' or '1 1/2'. Returns Fraction."""
    pos, toks = 0, []
    expr = expr.strip()
    while pos < len(expr):
        m = TOKEN.match(expr, pos)
        if not m:
            raise ValueError(f"cannot read '{expr[pos:]}'")
        toks.append(m.group(1)); pos = m.end()
    def num(t):
        if " " in t:
            w, f = t.split()
            return Fraction(int(w)) + Fraction(f)
        return Fraction(t.replace(",", ""))
    # shunting-yard
    prec = {"×": 2, "÷": 2, "+": 1, "-": 1, "−": 1}
    out, ops = [], []
    for t in toks:
        if t in prec:
            while ops and ops[-1] in prec and prec[ops[-1]] >= prec[t]:
                out.append(ops.pop())
            ops.append(t)
        elif t == "(":
            ops.append(t)
        elif t == ")":
            while ops[-1] != "(":
                out.append(ops.pop())
            ops.pop()
        else:
            out.append(num(t))
    while ops:
        out.append(ops.pop())
    st = []
    for t in out:
        if isinstance(t, Fraction):
            st.append(t); continue
        b, a = st.pop(), st.pop()
        st.append({"×": a * b, "÷": a / b, "+": a + b, "-": a - b, "−": a - b}[t])
    if len(st) != 1:
        raise ValueError(f"bad expression '{expr}'")
    return st[0]

def check_chain(where, line):
    """Every part of 'a = b = c' must be equal."""
    parts = [p for p in line.split("=")]
    try:
        vals = [evaluate(p) for p in parts]
    except Exception as e:
        bad(where, f"cannot check maths '{line}': {e}")
        return
    if any(v != vals[0] for v in vals):
        bad(where, f"maths is WRONG: '{line}' -> {[str(v) for v in vals]}")

def simplest(where, s):
    """Final answers: whole number, proper fraction in lowest terms, or mixed number in lowest terms."""
    if re.fullmatch(r"\d{1,3}(?:,\d{3})*\.\d+|\d+\.\d+", s):
        if s.endswith("0"): bad(where, f"decimal answer '{s}' has a trailing zero")
        return
    m = re.fullmatch(r"(\d{1,3}(?:,\d{3})+|\d+)(?: (\d+)/(\d+))?|(\d+)/(\d+)", s)
    if not m:
        bad(where, f"answer '{s}' is not a whole number, fraction or mixed number"); return
    if m.group(4):
        n, d = int(m.group(4)), int(m.group(5))
        if n >= d: bad(where, f"answer '{s}' should be a mixed number or whole number")
        if Fraction(n, d).denominator != d: bad(where, f"answer '{s}' is not simplified")
    elif m.group(2):
        n, d = int(m.group(2)), int(m.group(3))
        if n >= d or Fraction(n, d).denominator != d: bad(where, f"answer '{s}' is not simplified")

def check_guided(where, a):
    for i, it in enumerate(a["items"]):
        w = f"{where} item {i+1}"
        for s in it.get("steps", []):
            for line in ([] if s.get("math") is None else ([s["math"]] if isinstance(s["math"], str) else s["math"])):
                check_chain(w, line)
        ans = it.get("answer", "")
        if not ans:
            bad(w, "missing final answer")
        if not it.get("why"):
            bad(w, "missing WHY line")
        c = it.get("check")
        if c:
            try:
                v = evaluate(c["value"])
                if evaluate(c["expr"]) != v:
                    bad(w, f"answer WRONG: {c['expr']} is {evaluate(c['expr'])}, not {c['value']}")
            except Exception as e:
                bad(w, f"cannot check: {e}")
            # Equations: the answer may be written in final form "letter = number", e.g. "k = 7".
            ans = re.sub(r"^[a-zA-Z] = ", "", ans)
            if not ans.startswith(c["value"]):
                bad(w, f"shown answer '{ans}' does not match checked value '{c['value']}'")
            simplest(w, c["value"])
            unit = ans[len(c["value"]):].strip()
            if re.search(r"[a-zA-Z]", it["q"]) and not unit and not it.get("noUnit"):
                bad(w, "word problem answer needs a unit")
        elif re.search(r"\d", it["q"]):
            bad(w, "maths item has no 'check' block, so it cannot be verified")

# ---------- quizzes ----------
def check_mcq(where, qs, need_why=True):
    for i, q in enumerate(qs):
        w = f"{where} Q{i+1}"
        opts = q.get("options", [])
        if not (2 <= len(opts) <= 4): bad(w, "needs 2 to 4 options")
        if len(set(opts)) != len(opts): bad(w, "two options are the same")
        if not isinstance(q.get("answer"), int) or not (0 <= q["answer"] < len(opts)): bad(w, "answer index is wrong")
        if need_why and not q.get("why"): bad(w, "missing WHY explanation")

# ---------- spelling ----------
def check_spelling(where, student, week, a):
    src = ROOT / "checks" / "lists" / student / f"{week}.txt"
    words = [w["word"] for w in a["words"]]
    if not src.exists():
        bad(where, f"no source list at {src.relative_to(ROOT)}. Run extract_spelling_list.py first.")
        return
    source = [l.strip() for l in src.read_text().splitlines() if l.strip()]
    if words != source:
        missing = [w for w in source if w not in words]
        extra = [w for w in words if w not in source]
        bad(where, f"spelling list does not match school list. Missing: {missing} Extra or misspelt: {extra}")
    for w in a["words"]:
        if w.get("sentence") and not re.search(r"\b" + re.escape(w["word"]) + r"\b", w["sentence"], re.I):
            bad(where, f"sentence for '{w['word']}' does not contain the word")

# ---------- bilingual ----------
def check_zh(where, obj):
    for p, s in walk_strings(obj):
        pass
    def visit(o, p):
        if isinstance(o, dict):
            if "en" in o and isinstance(o["en"], str) and ("zh" not in o or not o["zh"]):
                if not p.endswith("groups") and "steps" not in p:
                    bad(where + p, "Chinese (zh) is missing")
            for k, v in o.items():
                visit(v, f"{p}.{k}")
        elif isinstance(o, list):
            for i, v in enumerate(o):
                visit(v, f"{p}[{i}]")
    visit(obj, "")

# ---------- run ----------
for student_dir in sorted(p for p in DATA.iterdir() if p.is_dir()):
    sid = student_dir.name
    st = json.loads((student_dir / "student.json").read_text())
    for f in sorted(student_dir.glob("*.json")):
        try:
            d = json.loads(f.read_text())
        except Exception as e:
            bad(str(f), f"JSON error: {e}"); continue
        for p, s in walk_strings(d):
            text_rules(f"{f.relative_to(ROOT)}{p}", s)
        if f.name == "mainbook.json":
            if st.get("bilingual"): check_zh(str(f.relative_to(ROOT)), d)
            continue
        if f.name == "student.json":
            for wk in d.get("weeks", []):
                if not (student_dir / f"{wk}.json").exists():
                    bad(str(f.relative_to(ROOT)), f"week {wk} listed but file missing")
            continue
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}\.json", f.name):
            bad(str(f), "week file must be named by the Monday date, like 2026-11-23.json")
        else:
            import datetime
            if datetime.date.fromisoformat(f.stem).weekday() != 0:
                bad(str(f), "week file date is not a Monday")
            if f.stem not in st.get("weeks", []):
                bad(str(f), "this week is not listed in student.json")
        if st.get("bilingual"):
            check_zh(str(f.relative_to(ROOT)), d)
        ids = set()
        for a in d.get("activities", []):
            where = f"{f.relative_to(ROOT)} [{a.get('id')}]"
            if a["id"] in ids: bad(where, "duplicate activity id")
            ids.add(a["id"])
            t = a["type"]
            if not a.get("canNow"):
                bad(where, 'missing the "I can now..." line (canNow)')
            shown = len(a.get("questions") or a.get("items") or [])
            if t == "quiz" and a.get("count"):
                shown = min(shown, a["count"])
            if shown > (25 if t == "hwquiz" else 10):
                bad(where, f"{shown} questions shown. Keep it to 10 or fewer (split it, or set count).")
            if t == "spelling": check_spelling(where, sid, f.stem, a)
            elif t == "quiz": check_mcq(where, a["questions"])
            elif t == "reading": check_mcq(where, a["questions"])
            elif t == "guided": check_guided(where, a)
            elif t == "match":
                if len({p["a"] for p in a["pairs"]}) != len(a["pairs"]): bad(where, "duplicate match terms")
            elif t == "flashcards":
                if st.get("bilingual") and any(not c.get("zh") for c in a["cards"]): bad(where, "flashcard missing Chinese on the back")
            elif t == "lesson":
                if not a.get("slides"): bad(where, "lesson has no slides")
            elif t == "fillblank":
                bank = {w.lower() for w in a.get("bank", [])}
                for i, it in enumerate(a.get("items", [])):
                    if it["text"].count("___") != 1: bad(where, f"item {i+1} needs exactly one ___ blank")
                    if it["answer"].lower() not in bank: bad(where, f"item {i+1} answer '{it['answer']}' is not in the word bank")
        # workbook days and homework reviews must point at real activities and be complete
        for day in d.get("days", []):
            for aid in day.get("activities", []):
                if aid not in ids: bad(f"{f.relative_to(ROOT)} day {day.get('date')}", f"activity '{aid}' does not exist")
        for r in d.get("reviews", []):
            rw = f"{f.relative_to(ROOT)} review {r.get('id')}"
            for aid in r.get("practice", []):
                if aid not in ids: bad(rw, f"practice activity '{aid}' does not exist")
            for pg in r.get("pages", []):
                for it in pg.get("items", []):
                    w2 = f"{rw} {it.get('n')}"
                    if not it.get("q") or not it.get("right"): bad(w2, "needs a question and the right answer")

# every HTML page must have noindex; no em dashes in site code text
for html in SITE.rglob("*.html"):
    s = html.read_text()
    if 'name="robots" content="noindex' not in s:
        bad(str(html.relative_to(ROOT)), "missing <meta name=\"robots\" content=\"noindex\">")
for f in list(SITE.rglob("*.html")) + list(SITE.rglob("*.js")):
    s = f.read_text()
    if "—" in s:
        bad(str(f.relative_to(ROOT)), "em dash found")
    for n in PRIVATE:
        if re.search(r"\b" + re.escape(n) + r"\b", s):
            bad(str(f.relative_to(ROOT)), f'private word "{n}" found')

if problems:
    print(f"FAIL: {len(problems)} problem(s)")
    for p in problems:
        print(" -", p)
    sys.exit(1)
print("PASS: all checks OK")
