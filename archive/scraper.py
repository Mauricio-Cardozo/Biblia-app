#!/usr/bin/env python3
"""
Scraper Bibliatodo (El Libro del Pueblo de Dios) -> SQLite.

Estructura (README):
- libros(id, nombre, testamento)
- versiculos(id, libro_id, capitulo, numero, texto)

Recorre todos los libros y capítulos definidos en LIBROS_CATOLICOS.
Los libros no disponibles en esta versión (404 / sin versículos) se omiten
y se listan al final para completar desde otra fuente.
Si un capítulo ya tiene versículos en la BD, se salta sin nueva petición HTTP.
Entre peticiones espera 1.5 s para no saturar el servidor.

Uso:
  python scraper.py
  python scraper.py --db biblia_pueblo_dios.db
  python scraper.py --libro genesis          # solo un libro (clave del diccionario)
  python scraper.py --libro genesis --desde 5 --hasta 10
"""

from __future__ import annotations

import argparse
import re
import sqlite3
import time
from dataclasses import dataclass

import requests
from requests.exceptions import HTTPError, RequestException
from bs4 import BeautifulSoup


# --- Diccionario católico: clave URL (sin guiones en números) -> cantidad de capítulos ---
LIBROS_CATOLICOS: dict[str, int] = {
    # --- ANTIGUO TESTAMENTO (46 libros) ---
    "genesis": 50,
    "exodo": 40,
    "levitico": 27,
    "numeros": 36,
    "deuteronomio": 34,
    "josue": 24,
    "jueces": 21,
    "rut": 4,
    "1samuel": 31,
    "2samuel": 24,
    "1reyes": 22,
    "2reyes": 25,
    "1cronicas": 29,
    "2cronicas": 36,
    "esdras": 10,
    "nehemias": 13,
    "tobias": 14,
    "judit": 16,
    "ester": 10,
    "1macabeos": 16,
    "2macabeos": 15,
    "job": 42,
    "salmos": 150,
    "proverbios": 31,
    "eclesiastes": 12,
    "cantares": 8,
    "sabiduria": 19,
    "eclesiastico": 51,
    "isaias": 66,
    "jeremias": 52,
    "lamentaciones": 5,
    "baruc": 6,
    "ezequiel": 48,
    "daniel": 14,
    "oseas": 14,
    "joel": 4,
    "amos": 9,
    "abdias": 1,
    "jonas": 4,
    "miqueas": 7,
    "nahum": 3,
    "habacuc": 3,
    "sofonias": 3,
    "ageo": 2,
    "zacarias": 14,
    "malaquias": 3,
    # --- NUEVO TESTAMENTO (27 libros) ---
    "mateo": 28,
    "marcos": 16,
    "lucas": 24,
    "juan": 21,
    "hechos": 28,
    "romanos": 16,
    "1corintios": 16,
    "2corintios": 13,
    "galatas": 6,
    "efesios": 6,
    "filipenses": 4,
    "colosenses": 4,
    "1tesalonicenses": 5,
    "2tesalonicenses": 3,
    "1timoteo": 6,
    "2timoteo": 4,
    "tito": 3,
    "filemon": 1,
    "hebreos": 13,
    "santiago": 5,
    "1pedro": 5,
    "2pedro": 3,
    "1juan": 5,
    "2juan": 1,
    "3juan": 1,
    "judas": 1,
    "apocalipsis": 22,
}

NOMBRES_LIBROS: dict[str, str] = {
    "genesis": "Génesis",
    "exodo": "Éxodo",
    "levitico": "Levítico",
    "numeros": "Números",
    "deuteronomio": "Deuteronomio",
    "josue": "Josué",
    "jueces": "Jueces",
    "rut": "Rut",
    "1samuel": "1 Samuel",
    "2samuel": "2 Samuel",
    "1reyes": "1 Reyes",
    "2reyes": "2 Reyes",
    "1cronicas": "1 Crónicas",
    "2cronicas": "2 Crónicas",
    "esdras": "Esdras",
    "nehemias": "Nehemías",
    "tobias": "Tobías",
    "judit": "Judit",
    "ester": "Ester",
    "1macabeos": "1 Macabeos",
    "2macabeos": "2 Macabeos",
    "job": "Job",
    "salmos": "Salmos",
    "proverbios": "Proverbios",
    "eclesiastes": "Eclesiastés",
    "cantares": "Cantar de los Cantares",
    "sabiduria": "Sabiduría",
    "eclesiastico": "Eclesiástico",
    "isaias": "Isaías",
    "jeremias": "Jeremías",
    "lamentaciones": "Lamentaciones",
    "baruc": "Baruc",
    "ezequiel": "Ezequiel",
    "daniel": "Daniel",
    "oseas": "Oseas",
    "joel": "Joel",
    "amos": "Amós",
    "abdias": "Abdías",
    "jonas": "Jonás",
    "miqueas": "Miqueas",
    "nahum": "Nahúm",
    "habacuc": "Habacuc",
    "sofonias": "Sofonías",
    "ageo": "Ageo",
    "zacarias": "Zacarías",
    "malaquias": "Malaquías",
    "mateo": "Mateo",
    "marcos": "Marcos",
    "lucas": "Lucas",
    "juan": "Juan",
    "hechos": "Hechos de los Apóstoles",
    "romanos": "Romanos",
    "1corintios": "1 Corintios",
    "2corintios": "2 Corintios",
    "galatas": "Gálatas",
    "efesios": "Efesios",
    "filipenses": "Filipenses",
    "colosenses": "Colosenses",
    "1tesalonicenses": "1 Tesalonicenses",
    "2tesalonicenses": "2 Tesalonicenses",
    "1timoteo": "1 Timoteo",
    "2timoteo": "2 Timoteo",
    "tito": "Tito",
    "filemon": "Filemón",
    "hebreos": "Hebreos",
    "santiago": "Santiago",
    "1pedro": "1 Pedro",
    "2pedro": "2 Pedro",
    "1juan": "1 Juan",
    "2juan": "2 Juan",
    "3juan": "3 Juan",
    "judas": "Judas",
    "apocalipsis": "Apocalipsis",
}

NUEVO_TESTAMENTO = {
    "mateo",
    "marcos",
    "lucas",
    "juan",
    "hechos",
    "romanos",
    "1corintios",
    "2corintios",
    "galatas",
    "efesios",
    "filipenses",
    "colosenses",
    "1tesalonicenses",
    "2tesalonicenses",
    "1timoteo",
    "2timoteo",
    "tito",
    "filemon",
    "hebreos",
    "santiago",
    "1pedro",
    "2pedro",
    "1juan",
    "2juan",
    "3juan",
    "judas",
    "apocalipsis",
}

BASE_URL_PUEBLO_DE_DIOS = (
    "https://www.bibliatodo.com/la-biblia/El-libro-del-pueblo-de-Dios"
)
DEFAULT_DB = "biblia_pueblo_dios.db"
DELAY_ENTRE_CAPITULOS = 1.5

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


@dataclass
class Versiculo:
    numero: int
    texto: str


def limpiar_texto(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip()


def slug_bibliatodo(clave_libro: str) -> str:
    """Segmento de path en Bibliatodo: misma clave que en LIBROS_CATOLICOS.

    Los libros numerados van pegados (p. ej. ``1samuel``, no ``1-samuel``).
    """
    return clave_libro


def url_capitulo(clave_libro: str, n_capitulo: int) -> str:
    slug = slug_bibliatodo(clave_libro)
    return f"{BASE_URL_PUEBLO_DE_DIOS}/{slug}-{n_capitulo}"


def testamento_de(clave_libro: str) -> str:
    return "Nuevo" if clave_libro in NUEVO_TESTAMENTO else "Antiguo"


def crear_tablas_si_no_existen(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS libros (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            testamento TEXT
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS versiculos (
            id INTEGER PRIMARY KEY,
            libro_id INTEGER,
            capitulo INTEGER,
            numero INTEGER,
            texto TEXT,
            FOREIGN KEY (libro_id) REFERENCES libros(id)
        )
        """
    )
    conn.commit()


def obtener_o_crear_libro(conn: sqlite3.Connection, clave: str) -> int:
    nombre = NOMBRES_LIBROS.get(clave, clave)
    testamento = testamento_de(clave)
    row = conn.execute(
        "SELECT id FROM libros WHERE nombre = ?", (nombre,)
    ).fetchone()
    if row:
        return int(row[0])

    cursor = conn.execute(
        "INSERT INTO libros (nombre, testamento) VALUES (?, ?)",
        (nombre, testamento),
    )
    conn.commit()
    return int(cursor.lastrowid)


def contar_versiculos_capitulo(
    conn: sqlite3.Connection, clave_libro: str, capitulo: int
) -> int:
    """Cuántos versículos hay guardados para ese libro y capítulo (0 si no existe el libro)."""
    nombre = NOMBRES_LIBROS.get(clave_libro, clave_libro)
    row = conn.execute(
        """
        SELECT COUNT(*) FROM versiculos AS v
        INNER JOIN libros AS l ON v.libro_id = l.id
        WHERE l.nombre = ? AND v.capitulo = ?
        """,
        (nombre, capitulo),
    ).fetchone()
    return int(row[0]) if row is not None else 0


def descargar_html(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=40)
    resp.raise_for_status()
    return resp.text


def extraer_versiculos_capitulo(html: str) -> list[Versiculo]:
    soup = BeautifulSoup(html, "html.parser")
    candidatos: list = []

    for selector in (".verse", ".versiculo", '[class*="verse"]', '[id*="verse"]'):
        encontrados = soup.select(selector)
        if encontrados:
            candidatos = encontrados
            break

    versiculos: list[Versiculo] = []
    for nodo in candidatos:
        raw = limpiar_texto(nodo.get_text(" ", strip=True))
        m = re.match(r"^(\d{1,3})\s+(.+)$", raw)
        if not m:
            continue
        numero = int(m.group(1))
        texto = limpiar_texto(m.group(2))
        if texto:
            versiculos.append(Versiculo(numero=numero, texto=texto))

    dedup: dict[int, str] = {}
    for v in versiculos:
        dedup[v.numero] = v.texto

    return [Versiculo(numero=n, texto=t) for n, t in sorted(dedup.items())]


def guardar_capitulo(
    conn: sqlite3.Connection,
    libro_id: int,
    capitulo: int,
    versiculos: list[Versiculo],
) -> int:
    """Solo reemplaza versículos de este libro+capítulo; el resto de la BD se conserva."""
    conn.execute(
        "DELETE FROM versiculos WHERE libro_id = ? AND capitulo = ?",
        (libro_id, capitulo),
    )
    for v in versiculos:
        conn.execute(
            """
            INSERT INTO versiculos (libro_id, capitulo, numero, texto)
            VALUES (?, ?, ?, ?)
            """,
            (libro_id, capitulo, v.numero, v.texto),
        )
    conn.commit()
    return len(versiculos)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Descarga la Biblia (Pueblo de Dios) desde Bibliatodo hacia SQLite."
    )
    parser.add_argument(
        "--db",
        default=DEFAULT_DB,
        help="Ruta al archivo SQLite.",
    )
    parser.add_argument(
        "--libro",
        default=None,
        help="Solo esta clave (ej: genesis, 1samuel). Por defecto, toda la Biblia.",
    )
    parser.add_argument(
        "--desde",
        type=int,
        default=1,
        metavar="N",
        help="Primer capítulo a scrapear (por libro o global según --libro).",
    )
    parser.add_argument(
        "--hasta",
        type=int,
        default=None,
        metavar="N",
        help="Último capítulo inclusive (por defecto: último del libro).",
    )
    parser.add_argument(
        "--sin-pausa",
        action="store_true",
        help="No esperar entre capítulos (solo pruebas locales).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    libros_ordenados = list(LIBROS_CATOLICOS.items())

    if args.libro:
        clave = args.libro.strip().lower()
        if clave not in LIBROS_CATOLICOS:
            raise SystemExit(
                f"Libro desconocido: {args.libro!r}. Claves válidas: "
                + ", ".join(sorted(LIBROS_CATOLICOS))
            )
        max_cap = LIBROS_CATOLICOS[clave]
        desde = max(1, args.desde)
        hasta = args.hasta if args.hasta is not None else max_cap
        hasta = min(hasta, max_cap)
        if desde > hasta:
            raise SystemExit(f"Rango inválido: --desde {desde} > --hasta {hasta}")
        libros_a_procesar = [(clave, max_cap)]
        cap_inicio = desde
        cap_fin = hasta
    else:
        libros_a_procesar = libros_ordenados
        cap_inicio = 1
        cap_fin = None

    conn = sqlite3.connect(args.db)
    total_versiculos = 0
    libros_fallidos: list[tuple[str, str, str]] = []
    primera_peticion_http = True

    try:
        crear_tablas_si_no_existen(conn)

        for clave_libro, max_capitulos in libros_a_procesar:
            nombre_display = NOMBRES_LIBROS.get(clave_libro, clave_libro)
            libro_id: int | None = None
            if args.libro:
                rango = range(cap_inicio, cap_fin + 1)
            else:
                rango = range(1, max_capitulos + 1)

            for cap in rango:
                n_existentes = contar_versiculos_capitulo(conn, clave_libro, cap)
                if n_existentes > 0:
                    print(
                        f"Saltando capítulo {cap} (ya existe) — {nombre_display}"
                    )
                    continue

                if not primera_peticion_http and not args.sin_pausa:
                    time.sleep(DELAY_ENTRE_CAPITULOS)
                primera_peticion_http = False

                url = url_capitulo(clave_libro, cap)
                print(f"{nombre_display} {cap} -> {url}")

                try:
                    html = descargar_html(url)
                except HTTPError as exc:
                    code = (
                        exc.response.status_code
                        if exc.response is not None
                        else "?"
                    )
                    motivo = f"HTTP {code}"
                    print(
                        f"  Omitiendo «{nombre_display}»: {motivo} "
                        f"(cap. {cap}). Se continúa con el siguiente libro."
                    )
                    libros_fallidos.append(
                        (clave_libro, nombre_display, f"{motivo} — cap. {cap} — {url}")
                    )
                    break
                except RequestException as exc:
                    motivo = f"red: {exc!s}"
                    print(
                        f"  Omitiendo «{nombre_display}»: error de red. "
                        f"Se continúa con el siguiente libro."
                    )
                    libros_fallidos.append(
                        (clave_libro, nombre_display, f"{motivo} — cap. {cap} — {url}")
                    )
                    break

                versiculos = extraer_versiculos_capitulo(html)
                if not versiculos:
                    motivo = "sin versículos parseables"
                    print(
                        f"  Omitiendo «{nombre_display}»: {motivo} (cap. {cap}). "
                        f"Se continúa con el siguiente libro."
                    )
                    libros_fallidos.append(
                        (clave_libro, nombre_display, f"{motivo} — cap. {cap} — {url}")
                    )
                    break

                if libro_id is None:
                    libro_id = obtener_o_crear_libro(conn, clave_libro)
                n = guardar_capitulo(conn, libro_id, cap, versiculos)
                total_versiculos += n
    finally:
        conn.close()

    print(f"\nListo. Versículos insertados/actualizados en esta ejecución: {total_versiculos}")

    if libros_fallidos:
        claves_vistas: set[str] = set()
        resumen: list[tuple[str, str, str]] = []
        for clave, nombre, detalle in libros_fallidos:
            if clave not in claves_vistas:
                claves_vistas.add(clave)
                resumen.append((clave, nombre, detalle))

        print("\n--- Libros omitidos o con fallo (completar desde otra fuente) ---")
        for clave, nombre, detalle in resumen:
            print(f"  • [{clave}] {nombre}")
            print(f"    {detalle}")
    else:
        print("\n(Ningún libro omitido en esta ejecución.)")


if __name__ == "__main__":
    main()
