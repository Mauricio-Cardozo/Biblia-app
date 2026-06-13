---
name: scraper-vaticano
description: Vatican News daily readings scraper for Iglesia Digital. Covers the HTML structure of Vatican News, the lecturas table schema, how the 3 sections are parsed (reading, psalm, gospel), the 0.5s sleep between requests, URL pattern, and CLI usage. Use when modifying the scraper or adding new fields.
---

# scraper-vaticano — Vatican News Daily Readings Scraper

## File Location

`archive/scraper_vaticano.py`

## URL Pattern

```
https://www.vaticannews.va/es/evangelio-de-hoy/{year}/{month:02d}/{day:02d}.html
```

Example: `https://www.vaticannews.va/es/evangelio-de-hoy/2026/06/12.html`

## DB Schema (lecturas table)

```sql
CREATE TABLE lecturas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha               TEXT NOT NULL UNIQUE,       -- YYYY-MM-DD
    url                 TEXT,
    titulo_misa         TEXT,                        -- Liturgical title (e.g. "Memoria de san Bernabé")
    primera_lectura_ref TEXT,                        -- Reference (e.g. "Lectura del libro de los Hechos...")
    primera_lectura     TEXT,                        -- First reading text
    salmo               TEXT,                        -- Responsorial psalm
    aleluia             TEXT,                        -- Alleluia verse
    evangelio_ref       TEXT,                        -- Gospel reference
    evangelio           TEXT,                        -- Gospel text
    comentario_papal    TEXT,                        -- Papal commentary
    creado_en           TEXT DEFAULT (datetime('now','localtime'))
);
```

## HTML Parser (`LecturasParser`)

Uses Python's `html.parser.HTMLParser` (no external dependencies needed).

### Section Detection via `<h2>` Text

| `<h2>` text (lowercase) | Section key |
|---|---|
| `"lectura del día"` | `lectura` → `primera_lectura` |
| `"salmo responsorial"` | `salmo` |
| `"aleluya"` | `aleluia` |
| `"evangelio del día"` | `evangelio` |
| `"las palabras de los papas"` | `papas` → `comentario_papal` |

### Reference Detection

Lines starting with these regex patterns are treated as **references**, not content:

```python
_RE_REF = re.compile(
    r"^(Lectura del (libro|santo)|De la (primera|carta)|Comienzo|Lectura de la carta)",
    re.IGNORECASE,
)
```

This means `primera_lectura_ref` is the first `<p>` in the "lectura" section that matches the regex. All subsequent `<p>` elements go to `primera_lectura`.

### HTML Structure Expected

```
<section>
  <h2>Lectura del día</h2>
  <div class="section__content">
    <p>Lectura del libro de los Hechos...  ← captured as primera_lectura_ref</p>
    <p>En aquellos días...                  ← captured as primera_lectura</p>
  </div>
</section>
<section>
  <h2>Salmo responsorial</h2>
  <div class="section__content">
    <p>Salmo 116...                         ← captured as salmo</p>
  </div>
</section>
<section>
  <h2>Aleluya</h2>
  <div class="section__content">
    <p>Aleluya, aleluya...                  ← captured as aleluia</p>
  </div>
</section>
<section>
  <h2>Evangelio del día</h2>
  <div class="section__content">
    <p>Lectura del santo Evangelio...       ← captured as evangelio_ref</p>
    <p>En aquel tiempo...                   ← captured as evangelio</p>
  </div>
</section>
<section>
  <h2>Las palabras de los papas</h2>
  <div class="section__content">
    <p>El Papa Francisco...                 ← captured as comentario_papal</p>
  </div>
</section>
```

The **liturgical title** (`titulo_misa`) is extracted from a `<div class="indicazioneLiturgica">` element.

## CLI Usage

```bash
# Current month + next month (default behavior)
python3 archive/scraper_vaticano.py

# Single date
python3 archive/scraper_vaticano.py --fecha 2026-06-11

# Date range
python3 archive/scraper_vaticano.py --desde 2026-06-01 --hasta 2026-06-30

# Preview (parse without saving to DB)
python3 archive/scraper_vaticano.py --preview --fecha 2026-06-11

# List saved records
python3 archive/scraper_vaticano.py --list
```

## CLI Behavior Details

- **Default range:** From 15 days before the current month's start, through the end of the next month
- **Already-scraped dates:** Skipped automatically (via `existe_fecha()` check using `UNIQUE` constraint)
- **404 handling:** Silently skips with log message
- **Rate limiting:** `time.sleep(0.5)` between requests

## Key Constants

```python
DB_PATH = "AppMovil/assets/iglesia_digital.db"    # Relative to project root
BASE_URL = "https://www.vaticannews.va/es/evangelio-de-hoy/{year}/{month:02d}/{day:02d}.html"
USER_AGENT = "Mozilla/5.0 (compatible; IglesiaDigital/1.0)"
SLEEP_SECS = 0.5
```

## Save Logic

```python
def guardar(lectura: dict) -> bool:
    conn.execute(
        """INSERT INTO lecturas
           (fecha, url, titulo_misa, primera_lectura_ref, primera_lectura,
            salmo, aleluia, evangelio_ref, evangelio, comentario_papal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (...)  # 10 params
    )
```

Returns `True` on insert, `False` if `IntegrityError` (duplicate `fecha`).

## Text Cleaning

```python
def _limpiar(texto: str | None) -> str | None:
    if texto is None: return None
    texto = re.sub(r"\s*\n\s*", "\n", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip() or None
```

This collapses excessive whitespace but preserves meaningful line breaks.

## Adding New Fields

If a new section needs to be scraped:
1. Add an `<h2>` key to `_SECCIONES` dict
2. Add an attribute in `LecturasParser.__init__()`
3. Add the flush logic in `_flush_buff()`
4. Add a column to the schema and the INSERT
5. Add to `_preview()` output

## Known Limitation

The parser extracts text from `<p>` tags inside `section__content` divs. If Vatican News changes their HTML structure (e.g., different class names for the content div), the parser will silently return no data.
