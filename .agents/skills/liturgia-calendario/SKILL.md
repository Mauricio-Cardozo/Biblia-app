---
name: liturgia-calendario
description: Liturgical calendar logic for Iglesia Digital — rosary mysteries by day of week, liturgical colors, and the planned Hoy/Mañana system for the Gospel screen. Use when implementing the evangelio screen, the date-based mystery picker, or any liturgical date logic.
---

# liturgia-calendario — Liturgical Calendar Logic

## Rosary Mysteries by Day of Week

The `getMisteriosDelDia()` function in `rosario/guia.tsx` assigns mysteries based on the current day:

| Day | `getDay()` | Mysteries Set |
|---|---|---|
| Sunday | `0` | **Gloriosos** (Glorious) |
| Monday | `1` | **Gozosos** (Joyful) |
| Tuesday | `2` | **Dolorosos** (Sorrowful) |
| Wednesday | `3` | **Gloriosos** (Glorious) |
| Thursday | `4` | **Luminosos** (Luminous) |
| Friday | `5` | **Dolorosos** (Sorrowful) |
| Saturday | `6` | **Gozosos** (Joyful) |

Traditional Catholic assignment (confirmed by Vatican, post-2002 with Luminous mysteries added by John Paul II).

```typescript
function getMisteriosDelDia(): { nombre: string; misterios: string[] } {
  const dia = new Date().getDay();
  if (dia === 1 || dia === 6)   // Monday or Saturday
    return { nombre: "Gozosos", misterios: MISTERIOS_GOZOSOS };
  if (dia === 2 || dia === 5)   // Tuesday or Friday
    return { nombre: "Dolorosos", misterios: MISTERIOS_DOLOROSOS };
  if (dia === 0 || dia === 3)   // Sunday or Wednesday
    return { nombre: "Gloriosos", misterios: MISTERIOS_GLORIOSOS };
  return { nombre: "Luminosos", misterios: MISTERIOS_LUMINOSOS };  // Thursday
}
```

### Mystery Sets

**Gozosos (Joyful)** — Lunes y Sábado
1. La Encarnación del Hijo de Dios
2. La Visitación de Nuestra Señora a su prima Santa Isabel
3. El Nacimiento del Hijo de Dios
4. La Presentación de Jesús en el templo
5. El Niño Jesús perdido y hallado en el templo

**Dolorosos (Sorrowful)** — Martes y Viernes
1. La Oración de Jesús en el huerto
2. La Flagelación del Señor
3. La Coronación de espinas
4. Jesús con la Cruz a cuestas, camino del Calvario
5. La Crucifixión y Muerte de nuestro Señor

**Gloriosos (Glorious)** — Domingo y Miércoles
1. La Resurrección del Hijo de Dios
2. La Ascensión del Señor a los Cielos
3. La Venida del Espíritu Santo sobre los Apóstoles
4. La Asunción de Nuestra Señora a los Cielos
5. La Coronación de la Santísima Virgen

**Luminosos (Luminous)** — Jueves
1. El Bautismo de Jesús en el Jordán
2. La autorrevelación de Jesús en las bodas de Caná
3. El anuncio del Reino de Dios invitando a la conversión
4. La Transfiguración
5. La Institución de la Eucaristía

## Liturgical Colors

The app's color palette (`C` in `constants/theme.ts`) is Navy/Gold, inspired by liturgical colors:

| Color | Hex | Liturgical Association |
|---|---|---|
| `C.navy` | `#0D1B2A` | Deep blue (Mary, Advent) / Purple (Lent) |
| `C.gold` | `#C9A84C` | Gold (solemnities, Easter, Christmas) |
| `C.goldLight` | `#E8C97A` | Highlight / Gloria |
| `C.text` | `#F0E6CC` | Warm cream (candlelight, parchment) |

The palette is intentionally not tied to a specific liturgical season — it works year-round.

## Planned Hoy/Mañana System (for evangelio.tsx)

The `lecturas` table stores daily readings with a `fecha` column (YYYY-MM-DD). The planned Gospel screen needs:

### Query Pattern for Today's Reading

```typescript
import { useSQLiteContext } from 'expo-sqlite';

async function getLecturaDeHoy(db: SQLiteDatabase): Promise<Lectura | null> {
  const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return db.getFirstAsync<Lectura>(
    "SELECT * FROM lecturas WHERE fecha = ?",
    [hoy]
  );
}
```

### Hoy/Mañana Toggle

```typescript
async function getLectura(fecha: string): Promise<Lectura | null> {
  return db.getFirstAsync<Lectura>(
    "SELECT * FROM lecturas WHERE fecha = ?",
    [fecha]
  );
}

// Usage:
// const hoy = new Date().toISOString().split('T')[0];
// const manana = new Date(Date.now() + 86400000).toISOString().split('T')[0];
```

### What the Gospel Screen Should Display

From the `lecturas` table:
| Field | Display |
|---|---|
| `titulo_misa` | Header: "Evangelio del día" subtitle |
| `evangelio_ref` | Gospel reference (e.g., "Lectura del santo Evangelio según San Juan") |
| `evangelio` | Gospel text (full) |
| `primera_lectura_ref` + `primera_lectura` | Collapsible "Primera Lectura" |
| `salmo` | Collapsible "Salmo Responsorial" |
| `aleluia` | Collapsible "Aleluya" |
| `comentario_papal` | Footer: "Palabras del Papa" |

### UI Pattern

- **Bold** reference as a header
- Body text in `C.text` (warm white) on `C.navy` background
- Collapsible sections using the existing `Collapsible` component
- Readings that haven't been scraped yet should show "Lectura no disponible"
- All dates should be in Spanish format via `Intl.DateTimeFormat('es-ES', { ... })`

## Future Enhancements (Not Yet Needed)

- Computed Easter date (requires algorithm for `luna paschalis`)
- Liturgical seasons (Advent, Lent, Ordinary Time)
- Feast day and saint day calendar
- Proper colors per liturgical season
- Daily Mass propers (opening prayer, offertory, communion antiphons)
