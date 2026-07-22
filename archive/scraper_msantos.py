#!/usr/bin/env python3
"""Scraper de misas de santos desde curas.com.ar.

Parsea Msantos3.{01-12}.htm y extrae oraciones propias
(colecta, ofrendas, postcomunión, antífonas, prefacio)
para cada santo del calendario.

Uso:
    python3 archive/scraper_msantos.py          # escribe en DB
    python3 archive/scraper_msantos.py --preview # solo stats
"""

import re
import sqlite3
import sys
import time
import os

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.curas.com.ar/Misal3/Misas3"
DB_PATH = os.path.join(
    os.path.dirname(__file__), "..", "AppMovil", "assets", "iglesia_digital.db"
)
SLEEP_SEC = 0.3
PREVIEW = "--preview" in sys.argv

MESES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
}

SECTION_MAP = {
    "antífona de entrada": "antifona_entrada",
    "oración colecta": "colecta",
    "oración sobre las ofrendas": "oracion_ofrendas",
    "prefacio": "prefacio",
    "antífona de comunión": "antifona_comunion",
    "oración después de la comunión": "postcomunion",
}

MES_PAT = "(?:" + "|".join(MESES) + ")"

KNOWN_TITLES = {
    "apóstol", "apóstol y evangelista", "apóstoles",
    "obispo", "obispo y doctor de la iglesia", "obispo y mártir",
    "presbítero", "presbítero y doctor de la iglesia",
    "papa", "papa y doctor de la iglesia", "papa y mártir",
    "virgen", "virgen y mártir",
    "mártir", "mártires", "primer mártir",
    "abad", "religioso", "religiosa",
    "fundador", "fundadora",
    "patrono",
}

# ─── Parsing ──────────────────────────────────────────────────────────────────


def _texto_visible(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all(["script", "style"]):
        tag.decompose()
    return soup.get_text("\n")


def parse_month(html: str, mes: int) -> list[dict]:
    text = _texto_visible(html)
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    entries = []
    current = None
    current_lines: list[str] = []

    for line in lines:
        dm = re.match(r"^(\d{1,2})\s+de\s+(" + MES_PAT + r")$", line, re.I)
        if dm:
            if current:
                entry = _parse_blocks(current["mes"], current["dia"], current_lines)
                if entry:
                    entries.append(entry)
            current = {"mes": mes, "dia": int(dm.group(1))}
            current_lines = []
            continue

        if current is not None:
            current_lines.append(line)

    if current:
        entry = _parse_blocks(current["mes"], current["dia"], current_lines)
        if entry:
            entries.append(entry)

    return entries


def _is_title(line: str) -> bool:
    ll = line.lower().strip().rstrip(",")
    if ll in KNOWN_TITLES:
        return True
    if ll.startswith(("obispo", "presbítero", "doctor de la iglesia")):
        return True
    return False


def _is_rango(line: str) -> bool:
    """True si la línea describe el rango litúrgico."""
    ll = line.lower()
    return any(r in ll for r in ["memoria", "fiesta", "solemnidad"])


def _is_country_note(line: str) -> bool:
    ll = line.lower()
    prefixes = (
        "en argentina", "en bolivia", "en chile", "en paraguay",
        "en uruguay", "en colombia", "en perú", "en ecuador",
        "se dice", "puede impartirse", "o bien", "del común",
        "cuando esta solemnidad", "las misas siguientes", "misa de la",
        "bendición y procesión", "bendición solemne",
    )
    return any(ll.startswith(p) for p in prefixes)


def _parse_blocks(mes: int, dia: int, lines: list[str]) -> dict | None:
    header_lines: list[str] = []
    rango = ""
    sections: dict[str, list[str]] = {}
    current_section = None

    for line in lines:
        ll = line.lower().strip()
        if not ll or ll in (",", ".", ":", ";", "—"):
            continue

        # detect section header
        header_field = None
        for hdr, fld in SECTION_MAP.items():
            if ll.startswith(hdr):
                header_field = fld
                break

        if header_field:
            current_section = header_field
            remainder = line[len([h for h in SECTION_MAP if ll.startswith(h)][0]):]
            sections.setdefault(current_section, []).append(remainder.strip())
            continue

        if current_section:
            sections.setdefault(current_section, []).append(line)
        else:
            if _is_rango(line):
                rango = line
            elif _is_country_note(line):
                if not rango:
                    rango = line
            elif _is_title(line):
                # no guardamos título, solo nombre
                pass
            else:
                header_lines.append(line)

    if not header_lines:
        return None

    name = " ".join(header_lines).strip()
    name = name.rstrip(",").strip()
    if not name or len(name) < 2:
        return None

    entry: dict = {
        "mes": mes,
        "dia": dia,
        "nombre": name,
        "titulo": "",
        "rango": rango,
        "antifona_entrada": "",
        "colecta": "",
        "oracion_ofrendas": "",
        "prefacio": "",
        "antifona_comunion": "",
        "postcomunion": "",
    }

    for field in (
        "antifona_entrada", "colecta", "oracion_ofrendas",
        "prefacio", "antifona_comunion", "postcomunion",
    ):
        if field in sections:
            text = " ".join(sections[field])
            text = re.sub(r"\s+", " ", text).strip()
            entry[field] = text

    return entry


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS misal_santos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mes INTEGER NOT NULL,
            dia INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            titulo TEXT,
            rango TEXT,
            antifona_entrada TEXT,
            colecta TEXT,
            oracion_ofrendas TEXT,
            prefacio TEXT,
            antifona_comunion TEXT,
            postcomunion TEXT
        )
    """)

    total_inserted = 0
    total_skipped = 0

    for mes in range(1, 13):
        url = f"{BASE_URL}/Msantos3.{mes:02d}.htm"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.encoding = "utf-8"
            resp.raise_for_status()
        except Exception as e:
            print(f"  [!] Mes {mes:02d}: {e}")
            continue

        entries = parse_month(resp.text, mes)

        for e in entries:
            dup = cur.execute(
                "SELECT id FROM misal_santos WHERE mes = ? AND dia = ? AND nombre = ?",
                (e["mes"], e["dia"], e["nombre"]),
            ).fetchone()
            if dup:
                total_skipped += 1
                continue
            if not PREVIEW:
                cur.execute(
                    """INSERT INTO misal_santos
                    (mes, dia, nombre, titulo, rango, antifona_entrada,
                     colecta, oracion_ofrendas, prefacio, antifona_comunion,
                     postcomunion)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (
                        e["mes"], e["dia"], e["nombre"], e.get("titulo", ""),
                        e.get("rango", ""), e.get("antifona_entrada", ""),
                        e.get("colecta", ""), e.get("oracion_ofrendas", ""),
                        e.get("prefacio", ""), e.get("antifona_comunion", ""),
                        e.get("postcomunion", ""),
                    ),
                )
            total_inserted += 1

        if not PREVIEW:
            conn.commit()

        print(f"  Mes {mes:02d}: {len(entries)} → {total_inserted} nuevos")
        time.sleep(SLEEP_SEC)

    conn.close()

    print(
        f"\nResumen: {total_inserted} insertados, "
        f"{total_skipped} omitidos (duplicados)"
    )


if __name__ == "__main__":
    main()
