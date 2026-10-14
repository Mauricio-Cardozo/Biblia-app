#!/usr/bin/env python3
"""Scrape Biblia de Navarra desde EWTN (https://www.ewtn.com/es/biblia).

Escribe la tabla biblia_navarra en el DB asset (misma estructura que biblia_pueblo_dios).
CLI:
  python3 archive/scraper_biblia_navarra.py            # todo el canon (73 libros, 1328 capitulos)
  python3 archive/scraper_biblia_navarra.py --preview  # solo imprime indice
  python3 archive/scraper_biblia_navarra.py --libros "Génesis,Mateo"  # libros puntuales
"""
import argparse
import html
import json
import re
import sqlite3
import sys
import time
import urllib.request

DB_PATH = "AppMovil/assets/iglesia_digital.db"
BIBLE_URL = "https://www.ewtn.com/es/biblia/{slug}/{cap}"
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
SLEEP_SECS = 0.5

TESTAMENTO = {"old": "Antiguo", "new": "Nuevo"}
NAME_FIX = {"Hechos": "Hechos de los Apóstoles"}

VERSE_RE = re.compile(
    r'<sup>(\d+)</sup></span><span class="text-gray-800">(.*?)</span>',
    re.S,
)

SLUG_RE = re.compile(r'href="(/es/biblia/(\d+)-([a-z0-9-]+)/\d+)"')


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "ignore")


def get_book_index() -> list[dict]:
    """Parseamos el estado React (flight) del index: 73 libros con capitulos."""
    html_page = fetch(BIBLE_URL.replace("{slug}/{cap}", "").replace("es/biblia/", "es/biblia"))
    slugs = {}
    for m in SLUG_RE.finditer(html_page):
        slugs[int(m.group(2))] = m.group(3)

    blocks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', html_page, re.S)
    bible_js = None
    for b in blocks:
        if "Pentateuco" in b and "oldTestament" in b:
            bible_js = b
            break
    if bible_js is None:
        raise RuntimeError("No se encontro el estado bible en el index de EWTN")

    jsstr = json.loads('"' + bible_js + '"')
    start = jsstr.find("{", jsstr.find('"bible"'))
    depth = 0
    end = None
    for k, ch in enumerate(jsstr[start:]):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = start + k + 1
                break
    if end is None:
        raise RuntimeError("JSON bible sin cierre en el index de EWTN")
    obj = json.loads(jsstr[start:end])

    books = []
    for src, label in (("oldTestament", "old"), ("newTestament", "new")):
        for g in obj[src]["groupings"]:
            for bk in g["books"]:
                slug = slugs.get(bk["id"])
                if not slug:
                    raise RuntimeError(f"slug no encontrado para libro id={bk['id']}")
                books.append({
                    "name": NAME_FIX.get(bk["name"], bk["name"]),
                    "slug": f'{bk["id"]}-{slug}',
                    "chapters": bk["chapters"],
                    "testamento": TESTAMENTO[label],
                })
    return books


def parse_verses(html_page: str) -> list[tuple[int, str]]:
    verses = []
    for m in VERSE_RE.finditer(html_page):
        text = html.unescape(m.group(2))
        text = text.replace("\xa0", " ").strip()
        text = re.sub(r"[ \t]+", " ", text)
        verses.append((int(m.group(1)), text))
    return verses


def scrape_book(slug: str, chapters: int) -> list[tuple[int, int, int, str]]:
    """Devuelve [(capitulo, versiculo, capitulo, texto), ...]"""
    rows = []
    for cap in range(1, chapters + 1):
        page = fetch(BIBLE_URL.format(slug=slug, cap=cap))
        verses = parse_verses(page)
        if not verses:
            print(f"  WARN: {slug} cap {cap}: 0 versiculos")
        for vnum, text in verses:
            rows.append((cap, vnum, cap, text))
        if cap % 25 == 0:
            print(f"    cap {cap}/{chapters}")
        time.sleep(SLEEP_SECS)
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true", help="solo listar el indice")
    ap.add_argument("--libros", help="nombres separados por coma (pruebas)")
    args = ap.parse_args()

    books = get_book_index()
    total_chaps = sum(b["chapters"] for b in books)
    print(f"Indice: {len(books)} libros, {total_chaps} capitulos")
    if args.preview:
        for b in books:
            print(f"  {b['name']:<25} {b['chapters']:>4} cap  {b['testamento']}")
        return

    if args.libros:
        names = {n.strip() for n in args.libros.split(",")}
        books = [b for b in books if b["name"] in names]
        print(f"Libros seleccionados: {[b['name'] for b in books]}")

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='biblia_navarra'")
    if cur.fetchone()[0] == 0:
        cur.execute("""CREATE TABLE biblia_navarra (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            libro TEXT NOT NULL,
            capitulo INTEGER NOT NULL,
            versiculo INTEGER NOT NULL,
            texto TEXT NOT NULL,
            testamento TEXT NOT NULL
        )""")
    cur.execute("DELETE FROM biblia_navarra")
    con.commit()

    total = 0
    for b in books:
        print(f"> {b['name']} ({b['testamento']}): {b['chapters']} cap")
        rows = scrape_book(b["slug"], b["chapters"])
        cur.executemany(
            "INSERT INTO biblia_navarra (libro, capitulo, versiculo, texto, testamento) VALUES (?,?,?,?,?)",
            [(b["name"], cap, vnum, text, b["testamento"]) for cap, vnum, _cap, text in rows],
        )
        con.commit()
        total += len(rows)
        print(f"  -> {len(rows)} versiculos")

    con.commit()
    con.close()
    print(f"OK: {total} versiculos en biblia_navarra")


if __name__ == "__main__":
    main()