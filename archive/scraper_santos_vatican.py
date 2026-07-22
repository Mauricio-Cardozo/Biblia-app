#!/usr/bin/env python3
"""Scraper de santos desde Vatican News.

Itera los 366 días del año y extrae nombre(s) + biografía corta
de /es/santos/{MM}/{DD}.html. Inserta en la tabla santos de iglesia_digital.db.

Uso:
    python3 archive/scraper_santos_vatican.py          # escribe en DB
    python3 archive/scraper_santos_vatican.py --preview # solo stats
"""

import sqlite3
import sys
import time
import os

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.vaticannews.va/es/santos"
DB_PATH = os.path.join(
    os.path.dirname(__file__), "..", "AppMovil", "assets", "iglesia_digital.db"
)
SLEEP_SEC = 0.7
PREVIEW = "--preview" in sys.argv

MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
}


def parse_saints(html: str, mes: int, dia: int) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    sections = soup.find_all("section", class_="section--isStatic")
    saints = []
    for sec in sections:
        h2 = sec.find("h2")
        if not h2:
            continue
        raw = h2.get_text(strip=True)
        if not raw or len(raw) < 3:
            continue
        name = raw[0].upper() + raw[1:] if raw else raw
        content_div = sec.find("div", class_="section__content")
        bio = ""
        if content_div:
            p = content_div.find("p")
            if p:
                bio = p.get_text(strip=True)
        saints.append({"nombre": name, "biografia": bio})
    return saints


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    total_inserted = 0
    total_days = 0
    total_empty = 0

    for mes in range(1, 13):
        days = MONTH_DAYS[mes - 1]
        for dia in range(1, days + 1):
            url = f"{BASE_URL}/{mes:02d}/{dia:02d}.html"
            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                if resp.status_code == 404:
                    total_empty += 1
                    continue
                resp.raise_for_status()
                resp.encoding = "utf-8"
            except Exception as e:
                print(f"  [!] {mes:02d}/{dia:02d}: {e}")
                time.sleep(SLEEP_SEC)
                continue

            saints = parse_saints(resp.text, mes, dia)
            if not saints:
                total_empty += 1
                continue

            total_days += 1

            for s in saints:
                    dup = cur.execute(
                        "SELECT id FROM santos WHERE mes = ? AND dia = ? AND nombre = ?",
                        (mes, dia, s["nombre"]),
                    ).fetchone()
                    if dup:
                        continue
                    if not PREVIEW:
                        cur.execute(
                            "INSERT INTO santos (mes, dia, nombre, biografia) VALUES (?, ?, ?, ?)",
                            (mes, dia, s["nombre"], s["biografia"]),
                        )
                    total_inserted += 1

            if not PREVIEW:
                conn.commit()

            if not PREVIEW:
                print(f"  {mes:02d}/{dia:02d}: {len(saints)} → {total_inserted} nuevos")

            time.sleep(SLEEP_SEC)

    conn.close()

    print(
        f"\nResumen: {total_days} días con datos, "
        f"{total_inserted} insertados, "
        f"{total_empty} días sin contenido"
    )


if __name__ == "__main__":
    main()
