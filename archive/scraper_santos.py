"""
Scraper de reseñas biográficas del Misal (curas.com.ar).

Scrapea Biografias01.htm – Biografias12.htm y escribe a la DB.

Uso:
  python3 archive/scraper_santos.py --preview   # mostrar parseo sin escribir
  python3 archive/scraper_santos.py             # escribir a la DB
"""

import sys, re, time, sqlite3, os
import requests
from bs4 import BeautifulSoup

DB_PATH = "AppMovil/assets/iglesia_digital.db"
BASE_URL = "https://www.curas.com.ar/Misal3/Biografias3/Biografias{:02d}.htm"
_UA = "Mozilla/5.0 (compatible; IglesiaDigitalBot/1.0)"
DELAY = 0.5
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

MES_NUM = {m: i + 1 for i, m in enumerate(MESES)}

RE_FECHA = re.compile(r'(\d{1,2})\s+de\s+(' + '|'.join(MESES) + r')', re.I)
RE_NAME = re.compile(r'<b>(.+?)</b>')
RE_CENTER = re.compile(r'<p[^>]*align="?center"?[^>]*>(.*?)</p>', re.DOTALL)
RE_JUSTIFY = re.compile(r'<p[^>]*align="?justify"?[^>]*>(.*?)</p>', re.DOTALL)
RE_ANCHOR = re.compile(r'<a\s+name="(\d+[a-z]?)">')


def fetch(url):
    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=30, headers={
                "User-Agent": _UA,
                "Accept": "text/html,application/xhtml+xml",
            })
            if resp.status_code == 200:
                return resp.text
            print(f"  HTTP {resp.status_code}, retrying...", file=sys.stderr)
        except Exception as e:
            print(f"  Attempt {attempt+1}/3 failed: {e}", file=sys.stderr)
        time.sleep(1)
    return None


def strip_html(text):
    text = re.sub(r'<[^>]+>', ' ', text)
    text = text.replace('&nbsp;', ' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def parse_mes(html, mes_num):
    """Parse all saints from one month's HTML.

    Strategy: find <p align="center"> tags (header) + their following
    <p align="justify"> (bio). Handle the 'O bien:' pattern for second saints.
    """
    santos = []
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    html = re.sub(r'</?font[^>]*>', '', html)

    # Split by <a name="N"> anchors — each block covers one (or two via O bien) saint
    parts = re.split(RE_ANCHOR, html)
    if len(parts) < 3:
        return santos

    # parts[0] = before first anchor, parts[1..] alternate: anchor_name, content
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break
        anchor_name = parts[i]
        content = parts[i + 1]
        dia_match = re.match(r'^(\d+)', anchor_name)
        if not dia_match:
            continue
        dia = int(dia_match.group(1))

        # Split on "O bien:" or "O bien " for alternative saint
        sub_blocks = re.split(r'O\s+bien[:\s]', content, flags=re.I)

        for sub_content in sub_blocks:
            sub_content = sub_content.strip()
            if not sub_content:
                continue

            # Find <b> name — skip if it's a month name
            names = RE_NAME.findall(sub_content)
            candidates = [n.strip() for n in names
                          if n.strip().upper() not in ('JULIO',) and len(n.strip()) > 2]
            if not candidates:
                continue
            nombre = max(candidates, key=len)

            # Find biography in <p align="justify">
            bio_matches = RE_JUSTIFY.findall(sub_content)
            if not bio_matches:
                continue
            biografia = strip_html(bio_matches[0])
            if not biografia:
                continue

            # Find date in the content
            fm = RE_FECHA.search(sub_content)
            if not fm:
                continue
            parsed_mes = MES_NUM.get(fm.group(2).lower())
            if parsed_mes != mes_num:
                continue

            # Sanity: name must appear before bio in the content
            bio_idx = sub_content.find(bio_matches[0])
            name_idx = sub_content.find(nombre)
            if name_idx < 0 or (bio_idx >= 0 and name_idx > bio_idx):
                continue

            # Extract title = strip HTML from text before the bio, remove date and name
            before_bio = sub_content[:sub_content.find(bio_matches[0])] if bio_idx >= 0 else sub_content
            before_bio = strip_html(before_bio)
            before_bio = RE_FECHA.sub('', before_bio)
            before_bio = before_bio.replace(nombre, '', 1)
            titulo = re.sub(r'\s+', ' ', before_bio).strip().strip(' ,.–—;:')

            if titulo and len(titulo) < 3:
                titulo = None

            santos.append({
                'mes': mes_num,
                'dia': dia,
                'nombre': nombre,
                'titulo': titulo,
                'biografia': biografia,
            })

    return santos


def main():
    preview = '--preview' in sys.argv
    todos_santos = []

    for mes in range(1, 13):
        url = BASE_URL.format(mes)
        print(f"Fetching {url}...", file=sys.stderr)
        html = fetch(url)
        if not html:
            print(f"  FAILED to fetch month {mes}", file=sys.stderr)
            continue
        santos = parse_mes(html, mes)
        print(f"  → {len(santos)} saint(s) found", file=sys.stderr)
        todos_santos.extend(santos)
        time.sleep(DELAY)

    if preview:
        for s in todos_santos:
            bio_short = s['biografia'][:120] + '...' if len(s['biografia']) > 120 else s['biografia']
            print(f"{s['mes']:02d}-{s['dia']:02d}  {s['nombre']:40s} | {s['titulo'] or ''}")
            print(f"       {bio_short}")
            print()
        print(f"\nTotal: {len(todos_santos)} saints across 12 months")
        return

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""CREATE TABLE IF NOT EXISTS santos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mes INTEGER NOT NULL,
        dia INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        titulo TEXT,
        biografia TEXT NOT NULL
    )""")
    conn.execute("DELETE FROM santos")

    cur = conn.cursor()
    for s in todos_santos:
        cur.execute(
            "INSERT INTO santos (mes, dia, nombre, titulo, biografia) VALUES (?, ?, ?, ?, ?)",
            (s['mes'], s['dia'], s['nombre'], s['titulo'], s['biografia']),
        )
    conn.commit()
    conn.close()
    print(f"Written {len(todos_santos)} saints to {DB_PATH}")


if __name__ == '__main__':
    main()
