# Maestro E2E Tests — Prompt for Antigravity

Copy and paste this into Antigravity Agent mode:

---

Generate Maestro YAML test flows in `maestro/flows/` for the app **Iglesia Digital** (`com.iglesiadigital.app`), an Expo React Native Catholic app.

## Rules
- Use `TapOn` with visible text (no `testID` in the app — use `"La Sagrada Escritura"`, `"YOUCAT"`, etc.)
- `appId: com.iglesiadigital.app`
- All data comes from a shipped SQLite DB — no network calls, so no mocks needed
- 4 screens are in a tab bar (Home, Biblia, Calendario, Oración). Catecismo/Misal sections were removed — no deep links for them
- Screen transitions may be slow on CI — use `waitFor` (10s default)

## Flows to Create

### 1. `home-e2e.yaml` — Home screen smoke
- Launch app → assert greeting visible ("Bendecido día" or "Bendecida tarde/noche")
- Scroll down to see saint card → tap it → assert saint name visible
- Go back

### 2. `biblia-browse.yaml` — Bible navigation
- Tap "Biblia" tab → assert "La Sagrada Escritura" visible
- Scroll to "Nuevo Testamento" pill → tap it → books list filters to NT
- Tap "Mateo" → chapter grid visible → tap "5" → verses load → assert "Bienaventurados" visible
- Long-press any verse → assert heart icon visible (favorite toggle)

### 3. `biblia-search.yaml` — Bible search
- Tap "Biblia" tab → type in search input → submit → results appear
- Tap a result → navigates to that verse in context
- Clear search → back to book list

### 4. `evangelio-daily.yaml` — Daily gospel
- Navigate to `/evangelio` (or tap the hero card on Home) → assert evangelio visible
- Verify reading, psalm, gospel sections are visible

### 6. `rosario.yaml` — Rosary flow
- Tap "ROSARIO" card on Home → rosario guide opens → tap "Empezar" (or equivalent)
- Verify prayer runner loads with first mystery
- Complete a prayer → next step appears

### 7. `favoritos.yaml` — Favorites
- Long-press a Bible verse to favorite it → navigate to `/favoritos`
- Assert favorited verse appears in list
- Remove favorite → assert it disappears

Generate each as a separate YAML file under `maestro/flows/`. Include edge cases for each flow (empty states, loading indicators, long texts).
