---
name: iglesia-digital-context
description: Complete project context for Iglesia Digital — a Catholic mobile app (Expo/React Native) with SQLite, FTS5, Vatican News scraper, Rosary, Bible, CIC, and YOUCAT. Read this FIRST before making any changes. Covers DB schema, color palette, coding rules, file structure, known issues, and platform quirks.
---

# Iglesia Digital — Project Context

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, React Native 0.81.5 |
| Routing | expo-router 6.x (file-based, native stack) |
| Database | expo-sqlite 16.x, single `iglesia_digital.db` |
| Full-Text Search | FTS5 (content tables + standalone virtual tables) |
| Lists | @shopify/flash-list 2.0.2 |
| Navigation Tabs | @react-navigation/bottom-tabs 7.x (JS-based, NOT native tabs) |
| Animations | react-native-reanimated 4.1.1 |
| Gestures | react-native-gesture-handler 2.28.0 |
| Async Storage | @react-native-async-storage/async-storage 2.2.0 |
| Icons (iOS) | expo-symbols (SF Symbols) |
| Icons (Android) | @expo/vector-icons (MaterialIcons) |
| Backend (scraper) | Python 3, standard library + pdfplumber |
| Scripts | `npm start`, `npm run android`, `npm run ios`, `npm run web` |

## Database Schema (`iglesia_digital.db`)

### `biblia_pueblo_dios` — Bible (El Libro del Pueblo de Dios)

```sql
CREATE TABLE biblia_pueblo_dios (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    libro     TEXT,
    capitulo  INTEGER,
    versiculo INTEGER,
    texto     TEXT,
    testamento TEXT    -- 'Antiguo' | 'Nuevo'
);
```

Queries use `MIN(id)` for ordering: `GROUP BY libro ORDER BY MIN(id) ASC`.

### `catecismo_cic` — Catechism of the Catholic Church

```sql
CREATE TABLE catecismo_cic (
    id       INTEGER PRIMARY KEY,   -- Numeral number (1-2865)
    parte    TEXT,
    seccion  TEXT,
    capitulo TEXT,
    articulo TEXT,
    texto    TEXT NOT NULL
);
```

### `catecismo_cic_fts` — FTS5 virtual table (standalone, data copied)

```sql
CREATE VIRTUAL TABLE catecismo_cic_fts USING fts5(
    id, parte, seccion, capitulo, articulo, texto,
    content='catecismo_cic',
    content_rowid='id'
);
```
Triggers: `catecismo_cic_ai`, `catecismo_cic_ad`, `catecismo_cic_au` (sync triggers).

### `youcat` — YOUCAT

```sql
CREATE TABLE youcat (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    pregunta_nro    INTEGER NOT NULL,
    pregunta_texto  TEXT NOT NULL,
    respuesta_texto TEXT NOT NULL,
    parte           TEXT,
    capitulo        TEXT
);
```

### `youcat_fts` — FTS5 virtual table (standalone)

```sql
CREATE VIRTUAL TABLE youcat_fts USING fts5(
    id, pregunta_nro, pregunta_texto, respuesta_texto, parte, capitulo,
    content='youcat',
    content_rowid='id'
);
```
Triggers: `youcat_ai`, `youcat_ad`, `youcat_au`.

### `lecturas` — Daily readings from Vatican News

```sql
CREATE TABLE lecturas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha               TEXT NOT NULL UNIQUE,       -- YYYY-MM-DD
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
```

## Migration System (`db/init.ts`)

- `PRAGMA user_version` tracks schema version
- `CURRENT_VERSION = 2`
- v1: Creates FTS5 tables for youcat + catecismo_cic (standalone, with sync triggers)
- v2: `ALTER TABLE youcat ADD COLUMN parte TEXT`

Known issue: The CURRENT migration **drops and recreates** FTS tables each time. This means data must be re-inserted into FTS after migration.

## Color Palette (`constants/theme.ts`)

```typescript
export const C = {
  navy:      '#0D1B2A',   // Main background
  navyMid:   '#1A2D45',   // Cards, headers
  navyLight: '#243B55',   // Buttons, secondary elements
  gold:      '#C9A84C',   // Accents, verse numbers
  goldLight: '#E8C97A',   // Highlighted text
  goldDim:   '#8B6914',   // Borders, badges
  text:      '#F0E6CC',   // Main text
  muted:     '#9BA8B5',   // Muted/secondary text
  sep:       '#1E3050',   // Separators
  error:     '#E07070',   // Error text
};
```

Import as `import { C } from '@/constants/theme'`. The palette is Navy/Gold, inspired by liturgical colors.

## File Structure

```
AppMovil/
├── app/                          # expo-router pages
│   ├── _layout.tsx               # Root: SQLiteProvider → DatabaseInit → Stack
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar (4 tabs)
│   │   ├── index.tsx             # Home (Evangelio card, Rachas, YOUCAT link)
│   │   ├── biblia.tsx            # Bible: 3-level drill-down
│   │   ├── catecismo.tsx         # CIC: 4-level drill-down + FTS5 search
│   │   └── youcat.tsx            # YOUCAT: 3-level drill-down + FTS5 search
│   ├── rosario/
│   │   └── guia.tsx              # Guided Rosary (78 steps, AsyncStorage streak)
│   ├── evangelio.tsx             # PLACEHOLDER — Gospel detail not implemented
│   ├── modal.tsx                 # PLACEHOLDER
│   └── test.tsx                  # DB debug sandbox
├── components/
│   ├── ui/
│   │   ├── icon-symbol.ios.tsx   # SF Symbols (iOS)
│   │   └── icon-symbol.tsx       # MaterialIcons fallback (Android/web)
│   ├── haptic-tab.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ...
├── constants/
│   └── theme.ts                  # C palette + Colors + Fonts
├── db/
│   ├── db.ts                     # All SQL query functions
│   └── init.ts                   # DB initialization + migration
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts        # Resolves light/dark from C palette
└── types/
    └── index.ts                  # TypeScript interfaces
archive/                          # Python scrapers & data ingestion
└── scraper_vaticano.py           # Vatican News daily readings scraper
```

## Coding Rules

### Never Use
- **`<SafeAreaView>`** — use `contentInsetAdjustmentBehavior="automatic"` on ScrollView instead
- **`TouchableOpacity`/`TouchableHighlight`** — use `Pressable` from react-native
- **`ScrollView` for lists** — use `FlashList` from `@shopify/flash-list`
- **`<Image>` from react-native** — use `Image` from `expo-image`
- **`&&` for conditional rendering** with falsy values (use ternary)
- **Strings outside `<Text>`** — wraps all strings in Text

### Always Use
- **`FlashList`** for any scrollable list (Biblia, Catecismo, YOUCAT)
- **`C` palette** via `import { C } from '@/constants/theme'`
- **expo-router `<Stack>` and `<Tabs>`** for navigation
- **`useSQLiteContext()`** for DB access (provided by `SQLiteProvider`)
- **`Platform.OS === "android"`** checks for platform-specific padding
- **Dual icon files** — `.ios.tsx` (SF Symbols) + `.tsx` (MaterialIcons)

### DB Query Patterns
- `GROUP BY libro ORDER BY MIN(id)` — for getting distinct books
- `ORDER BY f.rank` — for FTS5 search results
- No `snippet()` used yet in frontend (but available in FTS5)
- Migration via `PRAGMA user_version` comparison

### Android Padding Quirks
- `paddingTop: Platform.OS === "android" ? 12 : 8` — in screen headers
- `paddingBottom: Platform.OS === "android" ? 16 : 32` — in rosario footer
- Haptics: `if (process.env.EXPO_OS === 'ios')` only

## Known Issues

1. **`MIN()` in SQLite on Android** — When using `MIN()` as an aggregate inside a `GROUP BY` on large tables, Android's SQLite version may behave differently than iOS. The `getLibros()` query uses `MIN(id)` for ordering. If you see incorrect grouping or ordering on Android, verify the SQLite version via `PRAGMA compile_options`.

2. **FTS5 rebuild on migration** — Current migration drops and recreates FTS tables, losing data. The test screen has a "Rebuild FTS Index" button. After migration, FTS content must be re-populated.

3. **Content FTS5 vs Standalone FTS5** — The youcat and catecismo_cic FTS tables are `content=` type (linked to source tables with sync triggers). They are NOT external content tables. This means `INSERT`/`UPDATE`/`DELETE` on source tables auto-syncs to FTS via triggers, but the triggers must exist.

4. **Streak system incomplete** — `racha_rosario_ultima` is written to AsyncStorage on rosary completion, but home screen uses hardcoded `"🔥 5 días"` / `"🔥 2 días"` placeholders. No streak calculation logic exists yet.

5. **Evangelio screen** — `app/evangelio.tsx` is a placeholder. No actual query reads from the `lecturas` table in the frontend yet.

6. **lecturas table** — Created by Python scraper only. No frontend queries consume it.

7. **DB asset replacement** — To push a new DB to device: `adb shell "run-as com.tudominio.app rm /data/data/com.tudominio.app/files/ExpoLite/iglesia_digital.db"` then re-launch.

## DB File Location

- Shipped in: `AppMovil/assets/iglesia_digital.db`
- Root copy: `~/Documentos/bible-app/iglesia_digital.db`
- On device: `ExpoLite/iglesia_digital.db` in app's data directory
- Copied via `expo-sqlite`'s `assetSource` on first launch
