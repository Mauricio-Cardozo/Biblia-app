# Iglesia Digital — Project Guide

## Commands

```bash
# Dev (workdir: AppMovil/)
npm start                   # expo start
npm run android             # expo start --android
npm run ios                 # expo start --ios
npm run web                 # expo start --web
npm run lint                # expo lint (flat config, eslint-config-expo)
npx expo start -c           # clear Metro cache + start
```

No tsc/typecheck command available — `npm run lint` is the only static check.

## Architecture

- **Entrypoint**: `expo-router/entry` (in `package.json` `main` field). Routes in `app/`.
- **Stack**: Expo SDK 54 / RN 0.81.5 / TS 5.9 / Fabric (`newArchEnabled: true`) / React Compiler (`experiments.reactCompiler: true`) / `edgeToEdgeEnabled` on Android.
- **Routing**: expo-router 6 file-based. `app/_layout.tsx` = root layout (SQLiteProvider + DatabaseInit + FontSizeProvider + BibliaVersionProvider + Stack). `app/(tabs)/_layout.tsx` = JS tab navigator (Home/Biblia/Catecismo/YOUCAT/Oración). Routes inside `(tabs)` get the tab bar; routes outside (`evangelio.tsx`, `calendario.tsx`, `rosario/`, `oraciones/`, `favoritos.tsx`, `modal.tsx`, `test.tsx`) don't.
- **DB**: Single `iglesia_digital.db` shipped in `AppMovil/assets/`, copied via `SQLiteProvider databaseName assetSource` with `useSuspense`. `metro.config.js` adds `db` to `assetExts` so Metro resolves `.db` files.
- **DB Migrations**: `db/init.ts` uses `PRAGMA user_version`. Runs on every app launch. `CURRENT_VERSION = 3`. V1 recreates FTS tables as standalone (drops triggers, re-inserts data). V2 adds `youcat.parte` column. V3 creates `novenas` + `novena_dias` tables. FTS creation is skipped if source columns are missing; use the "Rebuild FTS" button on `/test` to retry.
- **DB API** (v16 `expo-sqlite`): `db.getAllAsync<T>`, `db.getFirstAsync<T>`, `db.runAsync`. FTS5 join: `JOIN table_fts f ON source.rowid = f.rowid WHERE table_fts MATCH ? ORDER BY f.rank` (⚠️ use `rowid`, NOT `id`). `GROUP BY ... ORDER BY MIN(id)` for dedup. `forceReCopy()` in `db/init.ts` uses `expo-file-system` File/Paths API (NOT raw `documentDirectory` strings).
- **Color palette**: `import { C, Colors, Fonts } from '@/constants/theme'`. `C.*` = Navy/Gold (`#0D1B2A` / `#C9A84C`) — use for all UI. `Colors` = Expo light/dark defaults — only used for tab tint in `(tabs)/_layout.tsx`. `Fonts` = platform-aware font families (`.serif`, `.sans`, `.rounded`, `.mono`).
- **Icons**: Dual-platform files. `components/ui/icon-symbol.ios.tsx` (SF Symbols via `expo-symbols`), `components/ui/icon-symbol.tsx` (MaterialIcons fallback for Android/web). Both export `IconSymbol({ name, size, color })`. SF→Material mapping dict in `icon-symbol.tsx`.
- **State**: No state management lib. `useState`/`useCallback` + `useSQLiteContext()` for DB access. FontSizeContext and BibliaVersionContext for global UI state.
- **TS path alias**: `@/` → `AppMovil/` (e.g. `@/db/db`, `@/constants/theme`).
- **Haptics**: `process.env.EXPO_OS === 'ios'` check (not `Platform.OS`) in `haptic-tab.tsx`.

## Coding Conventions

These reflect actual codebase patterns, not aspirational rules:

- Lists → `FlashList` from `@shopify/flash-list`. `ScrollView` is used for page layouts (Home, Rosario, Catecismo detalle, Oraciones), not for data lists.
- `TouchableOpacity` is the default pressable component used throughout. `Pressable` is not used. `HapticTab` wraps `PlatformPressable` for tab bar buttons.
- `SafeAreaView` is used sparingly (`biblia.tsx`), but `useSafeAreaInsets()` on a plain `View` is more common.
- Images → `expo-image` (not RN `Image`).
- Platform padding: `Platform.OS === "android"` checks in headers for status bar insets.
- SQL fetch patterns: `useCallback` wrappers around async DB functions, called from `useEffect` or inline handlers. Loading/error states managed per-component.

## DB Schema (condensed)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `biblia_pueblo_dios` | Bible verses | `id`, `libro`, `capitulo`, `versiculo`, `texto`, `testamento` |
| `catecismo_cic` | CIC | `id` (numeral), `parte`, `seccion`, `capitulo`, `articulo`, `texto` |
| `youcat` | YOUCAT Q&A | `id`, `pregunta_nro`, `pregunta_texto`, `respuesta_texto`, `parte`, `capitulo` |
| `lecturas` | Daily readings | `fecha` (UNIQUE), `titulo_misa`, `primera_lectura`, `salmo`, `aleluia`, `evangelio` |
| `youcat_fts` / `catecismo_cic_fts` | FTS5 virtual (standalone) | mirrors source columns |
| `novenas` | Novenas list | `id`, `titulo`, `url` |
| `novena_dias` | Novena day prayers | `id`, `novena_id`, `dia`, `titulo`, `texto` |

## Notable Gaps

- `app/evangelio.tsx` — fully working, accepts `?fecha=YYYY-MM-DD`. Uses `getLecturaDelDia`.
- Streak cards on Home (`🔥 N días`) — real data from `data/streaks.ts` via AsyncStorage (`racha_rosario_ultima`, `racha_coronilla_ultima`). `calcularRacha()` counts consecutive days backwards.
- No pagination on list screens — all data fits in memory.
- `youcat_ai/ad/au` and `catecismo_cic_ai/ad/au` triggers exist in older DB copies but are dropped by migration v1.
- `expo-notifications` uses lazy `import()` via `getNotifications()` helper — gracefully no-ops in Expo Go where the native module is unavailable.
- Novenas: 18 scraped from `devocionario.com` (single-page format); ~28 more exist on devocionario.com with multi-page or numeric-day format — not yet scraped.

## Key Components

- **PrayerRunner** (`components/prayer-runner.tsx`) — generic component for counted prayers (rosario, coronilla). Accepts `pasos`, `storageKey`, `title`, `onBack`. Has beads display, FadeIn/FadeOut animations, AsyncStorage persistence.
- **FavBtn** (`components/fav-btn.tsx`) — heart toggle for favorites. Uses `data/favoritos.ts` (AsyncStorage CRUD).
- **FontSizeControl** (`components/font-size-control.tsx`) — A-/A+ buttons. Uses `contexts/font-size.tsx`.
- **FontSizeContext** (`contexts/font-size.tsx`) — multiplier state (0.8–1.5, step 0.1). Persisted to AsyncStorage. Wrapped in root `_layout.tsx`.
- **BibliaVersionContext** (`contexts/bible-version.tsx`) — which translation is active. Currently only `biblia_pueblo_dios`.

## Data Files

| File | Content |
|------|---------|
| `data/prayers.ts` | Shared prayer texts (Padrenuestro, Avemaría, Gloria, Credo, Salve, Letanías, etc.) |
| `data/rosario-steps.ts` | `generarPasosRosario()` with mysteries by day of week |
| `data/coronilla-steps.ts` | `generarPasosCoronilla()` — Divine Mercy chaplet |
| `data/streaks.ts` | `calcularRacha(key)`, `obtenerStats()` — streak calculation |
| `data/favoritos.ts` | `addFavorito`, `removeFavorito`, `isFavorito`, `getFavoritos` — CRUD via AsyncStorage |
| `data/notifications.ts` | `setupNotifications()`, `isEnabled()`, `setEnabled()` — daily at 20:00. Uses lazy `import("expo-notifications")` to avoid crash in Expo Go. |
| `data/jaculatorias.ts` | Jaculatorias grouped by section (Jesús, Espíritu Santo, María, José, etc.) |
| `data/vatican-prayers.ts` | 23 prayers from Vatican News (Angelus, Magnificat, Te Deum, etc.) |

## Android Quirks

- `MIN(id)` inside `GROUP BY` can return wrong ordering on Android. Prefer `MIN(ROWID)` or `ORDER BY MIN(pregunta_nro)` (as in `getYoucatPartes`).
- DB replacement: `adb shell "run-as com.tudominio.app rm /data/data/com.tudominio.app/files/ExpoLite/iglesia_digital.db"` then re-launch. Or use the "Expandir DB" button on `/test` screen.
- WAL/SHM files must be deleted too — see `forceReCopy()` in `db/init.ts`.

## Debug Screens

- `/test` — DB diagnosis, FTS5 search test, "Rebuild FTS" button, "Expandir DB" (deletes + recopies from assets). Route: `app/test.tsx` (no tab bar, accessible from Home link).

## Build (APK)

```bash
# First time: install EAS CLI + log in
npm install -g eas-cli
eas login

# Build APK
eas build --platform android --profile preview

# Build AAB (Play Store)
eas build --platform android --profile production

# Or use Expo Application Services dashboard
```

- `app.json`: `android.package = "com.iglesiadigital.app"`, `versionCode = 1`, plugin `expo-notifications` added.
- `eas.json`: created at `AppMovil/eas.json` with `preview` (APK) and `production` (AAB) profiles.
- Notifications require a dev build — they don't work in Expo Go (SDK 53+ removed support).

## Python Scrapers (`archive/`)

```bash
python3 archive/scraper_vaticano.py                    # current + next month (no deps)
python3 archive/scraper_vaticano.py --fecha 2026-06-12 # single date
pip install pdfplumber --break-system-packages          # only for scraper_cic.py / scraper_youcat.py
python3 archive/scraper_oraciones_vatican.py            # fetch 23 prayers from Vatican News → stdout JSON
python3 archive/scraper_novenas.py --preview            # scrape novenas from devocionario.com, show JSON preview
python3 archive/scraper_novenas.py --db path/to/db.db   # write novenas to existing DB
```

Vatican scraper: 0.5s sleep between requests, parses 5 HTML `<h2>` sections. Default range = 15d before current month → end of next month.

**YOUCAT scraper** (3-phase: extract → clean → parse):
```bash
python3 archive/scraper_youcat.py extract   # raw text → paginas_raw.json
python3 archive/scraper_youcat.py clean     # column split (disabled, uses raw text)
python3 archive/scraper_youcat.py parse --preview  # detect questions, preview
python3 archive/scraper_youcat.py parse --db       # write youcat + FTS to AppMovil/assets/iglesia_digital.db
```

Key patterns: `RE_SIMPLE = r'(?<!\d)(\d{1,3})\s+(¿)'` finds 524/527 questions. 6 premise questions use per-number fallback regex. `limpiar_sidebar()` strips author names/Latin/date patterns. `limpiar_texto()` collapses whitespace, removes `[\d,\-\[\]]` markers. Index cutoff at `Índice temático`. Part/chapter via reversed-position search. 527/527 questions parsed; 3 duplicates (Q27, Q92, Q152) deduped (keep first).

**Novenas scraper** (single-page novenas from devocionario.com):
```bash
python3 archive/scraper_novenas.py --preview        # scrape all + print JSON summary
python3 archive/scraper_novenas.py --db assets/db.db  # write to DB
```

- 46 novenas in source list; 18 successfully parsed (single-page with `DÍA PRIMERO`–`DÍA NOVENO` headers).
- 28 novenas failed — 404 URLs or different day format (`Día 1`, multi-page layout).
- Source: `devocionario.com` (stable static HTML; MDC/Misioneros Digitales returned HTTP 522).
- Parser splits on `<br><strong>DÍA` patterns, limits to 9 days, strips footer noise.
- Uses `requests` + `BeautifulSoup` (no extra deps beyond what's already installed).

## Installed Agent Skills (`.agents/skills/`)

- `iglesia-digital-context` — full DB schema, palette, code rules, known issues
- `expo-sqlite-fts5` — Android SQLite quirks, FTS5 patterns, migration guide
- `scraper-vaticano` — Vatican News HTML structure, parser details
- `async-storage-rachas` — streak key names, date format, integration points
- `liturgia-calendario` — rosary mysteries by day, liturgical colors, Gospel date logic
- `diagnose` — disciplined debug loop for hard bugs
- `tdd` — red-green-refactor workflow
- `vercel-react-native-skills` — RN/Expo performance best practices
- `redesign-existing-projects` / `sleek-design-mobile-apps` — UI design upgrade guides
- `expo-ui` (`expo/skills@expo-ui`) — Official Expo UI patterns
- `expo-react-native-performance` (`pproenca/dot-skills`) — RN/Expo performance optimization
- `supabase-postgres-best-practices` (`supabase/agent-skills`) — SQL optimization (applies to SQLite)
