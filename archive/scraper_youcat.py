"""
Scraper del YOUCAT (Catecismo Joven de la Iglesia Católica)
Lee el PDF y genera una tabla SQLite limpia.

Uso:
    python scraper_youcat.py                           # usa rutas por defecto
    python scraper_youcat.py --pdf ruta/al/youcat.pdf  # PDF específico
    python scraper_youcat.py --db salida.db            # DB de salida
    python scraper_youcat.py --preview                 # muestra primeras 20 preguntas
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

DEFAULT_PDF = "archive/youcat.pdf"
DEFAULT_DB  = "AppMovil/assets/iglesia_digital.db"
TABLE       = "youcat"

# El YOUCAT empieza las preguntas en la página 15 aprox (después del prólogo)
SKIP_PAGES_BEFORE = 14

# ─── Patrones ─────────────────────────────────────────────────────────────────

# Pregunta: "1 ¿Para qué estamos en la tierra?"
RE_PREGUNTA = re.compile(r'^(\d{1,3})\s+(¿.+\?)\s*$')

# Partes
RE_PARTE = re.compile(
    r'^(PRIMERA|SEGUNDA|TERCERA|CUARTA)\s+PARTE\b',
    re.IGNORECASE
)

PARTES_MAP = {
    'PRIMERA':  '1. Lo que creemos',
    'SEGUNDA':  '2. Cómo celebramos los misterios cristianos',
    'TERCERA':  '3. Cómo obtenemos la vida en Cristo',
    'CUARTA':   '4. Cómo debemos orar',
}

# Capítulos del YOUCAT
RE_CAPITULO = re.compile(
    r'^(Por qué podemos creer|El hombre es|Dios nos sale|Los hombres responden'
    r'|La profesión de fe|Creo en Dios Padre|Creo en Jesucristo|Creo en el Espíritu'
    r'|Dios actúa|Los sacramentos|La comunidad humana|La salvación|Los diez mandamientos'
    r'|La oración)',
    re.IGNORECASE
)

# Referencias cruzadas al CIC a ignorar: "[1-3, 358]"
RE_REFS = re.compile(r'\[\d[\d\s,\-]*\]')

# Citas laterales — líneas cortas que son citas de santos (entre 3-8 palabras en mayúscula)
RE_CITA_AUTOR = re.compile(r'^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s\.\-]+\(\d{4}')

# Líneas a ignorar
RE_IGNORAR = re.compile(
    r'^\s*$'
    r'|^---\s*PAGE'
    r'|^\d+\s*$'          # solo número de página
    r'|^[IVX]+\s+[A-Z]'  # subtítulos romanos
    r'|^©'
    r'|^Queda rigurosamente'
    r'|^Traducción'
    r'|^Diseño'
    r'|^ÍNDICE'
    r'|^Índice'
    r'|^Definiciones'
    r'|^Abreviaturas'
    r'|^Siglas'
    r'|^Referencias de'
    r'|^Universidad Católica'
)


# ─── Extracción ────────────────────────────────────────────────────────────────

def extraer_texto(pdf_path: str) -> str:
    print(f"[INFO] Abriendo {pdf_path}...")
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)
        print(f"[INFO] Total de páginas: {total}")
        for i, page in enumerate(pdf.pages[SKIP_PAGES_BEFORE:]):
            text = page.extract_text()
            if text:
                pages.append(text)
            if (i + 1) % 30 == 0:
                print(f"[INFO] Procesadas {i + 1}/{total - SKIP_PAGES_BEFORE} páginas...")
    return "\n".join(pages)


# ─── Parseo ────────────────────────────────────────────────────────────────────

def limpiar_texto(texto: str) -> str:
    """Elimina referencias cruzadas y limpia el texto."""
    texto = texto.replace('-\n', '').replace('- ', '')
    texto = RE_REFS.sub('', texto)
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto


def parsear_youcat(texto: str) -> list[dict]:
    preguntas = []

    parte_actual    = ""
    capitulo_actual = ""

    pregunta_num     = None
    pregunta_texto   = ""
    buf_respuesta    = []

    def guardar():
        if pregunta_num is not None and buf_respuesta:
            resp = limpiar_texto(" ".join(buf_respuesta))
            if len(resp) > 10:
                preguntas.append({
                    'pregunta_nro':    pregunta_num,
                    'pregunta_texto':  pregunta_texto,
                    'respuesta_texto': resp,
                    'parte':           parte_actual,
                    'capitulo':        capitulo_actual,
                })

    lineas = texto.split('\n')
    i = 0
    while i < len(lineas):
        linea = lineas[i].strip()

        # Parte
        m_parte = RE_PARTE.match(linea)
        if m_parte:
            guardar()
            pregunta_num = None
            buf_respuesta = []
            clave = m_parte.group(1).upper()
            parte_actual = PARTES_MAP.get(clave, linea)
            i += 1
            continue

        # Capítulo
        if RE_CAPITULO.match(linea):
            capitulo_actual = linea
            i += 1
            continue

        # Pregunta nueva
        m_preg = RE_PREGUNTA.match(linea)
        if m_preg:
            guardar()
            pregunta_num   = int(m_preg.group(1))
            pregunta_texto = m_preg.group(2).strip()
            buf_respuesta  = []
            i += 1
            continue

        # Acumular respuesta
        if pregunta_num is not None:
            if RE_IGNORAR.match(linea):
                i += 1
                continue
            # Ignorar citas de autores (columna lateral)
            if RE_CITA_AUTOR.match(linea):
                i += 1
                continue
            # Ignorar referencias bíblicas cortas
            if re.match(r'^[A-Z][a-z]+ \d+,\d+', linea):
                i += 1
                continue
            if linea:
                buf_respuesta.append(linea)

        i += 1

    guardar()
    return preguntas


# ─── Base de datos ─────────────────────────────────────────────────────────────

def init_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute(f"DROP TABLE IF EXISTS {TABLE}")
    conn.execute(f"DROP TABLE IF EXISTS {TABLE}_fts")
    conn.execute(f"""
        CREATE TABLE {TABLE} (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            pregunta_nro    INTEGER NOT NULL,
            pregunta_texto  TEXT NOT NULL,
            respuesta_texto TEXT NOT NULL,
            parte           TEXT,
            capitulo        TEXT
        )
    """)
    conn.commit()
    print(f"[DB] Tabla '{TABLE}' creada en {db_path}")
    return conn


def crear_fts(conn: sqlite3.Connection):
    """Crea la tabla virtual FTS5 para búsqueda rápida."""
    print("[DB] Creando índice FTS5...")
    conn.execute(f"CREATE VIRTUAL TABLE {TABLE}_fts USING fts5(id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo, content='{TABLE}', content_rowid='id')")
    
    # Triggers
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_ai AFTER INSERT ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (new.id, new.id, new.pregunta_nro, new.pregunta_texto, new.respuesta_texto, new.parte, new.capitulo);
        END;
    """)
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_ad AFTER DELETE ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts({TABLE}_fts, rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES('delete', old.id, old.id, old.pregunta_nro, old.pregunta_texto, old.respuesta_texto, old.parte, old.capitulo);
        END;
    """)
    conn.execute(f"""
        CREATE TRIGGER {TABLE}_au AFTER UPDATE ON {TABLE} BEGIN
          INSERT INTO {TABLE}_fts({TABLE}_fts, rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES('delete', old.id, old.id, old.pregunta_nro, old.pregunta_texto, old.respuesta_texto, old.parte, old.capitulo);
          INSERT INTO {TABLE}_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (new.id, new.id, new.pregunta_nro, new.pregunta_texto, new.respuesta_texto, new.parte, new.capitulo);
        END;
    """)
    # Poblado
    conn.execute(f"INSERT INTO {TABLE}_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) SELECT id, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM {TABLE}")
    conn.commit()
    print("[DB] Índice FTS5 creado y poblado.")


def insertar_preguntas(conn: sqlite3.Connection, preguntas: list[dict]):
    conn.executemany(
        f"""INSERT INTO {TABLE}
            (pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo)
            VALUES (:pregunta_nro, :pregunta_texto, :respuesta_texto, :parte, :capitulo)""",
        preguntas
    )
    conn.commit()
    print(f"[DB] {len(preguntas)} preguntas insertadas.")


# ─── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Scraper del YOUCAT desde PDF a SQLite")
    parser.add_argument("--pdf",     default=DEFAULT_PDF)
    parser.add_argument("--db",      default=DEFAULT_DB)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()

    texto = extraer_texto(args.pdf)

    print("[INFO] Parseando preguntas...")
    preguntas = parsear_youcat(texto)
    print(f"[INFO] Preguntas encontradas: {len(preguntas)}")

    if not preguntas:
        print("[ERROR] No se encontraron preguntas.")
        sys.exit(1)

    if args.preview:
        print("\n── PREVIEW (primeras 20) ────────────────────────────────")
        for p in preguntas[:20]:
            print(f"\n[{p['pregunta_nro']}] {p['pregunta_texto']}")
            print(f"     Parte: {p['parte']}")
            print(f"     R: {p['respuesta_texto'][:120]}...")
        print(f"\n── ÚLTIMA ───────────────────────────────────────────────")
        ult = preguntas[-1]
        print(f"[{ult['pregunta_nro']}] {ult['pregunta_texto']}")
        return

    conn = init_db(args.db)
    insertar_preguntas(conn, preguntas)
    crear_fts(conn)
    conn.close()

    print(f"\n✅ Listo! DB guardada en: {args.db}")
    print(f"   Preguntas: {len(preguntas)}")


if __name__ == "__main__":
    main()
