"""Pull the numbered spelling words out of a school spelling-list PDF.
Usage: python checks/extract_spelling_list.py "<pdf>" checks/lists/<student>/<week>.txt
Needs PyMuPDF (pip install pymupdf). Writes one word per line, in the school's order."""
import re, sys
import fitz

pdf, out = sys.argv[1], sys.argv[2]
text = "\n".join(p.get_text() for p in fitz.open(pdf))
lines = [l.strip() for l in text.splitlines()]
words = []
for i, l in enumerate(lines):
    m = re.match(r"^(\d+)\.\s*([A-Za-z'-]*)$", l)
    if not m:
        continue
    w = m.group(2) or next((x for x in lines[i + 1:] if x), "")
    w = w.split()[0] if w else ""
    if re.fullmatch(r"[A-Za-z'-]+", w):
        words.append((int(m.group(1)), w))
words = [w for _, w in sorted(words)]
open(out, "w").write("\n".join(words) + "\n")
print(len(words), "words:", ", ".join(words))
