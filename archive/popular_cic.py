"""
Populate catecismo_cic.capitulo and catecismo_cic.articulo columns
by extracting structural markers embedded in the text.

Each numeral's text often ends with markers like:
  PRIMERA PARTE > PRIMERA SECCIÓN CAPÍTULO SEGUNDO DIOS AL ENCUENTRO DEL HOMBRE
  PRIMERA PARTE > SEGUNDA SECCIÓN > CAPÍTULO SEGUNDO ARTÍCULO 4 "JESUCRISTO PADECIÓ..."

We iterate numerals in id-order and track current capitulo/articulo,
updating each row. After running, the CIC nav will show proper titles.
"""

import re
import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "AppMovil" / "assets" / "iglesia_digital.db"

# ── patterns ──────────────────────────────────────────────────────────────

# Chapter marker: CAPÍTULO X [TITLE] (title must NOT start with ARTÍCULO or PÁRRAFO)
# We match in the last 300 chars of text to avoid false positives.
CAP_PAT = re.compile(
    r"CAPÍTULO\s+(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\s+"
    r"(?!ARTÍCULO|PÁRRAFO)"
    r"([A-ZÁÉÍÓÚÑ\"«\u201C][A-ZÁÉÍÓÚÑa-záéíóúñ\s,;:\"«»\-\u201C\u201D.]+?)"
    r"(?=\s*---PAGE---|\s*$)"
)

# Article marker: ARTÍCULO N [TITLE]
ART_PAT = re.compile(
    r"ARTÍCULO\s+(\d+)\s+"
    r"([A-ZÁÉÍÓÚÑ\"«\u201C][A-ZÁÉÍÓÚÑa-záéíóúñ\s,;:\"«»\-\u201C\u201D.]+?)"
    r"(?=\s*---PAGE---|\s*$)"
)

ROMAN = {
    "PRIMERO": "I", "SEGUNDO": "II", "TERCERO": "III", "CUARTO": "IV",
    "QUINTO": "V", "SEXTO": "VI", "SÉPTIMO": "VII", "OCTAVO": "VIII",
    "NOVENO": "IX", "DÉCIMO": "X",
}


def clean_title(raw: str) -> str:
    """Remove trailing quotes, dots, spaces, PÁRRAFO leftovers."""
    t = raw.strip().rstrip("\"").rstrip("\u201D").rstrip(".").strip()
    return t


def main():
    if not DB_PATH.exists():
        print(f"❌ DB not found: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Drop content-sync triggers that reference non-existent FTS table
    for t in ["catecismo_cic_ai", "catecismo_cic_ad", "catecismo_cic_au"]:
        cur.execute(f"DROP TRIGGER IF EXISTS {t}")

    # Read all numerals in order (with parte, seccion for boundary detection)
    cur.execute("SELECT id, parte, seccion, texto FROM catecismo_cic ORDER BY id")
    rows = cur.fetchall()
    print(f"📖 Procesando {len(rows)} numerales…")

    current_capitulo = ""
    current_articulo = ""
    prev_parte = ""
    prev_seccion = ""
    updates = []

    for num_id, parte, seccion, texto in rows:
        # Reset chapter/article at part/section boundaries
        if parte != prev_parte or seccion != prev_seccion:
            current_capitulo = ""
            current_articulo = ""
            prev_parte = parte
            prev_seccion = seccion

        tail = texto  # search entire text for markers

        # ── check for article marker ──────────────────────────────────
        art_m = ART_PAT.search(tail)
        if art_m:
            num = art_m.group(1)
            title = clean_title(art_m.group(2))
            current_articulo = f"ARTÍCULO {num} — {title}"

        # ── check for chapter marker ───────────────────────────────────
        cap_m = CAP_PAT.search(tail)
        if cap_m:
            word = cap_m.group(1)
            title = clean_title(cap_m.group(2))
            roman = ROMAN.get(word, word)
            current_capitulo = f"CAPÍTULO {roman} — {title}"
            # A new chapter resets the article
            current_articulo = ""

        updates.append((current_capitulo, current_articulo, num_id))

    # Apply all updates
    cur.executemany(
        "UPDATE catecismo_cic SET capitulo = ?, articulo = ? WHERE id = ?",
        updates,
    )
    conn.commit()

    # Stats
    with_cap = sum(1 for c, a, i in updates if c)
    with_art = sum(1 for c, a, i in updates if a)
    print(f"✅  {with_cap} numerales con capítulo, {with_art} con artículo")

    # Show sample
    cur.execute(
        "SELECT id, capitulo, articulo FROM catecismo_cic WHERE capitulo != '' ORDER BY id LIMIT 10"
    )
    print("\n📋 Muestra (primeros 10 con capítulo):")
    for r in cur.fetchall():
        cap = r[1][:50] if r[1] else "(sin capítulo)"
        art = r[2][:50] if r[2] else ""
        print(f"  id={r[0]:>4}: {cap}  |  {art}")

    conn.close()

    print("\n✅  Listo. Reconstruí FTS desde /test en la app o se hará automáticamente al reiniciar.")


if __name__ == "__main__":
    main()
