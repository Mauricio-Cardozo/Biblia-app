"""
Scraper del YOUCAT (Catecismo Joven de la Iglesia Católica)
3 fases independientes: extract → clean → parse

Uso:
    python archive/scraper_youcat.py extract          # Fase 1: extrae páginas a JSON
    python archive/scraper_youcat.py clean            # Fase 2: separa columnas, filtra sidebar
    python archive/scraper_youcat.py parse --preview  # Fase 3: detecta preguntas, preview
    python archive/scraper_youcat.py parse --db       # Fase 3: escribe DB + FTS
"""

import re, json, sqlite3, argparse, sys, os

try:
    import pdfplumber
except ImportError:
    print("[ERROR] Instalá pdfplumber: pip install pdfplumber --break-system-packages")
    sys.exit(1)


# ─── Config ───────────────────────────────────────────────────────────────────

DEFAULT_PDF = "archive/youcat.pdf"
DEFAULT_DB  = "AppMovil/assets/iglesia_digital.db"
TABLE       = "youcat"
SKIP_BEFORE = 14

RAW_PATH    = "archive/paginas_raw.json"
CLEAN_PATH  = "archive/paginas_limpias.json"

Y_TOLERANCE = 5


# ─── Patrones compartidos ─────────────────────────────────────────────────────

RE_PARTE = re.compile(r'(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\b', re.IGNORECASE)
PARTES_MAP = {
    'PRIMERA': '1. Lo que creemos',
    'SEGUNDA': '2. Cómo celebramos los misterios cristianos',
    'TERCERA': '3. Cómo obtenemos la vida en Cristo',
    'CUARTA':  '4. Cómo debemos orar',
}

RE_CAPITULO = re.compile(
    r'(Por qué podemos creer|El hombre es|Dios nos sale|Los hombres responden'
    r'|La profesión de fe|Creo en Dios Padre|Creo en Jesucristo|Creo en el Espíritu'
    r'|Dios actúa|Los sacramentos|La comunidad humana|La salvación|Los diez mandamientos'
    r'|La oración)',
    re.IGNORECASE
)

RE_REFS = re.compile(r'\[\d[\d\s,\-]*\]')


# ─── Fase 1: Extract ──────────────────────────────────────────────────────────

def cmd_extract(args):
    paginas = []
    with pdfplumber.open(args.pdf) as pdf:
        total = len(pdf.pages)
        print(f"[INFO] PDF: {total} páginas totales, saltando {SKIP_BEFORE}")
        for i, page in enumerate(pdf.pages[SKIP_BEFORE:]):
            text = page.extract_text()
            paginas.append(text or "")
            if (i + 1) % 30 == 0:
                print(f"  {i+1}/{(total - SKIP_BEFORE)} páginas...")

    with open(RAW_PATH, "w", encoding="utf-8") as f:
        json.dump(paginas, f, ensure_ascii=False)
    print(f"[OK] {RAW_PATH} — {len(paginas)} páginas guardadas.")


# ─── Fase 2: Clean ────────────────────────────────────────────────────────────

def detectar_split(page) -> float:
    """Detecta el punto de separación entre columna principal y lateral."""
    words = page.extract_words(keep_blank_chars=True, x_tolerance=3)
    x0s = sorted({w['x0'] for w in words if w['x0'] > 100})
    if len(x0s) < 10:
        return 9999  # una sola columna
    # Gap más grande entre x0 consecutivos
    max_gap = 0
    split = x0s[-1] + 50
    for a, b in zip(x0s, x0s[1:]):
        gap = b - a
        if gap > max_gap and gap > 20:
            max_gap = gap
            split = (a + b) / 2
    return split


def reconstruir_lineas(words, split_x):
    """Agrupa palabras por y, filtra columna lateral, devuelve líneas limpias."""
    main = sorted(
        [w for w in words if w['x0'] < split_x],
        key=lambda w: (w['top'], w['x0'])
    )
    if not main:
        return ""

    lineas = []
    act = []
    top_ref = None
    for w in main:
        if top_ref is None or abs(w['top'] - top_ref) <= Y_TOLERANCE:
            act.append(w)
            top_ref = w['top']
        else:
            lineas.append(" ".join(w2['text'] for w2 in sorted(act, key=lambda w2: w2['x0'])))
            act = [w]
            top_ref = w['top']
    if act:
        lineas.append(" ".join(w2['text'] for w2 in sorted(act, key=lambda w2: w2['x0'])))

    return "\n".join(lineas)


def cmd_clean(args):
    if not os.path.exists(RAW_PATH):
        print("[ERROR] Ejecutá primero: python archive/scraper_youcat.py extract")
        sys.exit(1)

    paginas_raw = json.load(open(RAW_PATH, encoding="utf-8"))
    paginas_limpias = []

    with pdfplumber.open(args.pdf) as pdf:
        total = len(pdf.pages[SKIP_BEFORE:])
        for i, page in enumerate(pdf.pages[SKIP_BEFORE:]):
            words = page.extract_words(keep_blank_chars=True, x_tolerance=3)
            split_x = detectar_split(page)
            limpio = reconstruir_lineas(words, split_x)
            paginas_limpias.append(limpio)

            if (i + 1) % 30 == 0:
                print(f"  {i+1}/{total} páginas limpiadas...")
            elif args.verbose:
                print(f"  Pag {i+SKIP_BEFORE}: split_x={split_x:.0f} → {len(limpio)} chars")

    with open(CLEAN_PATH, "w", encoding="utf-8") as f:
        json.dump(paginas_limpias, f, ensure_ascii=False)
    print(f"[OK] {CLEAN_PATH} — {len(paginas_limpias)} páginas limpiadas.")


# ─── Fase 3: Parse ────────────────────────────────────────────────────────────

def es_ignorable(linea):
    if not linea:
        return True
    if re.match(r'^\d+\s*$', linea):
        return True
    for pfx in ['©', 'Queda rigurosamente', 'Traducción', 'Diseño',
                'ÍNDICE', 'Índice', 'Definiciones', 'Abreviaturas',
                'Siglas', 'Referencias de', 'Universidad Católica']:
        if pfx in linea:
            return True
    return False


def limpiar_texto(texto):
    return re.sub(r'\s+', ' ', RE_REFS.sub('', texto)).strip()


def limpiar_sidebar(texto):
    texto = re.sub(
        r'(?:^|\s)(?:SAN|SANTA|SANTO|BEATO|BEATA|DOCTOR|MAGNO|PÍO|BENEDICTO|PABLO|JUAN|FRANCISCO|ALBERTO|TOMÁS|AGUSTÍN|BERNARDO|BLAISE|LOPE|MAX|PLANCK|CHARLES|PÉGUY)\s+(?:XVI|XIV|XV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I|DE [A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b',
        ' ', texto)
    texto = re.sub(r'\([^)]*\d{4}[^)]*\)', '', texto)
    texto = re.sub(r'\(lat\.\s*\w+\s*=\s*[^)]*\)', '', texto)
    texto = re.sub(r'\[[IVXL]+\]\s*CAP[IÍ]TULO\s+\d+º?\s*[–\-]\s*[A-ZÁÉÍÓÚÑ][^¿]*', '', texto)
    texto = re.sub(r'(?:PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\s*[–\-]?\s*[A-ZÁÉÍÓÚÑ][^¿]*', '', texto)
    for frase in [
        'de la Iglesia y uno de los', 'que fuesen verdaderas',
        'tal que la diferencia', 'mayores teólogos de la',
        'maestro universal, Doctor', ', Doctor de la Iglesia',
        'destacada de la Edad Media', 'y el mayor teólogo de la Iglesia',
        'insigne dramaturgo', 'poeta e', 'matemático y filósofo',
        'figura espiritual', 'venida de nuestro', 'nosotros los monjes',
        'no sea esta curiosidad', 'Un capitalismo sin',
        'y la Eucaristía', 'Opus Dei (obra de Dios),',
        'Eucaristía y la Eucaristía', 'BENEDICTO XVI,',
    ]:
        texto = texto.replace(frase, '')
    texto = re.sub(r'\s+', ' ', texto).strip()
    texto = re.sub(r',\s*,', ',', texto)
    texto = re.sub(r'\s+\.', '.', texto)
    texto = re.sub(r'\bmediante\. ', 'mediante ', texto)
    texto = re.sub(r'\s+,\s+', ', ', texto)
    return texto


def cmd_parse(args):
    if not os.path.exists(RAW_PATH):
        print("[ERROR] Ejecutá primero: python archive/scraper_youcat.py extract")
        sys.exit(1)

    paginas = json.load(open(RAW_PATH, encoding="utf-8"))
    RE_Q = re.compile(r'(?<!\d)(\d{1,3})\s+(¿)', re.MULTILINE)

    # ── 1. Construir texto global ──
    glue = "\n---PAGE---\n"
    texto_global = glue.join(paginas)

    # ── 2. Detectar partes y capítulos con su posición en texto_global ──
    # Solo match si la parte está al inicio de línea (evita falsos como "La segunda parte de la Biblia")
    RE_PARTE_LINE = re.compile(r'(?:^|\n)(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\b', re.IGNORECASE)
    partes_pos  = [(m.start(), PARTES_MAP.get(m.group(1).upper(), m.group(0).strip().replace('\n', ' ')))
                   for m in RE_PARTE_LINE.finditer(texto_global)]
    capitulos_pos = [(m.start(), m.group(1))
                     for m in RE_CAPITULO.finditer(texto_global)]

    # ── 3. Encontrar final del contenido (antes del índice) ──
    idx_fin = len(texto_global)
    for patron in ['Índice temático', 'ÍNDICE TEMÁTICO', 'Agradecimientos']:
        p = texto_global.find(patron)
        if p != -1 and p < idx_fin:
            idx_fin = p
    texto_contenido = texto_global[:idx_fin]

    # ── 4. Detectar preguntas ──
    # Paso A: estándar (\d+ ¿ mismo renglón)
    RE_SIMPLE = re.compile(r'(?<!\d)(\d{1,3})\s+(¿)', re.MULTILINE)
    simple_all = [m for m in RE_SIMPLE.finditer(texto_global) if m.start() < idx_fin]
    print(f"[INFO] Preguntas detectadas (estándar): {len(simple_all)}")

    # Paso B: con premisa (cada número faltante buscado manualmente)
    simple_nums = set(int(m.group(1)) for m in simple_all)
    missing_nums = sorted(set(range(1, 528)) - simple_nums)
    premise = []
    for num in missing_nums:
        pat = re.compile(r'(?<![\d-])(' + str(num) + r')\s+([^¿\d][^?]*?\?)', re.MULTILINE)
        best_m = None
        best_dist = None
        for m in pat.finditer(texto_global):
            if m.start() >= idx_fin:
                continue
            g2 = m.group(2)
            if '¿' not in g2:
                continue
            # Descartar si ¿ pertenece a OTRA pregunta (ej. "162 BENEDICTO XVI... 54 ¿...?")
            inter = g2[:g2.index('¿')]
            if re.search(r'\b\d{1,3}\s+¿', inter):
                continue
            dist = g2.index('¿')
            if best_m is None or dist < best_dist:
                best_m = m
                best_dist = dist
        if best_m is not None:
            premise.append(best_m)
    print(f"[INFO] Preguntas con premisa añadidas: {len(premise)} "
          f"→ {sorted(set(int(m.group(1)) for m in premise))}")

    # Combinar y ordenar por posición
    todos = sorted(simple_all + premise, key=lambda m: m.start())

    def asignar_seccion(pos):
        parte = ""
        for ppos, p in reversed(partes_pos):
            if ppos < pos:
                parte = p
                break
        capitulo = ""
        for cpos, c in reversed(capitulos_pos):
            if cpos < pos:
                capitulo = c
                break
        return parte, capitulo

    preguntas = []
    seen = set()
    for idx, m in enumerate(todos):
        num = int(m.group(1))
        if num in seen:
            continue

        # Extraer texto de la pregunta: desde m.start(2) hasta el primer '?'
        qt_start = m.start(2)
        resto = texto_global[qt_start:]
        qpos = resto.find('?')
        if qpos == -1:
            continue
        qtext_raw = resto[:qpos + 1]  # incluye el '?'
        if '¿' not in qtext_raw:
            qtext_raw = '¿' + qtext_raw

        # Respuesta: desde después del '?' hasta la siguiente pregunta
        resp_start = qt_start + qpos + 1
        sig = todos[idx + 1].start() if idx + 1 < len(todos) else idx_fin
        rtext_raw = texto_global[resp_start:sig].strip()

        parte, capitulo = asignar_seccion(m.start())
        qtext = limpiar_texto(qtext_raw)
        qtext = limpiar_sidebar(qtext)
        if not qtext.startswith('¿'):
            qtext = '¿' + qtext if qtext else ''
        rtext = limpiar_texto(rtext_raw) if rtext_raw else ""

        if qtext:
            preguntas.append(dict(
                pregunta_nro=num, pregunta_texto=qtext,
                respuesta_texto=rtext,
                parte=parte, capitulo=capitulo,
            ))
            seen.add(num)

    print(f"[INFO] Preguntas encontradas: {len(preguntas)}")
    nums = sorted(p['pregunta_nro'] for p in preguntas)
    if nums:
        print(f"  Rango: {min(nums)} – {max(nums)}")
        missing = sorted(set(range(1, max(nums) + 1)) - set(nums))
        if missing:
            print(f"  Faltan: {len(missing)} → {missing}")

    if not preguntas:
        print("[ERROR] No se encontraron preguntas.")
        sys.exit(1)

    if args.preview:
        print("\n── PREVIEW ────────────────────────────────────────────────")
        for p in preguntas[:20]:
            print(f"\n[{p['pregunta_nro']}] {p['pregunta_texto']}")
            print(f"     Parte: {p['parte']}")
            print(f"     R: {p['respuesta_texto'][:120]}...")
        ult = preguntas[-1]
        print(f"\n[{ult['pregunta_nro']}] {ult['pregunta_texto']}")

    if args.db:
        conn = sqlite3.connect(args.db)
        conn.execute(f"DROP TABLE IF EXISTS {TABLE}")
        conn.execute(f"DROP TABLE IF EXISTS {TABLE}_fts")
        conn.execute(f"""
            CREATE TABLE {TABLE} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pregunta_nro INTEGER NOT NULL,
                pregunta_texto TEXT NOT NULL,
                respuesta_texto TEXT NOT NULL,
                parte TEXT, capitulo TEXT
            )
        """)
        conn.executemany(
            f"INSERT INTO {TABLE}(pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) "
            "VALUES (:pregunta_nro, :pregunta_texto, :respuesta_texto, :parte, :capitulo)",
            preguntas
        )
        conn.commit()
        print(f"[DB] {len(preguntas)} preguntas insertadas en {args.db}")

        conn.execute(f"CREATE VIRTUAL TABLE {TABLE}_fts USING fts5(id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo, content='{TABLE}', content_rowid='id')")
        for tname in ['ai', 'ad', 'au']:
            conn.execute(f"INSERT INTO {TABLE}_fts({TABLE}_fts, rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES('rebuild', 0, 0, 0, 0, 0, 0, 0)")
            break  # rebuild una vez es suficiente
        conn.execute(f"INSERT INTO {TABLE}_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) SELECT id, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM {TABLE}")
        conn.commit()
        conn.close()
        print(f"[OK] DB lista: {args.db}")


# ─── CLI ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper YOUCAT 3 fases")
    parser.add_argument("--pdf", default=DEFAULT_PDF, help="Ruta al PDF")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_extract = sub.add_parser("extract", help="Fase 1: extraer texto crudo")
    p_extract.set_defaults(func=cmd_extract)

    p_clean = sub.add_parser("clean", help="Fase 2: separar columnas y filtrar sidebar")
    p_clean.add_argument("-v", "--verbose", action="store_true")
    p_clean.set_defaults(func=cmd_clean)

    p_parse = sub.add_parser("parse", help="Fase 3: detectar preguntas y generar DB/preview")
    p_parse.add_argument("--preview", action="store_true")
    p_parse.add_argument("--db", default=None, const=DEFAULT_DB, nargs="?")
    p_parse.set_defaults(func=cmd_parse)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
