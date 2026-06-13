"""
Scraper de novenas desde devocionario.com (HTML limpio, Adobe PageMill).

Usage:
  python3 archive/scraper_novenas.py --preview          # scrape 1 novena, print JSON
  python3 archive/scraper_novenas.py --preview --limit 3 # scrape 3 novenas
  python3 archive/scraper_novenas.py --db               # write directly to DB

Source: https://www.devocionario.com
"""

import sys, json, re, time, html as html_mod, sqlite3, os
import requests
from bs4 import BeautifulSoup

BASE = "https://www.devocionario.com"
DELAY = 1.0
_UA = "Mozilla/5.0 (compatible; IglesiaDigitalBot/1.0)"

def fetch(url):
    for attempt in range(3):
        try:
            resp = requests.get(url, timeout=30, headers={
                "User-Agent": _UA,
                "Accept": "text/html,application/xhtml+xml",
            })
            if resp.status_code == 200:
                return resp.text
            print(f"  HTTP {resp.status_code}, retrying...", file=sys.stderr)
        except Exception as e:
            print(f"  Attempt {attempt+1}/3 failed: {e}", file=sys.stderr)
        time.sleep(1)
    return None

def extract_text(soup):
    for tag in soup.find_all(['script', 'style', 'nav']):
        tag.decompose()
    text = soup.get_text(separator=' ')
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Known novena pages on devocionario.com
# Format: (title, url)
NOVENA_SOURCES = [
    # Espíritu Santo
    ("Novena al Espíritu Santo", f"{BASE}/espiritu/novena_1.html"),
    # Virgen María (single-page)
    ("Novena en honor de la Virgen María", f"{BASE}/maria/novena_1.html"),
    ("Novena de la Inmaculada Concepción", f"{BASE}/maria/inmaculada_2.html"),
    ("Novena de Nuestra Señora de Guadalupe", f"{BASE}/maria/guadalupe_2.html"),
    ("Novena de Nuestra Señora de Lourdes (breve)", f"{BASE}/maria/lourdes_7.html"),
    ("Novena de María Auxiliadora", f"{BASE}/maria/auxiliadora_2.html"),
    ("Novena de la Medalla Milagrosa (breve)", f"{BASE}/maria/medalla_8.html"),
    ("Novena de la Virgen de la Merced", f"{BASE}/maria/mercedes_2.html"),
    ("Novena del Perpetuo Socorro (breve)", f"{BASE}/maria/socorro_2.html"),
    ("Novena del Perpetuo Socorro (milagro)", f"{BASE}/maria/socorro_3.html"),
    ("Novena de la Virgen del Rosario", f"{BASE}/maria/v_rosario_1.html"),
    ("Novena de la Virgen de Salette", f"{BASE}/maria/salette_2.html"),
    ("Novena de la Virgen de los Dolores", f"{BASE}/maria/dolores_2.html"),
    ("Novena de Nuestra Señora de la Caridad del Cobre", f"{BASE}/maria/caridad_del_cobre_2.html"),
    ("Novena del Sagrado Corazón de María", f"{BASE}/maria/corazon_3.html"),
    ("Novena de la Virgen de la Almudena", f"{BASE}/maria/almudena_2.html"),
    ("Novena de la Virgen de Banneux", f"{BASE}/maria/banneux_1.html"),
    ("Novena del Perpetuo Socorro (milagro)", f"{BASE}/maria/socorro_3.html"),
    ("Novena de las Tres Avemarías", f"{BASE}/maria/3_marias.html"),
    ("Novena de la Natividad de María", f"{BASE}/maria/infantita_2.html"),
    ("Novena de Nuestra Señora de las Lágrimas", f"{BASE}/maria/lagrimas_2.html"),
    ("Novena de Nuestra Señora Desatanudos", f"{BASE}/maria/desatanudos_2.html"),
    # San José
    ("Novena a San José", f"{BASE}/jose/jose_5.html"),
    # Jesucristo / Sagrado Corazón
    ("Novena al Sagrado Corazón de Jesús", f"{BASE}/jesucristo/scorazon_5.html"),
    ("Novena a la Divina Misericordia", f"{BASE}/jesucristo/misericordia_5.html"),
    # Santos (populares) - single-page novenas
    ("Novena a San Antonio de Padua (breve)", f"{BASE}/santos/padua_5.html"),
    ("Novena completa a San Judas Tadeo", f"{BASE}/santos/judas_7.html"),
    ("Novena breve a San Judas Tadeo", f"{BASE}/santos/judas_6.html"),
    ("Novena a Santa Rita de Casia", f"{BASE}/santos/rita_5.html"),
    ("Novena a San José de Cupertino", f"{BASE}/santos/cupertino_5.html"),
    ("Novena al Padre Pío", f"{BASE}/santos/pio_5.html"),
    ("Novena a San Juan Bosco", f"{BASE}/santos/juanbosco_5.html"),
    ("Novena a San Francisco de Asís", f"{BASE}/santos/francisco_5.html"),
    ("Novena a Santa Clara de Asís", f"{BASE}/santos/clara_5.html"),
    ("Novena a Santa Teresita", f"{BASE}/santos/teresita_5.html"),
    ("Novena a San Benito Abad", f"{BASE}/santos/benito_5.html"),
    ("Novena a Santa Marta", f"{BASE}/santos/marta_5.html"),
    ("Novena a San Blas", f"{BASE}/santos/blas_5.html"),
    ("Novena a San Cayetano", f"{BASE}/santos/cayetano_5.html"),
    ("Novena a San Expedito", f"{BASE}/santos/expedito_5.html"),
    ("Novena a San Martín de Porres", f"{BASE}/santos/martin_5.html"),
    ("Novena a San Juan Pablo II", f"{BASE}/santos/juanpablo_5.html"),
    ("Novena a Santa Rosa de Lima", f"{BASE}/santos/rosa_5.html"),
    ("Novena a San Patricio", f"{BASE}/santos/patricio_5.html"),
    ("Novena a San Miguel Arcángel", f"{BASE}/santos/miguel_5.html"),
    ("Novena de la Santa Cruz", f"{BASE}/jesucristo/scruz_5.html"),
]


def parse_novena(html, titulo):
    """Extract days from a devocionario.com novena page."""
    soup = BeautifulSoup(html, 'html.parser')
    # Get all text
    text = soup.get_text(separator='\n')

    # Split into days by "DÍA PRIMERO", "DÍA SEGUNDO", etc.
    day_pattern = re.compile(
        r'D[ÍI]A\s+(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO)\b',
        re.IGNORECASE
    )

    # Find all day headers with their positions
    sections = []
    last_end = 0
    matches = list(day_pattern.finditer(text))
    
    if not matches:
        # Try "Día 1", "Día 2" pattern
        day_pattern2 = re.compile(r'D[íi]a\s+(\d+)\b', re.IGNORECASE)
        matches = list(day_pattern2.finditer(text))
        # Filter to only numbered days 1-9 that look like day markers
        filtered = []
        for m in matches:
            d = int(m.group(1))
            if 1 <= d <= 9:
                # Check context: should be near start of a paragraph
                ctx = text[max(0, m.start()-20):m.end()+20]
                if 'Día' in ctx or 'dia' in ctx:
                    filtered.append(m)
        matches = filtered

    if not matches:
        return None

    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        day_text = text[start:end].strip()
        sections.append({
            'dia': i + 1,
            'header': m.group(0).strip(),
            'texto': day_text
        })

    # Only keep first 9 days, truncate at known footers
    sections = sections[:9]

    for s in sections:
        txt = s['texto']
        # Truncate at common navigation footers
        for footer in ['[Indice]', '[Subir]', 'Principal |', 'Devocionario Católico -', '__________']:
            idx = txt.find(footer)
            if idx > 0:
                txt = txt[:idx]
        s['texto'] = re.sub(r'\n\s*\n', '\n\n', txt)
        s['texto'] = re.sub(r'[ \t]+', ' ', s['texto'])
        s['texto'] = s['texto'].strip()
        s['titulo'] = s['header'].replace('\n', ' ').strip()

    return sections


def scrape_novena(titulo, url):
    """Scrape a single novena from devocionario.com."""
    html = fetch(url)
    if not html:
        return None
    days = parse_novena(html, titulo)
    if not days:
        print(f"  No days found", file=sys.stderr)
        return None
    return {
        'titulo': titulo,
        'url': url,
        'dias': days
    }


def scrape_all(limit=None):
    """Scrape all novenas from the list."""
    sources = NOVENA_SOURCES
    if limit:
        sources = sources[:limit]

    results = []
    for i, (titulo, url) in enumerate(sources):
        print(f"[{i+1}/{len(sources)}] {titulo}", file=sys.stderr)
        time.sleep(DELAY)
        try:
            nov = scrape_novena(titulo, url)
            if nov:
                results.append(nov)
                print(f"  OK ({len(nov['dias'])} days)", file=sys.stderr)
            else:
                print(f"  FAILED", file=sys.stderr)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)

    return results


def write_db(results, db_path):
    """Write novenas to the SQLite database (iglesia_digital.db)."""
    # Ensure the DB exists and has the right schema
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("""CREATE TABLE IF NOT EXISTS novenas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        url TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS novena_dias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novena_id INTEGER NOT NULL,
        dia INTEGER NOT NULL,
        titulo TEXT,
        texto TEXT NOT NULL,
        FOREIGN KEY (novena_id) REFERENCES novenas(id)
    )""")

    # Clear existing data (for re-runs)
    c.execute("DELETE FROM novena_dias")
    c.execute("DELETE FROM novenas")

    for nov in results:
        c.execute("INSERT INTO novenas (titulo, url) VALUES (?, ?)",
                  (nov['titulo'], nov['url']))
        novena_id = c.lastrowid
        for d in nov['dias']:
            c.execute("INSERT INTO novena_dias (novena_id, dia, titulo, texto) VALUES (?, ?, ?, ?)",
                      (novena_id, d['dia'], d.get('titulo', f'Día {d["dia"]}'), d['texto']))

    conn.commit()
    conn.close()
    print(f"Written {len(results)} novenas to {db_path}", file=sys.stderr)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Scrape novenas from devocionario.com')
    parser.add_argument('--preview', action='store_true', help='Print JSON to stdout')
    parser.add_argument('--limit', type=int, default=None, help='Max novenas to scrape')
    parser.add_argument('--db', type=str, default=None, help='Write to SQLite DB file')
    args = parser.parse_args()

    if not any(vars(args).values()):
        parser.print_help()
        sys.exit(1)

    results = scrape_all(limit=args.limit)

    if args.preview:
        print(json.dumps(results, ensure_ascii=False, indent=2))

    if args.db:
        write_db(results, args.db)
