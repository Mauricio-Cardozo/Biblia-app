---
name: expo-sqlite-fts5
description: SQLite and FTS5 quirks specific to Iglesia Digital on Android/Expo. Covers the MIN() aggregate bug on Android, GROUP BY patterns, FTS5 MATCH queries with snippet(), pagination with LIMIT/OFFSET, content FTS5 vs standalone FTS5, and the migration system. Use when writing or debugging DB queries.
---

# expo-sqlite-fts5 — Android Quirks & Patterns

## Android SQLite Version

Android ships with an older SQLite version than iOS. This causes differences in:

1. **`MIN()` inside `GROUP BY`** — On some Android versions, `MIN(id)` inside a `GROUP BY` can return unexpected `id` values when the table has AUTOINCREMENT. The pattern `SELECT libro FROM biblia_pueblo_dios GROUP BY libro ORDER BY MIN(id) ASC` works on iOS but may return wrong rows on Android if the `id` column's ordering doesn't match insertion order.

   **Workaround:** If `MIN(id)` gives wrong results, use a subquery:
   ```sql
   SELECT libro, testamento FROM biblia_pueblo_dios
   GROUP BY libro
   ORDER BY MIN(ROWID) ASC
   ```
   Or add an explicit ordering column.

2. **`PRAGMA compile_options`** — Check available FTS5 features via:
   ```sql
   SELECT * FROM pragma_compile_options WHERE compile_options LIKE 'SQLITE_ENABLE_FTS5'
   ```

## expo-sqlite 16.x API

This project uses `expo-sqlite` 16.x with the synchronous API enabled by `SQLiteProvider`:

```typescript
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

// Inside a component:
const db = useSQLiteContext();

// Query methods:
db.getAllAsync<T>(sql, params?)     // Returns T[]
db.getFirstAsync<T>(sql, params?)   // Returns T | null
db.runAsync(sql, params?)           // Execute (INSERT/UPDATE/DELETE)
```

All queries are parameterized with `?` placeholders. Do NOT interpolate values into SQL strings (security risk and SQLite caching issue).

## GROUP BY Patterns

This project uses `GROUP BY` to get distinct items from a denormalized table:

### Books (Biblia)
```sql
SELECT libro, testamento
FROM biblia_pueblo_dios
GROUP BY libro
ORDER BY MIN(id) ASC
```
The `MIN(id)` trick works because `id` is an auto-incrementing primary key — the first verse of each book has the lowest `id`.

### CIC Parts & Sections
```sql
SELECT parte FROM catecismo_cic GROUP BY parte ORDER BY id ASC
SELECT seccion FROM catecismo_cic WHERE parte = ? GROUP BY seccion ORDER BY id ASC
```

### YOUCAT Parts
```sql
SELECT
  CASE WHEN parte IS NULL OR parte = '' THEN '1. Lo que creemos' ELSE parte END as parte,
  MIN(pregunta_nro) as min_nro,
  MAX(pregunta_nro) as max_nro,
  COUNT(*) as cnt
FROM youcat
GROUP BY parte
ORDER BY MIN(pregunta_nro) ASC
```

**CRITICAL:** The YOUCAT part query handles NULL parts by mapping to `'1. Lo que creemos'`. The `getYoucatPreguntas()` function must also handle this:
```typescript
const isPart1 = parte === "1. Lo que creemos";
// WHERE clause: isPart1 ? "(parte IS NULL OR parte = '')" : "parte = ?"
```

## FTS5 — Full-Text Search

### Content FTS5 (Standalone, NOT external)

This project uses **content FTS5** (NOT external content). The FTS tables are:
```sql
CREATE VIRTUAL TABLE youcat_fts USING fts5(
    id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo,
    content='youcat',
    content_rowid='id'
);
```

The `content='youcat'` parameter links the FTS table to the source table. FTS stores its own copy of the data. Sync triggers (`youcat_ai`, `youcat_ad`, `youcat_au`) keep them in sync.

**IMPORTANT:** The current migration does NOT create sync triggers. It drops and recreates FTS tables as standalone (without `content=` parameter). This means:
- FTS data is a **one-time copy** — changes to source tables won't auto-sync
- After any migration, use the "Rebuild FTS Index" button in the test screen

### FTS5 Query Pattern

```sql
SELECT c.* FROM catecismo_cic c
JOIN catecismo_cic_fts f ON c.id = f.rowid
WHERE catecismo_cic_fts MATCH ?
ORDER BY f.rank
```

The `JOIN` uses `c.id = f.rowid` because FTS5's internal rowid matches the source table's primary key. `f.rank` provides relevance-based ordering (lower = more relevant).

### FTS5 MATCH Syntax

- Simple term: `"Dios"` — matches rows containing "Dios"
- Phrase: `"Espiritu Santo"` — matches the exact phrase
- Prefix: ``"amor"`` — matches "amor", "amoroso", "amorosa", etc. (trailing `*` is implied)
- Boolean: `"Dios AND amor"` — matches both terms
- Column-specific: `"texto: Dios"` — search only the `texto` column
- Negation: `"Dios NOT Satanas"` — exclude rows with "Satanas"

### Using snippet()

`snippet()` extracts matching context around search hits. Currently NOT used in the frontend, but available for improvement:

```sql
SELECT c.id, snippet(catecismo_cic_fts, 0, '<b>', '</b>', '…', 40) as snippet
FROM catecismo_cic c
JOIN catecismo_cic_fts f ON c.id = f.rowid
WHERE catecismo_cic_fts MATCH ?
ORDER BY f.rank
LIMIT 30
```

Parameters: `(table, column_index, open_tag, close_tag, ellipsis, max_tokens)`.

### FTS5 Rebuild Pattern

The test screen rebuilds FTS from scratch when needed:
```typescript
await db.runAsync('DROP TABLE IF EXISTS youcat_fts');
await db.runAsync(`CREATE VIRTUAL TABLE youcat_fts USING fts5(
  id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo
)`);
const rows = await db.getAllAsync<any>(
  "SELECT rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo FROM youcat"
);
for (const r of rows) {
  await db.runAsync(
    "INSERT INTO youcat_fts(rowid, id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [r.rowid, r.id, r.pregunta_nro, r.pregunta_texto, r.respuesta_texto, r.parte, r.capitulo],
  );
}
```

**Note:** `rowid` must be explicitly passed to match the source table's `rowid`.

## Pagination with LIMIT/OFFSET

Use standard SQLite pagination:

```sql
SELECT * FROM biblia_pueblo_dios
WHERE libro = ? AND capitulo = ?
ORDER BY versiculo ASC
LIMIT ? OFFSET ?
```

Most screens in this app show ALL items (no pagination) because dataset sizes are small (< 200 items). Use pagination only if adding infinite scroll to search results or large lists.

## Migration System (`db/init.ts`)

- Version tracked via `PRAGMA user_version`
- `getVersion()` reads it, `setVersion()` writes it
- Migrations are sequential: `if (version < 1) { ... setVersion(1) }`
- `hasColumn()` checks column existence via `PRAGMA table_info(table)`
- `forceReCopy()` deletes the DB file + WAL/SHM so next launch re-copies from assets

### Adding a New Migration

```typescript
if (version < 3) {
  console.log("Migration v3: ...");
  // Your migration SQL here
  await setVersion(db, 3);
}
```

After adding a migration, increment `CURRENT_VERSION` at the top of the file.

## Common Pitfalls

1. **`expo-sqlite` 16.x uses `getAllAsync`/`getFirstAsync`/`runAsync`** — NOT the old `getAllAsync` signature from expo-sqlite 14.x. Parameters are always passed as an array.

2. **Android WAL mode** — On Android, the DB may be in WAL mode. If you see `database is locked` errors, ensure you're not running concurrent writes.

3. **DB asset replacement** — The DB is shipped in `assets/` and copied on first launch. To test schema changes, use `forceReCopy()` from the test screen, then re-launch.

4. **The `lecturas` table has NO FTS5 index** — If full-text search on lecturas is needed, create a `lecturas_fts` table following the same pattern.

5. **Error handling** — Search functions wrap `MATCH` in try/catch and return `[]` on failure, because an invalid FTS query (e.g., bad syntax, missing FTS table) would crash.
