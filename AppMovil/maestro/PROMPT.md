# Maestro E2E Tests — Prompt for Antigravity

Copy and paste this into Antigravity Agent mode:

---

Generate Maestro YAML test flows in `maestro/flows/` for the app **Iglesia Digital** (`com.iglesiadigital.app`), an Expo React Native Catholic app.

## Rules
- Use `TapOn` with visible text (no `testID` in the app — use `"La Sagrada Escritura"`, `"YOUCAT"`, etc.)
- `appId: com.iglesiadigital.app`
- All data comes from a shipped SQLite DB — no network calls, so no mocks needed
- 4 screens are in a tab bar (Home, Biblia, Calendario, Oración). Catecismo/Misal have no tab — navigate via deep links
- Screen transitions may be slow on CI — use `waitFor` (10s default)

## Flows to Create

### 1. `home-e2e.yaml` — Home screen smoke
- Launch app → assert greeting visible ("Bendecido día" or "Bendecida tarde/noche")
- Scroll down to see saint card → tap it → assert saint name visible
- Go back → scroll to "PROPIO DEL TIEMPO" card → tap → assert tiempo name visible

### 2. `biblia-browse.yaml` — Bible navigation
- Tap "Biblia" tab → assert "La Sagrada Escritura" visible
- Scroll to "Nuevo Testamento" pill → tap it → books list filters to NT
- Tap "Mateo" → chapter grid visible → tap "5" → verses load → assert "Bienaventurados" visible
- Long-press any verse → assert heart icon visible (favorite toggle)

### 3. `biblia-search.yaml` — Bible search
- Tap "Biblia" tab → type in search input → submit → results appear
- Tap a result → navigates to that verse in context
- Clear search → back to book list

### 4. `catecismo-browse.yaml` — YOUCAT
- Navigate to `/catecismo` → assert "YOUCAT" visible
- Tap first parte → questions list loads → assert first question visible
- Tap first question → detail opens (pregunta, respuesta, comentario)
- Tap back → back to questions list
- Tap back → back to partes list

### 5. `evangelio-daily.yaml` — Daily gospel
- Navigate to `/evangelio` (or tap the hero card on Home) → assert evangelio visible
- Verify reading, psalm, gospel sections are visible

### 6. `rosario.yaml` — Rosary flow
- Tap "ROSARIO" card on Home → rosario guide opens → tap "Empezar" (or equivalent)
- Verify prayer runner loads with first mystery
- Complete a prayer → next step appears

### 7. `misal-propio.yaml` — Proper of Mass
- Navigate to `/misal/propio` → assert temporadas list visible
- Tap first temporada → proper entries visible
- Tap first entry → proper detail with colecta visible

### 8. `favoritos.yaml` — Favorites
- Long-press a Bible verse to favorite it → navigate to `/favoritos`
- Assert favorited verse appears in list
- Remove favorite → assert it disappears

Generate each as a separate YAML file under `maestro/flows/`. Include edge cases for each flow (empty states, loading indicators, long texts).
