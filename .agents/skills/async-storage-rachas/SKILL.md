---
name: async-storage-rachas
description: AsyncStorage keys and streak system for Iglesia Digital. Covers the exact keys used for rosario streaks, the YYYY-MM-DD date format, how the streak integrates with the Home screen, and rules for adding new streak types. Use when working with streaks, the Rosario completion flow, or the Home screen.
---

# async-storage-rachas — Ignacio Digital Streak System

## Current State

The streak system is **partially implemented**:
- **Writing:** `racha_rosario_ultima` is saved when the Rosario is completed
- **Reading:** Home screen uses **hardcoded placeholders** — no real streak calculation exists

## AsyncStorage Keys

| Key | Type | Set in | Description |
|---|---|---|---|
| `racha_rosario_ultima` | `string` (YYYY-MM-DD) | `rosario/guia.tsx:278` | Last date the Rosary was completed |

## Rosario Streak Writing (`rosario/guia.tsx`)

```typescript
useEffect(() => {
  if (step.id === "completado" && !completado) {
    setCompletado(true);
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    AsyncStorage.setItem("racha_rosario_ultima", fecha).catch(() => {});
  }
}, [step.id, completado]);
```

### Critical Details
- **Date format:** `YYYY-MM-DD` (JavaScript locale-safe, manually constructed)
- **Trigger:** When the last step (`"completado"`) becomes active
- **Guard:** Uses `completado` ref to prevent double-writes
- **Error handling:** Silent `.catch(() => {})`
- **Dependency:** `@react-native-async-storage/async-storage: 2.2.0`

## Home Screen Streak Display (`(tabs)/index.tsx`)

Currently shows **hardcoded placeholders**:
```typescript
<Text style={styles.streakText}>🔥 5 días</Text>   // CERCA DE DIOS (Bible)
<Text style={styles.streakText}>🔥 2 días</Text>    // RACHA ROSARIO
```

These need to be replaced with real `AsyncStorage.getItem("racha_rosario_ultima")` calls.

## Streak Calculation Logic (Not Yet Implemented)

When implementing the real streak display, follow this pattern:

```typescript
async function calcularRacha(key: string): Promise<number> {
  const ultima = await AsyncStorage.getItem(key);
  if (!ultima) return 0;

  const ultimaFecha = new Date(ultima + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diff = Math.round((hoy.getTime() - ultimaFecha.getTime()) / 86400000);

  if (diff === 0) {
    // Completed today — streak is active but we need consecutive days
    // Check previous days by scanning backwards
    return await contarDiasConsecutivos(key);
  }
  if (diff === 1) {
    // Completed yesterday — still active
    return await contarDiasConsecutivos(key);
  }
  // Streak broken
  return 0;
}
```

## Rules for Adding New Streak Types

1. **Key naming convention:** `racha_{tipo}_ultima` (e.g., `racha_biblia_ultima`)
2. **Date format:** Always `YYYY-MM-DD` (JavaScript `new Date().toISOString().split('T')[0]` or manual construction)
3. **Writing pattern:** Always set in the completion step of the flow, guarded against double-writes
4. **Reading pattern:** Use `useFocusEffect` or `useEffect` on mount to recalculate streaks
5. **No cleanup needed:** Keys persist indefinitely; absence means "never completed"
6. **Integrate with Home:** Add the card following the existing pattern (icon + label + streak badge)

## Current Streak Cards on Home Screen

| Card | Label | Source | Status |
|---|---|---|---|
| Rosario Streak | `RACHA ROSARIO →` | Links to `/(tabs)/rosario/guia` | Write implemented, read hardcoded |
| Bible Streak | `CERCA DE DIOS` | No source yet | Fully hardcoded placeholder |

## Dependency

```json
"@react-native-async-storage/async-storage": "2.2.0"
```

Import: `import AsyncStorage from "@react-native-async-storage/async-storage";`
