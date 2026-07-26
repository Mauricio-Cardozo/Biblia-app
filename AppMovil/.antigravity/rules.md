# Iglesia Digital — Maestro E2E Testing

## App Info
- **appId**: com.iglesiadigital.app
- **Nav**: Expo Router (file-based). Main screens are `(tabs)` group with floating tab bar.
- **Tab bar**: 4 visible tabs → Home (index), Biblia, Calendario, Oración. Catecismo and Misal are hidden (href: null, accessible via deep links).

## Routes
- `/(tabs)/index` → Home (Liturgia del día, streaks, santo, propio)
- `/(tabs)/biblia` → Bible (book list → chapters → verses + search)
- `/calendario` → Calendar
- `/oracion` → Prayer list → `/oraciones/[id]` detail
- `/evangelio?fecha=YYYY-MM-DD` → Gospel of the day
- `/rosario/guia` → Rosary guide
- `/rosario/coronilla` → Divine Mercy chaplet
- `/santo/[id]` → Saint detail
- `/misal/propio` → Proper of Time → `/misal/propio/[id]`
- `/misal/ordinario` → Ordinary → `/misal/ordinario/[id]`
- `/misal/prefacios` → Prefaces → `/misal/prefacios/[id]`
- `/misal/plegarias` → Eucharistic Prayers → `/misal/plegarias/[id]`
- `/catecismo` → YOUCAT
- `/favoritos` → Favorites
- `/test` → Debug screen

## Element Targeting
No `testID` / `accessibilityLabel` props currently. Maestro should use text-based selectors (TapOn "text"). The app uses `ThemedText` for all visible labels.

## DB
SQLite database `iglesia_digital.db` in assets. Pre-populated with Bible, YOUCAT, readings, saints, misal. All data fits in memory (no pagination).

## Testing Style
- Prefer `TapOn` with visible text
- Use `scrollUntilVisible` for scroll-based navigation
- `assertVisible` for state verification
- Use `runFlow` for shared setup (e.g., launch app, reset state)
