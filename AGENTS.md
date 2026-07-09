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
- **Stack**: Expo SDK 56 / RN 0.85.3 / TS 5.9 / Fabric (`newArchEnabled: true`) / React Compiler (`experiments.reactCompiler: true`) / `edgeToEdgeEnabled` on Android.
- **Routing**: expo-router 6 file-based. `app/_layout.tsx` = root layout (SQLiteProvider + DatabaseInit + FontSizeProvider + BibliaVersionProvider + Stack). `app/(tabs)/_layout.tsx` = JS tab navigator (Home/Biblia/Catecismo/Misal/Oración). Routes inside `(tabs)` get the tab bar; routes outside (`evangelio.tsx`, `calendario.tsx`, `rosario/`, `oraciones/`, `favoritos.tsx`, `modal.tsx`, `test.tsx`, `misal/`) don't.
- **DB**: Single `iglesia_digital.db` shipped in `AppMovil/assets/`, copied via `SQLiteProvider databaseName assetSource` with `useSuspense`. `metro.config.js` adds `db` to `assetExts` so Metro resolves `.db` files.
- **DB Migrations**: `db/init.ts` uses `PRAGMA user_version`. Runs on every app launch. `CURRENT_VERSION = 5`. V1 recreates FTS tables as standalone (drops triggers, re-inserts data). V2 adds `youcat.parte` column (no-op since youcat dropped). V3 creates `novenas` + `novena_dias` tables. V4 drops YOUCAT tables. V5 creates `misal_propio`, `misal_ordinario`, `misal_prefacios`, `misal_plegarias` tables. FTS creation is skipped if source columns are missing; use the "Rebuild FTS" button on `/test` to retry.
- **DB API** (v16 `expo-sqlite`): `db.getAllAsync<T>`, `db.getFirstAsync<T>`, `db.runAsync`. FTS5 join: `JOIN table_fts f ON source.rowid = f.rowid WHERE table_fts MATCH ? ORDER BY f.rank` (⚠️ use `rowid`, NOT `id`). `GROUP BY ... ORDER BY MIN(id)` for dedup. `forceReCopy()` in `db/init.ts` uses `expo-file-system` File/Paths API (NOT raw `documentDirectory` strings). `getMisalPropioPorSemana()` matches liturgical day to misal_propio by season + week number + isSunday.
- **Color palette**: `import { C } from '@/constants/theme'`. `C.*` = Navy/Gold (`#0D1B2A` / `#C9A84C`) — use for all UI. `Fonts` and `Colors` were removed (no theme toggle, fixed palette).
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
| `lecturas` | Daily readings | `fecha` (UNIQUE), `titulo_misa`, `primera_lectura_ref`, `primera_lectura`, `salmo`, `aleluia`, `evangelio_ref`, `evangelio`, `comentario_papal`, `url` |
| `misal_propio` | Proper of Time | `id`, `temporada`, `temporada_label`, `dia`, `colecta`, `oracion_ofrendas`, `postcomunion`, `prefacio`, `antifona_entrada`, `antifona_comunion` |
| `misal_ordinario` | Ordinary of Mass | `id`, `seccion`, `subseccion`, `rol`, `texto`, `orden` |
| `misal_prefacios` | Prefaces | `id`, `titulo`, `texto` |
| `misal_plegarias` | Eucharistic Prayers | `id`, `nombre`, `texto` |
| `novenas` | Novenas list | `id`, `titulo`, `url` |
| `novena_dias` | Novena day prayers | `id`, `novena_id`, `dia`, `titulo`, `texto` |

## Notable Gaps & Known Issues

### Bugs
- ~~`data/prayers.ts` — `T.letanias` uses literal `\n`~~ ✅ fixed (template literal)
- ~~`app/favoritos.tsx` — navigation to `/evangelio` doesn't pass `?fecha=YYYY-MM-DD`~~ ✅ fixed
- ~~`misal/ordinario/[id].tsx`, `misal/prefacios/[id].tsx`, `misal/plegarias/[id].tsx` — `find()` client-side~~ ✅ fixed (direct `WHERE id = ?`)
- ~~`app/_layout.tsx` — hardcoded `"#D4AF37"`~~ ✅ fixed (`C.gold`)
- ~~`evangelio.tsx` — `catch` uses `any` type~~ ✅ fixed (`instanceof Error`)

### Dead Code
- ~~`app/modal.tsx`~~ ✅ removed
- ~~`components/ui/collapsible.tsx`~~ ✅ removed
- ~~`db/init.ts` — `hasColumn` function~~ ✅ removed
- ~~`hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `hooks/use-theme-color.ts`~~ ✅ removed (no consumers)
- ~~`assets/images/react-logo*`, `assets/images/partial-react-logo.png`, `assets/screenshots/`~~ ✅ removed (template/legacy)
- ~~`constants/theme.ts` — `Colors`, `Fonts` exports~~ ✅ removed (app has fixed palette)
- ~~`types/index.ts` — `CICSearchResult`, `FTS5Query`~~ ✅ removed (unused)
- ~~`db/db.ts` — `getMisalOrdinario` export~~ ✅ removed (unused)
- ~~`db/init.ts` — `areFTSReady`, `logTables` exports~~ ✅ removed (internal only)
- `data/notifications.ts` — 4-line stub, all functions are no-ops (intentional for v1.0).

### Design System
- **Spacing/radius tokens** — `constants/spacing.ts` (S.*) y `constants/radius.ts` (R.*) creados y refactorizados en ~25 archivos (Home, Biblia, Catecismo, Misal, Oración, componentes). `borderRadius: 12` aparece aún en algunos archivos menores.
- **`themed-text.tsx` simplified** — `type` prop (5 variants), `lightColor`/`darkColor` props, `useThemeColor` dependency, y hardcoded `#0a7ea4` link color removed.
- **`themed-view.tsx` simplified** — removed `lightColor`/`darkColor`/`useThemeColor`. Now a plain `<View style={style}>`.
- **Header pattern duplicated** — `borderBottomWidth: 1, borderBottomColor: C.goldDim, backgroundColor: C.navyMid` repeated across 10+ screens instead of using `ScreenHeader`.

### Architecture
- ~~**`formatoFecha` / `hoy()` duplicated**~~ ✅ extracted to `utils/date.ts`
- ~~**Season emoji map + season/day detection helpers**~~ ✅ extracted to `utils/seasons.ts`
- ~~**Reading section layout duplicated**~~ ✅ extracted to `components/reading-section.tsx`
- ~~**`getLecturaDelDia` misplaced**~~ ✅ moved to `// LECTURAS` block
- ~~**`Lectura` type incomplete**~~ ✅ completed (`comentario_papal`, `url`, `creado_en`)
- ~~**Missing `.catch()` on DB calls**~~ ✅ added to all 8 affected screens
- **`db/init.ts`** — version gap (v2 no-op skipped without comment); ~~version advances even on migration failure (no rollback)~~ ✅ fixed (`setVersion` inside try/catch in v1, v3, v4, v5).

### Scrapers (`archive/`)
- 6 Python scrapers: `popular_cic.py`, `scraper_cic.py`, `scraper_vaticano.py` (writes directly to AppMovil/assets/iglesia_digital.db), `scraper_misal.py`, `scraper_novenas.py`, `scraper_oraciones_vatican.py`.
- `scraper_novenas.py` requires explicit `--db` flag (no default guardrail).
- `scraper_oraciones_vatican.py` outputs to stdout only (not integrated with DB).
- `scraper_cic.py`/`scraper_misal.py` require `pdfplumber` (documented).
- `youcat.pdf` + `catecismoDeLaIglesia.pdf` are source PDFs for scrapers — keep.
- `misal_pdfs/` contains 17 source PDFs for `scraper_misal.py`.
- `biblia_pueblo_dios.db` is the pre-scraper legacy Bible DB — keep for reference.
- All pipeline artifacts (10+ files targeting intermediate DBs, youcat files) deleted.

### Tests
```bash
npm test                    # jest (23 tests, 4 suites)
```
- **Setup**: Jest + ts-jest, `jest.config.js` + `tsconfig.test.json` (extends base, adds `"types": ["jest"]`).
- **`__tests__/date.test.ts`** — `formatoFecha`, `fechaActualLarga`, `hoy` (5 tests).
- **`__tests__/seasons.test.ts`** — `romanToInt`, `detectSeason`, `parseWeekNumber`, `isSunday` (12 tests).
- **`__tests__/streaks.test.ts`** — `calcularRacha`, `obtenerStats` with mocked AsyncStorage (4 tests).
- **`__tests__/favoritos.test.ts`** — `addFavorito`, `removeFavorito`, `isFavorito`, `getFavoritos` with mocked AsyncStorage (4 tests).
- **Mock pattern**: Inline `jest.mock` with `mockStore` object; `beforeEach` clears store.
- DB queries verified via `sqlite` MCP tools directly against the asset DB.
- DB health: 9 tables, 35,852 Bible verses, 109 readings, 2,865 CIC numerals, 157 misal propios. FTS5 not pre-built (created on launch via migration v1).

## Other
- `app/evangelio.tsx` — fully working, accepts `?fecha=YYYY-MM-DD`. Uses `getLecturaDelDia`.
- Streak cards on Home (`🔥 N días`) — real data from `data/streaks.ts` via AsyncStorage (`racha_rosario_ultima`, `racha_coronilla_ultima`). `calcularRacha()` counts consecutive days backwards.
- No pagination on list screens — all data fits in memory.
- **FTS5 en misal**: 4 virtual tables (`misal_propio_fts`, `misal_ordinario_fts`, `misal_prefacios_fts`, `misal_plegarias_fts`) creadas en `ensureFTS()` en `init.ts`. Buscables via `searchMisal()` en `db/db.ts` que devuelve resultados unificados con `tabla`, `id`, `titulo`, `preview`.
- No FTS on misal tables yet — not needed for current UX.
- Novenas: 18 scraped from `devocionario.com` (single-page format); ~28 more exist on devocionario.com with multi-page or numeric-day format — not yet scraped.
- CIC `capitulo`/`articulo` populated (2359/2865 caps, 1964/2865 arts) via `archive/popular_cic.py`. Asset DB has no FTS triggers (dropped before UPDATE; app recreates them on first launch via migration v1).
- FTS on `catecismo_cic` is created by migration v1 at app launch — the asset DB does NOT include the `catecismo_cic_fts` table (it's created on first run).
- Lecturas coverage: current data through 2026-09-02 (via Vatican scraper). Run `python3 archive/scraper_vaticano.py` to extend.

## Floating Tab Bar

- `components/ui/floating-tab-bar.tsx` — absolute-positioned bottom bar with SF Symbols (iOS) / MaterialIcons (Android).
- 4 visible tabs (index, biblia, calendario, oracion). Catecismo and Misal are hidden (`href: null`).
- **Scroll-to-hide**: On scroll > 50px down, the bar slides down out of view via `translateY`. On scroll up, it reappears.
- Scroll position shared across screens via `utils/scroll-state.ts` (module-level `Animated.Value`). Each screen writes to it via `Animated.event` or `tabBarScrollY.setValue()`.
- ⚠️ `Animated.event` with `useNativeDriver: true` returns an object, not a function, on RN 0.85 Fabric. All screens currently use `tabBarScrollY.setValue()` directly to avoid this.

## React Compiler Violations

The project has `experiments.reactCompiler: true` in app.json. `npm run lint` reports 27 errors:

| Error | Files affected | Fix |
|-------|---------------|-----|
| `Cannot access refs during render` | `biblia.tsx`, `floating-tab-bar.tsx`, `list-item-card.tsx` | Access `.current` only in handlers, not render body |
| `Calling setState() within an effect` | 10+ screens (biblia, calendario, catecismo, evangelio, favoritos, misal, novenas) | Inline async in useEffect instead of useCallback→useEffect→setState |
| `Cannot call impure function during render` | `catecismo.tsx`, `evangelio.tsx` (Date.now()) | Use `useRef(Date.now())` for stable value |

See GitHub issues #1, #2, #3.

## GitHub Issues

18 issues created at https://github.com/Mauricio-Cardozo/Biblia-app/issues:

| # | Title | Type |
|---|-------|------|
| 1 | React Compiler: useRef().current en render | Bug |
| 2 | React Compiler: setState en useEffect | Bug |
| 3 | React Compiler: Date.now() en render | Bug |
| 4 | Lint warnings: imports, missing deps | Chore |
| 5 | Migrar headers a ScreenHeader | Design |
| 6 | Completar tokens S/R | Design |
| 7 | CIC metadata faltante | Content |
| 8 | Automatizar scraper lecturas | Content |
| 9 | db/init.ts docs + rollback | Chore |
| 10 | notifications.ts stub | Chore |
| 11 | FTS5 en tablas misal | Feature |
| 12 | Scrape 28 novenas | Content |
| 13 | Licencia y copyright de textos | Legal |
| 14 | Accesibilidad (VoiceOver/TalkBack) | Feature |
| 15 | Tests y CI pipeline | CI |
| 16 | Compartir versículos | Feature |
| 17 | README desactualizado | Docs |
| 18 | Export/import AsyncStorage | Feature |

## Key Components

- **ScreenHeader** (`components/ui/screen-header.tsx`) — reusable header with back button (36px circle), superLabel, title, subtitle, rightSlot.
- **ListItemCard** (`components/ui/list-item-card.tsx`) — card with gold badge, press scale animation (0.97), chevron, subtitle.
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
| `data/jaculatorias.ts` | Jaculatorias grouped by section (Jesús, Espíritu Santo, María, José, etc.) |
| `data/vatican-prayers.ts` | 23 prayers from Vatican News (Angelus, Magnificat, Te Deum, etc.) |

## Android Quirks

- `MIN(id)` inside `GROUP BY` can return wrong ordering on Android. Prefer `MIN(ROWID)` or `ORDER BY MIN(id)`.
- DB replacement: `adb shell "run-as com.iglesiadigital.app rm /data/data/com.iglesiadigital.app/files/ExpoLite/iglesia_digital.db"` then re-launch. Or use the "Expandir DB" button on `/test` screen.
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

- `app.json`: `android.package = "com.iglesiadigital.app"`, `versionCode = 1`.
- `eas.json`: created at `AppMovil/eas.json` with `preview` (APK) and `production` (AAB) profiles.

## Python Scrapers (`archive/`)

```bash
python3 archive/scraper_vaticano.py                    # current + next month (no deps) — writes to AppMovil/assets/iglesia_digital.db
python3 archive/scraper_vaticano.py --fecha 2026-06-12 # single date
pip install pdfplumber --break-system-packages          # only for scraper_cic.py / scraper_misal.py
python3 archive/scraper_misal.py --preview           # Misal Romano: 157 propios, 202 ordinario, 67 prefacios, 4 plegarias
python3 archive/scraper_misal.py                     # write to AppMovil/assets/iglesia_digital.db
python3 archive/popular_cic.py                       # extract capitulo/articulo from CIC text markers
python3 archive/scraper_oraciones_vatican.py            # fetch 23 prayers from Vatican News → stdout JSON
python3 archive/scraper_novenas.py --preview            # scrape novenas from devocionario.com, show JSON preview
python3 archive/scraper_novenas.py --db path/to/db.db   # write novenas to existing DB
```

Vatican scraper: 0.5s sleep between requests, parses 5 HTML `<h2>` sections. Default range = 15d before current month → end of next month. Writes directly to `AppMovil/assets/iglesia_digital.db`.

**Misal Romano scraper** (17 PDFs from LiturgiaPapal México):
```bash
python3 archive/scraper_misal.py --preview   # print summary (157 propios, 202 ordinario, 67 prefacios, 4 plegarias)
python3 archive/scraper_misal.py             # write to AppMovil/assets/iglesia_digital.db
```
Key patterns: `RE_DAY_LINE = r'^(DÍA\s+|Domingo|Feria|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Inicio|Octava|I\d+)'`, roman numeral parsing with `[IVXLCDM]{1,6}`. Navidad uses special `parse_propio_navidad()` for date/feast format. Triduo Pascual excluded (ordinario-style rubrics). Dedup removes duplicate Easter Sunday entries and trailing periods.

**CIC capítulo/artículo populator** (extracts from text markers):
```bash
python3 archive/popular_cic.py   # 2359/2865 capitulos, 1964/2865 articulos populated
```
Key patterns: `CAP_PAT` / `ART_PAT` regexes scanning full text, `clean_title()` for trailing chars. Drops FTS triggers before UPDATE (recreated by app migration v1 on launch). Resets at part/section boundaries.

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
