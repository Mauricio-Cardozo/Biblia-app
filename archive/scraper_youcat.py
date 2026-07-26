#!/usr/bin/env python3
"""
Scraper YOUCAT desde mscperu.org → SQLite.

Uso:
  python3 archive/scraper_youcat.py --preview
  python3 archive/scraper_youcat.py
  python3 archive/scraper_youcat.py --db path/to/db.db
"""

import argparse
import re
import sqlite3
import sys
import time
import urllib.request
from bs4 import BeautifulSoup

DB_PATH = "AppMovil/assets/iglesia_digital.db"
BASE = "https://mscperu.org/~mscperuo/catequesis/Catecismo/youcat"

PAGES = [
    (f"{BASE}/youcat_catecismo_joven01.htm", 1, "Lo que creemos"),
    (f"{BASE}/youcat_catecismo_joven02.htm", 2, "Cómo celebramos los misterios cristianos"),
    (f"{BASE}/youcat_catecismo_joven03.htm", 3, "Cómo obtenemos la vida en Cristo"),
    (f"{BASE}/youcat_catecismo_joven04.htm", 4, "Cómo debemos orar"),
]

USER_AGENT = "Mozilla/5.0 (compatible; IglesiaDigital/1.0)"
SLEEP_SECS = 0.5

Q_RE = re.compile(r"^i?(\d{1,3})\s*[.,\-]*\s*")
SECTION_RE = re.compile(r"(?:Primera|Segunda|Tercera|Cuarta)\s+[Ss]ecci[oó]n")
CHAPTER_RE = re.compile(r"Cap[ií]tulo\s+(Primero|Segundo|Tercero|[IVXLCDM]+)")
SKIP_RE = re.compile(r"^(Páginas relacionadas|volver arriba|« volver|~|Página)")
SKIP_LIST_RE = re.compile(
    r"^\d+\s*[. ,–-]\s*(Jesús (es|carga|cae|encuentra|consuela|despojado|clavado|muere)"
    r"|Amarás|No (tomarás|cometerás|robarás|dirás|consentirás|codiciarás)"
    r"|La (Encarnación|Presentación|Oración|Flagelación|Resurrección|Visitación|auto|venida)"
    r"|Simón|La Verónica|El Bautismo|Los gozos|Misterios|Nos recuerda)"
)
IDX_RE = re.compile(r"^\d+\s+(El hombre|Dios|Los hombres|La profesión|Creo|Cómo|Primera|Segunda|Tercera)")


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")


def clean(s: str) -> str:
    for c in ["\u00ad", "\u2010", "\u2011", "\u2012"]:
        s = s.replace(c, "")
    s = s.replace("\u2013", "-")
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("<em>", "").replace("</em>", "")


def extract_lines(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.find("div", id="main-content")
    if not main:
        return []
    for t in main.find_all(["script", "style", "noscript"]):
        t.decompose()
    return [line for line in (clean(l) for l in main.get_text("\n").split("\n")) if line and len(line) > 2]


def split_qa(text: str) -> tuple[str, str]:
    for pat in [
        r"^(¿[^?]+\?)\s*(.+)",
        r'(^"[^"]+"[^?]*\?)\s*(.+)',
        r"^([A-Z][^?]+\?)\s*(.+)",
        r"^(¿[^?]+\?)([A-Z].*)",
        r"^([A-Z][^?]*\xbf[^?]+\?)\s*(.+)",
    ]:
        m = re.match(pat, text)
        if m:
            return m.group(1), m.group(2).strip()
    return text, ""


def parse_page(html: str, parte_id: int, parte_nombre: str) -> list[dict]:
    lines = extract_lines(html)
    questions: list[dict] = []
    current: dict | None = None
    seccion = ""
    capitulo = ""

    for line in lines:
        if SECTION_RE.search(line) and len(line) < 200:
            seccion = line.rstrip(".")
            continue

        if CHAPTER_RE.search(line) and len(line) < 200:
            embed = re.search(r"(\d{1,3})\s*[.,\-]*\s+(¿|\")", line)
            if embed:
                num = int(embed.group(1))
                if num < 1:
                    continue
                rest = re.sub(r"^.*?\d{1,3}\s*[.,\-]*\s*", "", line)
                rest = re.sub(r"^[^A-Za-z\u00bf\"]+", "", rest)
                q_text, a_text = split_qa(rest)
                if current:
                    questions.append(current)
                current = {
                    "id": num, "parte_id": parte_id, "parte": parte_nombre,
                    "seccion": seccion, "capitulo": line, "pregunta": q_text,
                    "respuesta": a_text, "comentario": "",
                }
            else:
                capitulo = line
            continue

        if SKIP_RE.match(line): continue
        if SKIP_LIST_RE.match(line): continue
        if re.match(r"^\d+-\d+", line): continue
        if IDX_RE.match(line): continue

        qm = Q_RE.match(line)
        if qm:
            num = int(qm.group(1))
            rest = re.sub(r"^[^A-Za-z\u00bf\"]+", "", line[qm.end():])
            q_text, a_text = split_qa(rest)
            if current:
                questions.append(current)
            current = {
                "id": num, "parte_id": parte_id, "parte": parte_nombre,
                "seccion": seccion, "capitulo": capitulo, "pregunta": q_text,
                "respuesta": a_text, "comentario": "",
            }
        elif current:
            a = line
            if not current["respuesta"]:
                # Check if this is a question continuation (lowercase start or short + ?)
                if a and (a[0].islower() or (len(a) < 30 and "?" in a)):
                    cont = re.match(r"([^A-ZÁÉÍÓÚÑa-záéíóúñ]*[?.!])\s*([A-ZÁÉÍÓÚÑ].*)", a)
                    if cont:
                        current["pregunta"] += " " + cont.group(1)
                        current["respuesta"] = cont.group(2)
                    else:
                        current["pregunta"] += " " + a
                else:
                    current["respuesta"] = a
            else:
                current["comentario"] += (" " + a) if current["comentario"] else a

    if current:
        questions.append(current)

    for q in questions:
        q["respuesta"] = re.sub(r"\s*\[[\d,\-\s;.a-zA-Z]+\]", "", q["respuesta"]).strip()
        q["comentario"] = re.sub(r"\s*\[[\d,\-\s;.a-zA-Z]+\]", "", q["comentario"]).strip()

    return [q for q in questions if q["id"] >= 1 and len(q["pregunta"]) > 5]


def dedup(questions: list[dict]) -> list[dict]:
    seen: set[int] = set()
    result: list[dict] = []
    for q in questions:
        if q["id"] not in seen:
            seen.add(q["id"])
            result.append(q)
    return sorted(result, key=lambda x: x["id"])


def main():
    ap = argparse.ArgumentParser(description="Scraper YOUCAT")
    ap.add_argument("--db", default=DB_PATH)
    ap.add_argument("--preview", action="store_true")
    args = ap.parse_args()

    all_qs: list[dict] = []

    for url, pid, pname in PAGES:
        print(f"Fetching {url} …", file=sys.stderr)
        html = fetch(url)
        qs = parse_page(html, pid, pname)
        print(f"  → {len(qs)} preguntas", file=sys.stderr)
        all_qs.extend(qs)
        time.sleep(SLEEP_SECS)

    all_qs = dedup(all_qs)
    print(f"\nTotal: {len(all_qs)} preguntas", file=sys.stderr)

    if args.preview:
        for q in all_qs[:10]:
            r = q["respuesta"][:120] if q["respuesta"] else "(none)"
            print(f"  #{q['id']}: {q['pregunta'][:80]} ⇒ {r}")
        return

    conn = sqlite3.connect(args.db)
    c = conn.cursor()
    c.execute("DROP TABLE IF EXISTS youcat")
    c.execute("""CREATE TABLE youcat (
        id INTEGER PRIMARY KEY,
        parte_id INTEGER NOT NULL,
        parte TEXT NOT NULL,
        seccion TEXT NOT NULL DEFAULT '',
        capitulo TEXT NOT NULL DEFAULT '',
        pregunta TEXT NOT NULL,
        respuesta TEXT NOT NULL,
        comentario TEXT NOT NULL DEFAULT ''
    )""")
    for q in all_qs:
        c.execute(
            "INSERT OR IGNORE INTO youcat VALUES (?,?,?,?,?,?,?,?)",
            (q["id"], q["parte_id"], q["parte"], q["seccion"], q["capitulo"], q["pregunta"], q["respuesta"], q["comentario"]),
        )
    conn.commit()
    conn.close()

    ids = sorted({q["id"] for q in all_qs})
    missing = sorted(set(range(1, max(ids) + 1)) - set(ids))
    print(f"\n✅ {len(all_qs)} preguntas escritas en {args.db}")
    if missing:
        print(f"   IDs faltantes: {missing}")


if __name__ == "__main__":
    main()
