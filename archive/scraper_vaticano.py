#!/usr/bin/env python3
"""
Scraper deuterocanónicos / suplementos desde Vatican.va -> SQLite.

Configuración por libro: URL inicial, capítulo máximo (edición Vaticano) y
reglas especiales (Ester_Suplementos, Daniel con capítulos 3/13/14, etc.).

Guarda en: biblia_pueblo_dios.db
"""

from __future__ import annotations

import argparse
import re
import sqlite3
import time
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag
from requests.exceptions import RequestException


VACAN_BASE = "https://www.vatican.va/archive/ESL0506/"


@dataclass(frozen=True)
class LibroVaticano:
    """nombre: clave en BD; max_cap: último capítulo permitido (None = sin tope numérico)."""

    nombre: str
    url: str
    max_cap: Optional[int]
    solo_capitulos: Optional[tuple[int, ...]] = None
    urls_fijas: Optional[tuple[tuple[int, str], ...]] = None


# Edición Vatican.va ESL0506: URL + capítulo máximo (y reglas especiales).
LIBROS_VATICANO: tuple[LibroVaticano, ...] = (
    LibroVaticano("Tobías", f"{VACAN_BASE}__PQV.HTM", 14),
    LibroVaticano("Judit", f"{VACAN_BASE}__PQ4.HTM", 16),
    LibroVaticano(
        "Ester_Suplementos",
        f"{VACAN_BASE}__PNK.HTM",
        None,
    ),
    LibroVaticano("1 Macabeos", f"{VACAN_BASE}__PR9.HTM", 16),
    LibroVaticano("2 Macabeos", f"{VACAN_BASE}__PRP.HTM", 15),
    LibroVaticano("Sabiduría", f"{VACAN_BASE}__PS4.HTM", 19),
    LibroVaticano("Eclesiástico", f"{VACAN_BASE}__PSN.HTM", 51),
    LibroVaticano("Baruc", f"{VACAN_BASE}__PU2.HTM", 5),
    LibroVaticano("Carta de Jeremías", f"{VACAN_BASE}__PUG.HTM", 1),
    LibroVaticano(
        "Daniel (Suplementos)",
        f"{VACAN_BASE}__PU7.HTM",
        14,
        solo_capitulos=(3, 13, 14),
        urls_fijas=(
            (3, f"{VACAN_BASE}__PU9.HTM"),
            (13, f"{VACAN_BASE}__PVJ.HTM"),
            (14, f"{VACAN_BASE}__PVK.HTM"),
        ),
    ),
)

LIBROS_POR_NOMBRE: dict[str, LibroVaticano] = {c.nombre: c for c in LIBROS_VATICANO}

DEFAULT_DB = "biblia_pueblo_dios.db"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
}
REQUEST_DELAY_SECONDS = 1.5


@dataclass
class Versiculo:
    numero: int
    texto: str


def limpiar_texto(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def normalizar(value: str) -> str:
    value = value.lower()
    repl = (
        ("á", "a"),
        ("é", "e"),
        ("í", "i"),
        ("ó", "o"),
        ("ú", "u"),
        ("ü", "u"),
        ("ñ", "n"),
    )
    for src, dst in repl:
        value = value.replace(src, dst)
    return value


def extraer_numero_capitulo(html: str) -> Optional[int]:
    """Intenta leer el número de capítulo desde el texto de la página."""
    soup = BeautifulSoup(html, "html.parser")
    text = limpiar_texto(soup.get_text(" ", strip=True))
    text_n = normalizar(text)

    for patron in (
        r"cap[ií]tulo\s*(\d{1,2})\b",
        r"\bcap\s*\.?\s*(\d{1,2})\b",
        r"\b(\d{1,2})\s*º\s*cap",
    ):
        m = re.search(patron, text_n, flags=re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


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


def obtener_o_crear_libro(conn: sqlite3.Connection, nombre: str) -> int:
    row = conn.execute("SELECT id FROM libros WHERE nombre = ?", (nombre,)).fetchone()
    if row:
        return int(row[0])
    cursor = conn.execute(
        "INSERT INTO libros (nombre, testamento) VALUES (?, ?)", (nombre, "Antiguo")
    )
    conn.commit()
    return int(cursor.lastrowid)


def descargar_html(url: str) -> str:
    response = requests.get(url, timeout=40, headers=HEADERS)
    response.raise_for_status()
    return response.text


def extraer_versiculos(html: str) -> list[Versiculo]:
    soup = BeautifulSoup(html, "html.parser")
    verses: list[Versiculo] = []

    for p in soup.find_all("p"):
        raw = limpiar_texto(p.get_text(" ", strip=True))
        if not raw:
            continue
        raw_lower = raw.lower()
        if "anterior - siguiente" in raw_lower or "copyright" in raw_lower:
            continue

        bold = p.find("b")
        if bold:
            bold_text = limpiar_texto(bold.get_text(" ", strip=True))
            m_bold = re.match(r"^(\d{1,3})[\)\.\-:]?$", bold_text)
            if m_bold:
                numero = int(m_bold.group(1))
                full_text = raw
                texto = re.sub(r"^\d{1,3}[\)\.\-:]?\s*", "", full_text).strip()
                if texto:
                    verses.append(Versiculo(numero=numero, texto=limpiar_texto(texto)))
                continue

        match = re.match(r"^(\d{1,3})[\)\.\-:]?\s+(.+)$", raw)
        if match:
            numero = int(match.group(1))
            texto = limpiar_texto(match.group(2))
            if texto:
                verses.append(Versiculo(numero=numero, texto=texto))

    dedup: dict[int, str] = {}
    for v in verses:
        dedup[v.numero] = v.texto

    return [Versiculo(numero=n, texto=t) for n, t in sorted(dedup.items())]


def _anchor_score(anchor: Tag) -> int:
    score = 0
    text = limpiar_texto(anchor.get_text(" ", strip=True)).lower()
    href = (anchor.get("href") or "").lower()
    html_blob = str(anchor).lower()

    keywords = ("siguiente", "next", "sig.", "capítulo siguiente", "capitulo siguiente")
    if any(k in text for k in keywords):
        score += 8
    if any(k in href for k in ("next", "sig", "cap")):
        score += 2

    if "<img" in html_blob and any(k in html_blob for k in ("right", "derecha", "next")):
        score += 10
    elif "<img" in html_blob:
        score += 4

    return score


def encontrar_siguiente_url(html: str, current_url: str) -> Optional[str]:
    soup = BeautifulSoup(html, "html.parser")
    best_href = None
    best_score = 0

    for anchor in soup.find_all("a", href=True):
        score = _anchor_score(anchor)
        if score > best_score:
            best_score = score
            best_href = anchor["href"]

    if not best_href or best_score < 4:
        return None

    return urljoin(current_url, best_href)


def codigo_archivo_vaticano(url: str) -> Optional[str]:
    m = re.search(r"/__(\w{3})\.HTM$", url, flags=re.IGNORECASE)
    if not m:
        return None
    return m.group(1).upper()


def esther_url_permitida(url: str) -> bool:
    """
    Ester_Suplementos: solo __PNK.HTM a __PNZ.HTM.
    Corta en __PO0.HTM o cualquier URL fuera de ese bloque.
    """
    code = codigo_archivo_vaticano(url)
    if not code:
        return False
    if len(code) != 3:
        return False
    if not code.startswith("PN"):
        return False
    return "K" <= code[2] <= "Z"


def guardar_capitulo(
    conn: sqlite3.Connection, libro_id: int, capitulo: int, versiculos: list[Versiculo]
) -> None:
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


def scrape_libro(conn: sqlite3.Connection, cfg: LibroVaticano) -> bool:
    libro_id = obtener_o_crear_libro(conn, cfg.nombre)

    # Daniel (Suplementos): usar solo URLs fijas, sin flecha "Siguiente".
    if cfg.urls_fijas:
        for idx, (cap, fixed_url) in enumerate(cfg.urls_fijas):
            if idx > 0:
                time.sleep(REQUEST_DELAY_SECONDS)
            print(f"{cfg.nombre} [cap {cap}] -> {fixed_url}")
            try:
                html = descargar_html(fixed_url)
            except RequestException as exc:
                print(f"  Fallo en {cfg.nombre} cap. {cap}: {exc}")
                return False

            versiculos = extraer_versiculos(html)
            if not versiculos:
                print(
                    f"  Sin versículos parseables en «{cfg.nombre}» "
                    f"(cap. almacén {cap})."
                )
                return False
            guardar_capitulo(conn, libro_id, cap, versiculos)
        return True

    url: Optional[str] = cfg.url
    visited: set[str] = set()
    first_request = True
    paso_navegacion = 1
    daniel_guardados: set[int] = set()
    max_pasos_seguridad = 600

    while url and url not in visited:
        # Corte por límite de capítulo: solo cuando el contador es el número de capítulo real
        # (libros lineales). Daniel (solo_capitulos) usa el número detectado en la página.
        if (
            cfg.solo_capitulos is None
            and cfg.max_cap is not None
            and paso_navegacion > cfg.max_cap
        ):
            print(
                f"  Límite de capítulos ({cfg.max_cap}) alcanzado para «{cfg.nombre}». "
                "Fin del libro (sin seguir la flecha)."
            )
            break

        if paso_navegacion > max_pasos_seguridad:
            print("  Límite de seguridad de navegación alcanzado. Se detiene.")
            break

        if not first_request:
            time.sleep(REQUEST_DELAY_SECONDS)
        first_request = False

        # Ester_Suplementos: límite estricto de URLs.
        if cfg.nombre == "Ester_Suplementos" and not esther_url_permitida(url):
            print("  URL fuera de rango permitido para Ester_Suplementos. Se detiene.")
            break

        print(f"{cfg.nombre} [paso {paso_navegacion}] -> {url}")
        try:
            html = descargar_html(url)
        except RequestException as exc:
            print(f"  Fallo en {cfg.nombre}: {exc}")
            return False

        cap_para_guardar: Optional[int]
        if cfg.solo_capitulos is not None:
            cap_detectado = extraer_numero_capitulo(html)
            if cap_detectado is None:
                print("  No se detectó número de capítulo en la página; se omite guardado.")
                cap_para_guardar = None
            elif cfg.max_cap is not None and cap_detectado > cfg.max_cap:
                print(
                    f"  Capítulo detectado ({cap_detectado}) > máximo ({cfg.max_cap}). Fin."
                )
                break
            elif cap_detectado not in cfg.solo_capitulos:
                print(
                    f"  Capítulo {cap_detectado} no está en {cfg.solo_capitulos}; "
                    "solo navegación."
                )
                cap_para_guardar = None
            else:
                cap_para_guardar = cap_detectado
        else:
            cap_para_guardar = paso_navegacion

        if cap_para_guardar is not None:
            versiculos = extraer_versiculos(html)
            if not versiculos:
                print(
                    f"  Sin versículos parseables en «{cfg.nombre}» "
                    f"(cap. almacén {cap_para_guardar})."
                )
                return False
            guardar_capitulo(conn, libro_id, cap_para_guardar, versiculos)
            if cfg.solo_capitulos is not None:
                daniel_guardados.add(cap_para_guardar)
                if daniel_guardados.issuperset(set(cfg.solo_capitulos)):
                    print("  Daniel (Suplementos): capítulos 3, 13 y 14 guardados. Fin.")
                    break

        visited.add(url)

        if (
            cfg.solo_capitulos is None
            and cfg.max_cap is not None
            and paso_navegacion >= cfg.max_cap
        ):
            print(
                f"  Último capítulo permitido ({cfg.max_cap}) procesado para «{cfg.nombre}». "
                "No se sigue la flecha."
            )
            break

        next_url = encontrar_siguiente_url(html, url)
        if not next_url or next_url in visited:
            break
        if cfg.nombre == "Ester_Suplementos" and not esther_url_permitida(next_url):
            print("  Siguiente URL fuera de __PNK..__PNZ. Fin de Ester_Suplementos.")
            break
        url = next_url
        paso_navegacion += 1

    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Completa libros usando Vatican.va hacia biblia_pueblo_dios.db"
    )
    parser.add_argument("--db", default=DEFAULT_DB, help="Ruta de la base SQLite.")
    parser.add_argument(
        "--libro",
        default=None,
        help="Procesar solo un libro (nombre exacto de LIBROS_VATICANO).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if args.libro:
        if args.libro not in LIBROS_POR_NOMBRE:
            raise SystemExit(
                "Libro inválido. Opciones: "
                + ", ".join(LIBROS_POR_NOMBRE.keys())
            )
        targets = [LIBROS_POR_NOMBRE[args.libro]]
    else:
        targets = list(LIBROS_VATICANO)

    conn = sqlite3.connect(args.db)
    failed_books: list[str] = []
    try:
        crear_tablas_si_no_existen(conn)
        for idx, cfg in enumerate(targets):
            if idx > 0:
                time.sleep(REQUEST_DELAY_SECONDS)
            ok = scrape_libro(conn, cfg)
            if not ok:
                failed_books.append(cfg.nombre)
    finally:
        conn.close()

    print("\nProceso finalizado.")
    if failed_books:
        print("\nLibros con fallo:")
        for name in failed_books:
            print(f"- {name}")
    else:
        print("Sin fallos.")


if __name__ == "__main__":
    main()
