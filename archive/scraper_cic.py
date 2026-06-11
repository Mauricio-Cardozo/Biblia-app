"""
Scraper del Catecismo de la Iglesia Católica (CIC)
Lee el PDF y genera una base de datos SQLite limpia.

Uso:
    python scraper_cic.py                          # usa rutas por defecto
    python scraper_cic.py --pdf ruta/al/cic.pdf    # PDF específico
    python scraper_cic.py --db salida.db           # DB de salida específica
    python scraper_cic.py --preview                # muestra primeros 20 numerales sin guardar
"""

import re
import sqlite3
import argparse
import sys

try:
    import pdfplumber
except ImportError:
    print("[ERROR] Instalá pdfplumber: pip install pdfplumber --break-system-packages")
    sys.exit(1)

# ─── Configuración ─────────────────────────────────────────────────────────────

DEFAULT_PDF = "archive/catecismoDeLaIglesia.pdf"
DEFAULT_DB  = "AppMovil/assets/iglesia_digital.db"
TABLE       = "catecismo_cic"

# Páginas a saltear (portada, índice, apéndices)
# El CIC empieza el Prólogo en página 6 (índice 0 = página 1)
SKIP_PAGES_BEFORE = 5   # salteamos las primeras 5 páginas (portada + índice)
SKIP_PAGES_AFTER  = 0   # podés ajustar para saltear apéndices al final

# ─── Patrones ─────────────────────────────────────────────────────────────────

# Número de numeral al inicio de línea: "1 Texto..." o "44 El hombre..."
RE_NUMERAL = re.compile(r'^(\d{1,4})\s+(.+)', re.MULTILINE)

# Jerarquía
RE_PARTE     = re.compile(r'^(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\b', re.IGNORECASE)
RE_SECCION   = re.compile(r'^(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+SECCI[ÓO]N\b', re.IGNORECASE)
RE_CAPITULO  = re.compile(r'^CAP[IÍ]TULO\s+(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[EÉ]PTIMO)', re.IGNORECASE)
RE_ARTICULO  = re.compile(r'^ART[IÍ]CULO\s+\d+', re.IGNORECASE)

# Líneas a ignorar (notas al pie, referencias, índices)
RE_IGNORAR = re.compile(
    r'^(\d+$'                          # solo número (nota al pie)
    r'|^\s*$'                          # línea vacía
    r'|^---\s*PAGE\s*BREAK'           # salto de página
    r'|^[IVX]+\.\s+'                  # subtítulos romanos como "I. LA VIDA..."
    r'|^Resumen$'                      # título "Resumen"
    r'|^Ir al [IÍ]ndice'              # links del índice
    r'|^[ÍI]ndice\s'                  # índice
    r'|^APÉNDICE'                      # apéndices
    r'|^©'                             # copyright
    r')',
    re.IGNORECASE
)

# Mapeo de ordinales a números romanos para las partes
PARTE_MAP = {
    'PRIMERA': '1', 'SEGUNDA': '2', 'TERCERA': '3', 'CUARTA': '4',
}

# ─── Extracción del PDF ────────────────────────────────────────────────────────

def extraer_texto(pdf_path: str) -> str:
    """Extrae todo el texto del PDF página por página."""
    print(f"[INFO] Abriendo {pdf_path}...")
    pages_text = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"[INFO] Total de páginas: {total}")
        end = total - SKIP_PAGES_AFTER if SKIP_PAGES_AFTER > 0 else total
        for i, page in enumerate(pdf.pages[SKIP_PAGES_BEFORE:end]):
            text = page.extract_text()
            if text:
                pages_text.append(text)
            if (i + 1) % 50 == 0:
                print(f"[INFO] Procesadas {i + 1}/{total - SKIP_PAGES_BEFORE} páginas...")
    return "\n".join(pages_text)


# ─── Parseo ────────────────────────────────────────────────────────────────────

def parsear_cic(texto: str) -> list[dict]:
    """
    Parsea el texto completo del CIC y retorna lista de numerales con su jerarquía.
    """
    numerales = []

    # Estado de jerarquía actual
    parte_actual    = ""
    seccion_actual  = ""
    capitulo_actual = ""
    articulo_actual = ""

    # Buffer para acumular texto multi-línea de un numeral
    num_actual  = None
    buf_texto   = []

    def guardar_numeral():
        """Guarda el numeral en buffer si tiene contenido."""
        if num_actual is not None and buf_texto:
            texto_completo = " ".join(buf_texto).strip()
            # Limpiar guiones de final de línea
            texto_completo = texto_completo.replace('-\n', '').replace('- ', '')
            # Limpiar referencias numéricas al final (notas al pie)
            texto_limpio = re.sub(r'\s*\d{1,3}\s*$', '', texto_completo).strip()
            # Limpiar patrones de índice que se colaron
            texto_limpio = re.sub(r'\s*(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\s*>.*$', '', texto_limpio, flags=re.IGNORECASE).strip()
            if len(texto_limpio) > 10:  # ignorar numerales casi vacíos
                numerales.append({
                    'id':       num_actual,
                    'parte':    parte_actual,
                    'seccion':  seccion_actual,
                    'capitulo': capitulo_actual,
                    'articulo': articulo_actual,
                    'texto':    texto_limpio,
                })

    lineas = texto.split('\n')
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()

        # Detectar jerarquía
        if RE_PARTE.match(linea):
            guardar_numeral()
            num_actual = None
            buf_texto = []
            # La parte puede estar en esta línea o en la siguiente
            parte_actual = linea
            # Ver si la siguiente línea es la continuación del nombre
            if i + 1 < len(lineas):
                sig = lineas[i+1].strip()
                if sig and not RE_NUMERAL.match(sig) and not RE_SECCION.match(sig):
                    parte_actual += " " + sig
                    i += 1
            # Normalizar
            for k, v in PARTE_MAP.items():
                parte_actual = parte_actual.replace(k, k)
            seccion_actual  = ""
            capitulo_actual = ""
            articulo_actual = ""
            i += 1
            continue

        if RE_SECCION.match(linea):
            guardar_numeral()
            num_actual = None
            buf_texto = []
            seccion_actual = linea
            if i + 1 < len(lineas):
                sig = lineas[i+1].strip()
                if sig and not RE_NUMERAL.match(sig) and not RE_CAPITULO.match(sig):
                    seccion_actual += " " + sig
                    i += 1
            capitulo_actual = ""
            articulo_actual = ""
            i += 1
            continue

        if RE_CAPITULO.match(linea):
            guardar_numeral()
            num_actual = None
            buf_texto = []
            capitulo_actual = linea
            if i + 1 < len(lineas):
                sig = lineas[i+1].strip()
                if sig and not RE_NUMERAL.match(sig) and not RE_ARTICULO.match(sig) and not RE_SECCION.match(sig):
                    capitulo_actual += " " + sig
                    i += 1
            articulo_actual = ""
            i += 1
            continue

        if RE_ARTICULO.match(linea):
            articulo_actual = linea
            if i + 1 < len(lineas):
                sig = lineas[i+1].strip()
                if sig and not RE_NUMERAL.match(sig):
                    articulo_actual += " " + sig
                    i += 1
            i += 1
            continue

        # Detectar inicio de numeral
        m = RE_NUMERAL.match(linea)
        if m:
            nro = int(m.group(1))
            # Validar rango del CIC (1-2865) para no capturar notas al pie
            if 1 <= nro <= 2865:
                guardar_numeral()
                num_actual = nro
                buf_texto  = [m.group(2).strip()]
                i += 1
                continue

        # Continuación del numeral actual
        if num_actual is not None and linea and not RE_IGNORAR.match(linea):
            # No agregar si parece nota al pie (solo número) o referencia
            if not re.match(r'^\d+$', linea):
                buf_texto.append(linea)

        i += 1

    # Guardar último numeral
    guardar_numeral()

    return numerales


# ─── Base de datos ─────────────────────────────────────────────────────────────

def init_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    # Borrar tabla vieja si existe
    conn.execute(f"DROP TABLE IF EXISTS {TABLE}")
    conn.execute(f"DROP TABLE IF EXISTS {TABLE}_fts") # También borrar FTS si existe
    conn.execute(f"""
        CREATE TABLE {TABLE} (
            id        INTEGER PRIMARY KEY,
            parte     TEXT,
            seccion   TEXT,
            capitulo  TEXT,
            articulo  TEXT,
            texto     TEXT NOT NULL
        )
    """)
    conn.commit()
    print(f"[DB] Tabla '{TABLE}' creada en {db_path}")
    return conn


def crear_fts(conn: sqlite3.Connection):
    """Crea la tabla virtual FTS5 para búsqueda rápida."""
    print("[DB] Creando índice FTS5...")
    conn.execute(f"CREATE VIRTUAL TABLE {TABLE}_fts USING fts5(id, parte, seccion, capitulo, articulo, texto, content='{TABLE}', content_rowid='id')")
    
    # Triggers para mantener el índice sincronizado
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_ai AFTER INSERT ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (new.id, new.id, new.parte, new.seccion, new.capitulo, new.articulo, new.texto);
        END;
    """)
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_ad AFTER DELETE ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts({TABLE}_fts, rowid, id, parte, seccion, capitulo, articulo, texto) VALUES('delete', old.id, old.id, old.parte, old.seccion, old.capitulo, old.articulo, old.texto);
        END;
    """)
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_au AFTER UPDATE ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts({TABLE}_fts, rowid, id, parte, seccion, capitulo, articulo, texto) VALUES('delete', old.id, old.id, old.parte, old.seccion, old.capitulo, old.articulo, old.texto);
          INSERT INTO {TABLE}_fts(rowid, id, parte, seccion, capitulo, articulo, texto) VALUES (new.id, new.id, new.parte, new.seccion, new.capitulo, new.articulo, new.texto);
        END;
    """)
    # Poblado inicial
    conn.execute(f"INSERT INTO {TABLE}_fts(rowid, id, parte, seccion, capitulo, articulo, texto) SELECT id, id, parte, seccion, capitulo, articulo, texto FROM {TABLE}")
    conn.commit()
    print("[DB] Índice FTS5 creado y poblado.")


def insertar_numerales(conn: sqlite3.Connection, numerales: list[dict]):
    conn.executemany(
        f"INSERT OR REPLACE INTO {TABLE} (id, parte, seccion, capitulo, articulo, texto) VALUES (:id, :parte, :seccion, :capitulo, :articulo, :texto)",
        numerales
    )
    conn.commit()
    print(f"[DB] {len(numerales)} numerales insertados.")


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper del CIC desde PDF a SQLite")
    parser.add_argument("--pdf",     default=DEFAULT_PDF, help=f"Ruta al PDF (default: {DEFAULT_PDF})")
    parser.add_argument("--db",      default=DEFAULT_DB,  help=f"Ruta a la DB (default: {DEFAULT_DB})")
    parser.add_argument("--preview", action="store_true", help="Muestra primeros 20 numerales sin guardar")
    args = parser.parse_args()

    # Extraer texto
    texto = extraer_texto(args.pdf)

    # Parsear
    print("[INFO] Parseando numerales...")
    numerales = parsear_cic(texto)
    print(f"[INFO] Numerales encontrados: {len(numerales)}")

    if not numerales:
        print("[ERROR] No se encontraron numerales. Revisá el PDF o los patrones.")
        sys.exit(1)

    # Preview
    if args.preview:
        print("\n── PREVIEW (primeros 20) ────────────────────────────────────────")
        for n in numerales[:20]:
            print(f"\n[{n['id']}] {n['parte']} › {n['seccion']}")
            print(f"     {n['texto'][:120]}...")
        print(f"\n── ÚLTIMO ───────────────────────────────────────────────────────")
        print(f"[{numerales[-1]['id']}] {numerales[-1]['texto'][:120]}...")
        return

    # Verificar cobertura
    ids = {n['id'] for n in numerales}
    faltantes = [i for i in range(1, 2866) if i not in ids]
    if faltantes:
        print(f"[WARN] Numerales faltantes ({len(faltantes)}): {faltantes[:20]}{'...' if len(faltantes) > 20 else ''}")

    # Guardar en DB
    conn = init_db(args.db)
    insertar_numerales(conn, numerales)
    crear_fts(conn)
    conn.close()

    print(f"\n✅ Listo! DB guardada en: {args.db}")
    print(f"   Numerales: {len(numerales)}/2865")
    if faltantes:
        print(f"   Faltantes: {len(faltantes)} (revisar manualmente)")


if __name__ == "__main__":
    main()
