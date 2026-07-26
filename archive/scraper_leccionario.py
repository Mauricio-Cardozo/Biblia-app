#!/usr/bin/env python3
"""
Scraper del leccionario perpetuo desde curas.com.ar.

Extrae salmo responsorial y aleluya de cada página del leccionario
y los almacena en la tabla `leccionario`.

Uso:
  python3 archive/scraper_leccionario.py           # scrape + guardar en DB
  python3 archive/scraper_leccionario.py --preview # solo mostrar stats (sin fetch)
  python3 archive/scraper_leccionario.py --match   # solo emparejar con lecturas existentes
"""

import html
import argparse
import re
import sqlite3
import time
import urllib.error
import urllib.request

DB_PATH = "AppMovil/assets/iglesia_digital.db"
BASE = "https://www.curas.com.ar/Leccionarios"
USER_AGENT = "Mozilla/5.0 (compatible; IglesiaDigital/1.0)"
SLEEP = 0.3

ROMAN = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
    'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13,
    'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18, 'XIX': 19,
    'XX': 20, 'XXI': 21, 'XXII': 22, 'XXIII': 23, 'XXIV': 24, 'XXV': 25,
    'XXVI': 26, 'XXVII': 27, 'XXVIII': 28, 'XXIX': 29, 'XXX': 30,
    'XXXI': 31, 'XXXII': 32, 'XXXIII': 33, 'XXXIV': 34,
}


def roman_to_int(s: str) -> int:
    return ROMAN.get(s.upper(), 0)


def fetch(url: str) -> str:
    time.sleep(SLEEP)
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        print(f"  [WARN] HTTP {e.code} {url}")
        return ""
    except Exception as e:
        print(f"  [WARN] {e} {url}")
        return ""


def extract_text(raw: str) -> str:
    raw = raw.replace('<br>', '\n').replace('<br/>', '\n').replace('<br />', '\n')
    raw = re.sub(r'<script[^>]*>.*?</script>', '', raw, flags=re.DOTALL)
    raw = re.sub(r'<[^>]+>', '', raw)
    text = re.sub(r'\n[ \t]+', '\n', raw)
    return html.unescape(text)


def extract_sections(text: str) -> dict:
    salmo = ""
    aleluia = ""

    salmo_pos = text.upper().find('SALMO')
    aleluia_pos = text.upper().find('ALELUIA')
    evang_pos = text.upper().find('EVANGELIO')

    if salmo_pos >= 0:
        start = text.find('\n', salmo_pos) + 1
        if start <= 0:
            start = salmo_pos + 5
        if aleluia_pos > salmo_pos:
            end = text.rfind('\n', 0, aleluia_pos)
            salmo = text[start:end].strip() if end > start else text[start:].strip()
        elif evang_pos > salmo_pos:
            end = text.rfind('\n', 0, evang_pos)
            salmo = text[start:end].strip() if end > start else text[start:].strip()
        if salmo:
            salmo = re.sub(r'\n{3,}', '\n\n', salmo)

    if aleluia_pos >= 0:
        start = text.find('\n', aleluia_pos) + 1
        if start <= 0:
            start = aleluia_pos + 7
        if evang_pos > aleluia_pos:
            end = text.rfind('\n', 0, evang_pos)
            aleluia = text[start:end].strip() if end > start else text[start:].strip()
        else:
            aleluia = text[start:].strip()
        if aleluia:
            aleluia = re.sub(r'\n{3,}', '\n\n', aleluia)

    return {"salmo": salmo, "aleluia": aleluia}


def extract_links(html: str) -> list[str]:
    links = []
    for m in re.finditer(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE):
        href = m.group(1)
        if any(href.startswith(p) or ('Leccionarios' in href) for p in
               ['Tiempos/', 'Santoral/', 'Dominical/', 'Ferial/']):
            url = href if href.startswith('http') else BASE + '/' + href.lstrip('/')
            if url not in links:
                links.append(url)
    return links


def scrape_all() -> list[dict]:
    print("Fetching index pages...")
    idx_urls = [f"{BASE}/{p}" for p in ["Domingos.htm", "Ferias.htm", "Santos.htm"]]
    all_links = []
    for url in idx_urls:
        html = fetch(url)
        if html:
            links = extract_links(html)
            all_links.extend(links)
            print(f"  {url.split('/')[-1]}: {len(links)} links")
        else:
            print(f"  {url.split('/')[-1]}: FAILED")

    all_links = list(dict.fromkeys(all_links))  # dedup preserve order
    print(f"\nTotal unique pages: {len(all_links)}")

    results = []
    for i, url in enumerate(all_links):
        print(f"  [{i+1}/{len(all_links)}] {url.split('/')[-1][:50]}")
        html = fetch(url)
        if not html:
            continue
        text = extract_text(html)
        sec = extract_sections(text)
        results.append({"url": url, "salmo": sec["salmo"], "aleluia": sec["aleluia"]})
        if sec["salmo"]:
            print(f"    salmo={len(sec['salmo'])}c aleluia={len(sec['aleluia'])}c")

    return results


def save_to_db(results: list[dict]):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS leccionario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE,
            salmo TEXT DEFAULT '',
            aleluia TEXT DEFAULT ''
        )
    """)
    conn.execute("DELETE FROM leccionario")
    conn.executemany(
        "INSERT OR REPLACE INTO leccionario (url, salmo, aleluia) VALUES (:url, :salmo, :aleluia)",
        results
    )
    conn.commit()
    cur = conn.execute("""
        SELECT COUNT(*) as c,
               SUM(CASE WHEN salmo != '' THEN 1 ELSE 0 END) as s,
               SUM(CASE WHEN aleluia != '' THEN 1 ELSE 0 END) as a
        FROM leccionario
    """)
    r = cur.fetchone()
    print(f"\nDB: {r[0]} rows, {r[1]} con salmo, {r[2]} con aleluia")
    conn.close()


# ─── matching ──────────────────────────────────────────────────────────────

LITURGICAL_YEAR_CYCLE = {2023: 'A', 2024: 'B', 2025: 'C', 2026: 'A', 2027: 'B', 2028: 'C', 2029: 'A'}


def match_lecturas():
    conn = sqlite3.connect(DB_PATH)

    cur = conn.execute("SELECT id, fecha, titulo_misa FROM lecturas WHERE (salmo IS NULL OR salmo = '')")
    rows = cur.fetchall()
    print(f"\nLecturas sin salmo/aleluia: {len(rows)}")

    lecc = conn.execute("SELECT url, salmo, aleluia FROM leccionario").fetchall()
    url_to_data = {r[0]: {"salmo": r[1], "aleluia": r[2]} for r in lecc}

    updated = 0
    for row_id, fecha, titulo in rows:
        match = find_match(titulo, fecha, url_to_data)
        if match:
            conn.execute(
                "UPDATE lecturas SET salmo = ?, aleluia = ? WHERE id = ?",
                (match["salmo"], match["aleluia"], row_id)
            )
            updated += 1

    conn.commit()
    print(f"Actualizadas: {updated}")
    conn.close()


def find_match(titulo: str | None, fecha: str, url_to_data: dict) -> dict | None:
    if not titulo:
        return None
    t = titulo.lower()

    has_dom = "domingo" in t
    year_cycle = LITURGICAL_YEAR_CYCLE.get(int(fecha[:4]), "")

    season = None
    if "adviento" in t:
        season = "adviento"
    elif "navidad" in t:
        season = "navidad"
    elif "cuaresma" in t or "ceniza" in t or "santo" in t:
        season = "cuaresma"
    elif "pascua" in t or "pentecost" in t:
        season = "pascua"
    elif "ordinario" in t or "durante el año" in t:
        season = "ordinario"

    if not season:
        return None

    week_num = 0
    m = re.search(r'\b([IVXLCDM]{1,6})\b', titulo.upper())
    if m:
        week_num = roman_to_int(m.group(1))

    if not week_num and season:
        for ordinal, num in [
            ("primera", 1), ("primero", 1), ("segunda", 2), ("segundo", 2),
            ("tercera", 3), ("tercero", 3), ("cuarta", 4), ("cuarto", 4),
            ("quinta", 5), ("quinto", 5),
        ]:
            if ordinal in t:
                week_num = num
                break

    # Build search patterns for URL matching
    candidates = []
    for url in url_to_data:
        url_lower = url.lower()
        score = 0

        if has_dom and ("dominical" in url_lower or "dgo" in url_lower):
            score += 10

        if season == "adviento" and "adviento" in url_lower:
            score += 10
        elif season == "navidad" and "navidad" in url_lower:
            score += 10
        elif season == "cuaresma" and "cuaresma" in url_lower:
            score += 10
        elif season == "pascua" and "pascua" in url_lower:
            score += 10
        elif season == "ordinario" and "dgo" in url_lower:
            score += 10

        if week_num:
            # check for week number in URL
            wstr = str(week_num).zfill(2)
            if wstr in url_lower:
                score += 8

        if has_dom and year_cycle:
            y = year_cycle.lower()
            if url_lower.endswith(y + ".htm"):
                score += 12
            elif url_lower.endswith(y + ".htm"):
                score += 12

        if score > 0:
            candidates.append((score, url))

    if not candidates:
        return None

    candidates.sort(key=lambda x: -x[0])
    best_url = candidates[0][1]
    return url_to_data[best_url]


def preview_stats():
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("""
            SELECT COUNT(*) as c,
                   SUM(CASE WHEN salmo != '' THEN 1 ELSE 0 END) as s,
                   SUM(CASE WHEN aleluia != '' THEN 1 ELSE 0 END) as a
            FROM leccionario
        """)
        r = cur.fetchone()
        print(f"leccionario: {r[0]} rows, {r[1]} con salmo, {r[2]} con aleluia")
    except Exception:
        print("leccionario: no table yet")

    cur = conn.execute("SELECT COUNT(*) FROM lecturas WHERE (salmo IS NULL OR salmo = '')")
    print(f"lecturas sin completar: {cur.fetchone()[0]}")
    conn.close()


# ─── main ──────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true", help="mostrar stats de DB")
    ap.add_argument("--match", action="store_true", help="solo emparejar con lecturas")
    args = ap.parse_args()

    if args.preview:
        preview_stats()
        return

    if args.match:
        match_lecturas()
        return

    results = scrape_all()
    save_to_db(results)
    match_lecturas()


if __name__ == "__main__":
    main()
