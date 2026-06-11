#!/usr/bin/env python3
"""
Scraper de lecturas diarias desde Vatican News → SQLite.

Uso:
  python3 archive/scraper_vaticano.py                           # mes actual + siguiente
  python3 archive/scraper_vaticano.py --fecha 2026-06-11        # una fecha
  python3 archive/scraper_vaticano.py --desde 2026-06-01 --hasta 2026-07-31
  python3 archive/scraper_vaticano.py --preview --fecha 2026-06-11
  python3 archive/scraper_vaticano.py --list                     # registros guardados
"""

import argparse
import html.parser
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta

DB_PATH = "AppMovil/assets/iglesia_digital.db"
BASE_URL = "https://www.vaticannews.va/es/evangelio-de-hoy/{year}/{month:02d}/{day:02d}.html"
USER_AGENT = "Mozilla/5.0 (compatible; IglesiaDigital/1.0)"
SLEEP_SECS = 0.5

# ─── Schema ───────────────────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS lecturas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha               TEXT NOT NULL UNIQUE,
    url                 TEXT,
    titulo_misa         TEXT,
    primera_lectura_ref TEXT,
    primera_lectura     TEXT,
    salmo               TEXT,
    aleluia             TEXT,
    evangelio_ref       TEXT,
    evangelio           TEXT,
    comentario_papal    TEXT,
    creado_en           TEXT DEFAULT (datetime('now','localtime'))
);
"""

# ─── HTML Parser ──────────────────────────────────────────────────────────────

_SECCIONES = {
    "lectura del día": "lectura",
    "salmo responsorial": "salmo",
    "aleluya": "aleluia",
    "evangelio del día": "evangelio",
    "las palabras de los papas": "papas",
}

# Textos al inicio de un <p> que indican referencia en vez de contenido
_RE_REF = re.compile(
    r"^(Lectura del (libro|santo)|De la (primera|carta)|Comienzo|Lectura de la carta)",
    re.IGNORECASE,
)


class LecturasParser(html.parser.HTMLParser):
    """Parseador del HTML de Vatican News extrayendo lecturas del día."""

    def __init__(self) -> None:
        super().__init__()
        self.titulo_misa: str | None = None
        self.primera_lectura_ref: str | None = None
        self.primera_lectura: str | None = None
        self.salmo: str | None = None
        self.aleluia: str | None = None
        self.evangelio_ref: str | None = None
        self.evangelio: str | None = None
        self.comentario_papal: str | None = None

        self._in_section = False
        self._in_h1 = False
        self._in_h2 = False
        self._in_p = False
        self._in_content = False
        self._section_key: str | None = None
        self._in_titulo_span = False
        self._buff: list[str] = []

    def _flush_buff(self) -> None:
        texto = "".join(self._buff).strip()
        self._buff = []
        if not texto or self._section_key is None:
            return

        if self._section_key == "lectura":
            if self.primera_lectura_ref is None and _RE_REF.match(texto):
                self.primera_lectura_ref = texto
            else:
                self.primera_lectura = (self.primera_lectura or "") + texto + "\n\n"
        elif self._section_key == "salmo":
            self.salmo = (self.salmo or "") + texto + "\n\n"
        elif self._section_key == "aleluia":
            self.aleluia = (self.aleluia or "") + texto + "\n\n"
        elif self._section_key == "evangelio":
            if self.evangelio_ref is None and _RE_REF.match(texto):
                self.evangelio_ref = texto
            else:
                self.evangelio = (self.evangelio or "") + texto + "\n\n"
        elif self._section_key == "papas":
            self.comentario_papal = (self.comentario_papal or "") + texto + "\n\n"

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_dict = dict(attrs)
        classes = (attr_dict.get("class") or "").split()

        if tag == "section":
            self._in_section = True
            self._section_key = None
            self._in_content = False
        elif tag == "h1":
            self._in_h1 = True
        elif tag == "h2":
            self._in_h2 = True
        elif tag == "p" and self._in_section:
            self._in_p = True
        elif tag == "div" and "section__content" in classes:
            self._in_content = True
        elif tag == "div" and "indicazioneLiturgica" in classes:
            self._in_titulo_span = True

    def handle_endtag(self, tag: str) -> None:
        if tag == "section":
            self._in_section = False
            self._section_key = None
            self._in_content = False
        elif tag == "h1":
            self._in_h1 = False
        elif tag == "h2":
            self._in_h2 = False
        elif tag == "p":
            if self._in_content:
                self._flush_buff()
            self._in_p = False
        elif tag == "div" and self._in_titulo_span:
            self._in_titulo_span = False

    def handle_data(self, data: str) -> None:
        texto = data.strip()
        if not texto:
            return

        # H1 → título de la página (lo ignoramos)
        if self._in_h1 and self.titulo_misa is None:
            return

        # H2 dentro de una section → detectar qué sección es
        if self._in_h2 and self._in_section:
            clave = texto.lower().strip()
            if clave in _SECCIONES:
                self._section_key = _SECCIONES[clave]
            return

        # Título litúrgico (ej: "Memoria de san Bernabé")
        if self._in_titulo_span and self.titulo_misa is None:
            self.titulo_misa = texto
            return

        # Contenido de <p> dentro de section__content
        if self._in_p and self._in_content and self._section_key:
            self._buff.append(texto + " ")

    def handle_entityref(self, name: str) -> None:
        if self._in_p and self._in_content and self._section_key:
            char = html.parser.HTMLParser.unescape.__func__(self, f"&{name};")
            self._buff.append(str(char))

    def handle_charref(self, name: str) -> None:
        if self._in_p and self._in_content and self._section_key:
            try:
                code = int(name) if name.isdigit() else int(name[1:], 16)
                self._buff.append(chr(code))
            except ValueError:
                self._buff.append(f"&#{name};")


# ─── Helper de limpieza ──────────────────────────────────────────────────────


def _limpiar(texto: str | None) -> str | None:
    if texto is None:
        return None
    texto = re.sub(r"\s*\n\s*", "\n", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip() or None


# ─── Scraper ──────────────────────────────────────────────────────────────────


def scrapear_fecha(fecha: date, preview: bool = False) -> dict | None:
    """Scrapea las lecturas de una fecha. Retorna dict o None si 404."""
    url = BASE_URL.format(year=fecha.year, month=fecha.month, day=fecha.day)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html_bytes = resp.read()
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f"  [{fecha}] 404 - skip")
            return None
        print(f"  [{fecha}] HTTP {e.code} - skip")
        return None
    except Exception as e:
        print(f"  [{fecha}] Error: {e} - skip")
        return None

    html_str = html_bytes.decode("utf-8", errors="replace")

    parser = LecturasParser()
    parser.feed(html_str)

    if not parser.evangelio and not parser.primera_lectura:
        if not preview:
            print(f"  [{fecha}] sin contenido parseable - skip")
        return None

    result = {
        "fecha": fecha.isoformat(),
        "url": url,
        "titulo_misa": _limpiar(parser.titulo_misa),
        "primera_lectura_ref": _limpiar(parser.primera_lectura_ref),
        "primera_lectura": _limpiar(parser.primera_lectura),
        "salmo": _limpiar(parser.salmo),
        "aleluia": _limpiar(parser.aleluia),
        "evangelio_ref": _limpiar(parser.evangelio_ref),
        "evangelio": _limpiar(parser.evangelio),
        "comentario_papal": _limpiar(parser.comentario_papal),
    }
    return result


def _preview(d: dict) -> None:
    print(f"\n{'='*60}")
    print(f"  Fecha: {d['fecha']}")
    print(f"  Título: {d['titulo_misa']}")
    print(f"  URL: {d['url']}")
    print(f"{'='*60}")
    if d["primera_lectura_ref"]:
        print(f"\n  📖 1ª Lectura: {d['primera_lectura_ref']}")
        print(f"  {d['primera_lectura'][:200]}…" if d["primera_lectura"] else "")
    if d["salmo"]:
        print(f"\n  🎵 Salmo: {d['salmo'][:120]}…")
    if d["aleluia"]:
        print(f"\n  🎵 Aleluya: {d['aleluia'][:120]}…")
    if d["evangelio_ref"]:
        print(f"\n  ✝ Evangelio: {d['evangelio_ref']}")
        print(f"  {d['evangelio'][:200]}…" if d["evangelio"] else "")
    if d["comentario_papal"]:
        print(f"\n  📜 Papas: {d['comentario_papal'][:200]}…")
    print()


# ─── Base de datos ────────────────────────────────────────────────────────────


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.execute(SCHEMA_SQL)
    conn.commit()
    return conn


def guardar(lectura: dict) -> bool:
    """Guarda una lectura. Retorna True si se insertó, False si ya existía."""
    conn = _get_db()
    try:
        conn.execute(
            """INSERT INTO lecturas
               (fecha, url, titulo_misa, primera_lectura_ref, primera_lectura,
                salmo, aleluia, evangelio_ref, evangelio, comentario_papal)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                lectura["fecha"],
                lectura["url"],
                lectura["titulo_misa"],
                lectura["primera_lectura_ref"],
                lectura["primera_lectura"],
                lectura["salmo"],
                lectura["aleluia"],
                lectura["evangelio_ref"],
                lectura["evangelio"],
                lectura["comentario_papal"],
            ),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def existe_fecha(fecha: str) -> bool:
    conn = _get_db()
    try:
        row = conn.execute("SELECT 1 FROM lecturas WHERE fecha = ?", (fecha,)).fetchone()
        return row is not None
    finally:
        conn.close()


def listar_registros() -> None:
    conn = _get_db()
    rows = conn.execute(
        "SELECT fecha, titulo_misa, evangelio_ref FROM lecturas ORDER BY fecha DESC"
    ).fetchall()
    conn.close()
    if not rows:
        print("No hay lecturas guardadas.")
        return
    print(f"{'Fecha':<14} {'Título':<50} {'Evangelio'}")
    print("-" * 110)
    for r in rows:
        tit = (r[1] or "")[:48]
        ev = (r[2] or "")[:48]
        print(f"{r[0]:<14} {tit:<50} {ev}")


# ─── Generación de fechas ─────────────────────────────────────────────────────


def _rangos_por_defecto() -> list[date]:
    """Mes actual + mes siguiente."""
    hoy = date.today()
    primero_actual = hoy.replace(day=1)
    if hoy.month == 12:
        hasta = primero_actual.replace(year=hoy.year + 1, month=1, day=1)
    else:
        hasta = primero_actual.replace(month=hoy.month + 1, day=1)
    # un día extra para cubrir el mes siguiente completo
    if hasta.month == 12:
        fin = hasta.replace(year=hasta.year + 1, month=1, day=1)
    else:
        fin = hasta.replace(month=hasta.month + 1, day=1)
    # desde 15 días antes del mes actual
    desde = primero_actual - timedelta(days=15)
    return [desde + timedelta(days=i) for i in range((fin - desde).days)]


def _fechas_en_rango(desde: date, hasta: date) -> list[date]:
    return [desde + timedelta(days=i) for i in range((hasta - desde).days + 1)]


# ─── CLI ──────────────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrapea lecturas diarias desde Vatican News"
    )
    grupo = parser.add_mutually_exclusive_group()
    grupo.add_argument("--fecha", type=str, help="Una fecha YYYY-MM-DD")
    grupo.add_argument("--desde", type=str, help="Inicio de rango YYYY-MM-DD")
    parser.add_argument("--hasta", type=str, help="Fin de rango YYYY-MM-DD")
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Solo mostrar lo parseado sin guardar",
    )
    parser.add_argument("--list", action="store_true", help="Listar registros guardados")
    args = parser.parse_args()

    if args.list:
        listar_registros()
        return

    # Determinar fechas
    if args.fecha:
        fechas = [date.fromisoformat(args.fecha)]
    elif args.desde:
        hasta = date.fromisoformat(args.hasta) if args.hasta else date.today()
        fechas = _fechas_en_rango(date.fromisoformat(args.desde), hasta)
    else:
        fechas = _rangos_por_defecto()

    # Preview
    if args.preview:
        for f in fechas:
            data = scrapear_fecha(f, preview=True)
            if data:
                _preview(data)
            time.sleep(SLEEP_SECS)
        return

    # Scrapear y guardar
    ok = 0
    existentes = 0
    skipped = 0

    print(f"Procesando {len(fechas)} fechas...\n")
    for f in fechas:
        fecha_str = f.isoformat()
        if existe_fecha(fecha_str):
            print(f"  [{fecha_str}] ya existe - skip")
            existentes += 1
            continue

        data = scrapear_fecha(f)
        if data is None:
            skipped += 1
            continue

        if guardar(data):
            tit = data["titulo_misa"] or "(sin título)"
            print(f"  [{fecha_str}] OK ({tit})")
            ok += 1
        else:
            print(f"  [{fecha_str}] error al guardar - skip")
            skipped += 1

        time.sleep(SLEEP_SECS)

    print(f"\nTotal: {len(fechas)} fechas procesadas, {ok} guardadas, {existentes} existentes, {skipped} skipped")


if __name__ == "__main__":
    main()
