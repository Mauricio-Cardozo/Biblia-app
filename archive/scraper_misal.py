"""
Scraper del Misal Romano (Mexico version) from LiturgiaPapal PDFs.
Parses Ordinario, Propio del Tiempo, Prefacios, and Plegarias Eucarísticas.
Output: structured JSON + SQLite inserts.
"""

import json
import os
import re
import sqlite3

import pdfplumber

PDF_DIR = os.path.join(os.path.dirname(__file__), "misal_pdfs")
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "AppMovil", "assets", "iglesia_digital.db")


# ─── Helpers ─────────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Remove lone numbers at line start, collapse whitespace."""
    lines = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # remove page numbers / lone numerical lines
        if re.match(r'^\d{1,3}$', line):
            continue
        lines.append(line)
    return " ".join(lines)


def extract_pages(pdf_path: str) -> str:
    """Extract all text from a PDF, joining pages."""
    parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t)
    return "\n---PAGE---\n".join(parts)


# ─── Ordinario Parser ────────────────────────────────────────────────────────

ROLE_PATTERNS = [
    (r'^\s*El sacerdote dice:\s*$', 'presidente'),
    (r'^\s*El diácono dice:\s*$', 'diacono'),
    (r'^\s*El lector dice:\s*$', 'lector'),
    (r'^\s*El pueblo responde:\s*$', 'asamblea'),
    (r'^\s*Todos:\s*$', 'asamblea'),
    (r'^\s*V/\.\s*', 'presidente'),
    (r'^\s*R/\.\s*', 'asamblea'),
]

SECTION_ORDINARIO = [
    ("Ritos Iniciales", ["Iniciales.pdf"]),
    ("Liturgia de la Palabra", ["Palabra.pdf"]),
    ("Liturgia Eucarística", ["LiturgiaEucaristica.pdf"]),
    ("Rito de la Comunión", ["Comunion.pdf"]),
    ("Rito de Conclusión", ["Conclusion.pdf"]),
    ("Ordinario completo", ["Ordinario%20de%20la%20Misa%20Me%CC%81xico.pdf"]),
]


def parse_ordinario() -> list[dict]:
    """Parse all Ordinario PDFs into structured sections."""
    items = []
    order = 0
    for section_name, filenames in SECTION_ORDINARIO:
        for fn in filenames:
            path = os.path.join(PDF_DIR, fn)
            if not os.path.exists(path):
                print(f"  [SKIP] {fn} not found")
                continue
            print(f"  Parsing {fn}...")
            text = extract_pages(path)
            blocks = re.split(r'\n(?=\d+\.\s)', text)
            current_sub = section_name
            for block in blocks:
                block = block.strip()
                if not block:
                    continue
                # detect sub-section heading (all caps)
                first_line = block.split("\n")[0].strip()
                if first_line.isupper() and len(first_line) > 4:
                    current_sub = first_line.title()
                    continue
                lines = block.split("\n")
                role = "rubrica"
                text_parts = []
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    matched = False
                    for pat, r in ROLE_PATTERNS:
                        if re.match(pat, line, re.IGNORECASE):
                            role = r
                            matched = True
                            break
                    if not matched:
                        text_parts.append(line)
                full_text = clean_text(" ".join(text_parts))
                if full_text:
                    order += 1
                    items.append({
                        "seccion": section_name,
                        "subseccion": current_sub,
                        "rol": role,
                        "texto": full_text,
                        "orden": order,
                    })
    return items


# ─── Propio del Tiempo Parser ────────────────────────────────────────────────

PROPIO_FILES = [
    ("Adviento", "Adviento.pdf", "adviento"),
    ("Navidad", "Navidad.pdf", "navidad"),
    ("Cuaresma", "Cuaresma.pdf", "cuaresma"),
    ("Pascua", "Pascua.pdf", "pascua"),
    ("Tiempo Ordinario", "Ordinario.pdf", "ordinario"),
]

RN = r'[IVXLCDM]{1,6}'

RE_DAY_LINE = re.compile(
    rf'^('
    rf'{RN}\s+(?:DOMINGO|SEMANA)\s+.*'
    rf'|'
    rf'(?:Lunes|Martes|Miércoles|Jueves|Viernes|Sábado)\s+{RN}\s+.*'
    rf'|'
    rf'(?:JUEVES|VIERNES|SÁBADO)\s+SANTO'
    rf'|'
    rf'(?:DOMINGO|Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado)\s+(?:DE\s+)?(?:PASCUA|RESURRECCIÓN|Pascua|Resurrección|Pentecostés).*'
    rf'|'
    rf'{RN}\s+Semana\s+.*'
    rf')'
    rf'$',
    re.MULTILINE | re.IGNORECASE,
)


def _extract_prayers(content: str) -> dict:
    """Extract prayer fields from a content block."""
    entry = {
        "colecta": "",
        "oracion_ofrendas": "",
        "postcomunion": "",
        "prefacio": "",
        "antifona_entrada": "",
        "antifona_comunion": "",
    }
    for label, key in [
        ("Antífona de entrada", "antifona_entrada"),
        ("Oración colecta", "colecta"),
        ("Oración sobre las ofrendas", "oracion_ofrendas"),
        ("Oración después de la comunión", "postcomunion"),
        ("Antífona de la comunión", "antifona_comunion"),
    ]:
        m = re.search(
            rf'{re.escape(label)}\s*[^\n]*\n(.*?)(?=\n(?:Oración sobre las ofrendas|Oración después de la comunión|Antífona de la comunión|Prefacio|Antífona de entrada|Oración colecta|Oración después de la comunión|No se dice|$))',
            content, re.DOTALL | re.IGNORECASE,
        )
        if m:
            entry[key] = clean_text(m.group(1))
    m = re.search(r'Prefacio\s+([^\n]+)', content)
    if m:
        entry["prefacio"] = m.group(1).strip()
    return entry


def _pair_headers(text: str) -> list[tuple[int, int, str]]:
    """Find day header positions in text using RE_DAY_LINE."""
    headers = []
    for m in RE_DAY_LINE.finditer(text):
        h = m.group(1).strip()
        if h and len(h) < 60:
            headers.append((m.start(), m.end(), h))
    return headers


def parse_propio_navidad() -> list[dict]:
    """Parse Navidad PDF (date-based format, different from other seasons)."""
    path = os.path.join(PDF_DIR, "Navidad.pdf")
    if not os.path.exists(path):
        return []
    print("  Parsing Navidad.pdf (special parser)...")
    text = extract_pages(path)
    text = re.sub(r'_{4,}', '\n', text)
    text = re.sub(r'(?i)\n\s*(?:Propio del tiempo|Navidad|liturgiapapal\.org)\s*\n', '\n', text)
    text = re.sub(r'\n---PAGE---\n', '\n', text)

    # Split into blocks at known Navidad entry boundaries
    block_starts = []
    for m in re.finditer(
        r'(?im)^('
        r'\d{1,2}\s+de\s+(?:DICIEMBRE|diciembre|ENERO|enero)\s*\.?'
        r'|'
        r'LA\s+(?:NATIVIDAD|SAGRADA|EPIFANÍA)\s+DEL\s+SEÑOR'
        r'|'
        r'LA SAGRADA FAMILIA DE JESÚS, MARÍA Y JOSÉ'
        r'|'
        r'SOLEMNIDAD DE SANTA MARÍA, MADRE DE DIOS'
        r'|'
        r'EL BAUTISMO DEL SEÑOR'
        r'|'
        r'FERIAS DEL TIEMPO DE NAVIDAD'
        r'|'
        r'Domingo dentro de la octava de Navidad[^,]*'
        r'|'
        r'II DOMINGO DESPÚES DE NAVIDAD'
        r')',
        text,
    ):
        s = m.group(1).strip()
        if len(s) < 6:
            continue
        block_starts.append((m.start(), s))

    if not block_starts:
        return []

    # Build prefixes: combine date + feast names
    # Build one prefix per block_start
    prefixes = []
    for _, name in block_starts:
        if re.match(r'\d{1,2}\s+de\s+', name):
            prefixes.append(name.rstrip("."))
        elif name.startswith("FERIAS"):
            prefixes.append("FERIAS DEL TIEMPO DE NAVIDAD")
        elif name.startswith("Domingo dentro"):
            prefixes.append("Domingo dentro de la Octava - Sagrada Familia")
        elif name == "II DOMINGO DESPÚES DE NAVIDAD":
            prefixes.append(name)
        else:
            prefixes.append(name)

    entries = []
    for idx, (pos, name) in enumerate(block_starts):
        end_pos = block_starts[idx + 1][0] if idx + 1 < len(block_starts) else len(text)
        content = text[pos:end_pos].strip()
        prefix = prefixes[idx]

        # If this is a feast name, prepend the previous block if it was a date or "Domingo dentro"
        if idx > 0 and not re.match(r'\d{1,2}|Domingo', prefix) and any(f in prefix for f in ["NATIVIDAD", "SAGRADA", "EPIFANÍA", "SOLEMNIDAD", "BAUTISMO"]):
            prev_name = block_starts[idx - 1][1]
            if re.match(r'\d{1,2}\s+de\s+', prev_name) or prev_name.startswith("Domingo dentro"):
                prev_label = prefixes[idx - 1]
                # Skip if previous already contains the essence of current feast name
                feast_key = re.sub(r'^(?:LA\s+)?(?:SOLEMNIDAD\s+DE\s+)?(\w+).*', r'\1', prefix.strip()).lower()
                if feast_key and feast_key in prev_label.lower():
                    prefix = prev_label
                elif not any(f in prev_label for f in ["NATIVIDAD", "SAGRADA", "EPIFANÍA", "SOLEMNIDAD", "BAUTISMO"]):
                    prefix = f"{prev_label} - {prefix}"

        # Skip FERIAS section (handled separately)
        if name.startswith("FERIAS"):
            continue

        # Check for multiple masses
        masses = re.split(r'\n(?=Misa\s+(?:de\s+)?(?:la\s+)?(?:vespertina|de\s+la\s+noche|de\s+la\s+medianoche|de\s+la\s+aurora|de\s+la\s+mañana|del\s+día|del\s+alba)\s)', content, flags=re.IGNORECASE)

        if len(masses) > 1:
            for i, mass_block in enumerate(masses):
                if i == 0:
                    continue  # Skip text before first mass indicator
                mass_lines = mass_block.strip().split("\n")
                mass_name = mass_lines[0].strip().rstrip(".")
                mass_text = "\n".join(mass_lines[1:])
                prayers = _extract_prayers(mass_text)
                if prayers["colecta"] or prayers["oracion_ofrendas"]:
                    entries.append({
                        "temporada": "navidad",
                        "temporada_label": "Navidad",
                        "dia": f"{prefix} ({mass_name})",
                        **prayers,
                    })
        else:
            prayers = _extract_prayers(content)
            if prayers["colecta"] or prayers["oracion_ofrendas"]:
                entries.append({
                    "temporada": "navidad",
                    "temporada_label": "Navidad",
                    "dia": prefix,
                    **prayers,
                })

    # Handle weekday ferias: each weekday has 2 colecta variants (antes/después de Epifanía)
    ferias_idx = next((i for i, (_, n) in enumerate(block_starts) if n.startswith("FERIAS")), -1)
    if ferias_idx >= 0:
        ferias_pos = block_starts[ferias_idx][0]
        ferias_end = block_starts[ferias_idx + 1][0] if ferias_idx + 1 < len(block_starts) else len(text)
        ferias_text = text[ferias_pos:ferias_end]
        ferias_text = re.sub(r'(?i)\n\s*(?:Propio del tiempo|Navidad|liturgiapapal\.org)\s*\n', '\n', ferias_text)

        # Split by weekday
        ferias_lines = ferias_text.split("\n")
        day_blocks: dict[str, list[str]] = {}
        current_day = None
        for line in ferias_lines:
            s = line.strip()
            if s in ("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"):
                current_day = s
                day_blocks.setdefault(current_day, [])
            elif current_day:
                day_blocks[current_day].append(line)

        for day_name, lines in day_blocks.items():
            chunk = "\n".join(lines).strip()

            # Extract shared prayers (antifona, ofrendas, comunión, postcomunión)
            base = _extract_prayers(chunk)

            # Extract the two colecta variants
            antes_m = re.search(r'Oración colecta antes de Epifanía\s*\n(.*?)(?=\nOración colecta después de Epifanía)', chunk, re.DOTALL | re.IGNORECASE)
            despues_m = re.search(r'Oración colecta después de Epifanía\s*\n(.*?)(?=\nOración sobre las ofrendas)', chunk, re.DOTALL | re.IGNORECASE)

            if antes_m:
                entry = {**base, "colecta": clean_text(antes_m.group(1))}
                if entry["colecta"]:
                    entries.append({
                        "temporada": "navidad",
                        "temporada_label": "Navidad",
                        "dia": f"{day_name} (antes de Epifanía)",
                        **entry,
                    })
            if despues_m:
                entry = {**base, "colecta": clean_text(despues_m.group(1))}
                if entry["colecta"]:
                    entries.append({
                        "temporada": "navidad",
                        "temporada_label": "Navidad",
                        "dia": f"{day_name} (después de Epifanía)",
                        **entry,
                    })

    return entries


def parse_propio() -> list[dict]:
    """Parse all Propio del Tiempo PDFs."""
    entries = []
    for season_label, filename, season_slug in PROPIO_FILES:
        path = os.path.join(PDF_DIR, filename)
        if not os.path.exists(path):
            print(f"  [SKIP] {filename} not found")
            continue

        # Navidad uses a special parser
        if season_slug == "navidad":
            entries.extend(parse_propio_navidad())
            continue

        print(f"  Parsing {filename}...")
        text = extract_pages(path)

        # Clean: remove horizontal rules, headers, footers, page markers
        text = re.sub(r'_{4,}', '\n', text)
        text = re.sub(r'(?i)\n\s*(?:Propio del tiempo|Adviento|Navidad|Cuaresma|Pascua|Tiempo Ordinario|liturgiapapal\.org|Sagrado Triduo Pascual)\s*\n', '\n', text)
        text = re.sub(r'\n---PAGE---\n', '\n', text)

        # Find all day header positions
        headers = _pair_headers(text)

        if not headers:
            print(f"  ⚠ No day headers found in {filename}")
            continue

        # Pair each header with the text until the next header
        for idx, (start, end, header) in enumerate(headers):
            content_start = end
            content_end = headers[idx + 1][0] if idx + 1 < len(headers) else len(text)
            content = text[content_start:content_end].strip()

            entry = {
                "temporada": season_slug,
                "temporada_label": season_label,
                "dia": re.sub(r'\s+', ' ', header).strip().rstrip("."),
                **_extract_prayers(content),
            }

            if entry["colecta"] or entry["oracion_ofrendas"]:
                entries.append(entry)

    # Deduplicate: keep only first occurrence of same normalized name
    seen = set()
    filtered = []
    for e in entries:
        key = e["dia"].lower().strip().rstrip(".").replace("resurrección", "pascua")
        # Remove redundant "VI semana" entry (duplicates Lunes–Sábado VI)
        if re.match(r'^vi\s+semana', key):
            continue
        if key not in seen:
            seen.add(key)
            filtered.append(e)

    return filtered


# ─── Prefacios Parser ────────────────────────────────────────────────────────

def parse_prefacios() -> list[dict]:
    """Parse the Prefacios PDF."""
    path = os.path.join(PDF_DIR, "Prefacios.pdf")
    if not os.path.exists(path):
        print("  [SKIP] Prefacios.pdf not found")
        return []
    print("  Parsing Prefacios.pdf...")
    text = extract_pages(path)

    prefaces = []
    # Each preface starts with "PREFACIO" and a number/name
    blocks = re.split(r'\n(?=PREFACIO\s)', text)
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        lines = block.split("\n")
        title = lines[0].strip()
        body = clean_text("\n".join(lines[1:]))
        if body:
            prefaces.append({
                "titulo": title,
                "texto": body,
            })
    return prefaces


# ─── Plegarias Eucarísticas Parser ───────────────────────────────────────────

PLEGARIAS = [
    ("Plegaria Eucarística I", "PEI.pdf"),
    ("Plegaria Eucarística II", "PEII.pdf"),
    ("Plegaria Eucarística III", "PEIII.pdf"),
    ("Plegaria Eucarística IV", "PEIV.pdf"),
]


def parse_plegarias() -> list[dict]:
    """Parse Eucharistic Prayer PDFs."""
    prayers = []
    for name, filename in PLEGARIAS:
        path = os.path.join(PDF_DIR, filename)
        if not os.path.exists(path):
            print(f"  [SKIP] {filename} not found")
            continue
        print(f"  Parsing {filename}...")
        text = extract_pages(path)
        prayers.append({
            "nombre": name,
            "texto": text,
        })
    return prayers


# ─── DB Write ─────────────────────────────────────────────────────────────────

def ensure_tables(conn: sqlite3.Connection):
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS misal_ordinario (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            seccion TEXT NOT NULL,
            subseccion TEXT,
            rol TEXT NOT NULL DEFAULT 'rubrica',
            texto TEXT NOT NULL,
            orden INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS misal_propio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temporada TEXT NOT NULL,
            temporada_label TEXT,
            dia TEXT,
            colecta TEXT,
            oracion_ofrendas TEXT,
            postcomunion TEXT,
            prefacio TEXT,
            antifona_entrada TEXT,
            antifona_comunion TEXT
        );

        CREATE TABLE IF NOT EXISTS misal_prefacios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            texto TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS misal_plegarias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            texto TEXT NOT NULL
        );
    """)
    conn.commit()


def write_to_db(conn: sqlite3.Connection, data: dict):
    cur = conn.cursor()

    # Clear existing data
    for table in ["misal_ordinario", "misal_propio", "misal_prefacios", "misal_plegarias"]:
        cur.execute(f"DELETE FROM {table}")

    # Ordinario
    for item in data.get("ordinario", []):
        cur.execute(
            "INSERT INTO misal_ordinario (seccion, subseccion, rol, texto, orden) VALUES (?, ?, ?, ?, ?)",
            [item["seccion"], item["subseccion"], item["rol"], item["texto"], item["orden"]],
        )

    # Propio
    for item in data.get("propio", []):
        cur.execute(
            "INSERT INTO misal_propio (temporada, temporada_label, dia, colecta, oracion_ofrendas, postcomunion, prefacio, antifona_entrada, antifona_comunion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                item["temporada"],
                item["temporada_label"],
                item["dia"],
                item["colecta"],
                item["oracion_ofrendas"],
                item["postcomunion"],
                item["prefacio"],
                item["antifona_entrada"],
                item["antifona_comunion"],
            ],
        )

    # Prefacios
    for item in data.get("prefacios", []):
        cur.execute(
            "INSERT INTO misal_prefacios (titulo, texto) VALUES (?, ?)",
            [item["titulo"], item["texto"]],
        )

    # Plegarias
    for item in data.get("plegarias", []):
        cur.execute(
            "INSERT INTO misal_plegarias (nombre, texto) VALUES (?, ?)",
            [item["nombre"], item["texto"]],
        )

    conn.commit()


# ─── Main ────────────────────────────────────────────────────────────────────

def main(preview=False):
    print("=" * 60)
    print("MISAL ROMANO SCRAPER")
    print("=" * 60)

    # 1. Ordinario
    print("\n[1/4] Parseando Ordinario de la Misa...")
    ordinario = parse_ordinario()
    print(f"  → {len(ordinario)} bloques extraídos")

    # 2. Propio del Tiempo
    print("\n[2/4] Parseando Propio del Tiempo...")
    propio = parse_propio()
    print(f"  → {len(propio)} días litúrgicos extraídos")

    # 3. Prefacios
    print("\n[3/4] Parseando Prefacios...")
    prefaces = parse_prefacios()
    print(f"  → {len(prefaces)} prefacios extraídos")

    # 4. Plegarias
    print("\n[4/4] Parseando Plegarias Eucarísticas...")
    prayers = parse_plegarias()
    print(f"  → {len(prayers)} plegarias extraídas")

    data = {
        "ordinario": ordinario,
        "propio": propio,
        "prefacios": prefaces,
        "plegarias": prayers,
    }

    if preview:
        print("\n" + "=" * 60)
        print("PREVIEW")
        print("=" * 60)
        for key, items in data.items():
            print(f"\n{key}: {len(items)} items")
            if items:
                print(f"  First item keys: {list(items[0].keys())}")
                if key == "ordinario":
                    print(f"  Sample: [{items[0]['seccion']}] {items[0]['rol']}: {items[0]['texto'][:80]}...")
                elif key == "propio":
                    print(f"  Sample: {items[0]['temporada']} - {items[0]['dia']}")
                elif key == "prefacios":
                    print(f"  Sample: {items[0]['titulo']}")
                elif key == "plegarias":
                    print(f"  Sample: {items[0]['nombre']}")
        return

    # Write DB
    print("\n" + "=" * 60)
    print("Escribiendo a la base de datos...")
    db_path = DB_PATH
    if not os.path.exists(db_path):
        print(f"  [ERROR] DB not found at {db_path}")
        return
    conn = sqlite3.connect(db_path)
    ensure_tables(conn)
    write_to_db(conn, data)
    conn.close()
    print("  ✅ Misal Romano insertado correctamente en la DB")
    print(f"     • Ordinario: {len(ordinario)} bloques")
    print(f"     • Propio: {len(propio)} días")
    print(f"     • Prefacios: {len(prefaces)}")
    print(f"     • Plegarias: {len(prayers)}")


if __name__ == "__main__":
    import sys
    preview = "--preview" in sys.argv
    main(preview=preview)
